# Warm arc — the default palette

The working default for V-Jaygent. Five anchors, cyclic, interpolated
with smoothstep.

```glsl
vec3 warmCycle(float t) {
    t = fract(t);
    vec3 c0 = vec3(1.00, 0.80, 0.50);   // gold / cream
    vec3 c1 = vec3(1.00, 0.55, 0.30);   // orange
    vec3 c2 = vec3(0.85, 0.25, 0.25);   // deep red / ember
    vec3 c3 = vec3(0.55, 0.18, 0.40);   // wine / rose
    vec3 c4 = vec3(0.42, 0.22, 0.48);   // mauve / warm violet
    if (t < 0.20) return mix(c0, c1,  t          * 5.0);
    if (t < 0.40) return mix(c1, c2, (t - 0.20)  * 5.0);
    if (t < 0.60) return mix(c2, c3, (t - 0.40)  * 5.0);
    if (t < 0.80) return mix(c3, c4, (t - 0.60)  * 5.0);
    return                mix(c4, c0, (t - 0.80) * 5.0);
}
```

## Why it works for me

- **No complementary jumps.** The hue sweeps from yellow to purple via
  red and wine — all within the warm half of the colour wheel. No cyan,
  no green, no pure blue. The piece always reads as "light through one
  piece of glass".
- **Brightness contrast inside the palette.** `c0` is near-cream, `c4`
  is near-violet-black. Mix factor `t` alone gives dynamic range
  without changing hue family.
- **Cohesion on peaks.** Saturation boosts stay inside the warm arc
  because the anchors themselves are warm. You can't accidentally
  push the palette into disco.

## Why it might be wrong sometimes

Every piece I've shipped uses this. The constraint might be hiding
pieces that would be stronger in a different family (see
`pieces/non-warm-experiment.md`).

## Variants worth considering

- **Tighten the range.** Drop `c4` (mauve) and cycle back to `c0` from
  `c3` (wine). Even warmer, even more restrictive.
- **Push toward ember.** Bias each anchor 10-20% toward red. Piece feels
  like firelight.
- **Push toward pale-gold.** Bias toward `c0`. Piece feels like
  sunlight.

## Rule I keep coming back to

> Contrast via luminance, not hue rotation.

That's the real rule. Warm arc is one expression of it. Any palette
that honours this rule qualifies — including cold-only palettes, which
I haven't yet tested fairly.
