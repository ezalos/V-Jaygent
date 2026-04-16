# DVD logo bounce

A small rectangle travels in a straight line; when it hits a screen edge, it
reflects; on every reflection the logo changes colour. The trajectory is
completely deterministic — no randomness — but the "will it hit the corner?"
question has become folklore for generations because the answer is actually
mathematically interesting.

## Why it matters for V-Jaygent

It's the perfect recipe for **multiple small things moving around a
background** — the VJ layering thesis applied to element motion, not just
content. Unlike a Lissajous (which always passes through the same spatial
points every period), DVD-bounce gives ergodic-feeling coverage: any point
in the box gets visited eventually, and the motion is locally linear but
globally unpredictable. The eye reads it as "alive" without any randomness.

## The motion

Given a point `p` with velocity `v` confined to a box, the bouncing position
is a 2D triangle wave:

```glsl
float tri(float t) { return abs(fract(t * 0.5) * 2.0 - 1.0) * 2.0 - 1.0; }
// tri oscillates in [-1, 1] with period 2; continuous; C⁰ at the corners.

vec2 dvdPos(float t, vec2 vel, vec2 phase) {
    return vec2(tri(t * vel.x + phase.x),
                tri(t * vel.y + phase.y));
}
```

To place a logo of half-size `r` in a box `[-1, 1]²` so it never clips the
walls, use `dvdPos(...) * (1.0 - r)`.

## The corner question

Will the logo hit a corner exactly? Equivalent: are there `t*` such that
`tri(t*·vx + px) = ±1` AND `tri(t*·vy + py) = ±1` simultaneously? Each
one-axis wall-hit happens when `t·v + p` is an integer (for `tri` with the
given period). Corner hits require **both** `t·vx + px ∈ ℤ` and `t·vy + py ∈
ℤ` at the same `t`.

If `vx / vy` is rational (say `a/b` in lowest terms), corner hits are
guaranteed — they happen every `b / vx` time units in time. If `vx / vy` is
irrational, corner hits **never happen**; the logo gets arbitrarily close but
only in the limit.

Numerical floats are always rational, so on a computer corner-hit is
eventually guaranteed; the transcendent case requires irrational-valued
analysis. The classic viral videos do hit.

## Colour change on reflection

Detect wall-hit via the derivative of the triangle wave: the velocity sign
flips when `fract((t·v + p) * 0.5) · 2 - 1` crosses ±1. Cheap detection:

```glsl
float wallEnergy(float t, float v, float phase) {
    // Peaks near wall hits (|tri| ≈ 1). Smooth bump.
    float x = tri(t * v + phase);
    return smoothstep(0.92, 1.00, abs(x));
}
```

The colour index can be driven by **integer count of wall hits so far**,
which is `floor((t·v + p + 1) * 0.5) + floor((t·v + p - 1) * 0.5)` or
similar — the cleanest approach is just:

```glsl
float hitCount(float t, float v, float phase) {
    return floor((t * v + phase) * 0.5);  // increments on each bounce
}
int colourIdx = int(mod(hitCount(t, vx, px) + hitCount(t, vy, py), N));
```

## Variations that keep the spirit

**Multiple bouncing objects with coprime velocities.** N rectangles (or
kaleidoscope disks) with velocities `(a_i, b_i)` where `gcd` is 1 across all
pairs. They never all line up simultaneously; pairwise alignments are rare
enough to feel noteworthy when they happen.

**Corner-flash.** Detect when any single object is within ε of a corner
(`|x| > 1-ε AND |y| > 1-ε`); flash the whole screen. Gives the "holy shit
it's about to" tension.

**Ghost trails.** Subtract the previous few positions' shapes, additively
blend. Cheap way to imply motion without multi-pass trails.

**Kaleidoscope bounce.** Each bouncing "logo" is itself a kaleidoscope disk
showing its own little dihedral fold of the source. Big kaleido in the
background, small kaleidos bouncing on top. Fractal-of-symmetries.

**Speed proportional to audio.** Tie each object's `v` magnitude to an audio
band; kicks visibly accelerate the logo's progress.

## Cultural weight

The DVD screensaver (1999 onward) taught two generations of people to watch
a deterministic trajectory as if it were a random event. That's a rare
cultural object: mathematically trivial, experientially hypnotic. Worth
reaching for deliberately.

## Evolution: billiard balls (added while building prism v5)

Triangle-wave bouncing is **time-reversal-symmetric** — a replayed-backward
video looks the same as the forward one. For N independent objects this is
fine. But the moment you want them to **interact** (hit each other), the
fragment shader can't maintain state, so the objects' trajectories have to
be simulated on the CPU and the positions passed up as uniforms.

Prism v5 does exactly this: 4 elastic disks in a box, O(n²) pairwise
collision check each frame, equal-mass normal-component velocity swap on
contact. A per-ball `lastHit` timestamp produces an exponentially-decaying
`hitPulse` uniform that the shader uses to briefly tint and flash the
relevant disk on collision. The difference from pure DVD bounce is
obvious: after a collision, trajectories visibly diverge in a way that's
time-asymmetric. You can tell which direction time is flowing.

Runtime code lives in `studio/runtime.mjs` under the `stepBalls()` function
— simple enough to be a reference for any future "I need stateful moving
objects in a fragment shader" piece. Cost: negligible (4 balls, 16 pair
checks per frame).

The triangle-wave technique in the section above is still the right tool
when objects move independently. Go to billiards when they need to
interact.

## References

- Wikipedia, "DVD Video" screensaver: the visual itself came from DVD
  players' idle animation; Philips / Sonic Solutions patented a variant.
- The viral "will the DVD logo hit the corner" Office episode (Season 8,
  "PDA", 2012) is probably the cultural anchor for most people under 40.
- Triangle-wave math: any signals textbook; the key identity is
  `tri(t) = (2/π) · arcsin(sin(πt))` if you want a smoother C¹ version.
