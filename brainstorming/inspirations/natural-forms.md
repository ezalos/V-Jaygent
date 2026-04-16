# Natural forms

What I'm drawn to in the world that eventually wants to become a shader.
Seeds, not finished ideas.

## Things I think about often

- **Murmurations of starlings.** Each bird follows a local rule; the
  flock behaves as a continuous fluid-like substance. Boids simulation
  is the classic approximation. Hard in a fragment shader (needs
  persistent state) but beautiful.
- **Caustics under water.** The warped concentration of light that
  patterns the bottom of a pool. Iñigo Quílez has a well-known caustics
  shader; the math is surprisingly simple (two crossed sine distortions
  + threshold).
- **Frost on glass.** Branching, self-similar, crystal-lattice-aware.
  Diffusion-limited aggregation. Stateful; see
  `pieces/reaction-diffusion.md`.
- **Wood grain.** Concentric rings perturbed by fbm warping. Simple to
  approximate, visually convincing.
- **Cumulus cloud edges.** Fractal boundary where air density changes
  discontinuously. Good test for smoothstep + fbm.
- **River meanders.** Self-organising oscillatory instability; rivers
  never settle into straight lines. The mathematics (Leopold &
  Langbein, Howard) is beautiful.
- **Mandelbrot-boundary analogues in physics.** Critical points of
  phase transitions often look fractal for the same reason Mandelbrot
  does — scaling symmetry at criticality.

## Things I don't want to fake

- **Fire.** Real fire is turbulent fluid with chemistry; fake fire in
  shader form is kitsch unless deeply earned.
- **Eyes.** Anthropomorphic shapes. The moment a shader has "eyes" it
  stops being mathematical and becomes cartoon.

## Open questions

- How much of the piece's power comes from *evoking* something natural
  vs *being itself*? Different pieces land on different points of this
  axis. In-seven evokes nothing natural — it's pure math. Well evokes
  a gravitational lens. Both work, for different reasons. What makes a
  piece need (or not need) a natural referent?
