#!/usr/bin/env node
// ABOUTME: Stage-3 interaction captures — cursor triptych, with/without pair,
// ABOUTME: a→b→a reversibility, fast-move latency clip, idle matrix, layer solos.
//
// Usage:
//   node bin/inspect-interaction.mjs <slug>
//
// Output: pieces/<slug>/inspect-interaction/
//   cursor-a.png cursor-b.png cursor-c.png      3-position triptych  (probe: composition)
//   cursor-a2.png                               position-a recapture — no-cursor drift baseline
//   cursor-active.png cursor-idle.png           with/without pair    (probe: dominance ≤30%)
//   cursor-aba-0.png cursor-aba-1.png           a→b→a                (probe: reversibility)
//   latency.mp4 + latency-fNN.png               annotated jump burst (probe: latency; manifest has jump frame)
//   matrix-{both,music,cursor,neither}.mp4      4-cell idle matrix, 30 s each (idle, independence, readability)
//   build-cursor.mp4                            cursor orbit across a section build (authority_during_build)
//   solo-<layer>.png                            per-layer solos      (layer_distinctness, quiet_survives, layer_interaction)
//   manifest.json                               capture record + comparability class + orbit path
//
// Comparability (v2, closes the kinetic-energy-v3 harness gap): all stills are
// captured with audio PAUSED and the clock FROZEN (__vj.freezeClock), so
// cursor-position deltas are attributable on wall-clock pieces too. Multi-pass
// sims still step per frame — cursor-a2.png recaptures position a at the end
// of the stills block, giving the no-cursor drift baseline the metric corrects
// against. manifest.stills_comparable: 'full' | 'frozen-clock-state-advances'.
// Prereq: studio server on STUDIO_PORT (default 7777) with freezeClock hook.

import { launchRenderBrowser } from './browser-launch.mjs';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
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
  console.error('usage: node bin/inspect-interaction.mjs <slug> [--matrix-secs N]');
  process.exit(2);
}
const matrixSecs = (() => {
  const i = process.argv.indexOf('--matrix-secs');
  const n = i > 0 ? Number(process.argv[i + 1]) : NaN;
  return Number.isFinite(n) && n >= 3 ? n : 30;   // taste.md spec: 30 s cells
})();
const pieceDir = join(repoRoot, 'pieces', slug);
if (!existsSync(pieceDir)) {
  console.error(`no piece at pieces/${slug}`);
  process.exit(1);
}

const meta = yaml.load(await readFile(join(pieceDir, 'meta.yaml'), 'utf8')) ?? {};
const hasAudio = Boolean(meta.audio) && meta.audio !== 'live';
const audioBase = meta.audio ? basename(meta.audio, extname(meta.audio)) : 'audio';
let peakT = 10;
let buildT = null;   // ~8 s before the peak section starts — the build window
try {
  const analysis = JSON.parse(await readFile(join(pieceDir, `${audioBase}.analysis.json`), 'utf8'));
  const inner = analysis.sections.length >= 4 ? analysis.sections.slice(1, -1) : analysis.sections;
  const peak = [...inner].sort((a, b) => b.energy - a.energy)[0];
  peakT = peak.start + (peak.end - peak.start) * 0.33;
  buildT = Math.max(0, peak.start - 8);
} catch {}

const outDir = join(pieceDir, 'inspect-interaction');
await mkdir(outDir, { recursive: true });

const port = Number(process.env.STUDIO_PORT ?? 7777);
const browser = await launchRenderBrowser();
const stateAccumulates = Boolean(meta.passes || meta.layers);
const manifest = {
  slug,
  captured_at_audio_t: hasAudio ? Number(peakT.toFixed(1)) : null,
  time_source: meta.time_source ?? 'wall',
  clock_frozen: true,
  state_accumulates: stateAccumulates,
  stills_comparable: stateAccumulates ? 'frozen-clock-state-advances' : 'full',
  matrix_secs: matrixSecs,
  cursor_orbit: 'centre (0.5,0.5), radius 0.3 of canvas, ~2.6 s/rev, 20 Hz pointermove',
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
  const recordClip = async (name, ms, bps = 12_000_000) => {
    const bytes = await page.evaluate(async ([m, b]) => await window.__vj.record(m, b), [ms, bps]);
    const webm = join(outDir, `${name}.webm`);
    await writeFile(webm, Buffer.from(bytes));
    await ffmpeg(webm, join(outDir, `${name}.mp4`));
    // Long cells would bloat the repo twice over — keep the mp4 only.
    if (ms > 5000) await rm(webm, { force: true });
    manifest.captures.push(`${name}.mp4`);
    console.log(`[inspect-interaction] wrote ${name}.mp4 (${(ms / 1000).toFixed(0)}s)`);
  };

  if (hasAudio) {
    await page.evaluate(() => window.__vj.waitForAudio?.(8000));
    await page.evaluate(async (t) => { await window.__vj.seekAudio(t); }, peakT);
    await page.waitForTimeout(1200);   // let state accumulate at the peak
  } else {
    await page.waitForTimeout(2000);
  }

  // ---- stills block: audio paused + clock frozen for cursor-attributable deltas ----
  if (hasAudio) await page.evaluate(() => window.__vj.pauseAudio());
  await page.evaluate(() => window.__vj.freezeClock?.(true));
  const SETTLE = 700;

  // 0. No-cursor drift pair: two shots one SETTLE apart with the cursor
  // parked. Their delta is the true no-cursor noise floor at the same
  // timescale as each triptych step (cursor-a2 measures the whole-block
  // interval, which a strong cursor's own history contaminates).
  await parkCursor();
  await page.waitForTimeout(SETTLE);
  await shot('drift-0.png');
  await page.waitForTimeout(SETTLE);
  await shot('drift-1.png');

  // 1. triptych (+ position-a recapture at the end of the block, below — the
  //    a↔a2 delta is the no-cursor drift baseline for state-advancing sims)
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

  // 3b. position-a recapture — closes the stills block. With the clock frozen,
  // any a↔a2 delta is sim/state drift, not cursor: the attribution baseline.
  await moveCursor(0.25, 0.5);
  await page.waitForTimeout(SETTLE);
  await shot('cursor-a2.png');

  // 4. annotated latency burst (clock stays frozen so the ONLY motion in the
  // clip is the cursor response): rest at a, record 1.5 s, jump at t=500 ms.
  await moveCursor(0.2, 0.5);
  await page.waitForTimeout(SETTLE);
  const latencyP = page.evaluate(async () => await window.__vj.record(1500));
  await page.waitForTimeout(500);
  await moveCursor(0.85, 0.25);
  {
    const bytes = await latencyP;
    const webm = join(outDir, 'latency.webm');
    await writeFile(webm, Buffer.from(bytes));
    await ffmpeg(webm, join(outDir, 'latency.mp4'));
    // Burst frames around the jump: 0.40–1.10 s at 60 fps → 42 waypoints the
    // critic (and the latency metric) can index. Jump lands at frame 6.
    await new Promise((res, rej) => {
      const ff = spawn('ffmpeg', ['-y', '-ss', '0.4', '-t', '0.7', '-i', join(outDir, 'latency.mp4'),
        '-vf', 'fps=60,scale=640:-2', join(outDir, 'latency-f%02d.png')], { stdio: ['ignore', 'ignore', 'ignore'] });
      ff.on('close', (c) => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)));
      ff.on('error', rej);
    });
    manifest.captures.push('latency.mp4');
    manifest.latency = { jump_at_ms: 500, burst_start_ms: 400, burst_fps: 60, jump_frame_index: 6 };
    console.log('[inspect-interaction] wrote latency.mp4 + burst frames (jump at 500ms = frame 6)');
  }

  // 5. layer solos (layer-stack pieces only; clock still frozen)
  const layerNames = await page.evaluate(() => window.__vj.soloLayer(null));
  for (const name of layerNames) {
    await page.evaluate((n) => window.__vj.soloLayer(n), name);
    await page.waitForTimeout(400);
    await shot(`solo-${name}.png`);
  }
  if (layerNames.length) await page.evaluate(() => window.__vj.soloLayer(null));
  manifest.layers = layerNames;

  // Stills block over — clocks run again for the motion captures.
  await page.evaluate(() => window.__vj.freezeClock?.(false));

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
    await recordClip(`matrix-${cell}`, matrixSecs * 1000, 4_000_000);
  }
  await orbit(false);

  // Fifth cell: cursor HELD at one position with music playing — the honest
  // dominance evidence. The orbit cell measures continuous stirring (maximal
  // gesture); dominance asks about the footprint of cursor PRESENCE.
  await setAudio(true);
  await moveCursor(0.6, 0.45);
  await page.waitForTimeout(300);
  await recordClip('matrix-hold', matrixSecs * 1000, 4_000_000);
  await parkCursor();

  // Null pair for dominance: a SECOND music-only run, cursor parked. Two
  // independent runs of a chaotic state-bearing sim decorrelate frame-to-frame
  // even with no cursor, so dominance is judged against this floor — the
  // hold-vs-music delta must not exceed 2x the music-vs-music(null) delta.
  // (v5 cursor_bounded re-fit — mirrors the stills' drift pair.)
  await setAudio(true);
  await parkCursor();
  await page.waitForTimeout(300);
  await recordClip('matrix-music-b', matrixSecs * 1000, 4_000_000);

  // ---- build-spanning capture: cursor orbit across the build into the peak
  // (authority_during_build — cursor must stay visibly responsive while the
  // music ramps). 12 s starting ~8 s before the peak section.
  if (hasAudio && buildT !== null) {
    await page.evaluate(async (t) => { await window.__vj.seekAudio(t); }, buildT);
    await orbit(true);
    await page.waitForTimeout(300);
    await recordClip('build-cursor', 12_000, 6_000_000);
    await orbit(false);
    manifest.build = { start_t: Number(buildT.toFixed(1)), dur_s: 12 };
  }

  await writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 1));
  console.log(`[inspect-interaction] manifest: ${manifest.captures.length} captures, layers=${manifest.layers?.length ?? 0}, comparable_stills=${manifest.stills_comparable}`);
} finally {
  await browser.close();
}
