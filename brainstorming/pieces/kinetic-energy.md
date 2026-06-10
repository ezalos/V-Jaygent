# kinetic-energy — velocity is light

> **Built v1 — 2026-06-10.** Shipped as `pieces/kinetic-energy/` on Jon
> Hopkins "Emerald Rush". Audit 0-fail (all 6 song-level uniforms drive
> geometry). Two build lessons worth keeping:
> 1. **Deposition must be speed-gated** (`∝ speed²`, no floor) or the trail
>    buffer saturates to a full-frame gold wash — the
>    `feedback_density_saturation` trap. I hit it by tuning by feel.
> 2. **Iterate against the CLIP, not stills.** Seeking resets the trail
>    accumulation, so stills *under-show* saturation; the continuous clip is
>    the only honest read of a feedback-buffer piece. An energy-scaled decay
>    boost also backfired — it lengthened trails exactly at the peak where
>    coverage was already highest. Commit to sparseness (fewer particles,
>    bounded decay) up front.

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

**Build correction (2026-06-10, discovered while building v1):** the
V-Jaygent runtime is **fragment-gather only** for arbitrary particles —
the lone vertex-scatter pass (`kind: scatter`) is hardcoded to Clifford /
chaos-game orbits (`studio/runtime.mjs`). So you canNOT draw custom
particles as point sprites. The working pattern is **swarm-style**: a
fragment display/trail pass that *gathers* nearby particles from a
spatial-hash, not a vertex pass that *scatters* them. `pieces/swarm/` is
the template (1000 boids).

Four passes (`reference_passes_vs_layers`, `feedback_scatter_requires_passes`):

1. **`simulate` (ping-pong rgba16f, fragment).** One texel = one
   particle, `xy = pos`, `zw = vel`. `vel += (curlVel(pos) + cursorForce
   + audioImpulse)*dt; pos += vel*dt;` strong damping so speed = "driven
   now". ~2304 particles (48×48) — the trail buffer carries the density,
   so you don't need 65k.
2. **`bins` (rgba16f, fragment).** Spatial hash (48×48, 4 IDs/cell) so the
   trail pass gathers a local 3×3 neighbourhood instead of all particles.
3. **`trails` (ping-pong rgba16f, fragment).** `out = texture(trails)*decay`,
   then gather the 3×3 bin cells and splat each particle with
   `lum = speed²` on a warm ember→amber→cream ramp, additive. decay
   ~0.92, lifted by energy/downbeat (`decay ≠ half-life`).
4. **`display` (screen, fragment).** Cheap radial-tap glow + drifting
   macro hot-zones + chiaroscuro vignette + ACES tonemap. (Full pyramid
   bloom of `techniques/luminous-bloom.md` is the upgrade path.)

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
