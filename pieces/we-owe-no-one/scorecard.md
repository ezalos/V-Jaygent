# we-owe-no-one — scorecard

Last reworked: 2026-05-20 (Louis feedback pass — NOT critic-graded since)
Latest critic verdict: chef-doeuvre (v3 — STALE, pre-rework)
Claim check: pass (v3)

## Status

The v3 chef-doeuvre grade is stale. Louis watched the piece and called
it "not good enough" — it looked the same start to end, the drop was
not found, no vocal element. A substantial rework followed (see the
2026-05-20 commit "real song structure + vocal element"):

- Fixed bin/audio_analyzer/analyze.py so `--stems` works (was broken on
  torchcodec) → Demucs vocals/drums/bass/other stems.
- Replaced the section map: 9 stem-derived sections — two DROPS (band
  entry 26s, post-silence re-entry 254s) and a guitar SOLO (148-196s,
  vocals absent) that the old energy-only map had missed entirely.
- New `vocal-veins` layer — bold white-hot braided veins driven by
  `u_audio_vocals_stem`; appears when the singer sings, recurs every
  vocal section. `add` blend.
- `fracture-plates` is now a section state machine: unforged dark iron
  in the intro, the lattice crystallises at the drop, the iron half-
  melts into a smooth molten river under the solo, collapses in the
  breakdown, re-ignites at the second drop. The iron recedes when the
  singer leads so the vocal-veins blaze.

Needs a fresh /vjay-iterate pass to re-grade against taste.md.

## Probe counts (v3 — stale)
- Mesmerizing: 5/5 · Interaction: 7/7 · Music: 4/4 · Song-level: 6/6
- Dual-input: 6/7 · Layered: 5/8

Latest critique: brainstorming/critiques/we-owe-no-one-v3.md (stale)
