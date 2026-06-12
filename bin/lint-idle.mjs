#!/usr/bin/env node
// ABOUTME: Idle-survives lint — captures frames at u_mouse=(0,0), u_audio=0
// ABOUTME: (the inspect-music sentinel), checks they have meaningful content
// ABOUTME: and visible motion between samples. Fails pieces that go blank
// ABOUTME: or freeze without inputs. Catches atoll-class "needs keys to be alive".
//
// Usage:
//   node bin/lint-idle.mjs <slug>             # uses existing inspect-music frames
//   node bin/lint-idle.mjs <slug> --capture   # rerun inspect-music first
//   node bin/lint-idle.mjs <slug> --verbose
//
// Pass/fail thresholds:
//   - mean luminance across frames must be >= 0.03 (frame can't be near-black).
//   - inter-frame pixel delta must be >= 0.005 on average (piece can't be frozen).
//     Computed as mean |Y_n - Y_{n-1}| over downsampled luminance maps.
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

const LUM_FLOOR = 0.03;        // mean luminance must clear this
const MOTION_FLOOR = 0.025;    // mean inter-frame Y delta must clear this
                               // (tuned 2026-05-11: atoll's keyboard-only
                               // sit-still passes at 0.0226 — anything
                               // below 0.025 reads as "not actually
                               // composing motion, just ambient u_time")
const SAMPLE_W = 160;
const SAMPLE_H = 90;

function parseArgs(argv) {
  const out = { slug: null, capture: false, verbose: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--capture') out.capture = true;
    else if (a === '--verbose') out.verbose = true;
    else if (!a.startsWith('--') && !out.slug) out.slug = a;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (!args.slug || !SLUG_RE.test(args.slug)) {
  console.error('usage: node bin/lint-idle.mjs <slug> [--capture] [--verbose]');
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
  console.log('[lint-idle] capturing fresh frames via inspect-music…');
  const r = spawnSync('node', ['bin/inspect-music.mjs', args.slug, '--no-video'], {
    cwd: repoRoot, stdio: 'inherit',
  });
  if (r.status !== 0) {
    console.error('[lint-idle] inspect-music failed; aborting lint');
    process.exit(2);
  }
}

const frames = (await readdir(inspectDir))
  .filter(f => f.endsWith('.png') && !f.startsWith('cursor-'))
  .sort();
if (frames.length < 2) {
  console.error(`need ≥ 2 frames in ${inspectDir} to compute motion (have ${frames.length})`);
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

function meanLuminance(buf) {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i];
  return sum / buf.length / 255;
}

function meanAbsDelta(a, b) {
  // expects equal-length buffers
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length / 255;
}

// ---------- run ----------

const lums = [];
const deltas = [];
let prev = null;

for (const f of frames) {
  const buf = await loadLuminance(join(inspectDir, f));
  const lum = meanLuminance(buf);
  lums.push({ frame: f, lum });
  if (prev) deltas.push({ frame: f, delta: meanAbsDelta(prev, buf) });
  prev = buf;
}

const meanLum = lums.reduce((a, x) => a + x.lum, 0) / lums.length;
const meanMotion = deltas.length > 0
  ? deltas.reduce((a, x) => a + x.delta, 0) / deltas.length
  : 0;

console.log(`[lint-idle] piece=${args.slug} frames=${frames.length}`);
if (args.verbose) {
  console.log('  per-frame mean luminance:');
  for (const l of lums) {
    console.log(`    ${l.lum.toFixed(4)}  ${l.frame}`);
  }
  console.log('  inter-frame Y delta:');
  for (const d of deltas) {
    console.log(`    ${d.delta.toFixed(4)}  → ${d.frame}`);
  }
}
console.log(`[lint-idle] mean luminance: ${meanLum.toFixed(4)} (floor ${LUM_FLOOR})`);
console.log(`[lint-idle] mean motion:    ${meanMotion.toFixed(4)} (floor ${MOTION_FLOOR})`);

const reasons = [];
if (meanLum < LUM_FLOOR) reasons.push(`mean luminance ${meanLum.toFixed(4)} < ${LUM_FLOOR} (frames are essentially black)`);
if (meanMotion < MOTION_FLOOR) reasons.push(`mean motion ${meanMotion.toFixed(4)} < ${MOTION_FLOOR} (piece is frozen without inputs)`);

if (reasons.length > 0) {
  console.log('[lint-idle] FAIL — piece does not survive idle');
  for (const r of reasons) console.log(`  - ${r}`);
  console.log('  Every chef-d\'oeuvre survives u_mouse=(0,0), u_audio=0. If your piece');
  console.log('  needs keys or sustained cursor to be alive, either add an idle drift');
  console.log('  (cf brick\'s idle fist, cymatic\'s FBM mode sweep) or rewrite the brief');
  console.log('  to be self-playing first, interactive second.');
  process.exit(1);
}
console.log('[lint-idle] PASS');
process.exit(0);
