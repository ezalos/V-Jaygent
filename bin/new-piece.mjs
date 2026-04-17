#!/usr/bin/env node
// ABOUTME: Scaffolds a new piece directory with a starter shader.frag + meta.yaml.
// ABOUTME: Usage: `node bin/new-piece.mjs <slug> [--sim]` — slug must be kebab-case.
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

const args = process.argv.slice(2);
const boolFlags = new Set();
const valueFlags = {};
const positional = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--audio' && i + 1 < args.length) {
    valueFlags.audio = args[++i];
  } else if (a.startsWith('--')) {
    boolFlags.add(a);
  } else {
    positional.push(a);
  }
}

const slug = positional[0];
if (!slug || !SLUG_RE.test(slug)) {
  console.error('usage: node bin/new-piece.mjs <slug> [--sim] [--audio <spec>]');
  console.error('  slug must match /^[a-z0-9][a-z0-9-]*$/');
  console.error('  --sim:   scaffold with a multi-pass ping-pong simulate + display pair');
  console.error('  --audio: set the meta.audio field (e.g. --audio live for mic input)');
  process.exit(2);
}

const simMode   = boolFlags.has('--sim');
const audioSpec = valueFlags.audio ?? null;

const here = dirname(fileURLToPath(import.meta.url));
const piecesDir = resolve(here, '..', 'pieces');
const pieceDir = join(piecesDir, slug);

try {
  await access(pieceDir);
  console.error(`piece "${slug}" already exists at ${pieceDir}`);
  process.exit(1);
} catch {}

await mkdir(pieceDir, { recursive: true });

const now = new Date().toISOString();
const title = slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

if (simMode) {
  await writeSim(pieceDir, slug, title, now, audioSpec);
} else {
  await writeSinglePass(pieceDir, slug, title, now, audioSpec);
}

console.log(`created ${pieceDir}`);
console.log(`\nto show it in the studio:  echo ${slug} > pieces/current.txt`);

// ----- scaffolds -----

async function writeSinglePass(pieceDir, slug, title, nowIso, audioSpec) {
  const shader = `// ABOUTME: Fragment shader for piece "${slug}".
// ABOUTME: Replace this starter with actual art.
#version 300 es
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform int   u_frame;

out vec4 fragColor;

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float r = length(uv);
    float a = atan(uv.y, uv.x);
    float v = 0.5 + 0.5 * sin(8.0 * a + u_time - 6.0 * r);
    vec3 col = vec3(v * 0.9, v * 0.6, v * 0.3);
    fragColor = vec4(col, 1.0);
}
`;

  const audioLine = audioSpec ? `audio: ${audioSpec}\n` : '';
  const meta = `title: "${title}"
slug: ${slug}
created: ${nowIso}
${audioLine}notes: |
  Describe the mathematical idea here.
duration: 10
uniforms: []
published_at: null
`;

  await writeFile(join(pieceDir, 'shader.frag'), shader);
  await writeFile(join(pieceDir, 'meta.yaml'), meta);
  console.log(`  shader.frag, meta.yaml`);
}

async function writeSim(pieceDir, slug, title, nowIso, audioSpec) {
  // Seeded starter: Gray-Scott-style diffusion template. Replace with your own
  // simulation kernel. `#include`s from lib/ pull in canonical kernels.
  const simFrag = `// ABOUTME: Simulation pass for piece "${slug}". Ping-pong state texture — reads
// ABOUTME: previous frame from u_state, writes new state. Replace with your own kernel.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec2      u_mouse;
uniform int       u_frame;
uniform sampler2D u_state;

#include "diffusion.glsl"
#include "noise.glsl"

out vec4 fragColor;

void main() {
    vec2 uv    = gl_FragCoord.xy / u_resolution.xy;
    vec2 texel = 1.0 / u_resolution.xy;

    if (u_frame == 0) {
        // Initial state — tune this for your simulation.
        vec2 p = gl_FragCoord.xy / min(u_resolution.x, u_resolution.y);
        float seed = vnoise(p * 6.0);
        fragColor = vec4(seed, 0.0, 0.0, 1.0);
        return;
    }

    // Diffuse previous state — starter kernel. Replace with your own update rule.
    vec4 state = texture(u_state, uv);
    vec4 lap   = laplacian4(u_state, uv, texel);
    state += 0.2 * lap;

    fragColor = state;
}
`;

  const displayFrag = `// ABOUTME: Display pass for piece "${slug}". Reads simulate's state texture and
// ABOUTME: renders to screen through a palette. Replace this starter with actual art.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform sampler2D u_state;

#include "tonemap.glsl"

out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec4 state = texture(u_state, uv);
    vec3 col = state.rgb;
    col = reinhard(col);
    fragColor = vec4(pow(max(col, 0.0), vec3(0.92)), 1.0);
}
`;

  const audioLine = audioSpec ? `audio: ${audioSpec}\n` : '';
  const meta = `title: "${title}"
slug: ${slug}
created: ${nowIso}
${audioLine}notes: |
  Describe the mathematical idea here. This piece uses a multi-pass pipeline:
  simulate writes to a ping-pong rgba16f texture; display reads it and renders.
duration: 30
render_scale: 1.0
uniforms: []
published_at: null
passes:
  - name: simulate
    shader: sim.frag
    target:
      format: rgba16f
      ping_pong: true
      scale: 0.5
    inputs:
      u_state: simulate
    iterations: 4
  - name: display
    shader: shader.frag
    target: screen
    inputs:
      u_state: simulate
`;

  await writeFile(join(pieceDir, 'sim.frag'), simFrag);
  await writeFile(join(pieceDir, 'shader.frag'), displayFrag);
  await writeFile(join(pieceDir, 'meta.yaml'), meta);
  console.log(`  sim.frag, shader.frag, meta.yaml`);
  console.log(`  (multi-pass scaffold — ping-pong rgba16f state; includes diffusion, noise, tonemap)`);
}
