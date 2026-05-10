## summary
Real ferrofluid is ~5 vol% magnetite (Fe₃O₄) nanoparticles (~10 nm) suspended in light-absorbing carrier oil with surfactant. Bulk is opaque black for any path longer than a few hundred microns; only the surface meniscus reflects. There is *no* subsurface scatter, *no* bulk glow, *no* internal colour — the dark interior is the load-bearing visual contract.

## why_mesmerizing
The reason ferrofluid pictures hit so hard is the violence of the contrast: a near-perfect black silhouette pierced by hard specular slivers. Adding "fire", "lava", "inner glow", or warm rim-light to the body reads as cheap CG instantly — viewers have seen real ferrofluid videos and the brain's "magnetite knows what it looks like" lookup-table fires. The mesmerizing version respects the contract: the black is real black, and *only* the meniscus and tip catch light. Then warm tint comes from environment reflection, which the V-Jaygent palette can deliver without violating the dark-warm rule.

## concrete_steal
Body shading recipe (display pass):

```glsl
// load-bearing contract: interior is BLACK
vec3 base = vec3(0.012, 0.008, 0.006);   // not pure 0 — keep a hair of warm bias

// fresnel using meniscus normal
float ndv  = max(dot(N, V), 0.0);
float F0   = 0.04;                          // dielectric oil ~ IOR 1.47
float F    = F0 + (1.0 - F0) * pow(1.0 - ndv, 5.0);

// environment is the ONLY warm source — sodium-orange rig
vec3 envWarm = vec3(1.00, 0.55, 0.18);     // tungsten/sodium key
vec3 envCool = vec3(0.18, 0.10, 0.05);     // dim warm fill, NOT blue
vec3 env     = mix(envCool, envWarm, smoothstep(0.0, 1.0, reflect(-V,N).y*0.5+0.5));

vec3 col = base + F * env;                  // additive specular only
// NO subsurface term. NO emissive(audio). NO inner glow.
```

Body absorption check: the `base` term must stay below ~0.02 luminance even at brightest audio peak — gate `audio_intensity` only against `F` and `env`, never against `base`. Magnetite k≈0.4 in visible means light dies in <50 µm of carrier; in shader-land that means the body is matte black, period.

## glsl_path
Display pass, ~6 ALU ops on top of normal computation. Cheap. Integration: replace any `emissive = audio*warmColor` term in the current piece body with `0.0`; route audio energy into specular `roughness ↘`, env-reflection LOD, or spike-tip area instead.

## caveats
- "Faux iridescence" (Leitl trick — sample a palette by fresnel) is fine ONLY at the meniscus rim and only as a fresnel-weighted contribution that vanishes at face-on view. Spread it across the body and it becomes oil-slick chrome — a different fluid.
- VISION's no-blue rule + ferrofluid's dark-interior rule compose: warm env = OK, blue env = forbidden by palette anyway, so the trap is "purple/magenta inner glow" — explicitly zero it out.
- Fresnel on a procedural normal can pop when the height field is undersampled — clamp `pow(1-ndv, 5)` after a small `max(ndv, 0.02)` floor.
- Magnetite has weak field-induced dichroism in transmission, but only matters in <100 µm films (Ferrocell). Skip — irrelevant at our scale.

## references
- Wikipedia, *Ferrofluid* (composition: 5% magnetite / 10% surfactant / 85% carrier; ~10 nm particles; opaque). https://en.wikipedia.org/wiki/Ferrofluid
- Taketomi, S. & Tikadzumi, S. (1979). Magnetic properties and stability of a ferrofluid containing Fe₃O₄ particles. https://doi.org/10.1016/0378-4363(79)90007-X
- Pu, S. et al. *Optik* — magnetic-field tunable optical properties of magnetite ferrofluid (refractive index ~1.47, extinction k≈0.3-0.5 visible). http://www.ferrocell.us/references/Optik_Paper.pdf
- Leitl, R. *Ferrofluid Web Experiment* — practical fresnel + env-reflection rendering recipe in WebGL. https://robert-leitl.medium.com/ferrofluid-7fd5cb55bc8d
- Gledhill, L. — reference photographs for the dark-body / hard-spec look. https://www.lindengledhill.com/ferrofuid
