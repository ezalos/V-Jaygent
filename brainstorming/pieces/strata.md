# Strata — proof-of-concept for layered composition

The first piece that puts the VJ thesis into practice. Not a monolithic field;
a stack of independent layers with different rates, masks, blend modes, and
audio bindings.

## Layers

**L0 · Ground.** A warm fbm nebula drifting at rate `0.5`. Fills the whole
frame at low luminance. This is the stable substrate — the "background" VJs
always run behind everything.

**L1 · Rings.** Concentric radial gratings with a tiny pitch mismatch producing
a moving moiré band. SDF-masked to a rotating rounded rectangle that travels
on a Lissajous path at rate `3`. Blend: `screen`.

**L2 · Tile.** Truchet tiles (quarter-arcs), angular mask shaped like an
equilateral triangle pointing up, slowly rotating at rate `5` while also
translating on a slower Lissajous. Blend: `max`.

**L3 · Attractor.** A de Jong iterate — each pixel runs a 40-step recurrence
from a seeded position; the magnitude of the resulting point becomes a
luminance field. Masked to a circle on its own Lissajous at rate `7`.
Parameters `a, b, c, d` drift slowly. Blend: `screen`.

**L4 · Sparks.** Sparse bright points at hash-driven angular positions,
activated by the high band. Rate `11` (time-bucketed stutter). No mask —
the sparsity IS the mask. Blend: `add-saturated`.

## Time rates

`3, 5, 7, 11` — coprime, realign period ≈ 1155. None will ever visibly
synchronise during a listening session.

## Audio bindings

- Bass → L0 brightness + L1 frequency (moiré pitches on kick)
- Mid → L2 rotation-rate multiplier + L3 attractor parameter modulation
- High → L4 spark density
- Level → global exposure

## Mouse

Drag the cursor: translate the centres of L1, L2, L3 each by `mouse * unique_weight`
so moving the mouse drags the layers apart. Dense, not-fully-coupled response —
you feel like you're pulling layers around.

## Palette

L0 warm mid-luminance. L1 amber. L2 ember-orange. L3 deep wine. L4 bright
warm cream. All within the `warmCycle` family — contrast by luminance, not
hue. No cold colours.

## Mathematical content per layer

| Layer | Math                             | Library          |
|-------|----------------------------------|------------------|
| L0    | FBM noise + domain warp          | `fbm`, `vnoise`  |
| L1    | Two gratings, beat pattern       | see `moire.md`   |
| L2    | Truchet arcs in unit cells       | hash-seeded      |
| L3    | de Jong iteration per pixel      | see `strange-attractors.md` |
| L4    | Angular slot hash × threshold    | hash × step      |

## Scope for this piece

- **Single-pass** — no runtime changes. Four layers computed per fragment.
- **No audio file required** — piece works standalone. When an audio file is
  declared in meta, bindings activate.
- **Audio file optional** — might pair with one of Louis's tracks later.

## Why this piece matters

It's the test: can V-Jaygent do layered composition with the current runtime?
If the answer is yes, the monolithic era ends here and the rest of the
studio follows this shape. If the answer is "partially, but blending looks
muddy / overwhelms", we learn what the runtime needs next.

See [future-multipass-deck.md](./future-multipass-deck.md) for the bigger
architectural bet this opens the door to.
