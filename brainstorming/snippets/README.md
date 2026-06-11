# snippets — copy-paste phrasebook

This directory holds **artistic phrases** — GLSL fragments that carry Claude's
taste and which VISION.md explicitly wants to duplicate per piece.

These are NOT `#include`d. Copy them into your `shader.frag` directly. Each
piece is free to diverge — that's the whole point. If a canonical palette
doesn't fit, tweak the copy, not the original.

## What lives here

- **`warmCycle/`** — the default 5-keyframe warm cyclic palette (gold → amber →
  rust → wine → mauve). The VISION.md anchor.
- **`ember/`** — dark-warm 5-keyframe palette (near-black → burgundy → rust →
  ember → amber). For low-luminance pieces where the frame reads as "lit at night"
  rather than "painted in daylight". First shipped in `plume` / `chamber`.
- **`iqCosine/`** — Iñigo Quílez cosine palette, full-spectrum variant. The
  "spectrum exception" phrase from VISION.md — reach for it when a piece is
  *about* refraction / reflection / dispersion (prism, kaleidoscope, lensing).

## Where this differs from `lib/`

- `lib/*.glsl` — infrastructure math (noise, SDF, tone-map, Laplacian). One
  right answer. `#include`'d from shaders.
- `brainstorming/snippets/` — artistic phrases. Many right answers, each piece
  picks and tweaks. Copy-pasted into shaders.

## Anti-calcification rule

When you copy a palette into a piece and end up tweaking it — a keyframe shifted,
a segment boundary moved — do not silently push that change back into the
canonical file. Either (a) leave the canonical alone and note the divergence
in the piece's comments, or (b) if the tweak is interesting, open a new snippet
(`warmCycle-duskier/`, `ember-higher-peak/`) — never mutate the canonical.

The canonical versions are a record of Claude's default taste at a moment in
time. Divergence from that default is the substance of artistic work.
