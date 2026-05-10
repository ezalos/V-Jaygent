#!/usr/bin/env node
// ABOUTME: Screenshots a piece at N time-spread frames so Claude can Read
// ABOUTME: them multimodally and auto-critique its own work.
//
// Usage: node bin/inspect.mjs <slug> [frames] [intervalSec] [--out dir]
//
// Prereqs: studio server running on STUDIO_PORT (default 7777).
// Output: pieces/<slug>/inspect/frame-NN-t{seconds}.png

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

const args = process.argv.slice(2);
const slug = args[0];
const frames = Number(args[1] ?? 5);
const intervalSec = Number(args[2] ?? 6);
const port = Number(process.env.STUDIO_PORT ?? 7777);

if (!slug || !SLUG_RE.test(slug)) {
  console.error('usage: node bin/inspect.mjs <slug> [frames=5] [intervalSec=6]');
  process.exit(2);
}
if (!existsSync(join(repoRoot, 'pieces', slug))) {
  console.error(`no piece at pieces/${slug}`);
  process.exit(1);
}

const outDir = join(repoRoot, 'pieces', slug, 'inspect');
await mkdir(outDir, { recursive: true });

console.log(`[inspect] piece=${slug} frames=${frames} interval=${intervalSec}s port=${port}`);

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

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  page.on('console',   (m) => console.log('[b]', m.type(), m.text().slice(0, 300)));
  page.on('pageerror', (e) => console.log('[b:err]', e.message));

  await page.goto(`http://127.0.0.1:${port}/?piece=${slug}`, { waitUntil: 'load' });

  // Click the stage to unlock audio (no-op if the piece has none) and let
  // the runtime finish its initial compile + first few frames.
  await page.click('#stage').catch(() => {});
  // The click leaves Playwright's virtual cursor at stage centre AND fires
  // a pointerdown that the runtime's canvas handler reads as
  // mouse=[centerX, centerY]. The runtime tracks the cursor via
  // `pointermove` events on window — NOT `mousemove` — so dispatch a
  // pointermove whose (clientX, clientY) maps to the runtime's idle
  // sentinel mouse=(0,0). Earlier versions sent MouseEvent('mousemove')
  // here; that event has no listener and silently leaves u_mouse near
  // canvas centre, contaminating cursor-reactive layers in inspect frames.
  await page.evaluate(() => {
    const c = document.getElementById('stage');
    if (!c) return;
    window.dispatchEvent(new PointerEvent('pointermove', {
      pointerType: 'mouse',
      clientX: 0,
      clientY: c.clientHeight,
    }));
  });
  await page.waitForTimeout(1500);

  for (let i = 0; i < frames; i++) {
    if (i > 0) await page.waitForTimeout(intervalSec * 1000);
    const approxT = 1.5 + i * intervalSec;
    const name = `frame-${String(i).padStart(2, '0')}-t${approxT.toFixed(1)}s.png`;
    const out  = join(outDir, name);
    await page.screenshot({ path: out });
    console.log(`wrote ${out}`);
  }
} finally {
  await browser.close();
}
