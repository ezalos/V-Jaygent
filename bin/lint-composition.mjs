#!/usr/bin/env node
// ABOUTME: Composition quadrant lint — measures where the "interesting pixels"
// ABOUTME: live (bright pixels with high local contrast) across a 2×2 grid.
// ABOUTME: Fails if a single quadrant holds > 60% of the interest mass.
// ABOUTME: Catches the murmuration Y-split that slipped past every other lint.
//
// Usage:
//   node bin/lint-composition.mjs <slug>             # lint existing frames
//   node bin/lint-composition.mjs <slug> --capture   # rerun inspect-music first
//   node bin/lint-composition.mjs <slug> --threshold 60  # max % per quadrant
//   node bin/lint-composition.mjs <slug> --verbose
//
// "Interesting pixel" = luminance above per-frame mean AND high local contrast
// (4-neighbour gradient magnitude above per-frame median). The combination
// excludes both pure background gradient and uniform bright regions; what's
// left is the structural detail the eye actually lands on.
//
// Exit codes: 0 = pass, 1 = fail, 2 = setup/IO error.

import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

const SAMPLE_W = 240;
const SAMPLE_H = 135;

function parseArgs(argv) {
  const out = { slug: null, capture: false, verbose: false, threshold: 60 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--capture') out.capture = true;
    else if (a === '--verbose') out.verbose = true;
    else if (a === '--threshold') out.threshold = Number(argv[++i]);
    else if (!a.startsWith('--') && !out.slug) out.slug = a;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (!args.slug || !SLUG_RE.test(args.slug)) {
  console.error('usage: node bin/lint-composition.mjs <slug> [--capture] [--threshold N] [--verbose]');
  process.exit(2);
}

const pieceDir = join(repoRoot, 'pieces', args.slug);
if (!existsSync(pieceDir)) {
  console.error(`no piece at pieces/${args.slug}`);
  process.exit(2);
}

const inspectDir = join(pieceDir, 'inspect-music');

if (args.capture || !existsSync(inspectDir)) {
  if (!args.capture && !existsSync(inspectDir)) {
    console.error(`no frames at ${inspectDir}; rerun with --capture`);
    process.exit(2);
  }
  console.log('[lint-composition] capturing fresh frames via inspect-music…');
  const r = spawnSync('node', ['bin/inspect-music.mjs', args.slug, '--no-video'], {
    cwd: repoRoot, stdio: 'inherit',
  });
  if (r.status !== 0) {
    console.error('[lint-composition] inspect-music failed; aborting lint');
    process.exit(2);
  }
}

const frames = (await readdir(inspectDir))
  .filter(f => f.endsWith('.png') && !f.startsWith('cursor-'))
  .sort();
if (frames.length === 0) {
  console.error(`no PNGs in ${inspectDir}`);
  process.exit(2);
}

// ---------- pixel helpers ----------

function loadLuminance(path) {
  return new Promise((res, rej) => {
    const chunks = [];
    const ff = spawn('ffmpeg', ['-loglevel', 'error', '-i', path,
      '-vf', `scale=${SAMPLE_W}:${SAMPLE_H}`,
      '-f', 'rawvideo', '-pix_fmt', 'gray', '-']);
    ff.stdout.on('data', (b) => chunks.push(b));
    ff.on('error', rej);
    ff.on('close', (code) => code === 0
      ? res(Buffer.concat(chunks))
      : rej(new Error('ffmpeg exit ' + code)));
  });
}

function quadrantInterest(buf, w, h) {
  // Build a gradient-magnitude map (4-neighbour) and a mean-luminance value.
  let sumY = 0;
  for (let i = 0; i < buf.length; i++) sumY += buf[i];
  const meanY = sumY / buf.length;

  const grad = new Float32Array(w * h);
  let gradSum = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const dx = buf[i + 1] - buf[i - 1];
      const dy = buf[i + w] - buf[i - w];
      const g = Math.sqrt(dx * dx + dy * dy);
      grad[i] = g;
      gradSum += g;
    }
  }
  const meanG = gradSum / ((w - 2) * (h - 2));

  // Interest mass = pixel counts above-mean-Y AND above-mean-G.
  // Each quadrant tallies its share. We then return percentages.
  const halfW = w >> 1, halfH = h >> 1;
  const counts = [0, 0, 0, 0]; // TL, TR, BL, BR
  let total = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (buf[i] < meanY) continue;
      if (grad[i] < meanG) continue;
      total++;
      const q = (y < halfH ? 0 : 2) + (x < halfW ? 0 : 1);
      counts[q]++;
    }
  }
  if (total === 0) {
    return { pct: [25, 25, 25, 25], total: 0, meanY: meanY / 255, meanG: meanG / 255 };
  }
  return {
    pct: counts.map(c => (c / total) * 100),
    total,
    meanY: meanY / 255,
    meanG: meanG / 255,
  };
}

// ---------- run ----------

const QNAMES = ['TL', 'TR', 'BL', 'BR'];
const perFrame = [];
const aggregate = [0, 0, 0, 0];
let aggregateTotal = 0;

for (const f of frames) {
  const buf = await loadLuminance(join(inspectDir, f));
  const q = quadrantInterest(buf, SAMPLE_W, SAMPLE_H);
  perFrame.push({ frame: f, ...q });
  for (let i = 0; i < 4; i++) aggregate[i] += (q.pct[i] / 100) * q.total;
  aggregateTotal += q.total;
}

const aggPct = aggregateTotal > 0
  ? aggregate.map(v => (v / aggregateTotal) * 100)
  : [25, 25, 25, 25];

console.log(`[lint-composition] piece=${args.slug} frames=${frames.length} threshold=${args.threshold}%`);
if (args.verbose) {
  for (const p of perFrame) {
    const peak = Math.max(...p.pct);
    const peakIdx = p.pct.indexOf(peak);
    const tag = peak > args.threshold ? 'FAIL' : 'ok';
    console.log(`  ${tag.padEnd(4)} TL${p.pct[0].toFixed(0).padStart(3)}% TR${p.pct[1].toFixed(0).padStart(3)}% BL${p.pct[2].toFixed(0).padStart(3)}% BR${p.pct[3].toFixed(0).padStart(3)}%  peak=${QNAMES[peakIdx]} ${p.frame}`);
  }
}
const top    = aggPct[0] + aggPct[1];
const bottom = aggPct[2] + aggPct[3];
const left   = aggPct[0] + aggPct[2];
const right  = aggPct[1] + aggPct[3];

console.log(`[lint-composition] aggregate quadrant share:`);
console.log(`  TL ${aggPct[0].toFixed(1).padStart(5)}%   TR ${aggPct[1].toFixed(1).padStart(5)}%    (top    ${top.toFixed(1)}%)`);
console.log(`  BL ${aggPct[2].toFixed(1).padStart(5)}%   BR ${aggPct[3].toFixed(1).padStart(5)}%    (bottom ${bottom.toFixed(1)}%)`);
console.log(`  (left ${left.toFixed(1)}%, right ${right.toFixed(1)}%)`);

const QUAD_LIMIT = args.threshold;       // any one corner — strict
const AXIS_LIMIT = 70;                   // any one half — catches band/Y-split

const peak = Math.max(...aggPct);
const peakIdx = aggPct.indexOf(peak);
const axisPeak = Math.max(top, bottom, left, right);
const axisName = axisPeak === top ? 'top' : axisPeak === bottom ? 'bottom'
                : axisPeak === left ? 'left' : 'right';

const failures = [];
if (peak > QUAD_LIMIT) {
  failures.push(`${QNAMES[peakIdx]} quadrant holds ${peak.toFixed(1)}% of interest mass (> ${QUAD_LIMIT}%)`);
}
if (axisPeak > AXIS_LIMIT) {
  failures.push(`${axisName} half holds ${axisPeak.toFixed(1)}% of interest mass (> ${AXIS_LIMIT}%, single-axis composition)`);
}

if (failures.length > 0) {
  console.log(`[lint-composition] FAIL — composition is unbalanced:`);
  for (const f of failures) console.log(`  - ${f}`);
  console.log('  Top-tier pieces distribute 2-4 landing candidates across the frame.');
  console.log('  Single-quadrant or single-axis concentration fails the composition');
  console.log('  probe and reads as a graphic, not a kinetic piece. Fix: rebalance');
  console.log('  subject placement, add interest to the dead zones, or rethink the brief.');
  process.exit(1);
}
console.log('[lint-composition] PASS');
process.exit(0);
