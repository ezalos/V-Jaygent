# Father Ocean (Ben Böhmer Remix) — Ferrofluid Planets References

Theme: planets orbiting under gravity, surfaces are ferrofluid
(Rosensweig spike instability), magnetic field rises with bass / section.

## 1. Shadertoy — orbits & particle storage

**[N-body gravity simulation, michael0884](https://www.shadertoy.com/view/3lVXz3)**
— positions/velocities packed into Buffer A texels, leapfrog/Verlet
update. Steal the **two-pass position+velocity ping-pong** (one texel
per body, second for velocity, force sum in Buffer B). Drop in N=8.

**[2 body gravity visualizer](https://www.shadertoy.com/view/XcsfWX)**
— closed-form Kepler ellipses. Fallback if Verlet drifts during 7:56
(it will). Lock the binary core parametrically; let inner moons be
Verlet for chaos.

**[Particle algorithms overview, Michael Moroz](https://michaelmoroz.github.io/TODO/2021-3-13-Overview-of-Shadertoy-particle-algorithms/)**
— Voronoi/JFA tracking, mipmap force sums. Steal the reminder: at
N=8 the naive O(n²) loop is fine; don't over-engineer.

## 2. Ferrofluid surface — the Rosensweig spike layer

**No clean Shadertoy ferrofluid exists** (searched; "liquid metal"
[dty3Rd] is generic raymarch). Build from primitives:

- **Hex spike lattice.** Critical wavelength
  λ_c = 2π√(σ/(ρg)); spikes erupt above critical field B_c. As
  `magnetism = mix(0, 1.5, audio_bass)` crosses 1.0, lattice ignites
  ([JFM 2-3-4 spike competition](https://www.cambridge.org/core/journals/journal-of-fluid-mechanics/article/abs/234-spike-competition-in-the-rosensweig-instability/06BFC40A25C6164E3AF375B55E5B7C48)).
- **Displace sphere SDF along normal** by
  `pow(max(0, sin(hex·uv)), sharpness) * smoothstep(B_c, B_c+ε, B)`.
  Use [IQ domain warp](https://iquilezles.org/articles/warp/) on
  lattice coords so spikes wobble organically, not grid-rigid.
- **Pole bias:** spikes track magnetic dipole. Multiply amplitude by
  `dot(normal, dipole_axis)²` — denser at poles relative to binary
  axis.

## 3. SDF blending — when planets approach

**[IQ smooth minimum](https://iquilezles.org/articles/smin/)** —
quadratic `smin(a,b,k): k*=4; h=max(k-abs(a-b),0)/k; return
min(a,b)-h*h*k*0.25`. Steal: **modulate k by tidal proximity**. At
periapsis, k rises → ferrofluid stretches between bodies as a bridge
before contact. Money shot — line it up with a drop.

## 4. Sachiko Kodama — the only ferrofluid artist that matters

**[Protrude, Flow (2001)](https://digitalartarchive.siggraph.org/artwork/sachiko-kodama-protrude-flow/)**
+ Morpho Tower (2006), sound-reactive physical ferrofluid. Steal her
**black-on-black with hot rim specular** palette: silhouette body,
sodium-orange highlight only at spike tips where field peaks. Avoids
the chrome-ball cliché.

## 5. Magnetic dipole field as visible vector field

**[Magnetic Field, FabriceNeyret2](https://www.shadertoy.com/view/llfyDl)**
— needle glyphs of `B = 3(m·r̂)r̂ - m / |r|³`. Steal: a sub-layer of
faint field-line streamers between planets, advected along B-field
([Tyler Hobbs flow-fields](https://www.tylerxhobbs.com/words/flow-fields)).
Particles seeded between bodies, integrated along B, alpha-faded.
Reads as invisible force becoming visible at drops.

## 6. n-body math

Verlet: `x_{n+1} = 2x_n - x_{n-1} + a·dt²`, softened gravity
`F = Gm₁m₂r̂ / (|r|² + ε²)`. Inner-pair revolution = 16 bars (≈31 s
at 123 BPM). Section changes can spawn / eject moons (eccentricity
kick).

## Honest caveats

- "Memo Akten flow fields" is loose — Hobbs is the canonical
  generative-art flow-field citation; Akten's work is more
  ML/latent-space.
- The hex-spike SDF is a **synthesis**, not a port. No Shadertoy
  ships this; getting it right is on us.
- λ_c assumes shallow pool; on a curved planet it's decorative, not
  physical. Fine for a music video.
