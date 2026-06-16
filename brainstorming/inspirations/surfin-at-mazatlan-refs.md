# surfin-at-mazatlan — references

Track: "Surfin' at Mazatlan" by Rhythm Rockers (172 BPM, E major, 157s).
Thesis: ripple-tank-at-golden-hour — interference field of expanding
circular wavefronts from discrete point sources, recolored as warm
sunset light glinting on disturbed water. (Researched via Explore agent.)

## Shader implementations
- [Simple Water Ripple](https://www.shadertoy.com/view/wdtyDH) — distance-based amplitude
  falloff prevents singularities at wave centres. (verify URL later)
- [Circular Waves 2D (Godot Shaders)](https://godotshaders.com/shader/circular-waves-2d/) —
  `amplitude / (dist + 1.0)` for 1/(1+r) falloff; perpendicular wave families interact.
- [Water subsurface scattering](https://www.shadertoy.com/view/M3fGDl) — wave functions for
  warm-palette refraction beneath a shimmer.

## Math — superposition + analytic gradient (the load-bearing reference)
N superposed circular waves:
```
h(p,t) = Σ A_i · sin(k·|p − s_i| − ω·t + φ_i) / (1 + |p − s_i|)
```
k = 2π/λ (wavenumber), ω = 2πf. Gradient (for specular glint, computed
in the same loop — no finite differences):
```
∂h/∂p = Σ A_i · k · cos(k·|p − s_i| − ω·t + φ_i) · (p − s_i)/|p − s_i| / (1 + |p − s_i|)
```
Two sources → classical hyperbolic nodal-line pattern; more sources →
denser fringes. Shortening λ densifies; lengthening broadens to swells.

## Sun glint on warm water — Blinn-Phong
N = normalize(vec3(-∂h/∂p, 1)); `spec = pow(max(dot(N, half), 0.0), shininess)`,
shininess ≈ 128–256. Threshold |∂h/∂p| (slope) so glint clumps into bright
patches only on steep crest faces. Warm sun colour (amber→cream), tonemap.

## Surf-rock motif — tremolo + reverb tail
Spring reverb's "wet tail" + tremolo's 8–16 Hz amplitude modulation →
an always-on oscillating brightness + subtle positional jitter on the
sources. The reverb tail reads as trailing visual echoes (decay on
event-driven sources). This is the always-on sub-beat liveness channel.

## Further study
- GPU Gems Ch.1 (Effective Water Simulation) — dynamic normals from
  height derivatives.
- Gerstner write-ups (Nakum / Toxigon) — multi-frequency composition
  avoids repeating patterns. We use circular (not Gerstner) sources but
  the anti-repeat lesson transfers: detune source frequencies/phases.
