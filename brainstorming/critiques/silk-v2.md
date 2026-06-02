# silk v2 — fractal-flame works (ship-it)

After silk-v1's structural-rethink verdict
(`brainstorming/critiques/silk-v1-blocked.md`), v2 rebuilt against
**Path A** — extending the V-Jaygent runtime with a scatter-pass
primitive, then porting the piece to `passes:` architecture.

## What changed

- **Runtime extension** (`studio/runtime.mjs`): new pass `kind: scatter`
  that streams CPU-iterated orbit points into a vertex buffer per frame
  and rasterises them with additive blending into rgba16f. Includes
  built-in `clifford` and `chaos-game` orbit iterators with state
  preserved across frames. Decay step + scatter step per pass. Drivers
  for orbit params (lerp, table-lookup, step-piecewise).
- **Display pass** (`pieces/silk/display.frag`): reads both
  accumulators, log-tone-maps, then warm-cycles
  near-black → wine → rust → amber → cream by luminance.
- **Pieces meta.yaml**: 2 scatter passes (clifford + chaos-game) →
  display pass. Clifford `(a,b,c,d)` driven by audio stems; chaos-game
  `(n,k)` driven by `section_id` table-lookup
  `[3,5,6,7,5,3,5,6]` / `[0,2,2,2,2,0,2,2]`.

## v2 inspect-music frames

Five anchor frames, headless render via `bin/inspect-music.mjs`:

| section  | n / k | observed |
|---|---|---|
| intro (t=1.0)     | 3, 0 | Sierpinski triangle (golden cream) overlaid on a Clifford filament whirl |
| verse (t=41.1)    | 5, 2 | Pentagonal lace + Clifford filament — denser, more intricate |
| pre-peak (t=150.4)| 6, 2 | Hexagonal flower with curl-shaped Clifford arches behind |
| peak (t=165.3)    | 7, 2 | Symmetric luminous heart-form — densest accumulator |
| outro (t=450.0)   | 5, 2 | Returns to pentagonal — outro recapitulation |

All five hit the **cream-on-near-black** mandate. The fractal-flame
"fine threadlike density plot" aesthetic is achieved. Section snap is
visible and unmistakable. Clifford filament breathes continuously
through the chaos-game scaffold.

## Scoring against taste.md (rough self-grade)

| dimension | score | note |
|---|---|---|
| palette   | 4.5/5 | warm cycle reads correctly, cream peaks land |
| composition | 4/5 | centred — could use macro brightness envelope |
| motion    | 4/5 | scatter passes paint continuously, section snaps visible |
| intensity | 4/5 | dense regions hit cream; could push further on peak |
| depth     | 4.5/5 | dual algorithms layered = real depth |
| form & ending | 4/5 | piece arcs from sparse intro to dense peak back to sparse outro |

Mesmerizing probes: eye-landing (Sierpinski / pentagon / hex centroids
all read), prediction (chaos-game has structure; Clifford continually
morphs — hard to predict), squint (clear silhouettes), hue-drift (warm
cycle), mystery (the n-snap moments).

Verdict: **ship-it**. Not chef-doeuvre yet — the still frames are
beautiful but the live experience needs to confirm motion-quality and
that the Clifford-attractor morph reads as alive (the inspect frames
are stills and under-grade motion per
`feedback_stills_under_grade_motion`). Recommend `/vjay-iterate` for
fine-tuning if Louis wants more polish.

## What this unlocked beyond silk

The scatter-pass primitive (`studio/runtime.mjs`) is now part of the
engine, reusable by future pieces:

- Strange-attractor variants (de Jong, Aizawa) — just add to ORBIT_FNS.
- Particle systems (smoke, mist, plume) — same vertex-shader scatter
  with different orbit kernel.
- Boids-style flocking — CPU sim outputs N agent positions, runtime
  rasterises them. Drops the layer-engine murmuration failure pattern.

This is the runtime extension VISION.md §"Open questions" listed as
"N-body gravitational lensing — requires transform-feedback particles
— first non-fragment-shader GPU work in the engine." We didn't go all
the way to transform feedback, but we did break the fragment-shader-
only ceiling.

## Caveats

- `points: 32768` per scatter pass × 2 passes = 65K vertex calls per
  frame. Runs at 60 fps on TheBeast GPU. Mobile GPUs may struggle —
  needs verification. If a phone tanks, drop `points` to 8192 each.
- The orbit iterators use `Math.random()` for chaos-game vertex
  selection — non-deterministic. Inspect frames will differ slightly
  run-to-run. Fine for headless grading; if reproducibility matters
  later, swap to a seeded PRNG.
- The driver system added to `resolveOrbitParams` only handles the
  forms `silk` needed (lerp, table). More elaborate drivers (e.g. on
  `beat_phase`) need extension.
