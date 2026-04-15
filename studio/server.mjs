// ABOUTME: Studio HTTP server — serves the live page and exposes catalog/current/
// ABOUTME: shader/meta/mtime endpoints read from a plain directory of pieces.
import { createServer } from 'node:http';
import { readFile, stat, readdir } from 'node:fs/promises';
import { join, extname, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const STUDIO_DIR = fileURLToPath(new URL('.', import.meta.url));

const STATIC_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
};

export function createStudioServer({ piecesDir, studioDir = STUDIO_DIR } = {}) {
  if (!piecesDir) throw new Error('piecesDir is required');
  const piecesRoot = resolvePath(piecesDir);

  return createServer(async (req, res) => {
    try {
      await handle(req, res, { piecesRoot, studioDir });
    } catch (err) {
      console.error('[studio]', err);
      send(res, 500, 'text/plain', 'internal error');
    }
  });
}

async function handle(req, res, { piecesRoot, studioDir }) {
  if (req.method !== 'GET') return send(res, 405, 'text/plain', 'method not allowed');

  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;

  if (path === '/')                  return serveStatic(res, studioDir, 'index.html');
  if (path === '/runtime.mjs')       return serveStatic(res, studioDir, 'runtime.mjs');
  if (path === '/styles.css')        return serveStatic(res, studioDir, 'styles.css');

  if (path === '/api/catalog')       return apiCatalog(res, piecesRoot);
  if (path === '/api/current')       return apiCurrent(res, piecesRoot);

  const pieceMatch = path.match(/^\/api\/pieces\/([^/]+)\/(shader\.frag|meta|mtime)$/);
  if (pieceMatch) {
    const slug = decodeURIComponent(pieceMatch[1]);
    const part = pieceMatch[2];
    if (!SLUG_RE.test(slug)) return send(res, 404, 'text/plain', 'not found');
    return apiPiecePart(res, piecesRoot, slug, part);
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

async function apiCatalog(res, piecesRoot) {
  const entries = await readdir(piecesRoot, { withFileTypes: true }).catch(() => []);
  const pieces = [];
  for (const e of entries) {
    if (!e.isDirectory() || !SLUG_RE.test(e.name)) continue;
    const meta = await loadMeta(piecesRoot, e.name);
    if (meta) pieces.push({ slug: e.name, ...meta });
  }
  pieces.sort((a, b) => String(b.created ?? '').localeCompare(String(a.created ?? '')));
  sendJson(res, 200, pieces);
}

async function apiCurrent(res, piecesRoot) {
  const slug = await readCurrentSlug(piecesRoot);
  if (!slug) return sendJson(res, 200, { slug: null, meta: null });
  const meta = await loadMeta(piecesRoot, slug);
  if (!meta) return sendJson(res, 200, { slug: null, meta: null });
  sendJson(res, 200, { slug, meta });
}

async function apiPiecePart(res, piecesRoot, slug, part) {
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
    const mtime = await pieceMtime(pieceDir);
    if (mtime === null) return send(res, 404, 'text/plain', 'not found');
    return sendJson(res, 200, { mtime });
  }
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

async function pieceMtime(pieceDir) {
  const candidates = ['shader.frag', 'meta.yaml'];
  let newest = 0;
  let found = false;
  for (const f of candidates) {
    const st = await stat(join(pieceDir, f)).catch(() => null);
    if (st) {
      found = true;
      newest = Math.max(newest, st.mtimeMs);
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
  const server = createStudioServer({ piecesDir });
  server.listen(port, host, () => {
    console.log(`[studio] listening on http://${host}:${port}  pieces=${piecesDir}`);
  });
}
