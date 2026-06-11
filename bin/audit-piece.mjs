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
//   - multi-scale presence (added 2026-05-11): ≥1 fbm/noise call expected;
//                                              monolithic pieces with zero
//                                              noise calls almost always
//                                              fail the depth dimension
//   - single-clock check (added 2026-05-11):  if only u_time is used as a
//                                              clock source (no beat/bar/
//                                              section/audio uniforms), the
//                                              piece will fail polyrhythm
//                                              probes
//   - cool-RGB-literal scan (added 2026-05-11): rough hue check on vec3(r,g,b)
//                                              literals — flags obvious cool
//                                              hardcoded colors (cyan/teal/blue)

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
    // Monolithic / passes: — scan the root shader.frag plus every shader named
    // in meta.passes (sim/bins/trails/...). Input coupling in a passes piece
    // usually lives in the sim shader, not the display; scanning only the root
    // file false-flagged ink-bloom as non-interactive (2026-06-11).
    const shaderFiles = new Map();
    shaderFiles.set('shader.frag', join(pieceDir, 'shader.frag'));
    if (Array.isArray(meta.passes)) {
      for (const p of meta.passes) {
        if (p?.shader) shaderFiles.set(p.shader, join(pieceDir, p.shader));
      }
    }
    let foundAny = false;
    for (const [name, path] of shaderFiles) {
      if (!existsSync(path)) continue;
      foundAny = true;
      const src = await readFile(path, 'utf8');
      layerScans.push({ name: `<${name}>`, scan: scanShader(src), entry: {}, path });
    }
    if (!foundAny) {
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

  // ---- architecture-declaration consistency (added 2026-05-11)
  // Verify meta.architecture (A/B/C/D/E) matches the actual implementation.
  // Catches the murmuration-class failure: brief said "boids" + architecture
  // A, but the algorithm needs B (CPU-sim). Architecture mismatch is the
  // single biggest failure root cause and survives all iteration.
  const declaredArch = meta.architecture || null;
  const ARCH_VALID = new Set(['A', 'B', 'C', 'D', 'E']);
  if (!declaredArch) {
    findings.push([
      'WARN',
      'architecture: meta.architecture unset — required for pieces created via /vjay-new-piece §1c (legacy pieces grandfathered)',
    ]);
  } else if (!ARCH_VALID.has(declaredArch)) {
    findings.push([
      'FAIL',
      `architecture: meta.architecture="${declaredArch}" is not one of A|B|C|D|E (see brainstorming/techniques/canonical-pieces.md)`,
    ]);
  } else {
    // Verify implementation matches declared architecture.
    // A = per-pixel functional (single shader, no passes, no layers)
    // B = CPU-sim + sprite (needs studio/ hook; we approximate: shader reads
    //     u_ball_*, u_billiards, u_agent_*, OR meta declares the billiards
    //     section)
    // C = ping-pong feedback (meta.passes must be present)
    // D = density-volume / raymarched (single shader with a raymarch /
    //     accumulation loop — heuristic: shader has a for-loop with ≥ 16
    //     iterations sampling a field)
    // E = layer stack (meta.layers must be present)
    const archMismatches = [];
    const usesPasses = Array.isArray(meta.passes) && meta.passes.length > 0;
    const usesLayers = Array.isArray(meta.layers) && meta.layers.length > 0;
    const hasBilliardsHook = Array.isArray(meta.billiards) && meta.billiards.length > 0;
    // Scan shader source for raymarch-ish loops (heuristic).
    let bigLoop = false;
    let readsAgentUniforms = false;
    for (const l of layerScans) {
      if (!l.scan) continue;
      // big-iteration loop: `for (int i = 0; i < N; ...)` with N ≥ 16
      // or fragment-of-text suggesting raymarching: "step" + "march".
      const src = l.path ? await readFile(l.path, 'utf8').catch(() => '') : '';
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '');
      const loopMatches = [...stripped.matchAll(/for\s*\(\s*int\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*(\d+)\s*;/g)];
      for (const m of loopMatches) {
        if (Number(m[1]) >= 16) bigLoop = true;
      }
      if (/\bu_ball_|u_billiards|u_agent_/.test(stripped)) readsAgentUniforms = true;
    }
    if (declaredArch === 'A') {
      if (usesPasses) archMismatches.push('declares A (per-pixel functional) but has passes: — should be C');
      if (usesLayers) archMismatches.push('declares A but has layers: — should be E');
    } else if (declaredArch === 'B') {
      if (!readsAgentUniforms && !hasBilliardsHook) {
        archMismatches.push('declares B (CPU-sim + sprite) but no agent uniforms (u_ball_*, u_billiards) found and no meta.billiards array — implementation looks like A or D');
      }
    } else if (declaredArch === 'C') {
      if (!usesPasses) archMismatches.push('declares C (ping-pong feedback) but no passes: array in meta.yaml — implementation is single-pass');
    } else if (declaredArch === 'D') {
      if (!bigLoop && !usesPasses) {
        archMismatches.push('declares D (density-volume / raymarched) but no large iteration loop (for i < 16+) found in any shader, and no passes: feedback — implementation looks like A');
      }
    } else if (declaredArch === 'E') {
      if (!usesLayers) archMismatches.push('declares E (layer stack) but no layers: array in meta.yaml — implementation is monolithic');
    }
    if (archMismatches.length === 0) {
      findings.push(['PASS', `architecture: declared ${declaredArch} matches implementation`]);
    } else {
      for (const msg of archMismatches) {
        findings.push(['FAIL', `architecture: ${msg}`]);
      }
    }
  }

  // ---- multi-scale presence (added 2026-05-11)
  // Pieces with zero noise/fbm calls tend to be flat one-resolution renders.
  // Top-tier pieces always have ≥ 2 octaves of structure (recursive folds,
  // fbm stacks, RD interfaces). Heuristic: count fbm/vnoise/hash21 calls.
  let noiseCalls = 0;
  for (const l of layerScans) {
    if (!l.scan) continue;
    noiseCalls += l.scan.noiseCalls;
  }
  // Pieces with explicit feedback / multi-pass simulation get a pass even
  // without explicit noise — the feedback loop IS the multi-scale structure
  // (Gray-Scott, fluid sims, etc).
  const hasPasses = Array.isArray(meta.passes) && meta.passes.length > 0;
  if (noiseCalls === 0 && !hasPasses) {
    findings.push([
      'WARN',
      'multi-scale: 0 fbm/vnoise/hash21 calls across the stack and no passes: declared — flat depth is likely (see canonical-pieces.md, all top-tier pieces are multi-scale by construction)',
    ]);
  } else if (noiseCalls >= 2 || hasPasses) {
    findings.push([
      'PASS',
      `multi-scale: ${noiseCalls} noise call${noiseCalls === 1 ? '' : 's'}` + (hasPasses ? ' + passes: feedback loop' : ''),
    ]);
  } else {
    findings.push([
      'WARN',
      `multi-scale: only ${noiseCalls} noise call — single-octave field reads as base+texture, not fractal depth`,
    ]);
  }

  // ---- single-clock check (added 2026-05-11)
  // Polyrhythm probes need ≥ 3 distinct clock sources across the stack.
  // If only u_time is used as a clock, the piece will fail polyrhythm-of-
  // clocks even with audio_features declared.
  const CLOCK_SOURCES = ['u_time', 'u_beat_phase', 'u_bar_phase',
    'u_section_progress', 'u_downbeat', 'u_song_progress',
    'u_audio_bass', 'u_audio_mid', 'u_audio_high', 'u_audio_level'];
  const clocksUsed = new Set();
  for (const l of layerScans) {
    if (!l.scan) continue;
    for (const u of CLOCK_SOURCES) {
      if (l.scan.uniformReads.has(u)) clocksUsed.add(u);
    }
  }
  if (clocksUsed.size === 0) {
    findings.push(['WARN', 'clocks: no time sources used at all — piece is fully static']);
  } else if (clocksUsed.size === 1 && clocksUsed.has('u_time')) {
    findings.push([
      'WARN',
      'clocks: only u_time used — polyrhythm-of-clocks probe will fail (top pieces blend ≥ 3 sources)',
    ]);
  } else if (clocksUsed.size >= 3) {
    findings.push([
      'PASS',
      `clocks: ${clocksUsed.size} distinct sources (${[...clocksUsed].join(', ')})`,
    ]);
  } else {
    findings.push([
      'INFO',
      `clocks: ${clocksUsed.size} source${clocksUsed.size === 1 ? '' : 's'} (${[...clocksUsed].join(', ')}) — fine for closed briefs, polyrhythm probe wants ≥ 3`,
    ]);
  }

  // ---- cool-RGB literal scan (added 2026-05-11)
  // Flags obvious hardcoded cool colours: vec3(r,g,b) where b > r AND b > g
  // AND b > 0.3 (i.e. blue-dominant saturated colours). Doesn't catch
  // palette-function outputs — those are fine as long as the function returns
  // warm. This is a quick smoke-test that complements bin/lint-palette.mjs
  // (which works on rendered pixels).
  let coolLiterals = [];
  for (const l of layerScans) {
    if (!l.scan) continue;
    for (const lit of l.scan.coolLiterals) {
      coolLiterals.push({ layer: l.name, ...lit });
    }
  }
  if (coolLiterals.length > 0) {
    findings.push([
      'WARN',
      `cool literals: ${coolLiterals.length} blue-dominant vec3 literal${coolLiterals.length === 1 ? '' : 's'} (e.g. ${coolLiterals[0].layer}: ${coolLiterals[0].text}) — VISION.md is warm-only; verify these aren't visible in render`,
    ]);
  } else {
    findings.push(['PASS', 'cool literals: none in shader source']);
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

  // Count noise/fbm/hash calls — proxy for multi-scale field structure.
  // Anything beyond fbm(/vnoise(/hash21( is rare enough that this works.
  let noiseCalls = 0;
  for (const _ of stripped.matchAll(/\b(fbm|vnoise|hash21|hash22|valueNoise|fbm3)\s*\(/g)) {
    noiseCalls++;
  }

  // Scan for cool-dominant vec3 literals. Matches `vec3(r, g, b)` with
  // three numeric arguments only. Conservative: only flags when b > r,
  // b > g, b > 0.3, AND not all three components are near-zero (which
  // would be black). Catches `vec3(0.1, 0.2, 0.8)` (blue) but not
  // `vec3(0.05, 0.05, 0.1)` (near-black) or palette-function outputs.
  const coolLiterals = [];
  const litRe = /\bvec3\s*\(\s*([0-9.eE+-]+)\s*,\s*([0-9.eE+-]+)\s*,\s*([0-9.eE+-]+)\s*\)/g;
  for (const m of stripped.matchAll(litRe)) {
    const r = Number(m[1]), g = Number(m[2]), b = Number(m[3]);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) continue;
    if (Math.max(r, g, b) < 0.15) continue; // near-black, fine
    // Blue-dominant or green-dominant (both cool)
    const blueDom = b > r + 0.1 && b > g + 0.1 && b > 0.3;
    const greenDom = g > r + 0.15 && g > b + 0.1 && g > 0.4;
    if (blueDom || greenDom) {
      coolLiterals.push({ text: m[0], r, g, b });
    }
  }

  return {
    uniformReads,
    readsMouse,
    readsKeys,
    readsAnyAudio,
    noiseCalls,
    coolLiterals,
  };
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
