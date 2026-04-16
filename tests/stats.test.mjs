// ABOUTME: Visitor-stats tests — exercise the counter end-to-end through the studio
// ABOUTME: server, plus token guarding, bot filtering, and unique-visitor dedup.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStudioServer } from '../studio/server.mjs';
import { createStats } from '../studio/stats.mjs';

let server;
let baseUrl;
let piecesDir;
let statsDir;
let statsFile;
let stats;

before(async () => {
  piecesDir = mkdtempSync(join(tmpdir(), 'vjaygent-stats-'));
  cpSync(
    new URL('./fixtures/pieces/test-piece', import.meta.url),
    join(piecesDir, 'test-piece'),
    { recursive: true },
  );
  writeFileSync(join(piecesDir, 'current.txt'), 'test-piece\n');

  statsDir = mkdtempSync(join(tmpdir(), 'vjaygent-stats-data-'));
  statsFile = join(statsDir, 'stats.json');
  stats = createStats({ file: statsFile });
  await stats.load();

  server = createStudioServer({ piecesDir, stats, statsToken: 'secret-xyz' });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  rmSync(piecesDir, { recursive: true, force: true });
  rmSync(statsDir, { recursive: true, force: true });
});

async function getStats() {
  const res = await fetch(baseUrl + '/api/stats?token=secret-xyz');
  assert.equal(res.status, 200);
  return res.json();
}

test('/api/stats requires the configured token', async () => {
  const noTok = await fetch(baseUrl + '/api/stats');
  assert.equal(noTok.status, 401);
  const wrong = await fetch(baseUrl + '/api/stats?token=nope');
  assert.equal(wrong.status, 401);
  const bearer = await fetch(baseUrl + '/api/stats', {
    headers: { authorization: 'Bearer secret-xyz' },
  });
  assert.equal(bearer.status, 200);
});

test('GET / records a root view', async () => {
  const before = await getStats();
  const beforeViews = before.totals.views;
  const beforeRoot  = before.pieces._root?.views ?? 0;

  await fetch(baseUrl + '/', { headers: { 'user-agent': 'test-browser/1' } });

  const after = await getStats();
  assert.equal(after.totals.views, beforeViews + 1);
  assert.equal(after.pieces._root.views, beforeRoot + 1);
});

test('GET /<slug> records a per-piece view', async () => {
  const before = await getStats();
  const beforeViews = before.totals.views;
  const beforePiece = before.pieces['test-piece']?.views ?? 0;

  await fetch(baseUrl + '/test-piece', { headers: { 'user-agent': 'test-browser/2' } });

  const after = await getStats();
  assert.equal(after.totals.views, beforeViews + 1);
  assert.equal(after.pieces['test-piece'].views, beforePiece + 1);
});

test('API and asset routes do not record views', async () => {
  const before = await getStats();
  const beforeViews = before.totals.views;

  await fetch(baseUrl + '/api/catalog', { headers: { 'user-agent': 'test-browser/3' } });
  await fetch(baseUrl + '/api/current', { headers: { 'user-agent': 'test-browser/3' } });
  await fetch(baseUrl + '/runtime.mjs',  { headers: { 'user-agent': 'test-browser/3' } });
  await fetch(baseUrl + '/styles.css',   { headers: { 'user-agent': 'test-browser/3' } });

  const after = await getStats();
  assert.equal(after.totals.views, beforeViews, 'asset/api routes must not be counted');
});

test('bot user-agents are ignored', async () => {
  const before = await getStats();
  const beforeViews = before.totals.views;

  await fetch(baseUrl + '/', { headers: { 'user-agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' } });
  await fetch(baseUrl + '/', { headers: { 'user-agent': 'TelegramBot (like TwitterBot)' } });
  await fetch(baseUrl + '/', { headers: { 'user-agent': 'facebookexternalhit/1.1' } });

  const after = await getStats();
  assert.equal(after.totals.views, beforeViews, 'bots must not be counted');
});

test('repeated visits from the same UA are one unique per day', async () => {
  // Use a fresh isolated stats instance so other tests don't pollute the unique count.
  const fresh = createStats({ file: join(statsDir, 'isolated.json') });
  await fresh.load();
  const isolated = createStudioServer({ piecesDir, stats: fresh });
  await new Promise((r) => isolated.listen(0, '127.0.0.1', r));
  const { port } = isolated.address();
  const url = `http://127.0.0.1:${port}`;
  try {
    await fetch(url + '/',           { headers: { 'user-agent': 'unique-test/1' } });
    await fetch(url + '/',           { headers: { 'user-agent': 'unique-test/1' } });
    await fetch(url + '/test-piece', { headers: { 'user-agent': 'unique-test/1' } });

    const today = new Date().toISOString().slice(0, 10);
    const summary = fresh.summary();
    assert.equal(summary.totals.views, 3);
    assert.equal(summary.daily[today].views, 3);
    assert.equal(summary.daily[today].uniques, 1, 'three hits from one UA → one unique');

    await fetch(url + '/', { headers: { 'user-agent': 'unique-test/2' } });
    const after = fresh.summary();
    assert.equal(after.daily[today].uniques, 2, 'a second UA → second unique');
  } finally {
    await new Promise((r) => isolated.close(r));
  }
});

test('summary excludes the internal _seen hash set', async () => {
  const summary = await getStats();
  for (const [day, info] of Object.entries(summary.daily)) {
    assert.equal(info._seen, undefined, `day ${day} leaked _seen`);
  }
});

test('flush persists to disk and load round-trips', async () => {
  await stats.flush();
  assert.ok(existsSync(statsFile), 'stats file should exist after flush');

  const persisted = JSON.parse(readFileSync(statsFile, 'utf8'));
  assert.equal(typeof persisted.totals.views, 'number');
  assert.ok(persisted.totals.views > 0);

  const reloaded = createStats({ file: statsFile });
  await reloaded.load();
  assert.equal(reloaded.summary().totals.views, persisted.totals.views);
});

test('/api/stats returns 404 when stats are not wired', async () => {
  const noStatsServer = createStudioServer({ piecesDir });
  await new Promise((r) => noStatsServer.listen(0, '127.0.0.1', r));
  const { port } = noStatsServer.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/stats`);
    assert.equal(res.status, 404);
  } finally {
    await new Promise((r) => noStatsServer.close(r));
  }
});
