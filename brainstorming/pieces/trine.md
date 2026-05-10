# trine

## Canonical reference (Wikipedia: Three-body problem)

The classical three-body problem: take three point masses with given
initial positions and velocities, evolve under Newton's law of
gravitation `F = G m_i m_j (r_j - r_i) / |r_j - r_i|³`. Poincaré
showed there's no closed-form solution for generic configurations —
the dynamics are chaotic. Numerical integration is mandatory; the
standard symplectic choice for long-running simulations is **leapfrog
(kick-drift-kick)**: half-step velocity update from current force,
full-step position update, half-step velocity update from new force.
Conserves energy on average over long times; forward Euler diverges.

Singularities at close approach (r → 0) blow up the force. Standard
fix: **Plummer softening** — replace `1/r²` with `1/(r² + ε²)`
along with `1/(r² + ε²)^(3/2)` for the magnitude, so close passes
stay finite. ε ≈ a few percent of the typical orbital radius.

That's the whole physics. It's two short formulae. Don't reinterpret.

## Thesis

Three point masses tugging at each other in a softened Newton field,
painting persistent trails on a near-black canvas. The cursor — when
present — adds a fourth pull-source that perturbs the dance without
joining it. The piece is mesmerising because the 3-body problem is
chaotic: every initial condition explodes into a pattern you cannot
predict, and the trails record the history. Touching the canvas
nudges the system into a new attractor basin and the trails
re-pattern.

## Decision

**`passes:` pipeline, three passes** — bodies sim, trail accumulator,
display. State-bearing physics (positions across frames, persistent
trail buffer) rules out `layers:`. Closed brief — named algorithm
(Newton 3-body) + interaction model (cursor) + aesthetic word
(mesmerising). Per the new counter-rule in `vjay-new-piece` step 4,
flip the multi-layer default. No audio, no keyboard, no multi-finger,
no glitch overlay — just three bodies and what they paint.

## Form

1. **`bodies` pass** — rgba16f ping-pong, 4×1 texels (3 used, one
   spare). Each used texel holds `(pos.x, pos.y, vel.x, vel.y)`.
   Equal mass, G ≈ 0.0008, softening ε ≈ 0.04, leapfrog integration.
   Cursor (`u_mouse` via `vjMouseWorldOrZero`) acts as a fourth
   pull-source with a heavier-than-body mass so user input is felt.
   Toroidal wrap on position so bodies escaping one edge re-enter.
2. **`trail` pass** — rgba16f ping-pong, full canvas at scale 0.55.
   Each frame: `trail *= DECAY` (≈0.985), then add a Gaussian splat
   per body in its own channel (`r` for body 0, `g` for body 1, `b`
   for body 2; `a` accumulates the brightest channel for glow).
   Toroidal aware so a trail crossing the seam draws on both sides.
3. **`display` pass** — reads the trail buffer, tints each channel:
   body 0 = warm gold (`vec3(1.0, 0.78, 0.40)`), body 1 = ember
   (`vec3(1.0, 0.50, 0.18)`), body 2 = mauve-rose
   (`vec3(0.85, 0.45, 0.55)`). Composites on near-black ground.
   Adds bright pinpoint at each body's CURRENT position so the live
   bodies are legible against the rich trail history.

## What I don't want

- **Audio reactivity.** Brief doesn't ask for it. Adding it would
  pad a closed brief.
- **Keyboard synth.** Same.
- **Multi-finger.** Brief says "interactive" not "multi-finger".
  Single cursor is enough; adding 8-touch handling is over-eng.
- **Palette wedges / 8-colour spectrum.** Brief doesn't ask. Three
  warm tints (one per body) is the whole palette.
- **Glitch / strobe / section state machine.** No music to lock to.
- **Forward Euler integration.** Will drift to infinity inside a
  minute. Leapfrog or no piece.
- **Hard wall boundary.** Toroidal wrap; bodies cross the seam,
  trails draw on both sides for free.

## Open questions (will answer after first inspect)

- Does the chaos read as "alive" or as "boring slow drift"? Need
  initial conditions + G that produce visible orbital motion within
  the first few seconds. Calibrate by inspecting frames at t=0.5,
  2, 5s.
- Is the cursor pull strong enough to re-pattern the trails, or
  does it feel like a weak nudge? Tune cursor mass relative to
  body mass.
- Trail decay 0.985 = half-life ~46 frames (~0.8s). Might be too
  short for "long exposure" feel. If trails fade before they
  draw a recognisable curve, lower to 0.992 (half-life ~2s).

## Performance budget

- bodies pass: 4 fragments × 4 force evaluations × tiny work.
  Negligible.
- trail pass: full canvas at 0.55 scale = ~570k pixels × ~10 ops
  per pixel + 3 splat checks. Modest. Should run at 60fps easily.
- display pass: same canvas × even less work. Trivial.

Per-the-skill FPS sanity check: read inspect overlay; must be
≥30 in headless to claim shippable.
