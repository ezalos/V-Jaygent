#!/usr/bin/env node
// ABOUTME: Pause-vs-play harness — captures a piece at the SAME audio time in two
// ABOUTME: states (playing, then actually paused via __vj.pauseAudio) and diffs them,
// ABOUTME: to reproduce the "only beautiful when paused" class of bug headlessly.
//
// Usage:
//   node bin/inspect-pause.mjs <slug> <time> [<time> ...]
// Output: pieces/<slug>/inspect-pause/{NN-tT-play-a.png, NN-tT-play-b.png, NN-tT-paused.png}
// Prints, per time, the mean-luminance of play vs paused (a big paused>play gap
// is the freeze-accumulation bug) and the play-a/play-b motion delta.
//
// Why this exists: inspect-music PLAYS + seeks but never presses pause, so it
// cannot reproduce a difference between the playing render and the paused render.
// When paused mid-track the runtime keeps u_audio_playing=1 and pins u_time, so
// the ONLY difference is u_time frozen vs advancing — which exposes u_history
// freeze-accumulation and depth-scroll smear. This harness makes that visible.

import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchRenderBrowser } from './browser-launch.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const slug = args[0];
const times = args.slice(1).map(Number).filter((n) => Number.isFinite(n) && n >= 0);

if (!slug || times.length === 0) {
  console.error('usage: node bin/inspect-pause.mjs <slug> <time> [<time> ...]');
  process.exit(1);
}
const pieceDir = join(repoRoot, 'pieces', slug);
if (!existsSync(pieceDir)) { console.error(`no such piece: ${slug}`); process.exit(1); }

const outDir = join(pieceDir, 'inspect-pause');
await mkdir(outDir, { recursive: true });

const port = Number(process.env.STUDIO_PORT ?? 7777);
const url = `http://127.0.0.1:${port}/?piece=${encodeURIComponent(slug)}&record=1`;

// Mean luminance + bright-pixel fraction of the live #stage canvas, read back
// through a downsample 2d canvas. Returns a tiny summary, computed in-page.
const STAGE_STATS = `() => {
  const c = document.getElementById('stage');
  if (!c) return null;
  const w = 96, h = 54;
  const oc = document.createElement('canvas'); oc.width = w; oc.height = h;
  const ctx = oc.getContext('2d');
  ctx.drawImage(c, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  let sum = 0, bright = 0; const lum = new Float32Array(w*h);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const l = (0.30*d[i] + 0.59*d[i+1] + 0.11*d[i+2]) / 255;
    lum[p] = l; sum += l; if (l > 0.6) bright++;
  }
  return { mean: sum/(w*h), bright: bright/(w*h), lum: Array.from(lum) };
}`;

function meanAbsDelta(a, b) {
  if (!a || !b) return null;
  let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return s / a.length;
}

const browser = await launchRenderBrowser();
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  page.on('pageerror', (e) => console.log('[b:err]', e.message));

  await page.goto(url, { waitUntil: 'load' });
  await page.click('#stage').catch(() => {});
  // park cursor at idle sentinel so cursor layers don't contaminate
  await page.evaluate(() => {
    const c = document.getElementById('stage');
    if (c) window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: 0, clientY: c.clientHeight }));
  });
  await page.waitForFunction(() => window.__vj && typeof window.__vj.seekAudio === 'function', { timeout: 10_000 });
  await page.evaluate(async () => { if (window.__vj?.waitForAudio) await window.__vj.waitForAudio(8000); });
  // SOLO=<layer> isolates one layer (debug which layer differs play vs paused).
  const solo = process.env.SOLO || null;
  if (solo) await page.evaluate((s) => window.__vj.soloLayer && window.__vj.soloLayer(s), solo);
  await page.waitForTimeout(1200);

  for (let i = 0; i < times.length; i++) {
    const T = times[i];
    const tag = `t${T.toFixed(1)}`;
    const pre = `${String(i).padStart(2, '0')}-${tag}`;

    // --- PLAYING: seek, ensure playing, let it run, capture two frames 0.35s
    //     apart so the motion delta is measurable.
    await page.evaluate(async (t) => { await window.__vj.seekAudio(t); }, T);
    await page.evaluate(async () => { if (window.__vj?.resumeAudio) await window.__vj.resumeAudio(); });
    await page.waitForTimeout(900);                     // settle onset envelopes
    const playA = await page.evaluate(STAGE_STATS);
    await page.screenshot({ path: join(outDir, `${pre}-play-a.png`) });
    await page.waitForTimeout(350);
    const playB = await page.evaluate(STAGE_STATS);
    await page.screenshot({ path: join(outDir, `${pre}-play-b.png`) });

    // --- PAUSED: actually press pause (runtime keeps u_audio_playing=1 + pins
    //     u_time), then let the frozen frame settle/accumulate, then capture.
    await page.evaluate(() => window.__vj.pauseAudio && window.__vj.pauseAudio());
    await page.waitForTimeout(2000);                    // let u_history accumulate on freeze
    const paused = await page.evaluate(STAGE_STATS);
    await page.screenshot({ path: join(outDir, `${pre}-paused.png`) });

    // The in-page luminance readback returns blank for a WebGL canvas without
    // preserveDrawingBuffer, so the metric is best-effort; the PRIMARY signal is
    // a visual diff of the three PNG frames (that is what reproduced the bug).
    if (playA && paused && Number.isFinite(playA.mean) && Number.isFinite(paused.mean)) {
      const motion = meanAbsDelta(playA.lum, playB?.lum);
      const ratio = paused.mean / Math.max(1e-4, playA.mean);
      console.log(`\n[${tag}] PLAY mean=${playA.mean.toFixed(3)}  PAUSED mean=${paused.mean.toFixed(3)}`
        + `  ratio paused/play=${ratio.toFixed(2)}x  play-motion=${motion?.toFixed(4)}`);
      if (ratio > 1.25 || ratio < 0.8) {
        console.log(`  *** PAUSE DIVERGENCE: paused differs ${ratio.toFixed(2)}x from playing — compare ${pre}-play-a.png vs ${pre}-paused.png ***`);
      }
    } else {
      console.log(`\n[${tag}] metric n/a (WebGL readback blank) — COMPARE VISUALLY: ${pre}-play-a.png vs ${pre}-paused.png`);
    }
  }
  console.log(`\n[inspect-pause] wrote ${times.length * 3} frames to ${outDir}`);
} finally {
  await browser.close();
}
