# yaktin-beni — v2 critique (Louis watchthrough redline batch #1)

Three redlines from Louis watching v1 live:

1. **Tentacles must get CRAZY at the drop** — "a chaotic tunnel, more than
   lightning, like a highway. You are projected in it and it goes all crazy
   over the edge and it must be unpredictable, unlike music."
2. **The blinking lights have weird corners** — "why so? not sure it's the
   best way."
3. **Kaleidoscope inside each triangle** — "the triangle is fun but maybe mix
   in a kaleidoscope inside each of the triangles... some mirror stuff going
   on inside the triangle mirrors."

## What changed

### acid-filament — chaotic flythrough tunnel at the drop
- New `drop` factor (peak-1 sid3 + the 95s long-peak sid5 = 1.0, rise sid2 =
  0.55, gated by bass). Calm sections keep the folded serpent; the drop
  transforms it.
- Tunnel depth `tz = 1/(rad+0.07) + time*(0.8+3.4*drop)` — 1/r vanishing point
  streaming outward (projected INTO it).
- Chaotic writhe = multi-octave fbm of (depth, angle) — driven by depth+time,
  NOT the beat, so it's genuinely unpredictable.
- HYPERSPACE STREAKS: thin radial lines (full-circle, unfolded angle) bent by
  fbm, brightness rushing outward along tz — the highway.
- Branching fork tentacle (lightning splits); edge-reaching renv at drop (over
  the edge); brightness cranked at the drop.

### girih-mandala — round lights + nested kaleidoscope
- Replaced the angular quasicrystal antinode dots (`pow(field, n)` → diamond/
  square corners) with `roundEmbers()` — round gaussian glows on a wandering
  jittered lattice, twinkling. Computed on UNFOLDED coords and NOT multiplied
  by the angular folded field (both of which re-introduced corners — see
  lessons). Pure round lights; the smooth radial env shapes them.
- `kaleidoFold()` — fold into 2N triangular wedges, then mirror subN(2-3) times
  inside each wedge → a kaleidoscope inside each triangle (visible leaf/lens
  nested-mirror cells). subN breathes with the vocal.
- Mandala recedes at the drop (`*= 1 - 0.45*drop`) so the tunnel dominates;
  the kaleidoscope stays as the walls.

### bloom-grain — round bloom
- 8-tap ring (octagonal corona) → 24-tap golden-angle spiral, aspect-corrected
  → isotropic round halo. Fixes the "corners on the lights" at the bloom stage.

## Grade (stills + drop clips)
- Kaleidoscope-in-triangle: LANDED — clear nested-mirror leaf cells, kaleido
  flower at the long-peak. ✓
- Round lights: LANDED — central + field lights are round soft embers; a few
  tiny dim squares remain (thumbnail aliasing, not the angular shapes). ✓
- Chaotic tunnel: SUBSTANTIALLY crazier — long spiraling tentacles reaching the
  edges, radial hyperspace streaks rushing out, fbm chaos not beat-locked. In
  stills it reads as a wild spiraling kaleidoscope-sun; the flythrough depth is
  carried by motion (streak rush). Hand to Louis's LIVE watch to judge whether
  the "highway you fly down" sense is strong enough — stills under-grade it.
- Lints: palette PASS (0.00% cool), idle PASS, composition PASS.

## Open for next redline
- If the tunnel still doesn't read as "projected into a highway" live: push the
  radial streak contrast + add a true log-polar zoom remap of the whole drop
  field (stronger forward-motion), and consider a brief full-frame zoom-blur.
- A few residual tiny square dots at the dim periphery (likely sub-pixel
  aliasing at render_scale 0.7) — bump render_scale or soften if Louis catches
  them live.
