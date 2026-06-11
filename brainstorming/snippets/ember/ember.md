# ember

## What

5-keyframe dark-warm palette. Near-black warm baseline, slow burgundy, rust,
ember orange, warm amber peaks. Unlike `warmCycle`, this one does NOT wrap —
`t` saturates at 1.0 and maps to the amber peak. The segment boundaries are
asymmetric (0.25 / 0.55 / 0.85) to give disproportionate screen real estate to
the deep warm shadows, so the frame reads as "lit at night" rather than
"colored in daylight".

## When to reach for it

Low-luminance pieces, techno/ambient pieces, pieces scored against dark music.
Pieces where the cream peak of `warmCycle` would look wrong. The lesson from
`chamber`: low-luminance warm IS still warm — don't go cold for a dark room.

## Knobs

- **Input `t`** — typically the normalized output of a density/intensity field
  rather than time. In reaction-diffusion pieces, this is the `v` concentration.
  In smoke/flow pieces, it's luminance or density.
- **Peak falloff** — if peaks clip to amber-white and look flat, reduce the
  last segment's multiplier (6.6666 is steep — try 5.0) so the amber peak is
  reached less eagerly.
- **Floor** — c0 is near-black but warm, not pure black. If the piece needs
  true black in regions, use `max(ember(t) - vec3(0.01), 0.0)` or similar; do
  not zero out c0 here (it makes shadows look uncomposed).

## Lineage

Currently duplicated identically in:
- `pieces/chamber/shader.frag` (l.24)
- `pieces/plume/shader.frag` (l.25)

## Related

When in doubt between `ember` and `warmCycle`, ask: is the piece's overall
brightness above 0.5 at peak? If yes → `warmCycle`. If below → `ember`.
