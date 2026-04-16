# Reaction-diffusion piece

A Gray-Scott (or Fitzhugh-Nagumo) simulation running live in the studio.
Current blocker: the runtime is single-pass fragment-only. Reaction-diffusion
needs **ping-pong framebuffers** — the previous frame's state is the input
to the next frame's update step.

## What it buys

True emergent complexity. Turing patterns — spots, stripes, labyrinths,
self-replicating spots — arise from two coupled PDEs with almost no state.
Different parameter regimes give radically different visuals, and smooth
interpolation between parameters is mesmerising.

## Audio reactivity

- **Kicks inject activator** at the cursor (or at heptagonal sites for a
  7/4 track). Watch patterns ripple outward from the injection sites.
- **Mid-frequency amplitude** modulates the feed rate `F` — changes which
  pattern regime you're in. Can morph live from spots to stripes to chaos.
- **High-frequency amplitude** modulates the kill rate `k` — sharpens or
  softens the boundaries between domains.

## Plumbing needed

- Runtime gets two WebGL textures + a framebuffer; swap per frame.
- `meta.yaml` opts in via e.g. `passes: 2` or `pingpong: true`.
- First pass runs the RD update shader with the prior-state texture as
  input. Second pass displays (with colour mapping) the current state.
- Hot-reload still swaps the display shader; RD update stays for stability.

This is a runtime-level addition, not just a piece. It unlocks a whole
category of pieces that need persistent state (particle systems,
flow-map advection, historical-trace pieces).
