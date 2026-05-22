# watershed

**Thesis.** A basin-of-attraction field — every pixel iterates
Newton's method on a polynomial whose roots are moving wells; its
colour is the *fate* of that pixel: which root it converges to (hue)
and how fast (luminance). The boundary between basins is an intrinsic,
crisp, infinitely-detailed Wada fractal that writhes as the roots
move. A watershed is literally the line where which-basin-you-drain-
into flips — the piece is named for its own boundary set.

From the 2swap study (`brainstorming/inspirations/2swap-refs.md`,
`brainstorming/techniques/basins-of-attraction.md`). The one move
stolen: *the image is a map of fate over phase space, and the
mesmerizing structure was emergent, never authored.*

## Decision

Build it. Theme-only (self-playing, audio-reactive if fed). The cursor
*carries a root* — drag it and the Wada partition reorganizes around
your pull. The 15-key synth *places roots* — the 3 most-energized keys
become roots on an outer ring; you play the fractal like an
instrument. Audio bass breathes the orbiting roots' radius.

**The journey — gravity → Newton.** The brief named 2swap's *Gravity
Basins*, so v1–v4 built the literal thing: an N-body / magnetic-
pendulum basin map. Four honest, diagnosis-driven attempts (heavy
drag → Voronoi blobs; pendulum + settle-gate → void dust; classify-
always → spring fur; spread magnets → marbled paper) all converged on
a soft *marbled* field, never the crisp Wada filigree. Root cause is
structural: a realtime fragment shader at half-res with amortized
~110-step integration cannot resolve the dense filigree that makes
2swap's offline render mesmerizing. Per `feedback_iteration_discipline`
(3+ attempts = wrong architecture), stopped and handed Louis the fork;
he chose the **Newton-fractal pivot** (2026-05-22). Newton basins are
*intrinsically* a crisp Wada fractal — no chaos to coax, and ~3×
cheaper. Same thesis, same 2swap basin-of-attraction lineage
(`basins-of-attraction.md` Recipe 2), same interaction model.

**Architecture: C (passes).** Started E (layer-stack); switched to C
because the basin field wants a persistent ping-pong buffer for
amortized recompute (1/4 of pixels per frame — the map is stable, so
staleness is invisible), and layer-engine v1 has no persistent
per-layer publish (`runtime.mjs:1098`).

## Brief gates (vjay-new-piece §1b + §1c)

```
canonical_ref: "Newton fractal — basin of attraction of Newton's
  method on a moving-root polynomial. basins-of-attraction.md Recipe 2.
  Sibling in canonical-pieces.md: Julia / escape-time fractal."
eye_landing_candidates:
  - bright lake interiors — one per polynomial root
  - the crisp fractal filigree of the Wada basin boundary
  - the glowing root cores
  - the downbeat ring expanding from the dominant root
warm_cycle: [near-black, wine, ember, amber, gold, cream]
idle_behaviour: "3 roots orbit on an internal clock; the basins
  reorganize from that motion alone — no cursor/audio/keys needed.
  Cursor root absent when u_mouse idle; key-roots absent when idle."
architecture: C
arch_rationale: "Newton iteration is single-pass per pixel, but a full
  basin recompute every frame is heavy; the field persists in an
  rgba16f ping-pong buffer refreshing 1/4 per frame (2x2 Bayer). The
  map is stable (roots move slowly) so staleness is invisible. Not E:
  layer engine has no persistent publish. Not A: the amortization
  needs a buffer."
```

## Canonical-name check

**Newton fractal.** Newton's method for a root of `p(z)` iterates
`z ← z − p(z)/p'(z)`. The set of start points converging to a given
root is that root's *basin of attraction*; with ≥3 roots the basin
boundary is a *Wada* set (every boundary point borders all basins) —
intrinsically, provably fractal. For roots `r_i`, the log-derivative
form `p'/p = Σ 1/(z−r_i)` gives `z ← z − 1/Σ(1/(z−r_i))`, which needs
no polynomial expansion — so the roots are free to move every frame.

Per-pixel recipe is Recipe 2 of `basins-of-attraction.md`. ~48-iter
cap, early-out on convergence; hue = root id, luminance = 1/iters
(escape-time). render scale 0.7 for the basin pass.

## Passes (architecture C)

1. **basin** (`sim.frag`) — amortized Newton-fractal basin map.
   rgba16f ping-pong at 0.7 scale; recomputes 1/4 of the field per
   frame (2×2 Bayer), light temporal smoothing to soften the dither.
   Up to 7 roots: 3 orbiting (ember/amber/gold), cursor (cream), 3
   keyboard (top-3 of 15 keys, wine→gold by pitch).
2. **display** (`shader.frag`) — substrate haze (fills the deep-
   boundary void) + the basin buffer + root glow cores + a downbeat
   ring that radially displaces the basin sample + sub-beat shimmer +
   reinhard. Full-res, every frame.

Clocks (polyrhythm): `u_time` (substrate drift + root orbit),
internal-bar phase (downbeat ring), internal-beat (core pulse),
`u_audio_bass` (orbit-radius breath), `u_audio_high` (shimmer).
No track → bar/beat synthesised from `u_time` at 120 BPM.

## What I don't want

- A smooth gradient. The Wada filigree at boundaries is the whole
  point — if the squint sees a soft blend, the piece is a lie
  (taste.md Structure-honesty, basin clause).
- All-warm-mid soup. The dark fractal veins + near-black deep-boundary
  void carry the dark end (warm-on-warm collapse — `tasks/lessons.md`).
- A static map. The roots must move: orbit, cursor, keys, bass.
- Keyboard as decoration. Each key places a root at a *distinct*
  position — per-key distinctness, not one effect.

## Open questions

- Does the Newton basin read as a crisp fractal at 0.7 scale, or does
  the amortization dither muddy the boundary? Know after the inspect.
- Do 4–6 simultaneous basin hues stay distinct in warm space? If they
  blur, lean harder on the escape-time luminance channel.
- Does dragging the cursor root reorganize the partition legibly as
  *agency* within 3s and two moves (readability probe)?
