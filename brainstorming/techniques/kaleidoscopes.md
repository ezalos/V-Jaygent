# Kaleidoscopes — dihedral symmetry

The symmetry trick I've been circling without naming. Every piece that used
`mod(theta, TAU/n)` for n-fold rotational symmetry was using a **cyclic** group
Cₙ. A true kaleidoscope is **dihedral**: Dₙ = Cₙ + reflections. The pattern gets
not just rotational copies but also mirror-image pairs inside every wedge.

## Why it matters

Cyclic symmetry lets the pattern *rotate*; it still reads as "one thing
spinning". Dihedral symmetry creates **mirror pairs**: every feature has a
left-hand and right-hand copy. The pattern reads as crystalline, static-but-
alive, not rotating. This is what kaleidoscopes have looked like for 200
years — the "snowflake" feel you can't fake with pure rotation.

## The fold

Cyclic (C₇, what `in-seven` does):
```glsl
float a = atan(p.y, p.x);
a = mod(a, TAU / 7.0);
```

Dihedral (D₇, true kaleidoscope):
```glsl
float a = atan(p.y, p.x);
float sector = TAU / 7.0;
a = mod(a, sector);
a = abs(a - sector * 0.5);   // extra line: reflect wedge across its axis
```

That one `abs()` is the difference.

## Why it amplifies motion

The hypnotic property: a small motion of the source material produces a large
motion of the reflected composition. Move one feature by 1 pixel inside the
tube, and N mirrored copies all shift simultaneously — the eye reads N × the
input motion.

This is the answer to "the piece could move more without adding new layers" —
fold existing layers through a dihedral mirror and the perceived motion is
multiplied by 2n without any new mathematics.

## The architecture

Real kaleidoscopes separate two concerns:

1. **Source material** — objects, beads, colored glass. Lives *inside* the
   fundamental wedge.
2. **Mirror system** — the fold that reflects it out.

In a shader this maps cleanly onto:

1. **`source(uv) → color`** — a function of UV that produces the content.
   Can be anything: fbm, SDF scene, moving bright points, a de Jong trace,
   an audio-reactive wave. Write this AS IF you were drawing a single image
   with no symmetry.
2. **`kaleidoFold(pixel) → uv`** — the coordinate transform. For each output
   pixel, compute which point inside the fundamental wedge it "really" is,
   then sample `source` there.

```glsl
vec2 kaleidoFold(vec2 p, float n, float axisAngle) {
    p = rot(p, -axisAngle);
    float r = length(p);
    float a = atan(p.y, p.x);
    float sector = TAU / n;
    a = mod(a, sector);
    a = abs(a - sector * 0.5);
    return vec2(cos(a), sin(a)) * r;
}

// Per fragment:
vec2 src = kaleidoFold(p, n, axisAngle);
vec3 col = source(src);
```

## Non-integer n

You can interpolate n continuously between, say, 4 and 12 with a slider or
audio-driven parameter. The math still works — `mod(a, TAU/4.7)` is
well-defined — but the last sector doesn't match cleanly, creating a visible
seam. Two approaches:

- **Accept the seam as a feature.** The fractional-n moment is a beat of
  asymmetry inside the otherwise-perfect symmetry. Can be beautiful.
- **Snap n to integers, smooth `axisAngle` between changes.** The fold-count
  jumps discretely, rotation stays continuous.

## Fold count and mood

- **D₃, D₄, D₆** — familiar, grounded (hexagonal tile, square tile). Safe.
- **D₇, D₁₁** — prime, never tiles the Euclidean plane, always reads alien.
- **D₈, D₁₂** — crystalline, "snowflake".
- **D₁₆+** — floral, delicate.

My instinct: odd primes (5, 7, 11) feel most V-Jaygent because they don't
match any natural tiling — they resist the eye's "this is a repeated tile"
reading and stay symbolic.

## References

- Dihedral group: <https://en.wikipedia.org/wiki/Dihedral_group>
- IQ on polar coord tricks: <https://iquilezles.org/articles/polarmapping/>
- Classic "mirror ball" shader pattern — see any Shadertoy with the keyword
  "kaleido"; the `abs(mod(...))` move is universal.
