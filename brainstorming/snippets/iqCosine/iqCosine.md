# iqCosine

## What

Iñigo Quílez's cosine-formula palette: three cosines, one per channel, offset
by (0, 120°, 240°) to produce a smooth rainbow. The (a, b, c, d) vectors tune
offset / amplitude / frequency / phase per channel.

The canonical values here are specifically tuned so the saturation rolls back
at peaks — primaries never clip to pure cyan/magenta/lime. That matches the
VISION.md requirement that high-saturation primaries at peak brightness should
not appear.

## When to reach for it

The "spectrum exception" per VISION.md. A piece that is *about* light breaking
into colors — prisms, kaleidoscopes, refraction, dispersion, gravitational
lensing with chromatic split. Not for general warm work (use `warmCycle`).

Also useful: assigning a slowly-drifting hue to a sub-element of a piece that
otherwise stays warm. `prism` uses this for the bouncing kaleidoscope disks
while the background remains warm.

## Knobs

All four vectors are tunable. Common variations:
- **Darker spectrum** — `a = vec3(0.35, 0.30, 0.35); b = vec3(0.45, 0.45, 0.45);`
  produces a palette that sits lower in luminance.
- **Warm-biased spectrum** — shift `d` to `(0.0, 0.1, 0.2)` to pull the phase
  toward red/orange dominance.
- **Higher frequency** — `c = vec3(1.0, 1.0, 2.0)` makes blue cycle twice per
  `t`, producing "second-harmonic" palette sweeps.

Don't change the canonical values here; copy the function and tune.

## Lineage

Currently in:
- `pieces/prism/shader.frag` (l.46, called `spectrum` locally — same function)

## Reference

Iñigo Quílez, "palettes":
https://iquilezles.org/articles/palettes/
