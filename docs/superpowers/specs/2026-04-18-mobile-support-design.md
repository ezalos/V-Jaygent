# Mobile support for the V-Jaygent studio

**Status:** design approved, ready for implementation plan
**Date:** 2026-04-18
**Scope:** `studio/` (browser runtime + HTML/CSS). No shader / piece changes required; existing pieces continue to work unchanged.

## Thesis

The studio is keyboard-and-mouse-first. On a phone today, the hint text
advertises keys that don't exist, the audio scrub bar doesn't respond to
touch, the cursor-as-instrument contract evaporates (touch events never
update `u_mouse`), and there is no way to open the catalog, cycle pieces,
or toggle HUD without a physical keyboard.

This spec delivers two layers:

1. **Floor** — the site stops being broken on mobile: touch events drive
   everything a mouse drives, a small always-on touch bar exposes
   navigation, the scrub bar is finger-sized, layout survives narrow
   viewports and Safari's disappearing URL bar.
2. **Ceiling** — the phone becomes a real instrument: single-finger drag
   stirs (via `u_mouse`), pinch zooms, two-finger drag pans, and a tap
   pokes the piece. New `u_zoom` / `u_pan` / `u_tap_pulse` standard
   uniforms are additive — pieces opt in by declaring them, untouched
   pieces keep working.

Desktop gets the new uniforms too, via scroll wheel (zoom), shift+drag
(pan), and non-drag click (pulse), so pieces that adopt them behave the
same across inputs.

## Non-goals

- **Per-piece performance tuning.** Existing `render_scale` in `meta.yaml`
  remains the knob. Auto-degrade on low FPS is tempting but destructive to
  sim state (reallocates ping-pong FBOs); deferred. If a piece feels
  heavy on mid-range phones after this lands, either lower its
  `render_scale` or address separately.
- **Native-app-style swipe physics / momentum.** Swipe-to-cycle is a
  threshold detector (fast horizontal gesture > 80px) — no inertial
  scrolling, no page-dragging.
- **Reworking pieces to use the new uniforms.** `u_zoom` / `u_pan` /
  `u_tap_pulse` are available to any shader that declares them; adopting
  them in existing pieces (e.g. making `chamber` zoomable) is future
  work, one PR per piece.
- **Orientation lock / fullscreen API.** Browser-level fullscreen stays
  the user's choice. Canvas already fills the viewport.
- **Haptic feedback on taps.** Vibration API is inconsistently supported
  and intrusive; skip it.

## Architecture

The changes fan across four concerns: input plumbing, new uniforms, UI
chrome, and viewport hygiene. Each is localised:

| concern            | files                           | surface                         |
|--------------------|---------------------------------|---------------------------------|
| input plumbing     | `studio/runtime.mjs`            | touch/pointer listeners, gestures |
| new uniforms       | `studio/runtime.mjs`            | `setStandardUniforms` additions  |
| UI chrome          | `studio/index.html`, `styles.css`, `runtime.mjs` | touch bar, adaptive hint, responsive CSS |
| viewport hygiene   | `studio/index.html`, `styles.css`, `runtime.mjs` | dvh, touch-action, visualViewport |

### 1. Input plumbing — Pointer Events as the trunk

Replace the `mousemove` / `mousedown` / `mousemove` / `mouseup` listeners
with **Pointer Events** (`pointerdown` / `pointermove` / `pointerup` /
`pointercancel`). Pointer Events unify mouse, touch, and pen, fire
identical sequences for each, and report `pointerType` so we can tell
them apart when needed. No more dual code paths.

Canvas gesture handler (new, inside `runtime.mjs`):

```
pointers: Map<pointerId, { x, y, startX, startY, startT, type }>

on pointerdown:
  captured pointer → add to map
  if map.size === 1:
    seed u_mouse with this pointer
  if map.size === 2:
    record initial pinch distance and centroid

on pointermove:
  update map entry
  if map.size === 1:
    u_mouse ← pointer position
  if map.size === 2:
    zoom ← zoomAtStart * (currentDistance / startDistance), clamped 0.25..4.0
    pan  ← panAtStart + (currentCentroid - startCentroid) / min(canvas.w, canvas.h)

on pointerup / pointercancel:
  if gesture was single-tap (dt < 200ms AND travel < 10px):
    fire u_tap_pulse = 1.0 (decays per-frame like audio onsets)
  if gesture was horizontal swipe (dt < 400ms, dx > 80px, |dx| > 3|dy|):
    cycle(+1) if dx < 0, cycle(-1) if dx > 0
  remove from map
  if map.size === 0: commit pan (sticky), reset pinch baseline
```

Key details:

- `setPointerCapture(e.pointerId)` on pointerdown so drags that leave the
  canvas still receive events.
- `pan` accumulates across gestures (sticky) — each new two-finger drag
  adds to the current pan offset, doesn't reset to zero.
- `zoom` also accumulates: `zoom *= distanceRatio`, with clamping applied
  each frame so repeated pinches compound.
- A single-tap pulse race: if the pointer begins a swipe, it must NOT
  also fire a tap. Swipe detection wins because it requires `dx > 80px`
  which is ≫ the tap threshold.
- `touch-action: none` on the canvas element tells the browser not to
  preempt gestures for scroll/zoom — required for pointer events to be
  usable on touch.

### 2. New standard uniforms

Added to the `setStandardUniforms(vw, vh, now)` call in `runtime.mjs`
(alongside the existing `u_resolution` / `u_time` / `u_mouse` / `u_frame`
/ `u_audio_*` / `u_ball_*` family):

| name           | type    | range         | meaning                                |
|----------------|---------|---------------|----------------------------------------|
| `u_zoom`       | float   | 0.25 – 4.0    | multiplicative; 1.0 = neutral           |
| `u_pan`        | vec2    | unbounded     | normalised offset; `uv + u_pan` shifts the frame by a shader-space unit per viewport-min-side |
| `u_tap_pulse`  | float   | 0 – 1         | decays ~0.85/frame after a tap/click   |

Conventions:

- All three default to their neutral values when no input has occurred,
  so pieces that declare them but receive no gesture still look right.
- `u_pan` is expressed in the same normalised space as `u_mouse` /
  `u_resolution`-relative UVs — pieces can apply it as
  `uv -= u_pan` without aspect-ratio bookkeeping.
- `u_tap_pulse` uses the same decay model as `audioOnsets.bass.pulse`
  (one-pole, `pulse *= 0.85` per frame after set to 1.0). Shared with
  `u_audio_flash`-style visual strobes.
- Setters use the existing `setUniform*` cache. Uniform locations are
  looked up lazily and cached per-program, so the added cost per frame
  is three hash lookups + three GL calls on pieces that use them, zero
  GL calls on pieces that don't (location is `null`, skipped).

### 3. Desktop parity bindings

So a piece that uses `u_zoom` / `u_pan` / `u_tap_pulse` behaves the same
on laptop and phone:

| gesture                | desktop                                    | mobile                |
|------------------------|--------------------------------------------|-----------------------|
| stir (`u_mouse`)       | mouse move                                  | 1-finger drag          |
| zoom (`u_zoom`)        | scroll wheel (deltaY → zoom, preventDefault when zoom uniform is present) | 2-finger pinch         |
| pan (`u_pan`)          | shift+drag                                  | 2-finger drag          |
| pulse (`u_tap_pulse`)  | click with no drag                          | tap (<200ms, <10px)    |
| cycle pieces           | ← →                                         | horizontal swipe OR touch-bar prev/next |

One detail: scroll-wheel-as-zoom should only consume the event when the
current shader actually references `u_zoom`. Otherwise page scrolling
(e.g. in the catalog overlay) breaks. Gate on
`gl.getUniformLocation(program, 'u_zoom') !== null` — evaluated per
program in `swapProgram` / `swapPipeline` (for pipelines, `true` if
any pass's program references it), cached as a module-level boolean.
Also skip the `preventDefault` when the catalog is open, since scroll
there is legitimate page-level behaviour.

### 4. UI chrome — touch bar and adaptive hint

Detect coarse pointer via
`window.matchMedia('(pointer: coarse)').matches`. Re-evaluate on resize
(some laptops swap between touch and trackpad).

**Touch bar** — a new `<nav id="touch-bar">` in `index.html`, visible only
when `body.coarse-pointer` is set:

```
[ ‹ ]   [ catalog ]   [ ▶/⏸ ]   [ › ]
```

- Four buttons, evenly spaced, bottom of viewport, safe-area padded.
- Play/pause hidden when there's no audio attached (mirror existing
  `audio-ui` show/hide logic).
- Auto-hides like other overlays: opacity 0 when `!body.active`, 1 when
  active. Same 2.5s idle timer.
- Height ≈ 56px including safe-area-inset-bottom. Each button ≥44×44 px
  hit zone (Apple HIG / Material baseline).
- Click handlers just forward to existing `cycle(±1)`, `toggleCatalog()`,
  `toggleAudio()`.

**Adaptive hint overlay** — the existing `#hint` element's content is set
at runtime based on pointer modality:

- coarse: `swipe ← → cycle · tap catalog button · pinch zoom · two-finger pan`
- fine:   (existing text unchanged)

Also: auto-hide after ~6 seconds on coarse devices and don't show again
(localStorage flag `vjay_hint_dismissed`). Desktop behaviour unchanged.

**Catalog responsive breakpoint** — media query
`@media (max-width: 480px)` collapses grid to 1 col, bumps card padding
to ≥16px. Existing `grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))`
already behaves acceptably down to ~240px, but explicit rules let us
tune spacing.

**Scrub bar** — lift the hit zone from 36→44px, track from 2→3px default
(4px on hover/drag stays). Use pointer events so touch drag works. The
tooltip is hidden on coarse pointers (fingers obscure it anyway).

**Device picker** — hide `#audio-input` on coarse-pointer unless the
user has explicitly switched devices before. Rationale: phones basically
never expose multiple audio inputs and the picker clutters the bottom
of the viewport.

### 5. Viewport hygiene

In `styles.css`:

```css
html, body {
  height: 100dvh;              /* was 100% */
  overscroll-behavior: none;   /* kill pull-to-refresh */
}
#stage { touch-action: none; } /* don't preempt gestures */
body {
  padding-bottom: env(safe-area-inset-bottom);
}
```

In `runtime.mjs`, add a `visualViewport.resize` listener calling the
existing `resize()` function. This covers Safari's URL bar show/hide,
iOS keyboard appearance, and foldable-device fold events. Debounce via
`requestAnimationFrame` to avoid storming reallocs during live gesture
resizes.

Remove/update the existing `meta name="viewport"` tag if needed — the
current `width=device-width,initial-scale=1` is fine; add
`viewport-fit=cover` so safe-area insets are reported.

## Data flow

```
pointer event ─┐
scroll event ──┼→ gesture state (pointers map, zoom, pan, tap flag)
keyboard ──────┘
                         │
                         ▼
                  render() frame loop
                         │
                         ├→ u_mouse  (existing)
                         ├→ u_zoom   (new)
                         ├→ u_pan    (new)
                         ├→ u_tap_pulse (new, decays in render())
                         └→ ... (u_time, u_audio_*, etc.)
```

State lives at module scope in `runtime.mjs`, alongside the existing
`mouse` and `audioBands` vars:

```
let pointers = new Map();
let zoom = 1.0;
let pan = [0, 0];
let tapPulse = 0.0;
let pinchBaseline = null;  // { distance, centroid, zoomAtStart, panAtStart }
```

## Boundaries and units of work

The design decomposes into five mostly-independent units:

1. **Pointer input module** — inside `runtime.mjs`, but a self-contained
   block: state + listeners + gesture classifier. Consumes DOM events,
   produces `mouse` / `zoom` / `pan` / `tapPulse` module-level vars.
   Testable by firing synthetic pointer events and asserting state.

2. **Standard uniform extensions** — one-liner additions in
   `setStandardUniforms`. No logic, just binding.

3. **Desktop parity bindings** — a second listener block (wheel +
   shift+drag + click) that writes to the same state vars as (1). Share
   the classifier.

4. **Touch bar UI** — pure DOM + CSS, wired to existing `cycle` /
   `toggleCatalog` / `toggleAudio`. Zero shader coupling.

5. **Viewport hygiene** — CSS-only + one listener. Independent of
   everything else.

Recommended implementation order: 5 → 4 → 1 → 2 → 3. Viewport and touch
bar are the floor (unblock mobile visitors immediately); uniforms and
gesture classifier are the ceiling.

## Testing

Node `node:test` (already the repo's test framework):

- **Gesture classifier unit tests** — extract the classifier (the pure
  function that consumes a pointer-event sequence and decides "tap",
  "swipe", "pan", "pinch") into a module, test it in isolation.
  Scenarios: single tap, tap + small jitter (still tap), slow drag (not
  swipe), fast horizontal swipe, pinch-in, pinch-out, two-finger drag
  without pinch, finger + mouse simultaneously.

- **Uniform wiring** — the existing shader smoke test
  (`bin/smoke-shaders.mjs`) already compiles every piece; add a
  regression check that a shader declaring `u_zoom` / `u_pan` /
  `u_tap_pulse` links and runs.

Playwright manual check (one-off, not CI'd):

- Load `?piece=chamber` on the studio, open Chrome DevTools device
  emulation → iPhone 14, verify:
  1. Canvas covers viewport (no black bars)
  2. Touch bar visible at bottom with safe-area inset
  3. Hint shows gesture legend, auto-dismisses
  4. Swipe left cycles to next piece
  5. Pinch zoom: no page zoom, no visible response (chamber doesn't
     declare `u_zoom` — correct; test with a new debug shader that does)
  6. Scrub bar on an audio piece drags with touch
  7. Pull-down at top does not refresh the page
  8. Safari URL bar show/hide: canvas re-sizes cleanly

## Migration & compatibility

- **Existing pieces**: unchanged. `u_mouse` still receives pointer
  position. New uniforms have safe defaults and are only bound if the
  shader declares them.
- **Existing keybindings**: unchanged. Arrow keys, `c`, `r`, `h`,
  `Escape`, space all still work. Pointer Events replace the `mouse*`
  listeners but desktop mouse fires pointer events identically.
- **Record mode** (`?record=1` for `bin/publish.mjs`): unaffected — no
  pointer interaction during recording. Touch bar hides under
  `body.hud-off` which publish already sets.
- **Stats**: no new events; existing page-view counter still fires on
  `/` and `/<slug>`.

## Out-of-scope follow-ups (captured for later)

- Quality toggle in the UI (low/medium/high render_scale override) —
  easy to add after this lands; wait to see if actually needed.
- Auto-degrade based on observed FPS — requires sim-state-preserving
  resize; non-trivial.
- Adopt `u_zoom` / `u_pan` in existing pieces (`chamber`, `breath`,
  etc.) — one PR per piece, aesthetic choice not infrastructure.
- Two-finger rotation gesture (`u_rotate` uniform) — deferred until a
  piece actually wants it.
