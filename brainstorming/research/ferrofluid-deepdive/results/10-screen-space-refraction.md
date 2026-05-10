## summary

A thin slab of the height field can be made to "wet" the scene by
refracting the background at offset UVs. With a dark-warm room behind
the blob and a small amount of normal-driven UV offset, the silhouette
reads as a glossy meniscus — the wet, mirror-edged look that turns
"spiky thing" into "ferrofluid".

## why_mesmerizing

The eye uses refraction as a strong "this is liquid" cue — even tiny
sub-pixel curvature changes are read as wetness. Pairing refraction
with depth-of-field on the blob silhouette gives every spike a
specular crown and every valley a darker inner reflection, which is
exactly the visual texture of real ferrofluid photographs. It also
couples the blob to whatever else is on screen (cursor trail, audio
particles), so the surface "drinks" the rest of the piece.

## concrete_steal

Thin-slab approximation, single tap, single pass:

```glsl
// h is the height field at this pixel; n = normalize(vec3(-dh/dx, -dh/dy, 1)).
vec2 nxy = n.xy;                        // tangent-plane projection of normal
float thickness = 0.04 + 0.06 * h;      // height-modulated slab thickness
float ior = 1.33;                       // ferrofluid ~ kerosene base
vec2 uvR = uv + nxy * thickness * (1.0 / ior - 1.0);
vec3 behind = texture(uBackground, uvR).rgb;
```

For chromatic dispersion, sample the background three times with
`ior + dvec3(-0.02, 0.0, 0.02)`. For DOF cheaply, average 4 jittered
taps weighted by `(1.0 - silhouetteAlpha)` so blur happens only where
the slab is thin (rim) — keeps the centre crisp.

## glsl_path

Runs in the final composite pass after the height field is resolved.
Cost: 1 background tap (3 if dispersion). Requires the background to
exist as a texture — feed it the previous frame's composite from the
ping-pong `rgba16f` target or the layers below the ferrofluid layer.
Normal can be reconstructed cheaply from `dFdx(h), dFdy(h)`.

## caveats

- Sampling the same frame's composite at offset UVs can pull the blob's
  own silhouette into itself — black halos at high contrast. Mask by
  `silhouetteAlpha` or sample only outside the blob mask.
- `1/IOR - 1` is negative — sign matters; refraction must bend toward
  the surface normal in screen-space, not away.
- Bright background = washed-out meniscus. The dark-warm palette
  (VISION.md) is what makes this read; do not light the room.
- DOF without a depth proxy can blur the wrong things. Drive blur from
  `(1 - silhouetteAlpha)` or from `length(nxy)` (rim only), not depth.

## references

- Inigo Quilez, articles index: https://iquilezles.org/articles/
- Lettier, "Screen Space Refraction" (3D Game Shaders For Beginners):
  https://lettier.github.io/3d-game-shaders-for-beginners/screen-space-refraction.html
- NVIDIA GPU Gems 2, Ch. 19 "Generic Refraction Simulation":
  https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-19-generic-refraction-simulation
- Maxime Heckel, "Refraction, dispersion, and other shader light effects":
  https://blog.maximeheckel.com/posts/refraction-dispersion-and-other-shader-light-effects/
- Shadertoy, "liquid glass" by florian: https://www.shadertoy.com/view/WccXDj
- Shadertoy, "refraction (physical+perceptual)": https://www.shadertoy.com/view/llVSDz
