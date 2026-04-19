# Mobile support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the V-Jaygent studio usable and expressive on mobile — touch drives every mouse interaction, a small touch bar exposes navigation, and three new standard uniforms (`u_zoom`, `u_pan`, `u_tap_pulse`) let shaders treat the phone as an instrument.

**Architecture:** Swap `mousemove` / `mousedown` listeners for Pointer Events + a pure gesture classifier module. Add responsive CSS and a coarse-pointer touch bar. Extend `setStandardUniforms` with three additive uniforms that default to neutral — existing pieces are unaffected. Desktop gets parity via wheel / shift-drag / click.

**Tech Stack:** Vanilla ESM, WebGL2, `node:test`, Pointer Events, CSS dvh + safe-area insets, `window.visualViewport`.

**Spec:** `docs/superpowers/specs/2026-04-18-mobile-support-design.md`

---

## File Structure

**Create:**
- `studio/gestures.mjs` — pure gesture tracker module. Maintains a pointer map, classifies `tap` / `swipe` on release, accumulates `zoom` / `pan` during pinch. No DOM access; caller feeds it `{id, x, y, t}` events. Testable in isolation.
- `tests/gestures.test.mjs` — `node:test` unit tests for the classifier.
- `pieces/touch-probe/` — debug piece that renders `u_zoom` / `u_pan` / `u_tap_pulse` visibly so smoke tests and manual QA have something to verify against. Small, temporary-feeling, but fine to keep.

**Modify:**
- `studio/index.html` — viewport-fit=cover, touch-bar markup, hint text stays but becomes runtime-adaptive.
- `studio/styles.css` — `100dvh`, `overscroll-behavior`, `touch-action: none`, touch-bar styling, coarse-pointer media queries, responsive catalog, bigger scrub bar.
- `studio/runtime.mjs` — visualViewport listener, coarse-pointer detection, replace `mouse*` handlers with Pointer Events wired through `gestures.mjs`, wheel/shift-drag desktop parity, three new uniform setters in `setStandardUniforms`, tap-pulse decay in `render()`, wire touch-bar buttons, adaptive hint text.

**Not modified:**
- Existing piece shaders (`pieces/*/shader.frag`) — backward-compatible.
- `studio/server.mjs`, `studio/stats.mjs`, `studio/billiards.mjs` — no server-side or sim-side changes needed.

Implementation order follows the spec: viewport → UI chrome → input plumbing → uniforms → desktop parity. Floor ships first so mobile visitors stop landing on a broken page before the ceiling lands.

---

## Task 1: Viewport hygiene

**Files:**
- Modify: `studio/index.html:7`
- Modify: `studio/styles.css:13-24, 26-33`
- Modify: `studio/runtime.mjs` (add listener near existing `window.addEventListener('resize', resize)` at line 122)

- [ ] **Step 1: Add `viewport-fit=cover` to the meta viewport tag**

`studio/index.html` line 7 — replace:

```html
<meta name="viewport" content="width=device-width,initial-scale=1">
```

with:

```html
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
```

- [ ] **Step 2: Switch body/html to `100dvh` and kill overscroll**

`studio/styles.css` — replace the `html, body` block (lines ~13-24) with:

```css
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100dvh;
  background: var(--bg);
  color: var(--ink);
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 13px;
  letter-spacing: 0.02em;
  overflow: hidden;
  overscroll-behavior: none;
}
```

Note: `100dvh` is the dynamic viewport height — it shrinks/grows as mobile browser chrome appears/disappears. Fixes the Safari URL-bar-eats-bottom-of-canvas bug.

- [ ] **Step 3: Add `touch-action: none` to the canvas**

`studio/styles.css` — the `#stage` block becomes:

```css
#stage {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  background: var(--bg);
  touch-action: none;
}
```

This stops the browser from claiming touch gestures for scroll / pinch-zoom on the canvas.

- [ ] **Step 4: Add `visualViewport.resize` listener in runtime**

`studio/runtime.mjs` — right after the existing `window.addEventListener('resize', resize);` (around line 122), insert:

```js
// Mobile browsers resize the visual viewport independently of window when
// URL bar hides/shows or the soft keyboard appears. Listen to both.
if (window.visualViewport) {
  let rafId = 0;
  window.visualViewport.addEventListener('resize', () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => { rafId = 0; resize(); });
  });
}
```

The `requestAnimationFrame` debounce coalesces the burst of resize events Safari fires during URL-bar animation into one `resize()` call per frame — without it, a multi-pass sim piece would reallocate its FBOs ~10 times in 200ms.

- [ ] **Step 5: Verify existing tests still pass**

```bash
npm test
```

Expected: all existing tests pass. No new behaviour to test yet — this task is CSS + a listener. Manual check in Step 6 is the real verification.

- [ ] **Step 6: Manual mobile smoke check**

```bash
npm run studio
```

In Chrome DevTools → device emulation → iPhone 14, load `http://127.0.0.1:7777/chamber`. Confirm:
- Canvas fills viewport top to bottom.
- Dragging the page down at the top does NOT trigger pull-to-refresh.
- Toggling the emulated URL bar (rotate device / refresh) does not leave a persistent gap at the bottom.

- [ ] **Step 7: Commit**

```bash
git add studio/index.html studio/styles.css studio/runtime.mjs
git commit -m "studio: viewport hygiene for mobile — dvh, touch-action, visualViewport"
```

---

## Task 2: Responsive layout + scrub bar finger-sizing

**Files:**
- Modify: `studio/styles.css` (catalog grid, scrub bar, meta overlay breakpoints)

- [ ] **Step 1: Enlarge the scrub-bar hit zone and track**

In `styles.css`, the `.audio-ui .progress` rule currently has `height: 36px;`. Replace the progress + track rules (lines ~163-188) with:

```css
.audio-ui .progress {
  position: relative;
  height: 44px;              /* finger-sized hit zone */
  cursor: pointer;
  pointer-events: auto;
  display: flex;
  align-items: center;
}

.audio-ui .progress .track {
  position: relative;
  width: 100%;
  height: 3px;
  background: rgba(232, 230, 223, 0.28);
  transition: height 120ms ease-out;
}

.audio-ui .progress:hover .track,
.audio-ui .progress.dragging .track { height: 5px; }
```

- [ ] **Step 2: Add a narrow-viewport breakpoint for the catalog**

Append to `styles.css`:

```css
@media (max-width: 480px) {
  .catalog {
    padding: 4vh 4vw;
  }
  .catalog-inner {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .card {
    padding: 16px 18px;
  }
  #meta { left: 14px; bottom: 12px; max-width: 80vw; }
  #meta .title { font-size: 13px; }
  #meta .sub { font-size: 10px; }
  .fps { font-size: 9px; top: 8px; right: 10px; }
}
```

- [ ] **Step 3: Hide the tooltip on coarse pointers**

Append to `styles.css`:

```css
@media (pointer: coarse) {
  .audio-ui .tooltip { display: none; }
}
```

The tooltip shows timestamp on hover — fingers obscure it and there's no hover state on touch.

- [ ] **Step 4: Manual verification**

```bash
npm run studio
```

Load an audio piece (`/chamber`) in Chrome device emulation at iPhone 14. Confirm:
- Scrub bar reaches by finger (44px hit zone).
- Open catalog (`c` via hardware keyboard in emulator), cards stack in a single column.
- Meta overlay bottom-left reads without crowding.

- [ ] **Step 5: Commit**

```bash
git add studio/styles.css
git commit -m "studio: responsive catalog + finger-sized scrub bar"
```

---

## Task 3: Touch bar UI + wiring

**Files:**
- Modify: `studio/index.html` (add `<nav id="touch-bar">` markup)
- Modify: `studio/styles.css` (touch bar styling, coarse-pointer gating)
- Modify: `studio/runtime.mjs` (coarse-pointer detection, button handlers, play/pause icon sync)

- [ ] **Step 1: Add touch bar markup**

In `studio/index.html`, just before `<script type="module" src="/runtime.mjs"></script>` (around line 49), insert:

```html
  <nav id="touch-bar" class="touch-bar" aria-hidden="true">
    <button type="button" id="tb-prev"    aria-label="previous piece">‹</button>
    <button type="button" id="tb-catalog" aria-label="open catalog">catalog</button>
    <button type="button" id="tb-play"    aria-label="play/pause audio" hidden>▶</button>
    <button type="button" id="tb-next"    aria-label="next piece">›</button>
  </nav>
```

- [ ] **Step 2: Style the touch bar**

Append to `studio/styles.css`:

```css
.touch-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: none;
  justify-content: space-around;
  align-items: stretch;
  padding: 8px max(12px, env(safe-area-inset-left))
           calc(8px + env(safe-area-inset-bottom))
           max(12px, env(safe-area-inset-right));
  gap: 8px;
  background: linear-gradient(to top,
    rgba(5, 5, 5, 0.85),
    rgba(5, 5, 5, 0.55) 60%,
    rgba(5, 5, 5, 0));
  z-index: 8;
  transition: opacity 600ms ease-out;
  opacity: 0;
  pointer-events: none;
}

body.coarse-pointer .touch-bar { display: flex; }
body.coarse-pointer.active .touch-bar { opacity: 1; pointer-events: auto; }
body.hud-off .touch-bar { display: none; }

.touch-bar button {
  flex: 1 1 0;
  min-height: 44px;
  background: rgba(232, 230, 223, 0.06);
  border: 1px solid rgba(232, 230, 223, 0.18);
  color: var(--ink);
  font-family: inherit;
  font-size: 14px;
  padding: 10px 12px;
  cursor: pointer;
  letter-spacing: 0.05em;
}
.touch-bar button:active {
  background: rgba(232, 230, 223, 0.16);
}
.touch-bar button[hidden] { display: none; }
```

- [ ] **Step 3: Add coarse-pointer detection and touch-bar wiring in runtime**

`studio/runtime.mjs` — after the existing element-lookup block (after line 42 where `liveHintEl` is grabbed), insert:

```js
const touchBarEl   = document.getElementById('touch-bar');
const tbPrevEl     = document.getElementById('tb-prev');
const tbCatalogEl  = document.getElementById('tb-catalog');
const tbPlayEl     = document.getElementById('tb-play');
const tbNextEl     = document.getElementById('tb-next');

const coarsePointerMQ = window.matchMedia('(pointer: coarse)');
function applyCoarsePointer() {
  document.body.classList.toggle('coarse-pointer', coarsePointerMQ.matches);
}
applyCoarsePointer();
coarsePointerMQ.addEventListener?.('change', applyCoarsePointer);

tbPrevEl?.addEventListener('click',    () => { userOverride = true; cycle(-1); });
tbNextEl?.addEventListener('click',    () => { userOverride = true; cycle(+1); });
tbCatalogEl?.addEventListener('click', () => toggleCatalog());
tbPlayEl?.addEventListener('click',    () => { if (audioEl) toggleAudio(); });
```

- [ ] **Step 4: Sync the play/pause button icon and visibility**

`studio/runtime.mjs` — inside `updateAudioUi()` (currently at lines ~1160-1172), append before the closing brace:

```js
  if (tbPlayEl) {
    if (audioEl || liveStream) {
      tbPlayEl.hidden = false;
      tbPlayEl.textContent = audioPlaying ? '⏸' : '▶';
    } else {
      tbPlayEl.hidden = true;
    }
  }
```

- [ ] **Step 5: Manual check**

```bash
npm run studio
```

In Chrome device emulation at iPhone 14:
- Touch bar visible at bottom, four buttons.
- Tapping `›` advances to next piece, `‹` reverses, `catalog` opens the catalog, tapping a card loads the piece.
- On an audio piece (`/chamber`), play button appears; tapping toggles play/pause and icon updates.
- Touch bar fades out ~2.5s after last activity (same idle behaviour as other overlays).

On desktop (disable device emulation):
- Touch bar is NOT visible.

- [ ] **Step 6: Commit**

```bash
git add studio/index.html studio/styles.css studio/runtime.mjs
git commit -m "studio: touch bar for coarse-pointer navigation"
```

---

## Task 4: Adaptive hint text

**Files:**
- Modify: `studio/runtime.mjs` (set hint text at boot based on pointer modality, auto-dismiss on coarse)

- [ ] **Step 1: Rewrite hint at boot**

`studio/runtime.mjs` — after the existing `wakeOverlays()` call near the bottom of the module-init section (line ~1221), insert:

```js
applyHintForModality();
coarsePointerMQ.addEventListener?.('change', applyHintForModality);

function applyHintForModality() {
  if (!hintEl) return;
  if (coarsePointerMQ.matches) {
    if (localStorage.getItem('vjay_hint_dismissed') === '1') {
      hintEl.classList.add('hidden');
      return;
    }
    hintEl.textContent = 'swipe ← → cycle · pinch zoom · two-finger pan · tap pokes';
    hintEl.classList.remove('hidden');
    setTimeout(() => {
      hintEl.classList.add('hidden');
      localStorage.setItem('vjay_hint_dismissed', '1');
    }, 6000);
  } else {
    hintEl.textContent = '← →  next/prev     c  catalog     space  play/pause     drag bottom bar  scrub     r  reset time     h  toggle hud';
    hintEl.classList.remove('hidden');
  }
}
```

Note: the desktop hint duplicates the HTML content because `applyHintForModality` can be re-run on modality change (hybrid laptops switching inputs), and the runtime shouldn't depend on the HTML's initial textContent surviving.

- [ ] **Step 2: Manual check**

```bash
npm run studio
```

- Desktop: hint reads keyboard shortcuts, stays visible when page is active.
- iPhone emulation, first load: hint reads gesture legend, disappears after ~6s.
- Refresh on iPhone emulation: hint does NOT reappear (localStorage flag set).
- Clear localStorage in DevTools → hint reappears.
- Toggle between touch + mouse emulation: hint text swaps accordingly.

- [ ] **Step 3: Commit**

```bash
git add studio/runtime.mjs
git commit -m "studio: hint text adapts to pointer modality, auto-dismisses on touch"
```

---

## Task 5: Gesture classifier module (TDD)

**Files:**
- Create: `studio/gestures.mjs`
- Create: `tests/gestures.test.mjs`

- [ ] **Step 1: Write the failing tests**

Create `tests/gestures.test.mjs`:

```js
// ABOUTME: Unit tests for the pointer gesture classifier — taps, swipes, pinch,
// ABOUTME: two-finger pan. Pure module, no DOM.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGestureTracker } from '../studio/gestures.mjs';

test('single quick tap classifies as tap', () => {
  const g = createGestureTracker();
  g.addPointer('a', 100, 100, 0);
  const result = g.removePointer('a', 100, 100, 120); // 120ms, 0 travel
  assert.deepEqual(result, { kind: 'tap' });
});

test('tap with small jitter still tap', () => {
  const g = createGestureTracker();
  g.addPointer('a', 100, 100, 0);
  g.movePointer('a', 104, 103, 50);
  const result = g.removePointer('a', 104, 103, 150);
  assert.deepEqual(result, { kind: 'tap' });
});

test('slow drag is NOT a tap and NOT a swipe', () => {
  const g = createGestureTracker();
  g.addPointer('a', 100, 100, 0);
  g.movePointer('a', 300, 110, 800);
  const result = g.removePointer('a', 300, 110, 1000);
  assert.equal(result, null);
});

test('fast horizontal leftward swipe returns swipe +1', () => {
  const g = createGestureTracker();
  g.addPointer('a', 400, 200, 0);
  g.movePointer('a', 200, 210, 200);
  const result = g.removePointer('a', 200, 210, 250);
  assert.deepEqual(result, { kind: 'swipe', dir: +1 });
});

test('fast horizontal rightward swipe returns swipe -1', () => {
  const g = createGestureTracker();
  g.addPointer('a', 100, 200, 0);
  g.movePointer('a', 300, 210, 200);
  const result = g.removePointer('a', 300, 210, 250);
  assert.deepEqual(result, { kind: 'swipe', dir: -1 });
});

test('mostly-vertical fast gesture is NOT a swipe', () => {
  const g = createGestureTracker();
  g.addPointer('a', 100, 100, 0);
  g.movePointer('a', 130, 300, 200);
  const result = g.removePointer('a', 130, 300, 250);
  assert.equal(result, null);
});

test('primary pointer position tracks single finger', () => {
  const g = createGestureTracker();
  g.addPointer('a', 50, 60, 0);
  assert.deepEqual(g.getPrimary(), { x: 50, y: 60 });
  g.movePointer('a', 70, 80, 10);
  assert.deepEqual(g.getPrimary(), { x: 70, y: 80 });
});

test('primary becomes null when all pointers released', () => {
  const g = createGestureTracker();
  g.addPointer('a', 50, 60, 0);
  g.removePointer('a', 50, 60, 100);
  assert.equal(g.getPrimary(), null);
});

test('two-finger pinch-out zooms in (zoom > 1)', () => {
  const g = createGestureTracker({ refSize: 1000 });
  g.addPointer('a', 400, 500, 0);
  g.addPointer('b', 600, 500, 0);
  // Start distance = 200. Move to distance 400.
  g.movePointer('a', 300, 500, 100);
  g.movePointer('b', 700, 500, 100);
  assert.ok(g.getZoom() > 1.9 && g.getZoom() < 2.1,
    `expected zoom ≈ 2, got ${g.getZoom()}`);
});

test('two-finger pinch-in zooms out (zoom < 1)', () => {
  const g = createGestureTracker({ refSize: 1000 });
  g.addPointer('a', 300, 500, 0);
  g.addPointer('b', 700, 500, 0);
  // Start distance = 400. Move to 200.
  g.movePointer('a', 400, 500, 100);
  g.movePointer('b', 600, 500, 100);
  assert.ok(g.getZoom() > 0.45 && g.getZoom() < 0.55,
    `expected zoom ≈ 0.5, got ${g.getZoom()}`);
});

test('zoom compounds across gestures', () => {
  const g = createGestureTracker({ refSize: 1000 });
  // First pinch: 2x
  g.addPointer('a', 400, 500, 0);
  g.addPointer('b', 600, 500, 0);
  g.movePointer('a', 300, 500, 50);
  g.movePointer('b', 700, 500, 50);
  g.removePointer('a', 300, 500, 100);
  g.removePointer('b', 700, 500, 100);
  // Second pinch: another 2x
  g.addPointer('c', 400, 500, 200);
  g.addPointer('d', 600, 500, 200);
  g.movePointer('c', 300, 500, 250);
  g.movePointer('d', 700, 500, 250);
  assert.ok(g.getZoom() > 3.8 && g.getZoom() < 4.2,
    `expected zoom ≈ 4, got ${g.getZoom()}`);
});

test('zoom is clamped to [0.25, 4.0]', () => {
  const g = createGestureTracker({ refSize: 1000 });
  // Pinch extreme
  g.addPointer('a', 499, 500, 0);
  g.addPointer('b', 501, 500, 0);          // tiny start distance
  g.movePointer('a', 0, 500, 100);
  g.movePointer('b', 1000, 500, 100);      // huge end distance
  assert.equal(g.getZoom(), 4.0);
});

test('two-finger translation pans without zooming', () => {
  const g = createGestureTracker({ refSize: 1000 });
  g.addPointer('a', 400, 500, 0);
  g.addPointer('b', 600, 500, 0);
  // Both fingers shift right by 100px. Centroid moves +100, distance unchanged.
  g.movePointer('a', 500, 500, 100);
  g.movePointer('b', 700, 500, 100);
  const pan = g.getPan();
  assert.ok(Math.abs(pan[0] - 0.1) < 0.001, `pan.x expected 0.1, got ${pan[0]}`);
  assert.ok(Math.abs(pan[1] - 0) < 0.001,   `pan.y expected 0, got ${pan[1]}`);
  assert.ok(Math.abs(g.getZoom() - 1.0) < 0.001, `zoom should stay 1, got ${g.getZoom()}`);
});

test('reset restores zoom=1 and pan=[0,0]', () => {
  const g = createGestureTracker({ refSize: 1000 });
  g.addPointer('a', 400, 500, 0);
  g.addPointer('b', 600, 500, 0);
  g.movePointer('a', 300, 500, 50);
  g.movePointer('b', 700, 500, 50);
  g.reset();
  assert.equal(g.getZoom(), 1.0);
  assert.deepEqual(g.getPan(), [0, 0]);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm test -- --test-name-pattern gestures
```

Expected: all gestures tests fail with "Cannot find module '../studio/gestures.mjs'".

- [ ] **Step 3: Write the gesture tracker**

Create `studio/gestures.mjs`:

```js
// ABOUTME: Pure gesture-tracker module — maps a stream of pointer add/move/remove
// ABOUTME: events to single-tap / swipe classifications and sticky zoom/pan state.

const DEFAULTS = {
  tapMs:      200,    // max duration for a tap
  tapPx:      10,     // max travel for a tap
  swipeMs:    400,    // max duration for a swipe
  swipePx:    80,     // min |dx| for a swipe
  swipeRatio: 3,      // min |dx|/|dy| ratio — swipe must be mostly horizontal
  zoomMin:    0.25,
  zoomMax:    4.0,
  refSize:    1,      // reference size for pan normalisation (min(w,h) in caller units)
};

export function createGestureTracker(opts = {}) {
  const cfg = { ...DEFAULTS, ...opts };

  // Each entry: { x, y, startX, startY, startT }
  const pointers = new Map();

  // Sticky state — accumulates across gestures.
  let zoom = 1.0;
  let pan  = [0, 0];

  // Two-finger gesture baseline, captured at the transition 1→2 pointers.
  let pinch = null;  // { startDistance, startCentroid:[x,y], zoomAtStart, panAtStart }

  function addPointer(id, x, y, t) {
    pointers.set(id, { x, y, startX: x, startY: y, startT: t });
    if (pointers.size === 2) beginPinch();
  }

  function movePointer(id, x, y, _t) {
    const p = pointers.get(id);
    if (!p) return;
    p.x = x; p.y = y;
    if (pointers.size >= 2 && pinch) updatePinch();
  }

  function removePointer(id, x, y, t) {
    const p = pointers.get(id);
    if (!p) return null;

    // Finalise the pointer's own position so exit classification uses it.
    p.x = x; p.y = y;

    const dt = t - p.startT;
    const dx = x - p.startX;
    const dy = y - p.startY;
    const travel = Math.hypot(dx, dy);

    pointers.delete(id);

    // A second-finger release ends pinch but must not fire tap/swipe.
    if (pointers.size === 1) {
      pinch = null;
      return null;
    }
    if (pointers.size > 0) {
      // Still multi-touch — no classification yet.
      return null;
    }
    // pointers.size === 0 — last finger up.
    pinch = null;

    // Tap: quick, minimal travel.
    if (dt <= cfg.tapMs && travel <= cfg.tapPx) {
      return { kind: 'tap' };
    }
    // Swipe: quick, long, mostly-horizontal.
    if (dt <= cfg.swipeMs
        && Math.abs(dx) >= cfg.swipePx
        && Math.abs(dx) >= cfg.swipeRatio * Math.abs(dy)) {
      // Leftward swipe (dx < 0) = next (dir +1); rightward = prev (dir -1).
      return { kind: 'swipe', dir: dx < 0 ? +1 : -1 };
    }
    return null;
  }

  function beginPinch() {
    const [a, b] = [...pointers.values()];
    pinch = {
      startDistance:  Math.hypot(a.x - b.x, a.y - b.y) || 1,
      startCentroid:  [(a.x + b.x) * 0.5, (a.y + b.y) * 0.5],
      zoomAtStart:    zoom,
      panAtStart:     [pan[0], pan[1]],
    };
  }

  function updatePinch() {
    const [a, b] = [...pointers.values()];
    const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    const centroid = [(a.x + b.x) * 0.5, (a.y + b.y) * 0.5];
    const ratio    = distance / pinch.startDistance;
    zoom = clamp(pinch.zoomAtStart * ratio, cfg.zoomMin, cfg.zoomMax);
    pan  = [
      pinch.panAtStart[0] + (centroid[0] - pinch.startCentroid[0]) / cfg.refSize,
      pinch.panAtStart[1] + (centroid[1] - pinch.startCentroid[1]) / cfg.refSize,
    ];
  }

  function getPrimary() {
    if (pointers.size === 0) return null;
    const p = pointers.values().next().value;
    return { x: p.x, y: p.y };
  }

  function reset() {
    pointers.clear();
    pinch = null;
    zoom = 1.0;
    pan  = [0, 0];
  }

  return {
    addPointer,
    movePointer,
    removePointer,
    getPrimary,
    getZoom: () => zoom,
    getPan:  () => [pan[0], pan[1]],
    setRefSize(n) { cfg.refSize = Math.max(1, n); },
    reset,
  };
}

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --test-name-pattern gestures
```

Expected: all 13 tests pass.

- [ ] **Step 5: Run the full suite**

```bash
npm test
```

Expected: no regressions in existing tests.

- [ ] **Step 6: Commit**

```bash
git add studio/gestures.mjs tests/gestures.test.mjs
git commit -m "studio: pure gesture-tracker module (taps, swipes, pinch, pan)"
```

---

## Task 6: Wire Pointer Events into runtime (replace mouse listeners)

**Files:**
- Modify: `studio/runtime.mjs` (import gesture tracker; replace `mousemove` block at lines 129-132; replace canvas click at 158-160; replace scrub-bar mouse handlers at 162-197; expose accumulated zoom/pan state for later uniform wiring)

- [ ] **Step 1: Import the gesture tracker**

`studio/runtime.mjs` — at the top near the existing `import { createBilliards } ...` (line 4), add:

```js
import { createGestureTracker } from './gestures.mjs';
```

- [ ] **Step 2: Create the gesture tracker near module init, above `resize()` use**

`studio/runtime.mjs` — right after the existing `billiards` creation (around line 95, where `const billiards = createBilliards(...)` lives), insert:

```js
// Unified gesture state — consumed in render() for u_mouse / u_zoom / u_pan /
// u_tap_pulse. Created early so resize() can update refSize on every call.
const gestures = createGestureTracker({ refSize: 1 });
let tapPulse = 0;  // decays in render(); set to 1 on tap
```

Then in the existing `resize()` function at the bottom of the file (lines 1230-1239), append at the very end of the function body, after the `if (changed && currentPipeline) ...` line:

```js
  gestures.setRefSize(Math.min(canvas.clientWidth, canvas.clientHeight) || 1);
```

This guarantees refSize follows the viewport through every resize path (window resize, visualViewport resize, render_scale changes).

- [ ] **Step 3: Replace the canvas mouse listeners with pointer events**

Locate the block at line 129:

```js
window.addEventListener('mousemove', (e) => {
  mouse = [e.clientX, canvas.clientHeight - e.clientY];
  wakeOverlays();
});
```

and the canvas click handler at line 158:

```js
canvas.addEventListener('click', () => {
  if (audioEl && audioEl.paused) toggleAudio();
});
```

Replace BOTH of these with:

```js
function updateMouseFromGestures() {
  const p = gestures.getPrimary();
  if (p) mouse = [p.x, canvas.clientHeight - p.y];
}

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  gestures.addPointer(e.pointerId, e.clientX, e.clientY, e.timeStamp);
  updateMouseFromGestures();
  wakeOverlays();
});

canvas.addEventListener('pointermove', (e) => {
  gestures.movePointer(e.pointerId, e.clientX, e.clientY, e.timeStamp);
  updateMouseFromGestures();
  wakeOverlays();
});

function endPointer(e) {
  const cls = gestures.removePointer(e.pointerId, e.clientX, e.clientY, e.timeStamp);
  if (!cls) return;
  if (cls.kind === 'tap') {
    tapPulse = 1.0;
    // Preserve existing behaviour: a tap on the canvas also toggles paused audio.
    if (audioEl && audioEl.paused) toggleAudio();
  } else if (cls.kind === 'swipe') {
    userOverride = true;
    cycle(cls.dir);
  }
}

canvas.addEventListener('pointerup',     endPointer);
canvas.addEventListener('pointercancel', endPointer);
```

Note: the old handler updated `mouse` on every `mousemove` (no drag required). Pointer Events on desktop mice fire `pointermove` with no buttons pressed, so this preserves the "cursor-is-always-an-instrument" feel. The sole behavioural change is that touch now also drives `u_mouse` — which is the intent. Desktop shift-drag pan is added in Task 8.

- [ ] **Step 4: Replace the scrub-bar mouse handlers with pointer events**

Locate the scrub-bar block at lines ~162-197 (starts with `let scrubbing = false;`). Replace it with:

```js
let scrubbing = false;
let scrubPointerId = null;
if (audioProgressEl) {
  const seekFromEvent = (e) => {
    if (!audioEl || !isFinite(audioEl.duration)) return;
    const rect = audioProgressEl.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioEl.currentTime = pct * audioEl.duration;
    updateAudioUi();
  };
  const updateTooltipFromEvent = (e) => {
    if (!audioEl || !audioTooltipEl) return;
    const rect = audioProgressEl.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const t    = pct * (audioEl.duration || 0);
    audioTooltipEl.textContent = formatTime(t);
    audioTooltipEl.style.left  = (pct * 100) + '%';
  };
  audioProgressEl.addEventListener('pointerdown', (e) => {
    scrubbing = true;
    scrubPointerId = e.pointerId;
    audioProgressEl.setPointerCapture(e.pointerId);
    audioProgressEl.classList.add('dragging');
    seekFromEvent(e);
    updateTooltipFromEvent(e);
    e.preventDefault();
  });
  audioProgressEl.addEventListener('pointermove', (e) => {
    if (scrubbing && e.pointerId === scrubPointerId) {
      seekFromEvent(e);
    }
    updateTooltipFromEvent(e);
  });
  const endScrub = (e) => {
    if (!scrubbing || e.pointerId !== scrubPointerId) return;
    scrubbing = false;
    scrubPointerId = null;
    audioProgressEl.classList.remove('dragging');
  };
  audioProgressEl.addEventListener('pointerup',     endScrub);
  audioProgressEl.addEventListener('pointercancel', endScrub);
}
```

- [ ] **Step 5: Decay tapPulse in the render loop**

`studio/runtime.mjs` — inside `render()`, right after the existing `sampleAudio();` call (around line 244), insert:

```js
  tapPulse *= 0.85;
  if (tapPulse < 1e-4) tapPulse = 0;
```

(Uniform binding comes in Task 7. For now, the value just decays.)

- [ ] **Step 6: Run the existing test suite**

```bash
npm test
```

Expected: all existing tests pass. Pointer events are a runtime-only concern; server / smoke tests unaffected.

- [ ] **Step 7: Manual regression check — desktop**

```bash
npm run studio
```

Load `/chamber` on desktop. Confirm:
- Moving the mouse still stirs `u_mouse` (shader responds to cursor position as before).
- Clicking the canvas with no drag still toggles paused audio.
- Scrub bar drag still works with mouse.
- Arrow keys, `c`, space, `r`, `h` unaffected.

- [ ] **Step 8: Manual check — touch (device emulation)**

Switch Chrome to iPhone 14 emulation, reload `/chamber`:
- Touch + drag stirs the piece (`u_mouse` follows finger).
- Single tap toggles paused audio (same as desktop click).
- Fast horizontal swipe cycles to next/prev piece.
- Scrub bar (if on an audio piece) responds to touch drag.

- [ ] **Step 9: Commit**

```bash
git add studio/runtime.mjs
git commit -m "studio: pointer events + gesture tracker for u_mouse, taps, swipes"
```

---

## Task 7: New standard uniforms (`u_zoom`, `u_pan`, `u_tap_pulse`)

**Files:**
- Modify: `studio/runtime.mjs` (`setStandardUniforms` at lines 629-657)
- Create: `pieces/touch-probe/shader.frag`, `pieces/touch-probe/meta.yaml`

- [ ] **Step 1: Add the three uniform setters**

`studio/runtime.mjs` — inside `setStandardUniforms`, after the existing `setUniform1f('u_audio_time', ...)` call and before the `setUniform2fv('u_ball_pos', ...)` line (around line 652), insert:

```js
  setUniform1f('u_zoom',      gestures.getZoom());
  const _pan = gestures.getPan();
  setUniform2f('u_pan',       _pan[0], _pan[1]);
  setUniform1f('u_tap_pulse', tapPulse);
```

These use the existing `setUniform*` cache — locations are looked up lazily per program and skipped (GL no-op) when the shader doesn't declare them.

- [ ] **Step 2: Create a debug piece that renders the new uniforms**

Create `pieces/touch-probe/shader.frag`:

```glsl
// ABOUTME: Debug piece for mobile gestures — visualises u_zoom / u_pan / u_tap_pulse
// ABOUTME: so manual QA and smoke tests can verify the uniforms are wired live.
#version 300 es
precision highp float;
uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_zoom;
uniform vec2  u_pan;
uniform float u_tap_pulse;
out vec4 fragColor;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  uv = (uv - u_pan) / max(u_zoom, 1e-3);

  // Concentric rings locked to the shader-space origin. With pan+zoom applied
  // above, dragging two fingers moves the rings; pinching rescales them.
  float r = length(uv);
  float rings = sin(r * 30.0 - u_time * 1.5);
  float field = 0.5 + 0.5 * rings;

  // Cursor marker — diamond at u_mouse.
  vec2 m = (u_mouse - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  float cursor = smoothstep(0.02, 0.0, abs(uv.x - m.x / max(u_zoom,1e-3) + u_pan.x)
                                      + abs(uv.y - m.y / max(u_zoom,1e-3) + u_pan.y));

  // Tap pulse: bright flash fading over ~1s.
  float flash = u_tap_pulse;

  vec3 col = vec3(field * 0.4);
  col += vec3(1.0, 0.8, 0.4) * cursor * 0.9;
  col += vec3(1.0, 0.9, 0.7) * flash * 0.6;
  fragColor = vec4(col, 1.0);
}
```

Create `pieces/touch-probe/meta.yaml`:

```yaml
title: touch probe
slug: touch-probe
created: 2026-04-19
notes: |
  Debug piece for mobile gesture wiring. Rings lock to shader-space origin
  so u_pan shifts them and u_zoom rescales them. Cursor diamond follows
  u_mouse. Taps flash the screen via u_tap_pulse.
duration: 10
```

- [ ] **Step 3: Manual check — each new uniform lights up**

```bash
echo touch-probe > pieces/current.txt
npm run studio
```

Load `http://127.0.0.1:7777/touch-probe`:
- Rings visible, cursor diamond tracks mouse, pattern drifts with `u_time`.
- Click the canvas (no drag) → brief flash. Multiple quick clicks → stacked flashes decaying.
- Desktop has no pan/zoom yet (that's Task 8), but the uniform is bound and defaulted, so rings stay centred at 1x.

On iPhone 14 emulation:
- Pinch-out → rings grow. Pinch-in → rings shrink. Zoom persists between gestures.
- Two-finger drag → rings translate. Pan persists.
- Single tap → flash.

- [ ] **Step 4: Run the smoke-shaders script**

```bash
node bin/smoke-shaders.mjs touch-probe
```

Expected: compiles clean, no shader errors, no page errors.

- [ ] **Step 5: Run the full test suite**

```bash
npm test
```

Expected: all existing tests pass.

- [ ] **Step 6: Revert `pieces/current.txt` to the prior slug**

```bash
git checkout pieces/current.txt
```

- [ ] **Step 7: Commit**

```bash
git add studio/runtime.mjs pieces/touch-probe
git commit -m "studio: u_zoom / u_pan / u_tap_pulse standard uniforms + touch-probe piece"
```

---

## Task 8: Desktop parity — wheel zoom and shift-drag pan

**Files:**
- Modify: `studio/runtime.mjs` (wheel listener; shift-drag handling inside the existing pointer handlers; `swapProgram` / `swapPipeline` to gate wheel preventDefault)

- [ ] **Step 1: Track whether the current shader uses `u_zoom`**

`studio/runtime.mjs` — add a module-level boolean near the other state (near line 82):

```js
let programUsesZoom = false;
```

Then inside `swapProgram(prog)` (at line 414), before `startTime = performance.now();`, add:

```js
  programUsesZoom = gl.getUniformLocation(prog, 'u_zoom') !== null;
```

And inside `swapPipeline(pipeline)` (at line 423), before `startTime = performance.now();`, add:

```js
  programUsesZoom = pipeline.passes.some(
    (p) => gl.getUniformLocation(p.program, 'u_zoom') !== null,
  );
```

- [ ] **Step 2: Add `setZoom` / `setPan` to the gesture tracker**

`studio/gestures.mjs` — inside the `return { ... }` block, add:

```js
    setZoom(v) { zoom = clamp(v, cfg.zoomMin, cfg.zoomMax); },
    setPan(x, y) { pan = [x, y]; },
```

Also add a unit test in `tests/gestures.test.mjs`:

```js
test('setZoom clamps and setPan writes state', () => {
  const g = createGestureTracker({ refSize: 1000 });
  g.setZoom(10);      assert.equal(g.getZoom(), 4.0);
  g.setZoom(0.01);    assert.equal(g.getZoom(), 0.25);
  g.setZoom(1.5);     assert.equal(g.getZoom(), 1.5);
  g.setPan(0.3, -0.4);
  assert.deepEqual(g.getPan(), [0.3, -0.4]);
});
```

Run:

```bash
npm test -- --test-name-pattern gestures
```

Expected: new test passes, existing tests still pass.

- [ ] **Step 3: Add the wheel-zoom handler**

`studio/runtime.mjs` — after the pointer handler block from Task 6, insert:

```js
// Desktop zoom — scroll wheel. Only consume the event when the current piece
// references u_zoom AND the catalog is closed, so page scrolling in the catalog
// still works.
canvas.addEventListener('wheel', (e) => {
  if (!programUsesZoom) return;
  if (catalogEl && !catalogEl.classList.contains('hidden')) return;
  e.preventDefault();
  // Negative deltaY = scroll up = zoom in. Exponential so the response feels
  // linear in perceived scale.
  const factor = Math.exp(-e.deltaY * 0.001);
  gestures.setZoom(gestures.getZoom() * factor);
}, { passive: false });
```

- [ ] **Step 4: Add shift-drag pan on desktop mouse**

In the existing `canvas.addEventListener('pointerdown', ...)` from Task 6, update to detect shift-drag and route through the tracker's pan state directly. Replace the pointerdown / pointermove / endPointer block with:

```js
let desktopPanOrigin = null;  // { startX, startY, panAtStart:[x,y] } when shift-drag active

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  if (e.pointerType === 'mouse' && e.shiftKey) {
    desktopPanOrigin = {
      startX:     e.clientX,
      startY:     e.clientY,
      panAtStart: gestures.getPan(),
    };
    return;  // DO NOT feed this pointer into the gesture tracker
  }
  gestures.addPointer(e.pointerId, e.clientX, e.clientY, e.timeStamp);
  updateMouseFromGestures();
  wakeOverlays();
});

canvas.addEventListener('pointermove', (e) => {
  if (desktopPanOrigin) {
    const refSize = Math.min(canvas.clientWidth, canvas.clientHeight) || 1;
    const dx = (e.clientX - desktopPanOrigin.startX) / refSize;
    const dy = (e.clientY - desktopPanOrigin.startY) / refSize;
    gestures.setPan(
      desktopPanOrigin.panAtStart[0] + dx,
      desktopPanOrigin.panAtStart[1] + dy,
    );
    wakeOverlays();
    return;
  }
  gestures.movePointer(e.pointerId, e.clientX, e.clientY, e.timeStamp);
  updateMouseFromGestures();
  wakeOverlays();
});

function endPointer(e) {
  if (desktopPanOrigin) {
    desktopPanOrigin = null;
    return;
  }
  const cls = gestures.removePointer(e.pointerId, e.clientX, e.clientY, e.timeStamp);
  if (!cls) return;
  if (cls.kind === 'tap') {
    tapPulse = 1.0;
    if (audioEl && audioEl.paused) toggleAudio();
  } else if (cls.kind === 'swipe') {
    userOverride = true;
    cycle(cls.dir);
  }
}
```

- [ ] **Step 5: Run tests**

```bash
npm test
```

Expected: all tests pass (gestures + server + stats suites).

- [ ] **Step 6: Manual check — desktop parity**

```bash
echo touch-probe > pieces/current.txt
npm run studio
```

Load `/touch-probe` on desktop. Confirm:
- Scroll wheel up → rings grow (zoom in). Scroll down → shrink. Clamps at the edges.
- Hold shift + drag → rings translate. Release → pan sticks.
- No accidental page scroll. (If on a laptop trackpad, scroll still works when the catalog is open via `c`.)
- Open catalog (`c`), scroll wheel inside it still scrolls the card list.
- Switch to a non-zoom piece (`/chamber`) → wheel does nothing, page doesn't scroll (there's nothing to scroll).

- [ ] **Step 7: Run smoke-shaders over the full catalog**

```bash
node bin/smoke-shaders.mjs
```

Expected: every piece compiles clean, no console errors. Existing pieces remain unaffected by the new uniforms.

- [ ] **Step 8: Revert `pieces/current.txt`**

```bash
git checkout pieces/current.txt
```

- [ ] **Step 9: Commit**

```bash
git add studio/runtime.mjs studio/gestures.mjs tests/gestures.test.mjs
git commit -m "studio: desktop parity — wheel zoom + shift-drag pan"
```

---

## Task 9: Update `vjay-new-piece` skill to reflect mobile capability

**Rationale:** The skill's "Notes for future maintenance" section explicitly says "If the studio runtime gains new capabilities (multi-pass, new uniforms), update the shader template section here." This plan adds three new uniforms and a touch-first interaction model — future piece-creation runs should know they exist and be nudged to use them.

**Files:**
- Modify: `skills/vjay-new-piece/SKILL.md` (Step 7 "Shader" — add uniforms; add a short "Mobile / touch" subsection)

- [ ] **Step 1: Extend Step 7's uniform/capability list**

`skills/vjay-new-piece/SKILL.md` — in Step 7 "Shader", after the existing `Audio uniforms declared if audio is used` bullet (around line 240-241), insert a new bullet:

```markdown
- **Interaction uniforms available** (all additive — declare only what you
  use, defaults are neutral so pieces that ignore them behave as before):
  - `uniform float u_zoom;` — 1.0 neutral, 0.25–4.0. On mobile: pinch.
    On desktop: scroll wheel (only consumed when the shader references
    `u_zoom`, so page-scroll still works elsewhere).
  - `uniform vec2  u_pan;` — [0,0] neutral. `uv + u_pan` shifts the
    frame by one unit per min(canvas.w, canvas.h). On mobile: two-finger
    drag. On desktop: shift+drag.
  - `uniform float u_tap_pulse;` — 0 resting, spikes to 1 on a single
    tap/click and decays ~0.85/frame. Same shape as `u_audio_kick`; use
    it to pulse a parameter the viewer can poke. Unlike `u_mouse`, taps
    are discrete events, so don't drive continuous parameters off it.
- **`u_mouse` is driven by touch on mobile** — the runtime treats a
  finger drag as cursor movement, so pieces that already use `u_mouse`
  (via `lib/interaction.glsl`'s `vjMouseWorld` etc.) gain touch support
  for free. A piece that uses the cursor as an instrument gets a mobile
  audience for free too.
```

- [ ] **Step 2: Add a short "Mobile / touch" subsection after Step 7**

`skills/vjay-new-piece/SKILL.md` — right before the existing Step 8 ("Meta"), insert a new subsection. Find the line `### 8. Meta` and insert above it:

```markdown
### 7b. Mobile / touch sanity

The studio is served at `vjaygent.develle.fr`, which means every piece
lands on phones. Before step 9's sanity render, answer these:

- **Does the piece claim cursor reactivity?** If so, it must survive
  touch. Drive from `u_mouse` via `lib/interaction.glsl`; don't invent
  bespoke pointer handling. Test later with Chrome device emulation
  (iPhone 14) before committing if cursor is central to the claim.
- **Does it use `u_zoom` / `u_pan` / `u_tap_pulse`?** If yes, the piece
  reads differently on touch than on mouse — a phone is the intended
  primary input. Make sure it's expressive under a thumb, not just a
  trackpad.
- **Is the composition portrait-friendly?** Canvas aspect on a phone in
  portrait is ≈ 9:20. A composition that leans on landscape framing
  (e.g. horizontal bands, wide triangles) can collapse. Check
  composition in a narrow viewport (Chrome DevTools → iPhone) while
  still in the shader-editing phase — cheaper than rendering and
  publishing before finding out.
- **Is `render_scale` honest about phone GPUs?** Mid-range phones choke
  on anything heavier than 2–3 full-resolution passes. If the piece is
  ray-marched or multi-pass, bias `render_scale` toward 0.5 rather than
  0.75.

This is a 30-second sanity pass, not a full QA loop. If the piece is
purely autonomous (no cursor reactivity, single-pass, cheap) most of
these answer themselves as "yes".

```

- [ ] **Step 3: Tighten the "Notes for future maintenance" footer**

Near the end of the file, the existing footer says:

```markdown
If the studio runtime gains new capabilities (multi-pass, new uniforms),
update the shader template section here.
```

Replace with:

```markdown
If the studio runtime gains new capabilities (multi-pass, new uniforms,
new input modalities), update the shader template section AND the
7b mobile sanity checklist here. The skill should stay in sync with
VISION, taste, and the runtime's ambient capabilities — a capability
added to the runtime that isn't surfaced here will never show up in
new pieces.
```

- [ ] **Step 4: Verify the skill still parses as valid markdown**

```bash
# No formal parser; eyeball-check the diff renders cleanly.
git diff skills/vjay-new-piece/SKILL.md
```

Check frontmatter (`---` / `user-invocable: true` / etc.) is unchanged,
numbered sections still read in order (7 → 7b → 8), and no stray
backticks or heading levels break the render.

- [ ] **Step 5: Commit**

```bash
git add skills/vjay-new-piece/SKILL.md
git commit -m "skills: /vjay-new-piece learns the mobile uniforms and touch-first sanity check"
```

---

## Task 10: Final integration check

**Files:** (no changes — verification only)

- [ ] **Step 1: Full test suite**

```bash
npm test
```

Expected: all tests pass — server, stats, gestures.

- [ ] **Step 2: Full shader smoke**

```bash
node bin/smoke-shaders.mjs
```

Expected: every piece in the catalog (including `touch-probe`) compiles and renders without console errors.

- [ ] **Step 3: Desktop end-to-end**

```bash
npm run studio
```

Walk through on desktop:
- `/chamber` — mouse stirs, click toggles audio, arrow keys cycle, `c` opens catalog.
- `/touch-probe` — wheel zooms, shift-drag pans, click flashes.
- `/` with no forced piece — runtime loads from `pieces/current.txt`.

- [ ] **Step 4: Mobile end-to-end**

Chrome DevTools → iPhone 14 emulation, reload `http://127.0.0.1:7777/`:
- Touch bar visible, buttons work.
- Hint shows gesture legend; auto-dismisses.
- `/touch-probe`: pinch zoom, two-finger pan, tap flash.
- `/chamber`: finger drag stirs; horizontal swipe cycles pieces.
- Pull down at top: no refresh.
- URL bar show/hide: canvas stays full.

- [ ] **Step 5: Publish-mode regression**

```bash
node bin/publish.mjs chamber --duration 3
```

Expected: produces `pieces/chamber/clip.mp4` as before. Record mode sets `body.hud-off` which hides both the existing overlays and the new touch bar, so the captured frames are unchanged.

- [ ] **Step 6: Commit a summary tag (optional)**

If everything passes:

```bash
git log --oneline -20
```

No commit needed — the per-task commits already tell the story.

---

## Out of scope (captured from spec)

- Auto-degrading `render_scale` under low FPS — deferred.
- Adopting `u_zoom` / `u_pan` in `chamber` / `breath` / other existing pieces — per-piece aesthetic PRs.
- Rotation gesture / `u_rotate` uniform — deferred until a piece wants it.
- Haptics on taps — intentional no.

If any of these become important after rollout, add a follow-up plan.
