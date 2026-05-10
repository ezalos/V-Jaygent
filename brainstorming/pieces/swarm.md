# swarm

## Thesis

Multiple fingers as competing gravitational wells in a flocking field. The
swarm is not literal individual boids — at the resolution V-Jaygent runs at,
4096+ point-sprites would either choke a phone GPU or render as unreadable
confetti. It's an Eulerian boid-fluid: a density+velocity field whose update
rule contains the three classical Reynolds terms (alignment, cohesion,
separation) plus per-finger attraction and tangential swirl. Each finger
owns a colour. Where you put your fingers, the swarm partitions; where they
drift apart, the field tears; pinch them together and vorticity injects.

The piece is *crazy* not by adding noise — it's crazy because the field has
no rest state. Even with no fingers down it's stirred by ghost orbiters
(autonomous attractors driven by `u_time`); when real fingers arrive they
override the ghosts. The viewer joins a conversation already in progress.

## Architecture (decision)

**Multi-pass `passes:` pipeline** — boid-fluid needs persistent state across
frames (density, momentum, finger-affinity) which the layer engine can't
hold cleanly. Two passes:

1. `simulate` — rgba16f ping-pong at scale ~0.4 of canvas. State:
   - r: density (mass of swarm at this cell)
   - g: velocity.x (range roughly ±1.5)
   - b: velocity.y
   - a: finger affinity ∈ [0,1] — fractional finger index, used by display
        to pick which finger's hue to tint this cell with.
2. `display` — screen-resolution composite. Reads the sim texture, paints
   density through a per-affinity warm-spectrum palette, draws short motion
   streaks along the velocity field, accumulates trails via `u_history`,
   adds rim glow on density crests.

`passes:` not `layers:` — this is documented in the memory entry
"passes vs layers architectures". Layer-engine v1 has no per-layer
persistent publish; rgba8 `u_history` would lose float precision. rgba16f
ping-pong is non-negotiable for a velocity field that wants to carry
±1.5 units without quantisation banding.

## Update rule (sim.frag)

For each cell at uv:

1. **Init (frame 0)**: density = 0.4 * fbm(uv*8); velocity = 0; affinity = 0.5.
2. **Self-advection**: read state at `uv - velocity * dt` (semi-Lagrangian).
3. **Velocity diffusion** = alignment (small Laplacian on velocity).
4. **Density diffusion** with low coefficient — keeps density gradients
   meaningful instead of smearing flat.
5. **Pressure / separation**: read density Laplacian; subtract a fraction
   from velocity so cells flee high-pressure spots.
6. **Cohesion**: tiny pull along density gradient (∇ρ) — cells drift up
   the local hill.
7. **Per-finger forcing** for each active touch i (or ghost orbiter when
   `u_touch_count == 0`):
   - Compute distance d, direction n from cell to finger.
   - Add radial attraction: `α_i * n / (d² + softening)` capped to avoid
     singularity.
   - Add tangential swirl: `ω_i * perp(n) / (d + softening)` — gives the
     orbital character.
   - Inject density at the finger position via Gaussian splat scaled by
     finger age (newborn fingers spawn fastest).
   - Pull affinity toward `i / max_count` weighted by 1/(d²+ε) — closest
     finger claims the cell's colour.
8. **Decay**: density *= 0.995, velocity *= 0.985 — keeps the field from
   exploding when fingers leave.

## Display rule (shader.frag)

1. Sample state at uv with a small 3x3 box blur to soften texel edges.
2. Compute palette for this cell: `hue = affinity * TAU * 1.4 + slow_drift`.
   Each finger spans a wedge of the warm-→cool-edge spectrum (per VISION's
   "spectrum exception" for refraction-class pieces — multi-finger
   attractors qualify because each finger is a *separate* source of
   colour, not one element rainbow-shifting).
3. Glow intensity = `density^0.7`.
4. Motion streaks: sample state along the velocity vector (4 taps over a
   small radius); accumulate into a streak channel that adds chromatic
   sparkle on fast-moving cells.
5. `u_history` * 0.85 + new_frame: long-exposure trails. (No ghosting —
   the 0.85 is calibrated against the density decay so the system reaches
   equilibrium with non-zero brightness during finger activity.)
6. Tonemap with `reinhardPartial`; gamma 0.92.

## Ghost orbiters (no-touch fallback)

When `u_touch_count == 0`, generate 4 virtual fingers from `u_time`:
positions on Lissajous orbits with mutually-prime frequencies. Each ghost
gets an age from `mod(u_time, 11.0)` so ghosts also "lift off" and respawn
periodically — the swarm keeps tearing/reforming even on a desktop
without a touchscreen.

When a real finger appears, ghosts fade out over ~0.5s. When real fingers
leave, ghosts fade back in.

## What I don't want

- **Literal individual sprites.** "Boids" classically means N agents with
  positions; doing that on a fullscreen-quad pipeline forces either
  per-pixel scans (4096 fetches × 2M pixels) or render-to-point-buffer
  tricks the runtime doesn't support. The Eulerian-flocking formulation
  IS boids — alignment is velocity diffusion, cohesion is gradient
  ascent, separation is pressure. Same physics, different basis.
- **Confetti palette.** Per finger, hue stays inside a narrow wedge — the
  whole frame can carry rainbow because each *region* is monochrome.
  No pink-next-to-green within a single finger's territory.
- **Bullet-time.** Velocities should *flow*, not freeze on idle frames.
  The decay constants (0.985 velocity, 0.995 density) are chosen so the
  field stays alive even when nothing's poked it for 5s.
- **Noise as a substitute for state.** Tempting to fake the swarm with
  `vnoise(uv * scale + u_time)` and call it done — but a finger can't
  *deflect* noise. The state texture is the whole point: fingers shape
  trajectories that persist into next frame.

## Runtime extension (necessary)

The runtime currently exposes only the primary pointer via `u_mouse`. For
this piece I added two new uniforms (always set, zeroed when no touches):

- `uniform vec4  u_touches[8];` — per-finger (x, y, age_seconds, active 0/1).
  xy in target pixel space, same convention as `u_mouse`.
- `uniform int   u_touch_count;` — number of active pointers (0..8).

Plumbed through `studio/gestures.mjs` (new `getPointers()` snapshot) and
`studio/runtime.mjs` (`setStandardUniforms`). Runs on every active pointer
the canvas captures — works for both `passes:` and `layers:` pipelines, so
future multi-touch pieces inherit it.

## Bindings sketch

No audio. Pure interactive piece.

- `u_touches[i]` per finger → attractor + swirl + colour wedge.
- `u_touch_count` → switch between real fingers and ghost orbiters.
- `u_mouse` not consumed directly — the gesture path covers desktop hover
  via `u_touches` only on pointerdown. Desktop with no click sees ghosts;
  click+drag drives one finger; trackpad two-finger pan is outside the
  finger model on purpose (already used by the global pinch zoom).
- `u_time` drives ghost-orbit phase + slow palette drift.

## Open questions (will answer after first render)

- Does 4 ghosts read as "alive but autonomous" or as "boring sine-wave"?
  If the latter, raise the count to 6 and randomise frequencies further.
- Is sim scale 0.4 enough resolution for the streaks to read as motion,
  or do they alias into thin diagonals? Could push to 0.5 if needed.
- Does `u_history * 0.85` accumulate to a cream wash on long sessions?
  If yes, multiply by `(1 - 0.04 * density)` — bright cells decay faster.
