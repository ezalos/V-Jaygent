// ABOUTME: Studio browser runtime — WebGL2 full-screen quad, fragment shader
// ABOUTME: hot-reload via mtime polling, keyboard navigation, optional record mode.

import { createBilliards } from './billiards.mjs';
import { createGestureTracker } from './gestures.mjs';
import * as audioAnalysis from './audio-analysis.mjs';
import { createKeyboardSynth } from './keyboard-music.mjs';

const VERT = `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const FALLBACK_FRAG = `#version 300 es
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float g = 0.02 + 0.01 * sin(u_time + uv.x * 3.0);
  fragColor = vec4(g, g, g, 1.0);
}`;

const qs = new URLSearchParams(location.search);
const RECORD_MODE = qs.get('record') === '1';

// Offline support: the service worker makes audio cache-first and the rest
// network-first-with-fallback, so a loaded piece keeps playing without
// internet. Skipped in record mode to keep headless runs hermetic.
if (!RECORD_MODE && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
// Slug can come from either a path segment (/in-seven) or ?piece=.
const PATH_MATCH  = location.pathname.match(/^\/([a-z0-9][a-z0-9-]*)$/);
const FORCED_SLUG = qs.get('piece') ?? (PATH_MATCH ? PATH_MATCH[1] : null);
const POLL_MS = 500;

const canvas = document.getElementById('stage');
const metaEl = document.getElementById('meta');
const errorEl = document.getElementById('error');
const hintEl = document.getElementById('hint');
const catalogEl = document.getElementById('catalog');
const catalogInner = catalogEl?.querySelector('.catalog-inner');
const gradesEl = document.getElementById('grades');
const lightboxEl = document.getElementById('lightbox');
// Catalog capability badges. `key` matches the server's capabilities object
// (server.mjs capabilitiesOf); the same keys back the filter chips in index.html.
const CAP_BADGES = [
  { key: 'sound', emoji: '🔊', label: 'sound' },
  { key: 'cursor', emoji: '🖱️', label: 'cursor' },
  { key: 'keyboard', emoji: '🎹', label: 'keyboard' },
];
// Active filter capabilities; multiple = AND (a piece must have all of them).
const catalogFilter = new Set();
const fpsEl = document.getElementById('fps');
const audioUiEl       = document.getElementById('audio-ui');
const audioProgressEl = document.getElementById('audio-progress');
const audioFillEl     = document.getElementById('audio-progress-fill');
const audioHandleEl   = document.getElementById('audio-progress-handle');
const audioTooltipEl  = document.getElementById('audio-progress-tooltip');
const liveInputEl     = document.getElementById('audio-input');
const liveSelectEl    = document.getElementById('audio-input-select');
const liveHintEl      = document.getElementById('audio-hint');
const touchBarEl      = document.getElementById('touch-bar');
const tbPrevEl        = document.getElementById('tb-prev');
const tbCatalogEl     = document.getElementById('tb-catalog');
const tbPlayEl        = document.getElementById('tb-play');
const tbNextEl        = document.getElementById('tb-next');

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

// antialias: false because the layer engine renders the final composite via
// a fullscreen-quad copy from a single-sample FBO; multisampling on the
// default framebuffer causes blitFramebuffer restrictions and (anecdotally)
// driver instability on 3+ layer loads.
const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
// Force driver init before any shader compile. On a cold-tab load (first GL
// page in the browser session) chromium sometimes races the first compile
// against GPU init, producing context loss + null info logs. A trivial
// gl.getParameter forces the driver to settle before we do real work.
if (gl) gl.getParameter(gl.MAX_TEXTURE_SIZE);
if (!gl) {
  showFatal('WebGL2 required.');
  throw new Error('no webgl2');
}

// Enable float-texture rendering so simulation passes can use rgba16f / rgba32f
// targets. Without this extension, ping-pong state textures would be limited
// to 8-bit precision which is insufficient for RD/fluid/gravity sims.
const extColorFloat = gl.getExtension('EXT_color_buffer_float');

// State referenced by functions called during the top-level boot
// (`await loadCurrent(...)` below) must be initialised before it is reached,
// otherwise module-level `let` / `const` lands in the temporal dead zone. Keep
// these up here even though their definitions conceptually belong elsewhere.
const INCLUDE_RE = /^[ \t]*#include[ \t]+"([^"]+)"[ \t]*$/gm;
let libCache = new Map();

// Off-screen target formats — resolved lazily per-allocation so `gl.RGBA8` etc.
// aren't dereferenced before the WebGL2 context exists. Must exist before
// buildPipeline runs on the first piece load.
// Layer-engine copy-to-screen source — fullscreen-quad pass that copies a
// single texture to whatever's currently bound. Replaces blitFramebuffer when
// the destination is the default framebuffer (which is multisampled with
// `antialias: true`, and has restrictions on blit operations).
const LAYER_COPY_FRAG = `#version 300 es
precision highp float;
uniform sampler2D u_src;
out vec4 fragColor;
void main() {
    fragColor = texture(u_src, gl_FragCoord.xy / vec2(textureSize(u_src, 0)));
}`;

// Layer-engine compositor source — used by buildLayerEngine. Lives up here
// because `await loadCurrent` below runs before the layer-engine section.
const COMPOSITOR_FRAG = `#version 300 es
precision highp float;
uniform sampler2D u_acc;
uniform sampler2D u_layer;
uniform int   u_blend_mode;
uniform float u_alpha;
out vec4 fragColor;

vec3 blend(vec3 b, vec3 a, float al, int mode) {
    if (mode == 1) return b + a * al;                            // add
    if (mode == 2) return mix(b, b + (1.0 - b) * a, al);         // screen
    if (mode == 3) return mix(b, b * a, al);                     // multiply
    if (mode == 4) return mix(b, max(b, a), al);                 // max
    if (mode == 5) return mix(b, a, al);                         // replace
    return mix(b, a, al);                                         // 0 = normal
}

void main() {
    vec2 uv = gl_FragCoord.xy / vec2(textureSize(u_acc, 0));
    vec4 below = texture(u_acc, uv);
    vec4 above = texture(u_layer, uv);
    fragColor = vec4(blend(below.rgb, above.rgb, above.a * u_alpha, u_blend_mode), 1.0);
}`;

const BLEND_MODE_TO_INT = {
    normal: 0, add: 1, screen: 2, multiply: 3, max: 4, replace: 5,
};

// ---------- scatter passes (orbit point clouds) ----------
//
// A scatter pass uploads N point positions per frame from a CPU-side orbit
// iterator (Clifford attractor, chaos-game, etc.) and rasterises them with
// additive blending into an rgba16f accumulator. The accumulator can also
// decay per frame so the structure stays alive while old paths fade — the
// fractal-flame trick adapted to V-Jaygent's pass pipeline.
//
// Pieces declare a scatter pass like:
//
//   passes:
//     - name: accumulator
//       kind: scatter           # marks this pass as point-cloud rather than full-screen
//       orbit: clifford         # built-in orbit type: clifford | chaos-game
//       points: 8192            # N orbit points emitted per frame
//       decay: 0.96             # accumulator * decay before new points splat
//       target: { format: rgba16f, ping_pong: true }
//       params:
//         a: -1.25
//         b: -1.25
//         c: -1.82
//         d: -1.91
//         brightness: 0.06
//         hue: 0.0
//
// Downstream display passes read the accumulator texture via `inputs:` and
// apply tone-mapping + palette as usual.

const SCATTER_VERT = `#version 300 es
// Built-in scatter vertex shader. Reads a vec4 attribute per point —
// xy in clip space [-1,1], z=brightness, w=hue index.
in vec4 a_pt;
out float v_brightness;
out float v_hue;
uniform float u_point_size;
void main() {
    gl_Position = vec4(a_pt.xy, 0.0, 1.0);
    gl_PointSize = u_point_size;
    v_brightness = a_pt.z;
    v_hue = a_pt.w;
}`;

const SCATTER_FRAG = `#version 300 es
precision highp float;
in float v_brightness;
in float v_hue;
out vec4 fragColor;
void main() {
    // gl_PointCoord is in [0,1] across the point sprite. Build a tight
    // gaussian so points read as round dots, not squares.
    vec2 q = gl_PointCoord - 0.5;
    float d2 = dot(q, q) * 4.0;          // 0 at centre, 1 at radius
    float fall = exp(-d2 * 5.0);          // gaussian falloff
    // Hue palette: 0=cream, 0.5=amber, 1=gold-rust. All warm.
    vec3 cream  = vec3(1.10, 0.78, 0.42);
    vec3 amber  = vec3(1.20, 0.65, 0.22);
    vec3 rust   = vec3(0.80, 0.32, 0.08);
    vec3 col;
    if (v_hue < 0.5) col = mix(cream, amber, v_hue * 2.0);
    else             col = mix(amber, rust, (v_hue - 0.5) * 2.0);
    fragColor = vec4(col * v_brightness * fall, 1.0);
}`;

const DECAY_FRAG = `#version 300 es
precision highp float;
uniform sampler2D u_prev;
uniform float u_decay;
out vec4 fragColor;
void main() {
    vec4 c = texelFetch(u_prev, ivec2(gl_FragCoord.xy), 0);
    fragColor = c * u_decay;
}`;

// Built-in CPU-side orbit iterators. Each takes a persistent state object
// (so orbits continue across frames without re-seeding), the requested
// batch size N, and a params dict. Returns a Float32Array of length 4N
// laid out as [x, y, brightness, hue, ...] per point. x and y are in
// clip-space [-1, 1].

function cliffordOrbit(state, N, params) {
    const { a = -1.25, b = -1.25, c = -1.82, d = -1.91 } = params;
    const bright = params.brightness ?? 0.06;
    const hue    = params.hue        ?? 0.0;
    const scale  = params.scale      ?? (1 / 2.8);
    let x = state.x ?? 0.01;
    let y = state.y ?? 0.01;
    // Burn-in if first batch ever — settle onto the attractor.
    if (!state.burned) {
        for (let i = 0; i < 200; i++) {
            const nx = Math.sin(a * y) + c * Math.cos(a * x);
            const ny = Math.sin(b * x) + d * Math.cos(b * y);
            x = nx; y = ny;
        }
        state.burned = true;
    }
    const out = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
        const nx = Math.sin(a * y) + c * Math.cos(a * x);
        const ny = Math.sin(b * x) + d * Math.cos(b * y);
        x = nx; y = ny;
        out[i*4 + 0] = x * scale;
        out[i*4 + 1] = y * scale;
        out[i*4 + 2] = bright;
        out[i*4 + 3] = hue;
    }
    state.x = x; state.y = y;
    return out;
}

function chaosGameOrbit(state, N, params) {
    const n = Math.max(3, Math.min(7, Math.floor(params.n ?? 5)));
    const k = Math.max(0, Math.min(3, Math.floor(params.k ?? 2)));
    const r = params.r ?? 0.5;
    const phase = params.phase ?? 0.0;
    const bright = params.brightness ?? 0.06;
    const hue    = params.hue        ?? 0.5;
    const scale  = params.scale      ?? 0.92;
    let x = state.x ?? 0;
    let y = state.y ?? 0;
    // Vertex history for restriction rules: last three vertex indices.
    let h0 = state.h0 ?? 99, h1 = state.h1 ?? 98, h2 = state.h2 ?? 97;
    // Pre-compute vertex positions for this batch's n + phase.
    const vx = new Float32Array(n), vy = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const ang = i * 2 * Math.PI / n + phase + Math.PI / 2;
        vx[i] = Math.cos(ang); vy[i] = Math.sin(ang);
    }
    // Burn-in once.
    if (!state.burned) {
        for (let i = 0; i < 80; i++) {
            const v = pickChaosVertex(n, k, h0, h1, h2);
            x = x + r * (vx[v] - x);
            y = y + r * (vy[v] - y);
            h2 = h1; h1 = h0; h0 = v;
        }
        state.burned = true;
    }
    const out = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
        const v = pickChaosVertex(n, k, h0, h1, h2);
        x = x + r * (vx[v] - x);
        y = y + r * (vy[v] - y);
        h2 = h1; h1 = h0; h0 = v;
        out[i*4 + 0] = x * scale;
        out[i*4 + 1] = y * scale;
        out[i*4 + 2] = bright;
        out[i*4 + 3] = hue;
    }
    state.x = x; state.y = y;
    state.h0 = h0; state.h1 = h1; state.h2 = h2;
    return out;
}

function pickChaosVertex(n, k, h0, h1, h2) {
    let v = Math.floor(Math.random() * n);
    if (k >= 1) {
        let guard = 8;
        while (v === h0 && guard-- > 0) v = Math.floor(Math.random() * n);
    }
    let equalRun = false;
    if (k >= 3) equalRun = (h0 === h1 && h1 === h2);
    else if (k >= 2) equalRun = (h0 === h1);
    if (equalRun) {
        let guard = 8;
        while (guard-- > 0) {
            const dist = Math.abs(v - h0);
            const wrap = ((v + 1) % n === h0) || ((h0 + 1) % n === v);
            if (dist !== 1 && !wrap) break;
            v = Math.floor(Math.random() * n);
        }
    }
    return v;
}

const ORBIT_FNS = {
    clifford:     cliffordOrbit,
    'chaos-game': chaosGameOrbit,
};

// Flash-budget tracking — see brainstorming/techniques/music-to-shader.md
// §"Flash budget". Pieces should not exceed 4 luminance flashes per bar
// across all layers. Classify a driver-bound uniform as flash-shaped if its
// name matches the regex OR if the layer's meta.yaml declares { flash: true }
// for that uniform. Per frame: detect rising-edge crossings of
// FLASH_RISING_THRESHOLD; accumulate per bar; warn on rollover when total >
// FLASH_BUDGET_PER_BAR. Only active when audio.analysis.json is loaded
// (otherwise no real bar grid).
const FLASH_NAME_RE = /(flash|strobe|brightness|exposure|bloom)/i;
const FLASH_RISING_THRESHOLD = 0.5;
const FLASH_BUDGET_PER_BAR = 4;
let flashBudgetBar = -1;
const flashBudgetCounts = new Map();   // key: "layer.uniform" → count this bar
const flashBudgetPrev   = new Map();   // key: "layer.uniform" → prev frame value

const FORMAT_MAP = {
  rgba8:   () => ({ iFormat: gl.RGBA8,   format: gl.RGBA, type: gl.UNSIGNED_BYTE }),
  rgba16f: () => ({ iFormat: gl.RGBA16F, format: gl.RGBA, type: gl.HALF_FLOAT }),
  rgba32f: () => ({ iFormat: gl.RGBA32F, format: gl.RGBA, type: gl.FLOAT }),
};

let currentProgram = null;
let currentUniforms = {};
let currentPipeline = null;
let currentLayerEngine = null;  // set when meta.yaml has a `layers:` array
let currentSlug = null;
let currentMeta = null;
let currentMtime = 0;
// Song-level audio analysis (audio.analysis.json). null = piece has no
// analysis; runtime falls back to FFT-only audio. Replaced on piece load.
let currentAnalysis = null;
let analysisSampleState = audioAnalysis.createSampleState();
let lastAnalysisSampleT = performance.now();
// Cached once per frame at the top of render() so that multi-layer pieces
// see consistent values across all their layers (and the accumulator
// compositor) within one frame.
let currentAnalysisSample = audioAnalysis.sample(null, 0, analysisSampleState, 0);
let startTime = performance.now();
let frameCount = 0;
let mouse = [0, 0];
let catalog = [];
// Latest critic verdict per slug (/api/critic-summary), fetched when the
// catalog opens. Backs the verdict chips and the grades overlay.
let criticSummary = {};
let hudOn = true;
let renderScale = 1.0;
let fpsSamples = [];
let lastFrameT = performance.now();
let userOverride = false;
// Lifted to module-scope so top-level await → attachAudio() can safely
// reference it during boot without hitting TDZ.
let autoplayArmed = false;
let autoplayKickFn = null;

// Billiard-ball sim: 4 elastic disks passed to shaders via
// `uniform vec2 u_ball_pos[4]` and `uniform float u_ball_hit[4]`. Physics +
// packing live in studio/billiards.mjs; shader primitives in lib/billiards.glsl.
// Collision radius MUST equal the shader-side disk radius.
const billiards = createBilliards({ radius: 0.26, boundsMargin: 0.96 });

// Unified gesture state — consumed in render() for u_mouse / u_zoom / u_pan /
// u_tap_pulse. Created early so resize() can update refSize on every call.
const gestures = createGestureTracker({ refSize: 1 });
let tapPulse = 0;  // decays in render(); set to 1 on tap
let programUsesZoom = false;  // wheel-zoom gate; set on every swapProgram/swapPipeline

// Audio plumbing — created lazily on first user gesture.
let audioEl        = null;
let audioCtx       = null;
// Lazily created when a piece declares keyboard_synth: true. Pieces without
// the flag never instantiate the synth — the chord of zero envelopes still
// reaches the shader's u_keys uniform as zeros.
let keyboardSynth  = null;
// 15 entries: 9 white keys (a..l) + 6 black keys (w e t y u o). Matches
// keyboard-music.mjs's KEY_ORDER length.
const ZERO_KEYS = new Float32Array(15);

// Multi-touch uniform buffer — up to 8 simultaneous fingers. Layout per slot:
// (xy = pixel coords in target space, z = age in seconds, w = active 1.0/0.0).
// On desktop the live mouse becomes touch[0] when the cursor is over the canvas
// so single-finger pieces "just work" without input-mode forks.
const MAX_TOUCHES = 8;
const TOUCHES_BUF = new Float32Array(MAX_TOUCHES * 4);
let touchCount = 0;
let audioSource    = null;
let audioAnalyser  = null;
let audioFreqData  = null;
let audioBands     = { level: 0, bass: 0, mid: 0, high: 0 };
// Per-band transient state — short-running "now" envelope vs. slow-running
// baseline. When now >> baseline, fire a kick/snare/cymbal pulse that decays
// quickly. Gives pieces sharp, beat-locked events instead of smoothed RMS.
let audioOnsets = {
  bass:   { short: 0, long: 0, pulse: 0 },
  mid:    { short: 0, long: 0, pulse: 0 },
  high:   { short: 0, long: 0, pulse: 0 },
};
let audioPlaying   = false;
let audioKey       = null;   // `${slug}:${filename}` to detect piece changes

// Live-capture state — attached when meta.audio === 'live'.
let liveStream        = null;   // MediaStream from getUserMedia
let liveStreamSource  = null;   // MediaStreamAudioSourceNode
let liveStartTime     = 0;      // performance.now() when stream connected
let attachedDeviceId  = null;   // deviceId of the active track

resize();
window.addEventListener('resize', resize);

// Mobile browsers resize the visual viewport independently of window when
// URL bar hides/shows or the soft keyboard appears. Listen to both.
if (window.visualViewport) {
  let rafId = 0;
  window.visualViewport.addEventListener('resize', () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => { rafId = 0; resize(); });
  });
}

const quad = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quad);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

document.body.classList.add('active');

// u_mouse always tracks the cursor — hover on desktop, finger drag on touch.
// Pointer events fire for both; the gesture tracker only sees pointers after
// pointerdown (needed for tap/swipe/pinch classification), while the direct
// mouse update below keeps the "cursor is always an instrument" contract for
// desktop hover.
window.addEventListener('pointermove', (e) => {
  mouse = [e.clientX, canvas.clientHeight - e.clientY];
  wakeOverlays();
});

let desktopPanOrigin = null;  // { startX, startY, panAtStart } when shift-drag active

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  if (e.pointerType === 'mouse' && e.shiftKey) {
    desktopPanOrigin = {
      startX:     e.clientX,
      startY:     e.clientY,
      panAtStart: gestures.getPan(),
    };
    return;
  }
  gestures.addPointer(e.pointerId, e.clientX, e.clientY, e.timeStamp);
  mouse = [e.clientX, canvas.clientHeight - e.clientY];
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
});

function endCanvasPointer(e) {
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

canvas.addEventListener('pointerup',     endCanvasPointer);
canvas.addEventListener('pointercancel', endCanvasPointer);

canvas.addEventListener('wheel', (e) => {
  if (!programUsesZoom) return;
  if (catalogEl && !catalogEl.classList.contains('hidden')) return;
  e.preventDefault();
  // Negative deltaY = scroll up = zoom in. Exponential so response feels
  // linear in perceived scale.
  const factor = Math.exp(-e.deltaY * 0.001);
  gestures.setZoom(gestures.getZoom() * factor);
}, { passive: false });

function pieceWantsKeyboardSynth() {
  return currentMeta?.keyboard_synth === true;
}

function ensureKeyboardSynth() {
  if (keyboardSynth) return keyboardSynth;
  if (!audioCtx) {
    const Ctx = window.AudioContext ?? window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  keyboardSynth = createKeyboardSynth(audioCtx);
  // Honour meta.yaml's `default_instrument` (organ | pluck | pad | bell | chip)
  // so a piece can boot in a voice that suits its mood without the player
  // having to press 1..5 first.
  const wantedInstrument = currentMeta?.default_instrument;
  if (wantedInstrument) keyboardSynth.setInstrument(wantedInstrument);
  return keyboardSynth;
}

// ---------- keyboard shortcuts: registry + '?' overlay + debug HUD ----------
// ONE table drives the '?' overlay. CONTRACT: when you bind a new key in the
// keydown handler below (or in keyboard-music.mjs), ADD A ROW HERE — the
// overlay renders straight from this list, so the manual maintains itself.
const SHORTCUTS = [
  { keys: '?',         scope: 'studio', desc: 'show / hide this shortcut list' },
  { keys: 'space',     scope: 'studio', desc: 'play / pause the track' },
  { keys: '← →',       scope: 'studio', desc: 'previous / next piece (or lightbox image)' },
  { keys: 'c',         scope: 'studio', desc: 'catalog' },
  { keys: 'v · V',     scope: 'studio', desc: 'critic grades: this piece · all pieces' },
  { keys: 'h',         scope: 'studio', desc: 'toggle HUD' },
  { keys: 'Shift+H',   scope: 'studio', desc: 'synth controls panel' },
  { keys: 'Shift+D',   scope: 'studio', desc: 'debug HUD — click the timecode to copy it' },
  { keys: 'r',         scope: 'studio', desc: 'restart wall-clock time' },
  { keys: 'Esc',       scope: 'studio', desc: 'close overlays' },
  { keys: 'a s d f g h j k l', scope: 'synth pieces', desc: 'white piano keys (also drive the visuals)' },
  { keys: 'w e t y u o',       scope: 'synth pieces', desc: 'black piano keys' },
  { keys: 'z · x',     scope: 'synth pieces', desc: 'octave down · up' },
  { keys: '1…5',       scope: 'synth pieces', desc: 'instrument: organ / pluck / pad / bell / chip' },
  { keys: '[ · ]',     scope: 'synth pieces', desc: 'looper: record-play-overdub cycle · clear' },
];

let shortcutsEl = null;
function toggleShortcuts(force) {
  if (!shortcutsEl) {
    shortcutsEl = document.createElement('div');
    shortcutsEl.id = 'shortcuts';
    shortcutsEl.style.cssText =
      'position:fixed;inset:0;z-index:60;display:flex;align-items:center;' +
      'justify-content:center;background:rgba(4,8,14,0.82);backdrop-filter:blur(4px);' +
      'font:13px/1.7 ui-monospace,monospace;color:#cfe3ee;cursor:pointer;';
    // innerHTML is safe here: every string interpolated below comes from
    // the static SHORTCUTS literals above — no user or network input.
    let rows = '';
    let lastScope = '';
    for (const s of SHORTCUTS) {
      if (s.scope !== lastScope) {
        rows += `<div style="margin-top:12px;color:#7da3b8;text-transform:uppercase;font-size:11px;letter-spacing:0.12em">${s.scope}</div>`;
        lastScope = s.scope;
      }
      rows += `<div style="display:flex;gap:16px"><span style="min-width:150px;color:#ffd9a0">${s.keys}</span><span>${s.desc}</span></div>`;
    }
    shortcutsEl.innerHTML =
      `<div style="max-width:560px;padding:28px 34px;border:1px solid #1d3a4d;border-radius:10px;background:rgba(7,14,22,0.96)">
        <div style="font-size:15px;color:#fff;margin-bottom:4px">keyboard</div>${rows}
        <div style="margin-top:14px;color:#5d7d92">press ? or Esc to close</div>
      </div>`;
    shortcutsEl.addEventListener('click', () => toggleShortcuts(false));
    document.body.appendChild(shortcutsEl);
    shortcutsEl.style.display = 'none';
  }
  const show = force !== undefined ? force : shortcutsEl.style.display === 'none';
  shortcutsEl.style.display = show ? 'flex' : 'none';
}
function shortcutsOpen() { return !!shortcutsEl && shortcutsEl.style.display !== 'none'; }

// Debug HUD: always-visible timecode for precise feedback. Click → copies
// "m:ss.t (t=SS.SS)" to the clipboard.
let debugEl = null;
let debugOpen = false;
function toggleDebugHud() {
  debugOpen = !debugOpen;
  if (!debugEl) {
    debugEl = document.createElement('div');
    debugEl.id = 'debug-hud';
    debugEl.style.cssText =
      'position:fixed;top:10px;right:12px;z-index:55;padding:6px 10px;' +
      'font:12px/1.5 ui-monospace,monospace;color:#ffd9a0;cursor:copy;' +
      'background:rgba(7,14,22,0.85);border:1px solid #1d3a4d;border-radius:6px;';
    debugEl.title = 'click to copy the timecode';
    debugEl.addEventListener('click', () => {
      const tc = debugEl.dataset.timecode ?? '';
      navigator.clipboard?.writeText(tc).then(() => {
        debugEl.style.borderColor = '#ffd9a0';
        setTimeout(() => { debugEl.style.borderColor = '#1d3a4d'; }, 350);
      }).catch(() => {});
    });
    document.body.appendChild(debugEl);
  }
  debugEl.style.display = debugOpen ? 'block' : 'none';
}
function updateDebugHud(audioT) {
  if (!debugOpen || !debugEl) return;
  const m = Math.floor(audioT / 60);
  const s = (audioT - m * 60).toFixed(1).padStart(4, '0');
  const tc = `${m}:${s} (t=${audioT.toFixed(2)})`;
  debugEl.dataset.timecode = tc;
  debugEl.textContent = `${currentMeta?.slug ?? ''}  ${tc}`;
}

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;  // ignore OS auto-repeat — synth treats hold as one press
  // '?' — shortcut overlay; Shift+D — debug HUD. Both above the synth path
  // (they need Shift, which the synth path already excludes).
  if (e.key === '?') { toggleShortcuts(); e.preventDefault(); return; }
  if (e.key === 'D' || (e.key === 'd' && e.shiftKey)) { toggleDebugHud(); e.preventDefault(); return; }
  // Piano-on-keyboard shortcut path. Active only when the current piece
  // declares keyboard_synth: true. Lowercase a..l with no modifier keys
  // strikes a note; suppresses the existing h/c single-letter shortcuts
  // (HUD/catalog) for those pieces. Other shortcuts still work.
  // Shift+H — full controls panel. Highest priority so it works on any piece.
  if ((e.key === 'H' || (e.key === 'h' && e.shiftKey))) {
    toggleHelpPanel();
    e.preventDefault();
    return;
  }

  if (pieceWantsKeyboardSynth() && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
    const synth = ensureKeyboardSynth();
    if (synth) {
      // z / x — octave shift down/up by 12 semitones.
      if (e.key === 'z') { synth.shiftOctave(-12); refreshHelpState(); e.preventDefault(); return; }
      if (e.key === 'x') { synth.shiftOctave(+12); refreshHelpState(); e.preventDefault(); return; }
      // 1/2/3/4 — instrument preset.
      if (e.key === '1') { synth.setInstrument('organ'); refreshHelpState(); e.preventDefault(); return; }
      if (e.key === '2') { synth.setInstrument('pluck'); refreshHelpState(); e.preventDefault(); return; }
      if (e.key === '3') { synth.setInstrument('pad');   refreshHelpState(); e.preventDefault(); return; }
      if (e.key === '4') { synth.setInstrument('bell');  refreshHelpState(); e.preventDefault(); return; }
      if (e.key === '5') { synth.setInstrument('chip');  refreshHelpState(); e.preventDefault(); return; }
      // Looper: [ cycles state, ] clears.
      if (e.key === '[') { synth.toggleLooper(); refreshHelpState(); e.preventDefault(); return; }
      if (e.key === ']') { synth.clearLooper();  refreshHelpState(); e.preventDefault(); return; }
      // Note key (white or black).
      if (synth.keyToMidi[e.key] !== undefined) {
        synth.startNote(e.key);
        e.preventDefault();
        return;
      }
    }
  }
  if (e.key === 'ArrowRight') { lightboxOpen() ? lightboxStep(+1) : cycle(+1); e.preventDefault(); }
  else if (e.key === 'ArrowLeft') { lightboxOpen() ? lightboxStep(-1) : cycle(-1); e.preventDefault(); }
  else if (e.key === 'r' || e.key === 'R') startTime = performance.now();
  else if (e.key === 'h') toggleHud();
  else if (e.key === 'c' || e.key === 'C') toggleCatalog();
  else if (e.key === 'v') toggleGrades();        // critic grades, current piece
  else if (e.key === 'V') toggleAllGrades();     // critic grades, every piece
  else if (e.key === 'Escape') {
    if (shortcutsOpen()) toggleShortcuts(false);
    else if (lightboxOpen()) closeLightbox();
    else if (gradesOpen()) closeGrades();
    else { closeCatalog(); closeHelpPanel(); }
  }
  else if (e.key === ' ') {
    // Always preventDefault so space never scrolls the page, even during the
    // boot window where audioEl hasn't attached yet. The browser's sticky
    // user-activation from this keypress stays valid for ~5s, so attachAudio's
    // own tryAutoplay() will cash it in when it runs.
    e.preventDefault();
    if (audioEl) toggleAudio();
  }
});

// Mirror keyup so notes can be released. Only relevant when the piece
// declares keyboard_synth; otherwise we never started a note in the first
// place.
window.addEventListener('keyup', (e) => {
  if (!keyboardSynth) return;
  if (keyboardSynth.keyToMidi[e.key] !== undefined) {
    keyboardSynth.releaseNote(e.key);
  }
});

// Install first-gesture autoplay listeners NOW, not later inside attachAudio.
// attachAudio is awaited during boot, so without this, a space press during
// boot falls on the floor: no listeners yet, and the command handler above
// sees audioEl === null. Installing early means sticky activation is in play
// by the time attachAudio's own tryAutoplay() runs.
armFirstGestureAutoplay();

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

// Devtools-callable introspection — type __vj_audio() in the console to
// see what the live-audio path is actually doing.
window.__vj_audio = () => ({
  audioKey,
  audioPlaying,
  ctxState:        audioCtx?.state ?? null,
  hasLiveStream:   !!liveStream,
  hasStreamSource: !!liveStreamSource,
  tracks: liveStream?.getAudioTracks().map((t) => ({
    label:    t.label,
    enabled:  t.enabled,
    muted:    t.muted,
    state:    t.readyState,
    settings: t.getSettings(),
  })) ?? [],
  bands:  { ...audioBands },
  onsets: {
    bass:  audioOnsets.bass.pulse,
    mid:   audioOnsets.mid.pulse,
    high:  audioOnsets.high.pulse,
  },
});

// Initial boot and poll loops
await refreshCatalog();
await loadCurrent({ initial: true });
render();
setInterval(() => pollForChanges().catch((err) => console.warn('[poll]', err)), POLL_MS);

if (RECORD_MODE) exposeRecordingHooks();

// ---------- rendering ----------

function render() {
  const t0 = performance.now();
  const dt = t0 - lastFrameT;
  lastFrameT = t0;
  fpsSamples.push(dt);
  if (fpsSamples.length > 60) fpsSamples.shift();
  if ((frameCount & 15) === 0 && fpsEl) {
    const avg = fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length;
    let line = `${Math.round(1000 / avg)} fps`;
    if (liveStream) {
      const ctxState = audioCtx?.state ?? '?';
      line += ` · ${ctxState} · L ${audioBands.level.toFixed(2)} B ${audioBands.bass.toFixed(2)} M ${audioBands.mid.toFixed(2)} H ${audioBands.high.toFixed(2)}`;
    }
    fpsEl.textContent = line;
  }

  // If the piece is audio-driven and audio is ACTUALLY PLAYING, advance
  // u_time from the audio clock so visuals reproduce against the track.
  // A user pause MID-TRACK pins u_time to the paused audioEl.currentTime:
  // the visual freezes on the current frame and resumes in sync (switching
  // to the wall clock here made the image jump to an unrelated timestamp
  // and keep animating — the bug Louis reported 2026-06-11). Only true
  // idle — track never started or already ended — falls back to the wall
  // clock so the piece still self-plays in the gallery.
  // Song-level uniforms (u_audio_time, u_section_progress, u_downbeat, ...)
  // still sample from audioEl.currentTime via audio-analysis.mjs, so audio-
  // event sync is preserved when playback resumes.
  const pausedMidTrack = audioEl && !audioPlaying && !audioEl.ended
                      && audioEl.currentTime > 0.001;
  const useAudioTime = currentMeta?.audio
                    && (currentMeta?.time_source ?? 'audio') === 'audio'
                    && audioEl
                    && (audioPlaying || pausedMidTrack);
  const now = useAudioTime
    ? audioEl.currentTime
    : (performance.now() - startTime) / 1000;

  sampleAudio();
  tapPulse *= 0.85;
  if (tapPulse < 1e-4) tapPulse = 0;
  updateAudioUi();
  const ballAspect = (canvas.clientWidth || 1) / Math.max(canvas.clientHeight, 1);
  billiards.step(now, ballAspect);

  // Sample analysis once per frame so multi-layer pieces see consistent
  // song-level uniforms across all their layers within a frame.
  const audioTNow = audioEl ? audioEl.currentTime
                  : liveStream ? now
                  : 0.0;
  updateDebugHud(audioTNow);
  const nowMs = performance.now();
  const dtAnalysis = Math.max(0, (nowMs - lastAnalysisSampleT) / 1000);
  lastAnalysisSampleT = nowMs;
  currentAnalysisSample = audioAnalysis.sample(currentAnalysis, audioTNow, analysisSampleState, dtAnalysis);

  if (currentLayerEngine) {
    runLayerEngine(currentLayerEngine, now, currentAnalysisSample);
  } else if (currentPipeline) {
    // Multi-pass: each pass owns its own target; the last pass is typically
    // target: screen. We only clear the screen once per frame (before the
    // final on-screen pass renders). Off-screen FBOs are not cleared — sim
    // passes blend state forward, so clearing would erase them.
    let screenCleared = false;
    for (const pass of currentPipeline.passes) {
      if (pass.target.type === 'screen' && !screenCleared) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        screenCleared = true;
      }
      for (let i = 0; i < pass.iterations; i++) {
        runPass(pass, currentPipeline, now);
      }
    }
  } else if (currentProgram) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    currentUniforms ??= {};
    gl.useProgram(currentProgram);
    bindQuadAttrib(currentProgram);
    setStandardUniforms(gl.drawingBufferWidth, gl.drawingBufferHeight, now);
    for (const u of currentMeta?.uniforms ?? []) applyCustomUniform(u);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  frameCount++;
  requestAnimationFrame(render);
}

function setUniform1f(name, v) {
  const loc = currentUniforms[name] ??= gl.getUniformLocation(currentProgram, name);
  if (loc !== null) gl.uniform1f(loc, v);
}
function setUniform2f(name, a, b) {
  const loc = currentUniforms[name] ??= gl.getUniformLocation(currentProgram, name);
  if (loc !== null) gl.uniform2f(loc, a, b);
}
function setUniform1i(name, v) {
  const loc = currentUniforms[name] ??= gl.getUniformLocation(currentProgram, name);
  if (loc !== null) gl.uniform1i(loc, v);
}
function setUniform1fv(name, arr) {
  const loc = currentUniforms[name] ??= gl.getUniformLocation(currentProgram, name);
  if (loc !== null) gl.uniform1fv(loc, arr);
}
function setUniform2fv(name, arr) {
  const loc = currentUniforms[name] ??= gl.getUniformLocation(currentProgram, name);
  if (loc !== null) gl.uniform2fv(loc, arr);
}
function setUniform4fv(name, arr) {
  const loc = currentUniforms[name] ??= gl.getUniformLocation(currentProgram, name);
  if (loc !== null) gl.uniform4fv(loc, arr);
}

function applyCustomUniform(u) {
  const loc = currentUniforms[u.name] ??= gl.getUniformLocation(currentProgram, u.name);
  if (loc === null || loc === undefined) return;
  const v = u.default;
  if (u.type === 'float')          gl.uniform1f(loc, Number(v ?? 0));
  else if (u.type === 'vec2')      gl.uniform2fv(loc, arr(v, 2));
  else if (u.type === 'vec3')      gl.uniform3fv(loc, arr(v, 3));
  else if (u.type === 'vec4')      gl.uniform4fv(loc, arr(v, 4));
  else if (u.type === 'int')       gl.uniform1i(loc, Number(v ?? 0));
}

function arr(v, n) {
  const out = new Float32Array(n);
  if (Array.isArray(v)) for (let i = 0; i < n; i++) out[i] = Number(v[i] ?? 0);
  return out;
}

// ---------- shader compilation ----------

function compileShader(type, source) {
  const s = gl.createShader(type);
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    // Log the offending source to console as a diagnostic aid — info logs are
    // sometimes empty when context is lost or the driver chokes silently.
    console.error('[compileShader] shader source that failed:\n' + source.split('\n').map((l, i) => `${i + 1}: ${l}`).join('\n'));
    console.error('[compileShader] info log:', JSON.stringify(log));
    gl.deleteShader(s);
    throw new Error(log || 'shader compile failed (empty info log; check console for source)');
  }
  return s;
}

function hoistVersion(src) {
  const m = src.match(/^[ \t]*#version[^\n]*\n/m);
  if (!m || src.startsWith(m[0])) return src;
  return m[0] + src.replace(m[0], '');
}

// Client-side #include resolver. Pieces can `#include "noise.glsl"` to pull in
// a module from lib/, served by the studio at /api/lib/<name>. Each file is
// inlined at most once per compile (second hits become marker comments); nested
// includes are followed up to depth 4. libCache persists across compiles; it's
// cleared on each piece load so edits to lib/*.glsl are picked up.
// (INCLUDE_RE and libCache are declared near the top of the file so that
// clearLibCache can be called before this block runs during initial load.)

function clearLibCache() { libCache = new Map(); }

async function fetchLibFile(name) {
  if (libCache.has(name)) return libCache.get(name);
  const res = await fetch(`/api/lib/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error(`#include "${name}": HTTP ${res.status}`);
  const text = await res.text();
  libCache.set(name, text);
  return text;
}

async function resolveIncludes(src, depth = 0, alreadyIncluded = new Set()) {
  if (depth > 4) throw new Error('#include nesting depth exceeded (max 4)');
  INCLUDE_RE.lastIndex = 0;
  const matches = [...src.matchAll(INCLUDE_RE)];
  if (matches.length === 0) return src;

  let out = '';
  let lastEnd = 0;
  for (const m of matches) {
    const name = m[1];
    out += src.slice(lastEnd, m.index);
    if (alreadyIncluded.has(name)) {
      out += `// #include "${name}" already resolved above\n`;
    } else {
      alreadyIncluded.add(name);
      const body = await fetchLibFile(name);
      const resolved = await resolveIncludes(body, depth + 1, alreadyIncluded);
      out += `// ---- begin #include "${name}" ----\n`;
      out += resolved;
      if (!resolved.endsWith('\n')) out += '\n';
      out += `// ---- end #include "${name}" ----\n`;
    }
    lastEnd = m.index + m[0].length;
  }
  out += src.slice(lastEnd);
  return out;
}

// hoistVersion first so a #version directive below ABOUTME comments lands at
// line 1, then resolve includes — their bodies are appended after #version
// where they're legal. Callers await this before buildProgram.
async function preprocessShader(src) {
  return resolveIncludes(hoistVersion(src));
}

function buildProgram(fragSource) {
  const vs = compileShader(gl.VERTEX_SHADER, VERT);
  const fs = compileShader(gl.FRAGMENT_SHADER, fragSource);
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.bindAttribLocation(p, 0, 'a_pos');
  gl.linkProgram(p);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(p);
    gl.deleteProgram(p);
    throw new Error(log || 'program link failed');
  }
  return p;
}

function swapProgram(prog) {
  freePipeline(currentPipeline);
  freeLayerEngine(currentLayerEngine);
  currentPipeline = null;
  currentLayerEngine = null;
  if (currentProgram) gl.deleteProgram(currentProgram);
  currentProgram = prog;
  currentUniforms = {};
  programUsesZoom = gl.getUniformLocation(prog, 'u_zoom') !== null;
  startTime = performance.now();
}

function swapPipeline(pipeline) {
  freePipeline(currentPipeline);
  freeLayerEngine(currentLayerEngine);
  currentLayerEngine = null;
  if (currentProgram) gl.deleteProgram(currentProgram);
  currentProgram = null;
  currentUniforms = {};
  currentPipeline = pipeline;
  programUsesZoom = pipeline.passes.some(
    (p) => gl.getUniformLocation(p.program, 'u_zoom') !== null,
  );
  startTime = performance.now();
}

// ---------- multi-pass pipeline ----------
//
// A pipeline is the runtime form of meta.yaml's `passes:` array: for each
// pass, we hold its compiled program, its render target (screen OR a pair of
// ping-pong FBOs, OR a single off-screen FBO), and its input bindings. The
// pipeline runs once per frame; each ping-pong pass swaps read/write after
// drawing so the next iteration/frame reads what was just written.

function parseTargetSpec(spec) {
  // Accepts: undefined (defaults to screen), 'screen', or an object with
  // { format, ping_pong, scale }.
  if (!spec || spec === 'screen') return { type: 'screen' };
  const formatName = spec.format ?? 'rgba8';
  if (!FORMAT_MAP[formatName]) throw new Error(`unsupported target format: ${formatName}`);
  const scale = Number.isFinite(spec.scale) ? spec.scale : 1.0;
  if (scale <= 0 || scale > 2) throw new Error(`target scale out of range: ${scale}`);
  return {
    type:     spec.ping_pong ? 'ping_pong' : 'single',
    format:   formatName,
    scale,
    width:  0, height: 0,   // filled in by allocTarget
    textures: [], fbos: [], readIdx: 0,
  };
}

function targetPixelSize(spec) {
  const w = Math.max(1, Math.floor(gl.drawingBufferWidth  * spec.scale));
  const h = Math.max(1, Math.floor(gl.drawingBufferHeight * spec.scale));
  return [w, h];
}

function allocTexAndFbo(w, h, formatName) {
  if (formatName !== 'rgba8' && !extColorFloat) {
    throw new Error(`target format ${formatName} requires EXT_color_buffer_float`);
  }
  const { iFormat, format, type } = FORMAT_MAP[formatName]();
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, iFormat, w, h, 0, format, type, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    gl.deleteTexture(tex);
    gl.deleteFramebuffer(fbo);
    throw new Error(`framebuffer incomplete (status ${status}) for format ${formatName}`);
  }
  return { tex, fbo };
}

function allocTarget(spec) {
  if (spec.type === 'screen') return spec;
  const [w, h] = targetPixelSize(spec);
  spec.width  = w;
  spec.height = h;
  const count = spec.type === 'ping_pong' ? 2 : 1;
  spec.textures = [];
  spec.fbos = [];
  for (let i = 0; i < count; i++) {
    const { tex, fbo } = allocTexAndFbo(w, h, spec.format);
    spec.textures.push(tex);
    spec.fbos.push(fbo);
  }
  spec.readIdx = 0;
  return spec;
}

function freeTarget(spec) {
  if (!spec || spec.type === 'screen') return;
  for (const t of spec.textures) gl.deleteTexture(t);
  for (const f of spec.fbos)     gl.deleteFramebuffer(f);
  spec.textures = [];
  spec.fbos = [];
}

function freePipeline(pipeline) {
  if (!pipeline) return;
  for (const pass of pipeline.passes) {
    if (pass.program) gl.deleteProgram(pass.program);
    if (pass.decayProgram) gl.deleteProgram(pass.decayProgram);
    if (pass.vbo) gl.deleteBuffer(pass.vbo);
    freeTarget(pass.target);
  }
}

async function buildPipeline(slug, passSpecs) {
  const passes = [];
  try {
    for (const p of passSpecs) {
      if (typeof p.name !== 'string' || !p.name) throw new Error('pass.name required');
      if (p.kind === 'scatter') {
        // Scatter pass — built-in vertex + fragment, CPU orbit source.
        const orbitName = p.orbit;
        if (!ORBIT_FNS[orbitName]) {
          throw new Error(`pass "${p.name}": unknown orbit "${orbitName}" (have: ${Object.keys(ORBIT_FNS).join(',')})`);
        }
        const points = Math.max(1, Math.min(1 << 18, Math.floor(Number(p.points ?? 4096))));
        const program = buildScatterProgram();
        const decayProgram = buildDecayProgram();
        const target = allocTarget(parseTargetSpec(p.target));
        if (target.type !== 'ping_pong') {
          throw new Error(`pass "${p.name}": scatter pass requires ping_pong target`);
        }
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, points * 4 * 4, gl.DYNAMIC_DRAW);
        passes.push({
          name: p.name,
          kind: 'scatter',
          program,
          decayProgram,
          uniforms: {},
          decayUniforms: {},
          target,
          inputs: (p.inputs && typeof p.inputs === 'object') ? p.inputs : {},
          iterations: 1,
          orbit:    orbitName,
          orbitState: {},
          orbitParams: { ...(p.params ?? {}) },
          points,
          decay: Number(p.decay ?? 0.96),
          pointSize: Number(p.point_size ?? 2.5),
          vbo: buf,
        });
        continue;
      }
      // Regular fragment-only pass.
      if (typeof p.shader !== 'string' || !p.shader.endsWith('.frag')) {
        throw new Error(`pass "${p.name}": shader must be a .frag filename`);
      }
      const fragUrl = `/api/pieces/${encodeURIComponent(slug)}/pass/${encodeURIComponent(p.shader)}`;
      const res = await fetch(fragUrl);
      if (!res.ok) throw new Error(`pass "${p.name}": cannot fetch ${p.shader} (HTTP ${res.status})`);
      const fragText = await preprocessShader(await res.text());
      const program = buildProgram(fragText);
      const target = allocTarget(parseTargetSpec(p.target));
      passes.push({
        name: p.name,
        program,
        uniforms: {},
        target,
        inputs: (p.inputs && typeof p.inputs === 'object') ? p.inputs : {},
        iterations: Math.max(1, Math.floor(Number(p.iterations ?? 1))),
      });
    }
  } catch (err) {
    // Free whatever was allocated before the failure so a bad pass spec doesn't
    // leak GL resources. Re-throw for the caller's error UI.
    freePipeline({ passes });
    throw err;
  }
  const passByName = {};
  for (const pass of passes) passByName[pass.name] = pass;
  return { passes, passByName };
}

function buildScatterProgram() {
    const vs = compileShader(gl.VERTEX_SHADER, SCATTER_VERT);
    const fs = compileShader(gl.FRAGMENT_SHADER, SCATTER_FRAG);
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.bindAttribLocation(p, 0, 'a_pt');
    gl.linkProgram(p);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(p);
        gl.deleteProgram(p);
        throw new Error('scatter program link failed: ' + log);
    }
    return p;
}

function buildDecayProgram() {
    return buildProgram(DECAY_FRAG);
}

function reallocPipelineTargets(pipeline) {
  // Canvas size changed; blow away and re-alloc all off-screen targets. State
  // is lost, which for v1 is acceptable (simulations re-initialize on the next
  // u_frame == 0 frame — pieces that want state preserved across resize can
  // detect resize and restart, or we add blit-preserving alloc later).
  if (!pipeline) return;
  for (const pass of pipeline.passes) {
    if (pass.target.type === 'screen') continue;
    freeTarget(pass.target);
    allocTarget(pass.target);
  }
  // Reset frame counter so initialization paths re-run with fresh state.
  startTime = performance.now();
}

function bindPassTarget(pass) {
  if (pass.target.type === 'screen') {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  } else {
    // Write to whichever texture is NOT currently being read.
    const writeIdx = pass.target.type === 'ping_pong' ? (1 - pass.target.readIdx) : 0;
    gl.bindFramebuffer(gl.FRAMEBUFFER, pass.target.fbos[writeIdx]);
    gl.viewport(0, 0, pass.target.width, pass.target.height);
  }
}

function bindPassInputs(pass, pipeline) {
  let unit = 0;
  for (const [samplerName, sourcePassName] of Object.entries(pass.inputs)) {
    const src = pipeline.passByName[sourcePassName];
    if (!src || src.target.type === 'screen') continue;
    // Bind the currently-read texture — for a ping-pong pass reading itself,
    // that's the previous iteration's output; for a cross-pass read, it's the
    // last thing the source pass wrote this frame.
    const tex = src.target.textures[src.target.readIdx];
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const loc = pass.uniforms[samplerName] ??= gl.getUniformLocation(pass.program, samplerName);
    if (loc !== null) gl.uniform1i(loc, unit);
    unit++;
  }
}

function passViewport(pass) {
  if (pass.target.type === 'screen') {
    return [gl.drawingBufferWidth, gl.drawingBufferHeight];
  }
  return [pass.target.width, pass.target.height];
}

function runPass(pass, pipeline, now) {
  if (pass.kind === 'scatter') { runScatterPass(pass, pipeline, now); return; }
  bindPassTarget(pass);
  currentProgram = pass.program;
  currentUniforms = pass.uniforms;
  gl.useProgram(pass.program);
  bindQuadAttrib(pass.program);
  const [vw, vh] = passViewport(pass);
  setStandardUniforms(vw, vh, now);
  bindPassInputs(pass, pipeline);
  for (const u of currentMeta?.uniforms ?? []) applyCustomUniform(u);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  if (pass.target.type === 'ping_pong') {
    pass.target.readIdx = 1 - pass.target.readIdx;
  }
}

function runScatterPass(pass, pipeline, now) {
    // Two GL operations per frame:
    //   1. DECAY copy: read prev FBO * decay → write new FBO (full-screen quad).
    //   2. SCATTER:   additive-blend N orbit points on top of the decayed buffer.
    const writeIdx = 1 - pass.target.readIdx;
    const readTex  = pass.target.textures[pass.target.readIdx];
    const writeFbo = pass.target.fbos[writeIdx];

    gl.bindFramebuffer(gl.FRAMEBUFFER, writeFbo);
    gl.viewport(0, 0, pass.target.width, pass.target.height);

    // --- 1. Decay copy.
    gl.disable(gl.BLEND);
    gl.useProgram(pass.decayProgram);
    currentProgram = pass.decayProgram;
    currentUniforms = pass.decayUniforms;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, readTex);
    setUniform1i('u_prev', 0);
    setUniform1f('u_decay', pass.decay);
    bindQuadAttrib(pass.decayProgram);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // --- 2. Scatter additive splat.
    // Compute orbit batch on CPU and stream into the VBO.
    const orbitFn = ORBIT_FNS[pass.orbit];
    const liveParams = resolveOrbitParams(pass.orbitParams);
    const batch = orbitFn(pass.orbitState, pass.points, liveParams);
    gl.bindBuffer(gl.ARRAY_BUFFER, pass.vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, batch);

    gl.useProgram(pass.program);
    currentProgram = pass.program;
    currentUniforms = pass.uniforms;
    setUniform1f('u_point_size', pass.pointSize);
    const ptLoc = gl.getAttribLocation(pass.program, 'a_pt');
    gl.bindBuffer(gl.ARRAY_BUFFER, pass.vbo);
    gl.enableVertexAttribArray(ptLoc);
    gl.vertexAttribPointer(ptLoc, 4, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);   // additive
    gl.drawArrays(gl.POINTS, 0, pass.points);
    gl.disable(gl.BLEND);

    pass.target.readIdx = writeIdx;
}

// Resolve runtime orbit params — for v1 this just clones static values from
// the piece's meta.yaml. Future extension: bind to audio / section uniforms
// via a `drivers:` block.
function resolveOrbitParams(params) {
    // Driver forms supported:
    //   { driver: 'bass_stem', lo: -1.25, hi: -1.20 }            → lerp
    //   { driver: 'section_id', table: [3,5,6,7,5,3,5,6] }       → integer table lookup
    //   { driver: 'song_progress', steps: [0.2,0.4,...], vals: [3,5,...] } → piecewise
    const out = {};
    for (const [key, val] of Object.entries(params)) {
        if (val && typeof val === 'object' && typeof val.driver === 'string') {
            const v = sampleDriver(val.driver);
            if (Array.isArray(val.table)) {
                const idx = Math.max(0, Math.min(val.table.length - 1, Math.floor(v)));
                out[key] = val.table[idx];
            } else if (Array.isArray(val.steps) && Array.isArray(val.vals)) {
                let chosen = val.vals[0];
                for (let i = 0; i < val.steps.length; i++) {
                    if (v >= val.steps[i]) chosen = val.vals[Math.min(i + 1, val.vals.length - 1)];
                }
                out[key] = chosen;
            } else {
                const lo = Number(val.lo ?? 0);
                const hi = Number(val.hi ?? 1);
                out[key] = lo + (hi - lo) * v;
            }
        } else {
            out[key] = val;
        }
    }
    return out;
}

function sampleDriver(name) {
    // Audio bands.
    if (name === 'u_audio_bass'  || name === 'bass')  return audioBands.bass;
    if (name === 'u_audio_mid'   || name === 'mid')   return audioBands.mid;
    if (name === 'u_audio_high'  || name === 'high')  return audioBands.high;
    if (name === 'u_audio_level' || name === 'level') return audioBands.level;
    if (name === 'u_audio_kick'  || name === 'kick')  return audioOnsets.bass.pulse;
    // Song-level fields from the analysis sample (uniform-name keys).
    const s = currentAnalysisSample;
    if (!s) return 0;
    if (name === 'bass_stem')        return s.u_audio_bass_stem   ?? 0;
    if (name === 'drums_stem')       return s.u_audio_drums_stem  ?? 0;
    if (name === 'other_stem')       return s.u_audio_other_stem  ?? 0;
    if (name === 'vocals_stem')      return s.u_audio_vocals_stem ?? 0;
    if (name === 'song_progress')    return s.u_song_progress     ?? 0;
    if (name === 'section_progress') return s.u_section_progress  ?? 0;
    // section_id can be -1 in the no-section / pre-roll case. Clamp to 0 so
    // table-driver lookups don't blow up.
    if (name === 'section_id')       return Math.max(0, s.u_section_id ?? 0);
    return 0;
}

function bindQuadAttrib(program) {
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  const loc = gl.getAttribLocation(program, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
}

function setStandardUniforms(vw, vh, now) {
  setUniform2f('u_resolution', vw, vh);
  setUniform1f('u_time', now);
  // Mouse is always scaled into the target's pixel space so gl_FragCoord
  // comparisons work the same whether the pass is full-res or a scaled FBO.
  const mx = vw / Math.max(1, canvas.clientWidth);
  const my = vh / Math.max(1, canvas.clientHeight);
  setUniform2f('u_mouse', mouse[0] * mx, mouse[1] * my);
  setUniform1i('u_frame', frameCount);
  setUniform1f('u_audio_level',   audioBands.level);
  setUniform1f('u_audio_bass',    audioBands.bass);
  setUniform1f('u_audio_mid',     audioBands.mid);
  setUniform1f('u_audio_high',    audioBands.high);
  setUniform1f('u_audio_kick',    audioOnsets.bass.pulse);
  setUniform1f('u_audio_snare',   audioOnsets.mid.pulse);
  setUniform1f('u_audio_cymbal',  audioOnsets.high.pulse);
  setUniform1f('u_audio_flash',   Math.max(audioOnsets.bass.pulse,
                                           audioOnsets.mid.pulse,
                                           audioOnsets.high.pulse));
  setUniform1f('u_audio_playing', audioPlaying ? 1.0 : 0.0);
  const audioT = audioEl ? audioEl.currentTime :
                 liveStream ? now :
                 0.0;
  setUniform1f('u_audio_time', audioT);

  // Song-level uniforms from audio.analysis.json. Sampled ONCE per frame
  // at the top of render() and cached in currentAnalysisSample so all
  // layers (and the compositor) see consistent values within a frame.
  // Zeroed when no analysis is loaded → monolithic-FFT pieces stay backward-
  // compatible.
  const aSample = currentAnalysisSample;
  setUniform1f('u_bpm',                aSample.u_bpm);
  setUniform1f('u_beat_phase',         aSample.u_beat_phase);
  setUniform1f('u_bar_phase',          aSample.u_bar_phase);
  setUniform1i('u_beat_index',         aSample.u_beat_index);
  setUniform1i('u_bar_index',          aSample.u_bar_index);
  setUniform1f('u_downbeat',           aSample.u_downbeat);
  setUniform1i('u_section_id',         aSample.u_section_id);
  setUniform1i('u_section_label',      aSample.u_section_label);
  setUniform1f('u_section_progress',   aSample.u_section_progress);
  setUniform1f('u_to_section_change',  aSample.u_to_section_change);
  setUniform1f('u_song_progress',      aSample.u_song_progress);
  setUniform1f('u_energy_smooth',      aSample.u_energy_smooth);
  setUniform1f('u_audio_bass_stem',    aSample.u_audio_bass_stem);
  setUniform1f('u_audio_drums_stem',   aSample.u_audio_drums_stem);
  setUniform1f('u_audio_other_stem',   aSample.u_audio_other_stem);
  setUniform1f('u_audio_vocals_stem',  aSample.u_audio_vocals_stem);
  setUniform1i('u_key_tonic',          aSample.u_key_tonic);
  setUniform1i('u_key_mode',           aSample.u_key_mode);

  // Keyboard-synth uniforms — zeroed when no synth is active so non-
  // keyboard pieces still see well-defined arrays.
  if (keyboardSynth) {
    keyboardSynth.update();
    setUniform1fv('u_keys',        keyboardSynth.envelopes);
    setUniform1fv('u_keys_visual', keyboardSynth.visualEnvelopes);
    setUniform1fv('u_key_event',   keyboardSynth.events);
  } else {
    setUniform1fv('u_keys',        ZERO_KEYS);
    setUniform1fv('u_keys_visual', ZERO_KEYS);
    setUniform1fv('u_key_event',   ZERO_KEYS);
  }

  setUniform1f('u_zoom',      gestures.getZoom());
  const _pan = gestures.getPan();
  setUniform2f('u_pan',       _pan[0], _pan[1]);
  setUniform1f('u_tap_pulse', tapPulse);

  // Multi-touch — feed every active pointer into u_touches[8] as
  // (x, y, age_seconds, 1.0). Slots past the active count get w=0 so
  // shaders can iterate `if (u_touches[i].w > 0.5)`. Coordinates are
  // scaled into the target's pixel space (same convention as u_mouse).
  const live = gestures.getPointers();
  const nowMs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  touchCount = Math.min(live.length, MAX_TOUCHES);
  for (let i = 0; i < MAX_TOUCHES; i++) {
    const o = i * 4;
    if (i < touchCount) {
      const p = live[i];
      // Pointer y is top-origin in DOM; flip to bottom-origin to match u_mouse.
      const y = canvas.clientHeight - p.y;
      TOUCHES_BUF[o + 0] = p.x * mx;
      TOUCHES_BUF[o + 1] = y * my;
      TOUCHES_BUF[o + 2] = Math.max(0, (nowMs - p.startT) * 1e-3);
      TOUCHES_BUF[o + 3] = 1.0;
    } else {
      TOUCHES_BUF[o + 0] = 0;
      TOUCHES_BUF[o + 1] = 0;
      TOUCHES_BUF[o + 2] = 0;
      TOUCHES_BUF[o + 3] = 0;
    }
  }
  setUniform4fv('u_touches',     TOUCHES_BUF);
  setUniform1i('u_touch_count',  touchCount);
  setUniform2fv('u_ball_pos',     billiards.posArray);
  setUniform1fv('u_ball_hit',     billiards.hitArray);
  setUniform2fv('u_ball_hit_pos', billiards.hitPosArray);
  setUniform1fv('u_ball_radius',  billiards.radiusArray);
}

// ---------- layer engine ----------
//
// A layer engine is the runtime form of meta.yaml's `layers:` array (see
// brainstorming/techniques/using-lib.md §"Components — the layer engine
// contract"). For each layer:
//   - Compile its fragment shader (fetched via /api/pieces/<slug>/layer/<name>/...
//     so piece-local layers override globals).
//   - Allocate a per-layer output FBO at canvas size.
// Globally:
//   - Allocate an `accumulator` (2 ping-pong FBOs) — bottom-to-top blend target.
//   - Allocate a `history` FBO — last frame's final composite (for `u_history`).
//   - Compile a single compositor program that blends a layer's output into
//     the accumulator using a runtime-selected blend mode.
//
// Render order per frame:
//   1. Clear write-side accumulator.
//   2. For each layer in declaration order (= bottom→top):
//        a. Render the layer to its own FBO with `u_below` = read-side
//           accumulator texture, `u_history` = history texture.
//        b. Run the compositor: read = (read-side acc, layer output),
//           write = write-side acc, with the layer's blend mode.
//        c. Swap accumulator read/write.
//   3. Blit final accumulator to screen + history.
//
// Shared-state publish/consume (b-tier coupling) and flash-budget enforcement
// are not in this v1 — see TODO at the bottom of this section.
// COMPOSITOR_FRAG and BLEND_MODE_TO_INT live at the top of this module
// (with other early consts) because top-level `await loadCurrent` runs
// before this section is reached.

function parseLayerSpec(spec, idx) {
    if (typeof spec.layer !== 'string' || !spec.layer) {
        throw new Error(`layers[${idx}].layer (name) required`);
    }
    if (!/^[a-z0-9][a-z0-9-]*$/.test(spec.layer)) {
        throw new Error(`layers[${idx}].layer "${spec.layer}" — invalid name (must match [a-z0-9][a-z0-9-]*)`);
    }
    const blendName = spec.blend ?? 'normal';
    if (!(blendName in BLEND_MODE_TO_INT)) {
        throw new Error(`layers[${idx}].blend "${blendName}" — must be one of: ${Object.keys(BLEND_MODE_TO_INT).join(', ')}`);
    }
    // v1 publish/consume: a layer's outputTex IS its publish (no MRT). Multiple
    // publishes per layer aren't supported yet — the schema accepts the map for
    // forward-compat but the engine uses the layer's main output as the
    // published texture for every declared name.
    const publishes = (spec.publishes && typeof spec.publishes === 'object') ? spec.publishes : {};
    const consumes  = (spec.consumes  && typeof spec.consumes  === 'object') ? spec.consumes  : {};
    return {
        name: spec.layer,
        blend: blendName,
        blendMode: BLEND_MODE_TO_INT[blendName],
        alpha: Number.isFinite(spec.alpha) ? spec.alpha : 1.0,
        uniforms: spec.uniforms ?? {},
        drivers: spec.drivers ?? {},
        publishes,                          // { name: type } — type is informational in v1
        consumes,                           // { uniformName: publishedName }
    };
}

function layerCanvasSize() {
    return [
        Math.max(1, gl.drawingBufferWidth),
        Math.max(1, gl.drawingBufferHeight),
    ];
}

function allocLayerEngineTargets(engine) {
    const [w, h] = layerCanvasSize();
    engine.width = w;
    engine.height = h;

    // Per-layer output FBOs
    for (const layer of engine.layers) {
        const { tex, fbo } = allocTexAndFbo(w, h, 'rgba8');
        layer.outputTex = tex;
        layer.outputFbo = fbo;
    }
    // Accumulator (ping-pong)
    for (let i = 0; i < 2; i++) {
        const { tex, fbo } = allocTexAndFbo(w, h, 'rgba8');
        engine.accTextures.push(tex);
        engine.accFbos.push(fbo);
    }
    // History (single, persistent)
    const { tex: htex, fbo: hfbo } = allocTexAndFbo(w, h, 'rgba8');
    engine.historyTex = htex;
    engine.historyFbo = hfbo;

    // Clear all to (0,0,0,0) so frame 0 reads sensibly.
    const clearTargets = [...engine.layers.map((l) => l.outputFbo), ...engine.accFbos, engine.historyFbo];
    for (const f of clearTargets) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, f);
        gl.viewport(0, 0, w, h);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function freeLayerEngineTargets(engine) {
    for (const layer of engine.layers) {
        if (layer.outputTex) gl.deleteTexture(layer.outputTex);
        if (layer.outputFbo) gl.deleteFramebuffer(layer.outputFbo);
        layer.outputTex = null;
        layer.outputFbo = null;
    }
    for (const t of engine.accTextures) gl.deleteTexture(t);
    for (const f of engine.accFbos)     gl.deleteFramebuffer(f);
    engine.accTextures = [];
    engine.accFbos = [];
    if (engine.historyTex) gl.deleteTexture(engine.historyTex);
    if (engine.historyFbo) gl.deleteFramebuffer(engine.historyFbo);
    engine.historyTex = null;
    engine.historyFbo = null;
}

async function buildLayerEngine(slug, layerSpecs) {
    const engine = {
        layers: [],
        accTextures: [],
        accFbos: [],
        accReadIdx: 0,
        historyTex: null,
        historyFbo: null,
        compositorProgram: null,
        compositorUniforms: {},
        width: 0,
        height: 0,
        // publishedBy: name → layer-index. Updated as layers are validated;
        // a later publish of the same name shadows an earlier one for any
        // consumer downstream of that publish.
        publishedBy: new Map(),
    };
    try {
        for (let i = 0; i < layerSpecs.length; i++) {
            const parsed = parseLayerSpec(layerSpecs[i], i);

            // Validate consumes — every consumed name must have been published
            // by an EARLIER layer. Forward references are an engine error.
            for (const [uniformName, publishedName] of Object.entries(parsed.consumes)) {
                if (!engine.publishedBy.has(publishedName)) {
                    throw new Error(
                        `layers[${i}] "${parsed.name}": consumes.${uniformName} = "${publishedName}", ` +
                        `but no earlier layer publishes that name. ` +
                        `Available publishes so far: ${[...engine.publishedBy.keys()].join(', ') || '(none)'}`
                    );
                }
            }

            const fragUrl = `/api/pieces/${encodeURIComponent(slug)}/layer/${encodeURIComponent(parsed.name)}/shader.frag`;
            const metaUrl = `/api/pieces/${encodeURIComponent(slug)}/layer/${encodeURIComponent(parsed.name)}/meta`;
            const [fragRes, metaRes] = await Promise.all([fetch(fragUrl), fetch(metaUrl)]);
            if (!fragRes.ok) throw new Error(`layers[${i}] "${parsed.name}": shader.frag not found (HTTP ${fragRes.status})`);
            const layerMeta = metaRes.ok ? await metaRes.json().catch(() => ({})) : {};
            const fragText = await preprocessShader(await fragRes.text());
            const program = buildProgram(fragText);
            engine.layers.push({
                ...parsed,
                meta: layerMeta,
                program,
                // layer.uniforms doubles as the WebGL uniform-location cache
                // (populated lazily by applyDriverUniform). The numeric
                // defaults from meta.yaml live in staticUniforms — keeping
                // them separate avoids the location cache stomping on them.
                staticUniforms: { ...(parsed.uniforms ?? {}) },
                uniforms: {},
                outputTex: null,
                outputFbo: null,
                layerIndex: i,
            });

            // Register publishes for downstream consumers. v1: outputTex
            // doubles as the published texture — no MRT.
            for (const publishedName of Object.keys(parsed.publishes)) {
                engine.publishedBy.set(publishedName, i);
            }
        }
        engine.compositorProgram = buildProgram(COMPOSITOR_FRAG);
        engine.copyProgram = buildProgram(LAYER_COPY_FRAG);
        engine.copyUniforms = {};
        allocLayerEngineTargets(engine);
    } catch (err) {
        freeLayerEngine(engine);
        throw err;
    }
    return engine;
}

function freeLayerEngine(engine) {
    if (!engine) return;
    freeLayerEngineTargets(engine);
    for (const layer of engine.layers) {
        if (layer.program) gl.deleteProgram(layer.program);
    }
    if (engine.compositorProgram) gl.deleteProgram(engine.compositorProgram);
    if (engine.copyProgram) gl.deleteProgram(engine.copyProgram);
}

function swapLayerEngine(engine) {
    freeLayerEngine(currentLayerEngine);
    if (currentProgram) gl.deleteProgram(currentProgram);
    if (currentPipeline) freePipeline(currentPipeline);
    currentProgram = null;
    currentPipeline = null;
    currentUniforms = {};
    currentLayerEngine = engine;
    // wheel-zoom gate: enable if any layer reads u_zoom
    programUsesZoom = engine.layers.some(
        (l) => gl.getUniformLocation(l.program, 'u_zoom') !== null,
    );
    startTime = performance.now();
}

function reallocLayerEngineTargets(engine) {
    if (!engine) return;
    freeLayerEngineTargets(engine);
    allocLayerEngineTargets(engine);
    startTime = performance.now();
}

function applyDriverUniform(layer, name, value) {
    // Driver values are floats in v1 — engine uniforms are predominantly float.
    // Set on the currently-bound program (assumed to be layer.program).
    const loc = layer.uniforms[name] ??= gl.getUniformLocation(layer.program, name);
    if (loc !== null) gl.uniform1f(loc, value);
}

// Flash-budget constants and state are declared near the top of the module
// (alongside other module state) because top-level `await loadCurrent` reaches
// `resetFlashBudget()` before this section is otherwise initialized. See the
// matching note on COMPOSITOR_FRAG / BLEND_MODE_TO_INT.

function resetFlashBudget() {
    flashBudgetBar = -1;
    flashBudgetCounts.clear();
    flashBudgetPrev.clear();
}

function isFlashUniform(name, layer) {
    if (layer.meta?.uniforms?.[name]?.flash === true) return true;
    return FLASH_NAME_RE.test(name);
}

function trackFlashBudget(layer, uniformName, value, barIndex) {
    // Bar rollover — emit warning if previous bar overran, then reset.
    if (barIndex !== flashBudgetBar) {
        if (flashBudgetBar >= 0 && flashBudgetCounts.size > 0) {
            let total = 0;
            for (const c of flashBudgetCounts.values()) total += c;
            if (total > FLASH_BUDGET_PER_BAR) {
                const culprits = [...flashBudgetCounts.entries()]
                    .filter(([, c]) => c > 0)
                    .map(([k, c]) => `${k}=${c}`)
                    .join(', ');
                console.warn(
                    `[layer-engine] flash budget exceeded in bar ${flashBudgetBar}: ` +
                    `${total}/${FLASH_BUDGET_PER_BAR} flashes (${culprits}). ` +
                    `See brainstorming/techniques/music-to-shader.md §"Flash budget".`
                );
            }
        }
        flashBudgetCounts.clear();
        flashBudgetBar = barIndex;
    }
    const key = `${layer.name}.${uniformName}`;
    const prev = flashBudgetPrev.get(key) ?? 0;
    if (prev < FLASH_RISING_THRESHOLD && value >= FLASH_RISING_THRESHOLD) {
        flashBudgetCounts.set(key, (flashBudgetCounts.get(key) ?? 0) + 1);
    }
    flashBudgetPrev.set(key, value);
}

function applyDrivers(layer, engineSample) {
    // engineSample is the audio-analysis sample (floats). Plus we expose a
    // few non-analysis runtime values as drivers.
    const driverSources = {
        ...engineSample,
        u_audio_level: audioBands.level,
        u_audio_bass:  audioBands.bass,
        u_audio_mid:   audioBands.mid,
        u_audio_high:  audioBands.high,
        u_audio_kick:  audioOnsets.bass.pulse,
        u_audio_snare: audioOnsets.mid.pulse,
        u_audio_cymbal: audioOnsets.high.pulse,
        u_audio_playing: audioPlaying ? 1.0 : 0.0,
        u_tap_pulse: tapPulse,
    };
    for (const [layerUniform, sourceName] of Object.entries(layer.drivers)) {
        if (!(sourceName in driverSources)) continue;
        const value = Number(driverSources[sourceName]);
        applyDriverUniform(layer, layerUniform, value);
        // Soft flash-budget enforcement: only when an analysis JSON is loaded
        // (so we have a real bar grid). Without analysis the warning is
        // meaningless.
        if (currentAnalysis && isFlashUniform(layerUniform, layer)) {
            trackFlashBudget(layer, layerUniform, value, engineSample.u_bar_index);
        }
    }
}

function applyStaticLayerUniforms(layer) {
    // Static uniforms set once per piece — but cheap to re-set per frame so
    // we just always do it. Numeric only in v1. Read from staticUniforms
    // (the parsed-spec numeric values); layer.uniforms is the runtime
    // location cache and would not contain user-supplied values.
    const statics = layer.staticUniforms ?? {};
    for (const [name, value] of Object.entries(statics)) {
        if (typeof value === 'number') {
            applyDriverUniform(layer, name, value);
        }
    }
}

function runLayerEngine(engine, now, audioSample) {
    const w = engine.width;
    const h = engine.height;

    // Clear write-side accumulator. (We treat accReadIdx as "where the
    // already-composited image lives"; the OTHER FBO is the write target.)
    let writeIdx = 1 - engine.accReadIdx;
    gl.bindFramebuffer(gl.FRAMEBUFFER, engine.accFbos[writeIdx]);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    // Make accReadIdx point at the cleared canvas so the first layer reads black for u_below.
    engine.accReadIdx = writeIdx;
    // Write side now flips back to the other FBO.
    writeIdx = 1 - engine.accReadIdx;

    for (const layer of engine.layers) {
        // (a) render layer to its own FBO
        gl.bindFramebuffer(gl.FRAMEBUFFER, layer.outputFbo);
        gl.viewport(0, 0, w, h);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        currentProgram = layer.program;
        currentUniforms = layer.uniforms;
        gl.useProgram(layer.program);
        bindQuadAttrib(layer.program);
        setStandardUniforms(w, h, now);
        applyStaticLayerUniforms(layer);
        applyDrivers(layer, audioSample);
        // u_below: read-side accumulator (everything beneath this layer)
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, engine.accTextures[engine.accReadIdx]);
        const belowLoc = layer.uniforms.u_below ??= gl.getUniformLocation(layer.program, 'u_below');
        if (belowLoc !== null) gl.uniform1i(belowLoc, 0);
        // u_history: previous frame's final composite
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, engine.historyTex);
        const histLoc = layer.uniforms.u_history ??= gl.getUniformLocation(layer.program, 'u_history');
        if (histLoc !== null) gl.uniform1i(histLoc, 1);

        // Consumed shared-state textures — bound on TEXTURE2..N. v1: a publish
        // is the publishing layer's outputTex (no MRT). Earlier-rendered
        // layers' outputTex have fresh content for this frame; later in the
        // stack we'd see stale content (validated against at build time).
        let unit = 2;
        for (const [uniformName, publishedName] of Object.entries(layer.consumes)) {
            const sourceLayerIdx = engine.publishedBy.get(publishedName);
            if (sourceLayerIdx === undefined) continue;  // already validated, but defensive
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, engine.layers[sourceLayerIdx].outputTex);
            const loc = layer.uniforms[uniformName] ??= gl.getUniformLocation(layer.program, uniformName);
            if (loc !== null) gl.uniform1i(loc, unit);
            unit++;
        }

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // (b) run the compositor: write-side acc = blend(read-side acc, layer output)
        gl.bindFramebuffer(gl.FRAMEBUFFER, engine.accFbos[writeIdx]);
        gl.viewport(0, 0, w, h);
        currentProgram = engine.compositorProgram;
        currentUniforms = engine.compositorUniforms;
        gl.useProgram(engine.compositorProgram);
        bindQuadAttrib(engine.compositorProgram);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, engine.accTextures[engine.accReadIdx]);
        const accLoc = engine.compositorUniforms.u_acc ??= gl.getUniformLocation(engine.compositorProgram, 'u_acc');
        if (accLoc !== null) gl.uniform1i(accLoc, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, layer.outputTex);
        const layerLoc = engine.compositorUniforms.u_layer ??= gl.getUniformLocation(engine.compositorProgram, 'u_layer');
        if (layerLoc !== null) gl.uniform1i(layerLoc, 1);
        const modeLoc = engine.compositorUniforms.u_blend_mode ??= gl.getUniformLocation(engine.compositorProgram, 'u_blend_mode');
        if (modeLoc !== null) gl.uniform1i(modeLoc, layer.blendMode);
        const alphaLoc = engine.compositorUniforms.u_alpha ??= gl.getUniformLocation(engine.compositorProgram, 'u_alpha');
        if (alphaLoc !== null) gl.uniform1f(alphaLoc, layer.alpha);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // (c) swap accumulator read/write
        engine.accReadIdx = writeIdx;
        writeIdx = 1 - engine.accReadIdx;
    }

    // Final accumulator → screen via fullscreen-quad copy. Avoids
    // blitFramebuffer's restrictions when the default framebuffer is
    // multisampled (antialias: true on the canvas).
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    currentProgram = engine.copyProgram;
    currentUniforms = engine.copyUniforms;
    gl.useProgram(engine.copyProgram);
    bindQuadAttrib(engine.copyProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, engine.accTextures[engine.accReadIdx]);
    const srcLoc = engine.copyUniforms.u_src ??= gl.getUniformLocation(engine.copyProgram, 'u_src');
    if (srcLoc !== null) gl.uniform1i(srcLoc, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Final accumulator → history (single-sample → single-sample, so blit is
    // safe and the cheapest copy).
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, engine.accFbos[engine.accReadIdx]);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, engine.historyFbo);
    gl.blitFramebuffer(0, 0, w, h, 0, 0, w, h, gl.COLOR_BUFFER_BIT, gl.NEAREST);

    // Reset bindings.
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

// Future-extension notes:
// - Multi-publish per layer (multiple render targets). v1 uses the layer's
//   single outputTex as the published texture; pieces wanting separate
//   visual + data buffers will need MRT support added to the layer FBO.
// - Flash-budget regex is name-only (matches `flash`, `strobe`, `brightness`,
//   `exposure`, `bloom`). Layer authors who want stricter classification can
//   add `{ flash: true }` to a uniform's meta.yaml entry.

// ---------- piece loading ----------

async function refreshCatalog() {
  try {
    catalog = await (await fetch('/api/catalog')).json();
  } catch { catalog = []; }
}

async function loadCurrent({ initial } = {}) {
  const slug = FORCED_SLUG ?? await fetchCurrentSlug();
  if (!slug) {
    if (initial) swapProgram(buildProgram(await preprocessShader(FALLBACK_FRAG)));
    setMetaOverlay(null);
    detachAudio();
    currentSlug = null;
    return;
  }
  await loadPiece(slug);
}

async function fetchCurrentSlug() {
  try {
    const body = await (await fetch('/api/current')).json();
    return body.slug ?? null;
  } catch { return null; }
}

async function loadPiece(slug) {
  try {
    const [fragRes, metaRes, mtimeRes] = await Promise.all([
      fetch(`/api/pieces/${slug}/shader.frag`),
      fetch(`/api/pieces/${slug}/meta`),
      fetch(`/api/pieces/${slug}/mtime`),
    ]);
    if (!fragRes.ok || !metaRes.ok || !mtimeRes.ok) {
      throw new Error(`piece ${slug} not found`);
    }
    const frag = await fragRes.text();
    const meta = await metaRes.json();
    const { mtime } = await mtimeRes.json();

    // Audio analysis is optional. Pieces opt in by declaring `audio_features:`
    // in meta.yaml; we only fetch the JSON in that case. Avoids spurious 404s
    // for monolithic pieces that don't use song-level uniforms.
    currentAnalysis = null;
    if (Array.isArray(meta?.audio_features) && meta.audio_features.length > 0) {
      const aRes = await fetch(`/api/pieces/${slug}/analysis`);
      if (aRes.ok) {
        const json = await aRes.json().catch(() => null);
        currentAnalysis = audioAnalysis.parse(json);
        if (!currentAnalysis) console.warn(`[loadPiece] ${slug}: audio.analysis.json failed to parse`);
      } else {
        console.warn(`[loadPiece] ${slug}: audio_features declared but no audio.analysis.json found (run bin/analyze-audio.mjs)`);
      }
    }
    analysisSampleState = audioAnalysis.createSampleState();
    resetFlashBudget();
    if (keyboardSynth) keyboardSynth.releaseAll();

    // Drop any cached lib sources so edits to lib/*.glsl propagate. The cache
    // persists within a single compile (dedupes repeated #include of the same
    // module) but not across compiles.
    clearLibCache();

    // render_scale must be applied before building the pipeline so FBO
    // allocations use the correct canvas pixel dims.
    const rs = Number(meta?.render_scale);
    renderScale = (Number.isFinite(rs) && rs > 0 && rs <= 2) ? rs : 1.0;
    resize();

    if (Array.isArray(meta?.layers) && meta.layers.length > 0) {
      const engine = await buildLayerEngine(slug, meta.layers);
      swapLayerEngine(engine);
    } else if (Array.isArray(meta?.passes) && meta.passes.length > 0) {
      const pipeline = await buildPipeline(slug, meta.passes);
      swapPipeline(pipeline);
    } else {
      const prog = buildProgram(await preprocessShader(frag));
      swapProgram(prog);
    }
    currentMeta = meta;
    currentSlug = slug;
    currentMtime = mtime;
    // Reconfigure the billiard sim on every piece load. If the piece
    // declared its own ball setup, use that; otherwise fall back to the
    // library defaults (4 balls, unit mass, default radius).
    const pieceBalls = Array.isArray(meta?.billiards) && meta.billiards.length > 0
      ? meta.billiards
      : null;
    billiards.reset(pieceBalls);
    attachAudio(slug, meta);
    pushSlugToUrl(slug);
    setMetaOverlay(meta);
    clearError();
  } catch (err) {
    console.error('[loadPiece]', slug, err);
    showError(`[${slug}] ${err.message}`);
  }
}

async function pollForChanges() {
  if (!FORCED_SLUG && !userOverride) {
    const slug = await fetchCurrentSlug();
    if (slug && slug !== currentSlug) {
      await refreshCatalog();
      await loadPiece(slug);
      return;
    }
  }
  if (!currentSlug) return;
  try {
    const res = await fetch(`/api/pieces/${currentSlug}/mtime`);
    if (!res.ok) return;
    const { mtime } = await res.json();
    if (mtime !== currentMtime) {
      await loadPiece(currentSlug);
    }
  } catch {}
}

async function cycle(step) {
  await refreshCatalog();
  if (catalog.length === 0) return;
  const i = Math.max(0, catalog.findIndex((p) => p.slug === currentSlug));
  const next = catalog[(i + step + catalog.length) % catalog.length];
  if (next?.slug) {
    userOverride = true;
    loadPiece(next.slug);
  }
}

function pushSlugToUrl(slug) {
  if (!slug) return;
  const want = `/${slug}`;
  if (location.pathname === want) return;
  try { history.replaceState({ slug }, '', want); } catch {}
}

// ---------- catalog overlay ----------

async function toggleCatalog() {
  if (!catalogEl) return;
  if (catalogEl.classList.contains('hidden')) await openCatalog();
  else closeCatalog();
}

// Capabilities for a catalog entry. Prefer the server-computed object; fall
// back to deriving from raw meta fields so the UI still works against an older
// server response that predates the capabilities field.
function pieceCaps(p) {
  if (p.capabilities) return p.capabilities;
  return {
    sound: Boolean(p.audio),
    cursor: p.cursor === true,
    keyboard: p.keyboard_synth === true,
  };
}

async function openCatalog() {
  if (!catalogEl || !catalogInner) return;
  await Promise.all([refreshCatalog(), refreshCriticSummary()]);
  wireCatalogFilter();
  renderCatalog();
  catalogEl.classList.remove('hidden');
}

async function refreshCriticSummary() {
  try {
    criticSummary = await (await fetch('/api/critic-summary')).json();
  } catch { criticSummary = {}; }
}

// Render cards for the pieces matching the active filter (AND across chips).
function renderCatalog() {
  if (!catalogInner) return;
  catalogInner.replaceChildren();
  const active = [...catalogFilter];
  const shown = catalog.filter((p) => {
    const caps = pieceCaps(p);
    return active.every((k) => caps[k]);
  });
  for (const p of shown) {
    const caps = pieceCaps(p);
    const card = document.createElement('div');
    card.className = 'card' + (p.slug === currentSlug ? ' active' : '');
    const title = document.createElement('div');
    title.className = 't';
    title.textContent = p.title ?? p.slug;
    const sub = document.createElement('div');
    sub.className = 's';
    sub.textContent = [p.slug, p.created ? formatDate(p.created) : ''].filter(Boolean).join(' · ');
    const notes = document.createElement('div');
    notes.className = 'n';
    notes.textContent = (p.notes ?? '').split('\n')[0].slice(0, 140);
    card.append(title, sub, notes);
    const present = CAP_BADGES.filter((b) => caps[b.key]);
    if (present.length) {
      const badges = document.createElement('div');
      badges.className = 'badges';
      for (const b of present) {
        const span = document.createElement('span');
        span.textContent = b.emoji;
        span.title = b.label;
        badges.appendChild(span);
      }
      card.appendChild(badges);
    }
    const crit = criticSummary[p.slug];
    if (crit) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `verdict-chip verdict-${verdictClass(crit.verdict)}`;
      // Oldest critiques predate the verdict vocabulary — fall back to the
      // composite score, or a plain "critique" affordance.
      let label = crit.verdict ?? (crit.composite != null ? `${crit.composite}/5` : 'critique');
      if (crit.verdict && crit.composite != null) label += ` · ${crit.composite}`;
      chip.textContent = label;
      chip.title = 'critic grades';
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        openGrades(p);
      });
      card.appendChild(chip);
    }
    card.addEventListener('click', () => {
      userOverride = true;
      loadPiece(p.slug);
      closeCatalog();
    });
    catalogInner.appendChild(card);
  }
  const countEl = document.getElementById('catalog-count');
  if (countEl) {
    countEl.textContent = active.length
      ? `${shown.length} of ${catalog.length}`
      : `${catalog.length} pieces`;
  }
}

// Wire the filter chips once. Toggling a chip updates catalogFilter and
// re-renders; the clear button drops all active filters.
let catalogFilterWired = false;
function wireCatalogFilter() {
  if (catalogFilterWired || !catalogEl) return;
  catalogFilterWired = true;
  for (const chip of catalogEl.querySelectorAll('.chip[data-cap]')) {
    chip.addEventListener('click', () => {
      const cap = chip.dataset.cap;
      if (catalogFilter.has(cap)) catalogFilter.delete(cap);
      else catalogFilter.add(cap);
      chip.setAttribute('aria-pressed', catalogFilter.has(cap) ? 'true' : 'false');
      syncClearButton();
      renderCatalog();
    });
  }
  const clearBtn = document.getElementById('catalog-filter-clear');
  clearBtn?.addEventListener('click', () => {
    catalogFilter.clear();
    for (const chip of catalogEl.querySelectorAll('.chip[data-cap]')) {
      chip.setAttribute('aria-pressed', 'false');
    }
    syncClearButton();
    renderCatalog();
  });
  document.getElementById('catalog-all-grades')?.addEventListener('click', () => openAllGrades());
}

function syncClearButton() {
  const clearBtn = document.getElementById('catalog-filter-clear');
  clearBtn?.classList.toggle('hidden', catalogFilter.size === 0);
}

function closeCatalog() {
  catalogEl?.classList.add('hidden');
  closeGrades();
}

// ---------- critic grades overlay ----------
// Opens from the verdict chip on a catalog card. Shows the grouped note
// (latest verdict + composite), every per-probe grade from the latest
// structured critique, the six dimension scores, and the iteration history
// with links to the full critique markdown.

const PROBE_GROUP_TITLES = {
  mesmerizing: 'Mesmerizing',
  interaction: 'Interaction',
  music: 'Music (per-frame)',
  song_level: 'Song-level',
  dual_input: 'Dual-input',
  layered: 'Layered composition',
};

function verdictClass(v) {
  return String(v ?? '').toLowerCase().replace(/[^a-z-]/g, '') || 'unknown';
}

// pass → green, weak* → amber, fail → red, shader-pass → muted, n/a → grey.
function probeClass(v) {
  const s = String(v ?? '').toLowerCase();
  if (s === 'pass') return 'pass';
  if (s.includes('fail')) return 'fail';
  if (s.includes('weak')) return 'weak';
  if (s.includes('shader')) return 'shader';
  if (s === 'n/a' || s === 'na' || s === '') return 'na';
  return 'na';
}

function probeLabel(key) {
  return key.replaceAll('_', ' ');
}

// Probe definitions for tooltips — verbatim taste.md excerpts served once
// from /api/probe-info. {groups, probes: {group: {probe: text}}, scores, verdicts}.
let probeInfo = null;
async function ensureProbeInfo() {
  if (probeInfo !== null) return;
  try {
    probeInfo = await (await fetch('/api/probe-info')).json();
  } catch { probeInfo = {}; }
}

// A small ⓘ that reveals the probe's exact rubric text on hover (CSS tooltip
// reads data-tip). Returns null when there is no text, so callers can skip it.
function infoTip(text) {
  if (!text) return null;
  const tip = el('span', 'info-tip', 'ⓘ');
  tip.dataset.tip = text;
  return tip;
}

// A grade value badge (pass / weak / shader-pass / ...) carrying its own
// legend tooltip, so the vocabulary explains itself where it's met.
function gradeValue(value) {
  const span = el('span', `grades-value pv-${probeClass(value)}`, String(value));
  const legend = probeInfo?.values?.[String(value).toLowerCase()];
  if (legend) span.dataset.tip = legend;
  return span;
}

async function openGrades(piece) {
  if (!gradesEl) return;
  wireGrades();
  await ensureProbeInfo();
  let critiques = [];
  try {
    const body = await (await fetch(`/api/pieces/${piece.slug}/critiques`)).json();
    critiques = Array.isArray(body?.critiques) ? body.critiques : [];
  } catch {}
  gradesEl.replaceChildren(buildGradesPanel(piece, critiques, { list: false }));
  gradesEl.classList.remove('hidden');
}

// The ongoing list — every graded piece, catalog order, one panel after
// another. Opened from the catalog's "grades" chip or Shift+V.
async function openAllGrades() {
  if (!gradesEl) return;
  wireGrades();
  await Promise.all([
    catalog.length ? Promise.resolve() : refreshCatalog(),
    ensureProbeInfo(),
  ]);
  let all = {};
  try {
    all = await (await fetch('/api/critiques')).json();
  } catch {}
  gradesEl.replaceChildren();

  const graded = catalog.filter((p) => Array.isArray(all[p.slug]) && all[p.slug].length > 0);
  const head = el('div', 'grades-panel grades-list-head');
  const bar = el('div', 'grades-head');
  bar.append(
    el('div', 'grades-title', 'critic grades'),
    el('div', 'grades-sub', `${graded.length} graded pieces · newest first`),
  );
  const closeBtn = el('button', 'grades-close', '×');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'close grades');
  closeBtn.addEventListener('click', closeGrades);
  bar.appendChild(closeBtn);
  head.appendChild(bar);
  gradesEl.appendChild(head);

  for (const p of graded) {
    gradesEl.appendChild(buildGradesPanel(p, all[p.slug], { list: true }));
  }
  gradesEl.classList.remove('hidden');
}

// v — toggle grades for the piece on screen. Shift+V — toggle the full list.
// Falls back to the URL-pinned slug so grades stay reachable even when the
// piece itself failed to compile.
function toggleGrades() {
  if (gradesOpen()) { closeGrades(); return; }
  const slug = currentSlug ?? FORCED_SLUG;
  if (!slug) return;
  openGrades({ slug, title: currentMeta?.title ?? slug });
}

function toggleAllGrades() {
  if (gradesOpen()) { closeGrades(); return; }
  openAllGrades();
}

// Click on the dimmed backdrop (not the panel) closes, like Esc.
let gradesWired = false;
function wireGrades() {
  if (gradesWired || !gradesEl) return;
  gradesWired = true;
  gradesEl.addEventListener('click', (e) => {
    if (e.target === gradesEl) closeGrades();
  });
}

function closeGrades() {
  gradesEl?.classList.add('hidden');
  closeLightbox();
}

function gradesOpen() {
  return Boolean(gradesEl && !gradesEl.classList.contains('hidden'));
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// One piece's grades panel. Single mode gets a close button; list mode gets
// a clickable title that jumps to the piece.
function buildGradesPanel(piece, critiques, { list }) {
  const panel = el('div', 'grades-panel');

  const head = el('div', 'grades-head');
  const title = el('div', 'grades-title', piece.title ?? piece.slug);
  if (list) {
    title.classList.add('grades-title-link');
    title.title = 'open this piece';
    title.addEventListener('click', () => {
      closeGrades();
      closeCatalog();
      userOverride = true;
      loadPiece(piece.slug);
    });
  }
  head.append(title, el('div', 'grades-sub', piece.slug));
  if (!list) {
    const closeBtn = el('button', 'grades-close', '×');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'close grades');
    closeBtn.addEventListener('click', closeGrades);
    head.appendChild(closeBtn);
  }
  panel.appendChild(head);

  if (critiques.length === 0) {
    panel.appendChild(el('div', 'grades-empty', 'no critiques recorded for this piece'));
    return panel;
  }

  // Latest structured critique carries the probe data; prose-only ones
  // (pre-YAML-tail era) at most contribute a verdict to the history.
  const latest = [...critiques].reverse().find((c) => c.structured) ?? critiques[critiques.length - 1];

  // Grouped note: the one-line aggregate read of the latest critique.
  const note = el('div', 'grades-note');
  if (latest.verdict) {
    const pill = el('span', `verdict-pill verdict-${verdictClass(latest.verdict)}`, latest.verdict);
    note.appendChild(pill);
    const tip = infoTip(probeInfo?.verdicts?.[verdictClass(latest.verdict)]);
    if (tip) note.appendChild(tip);
  }
  const parts = [];
  if (latest.composite != null) parts.push(`avg dims ${latest.composite}/5`);
  // mesmerizing_passes is usually a number, but some critiques wrote "1/5".
  const mes = latest.passes?.mesmerizing;
  if (mes != null && mes !== 'n/a') parts.push(`mesmerizing ${String(mes).includes('/') ? mes : `${mes}/5`}`);
  if (latest.claim_check != null) parts.push(`claim ${latest.claim_check}`);
  parts.push(latest.version, `${critiques.length} critique${critiques.length > 1 ? 's' : ''}`);
  note.appendChild(el('span', 'grades-note-text', parts.join(' · ')));
  panel.appendChild(note);

  if (latest.structured) {
    const groups = el('div', 'grades-groups');
    for (const [key, probes] of Object.entries(latest.probes ?? {})) {
      const group = el('div', 'grades-group');
      const passCount = latest.passes?.[key];
      const groupHead = el('div', 'grades-group-h');
      // ⓘ leads the line (Louis's preference, 2026-06-11).
      const groupTip = infoTip(probeInfo?.groups?.[key]);
      if (groupTip) groupHead.appendChild(groupTip);
      groupHead.appendChild(el('span', '',
        (PROBE_GROUP_TITLES[key] ?? probeLabel(key)) + (passCount != null && passCount !== 'n/a' ? ` — ${passCount}` : '')));
      group.appendChild(groupHead);
      for (const [probe, value] of Object.entries(probes)) {
        const row = el('div', 'grades-row');
        const label = el('span', 'grades-probe');
        const tip = infoTip(probeInfo?.probes?.[key]?.[probe]);
        if (tip) label.appendChild(tip);
        label.appendChild(el('span', '', probeLabel(probe)));
        row.append(label, gradeValue(value));
        group.appendChild(row);
      }
      groups.appendChild(group);
    }
    if (latest.scores) {
      const group = el('div', 'grades-group');
      group.appendChild(el('div', 'grades-group-h', 'Dimensions'));
      for (const [dim, score] of Object.entries(latest.scores)) {
        const row = el('div', 'grades-row');
        const label = el('span', 'grades-probe');
        const tip = infoTip(probeInfo?.scores?.[dim]);
        if (tip) label.appendChild(tip);
        label.appendChild(el('span', '', probeLabel(dim)));
        row.appendChild(label);
        if (typeof score === 'number') {
          const bar = el('span', 'grades-bar');
          const fill = el('span', 'grades-bar-fill');
          fill.style.width = `${(score / 5) * 100}%`;
          bar.appendChild(fill);
          row.append(bar, el('span', 'grades-score', `${score}/5`));
        } else {
          row.appendChild(el('span', 'grades-value pv-na', String(score)));
        }
        group.appendChild(row);
      }
      groups.appendChild(group);
    }
    panel.appendChild(groups);
  } else {
    panel.appendChild(el('div', 'grades-empty',
      'no structured grades in the latest critique — see the full-critique links below'));
  }

  // What the critic saw — snapshot frames copied at critique time.
  const strip = buildEvidenceStrip(latest, `What the critic saw — ${latest.version}`);
  if (strip) panel.appendChild(strip);

  const hist = el('div', 'grades-group grades-history');
  hist.appendChild(el('div', 'grades-group-h', 'History'));
  for (const c of critiques) {
    const row = el('div', 'grades-row');
    row.append(
      el('span', 'grades-probe', c.version),
      el('span', `grades-value verdict-${verdictClass(c.verdict)}`, c.verdict ?? '—'),
      el('span', 'grades-score', c.composite != null ? `${c.composite}/5` : ''),
    );
    // "details" opens the full critique rendered inside this overlay, with
    // that version's own evidence — the dig-into-the-eval view.
    const details = el('button', 'grades-link grades-details-btn', 'details');
    details.type = 'button';
    const back = list ? () => openAllGrades() : () => openGrades(piece);
    details.addEventListener('click', () => openCritiqueDetail(piece, c, back));
    row.appendChild(details);
    const link = el('a', 'grades-link', 'raw ↗');
    link.href = `/api/critiques/${encodeURIComponent(c.file)}`;
    link.target = '_blank';
    link.rel = 'noopener';
    row.appendChild(link);
    hist.appendChild(row);
  }
  panel.appendChild(hist);

  return panel;
}

// Evidence thumbnail strip for one critique. Click opens the lightbox;
// middle-click / ctrl-click still opens the raw file via the href.
function buildEvidenceStrip(critique, title) {
  if (!Array.isArray(critique?.evidence) || critique.evidence.length === 0) return null;
  const items = [];
  for (const p of critique.evidence) {
    const m = String(p).match(/^evidence\/([a-z0-9-]+)\/([A-Za-z0-9._-]+)$/);
    if (!m) continue;
    items.push({
      url: `/api/critiques/evidence/${encodeURIComponent(m[1])}/${encodeURIComponent(m[2])}`,
      name: m[2],
      isImage: /\.(png|jpe?g|webp)$/i.test(m[2]),
    });
  }
  if (items.length === 0) return null;
  const images = items.filter((it) => it.isImage);

  const ev = el('div', 'grades-group grades-evidence');
  ev.appendChild(el('div', 'grades-group-h', title));
  const strip = el('div', 'grades-evidence-strip');
  for (const it of items) {
    const a = el('a', 'grades-thumb');
    a.href = it.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.title = it.name;
    if (it.isImage) {
      const img = document.createElement('img');
      img.loading = 'lazy';   // the all-grades list can hold hundreds of frames
      img.src = it.url;
      img.alt = it.name;
      a.appendChild(img);
      a.addEventListener('click', (e) => {
        e.preventDefault();
        openLightbox(images, images.indexOf(it));
      });
    } else {
      a.classList.add('grades-thumb-file');
      a.textContent = it.name;
    }
    strip.appendChild(a);
  }
  ev.appendChild(strip);
  return ev;
}

// ---------- critique detail (the full eval, rendered in-overlay) ----------

async function openCritiqueDetail(piece, critique, backFn) {
  let md = '';
  try {
    md = await (await fetch(`/api/critiques/${encodeURIComponent(critique.file)}`)).text();
  } catch { md = '_failed to load critique_'; }

  gradesEl.replaceChildren();
  const panel = el('div', 'grades-panel grades-detail');

  const head = el('div', 'grades-head');
  const back = el('button', 'grades-back', '‹ back');
  back.type = 'button';
  back.addEventListener('click', backFn);
  head.appendChild(back);
  head.append(
    el('div', 'grades-title', `${piece.title ?? piece.slug} — ${critique.version}`),
    el('div', 'grades-sub', critique.file),
  );
  const closeBtn = el('button', 'grades-close', '×');
  closeBtn.type = 'button';
  closeBtn.addEventListener('click', closeGrades);
  head.appendChild(closeBtn);
  panel.appendChild(head);

  if (critique.verdict) {
    const note = el('div', 'grades-note');
    note.appendChild(el('span', `verdict-pill verdict-${verdictClass(critique.verdict)}`, critique.verdict));
    const tip = infoTip(probeInfo?.verdicts?.[verdictClass(critique.verdict)]);
    if (tip) note.appendChild(tip);
    if (critique.composite != null) note.appendChild(el('span', 'grades-note-text', `avg dims ${critique.composite}/5`));
    panel.appendChild(note);
  }

  const strip = buildEvidenceStrip(critique, 'What the critic saw');
  if (strip) panel.appendChild(strip);

  panel.appendChild(renderMarkdown(md));
  gradesEl.appendChild(panel);
  gradesEl.scrollTop = 0;
}

// Minimal markdown renderer for critiques — headings, paragraphs, lists,
// tables, fenced code, bold/italic/inline-code/links. Input is escaped
// before any tags are introduced, so critique content can't inject HTML.
function renderMarkdown(md) {
  const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s) => escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\W)\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s"]+|\/[^)\s"]*)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');

  const root = el('div', 'md');
  const lines = md.split('\n');
  let html = '';
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {                       // fenced code block
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      html += `<pre>${escapeHtml(buf.join('\n'))}</pre>`;
    } else if (/^#{1,6}\s/.test(line)) {           // heading
      const level = Math.min(6, line.match(/^#+/)[0].length);
      html += `<h${level}>${inline(line.replace(/^#+\s*/, ''))}</h${level}>`;
      i++;
    } else if (/^\s*\|/.test(line)) {              // table
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      let body = '';
      for (const [ri, r] of rows.entries()) {
        if (/^\s*\|[\s:|-]+\|?\s*$/.test(r)) continue;   // separator row
        const tag = ri === 0 ? 'th' : 'td';
        body += `<tr>${cells(r).map((c) => `<${tag}>${inline(c)}</${tag}>`).join('')}</tr>`;
      }
      html += `<table>${body}</table>`;
    } else if (/^\s*([-*]|\d+\.)\s/.test(line)) {  // list (flat)
      const items = [];
      while (i < lines.length && (/^\s*([-*]|\d+\.)\s/.test(lines[i]) || /^\s{2,}\S/.test(lines[i]))) {
        if (/^\s*([-*]|\d+\.)\s/.test(lines[i])) items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s/, ''));
        else items[items.length - 1] += ' ' + lines[i].trim();   // hanging indent continuation
        i++;
      }
      html += `<ul>${items.map((it) => `<li>${inline(it)}</li>`).join('')}</ul>`;
    } else if (/^\s*$/.test(line)) {
      i++;
    } else if (/^---+\s*$/.test(line)) {
      html += '<hr>';
      i++;
    } else {                                       // paragraph
      const buf = [];
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,6}\s|```|\s*\||\s*([-*]|\d+\.)\s|---+\s*$)/.test(lines[i])) {
        buf.push(lines[i++]);
      }
      html += `<p>${inline(buf.join(' '))}</p>`;
    }
  }
  root.innerHTML = html;
  return root;
}

// ---------- evidence lightbox ----------

let lightboxItems = [];
let lightboxIdx = 0;

function lightboxOpen() {
  return Boolean(lightboxEl && !lightboxEl.classList.contains('hidden'));
}

let lightboxWired = false;
function openLightbox(items, idx) {
  if (!lightboxEl || items.length === 0) return;
  if (!lightboxWired) {
    lightboxWired = true;
    lightboxEl.addEventListener('click', (e) => {
      if (e.target === lightboxEl) closeLightbox();
    });
  }
  lightboxItems = items;
  lightboxIdx = Math.max(0, idx);
  renderLightbox();
  lightboxEl.classList.remove('hidden');
}

function closeLightbox() {
  lightboxEl?.classList.add('hidden');
}

function lightboxStep(d) {
  if (lightboxItems.length === 0) return;
  lightboxIdx = (lightboxIdx + d + lightboxItems.length) % lightboxItems.length;
  renderLightbox();
}

function renderLightbox() {
  const it = lightboxItems[lightboxIdx];
  if (!it) return;
  lightboxEl.replaceChildren();
  const img = document.createElement('img');
  img.src = it.url;
  img.alt = it.name;
  img.addEventListener('click', (e) => { e.stopPropagation(); lightboxStep(+1); });
  const caption = el('div', 'lightbox-caption',
    `${it.name} · ${lightboxIdx + 1}/${lightboxItems.length} · ← → navigate · esc closes`);
  const prev = el('button', 'lightbox-nav lightbox-prev', '‹');
  const next = el('button', 'lightbox-nav lightbox-next', '›');
  prev.type = next.type = 'button';
  prev.addEventListener('click', (e) => { e.stopPropagation(); lightboxStep(-1); });
  next.addEventListener('click', (e) => { e.stopPropagation(); lightboxStep(+1); });
  lightboxEl.append(img, caption, prev, next);
}

// ---------- audio ----------

function attachAudio(slug, meta) {
  const spec = meta?.audio;
  if (!spec) { detachAudio(); return; }
  if (spec === 'live') { attachLiveAudio(slug, meta); return; }
  const filename = spec;
  const key = `${slug}:${filename}`;
  if (audioKey === key && audioEl) { updateAudioUi(); return; }  // already attached

  detachAudio();

  audioEl = new Audio();
  audioEl.crossOrigin = 'anonymous';
  audioEl.loop        = !!meta.audio_loop;
  audioEl.preload     = 'auto';
  audioEl.src = `/api/pieces/${encodeURIComponent(slug)}/file/${encodeURIComponent(filename)}`;
  audioEl.addEventListener('play',   () => {
    audioPlaying = true;
    updateAudioUi();
    // First successful play — remove the gesture-listener so pressing space
    // to pause later doesn't immediately re-start the audio.
    disarmAutoplay();
  });
  audioEl.addEventListener('pause',  () => { audioPlaying = false; updateAudioUi(); });
  audioEl.addEventListener('ended',  () => { audioPlaying = false; updateAudioUi(); });
  audioKey = key;
  audioUiEl?.classList.remove('hidden');
  updateAudioUi();

  // Try to start immediately. Most browsers block this (no user gesture yet)
  // and silently reject; the first-gesture listener below catches up.
  tryAutoplay();
  armFirstGestureAutoplay();
}

function attachLiveAudio(slug, meta) {
  const key = `${slug}:live`;
  if (audioKey === key && liveStream) { updateAudioUi(); return; }

  detachAudio();

  audioKey     = key;
  audioPlaying = false;
  audioBands   = { level: 0, bass: 0, mid: 0, high: 0 };

  // Show the audio UI container (the device picker lives inside it in a
  // later task); hide the scrub progress bar (no track to scrub).
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
  // An initial resume() attempt here — may fail if the context was just
  // constructed without a user gesture. The post-stream-attach resume
  // below catches the case where the browser prompt's "Allow" click is
  // enough, and the first-gesture listener catches the rest.
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
        showLiveHint('🎤 click to grant audio input — piece runs autonomously otherwise');
        return;
      }
    } else {
      console.warn('[audio] getUserMedia rejected', err);
      showLiveHint('🎤 click to grant audio input — piece runs autonomously otherwise');
      return;
    }
  }

  liveStream       = stream;
  liveStreamSource = audioCtx.createMediaStreamSource(stream);
  // IMPORTANT: do NOT connect the analyser to audioCtx.destination —
  // that would route the mic back to speakers and cause feedback.
  liveStreamSource.connect(audioAnalyser);

  // Resume after stream attach — granting the mic prompt counts as a
  // gesture in Chrome/Firefox, so this usually succeeds where the
  // earlier resume call silently failed. Without this the analyser
  // produces all zeros and the shader locks in its idle branch.
  if (audioCtx.state === 'suspended') {
    try { await audioCtx.resume(); } catch {}
  }

  liveStartTime     = performance.now();
  audioPlaying      = true;
  attachedDeviceId  = stream.getAudioTracks()[0]?.getSettings()?.deviceId ?? null;

  hideLiveHint();
  await populateDeviceList();
  disarmAutoplay();
  updateAudioUi();
}

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

// Try to start the current audio element, swallowing the browser's autoplay
// block. Safe to call multiple times and safe when no audio is attached.
async function tryAutoplay() {
  if (!audioEl || !audioEl.paused) return;
  await ensureAudioContext();
  try { await audioEl.play(); } catch {}
}

// Install a global first-gesture listener that attempts to start audio.
// MUST disarm after the first successful play event — otherwise the listener
// fires on every keydown and clobbers intentional pauses (spacebar would
// pause then immediately re-start).
function armFirstGestureAutoplay() {
  if (autoplayArmed) return;
  autoplayArmed = true;
  autoplayKickFn = async () => {
    // Any gesture is enough to unblock both file audio (play) and live
    // audio (resume the suspended context). Tolerate either path failing
    // so one doesn't starve the other.
    if (audioCtx && audioCtx.state === 'suspended') {
      try { await audioCtx.resume(); } catch {}
    }
    if (audioKey && audioKey.endsWith(':live') && !liveStream) {
      tryAttachLiveStream();
    }
    tryAutoplay();
  };
  window.addEventListener('pointerdown', autoplayKickFn);
  window.addEventListener('keydown',     autoplayKickFn);
  window.addEventListener('touchstart',  autoplayKickFn, { passive: true });
}

function disarmAutoplay() {
  autoplayArmed = false;
  if (!autoplayKickFn) return;
  window.removeEventListener('pointerdown', autoplayKickFn);
  window.removeEventListener('keydown',     autoplayKickFn);
  window.removeEventListener('touchstart',  autoplayKickFn);
  autoplayKickFn = null;
}

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
    try { audioEl.pause(); } catch {}
    audioEl.src = '';
    audioEl = null;
  }
  if (audioSource) {
    try { audioSource.disconnect(); } catch {}
    audioSource = null;
  }
  // Also sever analyser → destination. Without this, switching from a
  // file piece (which wires analyser→destination in ensureAudioContext)
  // to a live piece leaves the destination edge in place — the live
  // stream would then route to speakers and induce feedback. Safe to
  // call even when no such edge exists; the throw is swallowed.
  if (audioAnalyser && audioCtx) {
    try { audioAnalyser.disconnect(audioCtx.destination); } catch {}
  }
  audioKey     = null;
  audioPlaying = false;
  audioBands   = { level: 0, bass: 0, mid: 0, high: 0 };
  audioOnsets  = {
    bass:  { short: 0, long: 0, pulse: 0 },
    mid:   { short: 0, long: 0, pulse: 0 },
    high:  { short: 0, long: 0, pulse: 0 },
  };
  audioUiEl?.classList.add('hidden');
  // Restore progress bar visibility for file pieces (live-attach hid it).
  audioProgressEl?.classList.remove('hidden');
  liveInputEl?.classList.add('hidden');
  hideLiveHint();
  updateAudioUi();
}

async function ensureAudioContext() {
  if (!audioEl) return false;
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    audioCtx       = new Ctx();
    audioAnalyser  = audioCtx.createAnalyser();
    audioAnalyser.fftSize              = 1024;
    audioAnalyser.smoothingTimeConstant = 0.65;
    audioFreqData  = new Uint8Array(audioAnalyser.frequencyBinCount);
  }
  if (!audioSource) {
    audioSource = audioCtx.createMediaElementSource(audioEl);
    audioSource.connect(audioAnalyser);
    audioAnalyser.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    try { await audioCtx.resume(); } catch {}
  }
  return true;
}

async function toggleAudio() {
  if (!audioEl) return;
  await ensureAudioContext();
  if (audioEl.paused) {
    audioEl.play().catch((err) => console.warn('[audio] play rejected', err));
  } else {
    audioEl.pause();
  }
}

function sampleAudio() {
  if (!audioAnalyser || !audioPlaying) return;
  audioAnalyser.getByteFrequencyData(audioFreqData);
  const bins    = audioFreqData.length;
  const nyquist = audioCtx.sampleRate * 0.5;
  const binOf = (hz) => {
    const i = Math.round(hz / nyquist * bins);
    return Math.max(0, Math.min(bins, i));
  };
  const bassLo =   binOf(40),    bassHi = binOf(200);
  const midLo  =   bassHi,       midHi  = binOf(2000);
  const highLo =   midHi,        highHi = binOf(8000);
  audioBands.bass  = meanRange(audioFreqData, bassLo, bassHi) / 255;
  audioBands.mid   = meanRange(audioFreqData, midLo,  midHi)  / 255;
  audioBands.high  = meanRange(audioFreqData, highLo, highHi) / 255;
  audioBands.level = meanRange(audioFreqData, 0,      bins)   / 255;

  // Delta-based transient detection. Spectral-flux style: compare the fast
  // "short" envelope (last ~50ms peak) against a slow "long" baseline
  // (~1-2s moving average) and fire when short leads long by a fixed delta.
  // Earlier multiplicative threshold would lock out on tracks with sustained
  // energy once long caught up — on a bass-heavy track, detection just died
  // after a minute. Delta-based is adaptive and self-normalising.
  //   args: minLevel  — band must have at least this much energy to fire
  //         delta     — short must lead long by this amount
  //         pulseDecay — per-frame decay factor when not firing
  updateOnset(audioOnsets.bass,   audioBands.bass,   0.18, 0.10, 0.80);
  updateOnset(audioOnsets.mid,    audioBands.mid,    0.14, 0.08, 0.83);
  updateOnset(audioOnsets.high,   audioBands.high,   0.12, 0.06, 0.85);
}

function updateOnset(state, level, minLevel, delta, pulseDecay) {
  // Fast envelope: follows peaks, falls slowly so sustained energy reads.
  state.short = Math.max(state.short * 0.70, level);
  // Slow baseline: tracks average loudness. Capped so a permanently-loud
  // section doesn't hide all subsequent transients.
  state.long  = Math.min(state.long * 0.990 + level * 0.010, 0.45);
  // Fire when short peak is enough above the baseline AND band has real
  // energy. Delta is absolute, so it stays valid whether the section is
  // quiet (long ≈ 0.05) or loud (long ≈ 0.30).
  if (state.short > minLevel && state.short - state.long > delta) {
    state.pulse = 1.0;
  } else {
    state.pulse *= pulseDecay;
  }
}

function meanRange(arr, lo, hi) {
  if (hi <= lo) return 0;
  let s = 0;
  for (let i = lo; i < hi; i++) s += arr[i];
  return s / (hi - lo);
}

function updateAudioUi() {
  if (!audioUiEl) return;
  if (!audioEl) {
    audioUiEl.classList.add('hidden');
    if (tbPlayEl) tbPlayEl.hidden = !liveStream;
    if (tbPlayEl && liveStream) tbPlayEl.textContent = audioPlaying ? '⏸' : '▶';
    return;
  }
  audioUiEl.classList.remove('hidden');
  const dur = Number.isFinite(audioEl.duration) ? audioEl.duration : 0;
  const cur = Number.isFinite(audioEl.currentTime) ? audioEl.currentTime : 0;
  const pct = dur > 0 ? (cur / dur) * 100 : 0;
  if (audioFillEl)   audioFillEl.style.width  = pct + '%';
  if (audioHandleEl) audioHandleEl.style.left = pct + '%';
  if (tbPlayEl) {
    tbPlayEl.hidden = false;
    tbPlayEl.textContent = audioPlaying ? '⏸' : '▶';
  }
}

function formatTime(s) {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s - m * 60);
  return `${m}:${r < 10 ? '0' : ''}${r}`;
}

// ---------- overlays ----------

function setMetaOverlay(meta) {
  if (!meta) {
    metaEl.querySelector('.title').textContent = '';
    metaEl.querySelector('.sub').textContent = '';
    return;
  }
  metaEl.querySelector('.title').textContent = meta.title ?? meta.slug ?? '';
  const when = meta.created ? formatDate(meta.created) : '';
  metaEl.querySelector('.sub').textContent = [meta.slug, when].filter(Boolean).join(' · ');
}

function formatDate(iso) {
  try { return new Date(iso).toISOString().slice(0, 10); } catch { return ''; }
}

function showError(msg) {
  errorEl.classList.remove('hidden');
  errorEl.querySelector('.body').textContent = msg;
}
function clearError() {
  errorEl.classList.add('hidden');
}

function showFatal(msg) {
  const pre = document.createElement('pre');
  pre.style.color = '#ffb';
  pre.style.padding = '20px';
  pre.textContent = msg;
  document.body.replaceChildren(pre);
}

let idleTimer = null;
function wakeOverlays() {
  if (!hudOn) return;
  document.body.classList.add('active');
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => document.body.classList.remove('active'), 2500);
}
wakeOverlays();

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

// Help panel — Shift+H. Reveals the keyboard-synth row only when the
// current piece declares keyboard_synth.
const helpPanelEl  = document.getElementById('help-panel');
const helpInstrEl  = document.getElementById('help-instr');
const helpOctEl    = document.getElementById('help-oct');
const helpLoopEl   = document.getElementById('help-loop');
const helpKbdSection = document.querySelector('.help-keyboard');
function toggleHelpPanel() {
  if (!helpPanelEl) return;
  const wasHidden = helpPanelEl.classList.contains('hidden');
  if (wasHidden) {
    if (helpKbdSection) {
      helpKbdSection.classList.toggle('hidden', !pieceWantsKeyboardSynth());
    }
    refreshHelpState();
    helpPanelEl.classList.remove('hidden');
  } else {
    helpPanelEl.classList.add('hidden');
  }
}
function closeHelpPanel() {
  helpPanelEl?.classList.add('hidden');
}
function refreshHelpState() {
  if (!helpPanelEl || helpPanelEl.classList.contains('hidden')) return;
  if (!keyboardSynth) return;
  if (helpInstrEl) helpInstrEl.textContent = keyboardSynth.getInstrument();
  if (helpOctEl)   helpOctEl.textContent   = String(keyboardSynth.getOctaveOffset() / 12);
  if (helpLoopEl) {
    const state = keyboardSynth.getLooperState();
    const len = keyboardSynth.getLooperLength();
    helpLoopEl.textContent = state === 'empty' ? 'empty'
                          : state === 'recording' ? 'recording...'
                          : `${state} (${len.toFixed(1)}s)`;
  }
}

function toggleHud() {
  hudOn = !hudOn;
  document.body.classList.toggle('hud-off', !hudOn);
}

// ---------- sizing ----------

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const s = renderScale;
  const newW = Math.max(1, Math.floor(canvas.clientWidth  * dpr * s));
  const newH = Math.max(1, Math.floor(canvas.clientHeight * dpr * s));
  const changed = canvas.width !== newW || canvas.height !== newH;
  canvas.width  = newW;
  canvas.height = newH;
  if (changed && currentPipeline) reallocPipelineTargets(currentPipeline);
  if (changed && currentLayerEngine) reallocLayerEngineTargets(currentLayerEngine);
  gestures.setRefSize(Math.min(canvas.clientWidth, canvas.clientHeight) || 1);
}

// ---------- record mode (used by bin/publish.mjs via Playwright) ----------

function exposeRecordingHooks() {
  document.body.classList.add('hud-off');
  window.__vj = window.__vj ?? {};
  // inspect-music hooks: bin/inspect-music.mjs seeks audioEl.currentTime to
  // section anchors (intro/verse/peak/quiet/outro) so critic agents see
  // visually distinct moments rather than wall-clock frames.
  window.__vj.seekAudio = async (t) => {
    if (!audioEl) return { ok: false, reason: 'no-audio' };
    audioEl.currentTime = Math.max(0, Math.min(audioEl.duration || t, t));
    if (audioEl.paused) { try { await audioEl.play(); } catch {} }
    return { ok: true, at: audioEl.currentTime, duration: audioEl.duration };
  };
  window.__vj.getAudioTime = () => audioEl ? audioEl.currentTime : null;
  window.__vj.isAudioReady = () => Boolean(audioEl) && audioEl.readyState >= 2;
  window.__vj.waitForAudio = (timeoutMs = 5000) => new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    (function tick() {
      if (audioEl && audioEl.readyState >= 2) return resolve(true);
      if (Date.now() > deadline) return resolve(false);
      setTimeout(tick, 50);
    })();
  });
  window.__vj.record = async (durationMs = 10000) => {
    const waited = await waitForProgram(5000);
    if (!waited) throw new Error('no program compiled in time');
    startTime = performance.now();
    // Record via a 2D mirror canvas, not the WebGL canvas directly: FBO
    // pipelines (layers:/passes:) present via blitFramebuffer, which does
    // not mark the canvas dirty under SwiftShader, so captureStream on the
    // GL canvas yields an empty webm (110-byte EBML header — 2026-06-11
    // regression hunt; requestFrame() pumping didn't help either). Copying
    // each frame into a 2D canvas restores reliable dirty tracking and a
    // software-encode-friendly source.
    const mirror = document.createElement('canvas');
    mirror.width = canvas.width;
    mirror.height = canvas.height;
    const mctx = mirror.getContext('2d');
    const stream = mirror.captureStream(60);
    const chunks = [];
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 12_000_000 });
    rec.ondataavailable = (e) => e.data && e.data.size > 0 && chunks.push(e.data);
    return new Promise((resolve, reject) => {
      let rafId = 0;
      const pump = () => {
        mctx.drawImage(canvas, 0, 0);
        rafId = requestAnimationFrame(pump);
      };
      rec.onstop = async () => {
        cancelAnimationFrame(rafId);
        const blob = new Blob(chunks, { type: 'video/webm' });
        const buf = await blob.arrayBuffer();
        resolve(Array.from(new Uint8Array(buf)));
      };
      rec.onerror = (e) => { cancelAnimationFrame(rafId); reject(e); };
      // 250ms timeslice: without it this Chromium's single flush-at-stop
      // delivers an empty blob (the other half of the 110-byte-webm bug).
      rec.start(250);
      rafId = requestAnimationFrame(pump);
      setTimeout(() => rec.stop(), durationMs);
    });
  };
}

function waitForProgram(timeoutMs) {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    (function tick() {
      if (currentProgram) return resolve(true);
      if (Date.now() > deadline) return resolve(false);
      setTimeout(tick, 50);
    })();
  });
}
