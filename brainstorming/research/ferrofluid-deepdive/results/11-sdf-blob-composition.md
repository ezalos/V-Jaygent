## summary

The crazy-beautiful single-blob reading comes from one SDF sphere
displaced by the height field, NOT a procedural spike-cluster. When
one blob isn't enough, smin a small (2–4) cluster of seed spheres into
a continuous body — IQ's polynomial smin variants give a smooth join
that still reads as one liquid.

## why_mesmerizing

A singleton blob is the "it's a creature" anchor — the eye attaches
and tracks. A smin'd cluster reads as a single body whose internal
topology shifts with the music: when the join opens, the eye sees
"two", when it closes, "one". That binary reading driven by a continuous
parameter is the same trick that makes lava lamps hypnotic. The
displacement-from-height step is what turns the SDF into ferrofluid
rather than a metaball — spikes inherit their direction from the
field, not from the SDF.

## concrete_steal

Single-blob, displacement-from-height:

```glsl
float dBlob(vec3 p, float h) {
  // h = height field sampled at (p.xy / scale), driven by music+cursor.
  return length(p) - (R0 + h);
}
```

Cluster of seeds (use V-Jaygent's existing `opSmin` from
`lib/sdf.glsl`, which is IQ's quadratic — already the recommended
default):

```glsl
float dCluster(vec3 p) {
  float d = dBlob(p - s0, h0);
  d = opSmin(d, dBlob(p - s1, h1), kJoin);   // kJoin ~ 0.15..0.40
  d = opSmin(d, dBlob(p - s2, h2), kJoin);
  return d;
}
```

Animate `kJoin` per-section: tight (0.10) on hits, loose (0.45) on
sustained pads — the cluster visibly merges/splits with structure.
For a richer profile use IQ's cubic smin (smoother near the join,
slightly slower); switch only on the "headline" join, leave the rest
on quadratic.

Seed positions: place 2–3 seeds inside one circle of radius `<R0`
(so the smin'd surface is convex), drift them on Perlin paths at
~0.2 Hz. Keep them close — distant seeds break the singleton reading.

## glsl_path

Runs in the SDF / height-field pass. Cost is linear in seed count:
~3 spheres + 2 smin operations per pixel for a 3-seed cluster, well
within budget for a single-shader piece. If using sphere-tracing,
each step pays this cost; switch to a 2D height-field rasterisation
if marching becomes the bottleneck.

## caveats

- `kJoin` too large = puddle, no ferrofluid silhouette. Cap at ~0.5 *
  min(seed-radius).
- Many seeds (>5) flatten the shape into a blob with no structure —
  the singleton reading dies. 2–4 is the sweet spot.
- IQ's quadratic smin "never overestimates" but does break the
  Lipschitz bound near k — long marching steps can overshoot. Use
  step factor 0.7 or smaller during smin'd regions.
- Displacement breaks the SDF guarantee outright. Either reduce step
  size globally or render as a 2D height-field with screen-space
  normals (cheaper and matches V-Jaygent's full-screen-quad bias).
- Seeds drifting outside the central support radius pop the cluster
  into separate blobs — clamp seed positions or fade their weight.

## references

- Inigo Quilez, "Smooth minimum" (quadratic / cubic / exp variants):
  https://iquilezles.org/articles/smin/
- Inigo Quilez, "A Study on Smooth-Minimums" (2024 deep-dive):
  https://www.patreon.com/posts/new-article-on-99909336
- Inigo Quilez, "Distance functions" (SDF primitives):
  https://iquilezles.org/articles/distfunctions/
- glsl-smooth-min (npm/glslify port of IQ's variants):
  https://github.com/glslify/glsl-smooth-min
- V-Jaygent local: `lib/sdf.glsl` already exposes `opSmin` (IQ
  quadratic); `layers/lodestone-pull/shader.frag` for the existing
  ferrofluid-adjacent SDF approach.
