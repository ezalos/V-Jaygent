# Basins of attraction — the image as a map of fate

## Why now

The 2swap study (2026-05-22 — see
`brainstorming/inspirations/2swap-refs.md`) named one technique worth
formalising and one piece worth building from it. 2swap's signature —
*Gravity Basins*, *Double Pendulums are Chaoticn't*, his Newton/root
fractals — is all the **same move**: color every pixel by the
*outcome* of a deterministic simulation seeded from that pixel.

This is a different generator from `strange-attractors.md`. A strange
attractor is the *limit set* you plot directly. A basin map plots
*which* attractor (or escape, or root) each starting point reaches —
it colors phase space by destiny. They are cousins; this note is the
basin half.

Decision this note answers: **how do you render a basin-of-attraction
field in a realtime single-pass WebGL2 fragment shader**, given that
2swap's renderer (`swaptube`) is offline CUDA. Answer up front: most
of it works single-pass with no ping-pong — each pixel's particle is
independent, so there is no cross-pixel accumulation to fake.

## The core idea

Every pixel is an **initial condition**. Run an iterated map or an
ODE integration from it for a bounded number of steps. Color by the
result:

- **hue** = *which* basin (which attractor / which root / escaped) —
  a discrete classification;
- **brightness** = *how fast* it resolved (escape time, capture time,
  iteration count) — the continuous channel that gives the filigree.

The mesmerizing payoff is emergent: you write a local rule, and
**fractal coastlines appear at the basin boundaries** — smooth lakes
shredding into infinitely fine detail where adjacent starts diverge.
A field that is uniformly smooth, or uniformly noisy, has missed the
point. The signature *is* the contrast between regular interior and
chaotic boundary.

## Recipe 1 — Gravity basins (single-pass, the lead recipe)

swaptube has **no N-body code** — 2swap's gravity video isn't in the
public repo. But the basin map is straightforward from primitives:
each pixel is a test particle's start position; integrate it under N
fixed attractors; classify by which one captures it.

```glsl
// N point attractors; hue = basin id, brightness = capture speed.
const int N = 3;
vec2 ATT[3] = vec2[3](vec2(-0.7,-0.4), vec2(0.7,-0.4), vec2(0.0,0.8));

vec3 gravityBasin(vec2 startPos) {
    vec2  p = startPos, v = vec2(0.0);
    float dt = 0.02;
    int   hit = -1;
    float steps = 0.0;
    for (int i = 0; i < 220; i++) {            // ~220 leapfrog steps = 60fps-ok
        vec2 a = vec2(0.0);
        for (int k = 0; k < N; k++) {
            vec2  d  = ATT[k] - p;
            float r2 = dot(d, d) + 0.05;        // softening — kills the singularity
            a += d / (r2 * sqrt(r2));           // inverse-square pull
            if (r2 < 0.06) hit = k;             // captured by attractor k
        }
        v += a * dt;  p += v * dt;              // semi-implicit Euler (leapfrog)
        v *= 0.995;                             // mild drag → guarantees it settles
        steps += 1.0;
        if (hit >= 0) break;
    }
    if (hit < 0) return vec3(0.0);              // never settled → void
    float bright = 1.0 - steps / 220.0;         // fast capture = bright
    return hsv2rgb(vec3(float(hit) / float(N), 0.85, 0.4 + 0.6 * bright));
}
```

Why each guard matters: the **softening** `+0.05` and the capture
test `r2 < 0.06` prevent the integration blow-up that would otherwise
force a tiny `dt`; the **drag** `v *= 0.995` bounds the loop so the
220-step budget always terminates. Animate `ATT[k]` from cursor /
audio / keyboard and the fractal boundaries writhe — that is the
piece. The *fine* filigree at boundaries wants 4–9 sub-pixel samples;
that supersampling is the only thing genuinely pushed offline. One
sample/pixel gives crisp basins with slightly aliased edges — fine at
60fps.

## Recipe 2 — Newton root-basin (single-pass)

The per-pixel analogue of 2swap's root fractals: iterate Newton's
method `z ← z − p(z)/p′(z)`; the basin is which root you converged
to. For `p(z) = z³ − 1` the three roots are the cube roots of unity.

```glsl
vec2 cmul(vec2 a, vec2 b){ return vec2(a.x*b.x-a.y*b.y, a.x*b.y+a.y*b.x); }
vec2 cdiv(vec2 a, vec2 b){ float d=dot(b,b); return vec2(a.x*b.x+a.y*b.y, a.y*b.x-a.x*b.y)/d; }

vec3 newtonBasin(vec2 z) {
    for (int i = 0; i < 48; i++) {                  // 48 is plenty at 60fps
        vec2 z2 = cmul(z,z), z3 = cmul(z2,z);
        z -= cdiv(z3 - vec2(1.0,0.0), 3.0*z2);      // z - p/p'
    }
    float ang = atan(z.y, z.x);                     // 3 basins at 0, 2π/3, 4π/3
    return hsv2rgb(vec3(ang/6.2832 + 0.5, 0.8, 1.0));
}
```

Shade brightness by iteration-to-converge for the classic Newton
filigree. swaptube's actual code (`polynomials/root_fractal.cu`) uses
Durand-Kerner over all 2ⁿ ±1-coefficient polynomials and *scatter-
accumulates* roots into a buffer — that needs `passes:`; the per-pixel
Newton map above is the honest single-pass version.

## Recipe 3 — Escape-time fractal, smooth coloring

swaptube's `mandelbrot.cu` is `zₙ₊₁ = zₙ² + c` — already a per-pixel
kernel, drops straight into a fragment shader. The one formula worth
copying verbatim is its **anti-banding smooth iteration count**:

```glsl
const int   MAX_ITER = 192;          // 32 if zooming fast
const float BAILOUT2 = 65536.0;      // bailout radius 256, squared — large on purpose

float n = 0.0, r2 = 0.0;
for (int i = 0; i < MAX_ITER; i++) {
    z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
    r2 = dot(z, z);
    if (r2 > BAILOUT2) break;
    n += 1.0;
}
// continuous escape — no integer banding (exponent = 2 → log(2)):
float nu = log(log(sqrt(r2)) / log(2.0)) / log(2.0);
n += 1.0 - nu;
```

The large bailout radius (256, not 2) is what makes `nu` accurate.
2swap maps `n` through a *sharpened 4-entry palette* with an animated
`phase_shift` so the bands flow — for V-Jaygent, map `n` through the
warm ramp instead and animate the phase from audio. Morph
Mandelbrot↔Julia by lerping whether the pixel coordinate seeds `c` or
`z` — a natural cursor binding.

## Recipe 4 — Lyapunov chaos map (the one that needs state)

2swap's *Double Pendulum* grid is the only technique here that is
genuinely stateful. Each pixel is a double pendulum (initial angles
from `x,y`); swaptube integrates it **and a twin perturbed by ~1e-3**
with RK4, and accumulates their phase-space separation across
*thousands of frames* — a running-mean Lyapunov estimate. Stable
regions stay dark, chaotic regions saturate.

Two ways to do this in V-Jaygent:

1. **Faithful → `passes:` ping-pong.** A float texture holds
   `(θ1,θ2,p1,p2)` for pendulum and twin plus the running `diff_sum`;
   the physics pass does N RK4 substeps, the color pass reads it. This
   is real persistent state — layer-only `u_history` won't do it (no
   persistent publish; see `reference_passes_vs_layers`).
2. **Single-pass cheap-out — fixed-horizon Lyapunov.** Drop the
   running mean. Inside the fragment loop, integrate *both* twins for
   a fixed ~120 steps and output `log(final_sep / initial_sep)`.
   120 RK4 steps × 4 evals ≈ 480 trig-heavy evals/pixel — borderline
   at 1080p, comfortable at 720p or on a downscaled buffer. This is
   the honest single-pass basin map.

Canonical Hamiltonian double pendulum (`m = l = 1`, `g = 9.8`):

```glsl
vec4 deriv(vec4 s) {                  // s = (θ1, θ2, p1, p2)
    float d = s.x - s.y, cd = cos(d), sd = sin(d);
    float k = 6.0 / (16.0 - 9.0*cd*cd);
    float dt1 = k*(2.0*s.z - 3.0*cd*s.w);
    float dt2 = k*(8.0*s.w - 3.0*cd*s.z);
    float eb  = dt1*dt2*sd;
    return vec4(dt1, dt2, -0.5*(3.0*9.8*sin(s.x)+eb), -0.5*(9.8*sin(s.y)-eb));
}
vec4 rk4(vec4 s, float dt){
    vec4 k1=deriv(s), k2=deriv(s+0.5*dt*k1), k3=deriv(s+0.5*dt*k2), k4=deriv(s+dt*k3);
    return s + (dt/6.0)*(k1 + 2.0*k2 + 2.0*k3 + k4);
}
```

swaptube uses `dt ≈ 0.0033` (slow-mo for video); for 60fps motion use
`dt ≈ 0.02–0.05` with 4–8 substeps per frame.

## Two formulas worth lifting verbatim

- **Smooth iteration count** (Recipe 3): `n += 1 − log(log√r² /
  log p)/log p`. Anti-banding for *any* escape-time fractal.
- **`sigmoid(sigmoid(x))` tone-map** with `sigmoid(x) = 3x² − 2x³` — a
  gentle double-S-curve swaptube applies to additive accumulation
  buffers (root fractal). Use it if a `passes:` recipe accumulates.

Neither is in `lib/` yet — the bar is three pieces (VISION.md
"Duplication beats coupling"). Revisit if a second escape-time piece
appears; for now they live here, copy-paste per piece.

## Color — work in OKLAB

swaptube colors consistently in **OKLAB**, not RGB — perceptually-even
lightness ramps, which is exactly the warm-luminance-contrast V-Jaygent
wants and the direction `lib/palette.glsl` already heads. Map *hue =
basin id* and *L = capture/escape speed*; keep the basin palette warm
(amber / ember / gold), the void near-black.

## Single-pass vs passes — summary

| Technique            | Single-pass? | Budget @60fps        | Needs `passes:`?            |
|----------------------|--------------|----------------------|-----------------------------|
| Gravity basin        | yes          | ~220 leapfrog steps  | no                          |
| Newton root-basin    | yes          | ~48 iters            | no                          |
| Escape-time fractal  | yes          | 32–192 iters         | no                          |
| Lyapunov chaos map   | yes (cheap-out) | ~120 RK4 steps   | only for the faithful running-mean |

## How to apply in V-Jaygent

- **The piece.** A gravity-basin field is the first piece — Recipe 1
  as the lead layer, attractor positions wired to `u_mouse` /
  `u_touches` / `u_audio_*`, capture-speed brightness pumped by beat
  energy. Per the multi-layer default, pair it with a warm substrate
  layer and a sub-beat shimmer layer.
- **The critic.** This is graded by the existing `taste.md`
  *Structure-honesty* lens: a piece claiming "basin of attraction"
  must *show* emergent boundary filigree, not a smooth gradient.
  `/vjay-iterate`'s critic reads this file when a piece declares a
  basin / chaos field (added to its reading order 2026-05-22).
- **Anti-pattern check.** A basin map from *fixed* initial conditions
  is identical every frame — a 2swap video, not a VJ piece. The
  governing parameters (attractor positions, coupling, zoom centre)
  must move with live input, or it fails interaction agency.

## References

- 2swap, *Gravity Basins* / *Double Pendulums are Chaoticn't* — see
  `brainstorming/inspirations/2swap-refs.md` for links + catalog.
- `swaptube` source: `mandelbrot.cu`, `pendulum_fractal.cu`,
  `PendulumHelpers.h`, `polynomials/root_fractal.cu` —
  <https://github.com/2swap/swaptube>
- Cousin note: `brainstorming/techniques/strange-attractors.md` —
  attractors plotted directly (de Jong, Clifford, Lorenz, Aizawa).
- Newton fractal math: standard — Newton's method in ℂ over `z³−1`.
