# layers/ — authoring a V-Jaygent layer

A **layer** is one fragment shader + one `meta.yaml`, rendered to its
own framebuffer, composited with neighbour layers via the engine.
Layers are the fourth tier of V-Jaygent's codebase (see
`brainstorming/techniques/using-lib.md` for the full architecture).
They differ from monolithic shaders in three ways:

1. They can sample **`u_below`** — the composited result of all
   layers beneath — and write back distorted/refracted/displaced
   pixels.
2. They can sample **`u_history`** — last frame's final composite —
   for trails and feedback.
3. They can **`publish`** named shared-state textures (vec2 force
   fields, SDFs, density buffers) that downstream layers
   **`consume`**.

Aesthetic principles for choosing what to put in a layer live in
`brainstorming/techniques/layered-composition.md`. This doc is the
authoring contract: how to write one.

## Where layers live

- **Global:** `layers/<name>/` — reusable across pieces.
- **Piece-local:** `pieces/<slug>/layers/<name>/` — one-off, not
  promoted yet. Resolution order is piece-local first, then global,
  so pieces can override a global layer locally.

A layer is a directory with at minimum:

```
layers/chromatic-refraction/
  shader.frag      # the fragment shader
  meta.yaml        # the layer's contract
```

## Anatomy

### `meta.yaml`

```yaml
name: chromatic-refraction
identity: "refraction layer that distorts u_below per-channel"
default_blend: replace            # normal | add | screen | multiply | max | replace

uniforms:
  dispersion: { type: float, default: 0.4, min: 0.0, max: 1.0 }
  ior:        { type: float, default: 0.05 }

reads:
  - u_below                       # declare reads explicitly so the engine warns on dead samples
  # u_history is implicit — declare here only if used

publishes: []                     # nothing shared with downstream layers

consumes: []                      # no shared-state inputs
```

`identity` should be one sentence — three words at minimum, the
shorter the better. If you can't name a layer in three words, it
doesn't have a job (per `layered-composition.md` §"Universal
Everything"). Drop it; merge into another layer.

### `shader.frag`

```glsl
#version 300 es
// ABOUTME: Chromatic refraction layer — per-channel offset of u_below
// ABOUTME: along the gradient of an internal height field.
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "blend.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform sampler2D u_below;
uniform sampler2D u_history;
uniform float u_audio_bass;        // engine-provided audio uniform
uniform float dispersion;          // declared in meta.yaml
uniform float ior;

out vec4 fragColor;

void main() {
    // The engine vertex shader doesn't export a varying — compute uv from
    // gl_FragCoord. (Earlier README drafts showed `in vec2 vUv;` but no
    // shipped layer uses it; the engine vertex shader is bare gl_Position.)
    vec2 uv = gl_FragCoord.xy / u_resolution;

    // height field used for refraction direction
    float h = fbm(uv * 6.0 + u_time * 0.1);
    vec2 grad = vec2(dFdx(h), dFdy(h));

    // per-channel offset
    float k = ior * (1.0 + 0.4 * u_audio_bass);
    float r = texture(u_below, uv - grad * (k + dispersion * 0.6)).r;
    float g = texture(u_below, uv - grad * (k + dispersion * 0.0)).g;
    float b = texture(u_below, uv - grad * (k - dispersion * 0.4)).b;

    fragColor = vec4(r, g, b, 1.0);
}
```

## Engine-provided uniforms

The runtime injects these on every layer's shader. You don't declare
them in `meta.yaml`, but you should `uniform` them in the shader if
you read them.

| Uniform                  | Type        | Notes                                                     |
|--------------------------|-------------|-----------------------------------------------------------|
| `u_resolution`           | `vec2`      | output FBO size in pixels                                 |
| `u_time`                 | `float`     | wall clock; tracks audio time when `time_source: audio`   |
| `u_frame`                | `int`       | frame index since piece load; 0 on first frame            |
| `u_mouse`                | `vec2`      | cursor in FBO pixels; `(0,0)` means idle                  |
| `u_below`                | `sampler2D` | composited buffer of layers beneath; clear color at bottom layer |
| `u_history`              | `sampler2D` | last frame's final composite; clear color on frame 0      |
| `u_audio_*`              | `float`     | existing FFT/onset uniforms (`level/bass/mid/high/kick/snare/cymbal/flash/playing/time`) |
| `u_audio_*_stem`         | `float`     | per-stem RMS, populated when analysis JSON has stems     |
| `u_bpm`, `u_beat_phase`, `u_bar_phase`, `u_beat_index`, `u_bar_index`, `u_downbeat` | various | beat-grid, populated when analysis JSON is present  |
| `u_section_id`, `u_section_label`, `u_section_progress`, `u_to_section_change`, `u_song_progress`, `u_energy_smooth` | various | sections, populated when analysis JSON is present  |
| `u_key_tonic`, `u_key_mode` | `int`     | populated when analysis JSON is present                  |

When analysis JSON is absent, the song-level uniforms are zero.
Write defensively: a layer that depends on `u_section_progress`
should still produce a sane output when it's zero.

## Blend modes

The layer's `default_blend` declares how its output composites onto
the accumulator (everything beneath, already composited). The piece
can override with `blend:` in its `meta.yaml`. Canonical math in
`lib/blend.glsl`. Pick by intent:

| Mode       | Use when                                            | Anti-pattern                              |
|------------|-----------------------------------------------------|-------------------------------------------|
| `normal`   | layer has a real alpha mask; partial coverage       | full-frame layers blend into mush         |
| `add`      | one bright lead layer; capped alpha; ≤1.4 sum       | three warm `add` layers → cream soup     |
| `screen`   | "lights" / glow; brightens without overshoot        | heavy texture × heavy texture → washout  |
| `multiply` | top-tint layer; texture × tint                      | texture × texture → mud                  |
| `max`      | sharp-edge winners (sparks, lightning, rings)        | nothing wrong; default for hard accents  |
| `replace`  | top layer must occlude (`u_below`-distorting layer) | use when alpha is always 1               |

See `brainstorming/techniques/layered-composition.md` §"Blend modes
for layered warm palettes" for warm-on-warm-specific behaviour.

## Required behaviours (the smoke test mocks each)

The engine smoke test (`bin/smoke-shaders.mjs`) renders each layer
in isolation with mocked `u_below` / `u_history` / audio. A layer
must handle three degenerate cases without garbage output:

1. **Frame 0 — `u_history` is the clear color.** Don't trust last
   frame's image; ramp it in. Pattern:
   `mix(initialColor, feedbackColor, smoothstep(0, 1, float(u_frame) / 30.0))`.
2. **Bottom layer — `u_below` is the clear color.** A `u_below`-
   reading layer (refraction, advection) must detect emptiness and
   fall back to its own colour. Pattern:
   `if (dot(below, vec3(1.0)) < 0.01) below = ownColor;`.
3. **Idle — `u_audio_playing == 0` AND `u_mouse == vec2(0)`.** The
   layer must self-play. Pattern: when audio uniforms are zero AND
   `u_audio_playing` is 0, mix in a synthetic driver
   (`mix(0.3 + 0.2*sin(u_time*0.7), u_audio_bass, u_audio_playing)`).

## Publish / consume — shared state

A layer can declare `publishes:` to write a named texture that
downstream layers (later in the piece's declaration order) can
`consumes:`.

```yaml
# in layers/gravitational-field/meta.yaml
publishes:
  field: { type: vec2, persistent: false }
```

```yaml
# in layers/ferrofluid/meta.yaml
consumes:
  external_force: { type: vec2 }   # bound by the piece's meta.yaml to a publish
```

```yaml
# in pieces/<slug>/meta.yaml
layers:
  - layer: gravitational-field
    publishes: { field: vec2 }
  - layer: ferrofluid
    consumes: { external_force: field }   # forwards-reference: must come AFTER
```

Engine rules:

- A `consume` MUST reference a `publish` from a layer earlier in
  declaration order. Forward references are a piece load error.
- `persistent: true` means the published texture survives across
  frames (ping-pong target). `false` means it's recomputed every
  frame.
- A published texture is its own FBO; rendering to it doesn't go
  through the layer compositor. The layer renders its main output
  AND any publishes in the same draw call (multiple draw buffers).

## Drivers — binding uniforms to engine values

A layer's `uniforms:` are static defaults. A piece can re-bind any of
them to an engine value via `drivers:`:

```yaml
- layer: ferrofluid
  uniforms: { viscosity: 0.5 }              # default if no driver
  drivers:  { viscosity: u_section_progress }   # but actually drive from this
```

A driver overwrites the uniform every frame from the named source.
This is the primary way pieces customize layers without forking
them.

If you're authoring a layer that has a uniform expected to be
flash-shaped (brightness/exposure/strobe), declare it explicitly:

```yaml
uniforms:
  flash:    { type: float, default: 0.0, flash: true }
```

The engine adds `flash: true` uniforms to its flash-budget counter
(soft warning if a piece exceeds 4 flash events per bar — see
`brainstorming/techniques/music-to-shader.md` §"Flash budget").

## Examples to read first

The README's earlier draft promised `chromatic-refraction`,
`gravitational-field`, and `ferrofluid` as canonical examples. Real
shipped layers cover the same patterns; read these instead:

- `layers/wave-distort/` — read-only `u_below` distort, no shared
  state. Single-job layer, no audio binding, smallest possible
  example. (Stand-in for the planned `chromatic-refraction`.)
- `layers/lodestone-pull/` — publishes a `vec2 force` field from
  three orbiting masses (1/r² gravitational falloff). Note the
  `alpha: 0` requirement on the piece-side declaration to keep the
  rg-encoded data from leaking visually. (Stand-in for the planned
  `gravitational-field`.)
- `layers/force-source/` — minimal force-publisher; cleaner pattern
  if you want to *just* see the publish/consume contract without
  the lodestone visuals.
- `layers/flow-particles/` — consumes `u_force`, advects sparse
  particles via `u_history` feedback (4-step semi-Lagrangian).
  Demonstrates the consume + persistent-feedback pattern. (Stand-in
  for the planned `ferrofluid`.)
- `layers/flow-warm/` and `layers/follow-force/` — alternative
  consumers of the same `force` publish; useful for seeing how one
  publisher feeds multiple downstream consumers in different
  visual roles.
- `pieces/layer-engine-test/` and `pieces/layer-publish-test/` —
  integration tests with trivial layers; smoke-test targets.

The canonical full-stack reference for a 7-layer publish/consume +
multi-input piece is `pieces/stronger/` (uses `solid-warm`,
`lodestone-pull`, `flow-particles`, `mirror-bloom`, `black-holes`,
`glitch-rgb`, `key-rays` — see its `meta.yaml` for the full DAG).

(These don't exist yet at the time of writing — they ship with the
layer engine in Phase 2 of the spec at
`/home/ezalos/.claude/plans/i-want-to-work-precious-volcano.md`.
Update this README's "Examples" section once they land.)

## When to extract a layer to global

Same rule as `lib/`: don't pre-extract. A layer earns global
status when:

1. A second piece could use it without per-piece tuning (the
   layer's contract is stable).
2. The identity is one sentence in three words.
3. The couplings (reads / publishes / consumes) don't change
   between pieces.

Until then, write it at `pieces/<slug>/layers/<name>/`. Promote
when the second piece arrives.

## See also

- `brainstorming/techniques/using-lib.md` — the full architectural
  contract (4 tiers, render order, audio analysis JSON schema).
- `brainstorming/techniques/layered-composition.md` — the aesthetic
  principles (coupling not stacking, strata of grain, polyrhythmic
  clocks) and the 8 critic probes.
- `lib/blend.glsl` — canonical blend-mode math.
- `bin/smoke-shaders.mjs` — the smoke test that exercises every
  layer's three required behaviours.
