# Fluid dynamics — fakes and real

Research note. Single-pass fragment shaders can't run a real Navier-Stokes
solver (no ping-pong framebuffers in the current runtime — see
`pieces/reaction-diffusion.md` and `pieces/future-multipass-deck.md`).
Everything here is about convincing fluid motion *without* state, with
the real thing as a distant target.

## Curl noise — the canonical fake

**Why:** Real fluids are divergence-free (matter doesn't appear or
disappear). Curl noise gives you a velocity field that is
analytically divergence-free — particles advected along it never
compress or expand, they circulate. The fluid-feeling mostly *is* that
property.

**Recipe (2D).** Let `φ(p, t)` be a scalar fbm. Its curl-derived velocity
is the 90° rotation of its gradient:

```glsl
float phi(vec2 p, float t) {
    return fbm(p + vec2(0.0, t * 0.1));
}

vec2 curlVel(vec2 p, float t) {
    const float e = 0.01;
    float dx = phi(p + vec2(e, 0.0), t) - phi(p - vec2(e, 0.0), t);
    float dy = phi(p + vec2(0.0, e), t) - phi(p - vec2(0.0, e), t);
    return vec2(-dy, dx) / (2.0 * e);
}
```

`v = (-∂φ/∂y, ∂φ/∂x)` is the 2D curl of a vector potential `(0, 0, φ)`.
Analytically divergence-free. The time-coordinate slides through the
noise so the field evolves smoothly.

For speed: analytic fbm derivatives beat finite differences by 2-4×.
Iñigo Quílez's "more noise" article derives them. For a first piece
finite-diff is fine; optimise if you hit the frame budget.

## Pathline / streakline rendering

**Why:** With no frame history we can't "accumulate" smoke. But we can
integrate the velocity field *backwards* from each pixel for K steps
and sample a density field at each location — effectively
reconstructing where this parcel came from. The rendered frame has
trails without actually storing them.

**Recipe.**

```glsl
vec3 col = vec3(0.0);
vec2  q  = p;
float fade = 1.0;
for (int i = 0; i < 8; i++) {
    q   -= curlVel(q, t) * stepSize;
    fade *= 0.78;                // exponential falloff
    col += sample(q, t - float(i) * stepSize) * fade;
}
```

4-8 steps is the sweet spot — more gets expensive and doesn't visibly
improve trails. The density `sample()` can be:

- Another `fbm` evaluated at `q` (smoke texture).
- A threshold on `fbm` (sparse puffs).
- A set of point sources (Gaussian glyphs).

## Domain warping as pseudo-advection

**Why:** Even cheaper than pathlines. Warp the sample coordinate through
the velocity field once or twice and call it advection.

```glsl
vec2 q = p + curlVel(p, t) * dt;           // one step
vec2 r = q + curlVel(q, t) * dt * 0.6;     // second step, damped
float d = fbm(r + something * t);
```

Looks flowing rather than trailing. Good for ambient fog / smoke
backgrounds where individual parcels don't need to be traced.

## Stam's Stable Fluids (what we can't do yet)

Jos Stam's 1999 SIGGRAPH paper + 2003 GDC note are the foundation of
real-time fluid in games. Pipeline:

1. **Add forces** to the velocity grid (user input, wind).
2. **Advect** velocity by itself (semi-Lagrangian — trace backward).
3. **Diffuse** velocity (viscosity).
4. **Project** — solve a Poisson equation for pressure, subtract
   `∇p` to enforce incompressibility.
5. **Advect density** by the final velocity.

Needs: a grid (framebuffer) holding velocity + density; multiple passes
per frame; a few Jacobi iterations for the pressure solve.

For us, step 4 is the one the curl-noise cheat skips. Without pressure
projection, real fluid is simply not real. Curl noise is the best
single-pass stand-in and holds up visually as long as the piece doesn't
demand *interaction* between the fluid and static obstacles.

Paper: <https://graphics.cs.cmu.edu/nsp/course/15-464/Fall09/papers/StamFluidforGames.pdf>
Reference C code: ~100 lines.

## Production shortcuts (less principled, often enough)

- **Marble texture:** `fbm(p + fbm(p + fbm(p)))` at increasing scales,
  thresholded. Not fluid but reads as liquid.
- **Caustics:** two sinusoidal distortions at slightly different
  phases and frequencies, multiplied; their interference is
  caustic-shaped. Iñigo Quílez has a well-known shader for this.
- **Viscous spread:** if you have ping-pong, a Gaussian blur on the
  advected density; without it, average multiple nearby samples.

## What I'd build first (current runtime constraints)

Curl-noise velocity field + pathline rendering + warm dark palette +
audio-driven density injection. `plume` is the first piece in this
family.

Upgrade path when multi-pass lands:

1. Ping-pong a density buffer, advect real density rather than
   reconstructing it via backward pathlines. Lets sources persist and
   really *trail*.
2. Add a pressure solve — even 5 Jacobi iters per frame is enough to
   dramatically improve realism around obstacles.
3. Track boundaries / obstacles (e.g. cursor as solid body). Curl
   noise can't do this; real fluid can.

## References

- Iñigo Quílez, *Domain warping* — <https://iquilezles.org/articles/warp/>
- Iñigo Quílez, *More noise* (analytic derivatives) —
  <https://iquilezles.org/articles/morenoise/>
- Jos Stam, *Real-Time Fluid Dynamics for Games* (2003 GDC) —
  <https://graphics.cs.cmu.edu/nsp/course/15-464/Fall09/papers/StamFluidforGames.pdf>
- David A Roberts, *Fluid sim in <1KB WebGL* — <https://davidar.io/post/card>
- Robert Hodgin, *Magnetosphere* / Flight404 —
  <https://roberthodgin.com/project/magnetosphere>
- Memo Akten, *MSAFluid* — <https://github.com/memoakten/ofxMSAFluid>
- BigWings (The Art of Code) Shadertoy — <https://www.shadertoy.com/user/BigWIngs>
- flockaroo Shadertoy — <https://www.shadertoy.com/user/flockaroo>
