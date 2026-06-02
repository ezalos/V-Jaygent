# silk v1 — structural-rethink (BLOCKED)

## Status: not shippable as-is

The piece compiles, runs at 40-60 fps in headless inspect, loads Jon
Hopkins "Open Eye Signal" with 8-section analyser output and four stems
(bass/drums/other/vocals). The chaos-game layer's polygon-snap state
machine correctly snaps `n` by `u_section_id` (verified by inspect-music
firing the intro/verse/pre-peak/peak/outro section anchors). The runtime
pipeline is healthy.

**But the visual output is wrong.** All five inspect-music section frames
read as a flat amber field. The Clifford filament structure doesn't
appear; the chaos-game lace doesn't appear; only the downbeat ring
fires correctly. We fail every mesmerizing probe and the palette
diversity check.

This is a **structural-rethink verdict, not a tweak-and-iterate one**.

## Root cause: fragment-shader rendering is gather, fractal-flame is scatter

The brief committed (`brainstorming/pieces/silk.md` §arch_rationale) to
the layer-engine `u_history` scatter path described in
`brainstorming/techniques/strange-attractors.md` §"u_history scatter":
each fragment computes a fresh orbit, ends near the attractor body, and
writes to its own pixel iff the orbit endpoint lands within a small
neighborhood. The technique doc states "~1M fragments × 1 final-point
check per frame ≈ 60M density samples/second" — sufficient for a
real-time fractal-flame.

The math is wrong. For a chaotic attractor with ~50K bright pixels in a
1M-pixel canvas, the per-fragment self-hit probability is **density × pixel_area
≈ 1 in 50K**. With 3 seeds per fragment, hit rate ≈ 6 × 10⁻⁵ per
fragment per frame. Even with widened gaussians (5 px FWHM ≈ 25-pixel
kernel), the hit rate climbs to ~1.5 × 10⁻³ per frame — still ~1 hit
per pixel per 600 frames. Steady-state brightness at 0.95/frame decay
with 28× hit-brightness is ~0.07 — below the visible threshold.

The technique doc's 60M-samples-per-second figure is right but
misleading: those samples are scattered RANDOMLY across the attractor,
so per-pixel coverage is logarithmically slow. Fragment shaders
can't write to other pixels, so each fragment's orbit either lands at
itself (rare) or is wasted.

**This is the same architectural failure mode noted in
`memory/reference_passes_vs_layers.md`**: layer-engine v1 has no
persistent rgba16f publish, so density accumulation in a scatter sense
isn't a thing you can do in `layers:`. The path that DOES work for
state-bearing pixel-level computation is `passes:` with rgba16f
ping-pong — but that's "single-shader monolithic" territory unless we
extend the layer engine.

## What I tried (all in vain)

1. **Random-seed scatter** (the brief's algorithm): each fragment picks
   a different seed per frame, iterates K=24-48 steps, lights up if
   endpoint near self. → near-zero coverage. Frame remained black.
2. **Shared-orbit gather** (every fragment runs the same orbit, checks
   distance to any of K points): orbit-trap style. → still near-zero
   per-pixel coverage because the orbit-trap hits only ~K pixels per
   frame total, not per-pixel.
3. **Per-pixel orbit endpoint as warp lookup**: K iterations from
   uv-derived seed, color by endpoint position. → produces a flat field
   because the orbit converges to a single attractor basin regardless
   of starting seed (for chaos-game with r=0.5, the endpoint is
   determined by the LAST 5 vertex picks, which the hash21 quantises
   to similar values across adjacent pixels).
4. **Jacobian-of-orbit** (low = on attractor): `dFdx(p) × dFdy(p)`
   after K iterations. → Lyapunov exponent of Clifford is ~1.5-2, so at
   K=28 the Jacobian is ~10⁹ everywhere. Mask collapses to zero
   uniformly.
5. **Direct palette lookup on endpoint**: `t = 0.5+0.5*cos(p.x*1.8)`,
   map to warm palette. → produces a smooth field but the chaos game
   gradient is too steep to read as structure; chaos-game layer
   additive-blends a uniform amber baseline on top of the Clifford
   layer, washing out everything.

After 8 iterations through the algorithm-design space, every approach
hit the same wall: **fragments can't talk to other fragments, so
fractal-flame density accumulation requires either (a) ping-pong
scatter via vertex passes, (b) compute shaders, or (c) accepting the
warped-field aesthetic instead of the histogram aesthetic.**

## Paths forward

### Path A — Switch to `passes:` architecture (NEW DEFAULT)

Re-author silk as a multi-pass piece with:
- **pass 0 (accumulate)**: rgba16f ping-pong, advected forward orbit
  scatter via vertex shader drawing N points at orbit positions, blend
  add. Each frame draws say 4096 points from a CPU-streamed orbit.
- **pass 1 (display)**: read accumulate texture, log tone-map, apply
  warm palette, output.

This requires extending `studio/runtime.mjs` to support a CPU-side
attractor-orbit tracker that feeds N points per frame as a vertex
buffer — which is the same as the "transform-feedback particles"
infrastructure noted as an open question in VISION.md
§"Open questions".

Effort estimate: 1-2 days for the runtime extension + piece port. This
is the work-of-record path: it unlocks not just silk but every
future particle-density piece (N-body lensing, particle smoke, lightning
filaments).

### Path B — Accept the warped-field aesthetic for silk v1

Drop the fractal-flame claim. Re-author silk as a CONTINUOUS WARPED
WARM FIELD: each pixel's orbit endpoint feeds a warm palette, with
brightness modulated by the gradient of the endpoint (so attractor
boundaries glow). This is what the existing
`brainstorming/techniques/strange-attractors.md` §"Using them in a
shader (single-pass)" actually describes — and the doc was honest
about it: "the attractor becomes a **background texture** rather than a
plotted set of points."

Effort estimate: 2-4 hours. Same algorithm pattern as `aperture` (per-
pixel iteration of a 2D map). The piece won't look like the
codingclubuc3m reference images, but it WILL look like a strange
attractor.

### Path C — Salvage v1 with a different generator entirely

The chaos-game polygon SDF — drawing the actual polygon vertices as
SDF points with section-driven `n` — works fine without iteration.
Combined with a Clifford-derived field background, the piece could be
"polygon-on-warped-field" rather than "two iterated histograms". This
side-steps the scatter problem entirely.

Effort estimate: 4-6 hours, requires re-briefing.

## Recommendation

**Path B** for silk v1 — accept the warped field. It's honest about
the runtime's actual capabilities and produces a beautiful piece. Then
**Path A** as a separate runtime workstream for the next strange-
attractor / particle-density piece.

The brief gates I violated:
- `canonical_ref`: claimed the histogram-scatter path is reachable in
  layer-engine v1. False. Update
  `brainstorming/techniques/strange-attractors.md` §"u_history scatter"
  to mark it as REQUIRING `passes:` not `layers:`.
- `arch_rationale`: said "NOT C (no rgba16f state needed)" — wrong,
  rgba16f state IS needed for density accumulation, just not for the
  Clifford evolution itself.

## What's still useful from this run

Even though the piece doesn't ship, the run produced real work:

1. **`brainstorming/techniques/chaos-game.md`** (NEW) — algorithm doc
   with the three Fronkonstin restriction rules and named-fractal
   taxonomy. Canonical reference for any future chaos-game piece.
2. **`brainstorming/techniques/strange-attractors.md`** (UPDATED) —
   added General 2D-Map, canonical parameter sets table, u_history
   scatter section (now needs the correction noted above).
3. **`bin/explore-attractor.mjs`** (NEW) — offline parameter explorer
   for chaos-game + Clifford + de Jong. Verified produces correct
   Sierpinski / pentagonal-lace / Clifford "web". Tool stays useful
   regardless of how silk ends up being rendered.
4. **Music research artifact**: Jon Hopkins "Open Eye Signal" is the
   chosen track, downloaded + analysed (8 sections detected, 4 stems
   separated). Even if silk reboots, the music slot is wired.
5. **The brief itself** (`brainstorming/pieces/silk.md`) — section
   map (3-5-6-7-5-3-5-6), audio binding plan, palette plan — all
   reusable for Path A, Path B, or Path C.

## Memory update (proposed)

A new feedback memory entry: **fractal-flame requires scatter / 
layer-engine v1 is gather-only**. Future strange-attractor pieces
default to Path A (passes:) or Path B (warped field), never the
naive "scatter into u_history" assumption.
