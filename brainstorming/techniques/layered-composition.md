# Layered composition

The single biggest gap between what I've been building and what V-Jaygent's name
says the project is. Every piece so far (`first-bloom`, `apollonian-foam`,
`lodestone`, `aperture`, `well`, `in-seven`, `chamber`) is a **monolithic
field** — one function, one symmetry, producing a single coherent image per
frame. That's generative-art culture (Shadertoy, IQ). It is not VJ culture.

VJ culture = **independent layers with heterogeneous time-bases stacked via
blend modes over partial-coverage masks.** Each layer is its own element; the
composition emerges from how they fail to align. The viewer's eye tracks
between layers because they move at different rates.

## The architecture

Each layer has:

1. **A content function.** What it computes: noise field, strange-attractor
   trail, moire, Truchet tile, SDF-boolean shape, fractal flame slice.
2. **A mask.** Where it's visible. Crucially **not the whole frame** — VJ is
   about partial coverage. Masks come from SDF booleans, Voronoi cells, noise
   thresholds, analytic shapes.
3. **A transform.** Its own translation, rotation, scale — each with its own
   rate, ideally coprime with every other layer's rate.
4. **A blend mode.** How it composites onto whatever's behind. `screen`, `max`,
   and weighted `add` are the three that don't grey-out the result the way
   plain additive does.
5. **An audio binding.** Which frequency band drives its contribution.

## Blend modes that work in a single-pass shader

```glsl
vec3 blend_screen  (vec3 a, vec3 b) { return a + b - a*b; }         // bright
vec3 blend_max     (vec3 a, vec3 b) { return max(a, b); }           // hardest
vec3 blend_multiply(vec3 a, vec3 b) { return a * b; }               // darkens
vec3 blend_addsat  (vec3 a, vec3 b) { return min(a + b, vec3(1.0)); }
```

**Never plain additive for 3+ layers** — sums to grey. Screen and max preserve
contrast.

## Why the project has been monolithic

Shadertoy rewards virtuosity in a single SDF raymarch. I absorbed that bias.
The VJ thesis says: the magic is in the *non-alignment* of multiple simple
layers, not in the sophistication of one complex field.

## Essential minimum to start

SDF booleans for shaped masks (`iquilezles.org/articles/distfunctions`) +
domain warping for layer motion + polyrhythmic time rates per layer +
`screen` or `max` blending.

## Open: multi-pass (the real upgrade)

A single fragment shader can *simulate* layering by doing everything in one
pass. A **true** VJ architecture would let each layer be its own GLSL file,
with the runtime compositing them via intermediate textures and blend modes.
That's the next step for V-Jaygent's runtime — see
[pieces/future-multipass-deck.md](../pieces/future-multipass-deck.md).

## References

- Iñigo Quilez SDF toolkit: <https://iquilezles.org/articles/distfunctions/>
- IQ SDF primer shader: <https://www.shadertoy.com/view/Xds3zN>
- Xor's GM Shaders SDF column: <https://mini.gmshaders.com/p/sdf>
- Resolume layer workflow (primary source for the concept):
  <https://dj.studio/blog/best-vj-software>
