# 02 — Surface tension + viscosity → capillary wave dispersion

## summary
On a free liquid surface, restoring forces are gravity (long waves)
and surface tension (short waves). Deep-water dispersion is
`omega^2 = g*k + (sigma/rho) * k^3`. Viscosity damps each mode at
roughly `gamma ≈ 2 * nu * k^2` for small viscosity. Ferrofluids are
**viscous** (10–100× water) so they wobble slow and don't ring. Add a
perpendicular B-field and the magnetic body force flips the sign of
the surface-tension term above threshold — *that* is what triggers
Rosensweig.

## why_mesmerizing
The dispersion law is what gives water its *sound* — the way a
disturbance separates into a fast leading edge of long waves and a
trailing fizz of capillaries. Capturing that staggers musically: bass
hits push long fat ripples, treble hits crack tiny ripples that
overtake and decay first. Dispersion is the secret behind every
mesmerizing pond-shot. Viscous damping is what makes ferrofluid feel
*heavy and inevitable* — energy doesn't bounce, it sinks. The piece
should feel like syrup remembering the music.

## concrete_steal
Run a height field `h(x, y, t)` with a 2-pass damped-wave update.
Choose a phase speed that *depends on local k* (i.e., dispersive)
rather than constant `c`:

In a sim shader (rgba16f ping-pong), at each pixel approximate the
biharmonic and laplacian:
```
lap   = (h(x+1) + h(x-1) + h(y+1) + h(y-1) - 4*h) / dx^2;
bih   = lap_of_lap;                          // 13-tap or two passes
ddh   = G * lap                              // gravity-like restoring
      + S * bih                              // capillary (sigma/rho)
      - 2.0 * NU * lap_dot                   // viscous damping on dh/dt
      - M * lap;                             // magnetic destabilizer
h_new = 2*h - h_old + dt^2 * ddh;
```
With `G = 0.20`, `S = 0.04`, `NU = 0.08`, `M = 0..0.30 from bass`. When
`M` exceeds ~`G + 2*sqrt(S*rho*g)` equivalent (instability threshold),
small wrinkles grow without bound — clamp `h` at ±0.5 to hand off to
nonlinear spike formation.

Crossover wavelength `lambda_m = 2*PI*sqrt(sigma / (rho*g))` ≈ 1.7 cm
in water; for a ferrofluid ≈ 0.8 cm. In screen units pick
`lambda_m ≈ 0.08 * H` and tune G/S so the minimum phase velocity sits
there.

## glsl_path
Two `rgba16f` ping-pong buffers: A = height (h_new in r, h_old in g).
Cost is ~10 taps/pixel for laplacian + biharmonic; at 1080p ≈ 20
Mtaps/frame, fine on any modern GPU. Display pass takes gradient of
A.r → normal → warm directional shade. If `M` term is omitted you have
a plain ripple tank (still pretty); turning it on with bass is the
phase-lock moment. Run sim at half-res if needed and bilinear-upsample.

## caveats
- Naive wave equation `ddh = c^2 * lap` is **non-dispersive**. You
  *must* include the biharmonic (`+ S * bih`) for the staggered
  ripple-trains effect. Without it, every wavelength travels at the
  same speed and the magic dies.
- Biharmonic is numerically sensitive; clamp `dt` so
  `dt < 0.5 * dx^2 / sqrt(S)`.
- Too much damping → looks frozen. Too little → energy accumulates
  and the buffer blows up. Real ferrofluid kinematic viscosity is
  ~5e-6 to 1e-4 m²/s; map that to a screen-space `NU ≈ 0.05–0.15`.
- Ferrofluids' surface tension ≈ 0.025 N/m (lower than water's 0.072)
  — capillary effects are weaker, so the look is wobblier and slower
  than a pond. Lean into that.
- If `M` is driven by music but never crosses threshold, you get a
  damped pond, not a ferrofluid. Calibrate so verses live below
  threshold and choruses cross it.

## references
- Wikipedia: Capillary wave (dispersion relation, viscous damping)
  https://en.wikipedia.org/wiki/Capillary_wave
- Wikipedia: Dispersion (water waves)
  https://en.wikipedia.org/wiki/Dispersion_(water_waves)
- Denner (2016) "Frequency dispersion of small-amplitude capillary
  waves in viscous fluids" Phys. Rev. E 94, 023110. DOI:
  10.1103/PhysRevE.94.023110
- Browaeys et al. (2001) "Surface waves in ferrofluids — wave
  resistance" Brazilian J. Phys.
  https://www.scielo.br/j/bjp/a/YYr6zdZHrQqQpWb9tG5rR8m/?lang=en
- Boyer & Falcon (2008) "Wave turbulence on the surface of a
  ferrofluid in a horizontal magnetic field" Phys. Rev. Lett. 101,
  244502.
