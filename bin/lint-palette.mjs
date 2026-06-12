#!/usr/bin/env node
// ABOUTME: Palette lint — decodes inspect-music PNG frames via ffmpeg, builds
// ABOUTME: a hue histogram, fails if > THRESH percent of meaningful pixels
// ABOUTME: fall in the cool zone (hue 120-280, the green-cyan-blue band).
// ABOUTME: Catches the failure mode that sank ocean-jb, plasma, first-bloom.
//
// Usage:
//   node bin/lint-palette.mjs <slug>             # lint pieces/<slug>/inspect-music
//   node bin/lint-palette.mjs <slug> --threshold 5
//   node bin/lint-palette.mjs <slug> --capture   # run inspect-music first
//   node bin/lint-palette.mjs <slug> --verbose   # per-frame breakdown
//
// Exit codes: 0 = pass, 1 = fail (>= THRESH cool), 2 = setup/IO error.

import { readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

function parseArgs(argv) {
  const out = { slug: null, threshold: 5, capture: false, verbose: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--threshold') out.threshold = Number(argv[++i]);
    else if (a === '--capture') out.capture = true;
    else if (a === '--verbose') out.verbose = true;
    else if (!a.startsWith('--') && !out.slug) out.slug = a;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (!args.slug || !SLUG_RE.test(args.slug)) {
  console.error('usage: node bin/lint-palette.mjs <slug> [--threshold N] [--capture] [--verbose]');
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
  console.log('[lint-palette] capturing fresh frames via inspect-music…');
  const r = spawnSync('node', ['bin/inspect-music.mjs', args.slug, '--no-video'], {
    cwd: repoRoot, stdio: 'inherit',
  });
  if (r.status !== 0) {
    console.error('[lint-palette] inspect-music failed; aborting lint');
    process.exit(2);
  }
}

const allFiles = await readdir(inspectDir);
const frames = allFiles.filter(f => f.endsWith('.png')).sort();
if (frames.length === 0) {
  console.error(`no PNGs in ${inspectDir}`);
  process.exit(2);
}

// ---------- pixel-decode helpers ----------

function loadFrameAsRgb(path) {
  return new Promise((res, rej) => {
    const chunks = [];
    const ff = spawn('ffmpeg', ['-loglevel', 'error', '-i', path,
      '-vf', 'scale=320:180', // downsample so we don't lint a million pixels per frame
      '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
    ff.stdout.on('data', (b) => chunks.push(b));
    ff.on('error', rej);
    ff.on('close', (code) => code === 0
      ? res(Buffer.concat(chunks))
      : rej(new Error('ffmpeg exit ' + code)));
  });
}

// Convert RGB byte triple to HSV components. h in [0,360), s/v in [0,1].
function rgbToHsv(r, g, b) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return [h, s, max];
}

// V-Jaygent warm cycle = roughly hue 0-60 (ember→amber→gold) plus
// 280-360 (wine→mauve→rose, looping back into red). Cool zone we
// REJECT: hue [120, 270] — green through deep blue. Cyan, teal,
// jade, indigo, navy.
//
// Pixels too dark (v < 0.05) or too desaturated (s < 0.12) don't
// count toward the population — they read as black or grey and
// don't tell us anything about palette intent.
const COOL_LO = 120;
const COOL_HI = 270;
const V_FLOOR = 0.05;
const S_FLOOR = 0.12;

function frameStats(rgb, w, h) {
  let counted = 0, cool = 0;
  const total = w * h;
  for (let i = 0; i < total; i++) {
    const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
    const [hue, sat, val] = rgbToHsv(r, g, b);
    if (val < V_FLOOR) continue;
    if (sat < S_FLOOR) continue;
    counted++;
    if (hue >= COOL_LO && hue <= COOL_HI) cool++;
  }
  return { counted, cool, total };
}

// ---------- run ----------

let aggregateCounted = 0;
let aggregateCool = 0;
const perFrame = [];

for (const f of frames) {
  const rgb = await loadFrameAsRgb(join(inspectDir, f));
  const stats = frameStats(rgb, 320, 180);
  aggregateCounted += stats.counted;
  aggregateCool += stats.cool;
  const pct = stats.counted > 0 ? (stats.cool / stats.counted) * 100 : 0;
  perFrame.push({ frame: f, pct, counted: stats.counted, cool: stats.cool });
}

const overallPct = aggregateCounted > 0
  ? (aggregateCool / aggregateCounted) * 100
  : 0;

console.log(`[lint-palette] piece=${args.slug} threshold=${args.threshold}% frames=${frames.length}`);
if (args.verbose) {
  console.log('  per-frame cool-zone %:');
  for (const p of perFrame) {
    const tag = p.pct > args.threshold ? 'FAIL' : 'ok';
    console.log(`    ${tag.padEnd(4)} ${p.pct.toFixed(2).padStart(6)}%  ${p.frame}`);
  }
}
console.log(`[lint-palette] overall cool-zone fraction: ${overallPct.toFixed(2)}%`);

if (overallPct > args.threshold) {
  console.log(`[lint-palette] FAIL — palette pushes into cool zone (hue ${COOL_LO}-${COOL_HI})`);
  console.log("  V-Jaygent's warm cycle is amber/ember/wine/mauve/cream. Cool intrusions");
  console.log('  (green, cyan, teal, indigo, navy) read as VISION.md violations.');
  console.log('  Either rewrite the palette function or, if the brief genuinely needs');
  console.log('  cool tones, raise the question at the brief stage (see ' +
              'brainstorming/techniques/canonical-pieces.md anti-patterns).');
  process.exit(1);
}
console.log('[lint-palette] PASS');
process.exit(0);
