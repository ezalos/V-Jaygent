# mozart-rondo-alla-turca-turkish-march — scorecard

Last iterated: 2026-05-12 (run R-mozart-iter-v4, 4 iterations)
Latest verdict: **ship-it**
Claim check: pass

## Probe counts (latest critique — v4)
- Mesmerizing: **5/5**  ← chef-d'oeuvre threshold; verdict still ship-it
- Interaction: 7/7
- Music: 4/4
- Song-level: 5/6
- Dual-input: 7/7
- Layered: n/a — monolithic shader

## Dimension scores (latest)
| palette | composition | motion | intensity | depth | form |
|---------|-------------|--------|-----------|-------|------|
| 5/5     | 5/5         | 5/5    | 4/5       | 4/5   | 4/5  |

## Deltas (v3 → v4)
| metric              | v3    | v4    | Δ  |
|---------------------|-------|-------|----|
| mesmerizing_passes  | 4/5   | 5/5   | +1 |
| prediction probe    | weak  | pass  | +  |
| mystery probe       | fail  | pass  | +  |
| composition         | 4     | 5     | +1 |
| motion              | 4     | 5     | +1 |
| depth               | 3     | 4     | +1 |
| recapitulation      | weak  | weak  | 0  |

## Most recent fix (v3 → v4)
Dimension: prediction probe + mystery probe (mesmerizing)
What:      Per-beat per-arm length reshuffle via hash21(arm_idx, beat_idx);
           per-bar hold-or-spin gate (35% of bars hold cross stationary);
           per-beat ring fire/direction/curve variation (70% fire, 45%
           inward-contracting, mix of linear/ease-out curves); per-section
           rotation rate ∈ [0.55, 1.60] revs per bar with random direction;
           sweep arc with non-uniform angular velocity (sin+cos sum).
Why:       v3 had constant bar-phase rotation — Louis caught the critic
           over-grading prediction: weak when "rotation legible after one
           frame" is the FAIL signature per taste.md. v4 breaks the
           rate-lock structurally; the cross is a different shape every
           beat (not just rotated), and ring behaviour is hash-gated.

## Iteration history
- v1 (2026-05-11) — layer-stack, structural-rethink, claim fail
- v2 (2026-05-11) — critic confirmed structural-rethink with diagnosis
- v3 (2026-05-12) — monolithic rebuild, ship-it (over-graded on prediction)
- v4 (2026-05-12) — predictability fix, ship-it with 5/5 probes

Latest critique: brainstorming/critiques/mozart-rondo-alla-turca-turkish-march-v4.md
