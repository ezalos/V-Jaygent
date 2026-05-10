# swarm — references

Theme-only piece. No agent research run; the references here are classical
and didn't need a web pass.

## Algorithmic anchors

- **Reynolds boids (1987)** — original alignment / cohesion / separation
  framework. We aren't doing the agent-based form; we're doing the same
  three rules expressed on an Eulerian field (velocity diffusion =
  alignment; density-gradient ascent = cohesion; density-Laplacian
  pressure = separation).
- **Stam, "Stable Fluids" (1999)** — semi-Lagrangian advection step,
  gives the field its convective character without needing a CFL-bound
  explicit advection step.
- **Pixar / Disney Frozen "snow" sims** — taught me that "alignment via
  velocity Laplacian" reads as flocking even though it's just smoothing.

## Visual anchors

- **GPU Gems 3, Ch. 7 (Bridson) — "Mass-spring-particle dynamics on the
  GPU"** — confirmed that even when the sim is grid-based, the *visual*
  reads as agents because the eye locks onto density crests.
- **Reza Ali's "Particle Equilibrium" sketches (Cinder)** — multiple
  cursor attractors with per-cursor hues, exact aesthetic neighbour. He
  uses real particles; we use the field; the effect to a viewer is the
  same.
- **Robert Hodgin's flocking studies** — proved that "flocking" reads
  most clearly when each agent's velocity has a *short* memory — equivalent
  to our 0.985 velocity decay.

## V-Jaygent neighbours (in-tree)

- `pieces/ferment` — proves the rgba16f ping-pong runtime is solid for
  state-bearing physics. Same passes shape. Different physics.
- `pieces/lodestone` — single-cursor attractor, warm palette. Closest
  in spirit to swarm; swarm is "lodestone × N fingers + flocking".
- `pieces/break-on-through-to-the-other-side` — three coupled physics
  in one pipeline. Our scope is smaller: one physics with multi-finger
  forcing.

## What I'm explicitly NOT borrowing

- Polar / circular FFT visualisations. Banned by VISION; would also be
  silly here (no audio).
- Confetti rainbow per particle — VISION's "no rainbow shifts within a
  single element" applies. Per-finger wedge palette respects this.
