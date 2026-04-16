// ABOUTME: Studio browser runtime — WebGL2 full-screen quad, fragment shader
// ABOUTME: hot-reload via mtime polling, keyboard navigation, optional record mode.

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
const fpsEl = document.getElementById('fps');
const audioUiEl       = document.getElementById('audio-ui');
const audioProgressEl = document.getElementById('audio-progress');
const audioFillEl     = document.getElementById('audio-progress-fill');
const audioHandleEl   = document.getElementById('audio-progress-handle');
const audioTooltipEl  = document.getElementById('audio-progress-tooltip');

const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: true });
if (!gl) {
  showFatal('WebGL2 required.');
  throw new Error('no webgl2');
}

let currentProgram = null;
let currentUniforms = {};
let currentSlug = null;
let currentMeta = null;
let currentMtime = 0;
let startTime = performance.now();
let frameCount = 0;
let mouse = [0, 0];
let catalog = [];
let hudOn = true;
let renderScale = 1.0;
let fpsSamples = [];
let lastFrameT = performance.now();
let userOverride = false;

// Audio plumbing — created lazily on first user gesture.
let audioEl        = null;
let audioCtx       = null;
let audioSource    = null;
let audioAnalyser  = null;
let audioFreqData  = null;
let audioBands     = { level: 0, bass: 0, mid: 0, high: 0 };
let audioPlaying   = false;
let audioKey       = null;   // `${slug}:${filename}` to detect piece changes

resize();
window.addEventListener('resize', resize);

const quad = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quad);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

document.body.classList.add('active');
window.addEventListener('mousemove', (e) => {
  mouse = [e.clientX, canvas.clientHeight - e.clientY];
  wakeOverlays();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') { cycle(+1); e.preventDefault(); }
  else if (e.key === 'ArrowLeft') { cycle(-1); e.preventDefault(); }
  else if (e.key === 'r' || e.key === 'R') startTime = performance.now();
  else if (e.key === 'h' || e.key === 'H') toggleHud();
  else if (e.key === 'c' || e.key === 'C') toggleCatalog();
  else if (e.key === 'Escape') closeCatalog();
  else if (e.key === ' ') {
    if (audioEl) { toggleAudio(); e.preventDefault(); }
  }
});

canvas.addEventListener('click', () => {
  if (audioEl && audioEl.paused) toggleAudio();
});

let scrubbing = false;
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
  audioProgressEl.addEventListener('mousedown', (e) => {
    scrubbing = true;
    audioProgressEl.classList.add('dragging');
    seekFromEvent(e);
    updateTooltipFromEvent(e);
    e.preventDefault();
  });
  audioProgressEl.addEventListener('mousemove', updateTooltipFromEvent);
  window.addEventListener('mousemove', (e) => {
    if (!scrubbing) return;
    seekFromEvent(e);
    updateTooltipFromEvent(e);
  });
  window.addEventListener('mouseup', () => {
    if (!scrubbing) return;
    scrubbing = false;
    audioProgressEl.classList.remove('dragging');
  });
}

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
    fpsEl.textContent = `${Math.round(1000 / avg)} fps`;
  }

  // If the piece is audio-driven and audio is playing, advance time from the
  // audio clock so the visual is reproducible against the track's timeline.
  const useAudioTime = currentMeta?.audio
                    && (currentMeta?.time_source ?? 'audio') === 'audio'
                    && audioEl;
  const now = useAudioTime
    ? audioEl.currentTime
    : (performance.now() - startTime) / 1000;

  sampleAudio();
  updateAudioUi();

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  if (currentProgram) {
    gl.useProgram(currentProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    const loc = gl.getAttribLocation(currentProgram, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    setUniform2f('u_resolution', gl.drawingBufferWidth, gl.drawingBufferHeight);
    setUniform1f('u_time', now);
    // Scale mouse from CSS pixels into framebuffer pixels so it shares
    // the coordinate system with gl_FragCoord / u_resolution.
    const mx = gl.drawingBufferWidth  / Math.max(1, canvas.clientWidth);
    const my = gl.drawingBufferHeight / Math.max(1, canvas.clientHeight);
    setUniform2f('u_mouse', mouse[0] * mx, mouse[1] * my);
    setUniform1i('u_frame', frameCount);

    setUniform1f('u_audio_level',   audioBands.level);
    setUniform1f('u_audio_bass',    audioBands.bass);
    setUniform1f('u_audio_mid',     audioBands.mid);
    setUniform1f('u_audio_high',    audioBands.high);
    setUniform1f('u_audio_playing', audioPlaying ? 1.0 : 0.0);
    setUniform1f('u_audio_time',    audioEl ? audioEl.currentTime : 0.0);

    for (const u of currentMeta?.uniforms ?? []) {
      applyCustomUniform(u);
    }

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
    gl.deleteShader(s);
    throw new Error(log || 'shader compile failed');
  }
  return s;
}

function hoistVersion(src) {
  const m = src.match(/^[ \t]*#version[^\n]*\n/m);
  if (!m || src.startsWith(m[0])) return src;
  return m[0] + src.replace(m[0], '');
}

function buildProgram(fragSource) {
  const vs = compileShader(gl.VERTEX_SHADER, VERT);
  const fs = compileShader(gl.FRAGMENT_SHADER, hoistVersion(fragSource));
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
  if (currentProgram) gl.deleteProgram(currentProgram);
  currentProgram = prog;
  currentUniforms = {};
  startTime = performance.now();
}

// ---------- piece loading ----------

async function refreshCatalog() {
  try {
    catalog = await (await fetch('/api/catalog')).json();
  } catch { catalog = []; }
}

async function loadCurrent({ initial } = {}) {
  const slug = FORCED_SLUG ?? await fetchCurrentSlug();
  if (!slug) {
    if (initial) swapProgram(buildProgram(FALLBACK_FRAG));
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

    const prog = buildProgram(frag);
    swapProgram(prog);
    currentMeta = meta;
    currentSlug = slug;
    currentMtime = mtime;
    const rs = Number(meta?.render_scale);
    renderScale = (Number.isFinite(rs) && rs > 0 && rs <= 2) ? rs : 1.0;
    resize();
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

async function openCatalog() {
  if (!catalogEl || !catalogInner) return;
  await refreshCatalog();
  catalogInner.replaceChildren();
  for (const p of catalog) {
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
    card.addEventListener('click', () => {
      userOverride = true;
      loadPiece(p.slug);
      closeCatalog();
    });
    catalogInner.appendChild(card);
  }
  catalogEl.classList.remove('hidden');
}

function closeCatalog() {
  catalogEl?.classList.add('hidden');
}

// ---------- audio ----------

function attachAudio(slug, meta) {
  const filename = meta?.audio;
  if (!filename) { detachAudio(); return; }
  const key = `${slug}:${filename}`;
  if (audioKey === key && audioEl) { updateAudioUi(); return; }  // already attached

  detachAudio();

  audioEl = new Audio();
  audioEl.crossOrigin = 'anonymous';
  audioEl.loop        = !!meta.audio_loop;
  audioEl.preload     = 'auto';
  audioEl.src = `/api/pieces/${encodeURIComponent(slug)}/file/${encodeURIComponent(filename)}`;
  audioEl.addEventListener('play',   () => { audioPlaying = true;  updateAudioUi(); });
  audioEl.addEventListener('pause',  () => { audioPlaying = false; updateAudioUi(); });
  audioEl.addEventListener('ended',  () => { audioPlaying = false; updateAudioUi(); });
  audioKey = key;
  audioUiEl?.classList.remove('hidden');
  updateAudioUi();
}

function detachAudio() {
  if (audioEl) {
    try { audioEl.pause(); } catch {}
    audioEl.src = '';
    audioEl = null;
  }
  if (audioSource) {
    try { audioSource.disconnect(); } catch {}
    audioSource = null;
  }
  audioKey     = null;
  audioPlaying = false;
  audioBands   = { level: 0, bass: 0, mid: 0, high: 0 };
  audioUiEl?.classList.add('hidden');
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
    return;
  }
  audioUiEl.classList.remove('hidden');
  const dur = Number.isFinite(audioEl.duration) ? audioEl.duration : 0;
  const cur = Number.isFinite(audioEl.currentTime) ? audioEl.currentTime : 0;
  const pct = dur > 0 ? (cur / dur) * 100 : 0;
  if (audioFillEl)   audioFillEl.style.width  = pct + '%';
  if (audioHandleEl) audioHandleEl.style.left = pct + '%';
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

function toggleHud() {
  hudOn = !hudOn;
  document.body.classList.toggle('hud-off', !hudOn);
}

// ---------- sizing ----------

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const s = renderScale;
  canvas.width  = Math.max(1, Math.floor(canvas.clientWidth  * dpr * s));
  canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr * s));
}

// ---------- record mode (used by bin/publish.mjs via Playwright) ----------

function exposeRecordingHooks() {
  document.body.classList.add('hud-off');
  window.__vj = window.__vj ?? {};
  window.__vj.record = async (durationMs = 10000) => {
    const waited = await waitForProgram(5000);
    if (!waited) throw new Error('no program compiled in time');
    startTime = performance.now();
    const stream = canvas.captureStream(60);
    const chunks = [];
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 12_000_000 });
    rec.ondataavailable = (e) => e.data && e.data.size > 0 && chunks.push(e.data);
    return new Promise((resolve, reject) => {
      rec.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const buf = await blob.arrayBuffer();
        resolve(Array.from(new Uint8Array(buf)));
      };
      rec.onerror = reject;
      rec.start();
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
