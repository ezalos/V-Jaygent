# glass-figure

## Thesis

A response to Philip Glass — *Metamorphosis Two* (Solo Piano, 1988). Seven
minutes of a five-chord descending arpeggio, looped with imperceptible
harmonic drift, ending on a single resolved chord. The piece is *about*
slow, inevitable drift inside an apparent repeat — you never catch it
changing but by minute five it's a different piece, and then it arrives.

Visual: **fivefold quasicrystalline interference**. Five plane waves at 72°
angles, each drifting slowly in phase and wavelength. Their sum is a 2D
quasiperiodic diffraction pattern — the mathematical signature of Penrose
tilings and icosahedral quasicrystals. Fivefold symmetry forbids a true
periodic lattice; the pattern is dense with non-repeating structure at every
scale. That's the image of Glass's piece exactly: looks like a loop, isn't.

## Decision

Form 1 (below). Single-pass shader, no multipass state. The arc is driven
by `u_time` over 420 seconds (Glass's canonical duration is ~7 min).

## Form candidates

1. **Five plane waves at 72°, summed.** `Σ cos(kᵢ·p − ωᵢt + φᵢ)` for
   i=0..4, with kᵢ on a fivefold star and small incommensurate drift in
   ω and |k|. Dense, fractal-looking, genuinely fivefold-symmetric without
   imposing a rigid rosette. Cheap — five cosines per pixel + an octave or
   two of detail. Leans on `lib/math.glsl` (TAU) and `lib/tonemap.glsl`.
2. **Explicit Penrose tiling (deBruijn cut-and-project).** Geometrically
   legible but hard-edged in a way that would fight the piano's legato.
   The diffraction image IS the audible thing; the tiling is its ghost.
3. **Five orbiting masses in a shared potential.** Literal five-fold, but
   leans toward illustration (balls on a track) rather than structural
   honesty. Skip.

Form 1 is the right call. Quasicrystal interference has the property I
want: it's the *image* of incommensurability, not an illustration of it.

## Five voices → one voice (the arc)

Glass's piece arrives at a single resolved chord at the end. Mirror this:
each of the five waves has its own very slow amplitude envelope
(incommensurate periods, 41s / 59s / 73s / 89s / 107s). They start equal.
Over the 7 minutes the five envelopes drift apart; by the last 30s, four
have decayed and one dominates — the field converges to a **near-standing
wave from a single direction**. That resolution is the visual analogue of
Glass arriving at one chord. Final 2s: warm flash, fade to black.

A subtle ~72 BPM (Glass's tempo) chord-pulse lives inside the global
exposure — a five-beat cycle of (1, 0.92, 0.88, 0.95, 0.90) repeating.
Audible in the shader as a gentle breathing, not as a beat drop.

## What I don't want

- **Rigid rosette.** The whole point of quasicrystals is they aren't
  symmetric in the periodic sense. No `atan2` petal count. The fivefold
  must emerge from the wave sum, not be stamped.
- **Motion-sickness drift.** Waves should drift slowly — tens of seconds
  per visible phase cycle on the slowest axis. A fast-scrolling interference
  pattern reads as cheap VJ static.
- **Literal illustration.** No piano keys, no arpeggio diagrams, no
  five dots at 72°. The image is the diffraction pattern, not its legend.
- **Hue excursion.** Warm only. Luminance does all the lifting. A piece
  this mathematically pure cannot afford rainbow kitsch.

## Bindings

Theme-only (no audio). `u_time` gates the whole arc. `u_mouse` nudges the
wave-sum origin so the cursor lets the viewer slide the quasiperiodic
pattern around — non-invasive, optional. Off-screen when idle.

## Palette

Inline: amber cycle through (near-black, burgundy, ember, amber, cream-warm).
Contrast by luminance. Reinhard tone-map to keep peaks warm.

## Arc (u_time gated, duration 420s)

- **0–60s**: five waves equal, full field dense with interference. Feels
  "stationary" though it is already drifting.
- **60–300s**: envelopes spread. Periods of dominance shift between
  voices. Viewer registers change without being able to name it.
- **300–390s**: one voice becomes dominant, others recede. Field begins
  to take on a directional grain.
- **390–418s**: four voices near-silent. One voice + its harmonic
  overtones carry the field. Near-standing wave from a single direction.
- **418–420s**: final chord lands — brief warm flash, fade to black.

## Open questions

- Do the five envelopes, at those periods, actually read as "drift" to a
  cold viewer or do they just look like noise? Critique on v1.
- Does the base interference need a warping term to hide the `cos()`
  regularity, or is the quasiperiodicity itself irregular enough?
- The single-dominant end state — will it read as "arriving" or
  "breaking"? Test by rendering a 5s clip from t=400s separately.
