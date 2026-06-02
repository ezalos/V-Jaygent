# Domain warping

Iñigo Quílez's canonical move: `fbmRot(p + fbmRot(p + fbmRot(p)))`. Warp
the input coordinates of a noise function by another noise function.
Recursion gives fluid, natural patterns that look handmade.

**Use `fbmRot`, not `fbmGrid`.** Domain warping amplifies the grid
artefacts that `lib/noise.glsl`'s `fbmGrid` carries — the warp samples
near the same integer-grid points the grid-aligned octaves of fbmGrid
would expose. The rotated variant scrambles the per-octave basis and
keeps the field organic. (See `lib/noise.glsl` header — `fbm` was
renamed to `fbmGrid` on 2026-06-03 to force opt-in to the unsafe
variant; `fbmRot` is the default choice.)

## Why it works for procedural art

- **Breaks grid-alignment.** Even `fbmRot(p)` benefits from warping —
  perturbed sampling smears any residual scale structure into
  something organic. `fbmGrid(p)` would expose its octave grid.
- **Depth at every zoom.** The warped function has interesting detail
  at arbitrary scale, so zooming reveals new structure rather than
  exposing the lattice.
- **Cheap long-period variation.** A single `t` added to the warp
  offset makes the whole field flow continuously. 30 seconds looks
  different from 10 seconds different from 3 seconds.

## The recipe

```glsl
vec2 q = vec2(fbmRot(p + vec2(0.0, u_time * 0.05)),
              fbmRot(p + vec2(5.2, 1.3)));

vec2 r = vec2(fbmRot(p + 4.0 * q + vec2(1.7, 9.2)),
              fbmRot(p + 4.0 * q + vec2(8.3, 2.8) - u_time * 0.03));

float v = fbmRot(p + 3.2 * r);
```

`v` now has rich structure driven by two levels of warping.

## Parameters worth tuning

- **Warp strength** (the `4.0`, `3.2` coefficients). Low = subtle noise
  variation. High = visibly warped, almost turbulent. Mood control.
- **Octave count** in `fbmRot` itself (5 by default). 4-5 gives plenty
  of detail for fragment-shader budgets. 8+ for hero shots only —
  but watch for u_history-fed pieces, where extra octaves get baked
  into trails.
- **Time-on-which-axis.** Adding `t` to the primary offset moves the
  whole field. Adding to the secondary warp changes the *pattern*.
  Different feels.

## Where I've used it

- `well` — nebula background. The fbm nebula *is* a domain warp.
- `in-seven` v2 — void-fill behind the lattice.

## Where I haven't yet

- As the sole form of a piece (no kaleidoscope, no fractal, no lattice —
  just pure domain-warped flow). Close to "Nebula" as a genre; would
  test whether my palette rules hold for unstructured pieces.
