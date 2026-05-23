# shoal — critique v1 (blocked)

Independent critic, v3 of the build (monolithic, L/R-balanced hue).
Verdict: **structural-rethink** — handed back, not auto-iterated.

## The claim

A Lyapunov chaos map of the double pendulum: each pixel is initial
state (θ1, θ2), integrated for 30 RK4 steps with a perturbed twin;
brightness = log(separation / 1e-4). Stable regions (KAM islands)
appear dim; chaotic regions saturate bright. Viewer sees phase-space
architecture — islands of regularity in a chaotic sea.

## Frame-by-frame

| Frame | t (s) | What's there |
|-------|-------|------|
| 0 | 1.5 | Two bright chaotic vortices L/R, calmer brown centre, fine filigree around vortices. Vertically symmetric, L/R-balanced after the hue fix. |
| 1 | 15.5 | Nearly identical to frame 0. Same vortex positions, same filigree. Subtle hue drift. |
| 2 | 29.5 | Imperceptible drift. Composition frozen. |
| 3 | 43.5 | Same. No measurable shift. |

## Mesmerizing probes

| Probe | Verdict | Justification |
|-------|---------|---|
| Eye-landing | fail | Eye lands on the two bright vortices and stays. Zero shift across frames. |
| Prediction | fail | Macro composition fully predictable — frame repeats. Eye pre-computes frame 4 instantly. |
| Squint | weak | Macro light/dark emerges (bright vortices vs dark surround) but interior filigree is uniform hash, not fractal self-similarity. |
| Hue drift | weak | Hue locked in warm-brown/amber. Breathing too subtle to read as drift. |
| Mystery | fail | Discloses its logic in frame 0. Stepping close shows texture but no new structure — no edge that won't resolve. |

Passes: 1/5 — does not mesmerize.

## Claim check

**fail.** The honest signature for a basin piece is "smooth interior
lakes shredding into fine fractal filigree at the boundaries"
(`taste.md` Structure-honesty, basin clause). Frames show two
procedural vortices with texture noise, not emergent fractal
filigree. The claim of "phase-space architecture from a double
pendulum" lands as static procedural decoration.

## Scores

| Dimension | Score | Note |
|-----------|-------|------|
| Palette cohesion | 5 | Warm ramp flawlessly executed; zero cool intrusion. |
| Composition | 1 | Identical across all four frames; macro shape frozen. Static. |
| Motion | 2 | Two clocks but envelope too subtle (±15% multiplier on already-static field). No visible geometric motion. |
| Intensity | 3 | Reasonable luminance breadth ~0.2–0.85; range present but unused. |
| Depth | 2 | Two scales but the fine scale is uniform noise, not fractal. No zoom hierarchy. |
| Form & ending | n/a | 90s self-playing loop; no end-of-track material. |

## What's working

1. Palette purity — perfect warm ramp.
2. Hamiltonian physics — canonical double pendulum, sound RK4.
3. Keyboard per-key distinctness — disjoint signed impulses across 15.
4. Audio reactivity plumbing — bass→gravity, high→shimmer.

## What's imperfect

**The root failure: the pixel-to-initial-state map is static.** Each
pixel always represents the same (θ1, θ2). The basin field cannot
evolve without global parameter modulation; the gravity drift
(0.12 × sin) is too weak to visibly reorganize it. Cursor and keyboard
are parameter pilots (perturb one pixel's start), not field modulators
(reshape the whole landscape). In the idle case captured by inspect,
the only motion is shimmer and brightness envelope — decoration, not
composition.

Also: no visible cursor/keyboard reactivity in inspect frames (cursor
parked at centre); shimmer operates below the eye's macro-scale; the
fine filigree reads as procedural hash, not fractal self-similarity.

## Verdict

**structural-rethink** — fails 4/5 mesmerizing probes, claim-check
fails, composition 1/5. The architecture is mathematically sound but
the design is fundamentally flawed for the mesmerizing brief: a basin
map cannot captivate if the basins never move.

Critic's structural fixes:
- (a) **Animate parameters per frame to reshape the basin boundaries
  in real time** — make the field breathe via much stronger gravity /
  damping / phase-space pan drift, so the chaos map visibly
  reorganizes between frames.
- (b) Pivot to a different double-pendulum visualization not
  constrained to a static pixel→initial-state grid.

Handed back to Louis 2026-05-23.

```yaml
piece: shoal
iteration: 1
verdict: structural-rethink
claim_check: fail
mesmerizing_passes: 1
mesmerizing_probes:
  eye_landing: fail
  prediction: fail
  squint: weak
  hue_drift: weak
  mystery: fail
music_passes: n/a
scores:
  palette_cohesion: 5
  composition: 1
  motion: 2
  intensity: 3
  depth: 2
  form_ending: n/a
top_fix: null
```
