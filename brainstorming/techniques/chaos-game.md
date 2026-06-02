# Chaos game — fractals from midpoint-jump iteration

A simple recurrence with a restriction rule produces structures that are
provably non-trivial: Sierpiński triangles, "carpet"-style square fillings,
pentagon and hexagon fractals you have probably never seen named.

The canonical reference is the chaos game pair Fronkonstin /
`aschinchon/the-chaos-game` (2019) — three Rcpp scripts that walk through
the same algorithm with three different restriction rules.

## Why this is a V-Jaygent material

1. **Point cloud, not a field.** The output is a sequence of plotted points
   — a density texture. Cousin of `strange-attractors.md` (limit set of an
   iterated map plotted directly).
2. **One scalar knob with huge effect.** Number of polygon vertices `n` and
   restriction rule index `R` reshape the result entirely. Easy to gate to
   music sections.
3. **Distinct from noise / fbm.** The texture is recognisably *algorithmic*
   — has a structural identity that fbm / curl never produces.

## The canonical algorithm (Fronkonstin / aschinchon)

```
Inputs: n_vertex (≥ 3), jump fraction r (0.5 canonical),
        restriction depth k (0, 1, 2, 3), iteration count N (10M typical)
Polygon: n_vertex points on the unit circle, vertex i at angle
         (i − 1)·2π/n + π/2.
State:  current point p ∈ R², history of last k chosen vertex indices.

Loop N times:
  1. Pick a random vertex index v ∈ {1..n_vertex}.
  2. If restriction is active (k > 0) AND the last k chosen vertices are
     all equal, reject v until it satisfies the rule (see below).
  3. p ← p + r · (vertex[v] − p)        // midpoint with r = 0.5
  4. Plot p.
  5. Push v onto the history; drop the oldest.
```

The three published variants differ only in step 2 (`chaos_funcs.cpp`):

| variant | restriction (condition under which v is rejected) |
|---|---|
| `createChaos1` (k=1) | `v == v_prev` — never pick the same vertex twice in a row. |
| `createChaos2` (k=2) | if the last *two* vertices were equal, reject `v` that is a **neighbor** of `v_prev` (i.e. `abs(v − v_prev) == 1` or wrap-around). Otherwise no restriction. |
| `createChaos3` (k=3) | same neighbor rejection, but only triggered when the last *three* vertices were equal. |

In all variants `r = 0.5` (midpoint) and the polygon is the regular n-gon.
Plotting is `geom_point(shape=46, alpha=0.01)` — single-pixel dots with
heavy transparency so density reveals the fractal.

## Canonical iteration kernel (verbatim from aschinchon/the-chaos-game)

```cpp
for(int i = 1; i < n; ++i) {
    // Pick a vertex (with restriction rule, omitted here)
    int v = rand() % n_vertex + 1;
    // Vertex coordinates
    double angle = (v-1)*2*M_PI/n_vertex + M_PI/2;
    double vx = cos(angle), vy = sin(angle);
    // Midpoint jump
    double d = sqrt(pow(x[i-1]-vx,2) + pow(y[i-1]-vy,2));
    double a = atan2(vy - y[i-1], vx - x[i-1]);
    x[i] = x[i-1] + (d/2)*cos(a);
    y[i] = y[i-1] + (d/2)*sin(a);
}
```

Equivalent simpler form: `p = mix(p, vertex[v], r)` with `r = 0.5`.

## Named results (jump = 0.5, k = 0)

| n_vertex | restriction | fractal |
|---|---|---|
| 3 | k=0 | **Sierpiński triangle** — the canonical result. |
| 4 | k=0 | **uniform square** (boring — no fractal). |
| 4 | k=1 | the **"square chaos" fractal** — diagonal carpet, the reason restrictions exist. |
| 5 | k=2 | filled pentagon with five-fold lace. |
| 6 | k=2 | hexagonal flower with a void at the centre and six lobes. |
| 7 | k=2 | seven-fold version of the hex result. |

The Wikipedia chaos-game page has a fuller table; the rule of thumb is
**raising `n` past 3 requires a non-trivial restriction** to get a fractal
rather than a fill.

## Generalisations the canonical sources skip

Two knobs the original papers do not vary but obviously matter:

- **Jump fraction `r`**. Canonical is 0.5. With `r < 0.5` the structure
  collapses toward the centre (the lace shrinks). With `r > 0.5` it spreads
  toward the polygon edge and becomes thinner. `r` is a beautiful audio
  knob.
- **Per-vertex weights**. Pick vertex `v` with probabilities `w_v` instead
  of uniform — biases the density toward a sub-region. Very nice for
  "spotlight" effects on one petal of the fractal.

## Realtime in a fragment shader — the architectural question

The chaos game is a **point-cloud accumulator**, not a per-pixel field. A
single-pass fragment shader has no way to "plot N points" — each fragment
only knows its own coordinate. Two viable architectures:

### A. Per-pixel inverse — DOES NOT WORK

There is no closed-form pre-image for "which seed lands at this pixel after
N iterations". The chaos-game map is contractive with a multi-valued
inverse (each pixel has `n_vertex^k` pre-images at depth `k`). Don't
attempt this.

### B. u_history scatter (recommended)

Use the **layer-engine `u_history`** ping-pong. Each frame:

1. **Scatter pass.** Each fragment computes a *short* orbit starting from a
   seed derived from `(uv, frame, hash)`. After K = 32-64 iterations the
   point lands on the attractor. The fragment writes brightness into
   `u_history` *at its own position* if its final orbit point lands inside
   this pixel's UV neighbourhood (a small `smoothstep` window). Different
   seeds per frame → coverage builds up over time.
2. **Decay pass.** Each frame multiplies `u_history` by `0.96` so old paths
   fade — the structure is permanently re-emerging, never frozen.
3. **Display.** Sample `u_history`, apply log tone-map (`log(1 + density)`),
   feed the warm cycle.

This is the same trick as fractal-flames rendering. With ~1M fragments per
frame and orbits of length 32, you get an effective ~30M-points-per-second
plot — well above the 10M points the R reference uses for a static image.

### C. Pre-baked LUT (escape hatch)

If u_history scatter feels heavy, generate the density texture **once**
offline with the explorer tool (`bin/explore-attractor.mjs chaos-game …`)
and ship it as a piece-local `data/chaos-n5-k2.png`. Lose the audio
modulation of `n / r / k` — only colour and warp can react. Cheap but
inert.

## Audio modulation slots

For a chaos-game piece, the natural mappings are:

| audio feature | parameter | effect |
|---|---|---|
| section index (intro / verse / peak / outro) | `n_vertex` snap (3 → 5 → 7 → 5) | the fractal *family* changes at section boundaries — visible phase-lock |
| sustained energy | `r` (0.4 → 0.55) | the lace breathes outward on a build |
| per-beat hit | one-shot weight spike on a single vertex | the spotlight flicks around the polygon on the beat |
| treble | restriction rule `k` (0 / 1 / 2 / 3) | the lace acquires more rules as the high end opens up |

The "section announces itself" rule from `feedback_visual_phase_lock`
applies: pin **n_vertex** changes to bar / downbeat, not to the energy
envelope.

## Cursor coupling

Two natural moves:

- **Drag a vertex.** Move one polygon vertex toward the cursor (clamp
  inside the unit disk). The fractal pulls toward the cursor — a directly
  legible perturbation.
- **Add a 7th attractor.** When the cursor is held, treat it as an extra
  vertex with weight ramp-up. The fractal grows a new lobe under the cursor
  and decays back when released.

## See also

- `brainstorming/techniques/strange-attractors.md` — the sister case, where
  the map is a continuous recurrence (Clifford, de Jong, 2D-map) rather
  than a piecewise n-vertex midpoint jump.
- `brainstorming/techniques/basins-of-attraction.md` — the cousin where the
  pixel **is** the seed and the colour is the orbit's *destiny*, not its
  density.

## References

- Article: <https://fronkonstin.com/2019/10/28/the-chaos-game-an-experiment-about-fractals-recursivity-and-creative-coding/>
- Code: <https://github.com/aschinchon/the-chaos-game> (`chaos_funcs.cpp`)
- Wikipedia chaos-game entry has the named-fractal taxonomy table.
