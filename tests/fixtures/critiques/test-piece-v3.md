# Critique: test-piece v3 (schema 2)

## The claim

Binary-rubric era critique fixture.

## Verdict

ship-it under the v2 binary bars.

```yaml
piece: test-piece
iteration: 3
schema: 2
verdict: ship-it
claim_check: pass
mesmerizing_passes: 8/9
mesmerizing_probes:
  eye_lands: pass
  landing_regions_2_4: pass
  regions_shift: pass
  prediction_continuity: pass
  prediction_divergence: pass
  squint_macro_structure: pass
  fine_texture_reward: fail
  hue_drift: pass
  mystery_withheld: pass
dimensions:
  palette_cohesion:
    warm_arc: pass
    lum_not_hue: pass
    dominant_hues: pass
    no_collapse: pass
    hue_drift_smooth: pass
  motion:
    trackability: pass
    jerk_smooth: pass
    multi_scale_desync: fail
    never_frozen: pass
    direction_in_quiet: n/a
metrics:
  gate: pass
  stills_passed: 9/10
  clips_passed: 4/5
harness_gaps:
  - criterion: multi_scale_desync
    missing: band-decomposed flow metric
top_fix: null
evidence:
  - evidence/test-piece-v2-i1/frame-00.png
```
