# Kaleido variations — breaking the centre lock

Standard 2D kaleidoscope: polar coordinates, fold angle to a `2π/n` wedge.
The result: n-fold rotational symmetry, centred on origin, stable forever.
Cheap, striking, instantly repetitive.

The interesting moves are the ones that break the default lock without
losing the symmetry's structural truth.

## Translating the centre

Compute polar relative to `p - c(t)` where `c(t)` is a slow drift —
Lissajous, fbm-driven, or audio-parametric. The kaleidoscope still has
n-fold symmetry **around c(t)**, but that point moves across the screen,
so the apparent symmetry of the *frame* changes continuously.

**Key trick:** drift amplitude should be smaller than the inter-tile
spacing. Otherwise tiles visibly slide across the frame and the motion
dominates the form. A gentle 10-20% drift feels like the composition is
"breathing" without falling apart.

```glsl
vec2 centre = 0.15 * vec2(sin(t * 0.11), cos(t * 0.07));
vec2 q      = p - centre;
float th    = atan(q.y, q.x);
float th_n  = mod(th + PI / n, TAU / n) - PI / n;
```

## Varying the symmetry order

For a piece that wants a single fold count (in-seven → 7), don't vary.
But for a piece about transformation, interpolate between integer orders:

```glsl
float n = floor(n_target);
// fold with both n and n+1, blend by fractional part
```

Same trick as `first-bloom`'s petal interpolation. Avoids seam discontinuity.

## Composing with translation

Apply translation **before** the fold: the whole field shifts under the
symmetry. Apply translation **after** the fold (by displacing the final
sampled pattern): the symmetry stays at origin but the pattern itself
wobbles. Different feels, sometimes worth composing both.

## What makes it work in a piece

- Drift is slow (period > 10s). Fast drift looks like animation, not
  composition.
- Drift is small (amplitude < inter-tile spacing). Big drift defeats
  the symmetry.
- Drift is section-dependent. During tight sections, no drift. During
  loose sections (solos, breaks), drift opens up.

Applied in `in-seven` v2. Without this, the piece looks identical every
30 seconds.
