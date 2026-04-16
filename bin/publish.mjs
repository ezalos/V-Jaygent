#!/usr/bin/env node
// ABOUTME: Renders a piece's shader into an mp4 clip ready for Telegram.
// ABOUTME: Drives a headless Chromium via Playwright, then remuxes via ffmpeg.
//
// Usage: node bin/publish.mjs <slug> [--duration N] [--port 7777] [--width 1280] [--height 720]
//
// Prereqs: the studio server must already be running (npm run studio).
// Output:  writes pieces/<slug>/clip.mp4 and sets `rendered_at` in meta.yaml.
// Telegram: sending is a separate step — this script prints the mp4 path and
// a suggested caption; the caller (Claude) invokes the telegram `reply` tool.

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { chromium } from 'playwright';

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

const args = parseArgs(process.argv.slice(2));
if (!args.slug || !SLUG_RE.test(args.slug)) {
  console.error('usage: node bin/publish.mjs <slug> [--duration N] [--port 7777] [--width 1280] [--height 720]');
  process.exit(2);
}

const piecesDir = join(repoRoot, 'pieces');
const pieceDir = join(piecesDir, args.slug);
const metaPath = join(pieceDir, 'meta.yaml');
if (!existsSync(metaPath)) {
  console.error(`no piece at ${pieceDir}`);
  process.exit(1);
}

const meta = yaml.load(await readFile(metaPath, 'utf8')) ?? {};
const duration = Number(args.duration ?? meta.duration ?? 10);
const port = Number(args.port ?? process.env.STUDIO_PORT ?? 7777);
const width = Number(args.width ?? 1280);
const height = Number(args.height ?? 720);
const url = `http://127.0.0.1:${port}/?piece=${encodeURIComponent(args.slug)}&record=1`;

await assertServerUp(port);

console.log(`[publish] rendering ${args.slug} for ${duration}s at ${width}x${height}`);

const browser = await chromium.launch({
  headless: true,
  args: [
    '--autoplay-policy=no-user-gesture-required',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--no-sandbox',
  ],
});
let webmBytes;
try {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  page.on('console', (msg) => console.log(`[browser:${msg.type()}]`, msg.text()));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__vj && typeof window.__vj.record === 'function', { timeout: 10_000 });

  const durationMs = Math.max(1000, Math.round(duration * 1000));
  const result = await page.evaluate(async (ms) => {
    return await window.__vj.record(ms);
  }, durationMs);
  webmBytes = Buffer.from(result);
} finally {
  await browser.close();
}

const webmPath = join(pieceDir, 'clip.webm');
const mp4Path = join(pieceDir, 'clip.mp4');
await writeFile(webmPath, webmBytes);
console.log(`[publish] wrote ${webmPath} (${webmBytes.length} bytes)`);

await runFfmpeg([
  '-y',
  '-i', webmPath,
  '-r', '60',
  // H.264 requires even dimensions — pad by 1px if needed.
  '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2',
  '-c:v', 'libx264',
  '-pix_fmt', 'yuv420p',
  '-preset', 'slow',
  '-crf', '20',
  '-movflags', '+faststart',
  '-an',
  mp4Path,
]);
console.log(`[publish] wrote ${mp4Path}`);

meta.rendered_at = new Date().toISOString();
await writeFile(metaPath, yaml.dump(meta, { lineWidth: -1 }));

const caption = [
  meta.title ?? args.slug,
  meta.notes ? String(meta.notes).trim() : null,
].filter(Boolean).join('\n\n');

console.log('\n---');
console.log(JSON.stringify({ slug: args.slug, mp4: mp4Path, caption }, null, 2));

// ---------- helpers ----------

function parseArgs(argv) {
  const out = { slug: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--duration')     out.duration = argv[++i];
    else if (a === '--port')    out.port = argv[++i];
    else if (a === '--width')   out.width = argv[++i];
    else if (a === '--height')  out.height = argv[++i];
    else if (!a.startsWith('--') && !out.slug) out.slug = a;
  }
  return out;
}

async function assertServerUp(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/catalog`);
    if (!res.ok) throw new Error(`server returned ${res.status}`);
  } catch (err) {
    console.error(`[publish] studio server not reachable on :${port} — start it with 'npm run studio' first`);
    console.error(`  underlying error: ${err.message}`);
    process.exit(1);
  }
}

function runFfmpeg(args) {
  return new Promise((resolveP, rejectP) => {
    const child = spawn('ffmpeg', args, { stdio: ['ignore', 'inherit', 'inherit'] });
    child.on('close', (code) => code === 0 ? resolveP() : rejectP(new Error(`ffmpeg exit ${code}`)));
    child.on('error', rejectP);
  });
}
