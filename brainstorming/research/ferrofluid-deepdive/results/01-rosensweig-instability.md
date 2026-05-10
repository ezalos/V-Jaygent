# 01 — Rosensweig instability: onset, critical wavelength, hex lattice

## summary
The Rosensweig (normal-field) instability is the surface buckling that
turns a flat ferrofluid pool into a regular array of conical spikes when
a perpendicular magnetic field exceeds a critical strength. First
characterized by Cowley & Rosensweig (1967). The selected pattern is
hexagonal at onset, with a lattice spacing fixed by the *capillary
length*, not by the magnet.

## why_mesmerizing
The lattice spacing is **independent of field strength** — only the
spike *height* tracks the magnet, the *grid* stays put. So as music
swells the magnetic field, the same hex cells deepen and brighten in
unison, like a city of identical fountains turning on together. This
phase-locked field-of-peaks reads as alive and intentional in a way
that a single procedural spike never does. Hex packing is also the
densest plane tiling of equal-energy points → the eye reads "ordered
but organic," a sweet spot for hypnosis.

## concrete_steal
Pick critical wavenumber `k_c = sqrt(rho * g / sigma)` → for a typical
ferrofluid (rho ≈ 1400 kg/m³, sigma ≈ 0.025 N/m, g = 9.81) this gives
`k_c ≈ 740 /m` → `lambda_c ≈ 8.5 mm`. In *screen units*, just pick
`lambda_c = 0.10` of the canvas height and live there.

Hex lattice at angles 0°, 60°, 120° as three plane-wave sums:
```
h(p) = A * (cos(k·e1·p) + cos(k·e2·p) + cos(k·e3·p)) / 3
e1 = (1, 0); e2 = (-0.5, sqrt(3)/2); e3 = (-0.5, -sqrt(3)/2)
k  = 2*PI / lambda_c
```
Onset gate: `A = max(0, B_m - 1.0) * music_low`, where the *magnetic
Bond number* `B_m = mu_0 * M^2 / (2 * sqrt(rho * g * sigma))` crosses
1 at the threshold. Below 1 → flat. Above 1 → hex grid grows. Cap A so
peak height saturates around `0.6 * lambda_c` (real spikes do that
nonlinearly). Add a slow lattice rotation `theta(t) = 0.05 * t` to
keep it from feeling stamped.

## glsl_path
Display pass: cheap (~6 cos calls/pixel). Use the hex height field as
a *displacement* on the underlying ferrofluid mass: shade with
`n = normalize(vec3(-dh/dx, -dh/dy, 1))` and dot with a warm light dir
to pop the cones. If running with a sim pass, add `h(p)` as a forcing
term into the height-buffer (pass A) so capillary dynamics can ring
between the lattice points. Drive `B_m` from bass envelope; lock spike
*phase* to downbeat by snapping `theta` on bar boundaries.

## caveats
- A flat hex pattern with no shading reads as *honeycomb wallpaper*,
  not ferrofluid. The win is the **grazing-angle reflection** off
  cone tips — bake that.
- Square patterns appear above ~1.4× critical field; hex→square
  transition is real, can be a section change.
- Lattice spacing fixed by `sigma, rho, g`, NOT by the magnet — do not
  drive lambda from music; drive *amplitude* and *phase* instead.
- Don't let A grow without bound; real spikes hysteretically saturate.

## references
- Cowley & Rosensweig (1967) "The interfacial stability of a
  ferromagnetic fluid" J. Fluid Mech. 30, 671. DOI:
  10.1017/S0022112067001697
- Richter & Lange (2009) "Surface Instabilities of Ferrofluids" in
  *Colloidal Magnetic Fluids*, Springer.
  https://link.springer.com/chapter/10.1007/978-3-540-85387-9_3
- Gollwitzer et al. (2007) "The normal field instability in
  ferrofluids: hexagon-square transition mechanism and wavenumber
  selection" J. Fluid Mech. 571, 455. DOI: 10.1017/S0022112006003636
- Wikipedia: Ferrofluid (Rosensweig section)
  https://en.wikipedia.org/wiki/Ferrofluid
