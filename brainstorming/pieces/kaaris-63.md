# kaaris-63 — "63 / The Descent"

Track: **Kaaris — "63"** (https://youtu.be/3s0Zzh722BA). Dark, hard
French trap. Heavy 808 sub-bass, machine-gun hi-hat rolls,
menacing/industrial. 123 BPM, A# minor, ~4:17 (257s). Kaaris = "Le
Diable" — the descent is thematically exact.

## Decision

A **first-person infinite fall down a warm-veined throat** — a
log-polar tunnel. The 808 sub-bass **is gravity**: every kick clenches
the throat (radius pulse) and accelerates the fall. Dark volcanic rock
walls veined with ember/wine cracks; hi-hat rolls scroll fine grit down
the walls; downbeats snap the tunnel's rotation; the vocal flow heats
the walls; a deep ember core glows at the vanishing point. You don't
escape — you keep falling.

Chosen because it is the one strong dark-trap thesis the catalog does
NOT already own (see collisions below) and because "the pull of a heavy
808 == gravity == an inescapable descent" is the most evocative mapping
for this exact track. It survives idle by construction (always falling).

## Brief gates (vjay-new-piece §1b + §1c)
```
canonical_ref: log-polar conformal tunnel mapping (classic "infinite
  tunnel" flythrough: angle -> wall-x, 1/radius -> depth) + fbm-veined
  wall texture. Sibling of nothing shipped; nearest catalog kin is the
  domain-warp nebula `well`, but well is a FLAT lensed starfield, this
  is a radial first-person FLYTHROUGH — distinct geometry.
eye_landing_candidates:
  - the vanishing point / glowing throat core
  - the 808 radius-clench (throat swallows on each kick)
  - bright flares racing UP the walls past the camera (keys / hi-hat)
  - the brightest ember vein wrapping the throat
warm_cycle: [near-black, blood-ember, wine, amber, cream]
idle_behaviour: "still falling slowly; walls breathe; ember veins pulse;
  grit drifts down. Visible refresh every few seconds. No cursor/audio
  needed — the fall is autonomous."
architecture: E   # layer stack, multi-input (audio sections + cursor + keys)
arch_rationale: "Closed-form per-pixel log-polar mapping (no state), but
  audio + cursor + keyboard each drive a DIFFERENT visual contribution
  (wall clench/rotation, wall heat, flares, core pull) and the song runs
  a section state machine over the timeline -> Architecture E layer
  stack. Not C: nothing needs cross-frame persistence (scroll/clench are
  closed-form functions of time). Not A: multi-input + distinct layers."
```

## Canonical-name check
**Log-polar / conformal tunnel.** Map screen point `p` (centred,
aspect-corrected) to wall coords `w = vec2( atan(p.y,p.x)/TAU + rot,
TUNNEL_LEN / length(p) + depth )`. Sample a wall texture at `w`; the
`1/r` term is the perspective foreshortening that makes it read as an
infinite receding shaft. Depth increases with time -> falling. The wall
texture is `fbmRot`-veined dark rock with thresholded ember cracks. The
radius clench multiplies `length(p)` by `(1 - clench)` so the whole
throat contracts on a kick. No reduced PDE here, so the
length-scale/saturation traps don't apply.

## Form candidates (road taken + not taken)
1. **Log-polar descent tunnel** ← TAKEN. lib: `math.glsl` (rot2d, TAU),
   `noise.glsl` (fbmRot for the wall vein texture), `interaction.glsl`
   (vjMouseWorldOrZero/vjCursorHeat for steering+heat), `blend.glsl`.
2. Truchet current-maze (industrial labyrinth, current races through
   arcs). Not taken: reads decorative/quilt-like, fights the menace;
   pattern-grid predictability risk. Good future piece.
3. Lichtenberg branching discharge (electric bolts on each 808). Not
   taken: hard to render branching cleanly closed-form; wants DLA/passes.

## Catalog collisions checked (white-space proof)
- molten Voronoi fracture forge -> `we-owe-no-one` (avoid)
- Apollonian gasket -> `apollonian-foam`; Chladni/cymatics -> `cymatic`
- gravity curves space / cursor-mass lensing -> `well`
- black void + bright body / Julia universes -> `eclipse`, `aperture`
- percussion-fires-geometry (ring/cross/sparks) -> `throb`
- boids/flocking -> `swarm`, `murmuration`, `shoal`
- kaleidoscope -> `prism`; coprime-rate SDF layers -> `strata`
None is a first-person radial flythrough. Tunnel = white space.

## Layer stack (coupling DAG)
1. **throat-base** (blend normal) — THE LEAD. Log-polar wall: fbmRot
   veined dark rock + ember cracks, falling scroll, 808 radius-clench,
   downbeat rotation snap, vocals -> wall heat, section state machine
   (intro slow/dark -> drop violent/fast -> breakdown stalls -> verse2
   resumes). Always-on band: `max(wall*0.30, crack_accent)` so walls
   never go fully dark. Reads u_mouse for steer + heat.
2. **core-glow** (blend add) — the vanishing-point ember pull. Pulses
   with bass, brightens with vocals, a slow swirl. The focal eye-land.
3. **flares** (blend max) — bright sparks/flares that race UP the walls
   past the camera. Fired by hi-hat (drums stem) + keyboard key-events
   (each key = a flare at that angle). Cream-hot, short-lived.
4. **grit** (blend screen) — fine fast-scrolling grit/dust on the walls,
   driven by the drums-stem hi-hat. The always-on sub-beat shimmer.
5. **vignette-grain** (blend replace) — warm vignette, bloom on the
   hottest pixels, 1/f grain, Reinhard tonemap. Frames the descent.

Coupling: throat-base publishes nothing (closed-form); all layers read
their own audio/section uniforms + u_below/u_history. core-glow and
flares composite over throat-base; grit shimmers on top; vignette-grain
post-processes the whole stack. Distinct soloed reads: walls (texture),
core (central blob), flares (streaks), grit (high-freq fuzz).

## Inputs
- bass stem / u_audio_kick -> throat clench + fall acceleration + core pulse
- drums stem (hi-hat) -> grit scroll speed + flare spawn rate
- vocals stem -> wall heat + core brightness (the flow lights the throat)
- other stem -> wall vein contrast / surge
- u_downbeat -> tunnel rotation snap (visible phase-lock)
- u_beat_phase -> per-beat wall-rock micro-rotation
- u_section_id / u_section_progress / u_to_section_change -> state
  machine + pre-tension throat-squeeze before drops
- cursor (u_mouse) -> steer the fall off-axis (lean into the wall) +
  vjCursorHeat local wall glow
- keyboard (u_key_event[15]) -> drop flares that race up the throat

## What I don't want
- FFT-bar literalism. No clean concentric rings (that's `throb`).
- A clean repeating tunnel ring -> reads as a screensaver. The walls
  must be turbulent fbm so each "pass" differs (unpredictability gate).
- Cool intrusions. Strictly the warm cycle above.
- All-mid-warm collapse: keep cream flares/core hot-spots on near-black
  rock for real contrast.
- u_history-heavy feedback (noise-artefact + white-static traps). Scroll
  + clench are closed-form functions of time; u_history used lightly at
  most (flare trails).

## Open questions (know only after it runs)
- Does the `1/r` core blow out to white? (clamp + Reinhard in vignette)
- Is the fall speed legible-but-not-nauseating at 123 BPM?
- Does the clench read as "the throat swallowing" or just a zoom pulse?
- Three-window unpredictability: do intro / drop / breakdown actually
  show different event vocabularies, or just different brightnesses?
