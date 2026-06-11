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
    "squint_mask_level": 0.60,       # 1  — normalized-L threshold for "light"
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
    frac = connected_fraction(norm > THRESH["squint_mask_level"]) if span > 1e-3 else 0.0
    m["squint_macro"] = {
        "value": round(frac, 4),
        "pass": bool(THRESH["squint_region_lo"] <= frac <= THRESH["squint_region_hi"]
                     and rms >= THRESH["rms_contrast_min"]),
    }

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


# ---------- corpus calibration ----------

POSITIVE = {"chef-doeuvre", "ship-it", "shipped"}
VERSION_RE = re.compile(r"^([a-z0-9-]+?)-(v\d+(?:-i\d+)?(?:-blocked)?|blocked)\.md$")


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
        pm = piece_metrics(stills)
        core = list(pm["stills"].values())[1:-1] or list(pm["stills"].values())
        row = {"slug": slug, "verdict": verdict, "source": source, "tests": {}}
        for t in next(iter(pm["stills"].values())).keys():
            allpass = all(s[t]["pass"] for s in pm["stills"].values())
            corepass = all(s[t]["pass"] for s in core)
            row["tests"][t] = {"all": allpass, "core": corepass}
            tests_seen.add(t)
        for t, r in pm["piece"].items():
            row["tests"][t] = {"all": r["pass"], "core": r["pass"], "value": r["value"]}
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
    if len(sys.argv) >= 3 and sys.argv[1] == "piece":
        slug = sys.argv[2]
        verdicts = latest_verdicts()
        stem = verdicts.get(slug, (None, ""))[1]
        stills, source = stills_for(slug, stem)
        if not stills:
            sys.exit(f"no section stills found for {slug}")
        result = piece_metrics(stills)
        result["source"] = source
        print(json.dumps(result, indent=1))
    elif len(sys.argv) >= 2 and sys.argv[1] == "calibrate":
        calibrate()
    else:
        sys.exit("usage: aesthetic-metrics.py piece <slug> | calibrate")


if __name__ == "__main__":
    main()
