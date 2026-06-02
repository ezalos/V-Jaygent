# Layer audit — 2026-06-03

Ran `bin/test-all-layers.mjs` against every shader layer in the repo
(14 global + 30 piece-local = 44 layers, of which 40 testable after
filtering the test-base, chaos-warp-copy, and the alpha-0 invisible
publishers force-source / lodestone-pull). The runner auto-generates
a temporary piece per layer (test-base diagnostic on the bottom +
the layer-under-test on top, force-source paired in for the
flow-particles / flow-warm / follow-force consumers) and renders 4s
with `bin/publish.mjs` so u_history feedback has time to accumulate.
Last frame extracted to `pieces/xtest-layer-results/`.

## What we were hunting

The chaos-warp bug Louis spotted on 2026-06-03 was caused by
`lib/noise.glsl`'s `fbm()` being grid-aligned (the library header
explicitly warns "prefer fbmRot for pieces that hold still"), combined
with heavy `u_history` feedback (decay 0.92) that baked the grid
into persistent trails. The curl operation amplified the high-frequency
grid content into visible 3-pixel block patches.

Pre-flight scan found 8 piece-local layers using grid-aligned `fbm()`,
of which 2 also use `u_history` feedback (the prime risk combination):
- `pieces/so-hollow-let-babylon-burn/layers/fire-columns/shader.frag`
- `pieces/we-owe-no-one/layers/heat-haze/shader.frag`

## What we found

**No layer in the catalogue currently exhibits the chaos-warp-style
grid artefact.** Verified by direct inspection:

- **fire-columns**: the bottom-half flame columns blend additively onto
  u_below; the underlying test pattern remains crisp above the fire
  zone. Even with `fbm` + `u_history` in the shader, the visible
  result is clean. (Likely the history decay is light enough — and
  the fire band stays low in the frame — that grid alignment doesn't
  accumulate.)
- **heat-haze**: subtle smooth warp on the line-grid; no
  discontinuities, no block patches.
- Other layers using `fbm()` without `u_history` (babylon,
  burning-sky, fracture-plates, heat-shimmer, forge-base, vocal-veins):
  produce content as designed — silhouettes, smoke, embers, veins —
  none with visible grid artefacts on the test base.

## Subagent's flagged items (verified against actual sources)

The audit subagent flagged 4 layers as potentially-artefact. All
verified by direct inspection as either intentional content or a
latent limitation that doesn't affect the live pieces:

- **`babylon`** (HIGH) — flagged as "vertical dark rectangular columns
  with grid-aligned hard edges". These ARE the intentional Babylon
  city-skyline silhouettes. Not artefacts.
- **`mirror-bloom`** (MEDIUM) — flagged as "jagged petal edges". Petals
  are the intentional gear/bloom geometry. Edges are clean smoothstep
  boundaries.
- **`hemisphere`** (MEDIUM) — flagged as "repeating circular dotted
  pattern". This IS the intentional hex-lattice of oscillators (the
  whole thesis of the dopamine piece). Not an artefact.
- **`callosum-seam`** (HIGH) — flagged as "horizontal color seam at
  image center". Two effects observed: (1) a downbeat lightning bolt
  happened to fire at a y near the centre during the test capture —
  intentional; (2) the SUM tonemap (`col = col / (1 + col * 0.65)`,
  line 118) is applied to `col = seamCol + ...` where `seamCol`
  contains pass-through `u_below`. On a BRIGHT base (the test
  pattern), the tonemap squashes the base toward gray. On a
  near-black base (dopamine's hemispheres on engine clear), the
  tonemap barely changes anything. This is a latent reusability
  limitation, not a bug in the shipped piece. Added an inline
  comment on the source line so future generalization knows.

## Verdict

Every layer in the repo renders correctly. The chaos-warp bug was
unique to that specific combination of `fbm` source + heavy
`u_history` decay + curl operation; nothing else in the codebase
shares those three properties simultaneously. The diagnostic
harness (`pieces/chaos-warp-test/` + `bin/test-all-layers.mjs`)
stays in the repo as triage tooling — any future warp-style or
feedback-style layer should be tested here first.

## Tools added in this audit

- `bin/test-all-layers.mjs` — full-suite runner that auto-generates
  a test piece per layer, renders, extracts last frame. ~15-20 min
  for the full ~40-layer run.
- `pieces/chaos-warp-test/` — permanent diagnostic piece (committed
  in v5 28c9213).
- `.gitignore` entry for `pieces/xtest-layer-*/` so auto-generated
  test pieces don't pollute the repo when the runner is rerun.

## Followups

- The callosum-seam tonemap factoring is real but low-priority — only
  matters if the layer gets reused on a bright-base piece, and the
  fix is a 4-line refactor.
- The `lib/noise.glsl` `fbm()` warning could be louder. Consider
  renaming `fbm` to `fbmGrid` and making `fbmRot` the default in a
  future cleanup, so the unsafe variant requires opt-in.
