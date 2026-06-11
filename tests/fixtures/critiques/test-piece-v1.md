# Critique: test-piece v1

## The claim

This piece claims a rolling gradient that breathes with the music.

## Mesmerizing probes

Prediction fails — the gradient is fully learnable in one cycle.

## Verdict

needs-tweak — motion too static at section centres.

```yaml
piece: test-piece
iteration: 1
verdict: needs-tweak
claim_check: pass
mesmerizing_passes: 3
mesmerizing_probes:
  eye_landing: pass
  prediction: fail
  squint: pass
  hue_drift: weak
  mystery: pass
music_passes: 2
music_probes:
  motion_over_luminance: shader-pass
  bass_movement: pass
  rhythm_in_stills: fail
  quiet_reads_quiet: pass
scores:
  palette_cohesion: 5
  composition: 4
  motion: 2
  intensity: 3
  depth: 4
  form_ending: n/a
top_fix: add baseline per-beat motion
```
