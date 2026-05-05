# Code organization — engine, lib, components, phrasebook

This doc covers how V-Jaygent's code is organized into tiers, with
the canonical contracts for each. It started as "Using lib/" — the
shared math library — and grew when the project added a layer
engine + offline audio analysis. The first half is still lib/; the
second half is the engine contract.

## The four tiers

V-Jaygent splits across four tiers. Each tier has its own coupling
policy — the rule for how strongly its files depend on each other,
and what changing one means for the others.

1. **Engine** (`studio/runtime.mjs`, `studio/server.mjs`, `bin/`).
   The instrument. Multi-pass pipeline, ping-pong framebuffers,
   `#include` preprocessor, audio/cursor plumbing, layer compositor,
   analysis-JSON loader. Couples on purpose: every piece shares it,
   every capability the engine grows leaves the next piece better
   off. Owned by the engine spec; pieces don't modify it.
2. **Library** (`lib/*.glsl`). Shared math kernels with one right
   answer per function. Couples on purpose — a change here ripples
   through every piece. Add modules slowly (see "When to ADD to
   lib/" below).
3. **Components** (`layers/<name>/`). NEW tier as of the 2026-05-05
   layer-engine spec. Reusable, stateful, blend-aware visual
   elements (`gravitational-field`, `ferrofluid`, `lightning`,
   `chromatic-refraction`). Each layer is a fragment shader +
   `meta.yaml` declaring its uniforms, blend mode, what it
   `publish`es, what it `consume`s. Couples loosely — pieces declare
   layer stacks; layers are designed to be reusable across pieces.
4. **Phrasebook** (`brainstorming/snippets/`). Palettes, tone
   curves, copy-pasted artistic phrases. *Never* `#include`'d —
   always copy-pasted so each piece can diverge. The anti-
   calcification rule (see VISION.md `## Tools`): if a tweaked
   palette feels general, open a *new* snippet, never mutate the
   canonical.

The rule that connects them: **infrastructure couples; taste
diverges.** Engine + lib + components are infrastructure. Phrasebook
is taste. A piece's `meta.yaml` reaches into the first three (it
declares its layer stack, its lib `#include`s); its `shader.frag`
copies from the fourth (palette-line, tone curve).

# Lib

`lib/*.glsl` holds GLSL modules that any piece can `#include` from.
These are mathematical primitives — one right answer per function —
so they live in one canonical place and every piece that reaches for
them stays in sync. This is the opposite policy from palettes (see
VISION.md's `## Tools`): artistic phrases duplicate per piece;
infrastructure couples on purpose.

## What's in it

| module            | core functions                                                   | reach for it when                              |
|-------------------|------------------------------------------------------------------|------------------------------------------------|
| `math.glsl`       | `PI`, `TAU`, `PHI`, `saturate`, `rot2d`, `cmul`, `cconj`         | any piece doing trig / complex / rotations     |
| `noise.glsl`      | `hash21`, `hash22`, `vnoise`, `fbm`, `fbmRot`                    | procedural textures, domain-warp, turbulence   |
| `tonemap.glsl`    | `reinhard`, `reinhardPartial(x, whitepoint)`, `aces`             | mapping HDR→display without clipping to primaries |
| `sdf.glsl`        | `sdCircle`, `sdBox`, `sdSegment`, `sdTriangle`, `opSmin`, `opOnion` | any SDF compositing                         |
| `diffusion.glsl`  | `laplacian(sampler, uv, texel, channel)`, `laplacian4`, `laplacian9` | reaction-diffusion, pressure solvers, heat, smoothing passes |
| `blend.glsl`      | `blend_normal`, `blend_add`, `blend_screen`, `blend_multiply`, `blend_max`, `blend_replace` | any layer in a multi-layer piece compositing onto `u_below` |

## How to use it

In `shader.frag` (or `sim.frag`), after the `#version` line:

```glsl
#version 300 es
precision highp float;

#include "noise.glsl"
#include "tonemap.glsl"

// ... rest of shader ...
```

The studio runtime resolves `#include` client-side — it fetches `/api/lib/<name>`
and inlines the body in place, with each file included at most once per
compile (guards prevent re-declaration). Nested includes are followed up to
depth 4. Lib files carry `#ifndef VJ_<NAME>_GLSL` header guards so
double-inclusion is safe.

The line number in a compile error comes from the concatenated output, so
large shaders that include multiple modules benefit from mentally adding up
module line counts. Not a big deal today; if it becomes one, the runtime can
rewrite errors with source-map-style tracking.

## When NOT to reach for lib/

- **Palettes.** `warmCycle`, `ember`, `iqCosine` belong in
  `brainstorming/snippets/` and are copy-pasted per piece. A piece's palette
  is an artistic commitment — it should be free to diverge.
- **Gamma + vignette.** Every piece tunes these. Canonicalizing them would
  freeze decisions a piece should own.
- **Tiny idioms.** `length(p)`, `atan(p.y, p.x)` — leave inline. If it's one
  line, duplicate it.

## When to ADD to lib/

A new `lib/` module earns its place when:
1. A concrete upcoming piece needs it (ferrofluid will need `lib/dipole.glsl`;
   lightning will need `lib/poisson.glsl`).
2. There's exactly one right implementation — no meaningful artistic tuning.
3. At least two pieces will benefit (or one piece benefits and one more is
   plausible within the next few planned pieces).

Don't pre-emptively extract things "because they might be shared." Let the
second piece that needs it do the extraction.

## Anti-calcification

`lib/` functions are namespaced by module (the file) and named conservatively.
Renames force piece updates and should be avoided; prefer adding a second
named variant (`fbm5` alongside `fbm`) over silently changing behaviour.

Every `lib/*.glsl` edit is a cross-piece change. Treat it like it.

# Components — the layer engine contract

Status: NEW as of 2026-05-05. The runtime extension is described
here as a contract; implementation lives in `studio/runtime.mjs` and
`studio/server.mjs`. When the contract and the code disagree, the
code is authoritative — but update this doc.

## Why a layer tier exists

Until 2026-05, V-Jaygent was monolithic: every piece a single
fragment shader. That made `strata` hand-author its layering inside
one file (5 fields at coprime rates, SDF masks, screen/max blend in
GLSL), and made every multi-element piece copy the layering math.
The layer engine moves that compositing to the runtime so layers
become reusable across pieces (a `chromatic-refraction` layer drops
into any piece) and can interact via `u_below` and shared-state
publishes (see `brainstorming/techniques/layered-composition.md`).

## A layer

A layer lives at `layers/<name>/` (or `pieces/<slug>/layers/<name>/`
for piece-local one-offs — piece-local resolves first). Two files:

```
layers/chromatic-refraction/
  shader.frag        # the fragment shader
  meta.yaml          # the layer's contract
```

The layer's `meta.yaml`:

```yaml
name: chromatic-refraction
identity: "refraction layer that distorts u_below per-channel"
default_blend: replace
uniforms:
  dispersion: { type: float, default: 0.4, min: 0.0, max: 1.0 }
  ior:        { type: float, default: 0.05 }
reads:
  - u_below                      # the composited buffer beneath
  # u_history is implicit on every layer; declare here only if used
publishes: []                    # no shared state
consumes: []                     # no shared-state inputs
```

A piece's `meta.yaml` references it:

```yaml
audio: song.mp3
audio_features: [beat, sections, stems.bass, stems.vocals, key]
layers:
  - layer: gravitational-field
    blend: normal
    uniforms: { strength: 0.6 }
    drivers: { strength: u_audio_bass_stem }
    publishes: { field: vec2 }
  - layer: ferrofluid
    blend: screen
    drivers: { viscosity: u_section_progress }
    consumes: { external_force: field }
  - layer: lightning
    blend: add
    drivers: { trigger: u_downbeat }
  - layer: chromatic-refraction
    blend: replace
    uniforms: { dispersion: 0.4 }
```

## Per-layer uniforms (engine-provided)

The engine sets these on every layer's program. The layer doesn't
have to declare them — they're injected by the runtime.

| Uniform                  | Type        | Meaning                                   |
|--------------------------|-------------|-------------------------------------------|
| `u_resolution`           | `vec2`      | output FBO resolution                     |
| `u_time`                 | `float`     | wall clock seconds (or audio time if `time_source: audio`) |
| `u_frame`                | `int`       | frame index since piece load              |
| `u_mouse`                | `vec2`      | cursor position in FBO pixels, `(0,0)` = idle |
| `u_below`                | `sampler2D` | composited result of all layers beneath; clear color when this is the bottom layer |
| `u_history`              | `sampler2D` | previous frame's final composited output; clear color on frame 0 |
| `u_audio_*` (existing)   | `float`     | `u_audio_level/bass/mid/high/kick/snare/cymbal/flash/playing/time` |
| `u_audio_*_stem`         | `float`     | per-stem RMS when stems are present in analysis JSON |
| `u_bpm`, `u_beat_*`, `u_bar_*`, `u_downbeat` | various | beat-grid, populated when analysis JSON is present |
| `u_section_*`, `u_song_progress`, `u_to_section_change` | various | section state, populated when analysis JSON is present |
| `u_key_tonic`, `u_key_mode` | `int`     | populated when analysis JSON is present  |

Plus any `consume`d shared-state buffer (declared by the layer's
`meta.yaml`'s `consumes:` block — bound to the named publish from an
earlier layer).

Plus any uniforms the layer declares in `uniforms:` (with the value
from the piece's `meta.yaml`, possibly re-bound to a driver).

## Render order per frame

1. Maintain an `accumulator` FBO (cleared at frame start) and a
   `history` FBO (last frame's final composite).
2. For each layer **bottom-to-top** in declaration order (declaration
   order = bottom first):
   - Resolve `consumes:` bindings — must reference a `publishes:`
     from a layer earlier in declaration order. Forward references
     are an engine error (the piece won't load).
   - Render the layer to a per-layer output FBO with `u_below` =
     current `accumulator` contents (everything beneath, already
     composited), `u_history` = `history` FBO.
   - If the layer declares `publishes:`, also write to the named
     shared-state target (separate FBO; whether persisted across
     frames is part of the publish declaration).
   - Blend the per-layer output into `accumulator` using the layer's
     `blend:` mode (`normal | add | screen | multiply | max |
     replace`; canonical math in `lib/blend.glsl`).
3. Copy `accumulator` to the screen and into `history` for next
   frame.

`u_below` is "everything beneath this layer, composited"; `u_history`
is "last frame's final image". The first layer in `meta.yaml.layers`
draws first (over a clean background, so `u_below` is the clear
color); the last layer draws last (sees everything else as
`u_below`).

## Drivers — binding uniforms to engine values

A piece's `meta.yaml` may include a `drivers:` map per layer. Drivers
re-bind a layer uniform to an engine value:

```yaml
- layer: ferrofluid
  drivers:
    viscosity: u_section_progress       # bind ferrofluid's `viscosity` uniform to u_section_progress
    perturb:   u_audio_drums_stem
```

Without a driver, the uniform takes the value declared in `uniforms:`
(static for the duration of the piece). With a driver, the engine
overwrites that value per frame from the named source.

A driver bound to a `flash`-shaped uniform (the engine maintains a
heuristic list of brightness/exposure/strobe targets, plus
layer-declared `flash: true` uniforms) is counted toward the
flash-budget warning (≤4 events per bar; see
`brainstorming/techniques/music-to-shader.md` §"Flash budget").

## Frame-0 / no-layers-beneath / idle behaviour

A layer must handle three degenerate cases gracefully — the smoke-
shader test mocks each:

- **Frame 0 (`u_history` is clear color).** A history-feedback layer
  must produce a sensible first frame. Recipe: `mix(initialPalette,
  feedbackResult, smoothstep(0.0, 1.0, float(u_frame) / 30.0))` so
  the feedback ramps in over 30 frames.
- **Bottom layer (`u_below` is clear color).** A `u_below`-reading
  layer (refraction, advection) must not produce garbage when
  there's nothing beneath. Recipe: detect with `dot(below, vec3(1.0))
  < 0.01` and fall back to ownColor only.
- **Idle (`u_audio_playing == 0`, `u_mouse == vec2(0)`).** Layers
  must have a synthetic-driver fallback so the piece self-plays.
  Convention: when an audio uniform is zero AND `u_audio_playing`
  is 0, use a sin/perlin substitute. See
  `brainstorming/techniques/music-to-shader.md` for the existing
  "mix in synthetic" pattern.

# The audio analysis JSON contract

Status: NEW as of 2026-05-05. Implementation lives in
`bin/analyze-audio.mjs` (when written) — this is the schema the
runtime expects when loading `pieces/<slug>/audio.analysis.json`.

## When the file is present

The runtime parses it on piece load and exposes the new song-level
uniforms (`u_bpm`, `u_beat_*`, `u_bar_*`, `u_downbeat`,
`u_section_*`, `u_song_progress`, `u_to_section_change`,
`u_audio_*_stem`, `u_key_*`). When absent, those uniforms are zero
and `u_audio_*_stem` falls back to broadcasting `u_audio_level`. The
existing FFT pipeline runs in both cases.

## Schema

```jsonc
{
  "version": 1,
  "duration_sec": 213.4,
  "bpm": 128.0,
  "beats": [0.469, 0.938, 1.406, /* ... */],
  "downbeats": [0.469, 2.344, 4.219, /* ... */],
  "sections": [
    {
      "start": 0.0,
      "end": 16.0,
      "label": "intro",            // intro|verse|chorus|breakdown|build|drop|outro|unknown
      "energy": 0.18                // 0..1, smoothed mean
    }
    // ...
  ],
  "energy_envelope": {
    "hz": 100,
    "values": [0.12, 0.13, /* ... */]   // length = duration_sec * hz
  },
  "stems": {
    "bass":   { "hz": 100, "rms": [/* ... */] },
    "drums":  { "hz": 100, "rms": [/* ... */] },
    "other":  { "hz": 100, "rms": [/* ... */] },
    "vocals": { "hz": 100, "rms": [/* ... */] }
    // any subset is allowed; missing stems → zero uniform
  },
  "key": {
    "tonic":      "A",          // letter name; runtime maps to 0..11
    "mode":       "minor",       // major|minor
    "confidence": 0.81
  }
}
```

## Hand-editability

Section auto-labels are noisy (~70% F-measure at 3s tolerance per
MIREX; see `brainstorming/techniques/music-composition.md`). The
JSON is hand-editable post-analysis: re-run with explicit `label`
overrides, or directly edit the file and the runtime reloads.
Pieces that depend on section labels should expect labels to be
imperfect and design transitions over 4-bar windows that absorb
boundary slop.

## Forward-compat

`version: 1` is the current schema; future additions (chord track,
beat confidence, per-stem onsets) bump the version. The runtime
treats unknown keys as ignorable; the analyzer emits stable keys
even when a feature is missing (empty arrays, zero confidence).

# When to ADD to components (`layers/`)

A new global layer earns its place when:

1. A concrete piece needs it AND a second piece could reuse it
   (the lib/ rule applied to layers).
2. The layer's identity fits in one sentence (anti-pattern in
   layered-composition.md: "if you can't name a layer in three
   words, it doesn't have a job").
3. The layer's couplings (what it reads from `u_below`, what it
   publishes, what it consumes) are stable across pieces — a
   layer whose contract changes per piece is piece-local, not
   global.

For one-offs, use `pieces/<slug>/layers/<name>/`. Resolution order
is piece-local first, then global — pieces can also override a
global layer locally without modifying the global file.

## See also

- `VISION.md` `## Tools` — the manifesto-form description of the
  engine/lib/phrasebook split. The fourth tier (components) was
  added in 2026-05; VISION.md will be updated to match.
- `brainstorming/techniques/layered-composition.md` — the aesthetic
  principles + 8 critic probes for multi-layer pieces.
- `brainstorming/techniques/music-composition.md` — the song-level
  rules for audio-analysis-aware pieces.
- `brainstorming/snippets/` — the phrasebook tier. Palettes live
  there.
- `layers/README.md` — the layer authoring contract (uniforms in,
  uniforms out, blend modes, error cases). Read this when writing
  a new layer.
- `README.md` — practical `passes:` schema and `#include` usage
  reference. The legacy multi-pass system (per-pass FBOs for
  simulation, e.g. `ferment`) coexists with the new layer engine;
  the two will likely converge in a later iteration.
- `pieces/ferment/sim.frag` — first multi-pass consumer; uses
  `diffusion.glsl` + `noise.glsl` together.
