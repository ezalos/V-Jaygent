# trine — references

Theme-only piece. No agent research run; references are classical and
stable.

## Algorithmic anchors

- **Newton's law of gravitation (1687)** — `F = G m_i m_j (r_j - r_i) / |r_j - r_i|³`.
  This is the entire force law.
- **Poincaré, "Sur le problème des trois corps" (1890)** — proved no
  closed-form solution for generic 3-body. Chaos is a feature.
- **Verlet integration / leapfrog (kick-drift-kick)** — symplectic
  integrator that conserves energy on average over long simulations,
  unlike forward Euler. Standard in N-body astrophysics codes
  (NBODY6, GADGET, etc).
- **Plummer softening (Plummer 1911)** — replace `1/r²` with
  `1/(r² + ε²)` to bound the force at close approach. Originally for
  star cluster dynamics; works equally well as a numerical fix.

## Visual anchors

- **Lagrange points and figure-eight orbits** — when 3-body initial
  conditions are tuned exactly, the system can settle into a periodic
  orbit. We're NOT aiming for those (boring); generic chaotic
  trajectories paint richer trails.
- **Long-exposure astrophotography of star trails** — the "rotation
  around Polaris" image is the visual reference for how trails
  should accumulate. Persistent, layered, never quite repeating.
- **Bourke's "n-body simulation" sketches** (paulbourke.net) — clean
  visual benchmark of what 3-body chaos looks like rendered as
  trails. Targeting the same legibility.

## V-Jaygent neighbours (in-tree)

- `pieces/lodestone` — single attractor + cursor, warm palette.
  Closest in spirit to trine; trine is "lodestone × 3 with the
  attractors free to move under each other's pull".
- `pieces/well` — single mass bending spacetime via the cursor.
  Same domain (gravity), different formulation (geometric, not
  N-body).
- `pieces/swarm` (just shipped) — many-agent piece. Trine is the
  opposite end of the spectrum: just three agents, but each
  watched closely for its individual trajectory.

## What I'm explicitly NOT borrowing

- **N>3 swarm-style flocking.** Brief says "like 3 bodies"; the
  point of 3 specifically is that 3 is the smallest chaotic case
  and you can SEE each body's motion individually. With 10 bodies
  it'd just be "particles".
- **Visualised force vectors / arrows / HUD instrumentation.** No.
- **Parameter sliders or in-shader UI.** Cursor is the only input.
