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
