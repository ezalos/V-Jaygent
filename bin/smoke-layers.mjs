#!/usr/bin/env node
// ABOUTME: Smoke-test each layer in isolation. For every directory under
// ABOUTME: layers/, synthesize a minimal piece that stacks (solid-warm if the
// ABOUTME: layer reads u_below, then the target layer) in a temp pieces dir,
// ABOUTME: spin up the studio server, and verify Playwright can render it
// ABOUTME: without compile errors or console errors.

import { chromium } from 'playwright';
import { createStudioServer } from '../studio/server.mjs';
import { mkdir, mkdtemp, readdir, readFile, writeFile, rm, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const layersDir = join(repoRoot, 'layers');

// Layers we know read `u_below` need a base layer beneath them so the test
// stack actually has something for them to refract/distort. The default base
// is solid-warm; pass `--no-base` to skip it.
const DEFAULT_BASE_LAYER = 'solid-warm';

function readsBelow(layerSrc) {
    return /\bu_below\b/.test(layerSrc);
}

async function listLayers() {
    const entries = await readdir(layersDir, { withFileTypes: true });
    const layers = [];
    for (const e of entries) {
        if (!e.isDirectory()) continue;
        if (!/^[a-z0-9][a-z0-9-]*$/.test(e.name)) continue;
        const fragPath = join(layersDir, e.name, 'shader.frag');
        if (!existsSync(fragPath)) continue;
        layers.push({ name: e.name, fragPath });
    }
    return layers.sort((a, b) => a.name.localeCompare(b.name));
}

async function synthesizePiece(piecesRoot, layer, withBase) {
    const slug = `_smoke_${layer.name.replace(/-/g, '_')}`.toLowerCase();
    // Slug must match SLUG_RE which doesn't allow underscores; use a
    // dash-only variant.
    const safeSlug = `smoke-${layer.name}`;
    const pieceDir = join(piecesRoot, safeSlug);
    await mkdir(pieceDir, { recursive: true });
    const fallbackFrag = `#version 300 es
precision highp float;
out vec4 fragColor;
void main() { fragColor = vec4(0.5, 0.0, 0.0, 1.0); }
`;
    await writeFile(join(pieceDir, 'shader.frag'), fallbackFrag);
    const layersList = withBase
        ? [`  - layer: ${DEFAULT_BASE_LAYER}\n    blend: normal`, `  - layer: ${layer.name}\n    blend: normal`]
        : [`  - layer: ${layer.name}\n    blend: normal`];
    const meta = `title: "[smoke] ${layer.name}"
slug: ${safeSlug}
duration: 4
layers:
${layersList.join('\n')}
`;
    await writeFile(join(pieceDir, 'meta.yaml'), meta);
    return safeSlug;
}

async function smokeOne(browser, baseUrl, slug) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errors = [];
    const pageErrors = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    let result;
    try {
        await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => {
            const err = document.getElementById('error');
            if (err && !err.classList.contains('hidden')) return true;
            const c = document.getElementById('stage');
            return c && c.width > 0 && c.height > 0 && performance.now() > 2000;
        }, { timeout: 6000 }).catch(() => {});

        const errorVisible = await page.evaluate(() => {
            const el = document.getElementById('error');
            return el && !el.classList.contains('hidden');
        });
        const errorText = errorVisible
            ? await page.evaluate(() => document.getElementById('error')?.textContent ?? '')
            : '';

        if (errorVisible || pageErrors.length || errors.length) {
            result = { ok: false, errorVisible, errorText, consoleErrors: errors, pageErrors };
        } else {
            result = { ok: true };
        }
    } catch (err) {
        result = { ok: false, err: String(err) };
    } finally {
        await ctx.close();
    }
    return result;
}

async function main() {
    const args = process.argv.slice(2);
    const explicitLayers = args.filter((a) => !a.startsWith('--'));
    const noBase = args.includes('--no-base');

    const allLayers = await listLayers();
    if (allLayers.length === 0) {
        console.error('no layers found in layers/');
        process.exit(0);
    }

    const layers = explicitLayers.length > 0
        ? allLayers.filter((l) => explicitLayers.includes(l.name))
        : allLayers;

    if (layers.length === 0) {
        console.error(`no matching layers found (asked: ${explicitLayers.join(', ')})`);
        console.error(`available: ${allLayers.map((l) => l.name).join(', ')}`);
        process.exit(2);
    }

    // Synthesize a temp pieces dir with one stand-alone smoke piece per layer.
    const tmpPiecesDir = await mkdtemp(join(tmpdir(), 'vjaygent-smoke-layers-'));
    const synthesizedSlugs = [];
    try {
        // Copy current.txt placeholder so the server's apiCurrent doesn't 404.
        await writeFile(join(tmpPiecesDir, 'current.txt'), '');

        for (const layer of layers) {
            const layerSrc = await readFile(layer.fragPath, 'utf-8');
            // Decide whether to stack solid-warm beneath this layer. If the
            // layer reads u_below, it needs something to refract.
            const needsBase = !noBase && readsBelow(layerSrc) && layer.name !== DEFAULT_BASE_LAYER;
            const slug = await synthesizePiece(tmpPiecesDir, layer, needsBase);
            synthesizedSlugs.push({ layer: layer.name, slug, withBase: needsBase });
        }

        // Server uses the temp pieces dir + the real layers dir.
        const server = createStudioServer({ piecesDir: tmpPiecesDir, layersDir });
        await new Promise((resolveP) => server.listen(0, '127.0.0.1', resolveP));
        const { port } = server.address();
        const baseUrl = `http://127.0.0.1:${port}`;

        const browser = await chromium.launch();
        // Warm-up page (matches bin/smoke-shaders.mjs)
        {
            const ctx = await browser.newContext();
            const page = await ctx.newPage();
            await page.goto(`${baseUrl}/`).catch(() => {});
            await page.waitForTimeout(400);
            await ctx.close();
        }

        const failures = [];
        for (const { layer, slug, withBase } of synthesizedSlugs) {
            const result = await smokeOne(browser, baseUrl, slug);
            if (result.ok) {
                console.log(`  ✓ ${layer}${withBase ? ' (over solid-warm)' : ''}`);
            } else {
                failures.push({ layer, slug, ...result });
                console.log(`  ✗ ${layer}`);
                if (result.errorText) console.log(`      overlay: ${result.errorText.slice(0, 300).replace(/\s+/g, ' ')}`);
                for (const e of result.consoleErrors ?? []) console.log(`      console: ${e.slice(0, 300)}`);
                for (const e of result.pageErrors ?? []) console.log(`      pageerror: ${e.slice(0, 300)}`);
                if (result.err) console.log(`      err: ${result.err.slice(0, 300)}`);
            }
        }

        await browser.close();
        await new Promise((resolveP) => server.close(resolveP));

        if (failures.length) {
            console.error(`\n${failures.length} / ${synthesizedSlugs.length} layers failed`);
            process.exit(1);
        }
        console.log(`\nall ${synthesizedSlugs.length} layers compiled clean`);
    } finally {
        await rm(tmpPiecesDir, { recursive: true, force: true });
    }
}

main().catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
});
