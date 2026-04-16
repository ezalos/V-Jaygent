// ABOUTME: Studio browser runtime — WebGL2 full-screen quad, fragment shader
// ABOUTME: hot-reload via mtime polling, keyboard navigation, optional record mode.

import { createBilliards } from './billiards.mjs';

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
const FORMAT_MAP = {
  rgba8:   () => ({ iFormat: gl.RGBA8,   format: gl.RGBA, type: gl.UNSIGNED_BYTE }),
  rgba16f: () => ({ iFormat: gl.RGBA16F, format: gl.RGBA, type: gl.HALF_FLOAT }),
  rgba32f: () => ({ iFormat: gl.RGBA32F, format: gl.RGBA, type: gl.FLOAT }),
};

let currentProgram = null;
let currentUniforms = {};
let currentPipeline = null;
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

// Billiard-ball sim: 4 elastic disks passed to shaders via
// `uniform vec2 u_ball_pos[4]` and `uniform float u_ball_hit[4]`. Physics +
// packing live in studio/billiards.mjs; shader primitives in lib/billiards.glsl.
// Collision radius MUST equal the shader-side disk radius.
const billiards = createBilliards({ radius: 0.26, boundsMargin: 0.96 });

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
  const ballAspect = (canvas.clientWidth || 1) / Math.max(canvas.clientHeight, 1);
  billiards.step(now, ballAspect);

  if (currentPipeline) {
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
  currentPipeline = null;
  if (currentProgram) gl.deleteProgram(currentProgram);
  currentProgram = prog;
  currentUniforms = {};
  startTime = performance.now();
}

function swapPipeline(pipeline) {
  freePipeline(currentPipeline);
  if (currentProgram) gl.deleteProgram(currentProgram);
  currentProgram = null;
  currentUniforms = {};
  currentPipeline = pipeline;
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
    freeTarget(pass.target);
  }
}

async function buildPipeline(slug, passSpecs) {
  const passes = [];
  try {
    for (const p of passSpecs) {
      if (typeof p.name !== 'string' || !p.name) throw new Error('pass.name required');
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
  setUniform1f('u_audio_playing', audioPlaying ? 1.0 : 0.0);
  setUniform1f('u_audio_time',    audioEl ? audioEl.currentTime : 0.0);
  setUniform2fv('u_ball_pos',     billiards.posArray);
  setUniform1fv('u_ball_hit',     billiards.hitArray);
  setUniform2fv('u_ball_hit_pos', billiards.hitPosArray);
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

    // Drop any cached lib sources so edits to lib/*.glsl propagate. The cache
    // persists within a single compile (dedupes repeated #include of the same
    // module) but not across compiles.
    clearLibCache();

    // render_scale must be applied before building the pipeline so FBO
    // allocations use the correct canvas pixel dims.
    const rs = Number(meta?.render_scale);
    renderScale = (Number.isFinite(rs) && rs > 0 && rs <= 2) ? rs : 1.0;
    resize();

    if (Array.isArray(meta?.passes) && meta.passes.length > 0) {
      const pipeline = await buildPipeline(slug, meta.passes);
      swapPipeline(pipeline);
    } else {
      const prog = buildProgram(await preprocessShader(frag));
      swapProgram(prog);
    }
    currentMeta = meta;
    currentSlug = slug;
    currentMtime = mtime;
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

  // Try to start immediately. Most browsers block this (no user gesture yet)
  // and silently reject; the first-gesture listener below catches up.
  tryAutoplay();
  armFirstGestureAutoplay();
}

// Try to start the current audio element, swallowing the browser's autoplay
// block. Safe to call multiple times and safe when no audio is attached.
async function tryAutoplay() {
  if (!audioEl || !audioEl.paused) return;
  await ensureAudioContext();
  try { await audioEl.play(); } catch {}
}

let autoplayArmed = false;
// Install a global first-gesture listener that attempts to start audio. Once
// audio is actually playing, subsequent triggers become no-ops (audioEl.paused
// is false), so this is safe to leave armed for the session.
function armFirstGestureAutoplay() {
  if (autoplayArmed) return;
  autoplayArmed = true;
  const kick = () => { tryAutoplay(); };
  // Gestures that browsers treat as "user activation" for the autoplay policy.
  window.addEventListener('pointerdown', kick);
  window.addEventListener('keydown',     kick);
  window.addEventListener('touchstart',  kick, { passive: true });
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
  const newW = Math.max(1, Math.floor(canvas.clientWidth  * dpr * s));
  const newH = Math.max(1, Math.floor(canvas.clientHeight * dpr * s));
  const changed = canvas.width !== newW || canvas.height !== newH;
  canvas.width  = newW;
  canvas.height = newH;
  if (changed && currentPipeline) reallocPipelineTargets(currentPipeline);
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
