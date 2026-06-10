# kinetic-energy — velocity is light

## One-line concept

A GPU particle field advected by curl-noise; colour is driven purely by
`speed²` (literal kinetic energy) on a cream→white-hot ramp over
near-black. Fast = bright + long streak, slow = dark + still. The beat
makes particles *wind up then burst*.

## Why this piece

Seeded by Strano's "Kinetic energy" (`inspirations/x-finds-2026-06-10.md`).
The thesis is unusually clean: **make the viewer feel the energy of
motion.** Energy is the subject, not a side effect — which gives the
critic an unambiguous claim-check.

## Architecture — `passes:`, not `layers:`

Discrete particles + persistent trails need scatter + ping-pong
(`reference_passes_vs_layers`, `feedback_scatter_requires_passes`):

1. **Sim (ping-pong, fragment).** Two state textures (pos, vel),
   256×256 ≈ 65k particles. `vel += (curlFlow(pos) + cursorForce +
   audioImpulse)*dt; pos += vel*dt;` recycle on age/out-of-bounds.
2. **Splat (vertex scatter → RGBA16F).** `texelFetch` position, draw
   points, `gl_PointSize = mix(1, 6, speedN)`, emit `cream * speedN*speedN`
   additively. Optional: extrude a 2-vertex streak along `vel`.
3. **Trail (ping-pong, fragment).** `out = texture(trail,uv)*decay +
   splat;` decay ~0.94, **gated higher for fast particles** so only
   energetic ones streak (`decay ≠ half-life` — runtime caveat).
4. **Post.** Pyramid bloom + ACES/Reinhard tonemap + vignette →
   chiaroscuro. (See `techniques/luminous-bloom.md`.)

## What makes it read *energetic* (not just moving)

The decisive levers, in priority order:
1. **Anticipation → burst on the beat.** Converge particles (wind-up),
   then explode outward on the downbeat (release). Biggest "energetic"
   upgrade *and* satisfies `feedback_visual_phase_lock` — geometry, not
   brightness.
2. **Variable speed (slow-in/slow-out).** Never advect at constant
   speed; ease the global flow rate (`feedback_animate_the_landscape`).
3. **Speed-gated trail length.**
4. **`speed²` luminance + bloom** exaggerates the fast tail. Push it.

Three timescales (`feedback_three_timescales_of_liveness`): section
boundary flips the curl sign / re-seeds the field; beat drives the burst;
always-on per-particle velocity jitter for sub-beat shimmer. Verify on
`clip.mp4` — sub-beat shimmer is invisible in stills.

## Multi-input coupling (the default)

- **Cursor** = attract/repel force into the sim (`∝ 1/dist`); dragging
  stirs the flow — cursor as instrument. Make the bloom radius react too,
  so input isn't ghettoised in one layer (`feedback_per_layer_interactivity`).
- **Keyboard** = each key a velocity impulse / emitter burst at a screen
  location, or shifts curl frequency (turbulence up/down).
- **Audio** = RMS → flow speed + bloom; beat/downbeat → radial burst;
  stems if available (drums → bursts, bass → flow speed —
  `reference_audio_analyzer_stems`).

## Palette

Cream→white-hot over near-black (Strano's chiaroscuro = my contrast
rule). Speed→luminance is monotonic, so no cyclic-palette blink risk.
Add 1–2 wandering hot-zones for a macro brightness envelope
(`feedback_macro_composition_envelope`).
