# Strange attractors

Chaotic 2D recurrences that, when iterated from random seeds and plotted,
settle onto fractal-dimension curves. Classic VJ material because they:

1. Look alive without audio — the chaos has its own motion.
2. Have small numerical form — a 2-line recurrence per attractor.
3. Work as *point clouds*, ideal for one layer of a composition.

## The canonical four

### De Jong
```
x' = sin(a·y) − cos(b·x)
y' = sin(c·x) − cos(d·y)
```
Four parameters `a, b, c, d` typically in [-3, 3]. Tiny parameter changes
reshape the entire attractor. Hand-tune or modulate with audio mids.

### Clifford
```
x' = sin(a·y) + c·cos(a·x)
y' = sin(b·x) + d·cos(b·y)
```
Softer than de Jong; fewer sharp edges, more continuous curves.

### Lorenz (3D, projected)
```
ẋ = σ(y − x)
ẏ = x(ρ − z) − y
ż = x·y − β·z
```
The famous "butterfly" — requires time-integration, so in a fragment shader
you'd precompute a trail as a texture OR iterate a fixed number of steps per
pixel (expensive).

### Aizawa (3D, projected)
```
ẋ = (z − b)·x − d·y
ẏ = d·x + (z − b)·y
ż = c + a·z − z³/3 − (x² + y²)(1 + e·z) + f·z·x³
```
More visually baroque than Lorenz, harder to tune.

### General 2D-Map (14 coefficients)
```
x' = a1 + a2·x + a3·y + a4·|x|^a5 + a6·|y|^a7
y' = a8 + a9·x + a10·y + a11·|x|^a12 + a13·|y|^a14
```
14 parameters — overkill for a piece (no human-tunable parameter space),
but excellent **seed bank**: pick a known-good 14-tuple and modulate one
or two slots with audio. The codingclubuc3m reference set is
```
a1..a7  = -0.8,  0.4, -1.1,  0.5, -0.6, -0.1, -0.5
a8..a14 =  0.8,  1.0, -0.3, -0.6, -0.3, -1.2, -0.3
```

## Canonical parameter sets (verified beautiful)

For `bin/explore-attractor.mjs` and piece seeds — these are the
codingclubuc3m / Fronkonstin references that produce known-pretty
plots at 10M iterations.

| attractor | a, b, c, d (or full set) | character |
|---|---|---|
| Clifford | −1.25, −1.25, −1.82, −1.91 | dense web, four-lobed |
| Clifford | −1.2, −1.9, 1.8, −1.6 | softer, lacework |
| de Jong | 1.4, −2.3, 2.4, −2.1 | sharp folds |
| de Jong | −2.0, −2.0, −1.2, 2.0 | three-petal swirl |
| 2D-Map | see above 14-tuple | tentacled branching |

## Using them in a shader (single-pass)

A fragment shader can't maintain state across pixels, so the usual
pattern is:

- For each pixel, iterate the attractor from *a seed derived from pixel
  coordinates* for a small number of steps (say 40).
- The point ends up near the attractor's surface.
- Use the distance from the pixel to the final iterated point, or the
  sum of visited positions, as the layer's contribution.

```glsl
vec2 iterateDeJong(vec2 z, vec4 param, int steps) {
    for (int i = 0; i < 40; i++) {
        if (i >= steps) break;
        z = vec2(sin(param.x * z.y) - cos(param.y * z.x),
                 sin(param.z * z.x) - cos(param.w * z.y));
    }
    return z;
}
```

Then use `z` as a UV into a color or a distance check. The attractor becomes
a **background texture** rather than a plotted set of points.

## Multi-pass alternative (future)

Proper attractor rendering needs **histogram accumulation**: iterate millions
of seeds, accumulate into a framebuffer, tone-map log-density. Same trick as
fractal flames. Requires ping-pong / compute pass.

### u_history scatter — DOES NOT WORK IN LAYER-ENGINE v1

This section originally described a "per-fragment scatter into
u_history" path for realtime fractal-flame rendering in `layers:`. The
silk-2026-06-02 attempt proved the math wrong: per-fragment self-hit
probability for a chaotic attractor is density × pixel_area ≈ 10⁻⁵
per fragment, and fragment shaders cannot scatter to OTHER pixels —
so each fragment's orbit endpoint is wasted unless it happens to map
back to the same pixel (vanishingly rare). After 600 frames the lace
hasn't formed.

See `brainstorming/critiques/silk-v1-blocked.md` for the full failure
analysis.

**The actual realtime path for fractal-flame density rendering** is
`passes:` (multi-pass) with rgba16f ping-pong:

1. Pass 0 (accumulate): vertex shader rasterises N points per frame
   at orbit positions; fragment additive-blends into rgba16f. Each
   frame N=4K-16K points.
2. Pass 1 (display): read accumulator, log tone-map, warm palette.

This requires CPU-side orbit tracking + per-frame vertex-buffer
update (transform-feedback or instanced draws). The runtime extension
for this is noted in VISION.md §"Open questions" → N-body /
transform-feedback particles — same infrastructure.

**Alternative paths** (lower bar):

- Per-pixel orbit + endpoint-as-palette-lookup. Each fragment iterates
  K times from its own UV; orbit endpoint feeds a warm palette.
  Produces a continuous warped field (NOT a density plot) — recognisable
  attractor shape but not the "10M dots, fine lace" aesthetic. This is
  what the per-pixel snippet earlier in this doc actually achieves; it
  was the right reading.
- Pre-baked LUT: render the density texture offline with
  `bin/explore-attractor.mjs`, ship as a piece-local PNG. Audio can
  only warp / colour-shift the static texture.

## As a VJ layer

A de Jong slice with slow parameter modulation (audio mid → `param.w`) makes
a beautiful **organic, slowly-mutating backdrop** unlike any noise-based
pattern. Distinct silhouette from fbm.

## See also

`brainstorming/techniques/basins-of-attraction.md` is the cousin
note. A strange attractor is the *limit set* you plot directly (this
note). A basin map colors phase space by *which* attractor each
starting point reaches — destiny, not the destination. 2swap's
gravity-basin / pendulum / Newton-fractal work is the basin half.

## References

- de Jong math: <https://www.algosome.com/articles/strange-attractors-de-jong.html>
- Clifford + de Jong interactive: <https://observablehq.com/@rreusser/clifford-and-de-jong-attractors>
- codingclubuc3m walkthrough (Clifford + General 2D-Map, with verbatim
  Rcpp code and the parameter sets used above):
  <https://codingclubuc3m.rbind.io/post/2019-10-15/>
- aschinchon/the-chaos-game (sister algorithm, not strange-attractor):
  <https://github.com/aschinchon/the-chaos-game>
