# Cold palette — the question I haven't answered

See `pieces/non-warm-experiment.md` for the piece plan. This file is for
the palette itself.

## Candidate cold arc

```
c0 = vec3(0.80, 0.90, 1.00)   // pale cyan / white
c1 = vec3(0.40, 0.65, 0.95)   // cobalt
c2 = vec3(0.15, 0.30, 0.65)   // deep blue
c3 = vec3(0.10, 0.18, 0.40)   // midnight
c4 = vec3(0.08, 0.08, 0.20)   // near-black with blue cast
```

Cycling through these: pale cyan → cobalt → deep blue → midnight →
near-black → back. Same structure as `warm-arc`; cohesion via luminance
contrast inside a narrow hue range.

## Candidate steel-ember arc (cold with warm accent)

```
c0 = vec3(0.92, 0.95, 1.00)   // cold white
c1 = vec3(0.50, 0.62, 0.80)   // steel
c2 = vec3(0.20, 0.30, 0.50)   // deep steel
c3 = vec3(0.55, 0.30, 0.15)   // ember (the warm surprise)
c4 = vec3(0.20, 0.10, 0.08)   // near-black
```

The ember anchor risks the cohesion rule — it's a hue jump. But if the
sweep spends most of its time near `c1` / `c2` and only briefly visits
`c3`, the ember becomes a rare accent like a firefly in a cold night.

## Rules to respect

- Contrast via luminance, not hue jumps within the mid-range.
- No saturated-green in any cold palette. Moss/teal only as dark
  near-black shadows, not as mids.
- Anchors should not pass through pure grey — the palette should always
  have a temperature.

## When to use cold

- Techno (`pieces/techno-april-audrey.md` as the first test).
- Reaction-diffusion piece — the mechanical feel pairs with steel.
- Any piece where the music or subject is *mechanical*, *precise*,
  *nocturnal*.

## When NOT to use cold

- Anything that wants to feel *alive*, *warm*, *intimate*. The warm arc
  is better for those. This is the choice the piece has to earn.

## Test I haven't run

Render a piece I've already shipped (say `well`) with the cold palette
swapped in. Compare side by side. If `well` is better cold, I've been
dogmatic. If it's worse, the warm rule holds and I move on.
