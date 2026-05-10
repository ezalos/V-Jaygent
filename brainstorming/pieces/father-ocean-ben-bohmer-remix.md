# father-ocean-ben-bohmer-remix

Ofra Haza — *Father Ocean (Ben Böhmer Remix)*. 123 BPM, D major, 476s,
8 sections (energy-defined). Long ambient intro → build → 135s
groove plateau → 5s breakdown → big drop → peak → long outro fade.

## Decision

**Architecture:** multi-pass (`passes:`) with two ping-pong simulation
buffers + one display shader. Layer-engine is the project default but
the brief is two genuinely state-bearing physics — a magnetic
potential field and an advected ferrofluid surface — and the layer
engine v1 has no per-layer persistent publish. `passes:` is the
proven path (`pieces/break-on-through-to-the-other-side`,
`pieces/breath`, `pieces/ferment`).

Multi-input is preserved: cursor + keyboard + audio + section state
all wired into both passes. The "boring single-shader" failure mode
is *single-shader + single-input*; this is multi-pass + multi-input
+ multi-physics.

## Thesis

Three ferrofluid planets orbit each other under gravity. As
magnetism rises with the music, conical Rosensweig spikes erupt
from their surfaces and reach toward each other and the cursor;
the field of magnetic potential between them streamers and
deforms the dark velvet space. Gravity sets the dance, magnetism
sets the texture, the music sets the magnetism.

Not "synth-wave planets". Not "FFT bars on a sphere". A genuine
two-physics coupling visible at every frame.

## Three coupled physics

1. **Closed-form Keplerian orbits** for 3 planets — radii, periods
   and phases hand-tuned so two planets pair-dance close while a
   third sweeps a wider arc. Positions exposed to both passes via
   shader functions of `u_time`. Audio mid perturbs orbital speed
   so beats nudge the choreography.

2. **Magnetic potential field** (`sim_field`, rgba16f ping-pong,
   half-res, 2 sub-steps/frame). Scalar field φ(p, t) seeded by:
   - planet centers (positive monopoles, strength ∝ bass)
   - cursor (negative monopole — opposite polarity, so spikes pull
     toward your finger)
   - kick impulse: ring of flux at the closest planet
   - downbeat: realigning radial pulse from the center
   Diffuses via 9-point Laplacian for isotropy. Decays slowly so
   the field has visible inertia, settles between beats.

3. **Ferrofluid surface** rendered procedurally in `display`
   from the field. The Rosensweig spike pattern is approximated
   as: SDF of a planet (smooth-min'd blob from 3 closer points
   per planet so blobs are non-spherical) + height displacement
   amplitude = `local_field_magnitude × fbm(p × spike_freq + flow)`
   sharpened with `pow(., 1.6)`. Spike orientation = field
   gradient. Spikes only erupt where the field magnitude crosses a
   threshold — sub-threshold the planet stays a smooth metal blob.

## Multi-input bindings

- **cursor** → roving negative magnet (drags spikes toward it).
  Idle: synthetic wandering ghost-cursor so the piece self-plays.
- **keyboard (15 keys)** → each press injects a brief magnetic
  pulse at the matched planet (cycles 1-2-3-1-2-3 across keys),
  white keys positive (more spikes), black keys negative (smooths).
  Held keys add slow whirl to that planet's orbit. 5 instruments
  modulate timbre; ±2 octave shift; looper as usual.
- **audio**:
  - bass → field strength multiplier (more spikes everywhere)
  - mid → orbital speed perturbation (planets jitter on phrasing)
  - high → micro-ripple on ferrofluid surface
  - kick → flux ring at random planet
  - downbeat → centred realigning pulse + spike orientation snap
  - section_id → narrative arc (see below)
  - section_progress → smooth ramps within sections
  - song_progress → palette warmth shift (cool space → ember peak)

## Section narrative (8 sections)

| #  | range (s)   | energy | magnetic state                    |
| -- | ----------- | ------ | --------------------------------- |
| 0  | 0–62.6      | 0.07   | dormant — smooth blobs, no spikes |
| 1  | 62.6–94.1   | 0.53   | first spikes wake; field curls    |
| 2  | 94.1–229.6  | 0.35   | orbit established, spikes pulse   |
| 3  | 229.6–234.6 | 0.03   | breakdown — magnetism off, smooth |
| 4  | 234.6–296.8 | 0.53   | DROP — full Rosensweig field      |
| 5  | 296.8–362.0 | 0.55   | peak coupling — spike streamers   |
| 6  | 362.0–472.2 | 0.44   | cooling — spikes recede, orbit on |
| 7  | 472.2–476.2 | 0      | stillness                         |

Section 4 is the visual climax. Section 3's 5s breakdown is the
critical "zero magnetism" tell that proves the coupling is real.

## Couplings (proves "physics not skin")

- planet positions → field sources (gravity sets where mag lives)
- field → spike amplitude + orientation in display
- field gradient → ferrofluid streamers in space between planets
- cursor → field (cursor is part of the physics, not just heat)
- audio bass → field strength (music is the magnetism dial)
- audio mid → orbital phase (music perturbs gravity, lightly)
- audio kick/downbeat → field impulse (every beat, the field
  shudders — visible spike re-erupt)

This satisfies break-on-through's coupling rubric: state passes
that read each other, multi-input through both, palette derived
from the physics.

## Form candidates considered (then rejected)

- **Single shader, no state** — boring per Louis's memory. Spikes
  would need to be pure noise without inertia; the 5s breakdown
  wouldn't read as "field decaying" because there's no field.
- **Layer-stack reusing `lodestone-pull`** — tempting (already
  publishes orbital force), but the ferrofluid surface needs
  rgba16f state for spike memory across frames. Layer engine's
  `u_history` is rgba8 final composite — too lossy.
- **CPU n-body Verlet** — closed-form is good enough for 3
  bodies and removes a whole class of integrator-blowup bugs.
  The piece is about ferrofluid surface texture, not gravity
  novelty.
- **Realistic Rosensweig RD** — actual ferrofluid spike formation
  is a vector-field instability with surface tension. Too costly
  for the visual return; procedural spike-fbm with field-driven
  amplitude reads as ferrofluid to the eye and runs at full rate.

## What I don't want

- Spheres with bumpy noise stuck to them — the spikes must
  ORIENT and erupt with the field, not just wobble.
- Field decoupled from planets — if I switched the field off, the
  planets should look like calm liquid metal, not the same.
- Generic "space" backdrop — the velvet is field-streaked, not
  flat black.
- Orbits that don't visibly change with the music — section
  perturbation must register.
- Mismatched palette tier — VISION is warm-bias; resist the
  temptation to do "space = cold blue". Use ember-on-graphite,
  steel-warm not steel-cold. Iridescent rim (oil-slick) only
  at strong field magnitude — contrast the warm dark.

## Palette

- **substrate**: dark graphite (#0a0905) → warm bone (#3a2010 at
  highest energies) — never pure black, always a hint of warmth.
- **ferrofluid metal**: dark steel (#1a1814) → warm chrome
  (#a07050) on highlights → ember rim (#c84020).
- **spike tips**: when field is strong, oil-slick iridescence —
  amber/violet/teal cycling on field gradient direction so the
  rim reads "magnetic" not "wet".
- **field streamers**: warm gold filaments (#a06030) on dark
  graphite, falloff with field magnitude squared.

## Arc / ending

Field decays to ~0 in section 7. Last 4s: planets settle to smooth
blobs, drift apart slightly, full stop. No fade-out — a held final
frame where you can read the resting geometry.

## Layers / passes / piece geometry

```
sim_field (rgba16f, scale 0.5, ping-pong, 2 iters)
  ├── reads: u_state (self previous frame)
  └── writes: scalar magnetic potential in .r,
              vec2 gradient cache in .gb,
              field magnitude in .a (pre-sqrt'd for cheaper read)

display (screen)
  ├── reads: u_field_state
  ├── computes: 3 planet centers from u_time + audio mid
  ├── per-pixel:
  │     - SDF blob distance to nearest planet (smooth-min'd 2-blob mix)
  │     - sample field at pixel; gradient = field gradient cache
  │     - if |dist| < spikeReach: displace surface by spike noise
  │     - palette per (dist, fieldMag, song_progress, section_id)
  │     - background streamers from field magnitude in space
  │     - cursor magnet glow halo
  │     - keyboard glow rays from each key's matched planet
```

Two passes is plenty for V1. If spikes look "wobbly without inertia"
in the v1 critique I'll add a second pass (`sim_height` rgba16f)
that integrates surface velocity per-pixel — but procedural is more
controllable and cheaper to start.

## Open questions

- Will procedural spikes read as ferrofluid, or as "noise on a
  sphere"? Answer in v1 critique.
- How quickly does the field need to diffuse for the 5s breakdown
  to look like a decay rather than a cut? Half-life ~2s suggests
  decay constant 0.35/s.
- Spike orientation toward field gradient or away from it? Real
  ferrofluid spikes align with B-field; in 2D top-down view that's
  along the local field gradient. Start with that, flip if it
  reads wrong.
- Three planets vs two? Two is dipole (cleaner), three breaks
  symmetry. Going with three — risk is fence-sitting; mitigate by
  giving one a much wider orbit so the visual hierarchy is clear.
