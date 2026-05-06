# break-on-through-to-the-other-side

The Doors — *Break On Through (To the Other Side)*. 1967. 184.6 BPM,
A major, 147s, 4 beats/bar, 108 bars, 7 energy-defined sections.

## Decision

**Architecture:** multi-pass (`passes:`) with two ping-pong simulation
buffers + one display shader. Layer-engine architecture is the project
default but the brief demands three real coupled physics with their
own state, and the layer engine v1 has no per-layer persistent
publish — `passes:` is the proven path (`pieces/breath`, `ferment`).

**Multi-input is preserved:** cursor + keyboard + audio + section state
all wired into the display + simulation passes. The "boring single-
shader" failure mode is *single-shader + single-input*; this piece is
multi-pass + multi-input + multi-physics.

## Thesis

"Break on through" rendered as a **permeable phase-boundary
membrane**. A Gray-Scott reaction-diffusion field lives in the
chaos crescent (f≈0.046, k≈0.062) — the regime where spots and
spirals form, shrink, merge unpredictably. A wave-equation height
field shudders across the same canvas, sourced by snare hits, key
presses, and cursor velocity. Wave gradient + a curl-noise
divergence-free flow stir the RD species past their saddle points.
Every "break-through" moment — a beat, a key press, a cursor
gesture — is a kick across the threshold that ignites a new spiral
or annihilates a spot.

No portal. No door. No wall-shatter. Instability made visible.

## Three interacting physics

1. **Gray-Scott reaction-diffusion** (rgba16f ping-pong, half-res, 4
   sub-steps/frame). Two species `u` (substrate) and `v`
   (activator) coupled by `u·v²`. Parameters in the chaos crescent
   so structures barely cohere. Cursor drips activator. Bass
   modulates the feed rate. Each held key boosts feed at key
   x-position.
2. **Wave equation** (rgba16f ping-pong, half-res, FDTD Verlet
   integration). State packed (height, velocity, padding,
   damping). Snare drops impulse rings at random positions;
   downbeats drop a centred ring; key presses drop sustained
   sources at the key's x-position; cursor velocity emits a
   continuous ripple track. Wave gradient becomes a force.
3. **Curl-noise advection** (computed in the RD sim each frame as a
   shear field). Divergence-free turbulence at audio-coupled scale
   stirs the RD species. The wave-field gradient ADDS to the curl
   field (so beats literally push fluid lines). Mid-band scales
   advection magnitude. Cursor drag biases flow direction.

**Coupling DAG (bidirectional):**
- wave height → wave gradient → adds to curl-noise force → advects RD
- RD activator → modulates wave damping (high `v` damps waves; spirals
  become standing-wave attractors)
- both → drive the display palette + post-process strata

## Display strata of grain

One display shader, layered composition *inside it* — strata at four
scales coupled by content, not stacking:

- **Coarsest:** kaleido mirror around cursor with section-coupled
  fold count (6 / 8 / 12-fold cycling per section). Engages at
  high-energy sections; dissolves at low-energy.
- **Coarse:** RD species mapped to a psychedelic two-pole palette
  (deep magenta → indigo → cyan for `v`, mirrored to gold → ember
  → cream for `u`). Reinhard tonemap.
- **Medium:** wave height as displacement on the palette — the
  whole picture *breathes* with the wave. Refraction-style channel
  offset proportional to `|grad(height)|` adds prismatic dispersion
  at wave fronts (the "membrane" tell).
- **Fine:** luminous motes — sparse hash-driven points that flow
  along the curl + wave gradient. Density scales with `u_audio_high`,
  `u_audio_cymbal`, downbeats spawn a centred burst.

## Multi-input bindings

- **Cursor** — drips activator into RD; emits a ripple track in the
  wave field (cursor velocity → wave source); positions the
  kaleido axis.
- **Keyboard** (`keyboard_synth: true`) — each held key boosts RD
  feed at key.x AND drops a sustained wave source at key.x.
  Pressing a key fires a snare-shaped impulse + spawns a glow ray
  in the display. Black keys vs white keys map to opposite RD
  species (white = +activator, black = +substrate-replenish), so
  playing chords builds visible balance/imbalance.
- **Audio** —
  - bass → RD feed-rate modulation
  - mid → curl-noise advection magnitude
  - high → motes density
  - kick → centred wave impulse + brief F-rate spike
  - snare → random-position wave impulse
  - cymbal → motes burst
  - downbeat → centred ring + RD activator pulse at centre
  - section_progress → kaleido fold count + palette polarity
  - song_progress → slow shift of palette anchors
  - audio_playing → gates seeding (silent → field decays)

## Section arc (7 sections)

| # | t        | label (heard) | physics state                          |
|---|----------|---------------|----------------------------------------|
| 0 | 0–1s     | hush          | RD seed forming, waves silent          |
| 1 | 1–11s    | bossa-rock intro | spots emerging, ripples on snare    |
| 2 | 11–27s   | chorus 1      | full chaos: kaleido on, palette saturates |
| 3 | 27–37s   | verse 2       | dip — kaleido off, RD slows           |
| 4 | 37–90s   | long body     | peak: 12-fold kaleido, dense motes    |
| 5 | 90–100s  | breakdown     | dip — only RD + faint waves           |
| 6 | 100–147s | outro climax  | 6-fold kaleido + palette polarity flip + final fadeout |

## Palette

Two coupled poles, NOT a warm-only family:
- v-pole (activator): magenta `#d12a7a` → violet `#5a2bb0` → cyan `#1ec8ff`
- u-pole (substrate): gold `#f7b733` → ember `#d65a1e` → cream `#fff2c4`
- Section 6 (outro) inverts polarity briefly — a literal "to the
  other side" colour beat.

This violates the warm-only convention. That's intentional: psychedelia
1967 was emphatically NOT warm-only. The Joshua Light Show used the
full visible spectrum; oil-on-water dye separation happens by
immiscibility, not gradient. The piece asserts its own palette over
the project default.

## What I don't want

- Literal portal/door/wall imagery. Refused.
- BPM-synced everything. Per Boyle: "synaesthetic desynchrony" —
  RD evolves on its own clock; only beat events PERTURB it, they
  don't drive it.
- FFT bars. Forbidden by VISION; reaffirmed.
- Smooth lava-lamp morphing without topological events. The piece
  needs spots to actually nucleate, split, annihilate.
- Single-input. Cursor + keyboard + audio all do real work.

## Open questions (answered after first render)

- Does Pearson chaos-crescent stay coherent at half-res, or do
  spots dissolve to noise? Fallback: classical spotting (f=0.037,
  k=0.060, ferment's params).
- Does the wave field's coupling to RD advection actually look
  like "stirring", or just blur? Tune curl-noise scale + wave
  gradient weight after first render.
- Is 4 RD sub-steps/frame enough for visible evolution at 184 BPM?
  ferment uses 8.

## lib/ usage

- `lib/math.glsl` — PI, TAU, rot2d
- `lib/noise.glsl` — fbm, vnoise, hash21 (curl-noise field)
- `lib/diffusion.glsl` — laplacian4 (Gray-Scott Lu/Lv)
- `lib/tonemap.glsl` — reinhard

Palette inline (the one duplication VISION endorses).

## Files

- `pieces/break-on-through-to-the-other-side/sim_rd.frag` — RD pass
- `pieces/break-on-through-to-the-other-side/sim_wave.frag` — wave pass
- `pieces/break-on-through-to-the-other-side/shader.frag` — display
- `pieces/break-on-through-to-the-other-side/meta.yaml` — passes pipeline
