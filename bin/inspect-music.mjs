#!/usr/bin/env node
// ABOUTME: Music-aware inspect — seeks audioEl.currentTime to section anchors
// ABOUTME: from audio.analysis.json (intro/verse/pre-peak/peak/quiet/outro),
// ABOUTME: captures one frame per anchor plus a 10–14s peak clip. Falls back
// ABOUTME: to wall-clock spread for pieces without audio.
//
// Usage:
//   node bin/inspect-music.mjs <slug>                  # frames + peak clip
//   node bin/inspect-music.mjs <slug> --no-video       # frames only
//   node bin/inspect-music.mjs <slug> --frames N       # override frame count
//   node bin/inspect-music.mjs <slug> --cursor         # also capture two
//                                                       cursor-active frames
//
// Output: pieces/<slug>/inspect-music/{music-NN-tT-label.png, clip-peak.mp4}
// Prereq: studio server running on STUDIO_PORT (default 7777) WITH the
//         exposeRecordingHooks patch (seekAudio/waitForAudio).

import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, dirname, resolve, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

function parseArgs(argv) {
  const out = { slug: null, video: true, frames: null, cursor: false, times: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--no-video') out.video = false;
    else if (a === '--frames') out.frames = Number(argv[++i]);
    else if (a === '--cursor') out.cursor = true;
    else if (a === '--times') {
      out.times = argv[++i].split(',').map(Number).filter(n => Number.isFinite(n) && n >= 0);
    }
    else if (!a.startsWith('--') && !out.slug) out.slug = a;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (!args.slug || !SLUG_RE.test(args.slug)) {
  console.error('usage: node bin/inspect-music.mjs <slug> [--no-video] [--frames N] [--cursor] [--times s1,s2,...]');
  process.exit(2);
}

const pieceDir = join(repoRoot, 'pieces', args.slug);
if (!existsSync(pieceDir)) {
  console.error(`no piece at pieces/${args.slug}`);
  process.exit(1);
}

const meta = yaml.load(await readFile(join(pieceDir, 'meta.yaml'), 'utf8')) ?? {};
const audioSpec = meta.audio;
const hasAudio = Boolean(audioSpec) && audioSpec !== 'live' && existsSync(join(pieceDir, audioSpec));
const audioBase = audioSpec ? basename(audioSpec, extname(audioSpec)) : 'audio';
const analysisPath = join(pieceDir, `${audioBase}.analysis.json`);
let analysis = null;
if (hasAudio && existsSync(analysisPath)) {
  try { analysis = JSON.parse(await readFile(analysisPath, 'utf8')); }
  catch (e) { console.warn('[inspect-music] failed to parse analysis JSON:', e.message); }
}

const outDir = join(pieceDir, 'inspect-music');
await mkdir(outDir, { recursive: true });

// ---------- choose timestamps ----------

function chooseStops() {
  // Case 0: explicit --times — narrative pieces want exact story timestamps
  if (args.times && args.times.length > 0 && hasAudio) {
    return args.times.map(t => ({
      label: `t${Math.round(t)}`,
      mode: 'audio',
      audioT: t,
    }));
  }
  // Case 1: no audio — wall-clock spread, mirror inspect.mjs
  if (!hasAudio) {
    const n = args.frames ?? 5;
    const dur = Number(meta.duration ?? 30);
    const interval = Math.max(2, dur * 0.7 / n);
    return Array.from({ length: n }, (_, i) => ({
      label: `wall-${i}`,
      mode: 'wall',
      wallT: 1.5 + i * interval,
    }));
  }
  // Case 2: audio but no analysis — spread by audioCurrentTime
  if (!analysis || !Array.isArray(analysis.sections) || analysis.sections.length === 0) {
    const dur = Number(analysis?.duration_sec ?? meta.duration ?? 60);
    const n = args.frames ?? 5;
    return Array.from({ length: n }, (_, i) => ({
      label: `audio-${i}`,
      mode: 'audio',
      audioT: (i + 0.5) * dur / n,
    }));
  }
  // Case 3: full analysis — pick section anchors
  const sections = analysis.sections.filter(s => (s.end - s.start) > 2.5);
  if (sections.length === 0) {
    const dur = Number(analysis.duration_sec ?? meta.duration ?? 60);
    const n = args.frames ?? 5;
    return Array.from({ length: n }, (_, i) => ({
      label: `audio-${i}`, mode: 'audio',
      audioT: (i + 0.5) * dur / n,
    }));
  }
  const totalDur = analysis.duration_sec
    ?? sections[sections.length - 1].end;
  // Energy-sort to find peak + quiet (excluding intro/outro to avoid bias)
  const inner = sections.length >= 4 ? sections.slice(1, -1) : sections;
  const byEnergyDesc = [...inner].sort((a, b) => b.energy - a.energy);
  const peak = byEnergyDesc[0];
  const quiet = byEnergyDesc[byEnergyDesc.length - 1];
  const intro = sections[0];
  const outro = sections[sections.length - 1];
  // verse = first non-intro mid-energy section
  const midEnergy = [...inner].sort((a, b) => Math.abs(a.energy - 0.4) - Math.abs(b.energy - 0.4))[0]
    ?? inner[0] ?? sections[0];
  // pre-peak: 2s before peak starts (build moment)
  const candidates = [
    { label: 'intro',    audioT: intro.start + Math.min(1.0, (intro.end - intro.start) * 0.3) },
    { label: 'verse',    audioT: midEnergy.start + (midEnergy.end - midEnergy.start) * 0.35 },
    { label: 'pre-peak', audioT: Math.max(intro.start + 0.5, peak.start - 1.5) },
    { label: 'peak',     audioT: peak.start + (peak.end - peak.start) * 0.33 },
    { label: 'quiet',    audioT: quiet.start + (quiet.end - quiet.start) * 0.5 },
    { label: 'outro',    audioT: Math.min(totalDur - 2.0, outro.start + (outro.end - outro.start) * 0.5) },
  ];
  // Dedupe stops that are within 2.5s of a prior stop, in declared order
  const out = [];
  for (const c of candidates) {
    if (out.length === 0 || out.every(o => Math.abs(o.audioT - c.audioT) > 2.5)) {
      out.push({ ...c, mode: 'audio' });
    }
  }
  return out;
}

const stops = chooseStops();
console.log(`[inspect-music] piece=${args.slug} hasAudio=${hasAudio} hasAnalysis=${!!analysis} stops=${stops.length}`);
for (const s of stops) {
  console.log(`  ${s.label.padEnd(10)} ${s.mode === 'audio' ? `audioT=${s.audioT.toFixed(2)}s` : `wallT=${s.wallT.toFixed(2)}s`}`);
}

// ---------- capture ----------

const port = Number(process.env.STUDIO_PORT ?? 7777);
const url = `http://127.0.0.1:${port}/?piece=${encodeURIComponent(args.slug)}&record=1`;

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
  page.on('console',   (m) => console.log('[b]', m.type(), m.text().slice(0, 280)));
  page.on('pageerror', (e) => console.log('[b:err]', e.message));

  await page.goto(url, { waitUntil: 'load' });
  // Unlock audio with a stage click (no-op for silent pieces).
  await page.click('#stage').catch(() => {});
  // Park cursor at idle sentinel (0, canvas.height) — runtime tracks
  // pointermove on window, not mousemove. Without this the cursor sits
  // at canvas centre and contaminates cursor-reactive layers.
  await page.evaluate(() => {
    const c = document.getElementById('stage');
    if (!c) return;
    window.dispatchEvent(new PointerEvent('pointermove', {
      pointerType: 'mouse', clientX: 0, clientY: c.clientHeight,
    }));
  });
  // Wait for first compile + audio readiness if applicable.
  await page.waitForFunction(() => window.__vj && typeof window.__vj.record === 'function', { timeout: 10_000 });
  if (hasAudio) {
    const audioReady = await page.evaluate(async () => {
      if (!window.__vj?.waitForAudio) return false;
      return await window.__vj.waitForAudio(8000);
    });
    if (!audioReady) {
      console.warn('[inspect-music] audio failed to ready in time; proceeding anyway');
    }
  }
  await page.waitForTimeout(1500);

  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];
    if (s.mode === 'audio') {
      const seekRes = await page.evaluate(async (t) => {
        if (!window.__vj?.seekAudio) return { ok: false, reason: 'no-hook' };
        return await window.__vj.seekAudio(t);
      }, s.audioT);
      if (!seekRes.ok) {
        console.warn(`[inspect-music] seek failed at ${s.label}: ${seekRes.reason}`);
      }
      // Let audio + onset envelopes + smoothing buffers stabilise after seek.
      await page.waitForTimeout(900);
    } else {
      const delay = i === 0 ? s.wallT * 1000 : (s.wallT - stops[i - 1].wallT) * 1000;
      await page.waitForTimeout(Math.max(0, delay));
    }
    const tag = s.mode === 'audio' ? `t${s.audioT.toFixed(1)}` : `t${s.wallT.toFixed(1)}`;
    const name = `music-${String(i).padStart(2, '0')}-${tag}-${s.label}.png`;
    await page.screenshot({ path: join(outDir, name) });
    console.log(`[inspect-music] wrote ${name}`);
  }

  // Optional: 2 cursor-active frames at the peak moment.
  if (args.cursor) {
    const peak = stops.find(s => s.label === 'peak') ?? stops[Math.floor(stops.length / 2)];
    if (peak.mode === 'audio') {
      await page.evaluate(async (t) => await window.__vj.seekAudio(t), peak.audioT);
    }
    await page.waitForTimeout(700);
    for (const [tag, x, y] of [['cursor-tl', 320, 180], ['cursor-br', 960, 540]]) {
      await page.evaluate(([cx, cy]) => {
        window.dispatchEvent(new PointerEvent('pointermove', {
          pointerType: 'mouse', clientX: cx, clientY: cy,
        }));
      }, [x, y]);
      await page.waitForTimeout(400);
      const name = `cursor-${tag}.png`;
      await page.screenshot({ path: join(outDir, name) });
      console.log(`[inspect-music] wrote ${name}`);
    }
    // Re-park cursor
    await page.evaluate(() => {
      const c = document.getElementById('stage');
      if (!c) return;
      window.dispatchEvent(new PointerEvent('pointermove', {
        pointerType: 'mouse', clientX: 0, clientY: c.clientHeight,
      }));
    });
  }

  // Multi-window clips for the two-timescale Prediction probe
  // (see taste.md Probe 2 + VISION.md §"On unpredictability"). We need
  // BOTH continuity within each window AND divergence across windows,
  // so a single peak-only clip is insufficient. 4–5 short clips spread
  // across the piece let the critic validate both timescales.
  if (args.video && hasAudio && analysis?.sections?.length) {
    const inner = analysis.sections.length >= 4
      ? analysis.sections.slice(1, -1) : analysis.sections;
    const peakSec = [...inner].sort((a, b) => b.energy - a.energy)[0];
    const totalDur = analysis.duration_sec
      ?? analysis.sections[analysis.sections.length - 1].end;

    // Build 5 sample windows: pick from sections so each window captures
    // a distinct phase of the song. Always include the peak (kept named
    // `peak` for back-compat with anything reading clip-peak.mp4).
    const sortedByStart = [...analysis.sections].sort((a, b) => a.start - b.start);
    const intro = sortedByStart[0];
    const outro = sortedByStart[sortedByStart.length - 1];
    const midEnergy = [...inner].sort((a, b) => Math.abs(a.energy - 0.4) - Math.abs(b.energy - 0.4))[0]
      ?? inner[0];
    const quiet = [...inner].sort((a, b) => a.energy - b.energy)[0];
    const winSpecs = [
      { label: 'intro',  sec: intro,     offset: 0.3 },
      { label: 'verse',  sec: midEnergy, offset: 0.35 },
      { label: 'build',  sec: peakSec,   offset: -1.5, prePeak: true },
      { label: 'peak',   sec: peakSec,   offset: 0.33 },
      { label: 'outro',  sec: outro,     offset: 0.5 },
    ];

    // Dedupe windows that would land within 4s of each other (short pieces
    // can have overlapping section centres).
    const windows = [];
    for (const spec of winSpecs) {
      const len = Math.max(2, spec.sec.end - spec.sec.start);
      let start = spec.prePeak
        ? Math.max(0, spec.sec.start + spec.offset)
        : spec.sec.start + len * spec.offset;
      start = Math.min(start, Math.max(0, totalDur - 5.5));
      if (windows.every(w => Math.abs(w.start - start) > 4.0)) {
        windows.push({ label: spec.label, start });
      }
    }
    // Sort by start time so clip filenames index in playback order.
    windows.sort((a, b) => a.start - b.start);

    const clipDur = 5.0;  // seconds per window — long enough for 1s
                          // continuity test, short enough that 5 × dur
                          // doesn't dominate render time.
    console.log(`[inspect-music] recording ${windows.length} × ${clipDur}s multi-window clips`);
    for (let wi = 0; wi < windows.length; wi++) {
      const win = windows[wi];
      const tag = `t${win.start.toFixed(1)}`;
      console.log(`  [w${wi}] ${win.label.padEnd(6)} audioT=${win.start.toFixed(1)}s`);
      await page.evaluate(async (t) => { await window.__vj.seekAudio(t); }, win.start);
      await page.waitForTimeout(450);
      const webmBytes = await page.evaluate(async (ms) => {
        return await window.__vj.record(ms);
      }, Math.round(clipDur * 1000));
      const baseName = `clip-w${wi}-${tag}-${win.label}`;
      const webmPath = join(outDir, `${baseName}.webm`);
      const mp4Path  = join(outDir, `${baseName}.mp4`);
      await writeFile(webmPath, Buffer.from(webmBytes));
      await new Promise((res, rej) => {
        const ff = spawn('ffmpeg', [
          '-y', '-i', webmPath, '-r', '60',
          '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2',
          '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '22',
          '-an', mp4Path,
        ], { stdio: ['ignore', 'inherit', 'inherit'] });
        ff.on('close', (c) => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)));
        ff.on('error', rej);
      });
      // Back-compat: also emit `clip-peak.{mp4,webm}` for the peak window
      // so older tools that hard-code that filename still work.
      if (win.label === 'peak') {
        await writeFile(join(outDir, 'clip-peak.webm'), Buffer.from(webmBytes));
        await new Promise((res, rej) => {
          const ff = spawn('ffmpeg', [
            '-y', '-i', join(outDir, 'clip-peak.webm'), '-r', '60',
            '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2',
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '22',
            '-an', join(outDir, 'clip-peak.mp4'),
          ], { stdio: ['ignore', 'inherit', 'inherit'] });
          ff.on('close', (c) => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)));
          ff.on('error', rej);
        });
      }
      console.log(`    wrote ${mp4Path}`);
    }
  }
} finally {
  await browser.close();
}
