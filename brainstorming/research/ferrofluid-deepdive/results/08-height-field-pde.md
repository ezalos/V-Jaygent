# 08 — Height-field PDE on rgba16f ping-pong

## summary
Treat the surface as a scalar height field `h(x,y,t)` updated in a sim pass
via damped wave equation with magnetic body forcing:
`∂²h/∂t² = c²·∇²h − γ·∂h/∂t + F_mag(x, y, t)`. Discretized with leapfrog
(Verlet), state-packed `(h, v, _, _)` in `rgba16f`, ping-ponged each frame.
This is the inertial substrate that distinguishes a ferrofluid from a
"spiky procedural blob" — the surface remembers, slumps, rebounds, and
visibly resists/lags the magnet.

## why_mesmerizing
Procedural noise can fake ridges but cannot fake *response time*. A wave-PDE
with damping `γ` tuned for slow viscous decay gives:
- peaks that bulge before they spike (forcing leads, height lags by 1–2 beats)
- residual wobble after a kick — perfect for between-snare lulls
- standing-wave nodes where multiple body forces meet and cancel
- emergent secondary ridges from interference no procedural function predicts

This is precisely the "alive / not pre-rendered" quality V-Jaygent's
multi-input feedback note demands. Existing precedent in
`pieces/break-on-through-to-the-other-side/sim_wave.frag` proves the pattern
works at 60 fps.

## concrete_steal
State packing: `vec4(h, v, divergence, _)`. Two-step Verlet:

```glsl
// Read prev state
vec4  s   = texture(u_state, uv);
float h0  = s.r;
float v0  = s.g;

// 4-tap Laplacian (lib/diffusion.glsl::laplacian4)
float lap = laplacian4(u_state, uv, texel).r;

// Magnetic body force from sources (kick = central pull, keys = directional)
float F   = magneticForce(p, u_audio_kick, u_keys, u_downbeat);

// Verlet integration
const float c2  = 0.21;     // CFL: c²·dt² < 0.5·dx² in 2D, dt=dx=1 → c²<0.5
const float dmp = 0.04;     // visible viscous decay; tune by ear
float a = c2 * lap - dmp * v0 + F;
float v = v0 + a;            // dt=1 in lattice units
float h = h0 + v;

fragColor = vec4(h, v, 0.0, 1.0);
```

Run **N=4 sub-steps per frame** by stacking 4 sim passes (or doing 4 inner
iterations) so the effective `dt` shrinks 4×, you can push `c2` toward 0.4
without ringing, and high-frequency ridges stop looking like square pixels.

CFL guard for sanity: in 2D leapfrog with `dx=dy=1`, stability is
`c²·dt² ≤ 0.5`. Stay at `c² ≤ 0.21` per sub-step for headroom — exactly the
constant `break-on-through` ships.

## glsl_path
Sim pass(es) only — display reads finalized `h, v` and computes normal +
shading (item 09). Per-pixel cost: 4 texture taps (Laplacian) + ~8 ALU =
trivial vs. the display pass. Bind two `rgba16f` textures, alternate
read/write each frame; zero-init pass on `u_frame == 0`.

Integration with V-Jaygent layer engine: this is naturally a `passes:`
pipeline (height-field is state-bearing — layer-engine v1 has no persistent
publish, per memory note). Mirror `break-on-through-to-the-other-side`'s
two-pass structure but drop the RD coupling.

## caveats
- **Half-life ≠ damping coefficient.** `γ = 0.04` per sub-step at 4
  sub-steps/frame at 60 fps gives half-life ≈ 0.07 s. For audio-reactive
  pieces you want bass kicks to ring for ~0.5 s → `γ ≈ 0.006` per sub-step.
  Lesson from `pieces/breath`.
- **CFL violation = checkerboard explosion within seconds.** If you see
  the field saturate to ±1 in pixel-checker pattern, drop `c2` first.
- **rgba16f is mandatory** — `rgba8` quantizes the velocity channel and
  the field flat-lines after a few seconds.
- **Energy injection scaling:** body forces accumulate linearly over
  sub-steps. If you write `F = u_audio_kick` you get 4× the kick people
  expect at 4 sub-steps. Divide by `N_SUBSTEPS`.
- **Periodic boundaries** create torus-flow artifacts (visible diagonal
  re-entry of waves). Use clamp-to-edge sampling and a small attenuation
  ring near borders.
- **Reading u_state at u_frame == 0** is undefined on some drivers — always
  early-return a zero-init branch.
- **Verlet drifts** if you mix forward-Euler velocity with Verlet position;
  pick one. The pattern above is the standard half-step velocity update.

## references
- [Strang — The Wave Equation and Staggered Leapfrog (MIT 18.086)](https://math.mit.edu/classes/18.086/2006/am53.pdf) — definitive 1D/2D CFL derivation for the leapfrog scheme
- [HPC Lecture Notes — Discretising the wave equation](https://tbetcke.github.io/hpc_lecture_notes/wave_equation.html) — explicit stencil + stability bound `c·Δt/Δx ≤ 1/√2` in 2D
- [Shadertoy — 2D Wave Equation Simulation (view 3d3yzj)](https://www.shadertoy.com/view/3d3yzj)
- [Shadertoy — Simulation of the wave-equation (view 3tX3DM)](https://www.shadertoy.com/view/3tX3DM)
- [Amanda Ghassaei — MassSpringShader](https://github.com/amandaghassaei/MassSpringShader) — WebGL mass-spring-damper, conceptually equivalent and well-commented
- [PixelEuphoria — Playing Around With A 2D Wave Algorithm](https://pixeleuphoria.com/blog/index.php/2021/01/19/playing-around-with-a-2d-wave-algorithm/)
- V-Jaygent precedents:
  - `pieces/break-on-through-to-the-other-side/sim_wave.frag` (wave-eq + RD)
  - `pieces/breath/sim.frag` (heat-eq, half-life tuning, sub-step rationale)
