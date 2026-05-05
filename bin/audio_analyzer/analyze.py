#!/usr/bin/env python3
# ABOUTME: Audio analysis entry point — produces audio.analysis.json conforming
# ABOUTME: to brainstorming/techniques/using-lib.md §"audio analysis JSON contract".

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import librosa


SR_ANALYSIS = 22050           # librosa default; sufficient for beat/segment/key
SR_STEMS = 44100              # demucs prefers 44.1k
ENVELOPE_HZ = 100             # 100Hz envelope sampling — schema-fixed
SECTION_LABEL_DEFAULT = "unknown"
SECTION_LABEL_ENUM = [
    "unknown", "intro", "verse", "chorus",
    "breakdown", "build", "drop", "outro",
]


def load_audio(path: str, sr: int = SR_ANALYSIS):
    y, sr_actual = librosa.load(path, sr=sr, mono=True)
    return y, sr_actual


def detect_bpm_and_beats(y, sr):
    """librosa.beat.beat_track — returns (bpm float, beat_times list[float])."""
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr, units='frames')
    beat_times = librosa.frames_to_time(beat_frames, sr=sr).tolist()
    bpm = float(np.atleast_1d(tempo)[0])
    return bpm, beat_times


def heuristic_downbeats(beats, beats_per_bar: int = 4):
    """Every Nth beat starting from beat 0 is a downbeat. 4/4 is the default;
    pieces in 7/4 etc. need hand correction in the JSON post-analysis."""
    return [beats[i] for i in range(0, len(beats), beats_per_bar)]


def detect_sections(y, sr, n_sections_target: int = 8, min_section_sec: float = 4.0):
    """Recurrence-matrix-based agglomerative segmentation (Foote 2000;
    Serra 2014). Returns list of {start, end, label, energy}. Labels are
    'unknown' for v1; the JSON is hand-editable post-analysis."""
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfcc_stack = librosa.feature.stack_memory(mfcc, n_steps=2)
    bounds = librosa.segment.agglomerative(mfcc_stack, k=n_sections_target)
    bound_times = librosa.frames_to_time(bounds, sr=sr).tolist()

    duration = librosa.get_duration(y=y, sr=sr)
    if not bound_times or bound_times[0] > 0.5:
        bound_times = [0.0] + bound_times
    if bound_times[-1] < duration - 0.5:
        bound_times.append(float(duration))

    sections = []
    for i in range(len(bound_times) - 1):
        sections.append({
            "start": float(bound_times[i]),
            "end": float(bound_times[i + 1]),
            "label": SECTION_LABEL_DEFAULT,
        })

    # Merge consecutive short sections
    merged = []
    for s in sections:
        if merged and (s["end"] - s["start"]) < min_section_sec:
            merged[-1]["end"] = s["end"]
        else:
            merged.append(s)

    # Per-section smoothed RMS mean
    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
    rms_times = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=512)
    rms_norm = rms / max(float(rms.max()), 1e-9)
    for s in merged:
        mask = (rms_times >= s["start"]) & (rms_times < s["end"])
        s["energy"] = float(rms_norm[mask].mean()) if mask.any() else 0.0

    return merged


def energy_envelope(y, sr, hz: int = ENVELOPE_HZ):
    """RMS resampled to `hz` Hz, normalized to [0, 1]."""
    hop = max(1, int(round(sr / hz)))
    rms = librosa.feature.rms(y=y, frame_length=2 * hop, hop_length=hop)[0]
    rms_norm = rms / max(float(rms.max()), 1e-9)
    return {
        "hz": hz,
        "values": [float(v) for v in rms_norm],
    }


# Krumhansl–Schmuckler key profiles
KS_MAJOR = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09,
                      2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
KS_MINOR = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53,
                      2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
PITCH_CLASSES = ["C", "C#", "D", "D#", "E", "F",
                 "F#", "G", "G#", "A", "A#", "B"]


def detect_key(y, sr):
    """Krumhansl–Schmuckler key estimation via chroma correlation."""
    chroma = librosa.feature.chroma_cens(y=y, sr=sr).mean(axis=1)
    best_corr = -2.0
    best_tonic = 0
    best_mode = "major"
    for tonic in range(12):
        for mode_name, profile in [("major", KS_MAJOR), ("minor", KS_MINOR)]:
            rot = np.roll(profile, tonic)
            corr = float(np.corrcoef(chroma, rot)[0, 1])
            if corr > best_corr:
                best_corr = corr
                best_tonic = tonic
                best_mode = mode_name
    confidence = max(0.0, min(1.0, (best_corr + 1.0) * 0.5))
    return {
        "tonic": PITCH_CLASSES[best_tonic],
        "mode": best_mode,
        "confidence": float(confidence),
    }


def stem_separation_and_envelopes(input_path: str):
    """Run Demucs on the input file, return per-stem RMS envelope dict.
    Imported lazily so base-mode runs don't pay the torch/demucs import cost."""
    import torch
    from demucs.pretrained import get_model
    from demucs.apply import apply_model
    import torchaudio

    model = get_model('htdemucs')
    model.train(False)  # inference mode (equivalent to model.eval())

    waveform, sr = torchaudio.load(input_path)
    if waveform.shape[0] == 1:
        waveform = waveform.repeat(2, 1)  # demucs expects stereo
    if sr != SR_STEMS:
        waveform = torchaudio.functional.resample(waveform, sr, SR_STEMS)
        sr = SR_STEMS

    with torch.no_grad():
        sources = apply_model(model, waveform[None], device='cpu', progress=False)[0]
    stems = {}
    for i, name in enumerate(model.sources):
        s_stereo = sources[i].numpy()
        s_mono = s_stereo.mean(axis=0)
        hop = max(1, int(round(sr / ENVELOPE_HZ)))
        rms = librosa.feature.rms(
            y=s_mono.astype(np.float32),
            frame_length=2 * hop,
            hop_length=hop,
        )[0]
        rms_norm = rms / max(float(rms.max()), 1e-9)
        stems[name] = {
            "hz": ENVELOPE_HZ,
            "rms": [float(v) for v in rms_norm],
        }
    return stems


def main():
    ap = argparse.ArgumentParser(description="V-Jaygent offline audio analysis")
    ap.add_argument("--input", required=True, help="path to audio file")
    ap.add_argument("--out", required=True, help="path to write analysis JSON")
    ap.add_argument("--stems", action="store_true",
                    help="run Demucs 4-stem separation (slow, requires torch)")
    args = ap.parse_args()

    print(f"[analyze.py] loading {args.input}", file=sys.stderr)
    y, sr = load_audio(args.input)
    duration = float(librosa.get_duration(y=y, sr=sr))

    print(f"[analyze.py] beat tracking", file=sys.stderr)
    bpm, beats = detect_bpm_and_beats(y, sr)
    downbeats = heuristic_downbeats(beats, beats_per_bar=4)

    print(f"[analyze.py] section segmentation", file=sys.stderr)
    sections = detect_sections(y, sr)

    print(f"[analyze.py] energy envelope", file=sys.stderr)
    envelope = energy_envelope(y, sr)

    print(f"[analyze.py] key estimation", file=sys.stderr)
    key = detect_key(y, sr)

    stems = {}
    if args.stems:
        print(f"[analyze.py] Demucs stem separation (slow)", file=sys.stderr)
        stems = stem_separation_and_envelopes(args.input)

    out = {
        "version": 1,
        "duration_sec": duration,
        "bpm": bpm,
        "beats": beats,
        "downbeats": downbeats,
        "sections": sections,
        "energy_envelope": envelope,
        "stems": stems,
        "key": key,
    }

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, indent=2))

    print(
        f"[analyze.py] done — bpm={bpm:.1f}, beats={len(beats)}, "
        f"downbeats={len(downbeats)}, sections={len(sections)}, "
        f"key={key['tonic']} {key['mode']}, stems={list(stems.keys()) or 'none'}",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
