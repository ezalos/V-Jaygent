#!/usr/bin/env node
// ABOUTME: Seam lint — finds straight luminance discontinuities (clip seams)
// ABOUTME: in inspect-music frames: bounding-box early-outs chopping glow, etc.
//
// A clip seam is: a single row/column where many pixels step (|grad| > STEP),
// spanning > SPAN of the frame, in a DIM region, and ISOLATED (neighbouring
// rows don't also score — distinguishing a hard cut from a steep smooth ramp
// like a glow's cap-height band, which scores across many adjacent rows).
//
// Born 2026-06-11: luminous-verse shipped with its per-glyph bounding box
// chopping the bass-widened halo into a straight seam at the peak — invisible
// in thumbnails, found by Louis's eyes. This lint is the mechanical version.
//
// Usage:
//   node bin/lint-seams.mjs <slug>            # scans pieces/<slug>/inspect-music
//   node bin/lint-seams.mjs <slug> --dir <d>  # scan an explicit directory
//   node bin/lint-seams.mjs <slug> --verbose
//
// Exit codes: 0 = pass, 1 = seams found, 2 = setup/IO error.

import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

const STEP  = 2.5 / 255;   // per-pixel gradient that counts as a step
const SPAN  = 0.45;        // fraction of the frame a seam must cross
const DIM   = 0.25;        // only flag seams in dim zones (lum below this)
const ISO   = 2.0;         // score vs neighbours ratio that means "isolated"

function parseArgs(argv) {
  const out = { slug: null, dir: null, verbose: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dir' && i + 1 < argv.length) out.dir = argv[++i];
    else if (a === '--verbose') out.verbose = true;
    else if (!a.startsWith('--') && !out.slug) out.slug = a;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (!args.slug || !SLUG_RE.test(args.slug)) {
  console.error('usage: node bin/lint-seams.mjs <slug> [--dir <dir>] [--verbose]');
  process.exit(2);
}

const framesDir = args.dir
  ? resolve(args.dir)
  : join(repoRoot, 'pieces', args.slug, 'inspect-music');
if (!existsSync(framesDir)) {
  console.error(`no frames at ${framesDir}`);
  process.exit(2);
}

function loadGray(path) {
  // full-res grayscale via ffmpeg rawvideo (same trick as lint-idle)
  return new Promise((res, rej) => {
    const probe = spawn('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height', '-of', 'csv=p=0', path]);
    let dims = '';
    probe.stdout.on('data', (b) => { dims += b.toString(); });
    probe.on('close', () => {
      const [w, h] = dims.trim().split(',').map(Number);
      if (!w || !h) return rej(new Error('ffprobe failed for ' + path));
      const chunks = [];
      const ff = spawn('ffmpeg', ['-loglevel', 'error', '-i', path,
        '-f', 'rawvideo', '-pix_fmt', 'gray', '-']);
      ff.stdout.on('data', (b) => chunks.push(b));
      ff.on('close', (code) => code === 0
        ? res({ buf: Buffer.concat(chunks), w, h })
        : rej(new Error('ffmpeg exit ' + code)));
    });
  });
}

// score lines along one axis; returns seams [{index, span, lum}]
function findSeams(buf, w, h, axis) {
  const lines = axis === 'row' ? h - 1 : w - 1;
  const across = axis === 'row' ? w : h;
  const score = new Float64Array(lines);
  const lum = new Float64Array(lines);
  for (let i = 0; i < lines; i++) {
    let steps = 0, sum = 0;
    for (let j = 0; j < across; j++) {
      const a = axis === 'row' ? buf[i * w + j]       : buf[j * w + i];
      const b = axis === 'row' ? buf[(i + 1) * w + j] : buf[j * w + i + 1];
      if (Math.abs(a - b) / 255 > STEP) steps++;
      sum += a;
    }
    score[i] = steps / across;
    lum[i] = sum / across / 255;
  }
  const seams = [];
  for (let i = 4; i < lines - 4; i++) {
    if (score[i] < SPAN || lum[i] > DIM) continue;
    const neigh = (score[i - 4] + score[i - 3] + score[i + 3] + score[i + 4]) / 4;
    if (score[i] / (neigh + 1e-4) > ISO) {
      seams.push({ index: i, span: score[i], lum: lum[i] });
    }
  }
  return seams;
}

const frames = (await readdir(framesDir)).filter((f) => f.endsWith('.png'));
if (frames.length === 0) {
  console.error(`no PNG frames in ${framesDir}`);
  process.exit(2);
}

let failed = false;
for (const f of frames) {
  const { buf, w, h } = await loadGray(join(framesDir, f));
  const seams = [
    ...findSeams(buf, w, h, 'row').map((s) => ({ ...s, axis: 'row' })),
    ...findSeams(buf, w, h, 'col').map((s) => ({ ...s, axis: 'col' })),
  ];
  if (seams.length > 0) {
    failed = true;
    console.log(`  ✗ ${f}`);
    for (const s of seams.slice(0, 4)) {
      console.log(`      ${s.axis} ${s.index}: step spans ${(s.span * 100).toFixed(0)}%` +
        ` of frame in dim zone (lum ${(s.lum).toFixed(2)})`);
    }
  } else if (args.verbose) {
    console.log(`  ✓ ${f}`);
  }
}

if (failed) {
  console.log('[lint-seams] FAIL — straight luminance discontinuities found.');
  console.log('  Usual suspect: a bounding-box early-out chopping a glow/field');
  console.log('  whose falloff outgrew the box. Give the kernel compact support');
  console.log('  (fade to zero inside the box) instead of enlarging the box.');
  process.exit(1);
}
console.log(`[lint-seams] PASS — ${frames.length} frames, no clip seams`);
