# ink-bloom — watercolour bleed you can stir

## One-line concept

A living ink-in-water bleed — iterated UV displacement fed back through
`u_history` — with the watercolour cues (edge-darkening, granulation,
subtractive glaze) bolted on so it reads as **paint on paper**, not dye
in a tank. The cursor drops pigment; the beat stirs the flow.

## Why this piece

Seeded by Lieberman's "ink watercolor simulation"
(`inspirations/x-finds-2026-06-10.md`). His own recipe is *"displacement
after displacement in shader code"* — which is a perfect fit for our
existing curl-noise + feedback stack, and it sidesteps the
`feedback_scatter_requires_passes` trap (this is a gather/field piece,
not a particle piece). Technique detail in `techniques/watercolor-ink.md`.

## Architecture — layer stack (`u_history` for the bleed)

1. **Bleed (ping-pong / `u_history`).** Each frame, displace the previous
   frame's UVs by a curl-noise flow field (`fluid-dynamics.md`), resample,
   decay slightly. Cursor / beat injects pigment density. Float buffer —
   8-bit banding (`feedback_history_decay_amplifies_noise_artifacts`).
2. **Granulation (static multiply).** Paper-tooth fbm, `density = 1 -
   smoothstep(...)`, multiplied over the bleed. A fresh sample each frame,
   *never* baked into the decaying buffer (else the grain aliases).
3. **Edge-darkening (post).** `pow(color, 1 + max3(color - blur(color))·k)`
   — the one move that flips dye → watercolour. Clamp `k`.
4. **Subtractive composite.** Multiply-blend between pigment families,
   not `mix`/`add`.

## Watch-outs

- The dark-rim edge-darkening needs a blur → a 2nd buffer or reuse
  `u_history`'s read.
- `feedback_history_decay_amplifies_noise_artifacts`: decay ≥ 0.90 reads
  as static multi-frame — keep the displacement field *moving* and prefer
  **fbmRot** for the potential so grid patches don't show through.
- Diagonal-flow shimmer (anemone): per-axis time multipliers on the warp.

## The liveness problem (be honest up front)

A bleed that only diffuses outward will settle and go static — exactly
the `feedback_animate_the_landscape` failure for field pieces. The fix is
baked into the inputs: continuous cursor/beat pigment injection + a slow
drift of the curl field's frequency across sections + sub-beat jitter on
the injection point. Without an always-on driver this plateaus into a
calm wash — decide the driver at the brief stage, not at iteration 4
(`feedback_force_iterate_plateau`).

## Palette

Two or three pigment families that go *subtractively darker* where they
overlap (the whole point). Cream paper ground, not near-black here — this
is the one piece where a light ground is correct, because edge-darkening
needs a light field to darken against.
