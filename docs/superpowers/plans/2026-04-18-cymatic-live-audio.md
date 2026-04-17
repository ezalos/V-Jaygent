# Cymatic Live-Audio Piece — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new V-Jaygent piece `cymatic` — a Chladni standing-wave field driven by live audio capture (mic / line-in / loopback) — by extending the existing `audio:` meta field with a `live` sentinel and adding a `getUserMedia` path + device picker to the studio runtime.

**Architecture:** Runtime gains a second audio-attach branch (`meta.audio === 'live'`) that pipes a `MediaStreamSource` into the existing `AnalyserNode` — never connecting to `audioCtx.destination` (feedback prevention). Device picker UI lets users switch inputs without reload (party use). Shader uses a new `lib/chladni.glsl` primitive with three `(m,n)` mode pairs weighted by bass/mid/high bands; cursor pins the antinode; onsets emit radial shockwaves; FBM-driven idle sweep when silent.

**Tech Stack:** WebGL2 fragment shaders, vanilla JS (no framework), Web Audio API (`AnalyserNode`, `MediaStreamAudioSourceNode`, `MediaDevices.getUserMedia` + `enumerateDevices`), Node 20 + Playwright for headless smoke tests, `node:test` for unit tests.

**Spec:** [`docs/superpowers/specs/2026-04-18-cymatic-live-audio-design.md`](../specs/2026-04-18-cymatic-live-audio-design.md)

---

## File Structure

**Create:**
- `lib/chladni.glsl` — reusable nodal-line primitives (`chladni`, `chladniField`)
- `pieces/cymatic/meta.yaml` — piece metadata with `audio: live` sentinel
- `pieces/cymatic/shader.frag` — single-pass fragment shader

**Modify:**
- `studio/runtime.mjs` — `attachAudio` branch; new `attachLiveAudio` + `tryAttachLiveStream`; device picker logic; `detachAudio` cleanup; `u_audio_time` branch in `setStandardUniforms`
- `studio/index.html` — device-picker `<select>` + hint element inside `#audio-ui`
- `studio/styles.css` — `.audio-input`, `.audio-hint` rules
- `bin/new-piece.mjs` — `--audio <value>` flag

**Do not modify:** `studio/server.mjs` (sentinel is pure runtime convention; server remains pass-through YAML). `tests/server.test.mjs` (no server-side behavior change to assert).

---

## Task 1: Chladni primitive library

**Files:**
- Create: `lib/chladni.glsl`

- [ ] **Step 1: Create `lib/chladni.glsl`**

Content:

```glsl
// ABOUTME: Chladni nodal-line primitives — standing-wave geometry for
// ABOUTME: sound-driven and autonomously-driven pieces.

#ifndef VJAY_CHLADNI_GLSL
#define VJAY_CHLADNI_GLSL

// Chladni plate nodal function for a unit square with mode (m, n).
// The nodal lines are where |chladni(p, m, n)| ~= 0. `p` is expected in
// roughly the [-1, 1] domain; the function is symmetric about (0, 0).
float chladni(vec2 p, float m, float n) {
    const float PI_ = 3.14159265358979;
    return cos(m * PI_ * p.x) * cos(n * PI_ * p.y)
         - cos(n * PI_ * p.x) * cos(m * PI_ * p.y);
}

// Weighted sum of three Chladni modes. Each `pair_k` is a `(m, n)` tuple
// and `w_k` its weight. Returns a signed field — absolute value near zero
// traces node lines.
float chladniField(vec2 p,
                   vec2 pair0, vec2 pair1, vec2 pair2,
                   float w0,   float w1,   float w2) {
    return w0 * chladni(p, pair0.x, pair0.y)
         + w1 * chladni(p, pair1.x, pair1.y)
         + w2 * chladni(p, pair2.x, pair2.y);
}

#endif
```

- [ ] **Step 2: Verify no existing test regressions**

The lib has no consumer yet; Task 3 will exercise it via smoke-shaders. Sanity-check the existing test suite still runs:

Run: `npm test`

Expected: all existing tests pass (`tests/server.test.mjs` does not touch `lib/`).

- [ ] **Step 3: Commit**

```bash
git add lib/chladni.glsl
git commit -m "$(cat <<'EOF'
lib: add chladni primitives

chladni(p, m, n) is a square-plate nodal function; chladniField sums
three modes with per-band weights. Reusable by any piece that wants
standing-wave geometry as its visual substrate.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Runtime stub for `audio: live`

Unblock shipping the piece (Task 3) without hitting a 404 when the current
code treats `"live"` as a filename. The stub just short-circuits to
`detachAudio` — Task 4 replaces it with the real implementation.

**Files:**
- Modify: `studio/runtime.mjs`

- [ ] **Step 1: Branch `attachAudio` on the sentinel**

Find the existing `attachAudio` function (starts at approximately line 790):

```js
function attachAudio(slug, meta) {
  const filename = meta?.audio;
  if (!filename) { detachAudio(); return; }
  const key = `${slug}:${filename}`;
  ...
}
```

Replace the first two lines (preserve everything after) with:

```js
function attachAudio(slug, meta) {
  const spec = meta?.audio;
  if (!spec) { detachAudio(); return; }
  if (spec === 'live') { attachLiveAudio(slug, meta); return; }
  const filename = spec;
  const key = `${slug}:${filename}`;
  ...
}
```

- [ ] **Step 2: Add stub `attachLiveAudio`**

Immediately after the closing `}` of `attachAudio`, insert the stub:

```js
// Stub — replaced with real getUserMedia wiring in the next task.
// For now just detaches so the runtime does not try to fetch `/file/live`.
function attachLiveAudio(slug, meta) {
  detachAudio();
  audioKey = `${slug}:live`;
}
```

- [ ] **Step 3: Run existing test suite**

Run: `npm test`

Expected: all existing tests pass. No behavior changes because no piece yet uses `audio: live`.

- [ ] **Step 4: Commit**

```bash
git add studio/runtime.mjs
git commit -m "$(cat <<'EOF'
runtime: stub attachAudio branch for audio: live sentinel

attachAudio now routes meta.audio === 'live' to attachLiveAudio instead
of attempting a file fetch. Stub implementation only — the real
getUserMedia path arrives next. Ships so a piece with audio: live can
load without 404 noise.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Cymatic piece (idle-rendering only — mic wired in Task 4)

**Files:**
- Create: `pieces/cymatic/meta.yaml`
- Create: `pieces/cymatic/shader.frag`

- [ ] **Step 1: Create `pieces/cymatic/meta.yaml`**

```yaml
title: Cymatic
slug: cymatic
created: 2026-04-18T00:00:00.000Z
audio: live
render_scale: 1.0
uniforms: []
notes: |
  Chladni standing-wave field driven by live audio input. Default
  source is the system microphone; any audioinput device (line-in,
  loopback such as BlackHole / PulseAudio monitor) can be chosen via
  the input picker in the audio UI. Hum / sing / play music at it;
  pattern crystallises. Whisper or deny permission — autonomous FBM
  mode sweep keeps the piece alive. Cursor pins the antinode. Kick /
  snare / cymbal transients punch radial shockwaves from the cursor.

  Requires HTTPS or localhost for getUserMedia. On LAN-by-IP
  (http://10.x.x.x:7777) mic permission will be refused by the
  browser — piece falls back to idle drift.

published_at: null
```

- [ ] **Step 2: Create `pieces/cymatic/shader.frag`**

```glsl
// ABOUTME: Chladni standing-wave field driven by live audio. Three (m,n)
// ABOUTME: mode pairs weighted by bass/mid/high; cursor pins the antinode.
#version 300 es
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform int   u_frame;

uniform float u_audio_level;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;
uniform float u_audio_kick;
uniform float u_audio_snare;
uniform float u_audio_cymbal;
uniform float u_audio_flash;
uniform float u_audio_playing;

#include "chladni.glsl"
#include "noise.glsl"
#include "tonemap.glsl"

out vec4 fragColor;

void main() {
    vec2 frag   = gl_FragCoord.xy;
    vec2 res    = u_resolution.xy;
    float aspect = res.x / max(res.y, 1.0);

    // Screen-space in [-aspect, aspect] x [-1, 1].
    vec2 uv = (frag - 0.5 * res) / min(res.x, res.y);

    // Mouse → plate antinode. Runtime convention: u_mouse == (0, 0) is idle
    // (cursor off-screen). In that branch, synthesise a slow drifting
    // antinode so the piece self-plays.
    bool mouseActive = (u_mouse.x > 0.5 || u_mouse.y > 0.5);
    vec2 mPx = u_mouse / res;                // [0, 1]
    vec2 mC  = (mPx - 0.5) * 2.0;            // [-1, 1]
    mC.x *= aspect;
    vec2 antinode = mouseActive
        ? mC
        : vec2(sin(u_time * 0.20), cos(u_time * 0.17)) * 0.35;

    vec2 p = (uv - antinode) * 1.6;

    // --- Band weights ---
    float bass  = u_audio_bass;
    float mid   = u_audio_mid;
    float high  = u_audio_high;
    float level = u_audio_level;

    // Idle branch: slow FBM-driven mode weights. Gives the piece a life
    // when mic is denied / room is silent / before first gesture.
    if (level < 0.02) {
        float t = u_time * 0.04;
        bass  = 0.12 + 0.18 * fbm(vec2(t,        0.0));
        mid   = 0.10 + 0.14 * fbm(vec2(0.0,      t + 2.1));
        high  = 0.06 + 0.10 * fbm(vec2(t + 4.3,  t + 4.3));
        level = 0.18;
    }

    // --- Shockwaves from transient onsets, centred on the antinode ---
    vec2 d = p;
    float r = length(d);
    vec2 dir = (r > 1e-3) ? d / r : vec2(0.0);
    float wave = u_audio_kick   * exp(-r * r * 0.5) * sin(r *  8.0 - u_time *  6.0)
               + u_audio_snare  * exp(-r * r * 1.2) * sin(r * 16.0 - u_time *  9.0) * 0.5
               + u_audio_cymbal * exp(-r * r * 2.0) * sin(r * 32.0 - u_time * 12.0) * 0.25;
    p += dir * wave * 0.15;

    // --- Chladni sum ---
    float f = chladniField(p,
                           vec2(2.0,  3.0),
                           vec2(5.0,  7.0),
                           vec2(11.0, 13.0),
                           bass, mid, high);

    // Sharpness tracks overall level — whisper = blurry rings, shout = razor.
    float sharpness = smoothstep(0.02, 0.5, level);
    float edge      = mix(0.25, 0.015, sharpness);
    float lit       = 1.0 - smoothstep(0.0, edge, abs(f));

    // Warm palette — structure does the visual work, hue stays in the
    // amber/orange band. Flash term is multiplicative to preserve hue.
    vec3 col = mix(vec3(0.04, 0.015, 0.005),
                   vec3(1.00, 0.55,  0.18), lit);
    col *= 1.0 + u_audio_flash * 0.5;

    col = reinhard(col);
    col = pow(max(col, 0.0), vec3(0.9));

    fragColor = vec4(col, 1.0);
}
```

- [ ] **Step 3: Run headless compile smoke**

Run: `node bin/smoke-shaders.mjs cymatic`

Expected: `✓ cymatic` printed, exit code 0.

If the compile fails, the most likely causes are (a) a missing symbol in
`lib/chladni.glsl` (check Task 1), (b) an `#include` that resolves but
exposes a type mismatch — `noise.glsl::fbm` takes `vec2`, which matches
the call site above.

- [ ] **Step 4: Manual browser check (idle only)**

Run: `npm run studio` in a terminal.

Open: `http://localhost:<port>/cymatic` in a browser (port is printed at
server start; default is 7777).

Expected: warm slow drift pattern renders immediately. Browser console
may log a benign warning about attachLiveAudio being a stub. The
interactivity study's **idle test** passes here.

- [ ] **Step 5: Commit**

```bash
git add pieces/cymatic/meta.yaml pieces/cymatic/shader.frag
git commit -m "$(cat <<'EOF'
cymatic: piece with Chladni field + audio: live meta

Single-pass shader: three (m,n) Chladni mode pairs weighted by bass /
mid / high, cursor pins the antinode, onsets punch radial shockwaves
from the cursor, FBM-driven idle mode sweep when audio level is below
threshold. Uses lib/chladni.glsl + noise.glsl + tonemap.glsl. Meta
declares audio: live — runtime mic wiring lands next.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Runtime — full `attachLiveAudio` + `detachAudio` cleanup

**Files:**
- Modify: `studio/runtime.mjs`

- [ ] **Step 1: Add live-audio state vars**

Find the block that declares audio state (starts with `let audioEl = null;`
at approximately line 94). After the existing `let audioKey = null;` line,
insert:

```js
// Live-capture state — attached when meta.audio === 'live'.
let liveStream        = null;   // MediaStream from getUserMedia
let liveStreamSource  = null;   // MediaStreamAudioSourceNode
let liveStartTime     = 0;      // performance.now() when stream connected
let attachedDeviceId  = null;   // deviceId of the active track
```

- [ ] **Step 2: Replace the stub `attachLiveAudio`**

Replace the stub from Task 2 with the real implementation:

```js
function attachLiveAudio(slug, meta) {
  const key = `${slug}:live`;
  if (audioKey === key && liveStream) { updateAudioUi(); return; }

  detachAudio();

  audioKey     = key;
  audioPlaying = false;
  audioBands   = { level: 0, bass: 0, mid: 0, high: 0 };

  // Show the audio UI container (the device picker lives inside it in
  // Task 5); hide the scrub progress bar (no track to scrub).
  audioUiEl?.classList.remove('hidden');
  audioProgressEl?.classList.add('hidden');
  updateAudioUi();

  // Try immediately — browsers usually block until user gesture; the
  // first-gesture listeners already installed by armFirstGestureAutoplay
  // will retry when the user clicks / keys / touches.
  tryAttachLiveStream();
  armFirstGestureAutoplay();
}

async function tryAttachLiveStream() {
  if (liveStream) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  if (!audioCtx) {
    audioCtx              = new Ctx();
    audioAnalyser         = audioCtx.createAnalyser();
    audioAnalyser.fftSize = 1024;
    audioAnalyser.smoothingTimeConstant = 0.65;
    audioFreqData         = new Uint8Array(audioAnalyser.frequencyBinCount);
  }
  if (audioCtx.state === 'suspended') {
    try { await audioCtx.resume(); } catch {}
  }

  const savedId = localStorage.getItem('vjay_audio_input_device_id') || null;
  const constraints = {
    audio: {
      deviceId:         savedId ? { exact: savedId } : undefined,
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl:  false,
    },
  };

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    // Common causes: user denied, no device, or the savedId is stale.
    // If a savedId was passed, retry once with the default device.
    if (savedId) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
      } catch (retryErr) {
        console.warn('[audio] getUserMedia rejected', retryErr);
        return;
      }
    } else {
      console.warn('[audio] getUserMedia rejected', err);
      return;
    }
  }

  liveStream       = stream;
  liveStreamSource = audioCtx.createMediaStreamSource(stream);
  // IMPORTANT: do NOT connect the analyser to audioCtx.destination —
  // that would route the mic back to speakers and cause feedback.
  liveStreamSource.connect(audioAnalyser);

  liveStartTime     = performance.now();
  audioPlaying      = true;
  attachedDeviceId  = stream.getAudioTracks()[0]?.getSettings()?.deviceId ?? null;

  disarmAutoplay();
  updateAudioUi();
}
```

- [ ] **Step 3: Extend `detachAudio` to tear down the live stream**

Find `detachAudio` (at approximately line 851). Add live-stream cleanup
at the top of the function, before the existing `if (audioEl)` block:

```js
function detachAudio() {
  // Live-capture teardown — stop tracks (dismiss red-dot indicator)
  // and disconnect the source node.
  if (liveStream) {
    for (const t of liveStream.getTracks()) { try { t.stop(); } catch {} }
    liveStream = null;
  }
  if (liveStreamSource) {
    try { liveStreamSource.disconnect(); } catch {}
    liveStreamSource = null;
  }
  attachedDeviceId = null;

  if (audioEl) {
    ...
  }
  ...
  // At the end, restore the progress bar visibility for file pieces
  // (live-attach hid it).
  audioProgressEl?.classList.remove('hidden');
}
```

Leave the rest of `detachAudio` unchanged — it already resets
`audioBands`, `audioOnsets`, `audioKey`, and hides `audioUiEl`.

- [ ] **Step 4: Update `u_audio_time` for live pieces**

Find `setStandardUniforms` (at approximately line 605). The current line:

```js
  setUniform1f('u_audio_time',    audioEl ? audioEl.currentTime : 0.0);
```

Replace with:

```js
  setUniform1f('u_audio_time',
    audioEl ? audioEl.currentTime :
    liveStream ? now :
    0.0);
```

`now` is already in scope (computed at the top of `render` and passed
into `setStandardUniforms`). For live pieces this makes `u_audio_time`
track wall-clock time since piece load, matching `u_time`.

- [ ] **Step 5: Headless smoke still passes**

Run: `node bin/smoke-shaders.mjs cymatic`

Expected: `✓ cymatic` — the headless browser doesn't grant mic
permission, so `tryAttachLiveStream` silently fails into the catch
branch, and the shader renders the idle branch. No console errors
should appear (the `console.warn` in the catch is a warning, which
smoke-shaders filters).

Run: `npm test`

Expected: all pass.

- [ ] **Step 6: Manual browser verification — mic wiring**

Run: `npm run studio`

Open: `http://localhost:<port>/cymatic`

Verify (in this order):

1. **Denial path.** Reject the browser permission prompt. Expected:
   warm idle drift continues. Console has one warn about
   `getUserMedia rejected`. No crashes.
2. **Grant path.** Reload the page, grant permission. Make sound at
   the laptop (hum, whistle, clap). Expected: pattern crystallises
   and responds — louder = sharper nodes, claps = radial shockwaves.
3. **No feedback howl.** Play audio on laptop speakers while mic is
   live. Expected: NO runaway feedback. (If there is, the
   `destination` connection was accidentally wired — re-check
   Step 2.)
4. **Cursor pins antinode.** Move cursor around the screen with mic
   active. Expected: pattern re-centres at cursor position.

- [ ] **Step 7: Commit**

```bash
git add studio/runtime.mjs
git commit -m "$(cat <<'EOF'
runtime: live-audio capture path for audio: live pieces

attachLiveAudio wires getUserMedia → MediaStreamSource → existing
AnalyserNode with echo cancellation / noise suppression / auto gain
all disabled so raw dynamics reach the shader. Never connects to
audioCtx.destination — feedback prevention is structural. detachAudio
stops all tracks (dismisses the red recording indicator) and
disconnects the source node. u_audio_time tracks wall-clock for live
pieces since there is no track timeline.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Device picker UI

**Files:**
- Modify: `studio/index.html`
- Modify: `studio/styles.css`
- Modify: `studio/runtime.mjs`

- [ ] **Step 1: Add the picker element to `studio/index.html`**

Find the existing `#audio-ui` block:

```html
<div id="audio-ui" class="audio-ui hidden">
  <div id="audio-progress" class="progress">
    ...
  </div>
</div>
```

Insert two new children after `#audio-progress`, still inside `#audio-ui`:

```html
  <div id="audio-input" class="audio-input hidden">
    <label for="audio-input-select">input</label>
    <select id="audio-input-select" aria-label="audio input device"></select>
  </div>
  <div id="audio-hint" class="audio-hint hidden"></div>
```

- [ ] **Step 2: Add CSS rules**

Append to `studio/styles.css`:

```css
.audio-input {
  position: fixed;
  right: 20px;
  bottom: 52px;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--ink-dim);
  pointer-events: auto;
}
.audio-input.hidden { display: none; }
.audio-input select {
  background: rgba(0, 0, 0, 0.5);
  color: var(--ink);
  border: 1px solid rgba(232, 230, 223, 0.25);
  padding: 3px 6px;
  font-size: 11px;
  font-family: inherit;
  max-width: 240px;
}

.audio-hint {
  position: fixed;
  right: 20px;
  bottom: 90px;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 6px;
  font-size: 11px;
  color: var(--ink-dim);
  pointer-events: none;
  max-width: 40ch;
}
.audio-hint.hidden { display: none; }
```

- [ ] **Step 3: Wire the picker in `studio/runtime.mjs`**

Near the top of the file, after the other `document.getElementById` lines
(the block with `audioUiEl`, `audioProgressEl`, etc.), add:

```js
const liveInputEl    = document.getElementById('audio-input');
const liveSelectEl   = document.getElementById('audio-input-select');
const liveHintEl     = document.getElementById('audio-hint');
```

At the bottom of the existing event-listener block (after the existing
`audioProgressEl` block, before `await refreshCatalog()`), add:

```js
if (liveSelectEl) {
  liveSelectEl.addEventListener('change', async () => {
    const id = liveSelectEl.value;
    if (!id) return;
    localStorage.setItem('vjay_audio_input_device_id', id);
    await rebuildLiveSource(id);
  });
}

if (navigator.mediaDevices?.addEventListener) {
  navigator.mediaDevices.addEventListener('devicechange', () => {
    if (liveStream) populateDeviceList();
  });
}
```

Add three new helper functions near the other audio helpers (e.g. just
after `tryAttachLiveStream`):

```js
async function populateDeviceList() {
  if (!liveSelectEl || !navigator.mediaDevices?.enumerateDevices) return;
  let devices;
  try {
    devices = await navigator.mediaDevices.enumerateDevices();
  } catch (err) {
    console.warn('[audio] enumerateDevices', err);
    return;
  }
  const inputs = devices.filter((d) => d.kind === 'audioinput');
  liveSelectEl.replaceChildren();
  for (const d of inputs) {
    const opt = document.createElement('option');
    opt.value = d.deviceId;
    opt.textContent = d.label || `input (${d.deviceId.slice(0, 8)})`;
    liveSelectEl.appendChild(opt);
  }
  if (attachedDeviceId) {
    const hasOpt = Array.from(liveSelectEl.options).some((o) => o.value === attachedDeviceId);
    if (hasOpt) liveSelectEl.value = attachedDeviceId;
  }
  liveInputEl?.classList.remove('hidden');
}

async function rebuildLiveSource(deviceId) {
  if (liveStreamSource) { try { liveStreamSource.disconnect(); } catch {} liveStreamSource = null; }
  if (liveStream) {
    for (const t of liveStream.getTracks()) { try { t.stop(); } catch {} }
    liveStream = null;
  }
  audioPlaying = false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId:         { exact: deviceId },
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl:  false,
      },
    });
    liveStream       = stream;
    liveStreamSource = audioCtx.createMediaStreamSource(stream);
    liveStreamSource.connect(audioAnalyser);
    audioPlaying     = true;
    attachedDeviceId = stream.getAudioTracks()[0]?.getSettings()?.deviceId ?? deviceId;
    hideLiveHint();
  } catch (err) {
    console.warn('[audio] getUserMedia rebuild rejected', err);
    showLiveHint(`🎤 couldn't switch to that device (${err.name || 'error'})`);
  }
}

function showLiveHint(text) {
  if (!liveHintEl) return;
  liveHintEl.textContent = text;
  liveHintEl.classList.remove('hidden');
}
function hideLiveHint() {
  liveHintEl?.classList.add('hidden');
}
```

- [ ] **Step 4: Hook populate + hint into the live attach / detach flow**

In `tryAttachLiveStream`, after the successful source-connect block
(right before `disarmAutoplay();`), add:

```js
  hideLiveHint();
  await populateDeviceList();
```

And in `tryAttachLiveStream`, update the two `return` paths that follow
failed `getUserMedia` calls — replace each bare `return;` in the catch
blocks with:

```js
  showLiveHint('🎤 click to grant audio input — piece runs autonomously otherwise');
  return;
```

In `detachAudio`, after the live-stream teardown block, add:

```js
  liveInputEl?.classList.add('hidden');
  hideLiveHint();
```

- [ ] **Step 5: Headless smoke + unit tests**

Run: `node bin/smoke-shaders.mjs cymatic`

Expected: `✓ cymatic`. The hint will be visible in the headless browser
but that's a DOM state, not a console error — smoke passes.

Run: `npm test`

Expected: all pass.

- [ ] **Step 6: Manual browser verification — device picker**

Run: `npm run studio`

Open: `http://localhost:<port>/cymatic`

Verify:

1. **Denial → hint.** Reject the mic prompt. Expected: hint element
   reads "🎤 click to grant audio input — piece runs autonomously
   otherwise". Idle drift continues.
2. **Grant → picker populates.** Grant permission. Expected: picker
   appears listing at least one audio input (labelled once permission
   is granted — before grant, labels may be empty strings, which the
   fallback handles).
3. **Device switch.** If you have more than one input (or loopback
   device), pick a different entry. Expected: stream rebuilds without
   reload, pattern continues to react. LocalStorage entry
   `vjay_audio_input_device_id` updates (check via browser devtools
   Application pane).
4. **Persistence across reload.** Reload the page. Expected: the
   previously-selected device is used (grant prompt may reappear on
   first load per browser policy; after that it's silent).
5. **Stale-id recovery.** Manually set `localStorage` to a random
   string in devtools, reload. Expected: `tryAttachLiveStream` falls
   back to the default device; picker re-populates with the actual
   active input. No console errors (the warn about the stale id is OK).

- [ ] **Step 7: Commit**

```bash
git add studio/index.html studio/styles.css studio/runtime.mjs
git commit -m "$(cat <<'EOF'
runtime: device picker + hint overlay for live-audio pieces

Picker populates from mediaDevices.enumerateDevices once permission
is granted; selection persists in localStorage and rebuilds the
MediaStreamSource without reload (party use case — swap DJ loopback
to mic mid-set). Hint overlay tells users how to grant access on
denial, and recovers silently from stale saved device ids.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Scaffolder `--audio <value>` flag

**Files:**
- Modify: `bin/new-piece.mjs`

- [ ] **Step 1: Extend the arg parser**

Replace the existing arg-parsing block (approximately lines 10–20):

```js
const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const positional = args.filter((a) => !a.startsWith('--'));
```

with a parser that recognises `--audio <value>`:

```js
const args = process.argv.slice(2);
const boolFlags = new Set();
const valueFlags = {};
const positional = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--audio' && i + 1 < args.length) {
    valueFlags.audio = args[++i];
  } else if (a.startsWith('--')) {
    boolFlags.add(a);
  } else {
    positional.push(a);
  }
}
```

- [ ] **Step 2: Update the usage block and `simMode` reference**

Update the usage error message (approximately lines 16–18):

```js
if (!slug || !SLUG_RE.test(slug)) {
  console.error('usage: node bin/new-piece.mjs <slug> [--sim] [--audio <spec>]');
  console.error('  slug must match /^[a-z0-9][a-z0-9-]*$/');
  console.error('  --sim:   scaffold with a multi-pass ping-pong simulate + display pair');
  console.error('  --audio: set the meta.audio field (e.g. --audio live for mic input)');
  process.exit(2);
}
```

Change `const simMode = flags.has('--sim');` to:

```js
const simMode   = boolFlags.has('--sim');
const audioSpec = valueFlags.audio ?? null;
```

- [ ] **Step 3: Inject `audio:` line into generated meta**

In `writeSinglePass` (approximately lines 73–81), change the `meta` template from:

```js
  const meta = `title: "${title}"
slug: ${slug}
created: ${nowIso}
notes: |
  Describe the mathematical idea here.
duration: 10
uniforms: []
published_at: null
`;
```

to:

```js
  const audioLine = audioSpec ? `audio: ${audioSpec}\n` : '';
  const meta = `title: "${title}"
slug: ${slug}
created: ${nowIso}
${audioLine}notes: |
  Describe the mathematical idea here.
duration: 10
uniforms: []
published_at: null
`;
```

In `writeSim` (approximately lines 150–175), apply the same change — insert
the same `audioLine` between `created:` and `notes:`.

Update the function signatures so `writeSinglePass` and `writeSim` accept
`audioSpec` as a parameter, and the call sites pass it through:

```js
// At the call sites near line 39-43:
if (simMode) {
  await writeSim(pieceDir, slug, title, now, audioSpec);
} else {
  await writeSinglePass(pieceDir, slug, title, now, audioSpec);
}

// And the signatures:
async function writeSinglePass(pieceDir, slug, title, nowIso, audioSpec) { ... }
async function writeSim(pieceDir, slug, title, nowIso, audioSpec) { ... }
```

- [ ] **Step 4: Verify the scaffolder**

Run: `node bin/new-piece.mjs cymatic-scratch --audio live`

Expected output includes `created <path>/pieces/cymatic-scratch`.

Verify the generated meta contains the line:

```bash
grep '^audio: live' pieces/cymatic-scratch/meta.yaml
```

Expected: one match.

Also verify the scaffolder still works WITHOUT the flag:

```bash
rm -rf pieces/cymatic-scratch
node bin/new-piece.mjs cymatic-scratch
grep '^audio:' pieces/cymatic-scratch/meta.yaml
```

Expected: the `grep` finds nothing (exit code 1) — no `audio:` line
when the flag is absent.

- [ ] **Step 5: Clean up the scratch piece**

```bash
rm -rf pieces/cymatic-scratch
```

- [ ] **Step 6: Commit**

```bash
git add bin/new-piece.mjs
git commit -m "$(cat <<'EOF'
scaffold: --audio <spec> flag for new-piece

Emits an audio: <spec> line into the generated meta.yaml. Enables
one-shot scaffolding of live-audio pieces (--audio live) and stays
agnostic about the spec string so future sentinels (system, test)
work without further flag changes.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Final verification — smoke pass + interactivity probes

No new files. This task is the full end-to-end pre-merge gate.

- [ ] **Step 1: Full headless smoke**

Run: `node bin/smoke-shaders.mjs`

Expected: all existing pieces + `cymatic` compile. `all N pieces
compiled clean` printed, exit 0.

- [ ] **Step 2: Full unit tests**

Run: `npm test`

Expected: all existing server tests pass. No new tests were added (no
server-side behavior changes).

- [ ] **Step 3: Interactivity-study probes**

From `brainstorming/techniques/interactivity.md` — target 7/7.

Run: `npm run studio`, open `/cymatic`, grant mic permission, then work
through each probe:

1. **Composition test.** With steady sound (hum or loop audio), move
   cursor to three screen positions (top-left, centre, bottom-right).
   The whole pattern should re-centre — not just a local area. **Pass.**
2. **Idle test.** Move cursor off-screen (or wait 30s). Silent the
   room. Piece must still hold the eye — the FBM idle sweep does this.
   **Pass.**
3. **Readability test.** Close the tab. Reopen cold. Within 3 seconds
   and two cursor moves, is the "cursor = centre + sound = pattern"
   mapping apparent? **Pass.**
4. **Reversibility test.** Cursor at A, note frame; cursor to B;
   cursor back to A. Pattern returns (modulo audio state). **Pass.**
5. **Dominance test.** With mic silent (below threshold), cursor
   alone should not drive a crystalline pattern — only the soft idle
   drift. Confirms cursor contribution is ~30% or less of structural
   energy. **Pass.**
6. **Convention test.** Nothing inverted. Cursor-as-centre is the
   neutral mapping (see interactivity study, "radial zoom" family).
   **Pass.**
7. **Latency test.** Move cursor fast. Pattern centre re-aligns in ≤1
   frame (no smoothing on `uMouse01` in the shader). **Pass.**

Record the probe results in a scratch note. If any probe fails,
DO NOT merge — either tune or file to `tasks/pbms.md`.

- [ ] **Step 4: Feedback-prevention regression check**

With cymatic open and mic granted, play audio out of laptop speakers at
normal volume. Observe 30 seconds. Expected: NO runaway feedback howl.

(If this fails, the destination connection was re-introduced somewhere
— grep `studio/runtime.mjs` for `destination` and verify the only
reference is on the file-audio path.)

- [ ] **Step 5: Log out-of-scope findings (if any)**

If any of the 7 probes failed, or any unexpected behaviour appeared
that is outside the scope of this plan, append an entry to
`tasks/pbms.md` with:

- Date (`2026-04-18`)
- Slug / file:line anchor
- Observation
- Status: `open`

Do not fix in this task — it's a verification pass.

- [ ] **Step 6: Final commit (if any touch-ups)**

If Step 3's probes required a minor shader tweak (e.g. idle drift was
too visible), commit it as:

```bash
git add pieces/cymatic/shader.frag
git commit -m "cymatic: tune idle drift after interactivity probes

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

Otherwise, skip — the plan is done.

---

## Spec coverage check

| Spec section                                   | Implemented in |
|------------------------------------------------|-----------------|
| `audio: live` sentinel                         | Task 2, Task 3 |
| `attachAudio` branch on sentinel               | Task 2         |
| `attachLiveAudio` / `tryAttachLiveStream`      | Task 4         |
| `MediaStreamSource`, no `destination` connect  | Task 4         |
| `echoCancellation/noiseSuppression/autoGainControl: false` | Task 4 |
| `detachAudio` stream cleanup                   | Task 4         |
| `u_audio_time` wall-clock for live             | Task 4         |
| Device picker UI + persistence                 | Task 5         |
| `devicechange` listener                        | Task 5         |
| Stale-deviceId fallback                        | Task 4         |
| Denial hint overlay                            | Task 4, Task 5 |
| `lib/chladni.glsl`                             | Task 1         |
| `pieces/cymatic/{meta.yaml, shader.frag}`      | Task 3         |
| Scaffolder `--audio` flag                      | Task 6         |
| Headless smoke + interactivity probes          | Task 7         |

No gaps. Scope is focused — single piece + adjacent runtime extension.
