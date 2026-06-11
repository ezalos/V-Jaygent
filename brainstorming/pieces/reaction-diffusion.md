# Reaction-diffusion piece

> **Shipped twice.** The blocker fell when `passes:` landed; `ferment`
> (2026-04-16) proved the canonical kernel, and `danzas-percs` (2026-06-11)
> implemented this file's audio-reactivity section almost verbatim: kicks
> inject activator as travelling annulus fronts, the melodic stem wobbles F,
> live highs wobble k, and sections jump the (F,k) regime table —
> solitons / spots / worms / mitosis / coral, hand-tailored to the track's
> 8 analysed sections. Two lessons: (1) regime cross-fades and boundary
> sweeps need a SECONDS clock, not a section-fraction clock — techno
> sections run 9-160s (recover elapsed = progress·to_change/(1-progress));
> (2) "show the reaction" needs a fast-minus-slow EMA band-pass of u·v² —
> steady-state Gray-Scott metabolises on every living rim, so a plain EMA
> paints the whole pattern hot instead of just the igniting fronts.

A Gray-Scott (or Fitzhugh-Nagumo) simulation running live in the studio.
Current blocker (RESOLVED, see above): the runtime is single-pass fragment-only. Reaction-diffusion
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
