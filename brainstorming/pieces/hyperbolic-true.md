# Hyperbolic true — proper {7,3} tiling

`in-seven` uses a 7-fold kaleidoscopic fallback because I couldn't commit
the time to build a correct {7,3} tiling in a session. This is the piece
that does it right.

## The math (to nail down)

The (2, 3, 7) triangle group has a fundamental triangle with angles
π/2, π/3, π/7. Three mirrors:

- A diameter at angle 0 (Euclidean reflection y ↦ -y).
- A diameter at angle π/7 (reflection across that line).
- A circle perpendicular to the unit circle, whose centre + radius satisfy
  the triangle's constraints.

For regular {p,q} with vertex at origin: `cosh(d) = cos(π/q) / sin(π/p)`
where d is the hyperbolic distance from origin to the far vertex. The
Euclidean distance in the Poincaré disk is `tanh(d/2)`.

Rendering: for each pixel z, iterate the three reflections (applying
whichever one moves z closer to the fundamental triangle) until z is
inside. Count reflections for colouring.

## Aesthetic

Keep the warm palette. Each tile gets a narrow-spread hue so adjacent tiles
read like facets of a prism. Let reflection-count drive luminance — deep
tiles (many reflections to reach) are darker, nearby tiles brighter.

## Risk

Iteration count can blow up near the disk boundary where tiles become
vanishingly small. Cap at ~32 iters; render tiles past that as a warm
fog. At target res with `render_scale: 0.55` I'd expect 50-80 fps.

## Why it matters

Because In Seven cheated. The 7-fold kaleido fold produces concentric
rings of tiles but they're not *hyperbolic*; they're Euclidean rings with
a log remap. A proper {7,3} tiling has the correct angular defect, the
correct tile shapes, and the correct way tiles crowd the boundary. It
would look subtly but unmistakably different.

## Related

- `techniques/kaleido-variations.md` — the cheating version.
- `inspirations/shadertoy-references.md` — Shadertoy has a handful of
  {p,q} hyperbolic tilings worth studying.
