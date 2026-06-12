#!/usr/bin/env node
// ABOUTME: One-time backfill — adds an explicit `cursor: true|false` field to
// ABOUTME: every piece's meta.yaml by scanning its shader files for u_mouse/u_touches.

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PIECES = join(ROOT, 'pieces');
const LAYERS = join(ROOT, 'layers');
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const SHADER_EXT = new Set(['.frag', '.vert', '.glsl']);
const CURSOR_RE = /\bu_mouse\b|\bu_touches\b|\bu_touch_count\b/;

const APPLY = process.argv.includes('--apply');

// Collect every shader source directly under a dir (recursive).
async function shaderFiles(dir) {
  const out = [];
  const walk = async (d) => {
    const entries = await readdir(d, { withFileTypes: true }).catch(() => []);
    for (const e of entries) {
      const p = join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else if (SHADER_EXT.has(extname(e.name))) out.push(p);
    }
  };
  await walk(dir);
  return out;
}

// Resolve a layer name to its shader dir: piece-local first, then global
// (matches the layer-engine resolution order in CLAUDE.md).
async function layerDir(pieceDir, name) {
  const local = join(pieceDir, 'layers', name);
  if (await stat(local).catch(() => null)) return local;
  return join(LAYERS, name);
}

// A piece "uses cursor" if any shader it actually renders references a cursor
// uniform. For layer-stack pieces that means the resolved layer shaders
// (often in the shared /layers/ dir), not just files under pieces/<slug>/.
async function usesCursor(pieceDir, meta) {
  const files = [...await shaderFiles(pieceDir)];
  if (Array.isArray(meta?.layers)) {
    for (const l of meta.layers) {
      const name = typeof l === 'string' ? l : l?.layer;
      if (name) files.push(...await shaderFiles(await layerDir(pieceDir, name)));
    }
  }
  for (const f of files) {
    const src = await readFile(f, 'utf8').catch(() => '');
    if (CURSOR_RE.test(src)) return true;
  }
  return false;
}

// Insert `cursor: <bool>` after the `created:` line, preserving comments and
// formatting. Idempotent: skips if a top-level cursor field already exists.
function insertCursorField(yamlText, value) {
  if (/^cursor:\s*/m.test(yamlText)) return { text: yamlText, changed: false };
  const lines = yamlText.split('\n');
  let anchor = lines.findIndex((l) => /^created:/.test(l));
  if (anchor === -1) anchor = lines.findIndex((l) => /^slug:/.test(l));
  if (anchor === -1) anchor = 0;
  lines.splice(anchor + 1, 0, `cursor: ${value}`);
  return { text: lines.join('\n'), changed: true };
}

const entries = await readdir(PIECES, { withFileTypes: true }).catch(() => []);
const report = [];
for (const e of entries) {
  if (!e.isDirectory() || !SLUG_RE.test(e.name)) continue;
  const dir = join(PIECES, e.name);
  const metaPath = join(dir, 'meta.yaml');
  if (!(await stat(metaPath).catch(() => null))) continue;
  const raw = await readFile(metaPath, 'utf8');
  const meta = yaml.load(raw) ?? {};
  const cursor = await usesCursor(dir, meta);
  const { text, changed } = insertCursorField(raw, cursor);
  const already = /^cursor:\s*(\S+)/m.exec(raw);
  let status;
  if (already) status = `kept (cursor: ${already[1]})`;
  else if (APPLY && changed) { await writeFile(metaPath, text); status = `wrote cursor: ${cursor}`; }
  else status = `would write cursor: ${cursor}`;
  report.push({ slug: e.name, cursor, status });
}

report.sort((a, b) => a.slug.localeCompare(b.slug));
for (const r of report) {
  const flag = r.cursor ? '🖱️ ' : '   ';
  console.log(`  ${flag}${r.slug.padEnd(40)} ${r.status}`);
}
const yes = report.filter((r) => r.cursor).length;
console.log(`\n${report.length} pieces — ${yes} cursor, ${report.length - yes} none`);
if (!APPLY) console.log('Dry run. Re-run with --apply to write meta.yaml files.');
