# Moiré interference

Two periodic patterns sampled at slightly different frequencies (or rotated
by a small angle) beat against each other, producing a third low-frequency
pattern — the moiré. Cheap in a shader, high visual impact, extremely
VJ-coded.

## Math

For two sinusoidal gratings of frequencies `f1` and `f2`:

```
cos(2π f1 x) · cos(2π f2 x) = ½ [cos(2π (f1+f2) x) + cos(2π (f1−f2) x)]
```

The beat frequency `|f1 − f2|` is what the eye sees. Tiny differences in
spatial frequency = low beat frequency = big bands.

For two rotated gratings of angle Δθ:

```
beat_frequency ≈ f · Δθ   (for small Δθ)
```

## Clean shader recipe

```glsl
float grating(vec2 p, float f, float angle) {
    vec2 d = vec2(cos(angle), sin(angle));
    return 0.5 + 0.5 * cos(dot(p, d) * f * 6.28318);
}

float moire = grating(p, 40.0, 0.0) * grating(p, 40.3, 0.02);  // two near-identical
```

Or with hard 1-bit quantization for the Ikeda look:

```glsl
float bw(vec2 p, float f, float angle) {
    return step(0.5, grating(p, f, angle));
}
float ikedaish = abs(bw(p, 40.0, 0.0) - bw(p, 40.3, 0.02));
```

## Variations

- **Radial moire:** concentric rings at slightly different centres.
- **Polar moire:** angular gratings with slightly different fold counts
  (heptal vs. octal → 1-fold beat pattern).
- **Lattice moire:** sample two square grids at different scales via
  `floor(p * scale_i)`.

## Audio binding

Modulate one of the frequencies — `f2 = 40.0 + 0.3 * bass` — and the beat
pattern breathes with the kick. Subtle but deeply groove-locked.

## Warnings

- On low-DPI displays moire can alias badly. Antialiasing via a small
  `mix(grating, smoother, edge_width)` fixes it.
- Two gratings is one beat; three is a mess. Stop at two.

## References

- Moiré (physics / optics): <https://en.wikipedia.org/wiki/Moir%C3%A9_pattern>
- Moving grids produce static moire:
  <https://www.nature.com/articles/s41598-020-70427-x>
