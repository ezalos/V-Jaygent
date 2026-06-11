# warmCycle

## What

5-keyframe cyclic palette covering gold → amber → rust → wine → mauve and
wrapping back to gold. Never touches cool hues — contrast comes from luminance,
not hue rotation. The VISION.md default palette.

## When to reach for it

Any piece whose default disposition is "warm". If you catch yourself writing
"I need a warm cycling palette here," paste `warmCycle`, then tune `t`'s drift
rate to the piece's tempo. Pieces that shouldn't use it: refraction /
kaleidoscope / dispersion pieces (use `iqCosine` as a sub-element hue there per
VISION.md's spectrum exception); dark pieces where the cream peak would blow
out (use `ember` instead).

## Knobs

- **`t` drift rate** — the input to `warmCycle` is typically `0.05 * u_time`
  (slow shift) or tied to per-pixel noise (spatial hue variation). In pieces
  that want motion, typical rates are `u_time * 0.02` to `u_time * 0.15`.
- **Keyframe tweaks** — the 5 anchor colors are chosen for luminance
  monotonicity with a warm bias. Shifting any keyframe changes the character
  of the whole palette. If you need to shift one, copy the function and rename
  it, don't mutate this canonical.

## Lineage

Currently duplicated identically in:
- `pieces/aperture/shader.frag` (l.16)
- `pieces/in-seven/shader.frag` (l.35)
- `pieces/lodestone/shader.frag` (l.21)
- `pieces/prism/shader.frag` (l.29)
- `pieces/strata/shader.frag` (l.28)
- `pieces/well/shader.frag` (l.14)

No divergent variants shipped yet. When one appears, add a line here describing
what changed and why.
