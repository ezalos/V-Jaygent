#!/usr/bin/env node
// ABOUTME: Static audit of a piece against the lessons in tasks/lessons.md.
// ABOUTME: Reads meta.yaml + each layer's shader.frag and reports findings.
//
// Usage:
//   node bin/audit-piece.mjs <slug>      audit one piece
//   node bin/audit-piece.mjs --all       audit every piece (full report)
//   node bin/audit-piece.mjs --weak      audit every piece, print only those
//                                         with warnings or failures
//
// Encoded lessons (mechanical checks only — semantic ones still need eyes):
//   - feedback_multi_layer_multi_input_default: 3-7 layers preferred
//   - feedback_per_layer_interactivity:        ≥2 layers read u_mouse;
//                                              ≥2 layers read u_keys if
//                                              keyboard_synth declared
//   - feedback_visual_phase_lock:              if audio_features set, the
//                                              song-level uniforms must
//                                              actually be consumed by some
//                                              layer
//   - feedback_runtime_caveats #6:             layers publishing vec2 force
//                                              data must set alpha:0

import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

const SONG_LEVEL_UNIFORMS = [
  'u_bar_phase',
  'u_beat_phase',
  'u_downbeat',
  'u_section_id',
  'u_section_progress',
  'u_song_progress',
];

const args = process.argv.slice(2);
const mode = args[0] === '--all' ? 'all'
           : args[0] === '--weak' ? 'weak'
           : args[0]
           ? 'single'
           : null;

if (!mode) {
  console.error('usage: node bin/audit-piece.mjs <slug> | --all | --weak');
  process.exit(2);
}

let pieces;
if (mode === 'single') {
  pieces = [args[0]];
} else {
  pieces = (await readdir(join(repoRoot, 'pieces'), { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

let pieceSummaries = [];

for (const slug of pieces) {
  const report = await auditPiece(slug);
  pieceSummaries.push({ slug, ...report });
  if (mode === 'weak' && report.warns + report.fails === 0) continue;
  printReport(slug, report);
}

if (mode !== 'single') {
  printRollup(pieceSummaries);
}

// ---------- audit one piece ----------

async function auditPiece(slug) {
  const findings = [];
  const pieceDir = join(repoRoot, 'pieces', slug);
  const metaPath = join(pieceDir, 'meta.yaml');

  if (!existsSync(metaPath)) {
    findings.push(['FAIL', 'meta.yaml missing']);
    return tally(findings);
  }

  let meta;
  try {
    meta = yaml.load(await readFile(metaPath, 'utf8')) ?? {};
  } catch (err) {
    findings.push(['FAIL', `meta.yaml parse error: ${err.message}`]);
    return tally(findings);
  }

  const hasLayers = Array.isArray(meta.layers) && meta.layers.length > 0;
  const audioFeatures = meta.audio_features;
  const keyboardSynth = !!meta.keyboard_synth;
  const declaresAudio = Array.isArray(audioFeatures) && audioFeatures.length > 0;

  // ---- architecture
  if (hasLayers) {
    const n = meta.layers.length;
    findings.push([
      n >= 3 && n <= 7 ? 'PASS' : 'WARN',
      `architecture: layer-stack with ${n} layer${n === 1 ? '' : 's'}` +
        (n < 3 ? ' (default is 3-7)' : n > 7 ? ' (>7 — usually too many)' : ''),
    ]);
  } else {
    findings.push([
      keyboardSynth || declaresAudio ? 'WARN' : 'PASS',
      `architecture: single-shader monolithic` +
        (keyboardSynth ? ' but declares keyboard_synth' : '') +
        (declaresAudio ? ' but declares audio_features' : ''),
    ]);
  }

  // ---- per-layer scan
  const layerScans = [];
  if (hasLayers) {
    for (const entry of meta.layers) {
      const layerName = typeof entry === 'string' ? entry : entry.layer;
      if (!layerName) continue;
      const shaderPath = await resolveLayerShader(slug, layerName);
      const layerEntry = typeof entry === 'object' ? entry : {};
      if (!shaderPath) {
        findings.push(['FAIL', `layer ${layerName}: shader.frag not found (looked in piece-local then global)`]);
        layerScans.push({ name: layerName, missing: true, entry: layerEntry });
        continue;
      }
      const src = await readFile(shaderPath, 'utf8');
      const scan = scanShader(src);
      layerScans.push({ name: layerName, scan, entry: layerEntry, path: shaderPath });

      // rg-leak check: publishes vec2 but alpha not 0
      const publishes = layerEntry.publishes ?? {};
      const publishesVec2 = Object.values(publishes).some((t) => t === 'vec2');
      if (publishesVec2 && layerEntry.alpha !== 0 && layerEntry.alpha !== 0.0) {
        findings.push([
          'FAIL',
          `layer ${layerName}: publishes vec2 force data but alpha=${layerEntry.alpha ?? 'unset'} (should be 0; rg channels leak as red/green pixels)`,
        ]);
      }
    }
  } else {
    // Monolithic — look for shader.frag at the piece root
    const shaderPath = join(pieceDir, 'shader.frag');
    if (existsSync(shaderPath)) {
      const src = await readFile(shaderPath, 'utf8');
      layerScans.push({ name: '<monolithic>', scan: scanShader(src), entry: {}, path: shaderPath });
    } else {
      findings.push(['FAIL', 'no shader.frag at piece root and no layers: declared']);
      return tally(findings);
    }
  }

  // ---- input coverage
  const cursorLayers = layerScans.filter((l) => l.scan?.readsMouse);
  const keyLayers = layerScans.filter((l) => l.scan?.readsKeys);
  const audioLayers = layerScans.filter((l) => l.scan?.readsAnyAudio);

  if (hasLayers) {
    findings.push([
      cursorLayers.length >= 2 ? 'PASS'
      : cursorLayers.length === 1 ? 'WARN'
      : 'WARN',
      `cursor: ${cursorLayers.length}/${layerScans.length} layer${layerScans.length === 1 ? '' : 's'} read u_mouse` +
        (cursorLayers.length < 2 ? ' (per-layer interactivity expects ≥2)' : ''),
    ]);
  } else {
    findings.push([
      cursorLayers.length === 0 ? 'WARN' : 'PASS',
      `cursor: ${cursorLayers.length === 0 ? 'shader does not read u_mouse — piece is non-interactive' : 'shader reads u_mouse'}`,
    ]);
  }

  if (keyboardSynth) {
    findings.push([
      keyLayers.length >= 2 ? 'PASS'
      : keyLayers.length === 1 ? 'WARN'
      : 'FAIL',
      `keyboard: ${keyLayers.length}/${layerScans.length} layer${layerScans.length === 1 ? '' : 's'} read u_keys/u_key_event (declares keyboard_synth)` +
        (keyLayers.length < 2 ? ' — per-layer interactivity expects ≥2 keyboard-aware layers' : ''),
    ]);
  }

  // ---- audio phase-lock
  if (declaresAudio) {
    const consumers = {};
    for (const u of SONG_LEVEL_UNIFORMS) consumers[u] = 0;
    for (const l of layerScans) {
      if (!l.scan) continue;
      for (const u of SONG_LEVEL_UNIFORMS) {
        if (l.scan.uniformReads.has(u)) consumers[u]++;
      }
    }
    const missing = SONG_LEVEL_UNIFORMS.filter((u) => consumers[u] === 0);
    if (missing.length === 0) {
      findings.push([
        'PASS',
        `phase-lock: all 6 song-level uniforms consumed (bar/beat/downbeat/section_id/section_progress/song_progress)`,
      ]);
    } else if (missing.length <= 2) {
      findings.push([
        'WARN',
        `phase-lock: ${missing.length} song-level uniform${missing.length === 1 ? '' : 's'} unused — ${missing.join(', ')}`,
      ]);
    } else {
      findings.push([
        'WARN',
        `phase-lock: ${missing.length}/6 song-level uniforms unused — ${missing.join(', ')}; audio_features is declared so all should drive geometry`,
      ]);
    }
    findings.push([
      audioLayers.length >= 2 ? 'PASS' : 'WARN',
      `audio: ${audioLayers.length}/${layerScans.length} layer${layerScans.length === 1 ? '' : 's'} read u_audio_*`,
    ]);
  }

  // ---- inspection signals (informational)
  const inspectDir = join(pieceDir, 'inspect');
  if (existsSync(inspectDir)) {
    const frames = (await readdir(inspectDir)).filter((f) => f.endsWith('.png'));
    findings.push(['INFO', `inspect/ has ${frames.length} frame${frames.length === 1 ? '' : 's'}`]);
  } else {
    findings.push(['INFO', 'no inspect/ frames captured']);
  }
  if (declaresAudio) {
    const analysisExists = existsSync(join(pieceDir, 'audio.analysis.json'));
    findings.push([
      analysisExists ? 'INFO' : 'WARN',
      analysisExists ? 'audio.analysis.json present' : 'audio.analysis.json missing — song-level uniforms will be 0',
    ]);
  }

  return tally(findings);
}

// ---------- helpers ----------

function tally(findings) {
  let passes = 0, warns = 0, fails = 0;
  for (const [level] of findings) {
    if (level === 'PASS') passes++;
    else if (level === 'WARN') warns++;
    else if (level === 'FAIL') fails++;
  }
  return { findings, passes, warns, fails };
}

async function resolveLayerShader(slug, layerName) {
  const pieceLocal = join(repoRoot, 'pieces', slug, 'layers', layerName, 'shader.frag');
  if (existsSync(pieceLocal)) return pieceLocal;
  const global = join(repoRoot, 'layers', layerName, 'shader.frag');
  if (existsSync(global)) return global;
  return null;
}

function scanShader(src) {
  // Strip line and block comments before testing — a uniform mentioned only
  // inside a comment doesn't count as actually consumed.
  const stripped = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
  const uniformReads = new Set();
  // Catch every u_<name> identifier read in the shader.
  for (const m of stripped.matchAll(/\bu_[a-zA-Z][a-zA-Z0-9_]*/g)) {
    uniformReads.add(m[0]);
  }
  const readsMouse = uniformReads.has('u_mouse');
  const readsKeys  = uniformReads.has('u_keys') || uniformReads.has('u_key_event');
  const readsAnyAudio = [...uniformReads].some((u) => u.startsWith('u_audio_'));
  return { uniformReads, readsMouse, readsKeys, readsAnyAudio };
}

function printReport(slug, report) {
  const header = `=== ${slug} ===`;
  console.log(header);
  for (const [level, msg] of report.findings) {
    const tag = level === 'PASS' ? 'PASS'
              : level === 'WARN' ? 'WARN'
              : level === 'FAIL' ? 'FAIL'
              : 'INFO';
    console.log(`  [${tag}] ${msg}`);
  }
  console.log(`  ── ${report.passes} pass / ${report.warns} warn / ${report.fails} fail`);
  console.log('');
}

function printRollup(summaries) {
  console.log('=== rollup ===');
  const pieces = summaries.filter((s) => s.passes + s.warns + s.fails > 0);
  pieces.sort((a, b) => (b.fails - a.fails) || (b.warns - a.warns));
  for (const s of pieces) {
    const tag = s.fails > 0 ? 'FAIL' : s.warns > 0 ? 'WARN' : 'OK';
    console.log(`  ${tag.padEnd(4)}  ${s.slug.padEnd(38)}  ${s.passes}P ${s.warns}W ${s.fails}F`);
  }
  const totFails = pieces.reduce((a, s) => a + s.fails, 0);
  const totWarns = pieces.reduce((a, s) => a + s.warns, 0);
  const cleanCount = pieces.filter((s) => s.warns + s.fails === 0).length;
  console.log(`  ${pieces.length} pieces audited; ${cleanCount} clean; ${totWarns} warnings, ${totFails} failures total`);
}
