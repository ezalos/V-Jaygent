// ABOUTME: Studio HTTP server — serves the live page and exposes catalog/current/
// ABOUTME: shader/meta/mtime endpoints read from a plain directory of pieces.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat, readdir } from 'node:fs/promises';
import { join, extname, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { createStats } from './stats.mjs';

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const LIB_FILE_RE = /^[a-zA-Z0-9_-]+\.glsl$/;
const LAYER_NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
const STUDIO_DIR = fileURLToPath(new URL('.', import.meta.url));
const LIB_DIR    = fileURLToPath(new URL('../lib/', import.meta.url));
const LAYERS_DIR = fileURLToPath(new URL('../layers/', import.meta.url));
const CRITIQUES_DIR = fileURLToPath(new URL('../brainstorming/critiques/', import.meta.url));

const STATIC_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
};

const FILE_MIME = {
  '.mp3':  'audio/mpeg',
  '.m4a':  'audio/mp4',
  '.ogg':  'audio/ogg',
  '.opus': 'audio/ogg',
  '.wav':  'audio/wav',
  '.webm': 'audio/webm',
  '.flac': 'audio/flac',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

const FILENAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export function createStudioServer({ piecesDir, studioDir = STUDIO_DIR, libDir = LIB_DIR, layersDir = LAYERS_DIR, critiquesDir = CRITIQUES_DIR, stats = null, statsToken = null } = {}) {
  if (!piecesDir) throw new Error('piecesDir is required');
  const piecesRoot = resolvePath(piecesDir);
  const libRoot    = resolvePath(libDir);
  const layersRoot = resolvePath(layersDir);
  const critiquesRoot = resolvePath(critiquesDir);

  return createServer(async (req, res) => {
    try {
      await handle(req, res, { piecesRoot, libRoot, layersRoot, critiquesRoot, studioDir, stats, statsToken });
    } catch (err) {
      console.error('[studio]', err);
      send(res, 500, 'text/plain', 'internal error');
    }
  });
}

async function handle(req, res, { piecesRoot, libRoot, layersRoot, critiquesRoot, studioDir, stats, statsToken }) {
  if (req.method !== 'GET') return send(res, 405, 'text/plain', 'method not allowed');

  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;

  if (path === '/') {
    if (stats) stats.record(req, null);
    return serveStatic(res, studioDir, 'index.html');
  }
  if (path === '/runtime.mjs')       return serveStatic(res, studioDir, 'runtime.mjs');
  if (path === '/styles.css')        return serveStatic(res, studioDir, 'styles.css');
  // Runtime-side modules imported by runtime.mjs. Allow-listed so the server
  // only serves expected files (no directory enumeration via `/<foo>.mjs`).
  if (path === '/billiards.mjs')     return serveStatic(res, studioDir, 'billiards.mjs');
  if (path === '/gestures.mjs')      return serveStatic(res, studioDir, 'gestures.mjs');
  if (path === '/audio-analysis.mjs') return serveStatic(res, studioDir, 'audio-analysis.mjs');
  if (path === '/keyboard-music.mjs') return serveStatic(res, studioDir, 'keyboard-music.mjs');

  // `/<slug>` → serve the studio page if <slug> is a valid piece directory.
  // Runtime reads location.pathname to pin the displayed piece.
  const slugOnly = path.match(/^\/([a-z0-9][a-z0-9-]*)$/);
  if (slugOnly) {
    const candidate = slugOnly[1];
    const st = await stat(join(piecesRoot, candidate)).catch(() => null);
    if (st && st.isDirectory()) {
      if (stats) stats.record(req, candidate);
      return serveStatic(res, studioDir, 'index.html');
    }
  }

  if (path === '/api/stats')         return apiStats(req, res, url, stats, statsToken);
  if (path === '/api/catalog')       return apiCatalog(res, piecesRoot);
  if (path === '/api/current')       return apiCurrent(res, piecesRoot);
  if (path === '/api/critic-summary') return apiCriticSummary(res, critiquesRoot);
  if (path === '/api/critiques')      return apiAllCritiques(res, critiquesRoot);

  // Probe definitions for the grades-view tooltips — verbatim excerpts from
  // taste.md, curated in studio/probe-info.json.
  if (path === '/api/probe-info') {
    const body = await readFile(join(studioDir, 'probe-info.json')).catch(() => null);
    if (body === null) return send(res, 404, 'text/plain', 'not found');
    return send(res, 200, 'application/json; charset=utf-8', body);
  }

  // Per-piece critic history — every critique for the slug, structured data
  // parsed from the YAML tail each critique ends with (see vjay-iterate skill).
  const critiquesMatch = path.match(/^\/api\/pieces\/([^/]+)\/critiques$/);
  if (critiquesMatch) {
    const slug = decodeURIComponent(critiquesMatch[1]);
    if (!SLUG_RE.test(slug)) return send(res, 404, 'text/plain', 'not found');
    return apiPieceCritiques(res, critiquesRoot, slug);
  }

  // Evidence snapshots — the exact frames a critique was graded from, copied
  // to brainstorming/critiques/evidence/<slug-vN>/ at critique time (inspect
  // frames get overwritten by later runs; these don't).
  const evidenceMatch = path.match(/^\/api\/critiques\/evidence\/([^/]+)\/([^/]+)$/);
  if (evidenceMatch) {
    const dir = decodeURIComponent(evidenceMatch[1]);
    const name = decodeURIComponent(evidenceMatch[2]);
    if (!SLUG_RE.test(dir) || !FILENAME_RE.test(name)) {
      return send(res, 404, 'text/plain', 'not found');
    }
    const body = await readFile(join(critiquesRoot, 'evidence', dir, name)).catch(() => null);
    if (body === null) return send(res, 404, 'text/plain', 'not found');
    const mime = FILE_MIME[extname(name)] ?? 'application/octet-stream';
    return send(res, 200, mime, body);
  }

  // Raw critique markdown, for "read the full critique" links.
  const critiqueFileMatch = path.match(/^\/api\/critiques\/([^/]+)$/);
  if (critiqueFileMatch) {
    const name = decodeURIComponent(critiqueFileMatch[1]);
    if (!FILENAME_RE.test(name) || !name.endsWith('.md')) {
      return send(res, 404, 'text/plain', 'not found');
    }
    const body = await readFile(join(critiquesRoot, name)).catch(() => null);
    if (body === null) return send(res, 404, 'text/plain', 'not found');
    return send(res, 200, 'text/plain; charset=utf-8', body);
  }

  const pieceMatch = path.match(/^\/api\/pieces\/([^/]+)\/(shader\.frag|meta|mtime|analysis)$/);
  if (pieceMatch) {
    const slug = decodeURIComponent(pieceMatch[1]);
    const part = pieceMatch[2];
    if (!SLUG_RE.test(slug)) return send(res, 404, 'text/plain', 'not found');
    return apiPiecePart(res, piecesRoot, libRoot, slug, part);
  }

  // A pass shader lives next to shader.frag in the piece directory, named via
  // meta.yaml's passes[].shader field. Serve it through a dedicated endpoint
  // so the client can reach it without guessing filenames up-front.
  const passMatch = path.match(/^\/api\/pieces\/([^/]+)\/pass\/([A-Za-z0-9_.-]+)$/);
  if (passMatch) {
    const slug = decodeURIComponent(passMatch[1]);
    const name = decodeURIComponent(passMatch[2]);
    if (!SLUG_RE.test(slug) || !FILENAME_RE.test(name) || !name.endsWith('.frag')) {
      return send(res, 404, 'text/plain', 'not found');
    }
    return apiPassShader(res, piecesRoot, slug, name);
  }

  // lib/*.glsl — shared GLSL modules, #include'd from piece shaders. Flat layout,
  // strict filename regex so no traversal or exotic paths.
  const libMatch = path.match(/^\/api\/lib\/([^/]+)$/);
  if (libMatch) {
    const name = decodeURIComponent(libMatch[1]);
    if (!LIB_FILE_RE.test(name)) return send(res, 404, 'text/plain', 'not found');
    return apiLibFile(res, libRoot, name);
  }

  const fileMatch = path.match(/^\/api\/pieces\/([^/]+)\/file\/([^/]+)$/);
  if (fileMatch) {
    const slug = decodeURIComponent(fileMatch[1]);
    const name = decodeURIComponent(fileMatch[2]);
    if (!SLUG_RE.test(slug) || !FILENAME_RE.test(name)) {
      return send(res, 404, 'text/plain', 'not found');
    }
    return apiPieceFile(req, res, piecesRoot, slug, name);
  }

  // Piece-local layer with global fallback. Resolution order:
  //   pieces/<slug>/layers/<name>/<part>  →  layers/<name>/<part>
  // <part> is shader.frag or meta.yaml. The runtime always uses this route
  // when loading a piece's declared layer stack.
  const pieceLayerMatch = path.match(/^\/api\/pieces\/([^/]+)\/layer\/([^/]+)\/(shader\.frag|meta)$/);
  if (pieceLayerMatch) {
    const slug = decodeURIComponent(pieceLayerMatch[1]);
    const layerName = decodeURIComponent(pieceLayerMatch[2]);
    const part = pieceLayerMatch[3];
    if (!SLUG_RE.test(slug) || !LAYER_NAME_RE.test(layerName)) {
      return send(res, 404, 'text/plain', 'not found');
    }
    return apiPieceLayer(res, piecesRoot, layersRoot, slug, layerName, part);
  }

  // Global layers/<name>/<part>. No piece context, no fallback. Used by the
  // smoke test and ingestion CLI to exercise layers in isolation.
  const layerMatch = path.match(/^\/api\/layers\/([^/]+)\/(shader\.frag|meta)$/);
  if (layerMatch) {
    const layerName = decodeURIComponent(layerMatch[1]);
    const part = layerMatch[2];
    if (!LAYER_NAME_RE.test(layerName)) return send(res, 404, 'text/plain', 'not found');
    return apiLayer(res, layersRoot, layerName, part);
  }

  send(res, 404, 'text/plain', 'not found');
}

async function serveStatic(res, dir, name) {
  try {
    const body = await readFile(join(dir, name));
    const mime = STATIC_MIME[extname(name)] ?? 'application/octet-stream';
    send(res, 200, mime, body);
  } catch {
    send(res, 404, 'text/plain', 'not found');
  }
}

// Capability badges for the catalog. Each is read from an authoritative
// meta.yaml field: sound from `audio:`, keyboard from `keyboard_synth:`,
// cursor from the explicit `cursor:` field (backfilled by bin/backfill-cursor.mjs,
// emitted by bin/new-piece.mjs going forward).
function capabilitiesOf(meta) {
  return {
    sound: Boolean(meta?.audio),
    cursor: meta?.cursor === true,
    keyboard: meta?.keyboard_synth === true,
  };
}

async function apiCatalog(res, piecesRoot) {
  const entries = await readdir(piecesRoot, { withFileTypes: true }).catch(() => []);
  const pieces = [];
  for (const e of entries) {
    if (!e.isDirectory() || !SLUG_RE.test(e.name)) continue;
    const meta = await loadMeta(piecesRoot, e.name);
    if (meta) pieces.push({ slug: e.name, ...meta, capabilities: capabilitiesOf(meta) });
  }
  // js-yaml parses `created:` timestamps into Date objects, whose String()
  // form starts with the day-of-week name — never compare those lexically.
  pieces.sort((a, b) => createdMs(b) - createdMs(a));
  sendJson(res, 200, pieces);
}

function createdMs(meta) {
  const v = meta?.created;
  if (v instanceof Date) return v.getTime();
  const t = Date.parse(String(v ?? ''));
  return Number.isFinite(t) ? t : 0;
}

// ---------- critic grades ----------
// Critiques live in brainstorming/critiques/<slug>-<version>.md where
// <version> is vN, vN-iM, vN-blocked, or blocked. Each ends with a fenced
// ```yaml tail (the vjay-iterate skill contract): verdict, claim_check,
// per-probe pass/fail/weak groups, six dimension scores, top_fix. Critiques
// that predate the contract are prose-only — for those we scrape the verdict
// from the "## Verdict" heading (or "**status:**" metadata) and mark the
// entry structured: false.

const CRITIQUE_VERSION_RE = /^(?:v(\d+)(?:-i(\d+))?(?:-blocked)?|blocked)$/;
const VERDICTS = ['chef-doeuvre', 'ship-it', 'needs-tweak', 'structural-rethink', 'premise-wrong', 'blocked', 'shipped'];
const PROBE_GROUPS = ['mesmerizing', 'interaction', 'music', 'song_level', 'dual_input', 'layered'];

// Sort key for critique versions: bare "blocked" predates v1.
function critiqueOrder(version) {
  const m = version.match(CRITIQUE_VERSION_RE);
  if (!m || m[1] === undefined) return [0, 0];
  return [Number(m[1]), Number(m[2] ?? 0)];
}

function normalizeVerdict(text) {
  const flat = text.toLowerCase().replace(/['’]/g, '').replace(/œ/g, 'oe');
  return VERDICTS.find((v) => flat.includes(v)) ?? null;
}

// Mean of the numeric dimension scores ("n/a" entries excluded), 1 decimal.
function compositeOf(scores) {
  if (!scores || typeof scores !== 'object') return null;
  const nums = Object.values(scores).filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function parseCritique(raw, file, version) {
  const entry = {
    file,
    version,
    structured: false,
    verdict: null,
    claim_check: null,
    iteration: null,
    probes: {},
    passes: {},
    scores: null,
    composite: null,
    top_fix: null,
    evidence: [],
  };

  const fences = [...raw.matchAll(/```yaml\s*\n([\s\S]*?)\n```/g)];
  if (fences.length > 0) {
    try {
      const data = yaml.load(fences[fences.length - 1][1]);
      if (data && typeof data === 'object') {
        entry.structured = true;
        entry.verdict = typeof data.verdict === 'string' ? normalizeVerdict(data.verdict) ?? data.verdict : null;
        entry.claim_check = data.claim_check ?? null;
        entry.iteration = data.iteration ?? null;
        entry.scores = data.scores ?? null;
        entry.composite = compositeOf(data.scores);
        entry.top_fix = data.top_fix ?? null;
        // Evidence paths are relative to the critiques dir and must point
        // inside evidence/<dir>/ — anything else is dropped, not served.
        if (Array.isArray(data.evidence)) {
          entry.evidence = data.evidence.filter((p) =>
            typeof p === 'string' && /^evidence\/[a-z0-9][a-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(p));
        }
        for (const g of PROBE_GROUPS) {
          if (data[`${g}_probes`] && typeof data[`${g}_probes`] === 'object') {
            entry.probes[g] = data[`${g}_probes`];
          }
          if (data[`${g}_passes`] !== undefined) entry.passes[g] = data[`${g}_passes`];
        }
        // mesmerizing_passes is the historical name for the first group's count.
        if (data.mesmerizing_passes !== undefined) entry.passes.mesmerizing = data.mesmerizing_passes;
        return entry;
      }
    } catch {}
  }

  // Prose-only critique: take the text following a "## Verdict" heading
  // (the verdict is either on the heading line or in the next paragraph),
  // else the "**status:**" metadata line.
  const heading = raw.match(/^#+\s*Verdict:?[^\n]*\n?([\s\S]{0,300})/mi);
  const status = raw.match(/\*\*status:\*\*\s*([^\n]+)/i);
  entry.verdict = normalizeVerdict((heading ? heading[0] : '') + ' ' + (status ? status[1] : ''));
  return entry;
}

async function critiqueFilesBySlug(critiquesRoot) {
  const entries = await readdir(critiquesRoot).catch(() => []);
  const bySlug = new Map();
  for (const name of entries) {
    const m = name.match(/^([a-z0-9-]+?)-(v\d+(?:-i\d+)?(?:-blocked)?|blocked)\.md$/);
    if (!m || !SLUG_RE.test(m[1])) continue;
    if (!bySlug.has(m[1])) bySlug.set(m[1], []);
    bySlug.get(m[1]).push({ file: name, version: m[2] });
  }
  for (const list of bySlug.values()) {
    list.sort((a, b) => {
      const [av, ai] = critiqueOrder(a.version);
      const [bv, bi] = critiqueOrder(b.version);
      return av - bv || ai - bi;
    });
  }
  return bySlug;
}

// All critiques for one piece, oldest → newest, with structured data.
async function apiPieceCritiques(res, critiquesRoot, slug) {
  const bySlug = await critiqueFilesBySlug(critiquesRoot);
  const files = bySlug.get(slug) ?? [];
  const critiques = [];
  for (const { file, version } of files) {
    const raw = await readFile(join(critiquesRoot, file), 'utf8').catch(() => null);
    if (raw === null) continue;
    critiques.push(parseCritique(raw, file, version));
  }
  sendJson(res, 200, { slug, critiques });
}

// Every critique of every piece, grouped by slug — one call for the
// all-pieces grades list.
async function apiAllCritiques(res, critiquesRoot) {
  const bySlug = await critiqueFilesBySlug(critiquesRoot);
  const out = {};
  for (const [slug, files] of bySlug) {
    const critiques = [];
    for (const { file, version } of files) {
      const raw = await readFile(join(critiquesRoot, file), 'utf8').catch(() => null);
      if (raw === null) continue;
      critiques.push(parseCritique(raw, file, version));
    }
    if (critiques.length > 0) out[slug] = critiques;
  }
  sendJson(res, 200, out);
}

// Latest verdict per slug — one cheap call for catalog chips. Only the
// newest critique of each piece is parsed.
async function apiCriticSummary(res, critiquesRoot) {
  const bySlug = await critiqueFilesBySlug(critiquesRoot);
  const summary = {};
  for (const [slug, files] of bySlug) {
    const latest = files[files.length - 1];
    const raw = await readFile(join(critiquesRoot, latest.file), 'utf8').catch(() => null);
    if (raw === null) continue;
    const c = parseCritique(raw, latest.file, latest.version);
    summary[slug] = {
      verdict: c.verdict,
      version: c.version,
      composite: c.composite,
      mesmerizing_passes: c.passes.mesmerizing ?? null,
      claim_check: c.claim_check,
      count: files.length,
    };
  }
  sendJson(res, 200, summary);
}

function apiStats(req, res, url, stats, requiredToken) {
  if (!stats) return send(res, 404, 'text/plain', 'not found');
  if (requiredToken) {
    const provided = url.searchParams.get('token')
      ?? (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
    if (provided !== requiredToken) return send(res, 401, 'text/plain', 'unauthorized');
  }
  return sendJson(res, 200, stats.summary());
}

async function apiCurrent(res, piecesRoot) {
  const slug = await readCurrentSlug(piecesRoot);
  if (!slug) return sendJson(res, 200, { slug: null, meta: null });
  const meta = await loadMeta(piecesRoot, slug);
  if (!meta) return sendJson(res, 200, { slug: null, meta: null });
  sendJson(res, 200, { slug, meta });
}

async function apiPiecePart(res, piecesRoot, libRoot, slug, part) {
  const pieceDir = join(piecesRoot, slug);
  const st = await stat(pieceDir).catch(() => null);
  if (!st || !st.isDirectory()) return send(res, 404, 'text/plain', 'not found');

  if (part === 'shader.frag') {
    const body = await readFile(join(pieceDir, 'shader.frag')).catch(() => null);
    if (body === null) return send(res, 404, 'text/plain', 'not found');
    return send(res, 200, 'text/plain; charset=utf-8', body);
  }

  if (part === 'meta') {
    const meta = await loadMeta(piecesRoot, slug);
    if (!meta) return send(res, 404, 'text/plain', 'not found');
    return sendJson(res, 200, { slug, ...meta });
  }

  if (part === 'mtime') {
    const mtime = await pieceMtime(pieceDir, libRoot);
    if (mtime === null) return send(res, 404, 'text/plain', 'not found');
    return sendJson(res, 200, { mtime });
  }

  if (part === 'analysis') {
    // audio.analysis.json — produced by bin/analyze-audio.mjs. Optional;
    // 404 if missing means the runtime falls back to FFT-only audio.
    const body = await readFile(join(pieceDir, 'audio.analysis.json')).catch(() => null);
    if (body === null) return send(res, 404, 'text/plain', 'not found');
    return send(res, 200, 'application/json; charset=utf-8', body);
  }
}

async function apiPassShader(res, piecesRoot, slug, name) {
  const filePath = join(piecesRoot, slug, name);
  const st = await stat(filePath).catch(() => null);
  if (!st || !st.isFile()) return send(res, 404, 'text/plain', 'not found');
  const body = await readFile(filePath).catch(() => null);
  if (body === null) return send(res, 404, 'text/plain', 'not found');
  send(res, 200, 'text/plain; charset=utf-8', body);
}

async function apiLibFile(res, libRoot, name) {
  const filePath = join(libRoot, name);
  const st = await stat(filePath).catch(() => null);
  if (!st || !st.isFile()) return send(res, 404, 'text/plain', 'not found');
  const body = await readFile(filePath).catch(() => null);
  if (body === null) return send(res, 404, 'text/plain', 'not found');
  send(res, 200, 'text/plain; charset=utf-8', body);
}

async function readLayerPart(layerDir, part) {
  // part is shader.frag or meta. Returns body (string) or null.
  if (part === 'shader.frag') {
    return await readFile(join(layerDir, 'shader.frag'), 'utf-8').catch(() => null);
  }
  if (part === 'meta') {
    const raw = await readFile(join(layerDir, 'meta.yaml'), 'utf-8').catch(() => null);
    if (raw === null) return null;
    try { return JSON.stringify(yaml.load(raw) ?? {}); }
    catch { return null; }
  }
  return null;
}

async function apiPieceLayer(res, piecesRoot, layersRoot, slug, layerName, part) {
  // Try piece-local first, then global fallback.
  const localDir = join(piecesRoot, slug, 'layers', layerName);
  let body = await readLayerPart(localDir, part);
  if (body === null) {
    const globalDir = join(layersRoot, layerName);
    body = await readLayerPart(globalDir, part);
  }
  if (body === null) return send(res, 404, 'text/plain', 'not found');
  const ct = part === 'shader.frag' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8';
  send(res, 200, ct, body);
}

async function apiLayer(res, layersRoot, layerName, part) {
  const layerDir = join(layersRoot, layerName);
  const body = await readLayerPart(layerDir, part);
  if (body === null) return send(res, 404, 'text/plain', 'not found');
  const ct = part === 'shader.frag' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8';
  send(res, 200, ct, body);
}

async function apiPieceFile(req, res, piecesRoot, slug, name) {
  const pieceDir = join(piecesRoot, slug);
  const dirStat = await stat(pieceDir).catch(() => null);
  if (!dirStat || !dirStat.isDirectory()) return send(res, 404, 'text/plain', 'not found');

  const filePath = join(pieceDir, name);
  const fileStat = await stat(filePath).catch(() => null);
  if (!fileStat || !fileStat.isFile()) return send(res, 404, 'text/plain', 'not found');

  const mime = FILE_MIME[extname(name).toLowerCase()] ?? 'application/octet-stream';
  const range = parseRange(req.headers.range, fileStat.size);

  const baseHeaders = {
    'content-type': mime,
    'accept-ranges': 'bytes',
    'cache-control': 'public, max-age=3600',
  };

  if (range) {
    res.statusCode = 206;
    for (const [k, v] of Object.entries(baseHeaders)) res.setHeader(k, v);
    res.setHeader('content-length', range.end - range.start + 1);
    res.setHeader('content-range', `bytes ${range.start}-${range.end}/${fileStat.size}`);
    const stream = createReadStream(filePath, { start: range.start, end: range.end });
    stream.on('error', () => { try { res.end(); } catch {} });
    stream.pipe(res);
    return;
  }

  res.statusCode = 200;
  for (const [k, v] of Object.entries(baseHeaders)) res.setHeader(k, v);
  res.setHeader('content-length', fileStat.size);
  const stream = createReadStream(filePath);
  stream.on('error', () => { try { res.end(); } catch {} });
  stream.pipe(res);
}

function parseRange(header, total) {
  if (!header) return null;
  const m = header.match(/^bytes=(\d*)-(\d*)$/);
  if (!m) return null;
  const start = m[1] === '' ? 0 : parseInt(m[1], 10);
  let   end   = m[2] === '' ? total - 1 : parseInt(m[2], 10);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  if (start > end || start >= total) return null;
  if (end >= total) end = total - 1;
  return { start, end };
}

async function readCurrentSlug(piecesRoot) {
  const raw = await readFile(join(piecesRoot, 'current.txt'), 'utf8').catch(() => null);
  if (raw === null) return null;
  const slug = raw.trim();
  if (!SLUG_RE.test(slug)) return null;
  const st = await stat(join(piecesRoot, slug)).catch(() => null);
  if (!st || !st.isDirectory()) return null;
  return slug;
}

async function loadMeta(piecesRoot, slug) {
  const raw = await readFile(join(piecesRoot, slug, 'meta.yaml'), 'utf8').catch(() => null);
  if (raw === null) return null;
  try {
    return yaml.load(raw) ?? {};
  } catch {
    return null;
  }
}

async function pieceMtime(pieceDir, libRoot) {
  const candidates = ['shader.frag', 'meta.yaml'];

  // If this piece declares passes, add each pass's shader file.
  const metaRaw = await readFile(join(pieceDir, 'meta.yaml'), 'utf8').catch(() => null);
  if (metaRaw) {
    try {
      const meta = yaml.load(metaRaw) ?? {};
      if (Array.isArray(meta.passes)) {
        for (const p of meta.passes) {
          if (p && typeof p.shader === 'string' && FILENAME_RE.test(p.shader)
              && p.shader.endsWith('.frag')) {
            if (!candidates.includes(p.shader)) candidates.push(p.shader);
          }
        }
      }
    } catch {}
  }

  let newest = 0;
  let found = false;
  for (const f of candidates) {
    const st = await stat(join(pieceDir, f)).catch(() => null);
    if (st) {
      found = true;
      newest = Math.max(newest, st.mtimeMs);
    }
  }

  // Library files are a coarse dependency for every piece — when any lib/*.glsl
  // changes, the currently-viewed piece reloads. Strictly more reloads than
  // necessary, but cheap and impossible to get wrong.
  if (libRoot) {
    const entries = await readdir(libRoot).catch(() => []);
    for (const f of entries) {
      if (!LIB_FILE_RE.test(f)) continue;
      const st = await stat(join(libRoot, f)).catch(() => null);
      if (st) newest = Math.max(newest, st.mtimeMs);
    }
  }

  return found ? newest : null;
}

function send(res, status, type, body) {
  res.statusCode = status;
  res.setHeader('content-type', type);
  res.setHeader('cache-control', 'no-store');
  res.end(body);
}

function sendJson(res, status, obj) {
  send(res, status, 'application/json; charset=utf-8', JSON.stringify(obj));
}

// Allow `node studio/server.mjs` to boot a dev server.
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.STUDIO_PORT ?? 7777);
  const host = process.env.STUDIO_HOST ?? '127.0.0.1';
  const piecesDir = process.env.PIECES_DIR
    ?? fileURLToPath(new URL('../pieces', import.meta.url));
  const statsFile = process.env.STATS_FILE
    ?? fileURLToPath(new URL('./.stats.json', import.meta.url));
  const statsToken = process.env.STATS_TOKEN ?? null;

  const stats = createStats({ file: statsFile });
  await stats.load();

  const server = createStudioServer({ piecesDir, stats, statsToken });
  server.listen(port, host, () => {
    const guard = statsToken ? 'token-guarded' : 'OPEN — set STATS_TOKEN to require a token';
    console.log(`[studio] listening on http://${host}:${port}  pieces=${piecesDir}`);
    console.log(`[studio] stats file=${statsFile}  /api/stats ${guard}`);
  });

  const shutdown = async () => {
    try { await stats.flush(); } catch {}
    process.exit(0);
  };
  process.on('SIGINT',  shutdown);
  process.on('SIGTERM', shutdown);
}
