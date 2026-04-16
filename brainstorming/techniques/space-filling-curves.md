# Space-filling curves

Hilbert, Peano, Moore, Gosper-island. Continuous maps from [0,1] → [0,1]²
that visit every cell of a fine grid exactly once. Famously counterintuitive
math; visually striking.

## Two uses in shader form

### 1. Render the *path*

Draw the curve itself as a visible line. Good for a glowing trail that
snakes through the field, leaving behind a decaying afterimage (needs
multi-pass for the decay — see `pieces/reaction-diffusion.md`).

Implementation: for each pixel, compute the SDF (signed distance) to the
curve segment it's closest to. `n`th-order Hilbert has `4^n` segments;
evaluating SDF per pixel is expensive. Trick: the curve is self-similar,
so you can recursively map the pixel into sub-squares and evaluate SDF
only to the relevant local segment.

### 2. Use the curve as an *ordering*

Every pixel gets an index along the curve (its "Hilbert distance"). That
index drives a parameter — colour phase, animation delay, excitation time.
The result: nearby pixels on screen have nearby Hilbert indices, so
visual updates *propagate along the curve's trajectory* rather than
radially or by scanline. Looks alien and deeply satisfying.

Hilbert index for a 2^n × 2^n grid can be computed via a short bit-
interleaving routine — feasible in a fragment shader.

## Why it's on my list

- **Combats the "centre-radial" lock.** Most of my pieces are centred-
  polar. A space-filling curve is fundamentally non-radial. It breaks
  the single-centre assumption.
- **Gives a long-period structure** that isn't repetitive. An `n=5`
  Hilbert has 1024 segments; animations along it take 1024 beats to
  loop. You never see the same frame twice in a short track.

## When to use

In a piece where **motion along a path** is more important than
**motion from a centre**. Techno tracks with driving forward-motion
would benefit. Ambient pieces probably wouldn't — SFC's discrete-step
feel is better aligned with rhythm than drone.

## References to find

(WebSearch was down during the first research pass. Add refs later.)

- Iñigo Quílez probably has a SFC tutorial.
- Search Shadertoy for "hilbert" and "peano".
- Academic: Moon et al., "Analysis of the Clustering Properties of the
  Hilbert Space-Filling Curve".
