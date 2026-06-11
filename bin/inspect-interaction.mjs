#!/usr/bin/env node
// ABOUTME: Stage-3 interaction captures — cursor triptych, with/without pair,
// ABOUTME: a→b→a reversibility, fast-move latency clip, idle matrix, layer solos.
//
// Usage:
//   node bin/inspect-interaction.mjs <slug>
//
// Output: pieces/<slug>/inspect-interaction/
//   cursor-a.png cursor-b.png cursor-c.png      3-position triptych  (probe: composition)
//   cursor-active.png cursor-idle.png           with/without pair    (probe: dominance ≤30%)
//   cursor-aba-0.png cursor-aba-1.png           a→b→a                (probe: reversibility)
//   latency.webm/.mp4                           fast jump + 0.8 s    (probe: latency)
//   matrix-{both,music,cursor,neither}.webm/mp4 4-cell idle matrix   (probes: idle_cell, music/cursor independence)
//   solo-<layer>.png                            per-layer solos      (probes: layer_distinctness, quiet_survives, layer_interaction)
//   manifest.json                               what was captured + comparability caveats
//
// Comparability: all stills are captured with audio PAUSED at the peak-section
// timestamp. Pieces with time_source: audio freeze their clock when paused
// (u_time pins to the audio clock), so cursor-position deltas are attributable
// to the cursor alone. Pieces on wall-clock time keep animating — manifest
// records time_source so the grader/metric knows the comparability class.
// Prereq: studio server on STUDIO_PORT (default 7777).

import { launchRenderBrowser } from './browser-launch.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, dirname, resolve, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

const slug = process.argv[2];
if (!slug || !SLUG_RE.test(slug)) {
  console.error('usage: node bin/inspect-interaction.mjs <slug>');
  process.exit(2);
}
const pieceDir = join(repoRoot, 'pieces', slug);
if (!existsSync(pieceDir)) {
  console.error(`no piece at pieces/${slug}`);
  process.exit(1);
}

const meta = yaml.load(await readFile(join(pieceDir, 'meta.yaml'), 'utf8')) ?? {};
const hasAudio = Boolean(meta.audio) && meta.audio !== 'live';
const audioBase = meta.audio ? basename(meta.audio, extname(meta.audio)) : 'audio';
let peakT = 10;
try {
  const analysis = JSON.parse(await readFile(join(pieceDir, `${audioBase}.analysis.json`), 'utf8'));
  const inner = analysis.sections.length >= 4 ? analysis.sections.slice(1, -1) : analysis.sections;
  const peak = [...inner].sort((a, b) => b.energy - a.energy)[0];
  peakT = peak.start + (peak.end - peak.start) * 0.33;
} catch {}

const outDir = join(pieceDir, 'inspect-interaction');
await mkdir(outDir, { recursive: true });

const port = Number(process.env.STUDIO_PORT ?? 7777);
const browser = await launchRenderBrowser();
const manifest = {
  slug,
  captured_at_audio_t: hasAudio ? Number(peakT.toFixed(1)) : null,
  time_source: meta.time_source ?? 'wall',
  stills_comparable: (meta.time_source === 'audio'),
  captures: [],
};

function ffmpeg(webmPath, mp4Path) {
  return new Promise((res, rej) => {
    const ff = spawn('ffmpeg', ['-y', '-i', webmPath, '-r', '60',
      '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '22', '-an', mp4Path],
      { stdio: ['ignore', 'ignore', 'ignore'] });
    ff.on('close', (c) => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)));
    ff.on('error', rej);
  });
}

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  page.on('pageerror', (e) => console.log('[b:err]', e.message));

  await page.goto(`http://127.0.0.1:${port}/?piece=${encodeURIComponent(slug)}&record=1`, { waitUntil: 'load' });
  await page.click('#stage').catch(() => {});
  await page.waitForFunction(() => window.__vj && typeof window.__vj.record === 'function', { timeout: 10_000 });

  const moveCursor = (fx, fy) => page.evaluate(([x, y]) => {
    const c = document.getElementById('stage');
    window.dispatchEvent(new PointerEvent('pointermove', {
      pointerType: 'mouse', clientX: x * c.clientWidth, clientY: y * c.clientHeight,
    }));
  }, [fx, fy]);
  const parkCursor = () => page.evaluate(() => {
    const c = document.getElementById('stage');
    window.dispatchEvent(new PointerEvent('pointermove', {
      pointerType: 'mouse', clientX: 0, clientY: c.clientHeight,
    }));
  });
  const shot = async (name) => {
    await page.screenshot({ path: join(outDir, name) });
    manifest.captures.push(name);
    console.log(`[inspect-interaction] wrote ${name}`);
  };
  const recordClip = async (name, ms) => {
    const bytes = await page.evaluate(async (m) => await window.__vj.record(m), ms);
    const webm = join(outDir, `${name}.webm`);
    await writeFile(webm, Buffer.from(bytes));
    await ffmpeg(webm, join(outDir, `${name}.mp4`));
    manifest.captures.push(`${name}.mp4`);
    console.log(`[inspect-interaction] wrote ${name}.mp4`);
  };

  if (hasAudio) {
    await page.evaluate(() => window.__vj.waitForAudio?.(8000));
    await page.evaluate(async (t) => { await window.__vj.seekAudio(t); }, peakT);
    await page.waitForTimeout(1200);   // let state accumulate at the peak
  } else {
    await page.waitForTimeout(2000);
  }

  // ---- stills block: audio paused for cursor-attributable deltas ----
  if (hasAudio) await page.evaluate(() => window.__vj.pauseAudio());
  const SETTLE = 700;

  // 1. triptych
  for (const [tag, fx, fy] of [['a', 0.25, 0.5], ['b', 0.75, 0.35], ['c', 0.5, 0.8]]) {
    await moveCursor(fx, fy);
    await page.waitForTimeout(SETTLE);
    await shot(`cursor-${tag}.png`);
  }
  // 2. with/without pair
  await moveCursor(0.6, 0.5);
  await page.waitForTimeout(SETTLE);
  await shot('cursor-active.png');
  await parkCursor();
  await page.waitForTimeout(SETTLE);
  await shot('cursor-idle.png');
  // 3. a→b→a reversibility
  await moveCursor(0.25, 0.5);
  await page.waitForTimeout(SETTLE);
  await shot('cursor-aba-0.png');
  await moveCursor(0.75, 0.35);
  await page.waitForTimeout(SETTLE);
  await moveCursor(0.25, 0.5);
  await page.waitForTimeout(SETTLE);
  await shot('cursor-aba-1.png');

  // 4. latency: rest at a, then jump to far corner mid-recording
  await moveCursor(0.2, 0.5);
  await page.waitForTimeout(SETTLE);
  const latencyP = page.evaluate(async () => await window.__vj.record(800));
  await page.waitForTimeout(200);
  await moveCursor(0.85, 0.25);
  {
    const bytes = await latencyP;
    const webm = join(outDir, 'latency.webm');
    await writeFile(webm, Buffer.from(bytes));
    await ffmpeg(webm, join(outDir, 'latency.mp4'));
    manifest.captures.push('latency.mp4');
    console.log('[inspect-interaction] wrote latency.mp4 (jump at ~200ms)');
  }

  // 5. layer solos (layer-stack pieces only)
  const layerNames = await page.evaluate(() => window.__vj.soloLayer(null));
  for (const name of layerNames) {
    await page.evaluate((n) => window.__vj.soloLayer(n), name);
    await page.waitForTimeout(400);
    await shot(`solo-${name}.png`);
  }
  if (layerNames.length) await page.evaluate(() => window.__vj.soloLayer(null));
  manifest.layers = layerNames;

  // ---- idle matrix: 4 × 3s clips ----
  const orbit = (on) => page.evaluate((enable) => {
    if (window.__orbitTimer) { clearInterval(window.__orbitTimer); window.__orbitTimer = null; }
    if (!enable) return;
    let t = 0;
    window.__orbitTimer = setInterval(() => {
      const c = document.getElementById('stage');
      t += 0.12;
      window.dispatchEvent(new PointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: c.clientWidth * (0.5 + 0.3 * Math.cos(t)),
        clientY: c.clientHeight * (0.5 + 0.3 * Math.sin(t)),
      }));
    }, 50);
  }, on);
  const setAudio = async (playing) => {
    if (!hasAudio) return;
    if (playing) await page.evaluate(async (t) => { await window.__vj.seekAudio(t); }, peakT);
    else await page.evaluate(() => window.__vj.pauseAudio());
    await page.waitForTimeout(400);
  };

  for (const [cell, music, cursor] of [
    ['both', true, true], ['music', true, false], ['cursor', false, true], ['neither', false, false],
  ]) {
    await setAudio(music);
    if (cursor) await orbit(true); else { await orbit(false); await parkCursor(); }
    await page.waitForTimeout(300);
    await recordClip(`matrix-${cell}`, 3000);
  }
  await orbit(false);

  await writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 1));
  console.log(`[inspect-interaction] manifest: ${manifest.captures.length} captures, layers=${manifest.layers?.length ?? 0}, comparable_stills=${manifest.stills_comparable}`);
} finally {
  await browser.close();
}
