#!/usr/bin/env node
// ABOUTME: Diagnostic harness — render every layer (global + piece-local) on
// ABOUTME: top of a stationary checkerboard / line-grid / rainbow base so warp,
// ABOUTME: feedback, and blend artefacts become visible. Output collected to
// ABOUTME: pieces/xtest-layer-results/ as one PNG per layer.
//
// Usage:
//   node bin/test-all-layers.mjs [--only <pattern>]
//
// The harness auto-generates a test piece per layer under pieces/xtest-layer-<name>/
// with the test-base + the layer-under-test. force-consumers get force-source
// prepended as a hidden upstream so their consume contract resolves.
//
// Per-layer steps: write meta.yaml + fallback shader.frag → publish.mjs --duration 4
// → ffmpeg extract last frame → copy to results dir.

import { mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const resultsDir = join(repoRoot, 'pieces', 'xtest-layer-results');
const args = process.argv.slice(2);
const onlyIdx = args.indexOf('--only');
const onlyPattern = onlyIdx >= 0 ? args[onlyIdx + 1] : null;

// --- discover layers ---

async function discoverGlobalLayers() {
    const dirs = await readdir(join(repoRoot, 'layers'), { withFileTypes: true });
    const out = [];
    for (const d of dirs) {
        if (!d.isDirectory()) continue;
        const metaPath = join(repoRoot, 'layers', d.name, 'meta.yaml');
        if (!existsSync(metaPath)) continue;
        const meta = yaml.load(await readFile(metaPath, 'utf8')) ?? {};
        out.push({ kind: 'global', name: d.name, meta });
    }
    return out;
}

async function discoverPieceLayers() {
    const out = [];
    const pieceDirs = await readdir(join(repoRoot, 'pieces'), { withFileTypes: true });
    for (const p of pieceDirs) {
        if (!p.isDirectory()) continue;
        if (p.name.startsWith('_')) continue;             // skip our own test pieces
        const layersDir = join(repoRoot, 'pieces', p.name, 'layers');
        if (!existsSync(layersDir)) continue;
        const layers = await readdir(layersDir, { withFileTypes: true });
        for (const l of layers) {
            if (!l.isDirectory()) continue;
            const metaPath = join(layersDir, l.name, 'meta.yaml');
            if (!existsSync(metaPath)) continue;
            const meta = yaml.load(await readFile(metaPath, 'utf8')) ?? {};
            out.push({ kind: 'piece', piece: p.name, name: l.name, meta });
        }
    }
    return out;
}

// --- test-base shader (inlined so the harness is portable) ---

const TEST_BASE_FRAG = `#version 300 es
precision highp float;
uniform vec2 u_resolution;
out vec4 fragColor;

vec3 hsv2rgb(vec3 c) {
    vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec3 col;
    if (uv.x < 0.33) {
        vec2 cell = floor(uv * vec2(16.0, 9.0));
        float check = mod(cell.x + cell.y, 2.0);
        col = vec3(check);
    } else if (uv.x < 0.66) {
        vec2 px = gl_FragCoord.xy;
        float gx = step(0.92, fract(px.x / 32.0));
        float gy = step(0.92, fract(px.y / 32.0));
        col = vec3(max(gx, gy));
    } else {
        float hue = (uv.x - 0.66) / 0.34;
        float val = 0.25 + 0.75 * uv.y;
        col = hsv2rgb(vec3(hue, 0.85, val));
    }
    fragColor = vec4(col, 1.0);
}
`;

const TEST_BASE_META = `name: test-base
identity: "diagnostic split — checkerboard / line-grid / rainbow gradient"
default_blend: normal
uniforms: {}
reads: []
publishes: []
consumes: []
`;

const FALLBACK_FRAG = `#version 300 es
precision highp float;
uniform vec2 u_resolution;
out vec4 fragColor;
void main() { fragColor = vec4(0.6, 0.05, 0.05, 1.0); }
`;

// --- per-layer test piece generator ---

function consumesForce(meta) {
    const c = meta?.consumes ?? {};
    if (Array.isArray(c)) return false;          // [] form
    return Object.values(c ?? {}).some(v => /force/.test(String(v)) || true);
}

async function writeTestPiece(layer) {
    const tag = layer.kind === 'global' ? `g-${layer.name}` : `p-${layer.piece}-${layer.name}`;
    const slug = `xtest-layer-${tag}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const dir = join(repoRoot, 'pieces', slug);
    await mkdir(dir, { recursive: true });
    await mkdir(join(dir, 'layers', 'test-base'), { recursive: true });
    await writeFile(join(dir, 'layers', 'test-base', 'shader.frag'), TEST_BASE_FRAG);
    await writeFile(join(dir, 'layers', 'test-base', 'meta.yaml'), TEST_BASE_META);
    await writeFile(join(dir, 'shader.frag'), FALLBACK_FRAG);

    const stack = [{ layer: 'test-base', blend: 'normal' }];

    const needsForce = consumesForce(layer.meta);
    if (needsForce) {
        stack.push({ layer: 'force-source', blend: 'normal', alpha: 0.0,
                     publishes: { force: 'vec2' } });
    }

    // The layer-under-test. Piece-local layers need to be copied into the
    // test piece's layers/ so the engine finds them (piece-local resolution
    // is keyed to the running piece's slug, not to the source piece).
    let layerInStack = layer.name;
    if (layer.kind === 'piece') {
        const srcDir = join(repoRoot, 'pieces', layer.piece, 'layers', layer.name);
        const dstDir = join(dir, 'layers', layer.name);
        await mkdir(dstDir, { recursive: true });
        for (const f of ['shader.frag', 'meta.yaml']) {
            const src = join(srcDir, f);
            if (existsSync(src)) {
                await writeFile(join(dstDir, f), await readFile(src));
            }
        }
    }

    const entry = { layer: layerInStack, blend: 'replace' };
    if (needsForce) entry.consumes = { u_force: 'force' };
    stack.push(entry);

    const pieceMeta = {
        title: `[test] ${tag}`,
        slug,
        cursor: false,
        notes: `Auto-generated diagnostic for layer "${layer.name}" (${layer.kind}).`,
        duration: 8,
        layers: stack,
    };
    await writeFile(join(dir, 'meta.yaml'), yaml.dump(pieceMeta));
    return { slug, dir, tag };
}

async function runPublish(slug, duration = 4) {
    return new Promise((res, rej) => {
        const p = spawn('node', ['bin/publish.mjs', slug, '--duration', String(duration)],
            { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] });
        let stderr = '';
        p.stderr.on('data', d => { stderr += d.toString(); });
        p.on('close', c => c === 0 ? res() : rej(new Error(`publish exit ${c}: ${stderr.slice(-400)}`)));
        p.on('error', rej);
    });
}

async function extractLastFrame(clipPath, outPng) {
    return new Promise((res, rej) => {
        // Take frame at 90% of duration so feedback/history has accumulated.
        const ff = spawn('ffmpeg', [
            '-y', '-sseof', '-0.5', '-i', clipPath,
            '-frames:v', '1', '-vf', 'scale=1280:-1', outPng,
        ], { stdio: ['ignore', 'ignore', 'ignore'] });
        ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)));
        ff.on('error', rej);
    });
}

// --- main ---

const globalLayers = await discoverGlobalLayers();
const pieceLayers = await discoverPieceLayers();
const allLayers = [...globalLayers, ...pieceLayers].filter(l => {
    if (l.name === 'test-base') return false;          // don't test the test
    if (l.name === 'chaos-warp-copy') return false;    // duplicate of chaos-warp
    if (l.name === 'force-source') return false;       // invisible publisher
    if (l.name === 'lodestone-pull') return false;     // alpha-0 publisher
    if (onlyPattern && !`${l.kind}/${l.name}`.includes(onlyPattern)) return false;
    return true;
});

console.log(`[test-all-layers] testing ${allLayers.length} layers (${globalLayers.length} global, ${pieceLayers.length} piece-local before filters)`);

await mkdir(resultsDir, { recursive: true });

const results = [];
for (let i = 0; i < allLayers.length; i++) {
    const layer = allLayers[i];
    const idx = `[${String(i + 1).padStart(2, '0')}/${allLayers.length}]`;
    process.stdout.write(`${idx} ${layer.kind.padEnd(7)} ${layer.name.padEnd(30)} ... `);
    try {
        const { slug, dir, tag } = await writeTestPiece(layer);
        await runPublish(slug, 4);
        const clip = join(dir, 'clip.mp4');
        if (!existsSync(clip)) throw new Error('no clip rendered');
        const png = join(resultsDir, `${String(i + 1).padStart(2, '0')}-${tag}.png`);
        await extractLastFrame(clip, png);
        results.push({ ...layer, status: 'ok', png });
        console.log('ok');
    } catch (err) {
        results.push({ ...layer, status: 'fail', error: err.message });
        console.log('FAIL', err.message.slice(0, 100));
    }
}

const summary = results.map(r =>
    `${r.status === 'ok' ? '[ok]' : '[FAIL]'} ${r.kind}/${r.name}${r.error ? ' — ' + r.error.slice(0, 80) : ''}`
).join('\n');
console.log('\n=== Summary ===');
console.log(summary);
await writeFile(join(resultsDir, 'SUMMARY.txt'), summary + '\n');
console.log(`\n[test-all-layers] frames + summary in ${resultsDir}`);
