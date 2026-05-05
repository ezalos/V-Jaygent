# Ocean — design spec

ABOUTME: Visual piece for John Butler's "Ocean" (2012 studio, 12:04, BPM 99.4, E major, 8 sections).
ABOUTME: A four-layer dive: abyss volume + chladni caustics + cursor-stirred surface + godrays.

## Premise

Looking down through water from above. The viewer is suspended over an
oceanic volume that breathes with the music. The cursor stirs the
surface. The keyboard drops stones. Section transitions move the
viewer up and down through the water column. The percussive climax
(section 6, ~9:01–10:47) is when the wave breaks.

The track is named "Ocean" and Butler explicitly cites surfing — the
piece honours that without becoming a literal seascape.

## Audio analysis

```
duration:  724.6 s   (12:04)
bpm:       99.4
key:       E major   (confidence 0.93)
sections:  8         (boundaries below)
stems:     none      (solo guitar — no vocal/drum lanes worth splitting)

  i  start    end      dur     role (interpreted)
  0  0:00     2:18     138s    delicate fingerpicking, harmonics
  1  2:18     6:07     228s    long meditative arpeggio middle (longest)
  2  6:07     6:56      49s    transition / first push
  3  6:56     7:52      56s    sustained intensity
  4  7:52     9:01      69s    climb
  5  9:01    10:47     107s    THE CLIMAX — percussive thrash
  6 10:47    11:43      56s    release / cooldown
  7 11:43    12:04      21s    coda
```

The grid is reliable — 99.4 BPM with 1155 detected beats and 289
downbeats over 12 minutes is high confidence. So beat-level
phase-lock is on the table for fine-grained geometric pulse, while
section-level structure carries the macro arc.

## Layer stack (back → front, 4 layers)

```
┌─ godrays         ─ vertical light cones from above; refracted by
│                    surface ripples; count + brightness ← u_audio_high
├─ surface-ripples ─ 2D height field; cursor + keys + downbeat sources;
│                    visible wavefronts; screen-blend over caustics
├─ caustics        ─ chladni summed-sin filaments; brightness ← u_audio_mid;
│                    axis snap on u_bar_phase; screen-blend over abyss
└─ abyss           ─ deep volumetric blue→black; vertical depth fills the
                     frame as dive_depth rises; swell ← u_audio_low
```

All four layers are piece-local at first
(`pieces/<slug>/layers/<name>/`). None promote to global until a
second piece needs them.

### `abyss`
- **identity:** "depth gradient that swells deeper as sections progress"
- **blend:** `normal` (it's the base)
- **inputs:** `u_audio_low`, `u_section_id`, `u_section_progress`, `u_time`
- **publishes/consumes:** none
- **palette:** `#04122a` (deep) → `#0a3a5c` (mid) → `#1a6a8a` (near surface)
- **dive_depth curve over sections:** `[0.1, 0.3, 0.5, 0.6, 0.7, 1.0, 0.4, 0.0]`
- **section transition:** smooth `mix(curve[id], curve[id+1], u_section_progress)`
- **wave-break:** when `u_section_id == 5 && u_section_progress < 0.05`,
  emit a single shockwave ring expanding from screen centre that
  warps the gradient as it passes (one-shot per piece).

### `caustics`
- **identity:** "chladni filaments tinted turquoise, axis-snapped per bar"
- **blend:** `screen`
- **inputs:** `u_audio_mid`, `u_bar_phase`, `u_bar_index`, `u_time`
- **palette:** `#7be7d3` body → `#cef9eb` highlights
- **pattern:** sum of three rotated sin-wave grids; principal axis
  rotates by 90° at each new bar (snap on integer
  `u_bar_index`, smoothed last 10% of bar via `u_bar_phase`).
- **brightness:** `0.3 + 0.9 * u_audio_mid`. The long fingerpicked
  middle section (1) is where caustics carry the visual weight.

### `surface-ripples`
- **identity:** "cursor-stirred + key-driven 2D ripple field with visible wavefronts"
- **blend:** `screen`
- **inputs:** `u_mouse`, `u_keys[15]`, `u_key_event[15]`, `u_bar_phase`,
  `u_downbeat`, `u_audio_high`, `u_time`
- **publishes/consumes:** none — the ripple math is duplicated
  inside `godrays` to keep both shaders self-contained (`#include`
  is flaky in 3+ layer stacks per the ember-spark comment).
- **sources** — height field is sum-of-sources:
  - **cursor (continuous):** decaying gaussian × sinusoid centred
    at the mouse, `u_time`-driven phase. Stirring effect.
  - **15 keys (event):** each key has a fixed spawn point along the
    bottom 25% of the screen. Keypress envelope `u_keys[i]` runs 1→0
    on release; ripple radius = `(1 - u_keys[i]) * MAX_R`, amplitude
    = `u_keys[i]^2`. White keys: soft cyan ripple. Black keys: harder,
    sends a deep shockwave bias into the abyss layer's tint.
  - **downbeat (every 4 beats):** centre ripple keyed by
    `u_bar_phase` — radius = `u_bar_phase * MAX_R`, amplitude =
    `exp(-u_bar_phase * 3.0)`. Music's pulse always visible.
- **rendering:** thin bright wavefronts where `|height|` crosses a
  threshold band — visible "rings on water". Foam tint at the wave-break.

### `godrays`
- **identity:** "vertical light cones from above, refracted by surface ripples"
- **blend:** `add` (capped — soft saturate at 1.4)
- **inputs:** `u_audio_high`, `u_mouse`, `u_keys[15]`, `u_bar_phase`,
  `u_downbeat`, `u_section_id`, `u_section_progress`, `u_time`,
  `u_below`
- **publishes/consumes:** none
- **palette:** warm `#fff1c2` → `#ffe06b` at peaks; section 6 doubles
  rays and adds stutter.
- **rays:** 7 vertical bands at fixed x positions, slight x-wobble
  driven by the locally-recomputed ripple field height-gradient.
  Brightness = `0.4 + 0.8 * u_audio_high`, base attenuation by
  `1 - dive_depth` (rays dim as we sink).

## Section grammar (how the music composes the visuals)

- **Sections drive `dive_depth`** via the curve above. `dive_depth`
  is recomputed in each layer that needs it from `u_section_id` +
  `u_section_progress`.
- **`u_to_section_change`** drives a horizon-line glow that
  intensifies as a section ends — pre-tension visualization, the
  Caterina Barbieri "withholding" move.
- **Section 5 (the climax) gets a once-only wave-break event**: a
  shockwave ring emitted at section start, expanding from the screen
  centre, distorting all four layers as it passes. This is the
  single structural visual event that pays off the audio peak. After
  it passes, `dive_depth` collapses to 0 across sections 6→7 — a
  surfacing breach.

## Beat phase-lock (per memory: visible on screen)

| Cadence       | Geometric consequence                      |
|---------------|--------------------------------------------|
| Every beat    | (none — too dense for this piece)          |
| Every bar     | Caustics axis snaps 90°                    |
| Every downbeat (4 beats) | Centre ripple emitted on surface |
| Section start | Horizon glow swells / `dive_depth` curve   |
| Section 5 only | Wave-break shockwave (once per piece)     |

## Inputs (multi-input default)

- **Cursor:** stirs the surface around the mouse (gaussian × sin).
- **Keyboard:** 15-key piano-on-QWERTY (`a..l` whites + `w/e/t/y/u/o`
  blacks per project convention). White = soft splash; black = hard
  splash with abyss tint kick. `z`/`x` octave shift scales ripple
  size by ±25% per shift. `[` / `]` looper supported. `Shift+H`
  controls panel.
- **Audio:** three FFT bands map cleanly to the three audio-driven
  layers (low → abyss, mid → caustics, high → godrays). Song-level
  uniforms drive depth + transitions.

## Palette

| Role          | Hex (linear-ish)            |
|---------------|-----------------------------|
| Abyss deep    | `#04122a`                   |
| Abyss mid     | `#0a3a5c`                   |
| Abyss surface | `#1a6a8a`                   |
| Caustics body | `#7be7d3`                   |
| Caustics hi   | `#cef9eb`                   |
| Godray base   | `#fff1c2`                   |
| Godray peak   | `#ffe06b`                   |
| Foam (climax) | `#ffffff` (with cyan tinge) |

E-major key confidence biases the godrays toward warmer.

## What's rejected (transparency)

- **Pure abstract chladni / interference patterns** — would fit any
  track; ignores that this one is named *Ocean* and is about a body
  of water Butler surfs.
- **Literal seascape (waves, beach, sun)** — too cinematic, too
  referential, wrong scale. Visual would compete with the music
  rather than carry it.
- **Single-shader monolith** — this is a layered emotional arc with
  three audio bands all wanting their own visual lane; layer stack
  is the right tool.
- **Per-stem stems (Demucs)** — solo guitar has no useful
  separation. Confirmed by the `vjay-from-url` flow defaulting off.
- **Phase-lock on every beat** — at 99 BPM, every-beat geometric
  events would feel hectic on what's mostly a meditative piece.
  Bar/downbeat cadence is the right grain.

## Verification (per V-Jaygent runtime caveats memory)

- TDZ check on top-level await: layers are sandboxed, this is a piece
  authoring task — not at risk.
- `time_source: audio` (default) — `u_time` will track audio time so
  the visuals lock to the music.
- `u_mouse == (0,0)` idle: each layer must self-play. Cursor-driven
  ripples must produce something visible when no cursor is present
  — handled by the downbeat ripple + cursor's gaussian collapsing
  to a faint baseline.
- `u_history` clear-color on frame 0: surface-ripples doesn't read
  history; godrays doesn't either (we recompute the field). No
  initial-frame contamination.
- Time-series probe: capture frames at `t = [10s, 60s, 138s, 280s,
  400s, 540s, 600s, 700s]` (one per section + intra-section sample),
  measure pixel delta to confirm the geometry actually moves with
  sections.

## Implementation order

1. `pieces/ocean-john-butler-2012-studio-version/meta.yaml` — replace
   placeholder layer stack with the 4-layer one.
2. `layers/abyss/` — base gradient with section-driven depth curve.
   First-frame validation: bottom layer self-plays without audio.
3. `layers/caustics/` — chladni summed-sin with bar-phase axis snap.
4. `layers/surface-ripples/` — sum-of-sources height field with
   visible wavefronts.
5. `layers/godrays/` — vertical cones with locally-recomputed
   ripple-field refraction.
6. Probe with `bin/render-frames.mjs` (or equivalent) at the 8
   timestamps above.
7. Run `/vjay-iterate` for critic-loop refinement against the 6
   song-level + 4 per-frame probes (4/6 + 3/4 to claim "composes
   with the music").
