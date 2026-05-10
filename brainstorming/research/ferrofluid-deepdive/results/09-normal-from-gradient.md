# 09 — Normal-from-gradient → 2.5D shading

## summary
Given height field `h(x,y)` from item 08, the surface normal is
`n = normalize(vec3(−∂h/∂x, −∂h/∂y, 1.0/strength))` where `strength`
controls how steep the implied surface is. Compute `∂h` via 4-tap central
differences from the same texture the display pass already samples for
shading. Light it with one warm key (Phong: `dot(n,L)` diffuse + a sharp
specular) and one warm fill — that is enough to read as 3D ferrofluid on a
flat shader.

## why_mesmerizing
Normals are the load-bearing illusion. With a real `n(x,y)` per pixel:
- specular highlights *track* across moving ridges — eye locks onto the
  hot-spot motion (eye-landing probe)
- you can use a tight `pow(dot(R,V), 64)`-style spec; it stays a tiny
  searing point, which is exactly the cosmetic-toy ferrofluid signature
- shadow-side ridges crush to black naturally, giving the "matte black
  body" without needing any base albedo work
- color/cursor warmth can push specular hue toward gold on hot peaks vs.
  copper on rim — extra hue-drift at zero geometric cost

## concrete_steal
Central differences with explicit step (don't use `dFdx`/`dFdy` on the
height — too noisy, screen-space dependent):

```glsl
// h at (u,v) and 4 neighbours; texel = 1.0/u_resolution.xy
float h_l = texture(u_state, uv - vec2(texel.x, 0.0)).r;
float h_r = texture(u_state, uv + vec2(texel.x, 0.0)).r;
float h_d = texture(u_state, uv - vec2(0.0, texel.y)).r;
float h_u = texture(u_state, uv + vec2(0.0, texel.y)).r;

float dhdx = (h_r - h_l) * 0.5;     // central diff, 2*texel baseline
float dhdy = (h_u - h_d) * 0.5;

// `strength` scales perceived peak height. Lower = taller spikes.
// For h in roughly [-0.3, 0.3]: strength ≈ texel.x * 8.0 reads as ferrofluid.
float strength = texel.x * 8.0;
vec3  N = normalize(vec3(-dhdx, -dhdy, strength));

// Two-light warm rig (no blue!)
const vec3  L_KEY    = normalize(vec3( 0.6,  0.8, 0.7));    // upper-right
const vec3  L_FILL   = normalize(vec3(-0.4,  0.2, 0.9));    // soft, frontal
const vec3  C_KEY    = vec3(1.00, 0.78, 0.42);              // amber
const vec3  C_FILL   = vec3(0.85, 0.35, 0.15);              // copper-rim
const vec3  V        = vec3(0.0, 0.0, 1.0);                 // 2D camera

float diff_k = max(dot(N, L_KEY),  0.0);
float diff_f = max(dot(N, L_FILL), 0.0);

// Phong spec, sharp. k=64 reads as oily; k=16 reads as wax.
vec3  R   = reflect(-L_KEY, N);
float spec = pow(max(dot(R, V), 0.0), 64.0);

// Matte-black body → almost no diffuse contribution; spec carries the look.
vec3  col = 0.04 * (diff_k * C_KEY + diff_f * C_FILL)
          + 1.20 *  spec   * C_KEY;
```

**Tuning knobs:**
- `strength` is the single most important parameter; sweep it live until
  the silhouette reads as ridges, not as a heat map.
- Phong exponent in `[32, 96]` — past 96 highlights flicker on aliasing.
- For iridescence (item 07), feed *this* `N` into the Fresnel/OPD term.

## glsl_path
Display pass. 4 texture taps + ~12 ALU per pixel; if you already sample
`u_state` for height, the four extra taps are the dominant cost — still
trivial. Reuse: gradient is the same data the curvature mask in item 07
needs, so cache `vec2(dhdx, dhdy)` once and pass to both terms.

## caveats
- **Don't normalize a near-zero normal.** Flat regions give
  `(dhdx, dhdy) ≈ 0`; the `strength` z-term keeps `length(n) > 0` so
  `normalize` is safe, but only if `strength > 0`.
- **Forward differences (3-tap) bias normals toward +x/+y** — visible as
  asymmetric specular tail on flat ridges. Always central differences.
- **Tetrahedron technique (4 taps, asymmetric offsets) is for 3D SDFs**,
  not 2D height fields — irrelevant here.
- **`dFdx(h)` looks tempting** but its sign flips by quad and it's only
  defined for screen-space derivatives at the current pixel; the result
  is staircase artifacts on slow gradients. Use explicit texture taps.
- **Eye-relative position / world-space precision** issues
  (Doug Binks 2015) don't apply — we're sampling a texture, not
  interpolated geometry. Skip.
- **Specular at near-grazing angles** can flare to white and clip; clamp
  with `min(spec, 4.0)` before the color multiply.
- **Sub-pixel ridges alias** — the wave PDE in item 08 produces structures
  finer than the texel grid. Either oversample the height texture or run
  a single 3×3 box blur before computing gradient (don't blur the displayed
  height — only the normal-source copy).

## references
- [Inigo Quilez — Normals for SDFs](https://iquilezles.org/articles/normalsSDF/) — central differences, tetrahedron technique, recommended epsilon ranges
- [MiniMax skills — Shader normal estimation reference](https://github.com/MiniMax-AI/skills/blob/main/skills/shader-dev/techniques/normal-estimation.md) — forward / central / tetrahedron GLSL side-by-side
- [Khronos forum — Surface normals for a height field](https://community.khronos.org/t/surface-normals-for-a-height-field/104854) — confirms `(-∂h/∂x, -∂h/∂y, 1)` convention and step-size discussion
- [Doug Binks — Normal generation in the pixel shader (2015)](https://www.enkisoftware.com/devlogpost-20150131-1-Normal-generation-in-the-pixel-shader) — `dFdx`/`dFdy` precision pitfalls (informational; not what we use here)
- [Zero Radiance — Normal Mapping Using the Surface Gradient](https://zero-radiance.github.io/post/surface-gradient/) — surface-gradient framework if multiple gradient sources need to compose later
- V-Jaygent precedent: `pieces/break-on-through-to-the-other-side/shader.frag` already
  computes a similar 4-tap gradient for shading the wave membrane.
