#!/usr/bin/env node
// ABOUTME: Offline audio analysis — writes audio.analysis.json next to the
// ABOUTME: input file. BPM, beats, downbeats, sections, energy envelope,
// ABOUTME: optional Demucs stems, key/chord. Schema in
// ABOUTME: brainstorming/techniques/using-lib.md §"audio analysis JSON contract".
//
// Usage:
//   node bin/analyze-audio.mjs <audio-file>            # analysis sans stems (fast)
//   node bin/analyze-audio.mjs <audio-file> --stems    # full analysis (slow, GPU recommended)
//   node bin/analyze-audio.mjs <audio-file> --out <path>
//   node bin/analyze-audio.mjs <audio-file> --force    # overwrite existing JSON
//
// First run bootstraps a Python venv at bin/audio_analyzer/.venv-base (or
// .venv-stems with --stems) and installs requirements. Subsequent runs reuse it.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve, join, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const analyzerDir = join(repoRoot, 'bin', 'audio_analyzer');

function parseArgs(argv) {
    const args = { input: null, stems: false, out: null, force: false };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--stems') args.stems = true;
        else if (a === '--force') args.force = true;
        else if (a === '--out') args.out = argv[++i];
        else if (!a.startsWith('--') && !args.input) args.input = a;
        else {
            console.error(`unknown arg: ${a}`);
            process.exit(2);
        }
    }
    return args;
}

function defaultOutPath(inputPath) {
    const dir = dirname(inputPath);
    const base = basename(inputPath, extname(inputPath));
    return join(dir, `${base}.analysis.json`);
}

async function ensureVenv(venvDir, requirementsPath) {
    const py = join(venvDir, 'bin', 'python');
    const sentinel = join(venvDir, '.requirements.installed');
    if (existsSync(py) && existsSync(sentinel)) return py;

    if (!existsSync(py)) {
        console.error(`[analyze-audio] creating venv at ${venvDir}`);
        await runOrThrow('python3', ['-m', 'venv', venvDir]);
    }
    console.error(`[analyze-audio] installing ${requirementsPath} (this can take a few minutes)`);
    await runOrThrow(py, ['-m', 'pip', 'install', '--upgrade', 'pip', '--quiet']);
    await runOrThrow(py, ['-m', 'pip', 'install', '-r', requirementsPath, '--quiet']);
    await runOrThrow('touch', [sentinel]);
    return py;
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

async function main() {
    const args = parseArgs(process.argv.slice(2));

    if (!args.input) {
        console.error('usage: node bin/analyze-audio.mjs <audio-file> [--stems] [--out <path>] [--force]');
        process.exit(2);
    }
    const inputPath = resolve(args.input);
    if (!existsSync(inputPath)) {
        console.error(`input not found: ${inputPath}`);
        process.exit(2);
    }

    const outPath = args.out ? resolve(args.out) : defaultOutPath(inputPath);
    if (existsSync(outPath) && !args.force) {
        console.error(`${outPath} already exists; pass --force to overwrite`);
        process.exit(1);
    }
    await mkdir(dirname(outPath), { recursive: true });

    const venvDir = join(analyzerDir, args.stems ? '.venv-stems' : '.venv-base');
    const reqPath = join(analyzerDir, args.stems ? 'requirements-stems.txt' : 'requirements.txt');
    const py = await ensureVenv(venvDir, reqPath);

    const analyzePy = join(analyzerDir, 'analyze.py');
    const pyArgs = [analyzePy, '--input', inputPath, '--out', outPath];
    if (args.stems) pyArgs.push('--stems');

    console.error(`[analyze-audio] analyzing ${inputPath}`);
    const t0 = Date.now();
    await runOrThrow(py, pyArgs);
    const dt = ((Date.now() - t0) / 1000).toFixed(1);
    console.error(`[analyze-audio] wrote ${outPath} in ${dt}s`);
}

main().catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
});
