#!/usr/bin/env node
// ABOUTME: Scaffolds a new piece directory with a starter shader.frag + meta.yaml.
// ABOUTME: Usage: `node bin/new-piece.mjs <slug>` — slug must be kebab-case.
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

const slug = process.argv[2];
if (!slug || !SLUG_RE.test(slug)) {
  console.error('usage: node bin/new-piece.mjs <slug>\n  slug must match /^[a-z0-9][a-z0-9-]*$/');
  process.exit(2);
}

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

const meta = `title: "${title}"
slug: ${slug}
created: ${now}
notes: |
  Describe the mathematical idea here.
duration: 10
uniforms: []
published_at: null
`;

await writeFile(join(pieceDir, 'shader.frag'), shader);
await writeFile(join(pieceDir, 'meta.yaml'), meta);

console.log(`created ${pieceDir}`);
console.log(`  shader.frag, meta.yaml`);
console.log(`\nto show it in the studio:  echo ${slug} > pieces/current.txt`);
