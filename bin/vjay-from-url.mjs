#!/usr/bin/env node
// ABOUTME: vjay-from-url — given a music URL (YouTube / SoundCloud / etc),
// ABOUTME: download the audio, analyze it, and scaffold a piece directory.
// ABOUTME: --draft (default for MVP) stops after scaffolding so a human or
// ABOUTME: /vjay-new-piece can take over the artistic decisions.
//
// Usage:
//   node bin/vjay-from-url.mjs <url>                    # auto-derive slug from title
//   node bin/vjay-from-url.mjs <url> --slug <slug>      # explicit slug
//   node bin/vjay-from-url.mjs <url> --stems            # also run Demucs stems
//
// MVP scope:
//   1. Download audio via yt-dlp (uvx).
//   2. Run bin/analyze-audio.mjs to produce audio.analysis.json.
//   3. Scaffold meta.yaml (with audio_features:) + a fallback shader.frag.
//   4. Print next steps.
//
// Not yet implemented (deferred until first multi-layer piece ships):
//   - Autonomous mode: synthesize a full layer stack + render + critic gate
//     + publish to studio.develle.fr. Today, --draft is the only mode.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const piecesRoot = join(repoRoot, 'pieces');

function parseArgs(argv) {
    const args = { url: null, slug: null, stems: false, draft: true };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--slug' && i + 1 < argv.length) args.slug = argv[++i];
        else if (a === '--stems') args.stems = true;
        else if (a === '--draft') args.draft = true;          // explicit, default
        else if (a === '--no-draft') args.draft = false;
        else if (!a.startsWith('--') && !args.url) args.url = a;
        else {
            console.error(`unknown arg: ${a}`);
            process.exit(2);
        }
    }
    return args;
}

function slugify(s) {
    return s
        .toLowerCase()
        .normalize('NFKD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
}

function runOrThrow(cmd, args, opts = {}) {
    return new Promise((resolveP, rejectP) => {
        const child = spawn(cmd, args, { stdio: 'inherit', ...opts });
        child.on('exit', (code) => {
            if (code === 0) resolveP();
            else rejectP(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
        });
        child.on('error', rejectP);
    });
}

function captureOutput(cmd, args) {
    return new Promise((resolveP, rejectP) => {
        const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'inherit'] });
        let buf = '';
        child.stdout.on('data', (d) => { buf += d.toString(); });
        child.on('exit', (code) => {
            if (code === 0) resolveP(buf.trim());
            else rejectP(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
        });
        child.on('error', rejectP);
    });
}

async function ytDlpTitle(url) {
    // yt-dlp --print '%(title)s' fetches metadata without downloading.
    return await captureOutput('uvx', ['yt-dlp', '--no-warnings', '--print', '%(title)s', url]);
}

async function ytDlpDownload(url, outTemplate) {
    await runOrThrow('uvx', [
        'yt-dlp',
        '-x', '--audio-format', 'mp3', '--audio-quality', '2',
        // Embed source URL + title/artist into the mp3 (ID3 `purl`/comment)
        // so a piece's provenance survives even if meta.yaml is lost.
        '--embed-metadata',
        '-o', outTemplate,
        url,
    ]);
}

async function ensureUniqueSlug(base) {
    let slug = base;
    let n = 2;
    while (existsSync(join(piecesRoot, slug))) {
        slug = `${base}-${n}`;
        n++;
        if (n > 99) throw new Error(`could not find unique slug starting from "${base}"`);
    }
    return slug;
}

function metaYamlContent({ slug, title, durationSec, withAnalysis, source }) {
    const features = withAnalysis ? '[beat, sections, key]' : '[]';
    const layers = withAnalysis
        ? `
# Placeholder layer stack — REPLACE before iterating. Two global layers
# wired so the piece renders something visible immediately.
layers:
  - layer: solid-warm
    blend: normal
  - layer: wave-distort
    blend: replace
    drivers: { strength: u_audio_bass_stem }`
        : `
# Placeholder layer stack — REPLACE before iterating.
layers:
  - layer: solid-warm
    blend: normal`;
    return `title: "${title.replace(/"/g, '\\"')}"
slug: ${slug}
created: ${new Date().toISOString()}
notes: |
  Scaffolded by bin/vjay-from-url.mjs from an audio URL. The layer stack
  below is a placeholder — replace it with the actual artistic decisions
  via /vjay-new-piece (or hand-edit) before iterating.
duration: ${Math.round(durationSec)}
source: "${source}"
audio: audio.mp3
${withAnalysis ? `audio_features: ${features}` : ''}${layers}
`;
}

const FALLBACK_SHADER = `#version 300 es
// ABOUTME: Fallback shader — runs only if the layer engine fails to load.
// ABOUTME: Replace with the piece's real shader when not using layers/.
precision highp float;
uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_bass;
out vec4 fragColor;
void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec3 col = mix(vec3(0.05, 0.02, 0.0), vec3(1.0, 0.6, 0.2), uv.y);
    col *= 1.0 + 0.2 * u_audio_bass;
    fragColor = vec4(col, 1.0);
}
`;

async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (!args.url) {
        console.error('usage: node bin/vjay-from-url.mjs <url> [--slug <slug>] [--stems]');
        process.exit(2);
    }
    if (!args.draft) {
        console.error('--no-draft (autonomous mode) is not implemented in this MVP.');
        console.error('Today: scaffold a piece and let /vjay-new-piece take over the artistic decisions.');
        process.exit(2);
    }

    // 1. Resolve slug
    let slug = args.slug;
    if (!slug) {
        console.error('[vjay-from-url] fetching title from URL');
        const title = await ytDlpTitle(args.url);
        slug = slugify(title);
        if (!SLUG_RE.test(slug)) {
            console.error(`derived slug "${slug}" doesn't match SLUG_RE; pass --slug explicitly`);
            process.exit(1);
        }
        slug = await ensureUniqueSlug(slug);
        console.error(`[vjay-from-url] slug: ${slug}`);
    } else if (!SLUG_RE.test(slug)) {
        console.error(`--slug "${slug}" must match ${SLUG_RE}`);
        process.exit(2);
    } else if (existsSync(join(piecesRoot, slug))) {
        console.error(`piece "${slug}" already exists; choose a different --slug`);
        process.exit(1);
    }

    const pieceDir = join(piecesRoot, slug);
    await mkdir(pieceDir, { recursive: true });

    // 2. Download
    console.error('[vjay-from-url] downloading audio');
    const outTemplate = join(pieceDir, 'audio.%(ext)s');
    await ytDlpDownload(args.url, outTemplate);
    const audioPath = join(pieceDir, 'audio.mp3');
    if (!existsSync(audioPath)) {
        throw new Error(`expected ${audioPath} after yt-dlp download (check yt-dlp output above)`);
    }

    // 3. Analyze
    console.error('[vjay-from-url] running analyzer');
    const analyzerArgs = ['bin/analyze-audio.mjs', audioPath];
    if (args.stems) analyzerArgs.push('--stems');
    await runOrThrow('node', analyzerArgs, { cwd: repoRoot });

    // 4. Read analysis to get duration for the meta.yaml.
    const analysisPath = join(pieceDir, 'audio.analysis.json');
    let durationSec = 60;
    let title = basename(slug);
    let withAnalysis = false;
    if (existsSync(analysisPath)) {
        try {
            const a = JSON.parse(await readFile(analysisPath, 'utf-8'));
            if (typeof a.duration_sec === 'number') durationSec = a.duration_sec;
            withAnalysis = true;
        } catch {}
    }
    if (args.slug == null) {
        // Fall back to the title from yt-dlp for the meta.title.
        try { title = await ytDlpTitle(args.url); } catch {}
    }

    // 5. Scaffold meta.yaml + fallback shader.frag
    const metaPath = join(pieceDir, 'meta.yaml');
    const fragPath = join(pieceDir, 'shader.frag');
    if (!existsSync(metaPath)) {
        await writeFile(metaPath, metaYamlContent({ slug, title, durationSec, withAnalysis, source: args.url }));
    }
    if (!existsSync(fragPath)) {
        await writeFile(fragPath, FALLBACK_SHADER);
    }

    console.error('');
    console.error(`[vjay-from-url] scaffolded pieces/${slug}/`);
    console.error('  - audio.mp3              (downloaded)');
    if (withAnalysis) {
        console.error(`  - audio.analysis.json    (${durationSec.toFixed(1)}s analyzed)`);
    }
    console.error('  - meta.yaml              (placeholder layers — REPLACE)');
    console.error('  - shader.frag            (fallback only)');
    console.error('');
    console.error('Next:');
    console.error(`  1. Refine the layer stack in pieces/${slug}/meta.yaml.`);
    console.error('     (Use /vjay-new-piece for guided artistic decisions.)');
    console.error(`  2. Preview at http://127.0.0.1:7777/${slug}`);
    console.error(`  3. Iterate via /vjay-iterate ${slug}`);
}

main().catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
});
