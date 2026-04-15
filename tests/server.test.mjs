// ABOUTME: Server smoke tests — boot the studio server against a temp catalog
// ABOUTME: and exercise every API route including error and path-traversal cases.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStudioServer } from '../studio/server.mjs';

let server;
let baseUrl;
let piecesDir;

before(async () => {
  piecesDir = mkdtempSync(join(tmpdir(), 'vjaygent-test-'));
  cpSync(
    new URL('./fixtures/pieces/test-piece', import.meta.url),
    join(piecesDir, 'test-piece'),
    { recursive: true },
  );
  writeFileSync(join(piecesDir, 'current.txt'), 'test-piece\n');

  server = createStudioServer({ piecesDir });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  rmSync(piecesDir, { recursive: true, force: true });
});

test('GET / returns the studio html', async () => {
  const res = await fetch(baseUrl + '/');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') ?? '', /text\/html/);
  const body = await res.text();
  assert.match(body, /<canvas/);
});

test('GET /api/catalog lists pieces', async () => {
  const res = await fetch(baseUrl + '/api/catalog');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body));
  const entry = body.find((p) => p.slug === 'test-piece');
  assert.ok(entry, 'test-piece missing from catalog');
  assert.equal(entry.title, 'Test Piece — Rolling Gradient');
});

test('GET /api/current returns the current pointer', async () => {
  const res = await fetch(baseUrl + '/api/current');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.slug, 'test-piece');
  assert.equal(body.meta.title, 'Test Piece — Rolling Gradient');
});

test('GET /api/current returns null when no pointer', async () => {
  const emptyDir = mkdtempSync(join(tmpdir(), 'vjaygent-empty-'));
  const emptyServer = createStudioServer({ piecesDir: emptyDir });
  await new Promise((resolve) => emptyServer.listen(0, '127.0.0.1', resolve));
  const { port } = emptyServer.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/current`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.slug, null);
  } finally {
    await new Promise((resolve) => emptyServer.close(resolve));
    rmSync(emptyDir, { recursive: true, force: true });
  }
});

test('GET /api/pieces/:slug/shader.frag returns shader source', async () => {
  const res = await fetch(baseUrl + '/api/pieces/test-piece/shader.frag');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') ?? '', /text\/plain|application\/octet-stream/);
  const body = await res.text();
  assert.match(body, /#version 300 es/);
  assert.match(body, /void main/);
});

test('GET /api/pieces/:slug/meta returns parsed yaml', async () => {
  const res = await fetch(baseUrl + '/api/pieces/test-piece/meta');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.slug, 'test-piece');
  assert.equal(body.duration, 6);
});

test('GET /api/pieces/:slug/mtime returns a numeric mtime', async () => {
  const res = await fetch(baseUrl + '/api/pieces/test-piece/mtime');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(typeof body.mtime, 'number');
  assert.ok(body.mtime > 0);
});

test('unknown piece returns 404', async () => {
  const res = await fetch(baseUrl + '/api/pieces/does-not-exist/shader.frag');
  assert.equal(res.status, 404);
});

test('path traversal in slug is rejected', async () => {
  const res = await fetch(baseUrl + '/api/pieces/..%2F..%2Fetc/shader.frag');
  assert.equal(res.status, 404);
});

test('unknown route returns 404', async () => {
  const res = await fetch(baseUrl + '/api/bogus');
  assert.equal(res.status, 404);
});
