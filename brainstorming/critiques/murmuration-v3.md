# murmuration v3 critique

Theme-only piece. Boids-style starling murmuration over warm autumn
dusk with shockwave rings on flock near-collisions and a cursor
attractor. Three iterations from v1.

## The claim

A boids-style starling murmuration over warm autumn dusk. Multiple
flocks weave through the sky; when flock centroids near-collide, a
warm shockwave ripples outward. Cursor adds a single attractor point
birds drift toward. Self-plays autonomously.

## Frame-by-frame

| Frame | t      | What's there |
|-------|--------|--------------|
| 0     | 1.5s   | Dark bird silhouettes clustered top; warm bellies lower-left + center; a small centered warm ring; partial larger ring at upper-right edge |
| 1     | 9.9s   | Clear dual-band — silhouettes top, warm bellies bottom; partial ring right edge |
| 2     | 18.3s  | Birds dense at top + bottom; large faint ring fragment upper-left; mid-band relatively empty |
| 3     | 26.7s  | Birds on diagonals (motion direction reads clearly); two ring fragments at the left edges |
| 4     | 35.1s  | Sparse birds; bright prominent ring upper-right with concentric secondary arc — strong shockwave moment |

## Mesmerizing probes

| Probe | Verdict | Note |
|-------|---------|------|
| Eye-landing | pass | 2-4 candidates per frame (cluster + ring + warm band) and the dominant zone migrates between frames (top-cluster → balanced → ring-anchored). |
| Prediction  | pass | Macro composition (sky + birds + occasional ring) is predictable; the where/when of the next ring is not. |
| Squint      | pass | Dark zenith → warm horizon gradient gives macro composition; bird kernels survive at close inspection. |
| Hue drift   | weak | Frames stay inside ember/amber/wine but the swing is narrow — the piece reads close to monochromatic warm across the 35s sample. A wider hue cycle (e.g. tying skyHue to a 60s clock) would push this to pass. |
| Mystery     | pass | Birds-as-shape are ambiguous (rice grains? chevrons? actual starlings?); ring fragments dissolve into faint arcs that hint at a larger geometric structure. |

4 pass + 1 weak.

## Claim check

PASS. Murmuration: birds visible, distributed across the canvas,
moving along a divergence-free flow. Warm dusk: vertical gradient
clean, zero cool pixels per lint-palette. Shockwave rings: anchored
to actual bird-pair separation in the flow (collision = `0.35 +
0.85·(1 - smoothstep(0.06, 0.50, sep))`) — not pure time hashes.
Cursor attractor: implemented as a Gaussian pull on the velocity
field, idle-safe via `vjMouseWorld` returning vec2(1e4). Self-plays:
lint-idle motion 0.0324 / floor 0.025.

The cursor reactivity is not visually verified in these frames (no
`--cursor` capture). The wiring is sound but a future iteration
should add a cursor frame to the audit.

## Scores

| Dimension | Score | Note |
|-----------|-------|------|
| palette_cohesion | 4 | Lint passes at 0% cool. Hue family drifts but the brown-soup zone in the mid-sky drags it from a 5. A 5 would have more visible wine→amber breath across the 35s sample. |
| composition | 4 | 2-4 landing zones per frame, eye moves between frames; the upper third tends to over-cluster though the dual-band fix kept the bottom alive too. |
| motion | 3 | All clocks ride on u_time; wind + curl + epoch drift give three sub-rates but they share a substrate. Bumping to 4 would mean wiring a bar/section uniform, which this theme-only piece doesn't expose. |
| intensity | 4 | Real dark at zenith (skyLum drops to 0.18), bright warm at horizon with rim glow; ring rims punch above without bleaching. |
| depth | 4 | Bird kernels (fine) + flock haze (meso) + sky fbm + ring SDF (event-scale). Three+ honest scales. |
| form_ending | n/a | Autonomous piece, no fixed end. |

## What's working

- The bird kernel shape change in v2/v3 (tighter footprint, motion-blur
  along velocity) eliminated the v1 "eye/donut" artifact.
- Separating silhouette zone from belly zone via `skyY ≈ 0` cutoff
  killed the dark-rim-around-bright-center hybrid that made v1 birds
  illegible.
- Honest collision-driven rings (not pure hashes) — even at lower
  intensity floors, the rings deliver the "near-miss" claim.
- Lint suite caught the motion-floor failure in v2 before grading
  could waste cycles on it.

## What's imperfect

1. The hue-drift probe is weak; the brown-soup zone needs a wider
   palette walk. Top fix candidate if v4 happens.
2. Birds visually read as "grains of rice" not starlings — the
   tradeoff for kernel tightness is loss of the chevron-tail shape.
3. The render budget pushed render_scale to 0.35 to fit under
   inspect-music's 30s screenshot timeout — phones at native scale
   will be choppier than the canonical 0.55 target.
4. Cursor attractor never appears in inspect frames (no --cursor pass).

## Verdict

ship-it.

```yaml
piece: murmuration
iteration: 3
verdict: ship-it
claim_check: pass
mesmerizing_passes: 4
mesmerizing_probes:
  eye_landing: pass
  prediction: pass
  squint: pass
  hue_drift: weak
  mystery: pass
scores:
  palette_cohesion: 4
  composition: 4
  motion: 3
  intensity: 4
  depth: 4
  form_ending: n/a
top_fix: null
```
