#!/usr/bin/env python3
# ABOUTME: Stage-1 binary aesthetic metrics (still-based) from the critic-rework
# ABOUTME: research — computes per-still/per-piece tests and calibrates on the corpus.
#
# Usage:
#   python3 bin/aesthetic-metrics.py piece <slug>          # metrics for one piece
#   python3 bin/aesthetic-metrics.py calibrate             # whole graded corpus →
#                                                          # learning/calibration-stage1.md
#
# Tests implemented (numbers = research-report markers,
# learning/research-binary-beauty-tests.md):
#   per-still : squint_macro #1 · rms_contrast #12 · warm_arc #10 ·
#               lum_not_hue #11 · no_blowout #14 · one_over_f #5 ·
#               empty_zones #7 · depth_octaves #41 · dominant_hues #15
#   per-piece : arc #38 · hue_drift_smooth #13 · layout_varies #8
#
# All thresholds are CALIBRATION KNOBS (see THRESH) — the research mandates
# setting them from the corpus, not from theory. The defaults encode the
# report's proposed starting values plus the house warm arc.

import json
import math
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

REPO = Path(__file__).resolve().parent.parent

# Thresholds CORPUS-FITTED 2026-06-12 on the 14 positive-tier pieces (p10/p90
# of per-still value distributions, padded) — the research-report theory
# numbers (in trailing comments) mostly did NOT transfer to the house
# near-black glow aesthetic. See learning/calibration-stage1.md §Findings.
THRESH = {
    "rms_contrast_min": 0.03,        # 12 — collapse guard. Theory said 0.15; positive-tier p10 is 0.037
    "squint_region_lo": 0.005,       # 1  — theory 0.05; positive-tier p10 is 0.007
    "squint_region_hi": 0.50,        # 1  — theory 0.30; positive-tier p90 is 0.454
    # Re-fit 2026-06-12 (kinetic-energy-v3 filed trigger + corpus sweep): a
    # single 0.6 light-mask was blind to dim-figure AND inverted (dark-figure-
    # on-light-ground, e.g. ink-bloom) compositions. The squint now tests two
    # squint strengths x both polarities; the piece aggregates at >=75% of
    # core stills (AGG_FRACTION) instead of all-stills. Sweep: 7/13 -> 12/13
    # positives, with the one remaining fail (chamber) a true full-frame-
    # texture fail.
    "squint_mask_levels": (0.45, 0.60),
    "warm_arc_deg": (315.0, 75.0),   # 10 — house warm hues, wrapping through 0°
    "warm_frac_min": 0.90,           # 10 — works as-is; flags sanctioned cold/blue pieces (needs meta exception flag)
    "sat_min": 0.25,                 # hue stats: pixel counts as "colored" above this S
    "val_min": 0.15,                 # ...and above this V (near-black hue is noise)
    "lum_range_min": 0.15,           # 11 — theory 0.50; positive-tier p10 is 0.161
    "hue_spread_max_deg": 25.0,      # 11 — theory 60; house discipline is far tighter (p90 = 16.7)
    "blowout_meanL": 0.70,           # 14 — works as-is (14/14 positives pass)
    "blowout_chrange": 0.10,         # 14
    "one_over_f_band": (-4.5, -2.2), # 5  — theory (-2.6,-1.6); house glow fields sit at p10 -4.3 / p90 -2.4
    "empty_zone_frac": 0.10,         # 7  — DESCRIPTIVE ONLY: positives median 0.9%; verdicts don't gate on this
    "empty_zone_level": 0.10,        # 7
    "depth_octaves_min": 3,          # 41 — works as-is (9/14)
    "band_energy_min": 0.02,         # 41
    "dominant_hue_clusters_max": 3,  # 15 — works as-is (14/14)
    "arc_min_over_max": 0.65,        # 38 — WEAK PROXY (mean-L per still); real arc test needs clip energy (Stage 2)
    "hue_jump_max_deg": 40.0,        # 13 — works as-is (11/14)
    "layout_corr_max": 0.80,         # 8  — works as-is (13/14)
}


def luminance(img):
    a = np.asarray(img.convert("RGB"), dtype=np.float64) / 255.0
    return 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2], a


def hsv_arrays(img):
    h, s, v = [np.asarray(c, dtype=np.float64) for c in img.convert("RGB").convert("HSV").split()]
    return h * (360.0 / 255.0), s / 255.0, v / 255.0


def connected_fraction(mask):
    """Largest 8-connected component as a fraction of the mask's grid (BFS, no scipy)."""
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    best = 0
    for i in range(h):
        for j in range(w):
            if mask[i, j] and not seen[i, j]:
                stack, size = [(i, j)], 0
                seen[i, j] = True
                while stack:
                    y, x = stack.pop()
                    size += 1
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            ny, nx = y + dy, x + dx
                            if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                                seen[ny, nx] = True
                                stack.append((ny, nx))
                best = max(best, size)
    return best / mask.size


def radial_power(L):
    """Radially averaged power spectrum of a Hann-windowed center square crop."""
    n = min(L.shape)
    y0, x0 = (L.shape[0] - n) // 2, (L.shape[1] - n) // 2
    sq = L[y0:y0 + n, x0:x0 + n]
    win = np.outer(np.hanning(n), np.hanning(n))
    F = np.fft.fftshift(np.fft.fft2((sq - sq.mean()) * win))
    P = np.abs(F) ** 2
    yy, xx = np.indices(P.shape)
    r = np.hypot(yy - n / 2, xx - n / 2).astype(int)
    radial = np.bincount(r.ravel(), P.ravel()) / np.maximum(np.bincount(r.ravel()), 1)
    return radial, n


def circular_stats(deg):
    rad = np.deg2rad(deg)
    z = np.exp(1j * rad)
    R = np.abs(z.mean())
    mean = (np.rad2deg(np.angle(z.mean()))) % 360.0
    std = math.degrees(math.sqrt(max(0.0, -2.0 * math.log(max(R, 1e-12)))))
    return mean, std


def in_warm_arc(h):
    lo, hi = THRESH["warm_arc_deg"]
    return (h >= lo) | (h <= hi) if lo > hi else (h >= lo) & (h <= hi)


def still_metrics(path):
    img = Image.open(path)
    L, rgb = luminance(img)
    H, S, V = hsv_arrays(img)
    m = {}

    rms = float(L.std())
    m["rms_contrast"] = {"value": round(rms, 4), "pass": rms >= THRESH["rms_contrast_min"]}

    L32 = np.asarray(img.convert("L").resize((32, 32), Image.LANCZOS), dtype=np.float64) / 255.0
    span = L32.max() - L32.min()
    norm = (L32 - L32.min()) / (span + 1e-9)
    lo, hi = THRESH["squint_region_lo"], THRESH["squint_region_hi"]
    best, ok = 0.0, False
    if span > 1e-3:
        for lv in THRESH["squint_mask_levels"]:
            for mask in (norm > lv, norm < (1.0 - lv)):   # light figure OR dark figure
                frac = connected_fraction(mask)
                if lo <= frac <= hi:
                    ok, best = True, frac
                    break
                best = max(best, frac if frac <= hi else 0.0)
            if ok:
                break
    m["squint_macro"] = {"value": round(best, 4), "pass": bool(ok and rms >= THRESH["rms_contrast_min"])}

    mean_l = float(L.mean())
    chrange = float((rgb.max(axis=2) - rgb.min(axis=2)).mean())
    m["no_blowout"] = {"value": {"mean_l": round(mean_l, 3), "ch_range": round(chrange, 3)},
                       "pass": not (mean_l > THRESH["blowout_meanL"] and chrange < THRESH["blowout_chrange"])}

    p99 = np.percentile(L, 99)
    dark = float((L < THRESH["empty_zone_level"] * max(p99, 1e-6)).mean())
    m["empty_zones"] = {"value": round(dark, 3), "pass": dark >= THRESH["empty_zone_frac"]}

    radial, n = radial_power(L)
    f = np.arange(len(radial))
    band = (f >= 4) & (f <= n // 4) & (radial > 0)
    slope = float(np.polyfit(np.log(f[band]), np.log(radial[band]), 1)[0]) if band.sum() > 8 else 0.0
    lo, hi = THRESH["one_over_f_band"]
    m["one_over_f"] = {"value": round(slope, 3), "pass": lo <= slope <= hi}

    total = radial[band].sum()
    octaves = 0
    k = 4
    while k * 2 <= n // 4:
        e = radial[(f >= k) & (f < k * 2)].sum() / max(total, 1e-12)
        if e >= THRESH["band_energy_min"]:
            octaves += 1
        k *= 2
    m["depth_octaves"] = {"value": octaves, "pass": octaves >= THRESH["depth_octaves_min"]}

    sat = (S >= THRESH["sat_min"]) & (V >= THRESH["val_min"])
    sat_frac = float(sat.mean())
    if sat_frac < 0.005:
        m["warm_arc"] = {"value": None, "pass": True, "note": "near-monochrome (<0.5% colored px)"}
        m["lum_not_hue"] = {"value": None, "pass": True, "note": "near-monochrome"}
        m["dominant_hues"] = {"value": 0, "pass": True}
        m["_hue_mean"] = None
    else:
        hues = H[sat]
        warm = float(in_warm_arc(hues).mean())
        m["warm_arc"] = {"value": round(warm, 4), "pass": warm >= THRESH["warm_frac_min"]}
        hmean, hstd = circular_stats(hues)
        lrange = float(np.percentile(L, 99) - np.percentile(L, 1))
        m["lum_not_hue"] = {"value": {"l_range": round(lrange, 3), "hue_std": round(hstd, 1)},
                            "pass": lrange > THRESH["lum_range_min"] and hstd < THRESH["hue_spread_max_deg"]}
        hist, _ = np.histogram(hues, bins=24, range=(0, 360))
        big = hist / max(hist.sum(), 1) >= 0.05
        # merge adjacent 15° bins (circularly) into hue clusters
        clusters = int(np.sum(big & ~np.roll(big, 1))) if big.any() else 0
        if big.all():
            clusters = 1
        m["dominant_hues"] = {"value": clusters, "pass": clusters <= THRESH["dominant_hue_clusters_max"]}
        m["_hue_mean"] = hmean

    m["_mean_l"] = mean_l
    m["_l32"] = norm.ravel().tolist()
    return m


def piece_metrics(stills):
    per = {p.name: still_metrics(p) for p in stills}
    out = {"stills": {}, "piece": {}}
    hidden = {}
    for name, m in per.items():
        hidden[name] = {k: m.pop(k) for k in list(m) if k.startswith("_")}
        out["stills"][name] = m

    names = list(per)
    energies = [hidden[n]["_mean_l"] for n in names]
    ratio = (min(energies) / max(energies)) if max(energies) > 1e-6 else 1.0
    out["piece"]["arc"] = {"value": round(ratio, 3), "pass": ratio <= THRESH["arc_min_over_max"]}

    hues = [hidden[n]["_hue_mean"] for n in names if hidden[n]["_hue_mean"] is not None]
    jumps = [abs((b - a + 180) % 360 - 180) for a, b in zip(hues, hues[1:])]
    out["piece"]["hue_drift_smooth"] = {
        "value": [round(j, 1) for j in jumps],
        "pass": all(j <= THRESH["hue_jump_max_deg"] for j in jumps) if jumps else True,
    }

    vecs = [np.array(hidden[n]["_l32"]) for n in names]
    corrs = []
    for i in range(len(vecs)):
        for j in range(i + 1, len(vecs)):
            a, b = vecs[i], vecs[j]
            if a.std() > 1e-6 and b.std() > 1e-6:
                corrs.append(float(np.corrcoef(a, b)[0, 1]))
    out["piece"]["layout_varies"] = {
        "value": round(min(corrs), 3) if corrs else None,
        "pass": (min(corrs) < THRESH["layout_corr_max"]) if corrs else False,
    }
    return out


# ---------- Stage-2 clip metrics (optical flow + divergence) ----------
#
# Implements the research report's motion markers from the existing
# multi-window clips: trackability #16 (flow-warping error — Lai 2018 — plus
# pursuit-speed ceiling), jerk #17, never-frozen #19, motion dynamic range
# (#28 adapted: lowest-motion window vs highest), and two-timescale
# divergence #22/#23 (pairwise NCD on luminance-normalized frame stacks +
# flow-histogram distance). Windows are the harness's 5 s clips — an
# approximation of the doctrine's 20 s windows until the harness captures
# longer ones (knob: clip duration lives in bin/inspect-music.mjs).

import lzma

CLIP_THRESH = {
    "flow_scale": (256, 144),     # decode size for flow (speed/quality tradeoff)
    "frame_step": 2,              # use every 2nd frame (≈30 fps effective)
    "px_per_deg": 36.6 * (256 / 1280.0),  # 1280 px ≅ 35° full-screen assumption, rescaled
    # Corpus-fitted 2026-06-12 (positive-tier clips, n=25 clips / 4 pieces —
    # PROVISIONAL until more multi-window-clip pieces exist):
    "pursuit_deg_s_max": 30.0,    # 16 — pursuit ceiling (Meyer 1985); corpus speeds sit far below
    "warp_err_max": 0.12,         # 16 — positives p90 = 0.08
    "frozen_floor": 0.0005,       # 19 — positives' quiet windows reach 0.0008; sub-beat shimmer
                                  #      is below flow resolution at 256px — catches true freezes only
    "jerk_max": 0.30,             # 17 — re-fit 2026-06-12 per kinetic-energy-v3 filed trigger:
                                  #      0.2064 measured on a verified zero-teleport peak clip
                                  #      (beat impulses + defocus breathing inflate flow jerk);
                                  #      ceiling moved to verified-good max + margin
    "ncd_min": 0.90,              # 22 — positives p10 = 0.94 (lzma NCD); a looping piece compresses lower
    "flowhist_min": 0.002,        # 23 — count-normalized hists are small-magnitude; positives p50 = 0.0075
    "dyn_range_max": 0.55,        # 28 — positives p50 = 0.27
}


def decode_clip(path, max_frames=160):
    import cv2
    cap = cv2.VideoCapture(str(path))
    w, h = CLIP_THRESH["flow_scale"]
    frames = []
    i = 0
    while len(frames) < max_frames:
        ok, frame = cap.read()
        if not ok:
            break
        if i % CLIP_THRESH["frame_step"] == 0:
            g = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            # uint8 — Farnebäck's defaults assume 0..255 intensity; float [0,1]
            # input silently yields all-zero flow.
            frames.append(cv2.resize(g, (w, h), interpolation=cv2.INTER_AREA))
        i += 1
    cap.release()
    return frames


def clip_metrics(path):
    import cv2
    frames = decode_clip(path)
    if len(frames) < 10:
        return None
    h, w = frames[0].shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    warp_errs, speeds, jerks, mags = [], [], [], []
    hist = np.zeros(20)
    prev_flow = None
    for a, b in zip(frames, frames[1:]):
        flow = cv2.calcOpticalFlowFarneback(a, b, None, 0.5, 3, 15, 3, 5, 1.2, 0)
        af, bf = a.astype(np.float32) / 255.0, b.astype(np.float32) / 255.0
        warped = cv2.remap(af, xx + flow[..., 0], yy + flow[..., 1], cv2.INTER_LINEAR)
        denom = max(float(bf.std()), 1e-3)
        warp_errs.append(float(np.abs(warped - bf).mean()) / denom)
        mag = np.hypot(flow[..., 0], flow[..., 1])
        mags.append(float(mag.mean()))
        speeds.append(float(np.median(mag)))
        hist += np.histogram(np.log1p(mag), bins=20, range=(0, 3))[0]
        hist_n = len(mags)  # frames accumulated (for count-normalization below)
        if prev_flow is not None:
            jerks.append(float(np.abs(flow - prev_flow).mean()))
        prev_flow = flow
    fps_eff = 60.0 / CLIP_THRESH["frame_step"]
    med_speed_deg_s = float(np.median(speeds)) * fps_eff / CLIP_THRESH["px_per_deg"]
    # luminance-normalized thumbnail stack for NCD (divergence must survive
    # brightness normalization — report marker #23). Std is floored so a
    # near-black window stays flat instead of becoming amplified noise.
    stack = []
    for f in frames[:: max(1, len(frames) // 12)]:
        t = cv2.resize(f, (64, 36), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
        t = (t - t.mean()) / max(float(t.std()), 0.02)
        stack.append(np.clip(t * 32 + 128, 0, 255).astype(np.uint8).tobytes())
    # Flow histogram normalized by accumulation count (NOT by its own mass):
    # a zero-motion window keeps its mass in bin 0 and stays comparable.
    denom_hist = max(hist_n, 1) * h * w
    return {
        "warp_err": round(float(np.median(warp_errs)), 4),
        "median_speed_deg_s": round(med_speed_deg_s, 2),
        "mean_flow": round(float(np.mean(mags)), 4),
        "jerk": round(float(np.mean(jerks)), 4) if jerks else 0.0,
        "_ncd_blob": b"".join(stack),
        "_flow_hist": (hist / denom_hist).tolist(),
    }


def ncd(x, y):
    # lzma, not zlib: zlib's 32 KB window saturates on ~27 KB frame stacks,
    # driving NCD to ~1.0 for ANY pair (Cilibrasi & Vitányi's compressor
    # requirement: the window must exceed the concatenated input).
    c = lambda d: len(lzma.compress(d, preset=1))
    cx, cy = c(x), c(y)
    return (c(x + y) - min(cx, cy)) / max(cx, cy)


def piece_clip_metrics(slug):
    clips = sorted((REPO / "pieces" / slug / "inspect-music").glob("clip-w*.mp4"))
    if len(clips) < 3:
        return None
    per = {}
    for c in clips:
        m = clip_metrics(c)
        if m:
            per[c.name] = m
    if len(per) < 3:
        return None
    names = list(per)
    out = {"clips": {}, "piece": {}}
    for n, m in per.items():
        out["clips"][n] = {
            "trackability": {"value": {"warp_err": m["warp_err"], "speed_deg_s": m["median_speed_deg_s"]},
                             "pass": m["warp_err"] <= CLIP_THRESH["warp_err_max"]
                                     and m["median_speed_deg_s"] <= CLIP_THRESH["pursuit_deg_s_max"]},
            "never_frozen": {"value": m["mean_flow"], "pass": m["mean_flow"] >= CLIP_THRESH["frozen_floor"]},
            "jerk_smooth": {"value": m["jerk"], "pass": m["jerk"] <= CLIP_THRESH["jerk_max"]},
        }
    ncds, fdists = [], []
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            ncds.append(ncd(per[names[i]]["_ncd_blob"], per[names[j]]["_ncd_blob"]))
            a = np.array(per[names[i]]["_flow_hist"])
            b = np.array(per[names[j]]["_flow_hist"])
            fdists.append(float(np.linalg.norm(a - b)))
    out["piece"]["window_divergence"] = {
        "value": {"min_ncd": round(min(ncds), 3), "min_flowhist": round(min(fdists), 3)},
        "pass": min(ncds) >= CLIP_THRESH["ncd_min"] and min(fdists) >= CLIP_THRESH["flowhist_min"],
    }
    flows = [per[n]["mean_flow"] for n in names]
    ratio = min(flows) / max(max(flows), 1e-6)
    out["piece"]["motion_dynamic_range"] = {"value": round(ratio, 3),
                                            "pass": ratio <= CLIP_THRESH["dyn_range_max"]}
    out["piece"]["trackability_all"] = {"pass": all(c["trackability"]["pass"] for c in out["clips"].values())}
    out["piece"]["never_frozen_all"] = {"pass": all(c["never_frozen"]["pass"] for c in out["clips"].values())}
    out["piece"]["jerk_smooth_all"] = {"pass": all(c["jerk_smooth"]["pass"] for c in out["clips"].values())}
    return out


# ---------- Stage-3 interaction metrics (from bin/inspect-interaction.mjs) ----------

INTER_THRESH = {
    "triptych_corr_max": 0.90,   # 31 — some cursor-position pair must differ structurally
    "reversibility_corr_min": 0.92,  # 32 — a→b→a returns the frame (stateful pieces legitimately fail → n/a-stateful via meta)
    "dominance_delta_max": 0.30,     # 33 — with/without-cursor energy delta ≤ 30%
    "solo_corr_max": 0.80,           # 44 — every pair of layer solos must be distinct
    "additive_residual_min": 0.10,   # 43 — composite must differ from the additive sum of solos
}


def _gray_vec(path, size=(32, 32)):
    img = Image.open(path).convert("L").resize(size, Image.LANCZOS)
    return np.asarray(img, dtype=np.float64).ravel() / 255.0


def _corr(a, b):
    if a.std() < 1e-6 or b.std() < 1e-6:
        return 1.0 if (a.std() < 1e-6 and b.std() < 1e-6) else 0.0
    return float(np.corrcoef(a, b)[0, 1])


def interaction_metrics(slug):
    d = REPO / "pieces" / slug / "inspect-interaction"
    if not (d / "manifest.json").exists():
        return None
    man = json.loads((d / "manifest.json").read_text())
    # v2 manifests freeze the clock (stills_comparable is a class string);
    # v1 manifests had a boolean keyed off time_source.
    comparable = bool(man.get("clock_frozen") or man.get("stills_comparable") is True)
    state_note = ("state-advancing sim: deltas corrected against the a-a2 drift baseline"
                  if man.get("state_accumulates") else None)
    legacy_note = None if comparable else "v1 capture, wall-clock piece: time delta contaminates the comparison"
    out = {"stills_comparable": man.get("stills_comparable"), "clock_frozen": bool(man.get("clock_frozen")),
           "tests": {}}

    # No-cursor drift baseline: position a captured at the start and end of
    # the stills block. With a frozen clock, 1 - corr(a, a2) is pure sim/state
    # drift — cursor effects must exceed it to count.
    a2 = d / "cursor-a2.png"
    drift = None
    if a2.exists() and (d / "cursor-a.png").exists():
        drift = 1.0 - _corr(_gray_vec(d / "cursor-a.png"), _gray_vec(a2))
        out["drift_baseline"] = round(drift, 4)

    tript = [d / f"cursor-{t}.png" for t in "abc"]
    if all(p.exists() for p in tript):
        vs = [_gray_vec(p) for p in tript]
        corrs = [_corr(vs[i], vs[j]) for i in range(3) for j in range(i + 1, 3)]
        delta = 1.0 - min(corrs)
        # Pass when cursor-position deltas clear BOTH the static threshold and
        # twice the measured no-cursor drift (when a baseline exists).
        floor = 1.0 - INTER_THRESH["triptych_corr_max"]
        need = max(floor, 2.0 * drift) if drift is not None else floor
        out["tests"]["cursor_composition"] = {
            "value": {"min_corr": round(min(corrs), 3), "delta": round(delta, 4),
                      "needed": round(need, 4)},
            "pass": delta >= need,
            "note": legacy_note or state_note,
        }

    aba = [d / "cursor-aba-0.png", d / "cursor-aba-1.png"]
    if all(p.exists() for p in aba):
        c = _corr(_gray_vec(aba[0]), _gray_vec(aba[1]))
        # Reversibility tolerance widens by the measured drift baseline.
        need = INTER_THRESH["reversibility_corr_min"] - (drift if drift is not None else 0.0)
        out["tests"]["cursor_reversibility"] = {
            "value": round(c, 3),
            "pass": c >= need,
            "note": legacy_note or state_note,
        }

    pair = [d / "cursor-active.png", d / "cursor-idle.png"]
    if all(p.exists() for p in pair):
        a, b = (np.asarray(Image.open(p).convert("L"), dtype=np.float64) / 255.0 for p in pair)
        delta = float(np.abs(a - b).mean() / max((a.mean() + b.mean()) / 2, 1e-3))
        out["tests"]["cursor_bounded"] = {
            "value": round(delta, 3),
            "pass": delta <= INTER_THRESH["dominance_delta_max"],
            "note": legacy_note,
        }

    # Mechanical latency: frames from the annotated cursor jump to the first
    # visual response above 3x the pre-jump noise floor. Clock is frozen during
    # the burst, so the only motion in the clip is the cursor response.
    lat = d / "latency.mp4"
    lat_info = man.get("latency")
    if lat.exists() and lat_info and lat_info.get("jump_at_ms") is not None:
        frames = decode_clip(lat, max_frames=90)
        if len(frames) > 10:
            fps_eff = 60.0 / CLIP_THRESH["frame_step"]
            jump_i = int(round(lat_info["jump_at_ms"] / 1000.0 * fps_eff))
            deltas = [float(np.abs(b.astype(np.float32) - a.astype(np.float32)).mean()) / 255.0
                      for a, b in zip(frames, frames[1:])]
            pre = deltas[max(0, jump_i - 8):max(1, jump_i)]
            floor = 3.0 * (np.mean(pre) if pre else 0.0) + 0.002
            resp = next((i for i, v in enumerate(deltas[jump_i:], start=jump_i) if v > floor), None)
            if resp is not None:
                latency_frames_60 = (resp - jump_i) * CLIP_THRESH["frame_step"]
                out["tests"]["cursor_latency"] = {
                    "value": {"frames_at_60fps": latency_frames_60},
                    "pass": latency_frames_60 <= 4,   # taste: ~3 frames; +1 capture tolerance
                }
            else:
                out["tests"]["cursor_latency"] = {
                    "value": {"frames_at_60fps": None},
                    "pass": False,
                    "note": "no visual response detected after the cursor jump",
                }

    solos = sorted(d.glob("solo-*.png"))
    if len(solos) >= 2:
        vs = {p.stem: _gray_vec(p) for p in solos}
        names = list(vs)
        worst = max(_corr(vs[a], vs[b]) for i, a in enumerate(names) for b in names[i + 1:])
        out["tests"]["layer_distinct"] = {"value": round(worst, 3),
                                          "pass": worst <= INTER_THRESH["solo_corr_max"]}
        comp = d / "cursor-idle.png"
        if comp.exists():
            full = [np.asarray(Image.open(p).convert("L"), dtype=np.float64) / 255.0 for p in solos]
            additive = np.clip(np.sum(full, axis=0), 0, 1)
            composite = np.asarray(Image.open(comp).convert("L"), dtype=np.float64) / 255.0
            resid = float(np.abs(additive - composite).mean() / max(composite.mean(), 1e-3))
            out["tests"]["layer_interaction"] = {"value": round(resid, 3),
                                                 "pass": resid >= INTER_THRESH["additive_residual_min"]}

    cells = {c: d / f"matrix-{c}.mp4" for c in ("both", "music", "cursor", "neither")}
    if all(p.exists() for p in cells.values()):
        flows = {}
        for cell, p in cells.items():
            m = clip_metrics(p)
            if m:
                flows[cell] = m["mean_flow"]
        if len(flows) == 4:
            out["tests"]["idle_matrix_alive"] = {
                "value": {k: round(v, 4) for k, v in flows.items()},
                "pass": all(v >= CLIP_THRESH["frozen_floor"] for v in flows.values()),
            }
    return out


# ---------- corpus calibration ----------

POSITIVE = {"chef-doeuvre", "ship-it", "shipped"}
VERSION_RE = re.compile(r"^([a-z0-9-]+?)-(v\d+(?:-i\d+)?(?:-blocked)?|blocked)\.md$")

# Tests that hard-gate (passed 14/14 positives at calibration 2026-06-12).
# Everything else is advisory until the negative corpus exists.
HARD_GATES = ["no_blowout", "dominant_hues"]

# Per-test piece-level aggregation over core stills. Default: every core
# still must pass. squint_macro allows one outlier section (peak floods and
# near-black moments legitimately have no banded region): >= 75% of stills.
AGG_FRACTION = {"squint_macro": 0.75}


def agg_pass(test, results):
    need = AGG_FRACTION.get(test, 1.0)
    return (sum(bool(r) for r in results) / max(len(results), 1)) >= need


def palette_exception(slug):
    """meta.yaml `palette_exception:` sanctions a non-warm palette for one piece."""
    try:
        import yaml
        meta = yaml.safe_load((REPO / "pieces" / slug / "meta.yaml").read_text()) or {}
        return meta.get("palette_exception") or None
    except Exception:
        return None


def apply_palette_exception(pm, slug):
    exc = palette_exception(slug)
    if not exc:
        return pm
    for m in pm["stills"].values():
        if not m["warm_arc"]["pass"]:
            m["warm_arc"] = {"value": m["warm_arc"].get("value"), "pass": True,
                             "note": f"sanctioned exception: {exc}"}
    return pm


def latest_verdicts():
    bydir = {}
    for f in sorted((REPO / "brainstorming/critiques").glob("*.md")):
        mm = VERSION_RE.match(f.name)
        if mm:
            bydir.setdefault(mm.group(1), []).append(f)
    verdicts = {}
    for slug, files in bydir.items():
        text = files[-1].read_text()
        tails = re.findall(r"```yaml\n(.*?)\n```", text, re.S)
        v = None
        if tails:
            vm = re.search(r"^verdict:\s*(\S+)", tails[-1], re.M)
            v = vm.group(1) if vm else None
        if v:
            verdicts[slug] = (v, files[-1].stem)
    return verdicts


def stills_for(slug, critique_stem):
    ev = REPO / "brainstorming/critiques/evidence" / critique_stem
    if ev.is_dir():
        stills = sorted(ev.glob("music-*.png"))
        if len(stills) >= 4:
            return stills, f"evidence/{critique_stem}"
    im = REPO / "pieces" / slug / "inspect-music"
    stills = sorted(im.glob("music-*.png"))
    return (stills, "inspect-music") if len(stills) >= 4 else (None, None)


def calibrate():
    rows = []
    tests_seen = set()
    for slug, (verdict, stem) in sorted(latest_verdicts().items()):
        stills, source = stills_for(slug, stem)
        if not stills:
            continue
        pm = apply_palette_exception(piece_metrics(stills), slug)
        core = list(pm["stills"].values())[1:-1] or list(pm["stills"].values())
        row = {"slug": slug, "verdict": verdict, "source": source, "tests": {}}
        for t in next(iter(pm["stills"].values())).keys():
            allpass = agg_pass(t, [s[t]["pass"] for s in pm["stills"].values()])
            corepass = agg_pass(t, [s[t]["pass"] for s in core])
            row["tests"][t] = {"all": allpass, "core": corepass}
            tests_seen.add(t)
        for t, r in pm["piece"].items():
            row["tests"][t] = {"all": r["pass"], "core": r["pass"], "value": r["value"]}
            tests_seen.add(t)
        cm = piece_clip_metrics(slug)
        if cm:
            for t, r in cm["piece"].items():
                row["tests"][t] = {"all": r["pass"], "core": r["pass"], "value": r.get("value")}
                tests_seen.add(t)
        rows.append(row)

    lines = [
        "# Stage-1 metric calibration against the graded corpus",
        "",
        f"Generated by `bin/aesthetic-metrics.py calibrate`. Corpus: {len(rows)} graded",
        "pieces with section stills (evidence snapshots preferred; live inspect-music",
        "stills otherwise — those may post-date the graded version). `core` = test",
        "applied to all stills except the first and last (intro/outro frames are",
        "often legitimately near-black and fail contrast tests vacuously).",
        "",
        "Positive tier = chef-doeuvre / ship-it / shipped. A useful binary test",
        "should pass most positives and fail most negatives — or be understood as",
        "a different axis the verdict doesn't encode.",
        "",
    ]
    tests = sorted(tests_seen)
    lines.append("| piece | verdict | " + " | ".join(tests) + " |")
    lines.append("|---|---|" + "---|" * len(tests))
    for r in rows:
        cells = []
        for t in tests:
            tr = r["tests"].get(t)
            cells.append("—" if tr is None else ("✓" if tr["core"] else "✗"))
        lines.append(f"| {r['slug']} | {r['verdict']} | " + " | ".join(cells) + " |")

    lines += ["", "## Separation by tier (core rule)", "",
              "| test | pass rate (positive tier) | pass rate (negative tier) |", "|---|---|---|"]
    for t in tests:
        pos = [r for r in rows if r["verdict"] in POSITIVE and t in r["tests"]]
        neg = [r for r in rows if r["verdict"] not in POSITIVE and t in r["tests"]]
        pr = (sum(r["tests"][t]["core"] for r in pos), len(pos))
        nr = (sum(r["tests"][t]["core"] for r in neg), len(neg))
        lines.append(f"| {t} | {pr[0]}/{pr[1]} | {nr[0]}/{nr[1]} |")
    lines.append("")

    out = REPO / "learning/calibration-stage1.md"
    out.write_text("\n".join(lines))
    (REPO / "learning/calibration-stage1.json").write_text(json.dumps(rows, indent=1))
    print(f"wrote {out} ({len(rows)} pieces, {len(tests)} tests)")


def main():
    if len(sys.argv) >= 3 and sys.argv[1] in ("piece", "gate", "clips", "interaction"):
        slug = sys.argv[2]
        if sys.argv[1] == "clips":
            result = piece_clip_metrics(slug)
            if result is None:
                sys.exit(f"no usable clip-w*.mp4 for {slug}")
            print(json.dumps(result, indent=1))
            return
        if sys.argv[1] == "interaction":
            result = interaction_metrics(slug)
            if result is None:
                sys.exit(f"no inspect-interaction captures for {slug} (run bin/inspect-interaction.mjs first)")
            print(json.dumps(result, indent=1))
            return
        verdicts = latest_verdicts()
        stem = verdicts.get(slug, (None, ""))[1]
        stills, source = stills_for(slug, stem)
        if not stills:
            sys.exit(f"no section stills found for {slug}")
        result = apply_palette_exception(piece_metrics(stills), slug)
        result["source"] = source
        # Piece-level aggregates so consumers don't re-derive the rules.
        core = list(result["stills"].values())[1:-1] or list(result["stills"].values())
        result["aggregates"] = {
            t: {"pass": agg_pass(t, [s[t]["pass"] for s in core]),
                "rule": f">={int(AGG_FRACTION.get(t, 1.0) * 100)}% of core stills"}
            for t in next(iter(result["stills"].values())).keys()
        }
        if sys.argv[1] == "gate":
            core = list(result["stills"].values())[1:-1] or list(result["stills"].values())
            failures = [t for t in HARD_GATES if not all(s[t]["pass"] for s in core)]
            print(json.dumps({"gates": HARD_GATES, "failures": failures}, indent=1))
            sys.exit(1 if failures else 0)
        result["clips"] = piece_clip_metrics(slug)
        print(json.dumps(result, indent=1))
    elif len(sys.argv) >= 2 and sys.argv[1] == "calibrate":
        calibrate()
    else:
        sys.exit("usage: aesthetic-metrics.py piece <slug> | clips <slug> | gate <slug> | calibrate")


if __name__ == "__main__":
    main()
