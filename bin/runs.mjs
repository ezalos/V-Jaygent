#!/usr/bin/env node
// ABOUTME: V-Jaygent run log — local JSONL event stream + per-piece rollup.
// ABOUTME: Skills call this at step boundaries; aggregate queries are CLI.
//
// Usage:
//   node bin/runs.mjs start  --slug <slug> --skill <name>          # prints run_id
//   node bin/runs.mjs log    <run_id> --event <name> [--status s] [--data json]
//   node bin/runs.mjs end    <run_id> [--status shipped|aborted|stuck]
//   node bin/runs.mjs list                                          # last 20 runs
//   node bin/runs.mjs show   <run_id>                               # event stream
//   node bin/runs.mjs piece  <slug>                                 # runs for slug
//   node bin/runs.mjs stats                                         # global aggregates
//   node bin/runs.mjs rollup <slug>                                 # (re)gen markdown
//
// Storage:
//   .runs/<run_id>.jsonl          — append-only event stream (gitignored)
//   .runs/index.json              — {run_id → metadata}
//   brainstorming/runs/<slug>.md  — committed human-readable rollup

import { appendFile, readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const runsDir = join(repoRoot, '.runs');
const rollupDir = join(repoRoot, 'brainstorming', 'runs');
const indexPath = join(runsDir, 'index.json');

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const SKILL_SHORT = { 'vjay-iterate': 'iter', 'vjay-new-piece': 'new' };

// ---------- main dispatch ----------

const [, , cmd, ...rest] = process.argv;

try {
  switch (cmd) {
    case 'start':   await cmdStart(parseFlags(rest));                   break;
    case 'log':     await cmdLog(rest[0], parseFlags(rest.slice(1)));   break;
    case 'end':     await cmdEnd(rest[0], parseFlags(rest.slice(1)));   break;
    case 'list':    await cmdList(parseFlags(rest));                    break;
    case 'show':    await cmdShow(rest[0]);                             break;
    case 'piece':   await cmdPiece(rest[0]);                            break;
    case 'stats':   await cmdStats();                                   break;
    case 'rollup':  await cmdRollup(rest[0]);                           break;
    default:        usageAndExit();
  }
} catch (err) {
  console.error(`[runs] ${err.message}`);
  process.exit(1);
}

// ---------- commands ----------

async function cmdStart({ slug, skill }) {
  if (!slug || !SLUG_RE.test(slug)) throw new Error('--slug required (kebab-case)');
  if (!skill) throw new Error('--skill required');

  const now = new Date();
  const runId = makeRunId(now, slug, skill);
  const meta = {
    run_id:     runId,
    slug,
    skill,
    started_at: now.toISOString(),
    ended_at:   null,
    status:     'running',
  };
  await ensureDirs();
  await appendFile(
    join(runsDir, runId + '.jsonl'),
    JSON.stringify({ t: now.toISOString(), event: 'start', ...meta }) + '\n',
  );
  await updateIndex((idx) => { idx[runId] = meta; });
  process.stdout.write(runId + '\n');
}

async function cmdLog(runId, flags) {
  if (!runId) throw new Error('run_id required');
  const jsonl = join(runsDir, runId + '.jsonl');
  if (!existsSync(jsonl)) throw new Error(`run not found: ${runId}`);

  const ev = {
    t:      new Date().toISOString(),
    event:  flags.event ?? 'log',
    status: flags.status,
  };
  if (flags.data) {
    try { ev.data = JSON.parse(flags.data); }
    catch { ev.data = flags.data; }
  }
  for (const [k, v] of Object.entries(flags)) {
    if (['event', 'status', 'data'].includes(k)) continue;
    ev[k] = maybeJson(v);
  }
  await appendFile(jsonl, JSON.stringify(ev) + '\n');
}

async function cmdEnd(runId, flags) {
  if (!runId) throw new Error('run_id required');
  const jsonl = join(runsDir, runId + '.jsonl');
  if (!existsSync(jsonl)) throw new Error(`run not found: ${runId}`);

  const now = new Date().toISOString();
  await appendFile(jsonl, JSON.stringify({
    t: now, event: 'end', status: flags.status ?? 'completed',
  }) + '\n');
  await updateIndex((idx) => {
    if (idx[runId]) {
      idx[runId].ended_at = now;
      idx[runId].status   = flags.status ?? 'completed';
    }
  });
}

async function cmdList({ limit } = {}) {
  const n = Number(limit ?? 20);
  const idx = await loadIndex();
  const rows = Object.values(idx)
    .sort((a, b) => String(b.started_at).localeCompare(String(a.started_at)))
    .slice(0, n);
  if (rows.length === 0) { console.log('(no runs yet)'); return; }

  const fmt = (r) => [
    (r.run_id ?? '').padEnd(38),
    (r.slug ?? '').padEnd(20),
    (r.skill ?? '').padEnd(16),
    (r.status ?? '').padEnd(10),
    r.started_at ?? '',
  ].join('  ');
  console.log(['RUN_ID', 'SLUG', 'SKILL', 'STATUS', 'STARTED']
    .map((s, i) => s.padEnd([38, 20, 16, 10, 0][i])).join('  '));
  for (const r of rows) console.log(fmt(r));
}

async function cmdShow(runId) {
  if (!runId) throw new Error('run_id required');
  const events = await readEvents(runId);
  for (const e of events) {
    const parts = [`[${e.t}]`, e.event];
    if (e.status) parts.push(`(${e.status})`);
    const extras = { ...e };
    delete extras.t; delete extras.event; delete extras.status;
    if (Object.keys(extras).length) parts.push(JSON.stringify(extras));
    console.log(parts.join('  '));
  }
}

async function cmdPiece(slug) {
  if (!slug || !SLUG_RE.test(slug)) throw new Error('slug required');
  const idx = await loadIndex();
  const runs = Object.values(idx)
    .filter((r) => r.slug === slug)
    .sort((a, b) => String(a.started_at).localeCompare(String(b.started_at)));
  if (runs.length === 0) { console.log(`(no runs for ${slug})`); return; }

  console.log(`# Runs for ${slug}`);
  for (const r of runs) {
    console.log(`\n${r.run_id}  ${r.skill}  ${r.status}  ${r.started_at}`);
    const events = await readEvents(r.run_id);
    const critiques = events.filter((e) => e.event === 'critique');
    for (const c of critiques) {
      const s = c.scores ?? c.data?.scores ?? {};
      const scoreStr = Object.entries(s).map(([k, v]) => `${k[0]}=${v}`).join(' ');
      console.log(`    iter ${c.iteration ?? '?'}: ${scoreStr}`);
    }
  }
}

async function cmdStats() {
  const idx = await loadIndex();
  const runs = Object.values(idx);
  if (runs.length === 0) { console.log('(no runs yet)'); return; }

  const bySkill = {};
  const byStatus = {};
  const bySlug = {};
  for (const r of runs) {
    bySkill[r.skill]   = (bySkill[r.skill]   ?? 0) + 1;
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    bySlug[r.slug]     = (bySlug[r.slug]     ?? 0) + 1;
  }

  // chef d'oeuvre rate from iterate runs
  let iterRuns = 0, chefRuns = 0, iterCountTotal = 0;
  for (const r of runs) {
    if (r.skill !== 'vjay-iterate') continue;
    iterRuns++;
    const events = await readEvents(r.run_id);
    const crits = events.filter((e) => e.event === 'critique');
    iterCountTotal += crits.length;
    const last = crits.at(-1);
    if (last && (last.chef_doeuvre === true || last.data?.chef_doeuvre === true)) chefRuns++;
  }

  console.log(`Total runs:       ${runs.length}`);
  console.log(`By skill:         ${JSON.stringify(bySkill)}`);
  console.log(`By status:        ${JSON.stringify(byStatus)}`);
  console.log(`Pieces touched:   ${Object.keys(bySlug).length}`);
  if (iterRuns) {
    console.log(`Iterate runs:     ${iterRuns}`);
    console.log(`Chef d'oeuvre:    ${chefRuns} / ${iterRuns} (${(100 * chefRuns / iterRuns).toFixed(0)}%)`);
    console.log(`Avg iterations:   ${(iterCountTotal / iterRuns).toFixed(1)}`);
  }
}

async function cmdRollup(slug) {
  if (!slug || !SLUG_RE.test(slug)) throw new Error('slug required');
  await ensureDirs();

  const idx = await loadIndex();
  const runs = Object.values(idx)
    .filter((r) => r.slug === slug)
    .sort((a, b) => String(a.started_at).localeCompare(String(b.started_at)));

  const lines = [];
  lines.push(`# ${slug} — run history`);
  lines.push('');
  lines.push('Auto-rolled from `.runs/*.jsonl` by `node bin/runs.mjs rollup ' + slug + '`.');
  lines.push('Each row is one critique event; rows within the same run share a run_id prefix.');
  lines.push('');
  lines.push('| date       | run                                   | skill        | iter | pal | comp | mot | int | dep | form | chef | fix                                            |');
  lines.push('|------------|---------------------------------------|--------------|------|-----|------|-----|-----|-----|------|------|-------------------------------------------------|');

  let rowCount = 0;
  for (const r of runs) {
    const date = (r.started_at ?? '').slice(0, 10);
    const events = await readEvents(r.run_id).catch(() => []);
    const critiques = events.filter((e) => e.event === 'critique');
    if (critiques.length === 0) {
      lines.push(`| ${date} | ${trunc(r.run_id, 37)} | ${(r.skill ?? '').padEnd(12)} | —    | —   | —    | —   | —   | —   | —    | —    | (no critiques logged)                           |`);
      rowCount++;
      continue;
    }
    for (const c of critiques) {
      const s = c.scores ?? c.data?.scores ?? {};
      const chef = c.chef_doeuvre ?? c.data?.chef_doeuvre;
      const fix = (c.top_fix?.dimension ?? c.data?.top_fix?.dimension ?? '—');
      const fixWhat = (c.top_fix?.what ?? c.data?.top_fix?.what ?? '').split('\n')[0].slice(0, 46);
      lines.push(`| ${date} | ${trunc(r.run_id, 37)} | ${(r.skill ?? '').padEnd(12)} | ${String(c.iteration ?? '?').padEnd(4)} | ${cell(s.palette_cohesion)} | ${cell(s.composition, 4)} | ${cell(s.motion)} | ${cell(s.intensity)} | ${cell(s.depth)} | ${cell(s.form_ending, 4)} | ${chef === true ? 'yes' : chef === false ? 'no' : '—  '}  | ${(fixWhat || '(shipped)').padEnd(47)} |`);
      rowCount++;
    }
  }

  if (rowCount === 0) {
    lines.push('| — | (no runs yet) | | | | | | | | | | |');
  }

  lines.push('');
  lines.push(`Total runs: ${runs.length}.`);

  const out = join(rollupDir, slug + '.md');
  await writeFile(out, lines.join('\n') + '\n');
  console.log(`wrote ${out}`);
}

// ---------- helpers ----------

function usageAndExit() {
  console.error([
    'usage:',
    '  node bin/runs.mjs start  --slug <slug> --skill <name>',
    '  node bin/runs.mjs log    <run_id> --event <name> [--status s] [--data json] [--k v …]',
    '  node bin/runs.mjs end    <run_id> [--status shipped|aborted|stuck]',
    '  node bin/runs.mjs list   [--limit N]',
    '  node bin/runs.mjs show   <run_id>',
    '  node bin/runs.mjs piece  <slug>',
    '  node bin/runs.mjs stats',
    '  node bin/runs.mjs rollup <slug>',
  ].join('\n'));
  process.exit(2);
}

function parseFlags(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      out[key] = 'true';
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

function maybeJson(s) {
  if (typeof s !== 'string') return s;
  if (s === 'true')  return true;
  if (s === 'false') return false;
  if (s === 'null')  return null;
  if (/^-?\d+$/.test(s))          return parseInt(s, 10);
  if (/^-?\d+\.\d+$/.test(s))     return parseFloat(s);
  try {
    const v = JSON.parse(s);
    if (typeof v === 'object') return v;
  } catch {}
  return s;
}

function makeRunId(date, slug, skill) {
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = date.getUTCFullYear()
    + pad(date.getUTCMonth() + 1)
    + pad(date.getUTCDate())
    + 'T' + pad(date.getUTCHours())
    + pad(date.getUTCMinutes())
    + pad(date.getUTCSeconds());
  const short = SKILL_SHORT[skill] ?? skill.replace(/[^a-z0-9]/g, '').slice(0, 6);
  return `R-${stamp}-${slug}-${short}`;
}

async function ensureDirs() {
  await mkdir(runsDir,   { recursive: true });
  await mkdir(rollupDir, { recursive: true });
}

async function loadIndex() {
  if (!existsSync(indexPath)) return {};
  try   { return JSON.parse(await readFile(indexPath, 'utf8')); }
  catch { return {}; }
}

async function updateIndex(mutator) {
  await ensureDirs();
  const idx = await loadIndex();
  mutator(idx);
  await writeFile(indexPath, JSON.stringify(idx, null, 2));
}

async function readEvents(runId) {
  const jsonl = join(runsDir, runId + '.jsonl');
  if (!existsSync(jsonl)) throw new Error(`run not found: ${runId}`);
  const raw = await readFile(jsonl, 'utf8');
  return raw.split('\n').filter(Boolean).map((l) => {
    try { return JSON.parse(l); } catch { return { _malformed: l }; }
  });
}

function trunc(s, n) { s = String(s ?? ''); return s.length > n ? s.slice(0, n) : s.padEnd(n); }
function cell(v, w = 3) {
  if (v === undefined || v === null) return '—'.padEnd(w);
  return String(v).padEnd(w);
}
