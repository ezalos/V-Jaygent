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
let layersDir;
let critiquesDir;

before(async () => {
  piecesDir = mkdtempSync(join(tmpdir(), 'vjaygent-test-'));
  cpSync(
    new URL('./fixtures/pieces/test-piece', import.meta.url),
    join(piecesDir, 'test-piece'),
    { recursive: true },
  );
  writeFileSync(join(piecesDir, 'current.txt'), 'test-piece\n');

  layersDir = mkdtempSync(join(tmpdir(), 'vjaygent-layers-test-'));
  cpSync(
    new URL('./fixtures/layers', import.meta.url),
    layersDir,
    { recursive: true },
  );

  critiquesDir = mkdtempSync(join(tmpdir(), 'vjaygent-critiques-test-'));
  cpSync(
    new URL('./fixtures/critiques', import.meta.url),
    critiquesDir,
    { recursive: true },
  );

  server = createStudioServer({ piecesDir, layersDir, critiquesDir });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  rmSync(piecesDir, { recursive: true, force: true });
  rmSync(layersDir, { recursive: true, force: true });
  rmSync(critiquesDir, { recursive: true, force: true });
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

test('GET /api/pieces/:slug/analysis returns audio.analysis.json when present', async () => {
  const res = await fetch(baseUrl + '/api/pieces/test-piece/analysis');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') ?? '', /application\/json/);
  const body = await res.json();
  assert.equal(body.version, 1);
  assert.equal(body.bpm, 120);
  assert.equal(body.sections.length, 2);
  assert.equal(body.key.tonic, 'A');
});

test('GET /audio-analysis.mjs serves the runtime audio module', async () => {
  const res = await fetch(baseUrl + '/audio-analysis.mjs');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') ?? '', /javascript/);
  const body = await res.text();
  assert.match(body, /export function parse/);
  assert.match(body, /export function sample/);
});

test('GET /api/layers/:name/shader.frag returns global layer source', async () => {
  const res = await fetch(baseUrl + '/api/layers/global-layer/shader.frag');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') ?? '', /text\/plain/);
  const body = await res.text();
  assert.match(body, /global-layer fixture/);
});

test('GET /api/layers/:name/meta returns parsed yaml as json', async () => {
  const res = await fetch(baseUrl + '/api/layers/global-layer/meta');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') ?? '', /application\/json/);
  const body = await res.json();
  assert.equal(body.name, 'global-layer');
  assert.equal(body.default_blend, 'normal');
});

test('GET /api/layers/:name returns 404 for unknown layer', async () => {
  const res = await fetch(baseUrl + '/api/layers/does-not-exist/shader.frag');
  assert.equal(res.status, 404);
});

test('GET /api/layers/:name rejects invalid layer name', async () => {
  const res = await fetch(baseUrl + '/api/layers/UPPER%20case/shader.frag');
  assert.equal(res.status, 404);
});

test('piece-layer route falls back to global when no piece-local override', async () => {
  const res = await fetch(baseUrl + '/api/pieces/test-piece/layer/global-layer/shader.frag');
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /global-layer fixture/);
});

test('piece-layer route prefers piece-local override over global', async () => {
  const fragRes = await fetch(baseUrl + '/api/pieces/test-piece/layer/overridden-layer/shader.frag');
  assert.equal(fragRes.status, 200);
  const fragBody = await fragRes.text();
  assert.match(fragBody, /piece-local/i);
  assert.doesNotMatch(fragBody, /should be hidden/i);

  const metaRes = await fetch(baseUrl + '/api/pieces/test-piece/layer/overridden-layer/meta');
  assert.equal(metaRes.status, 200);
  const meta = await metaRes.json();
  assert.equal(meta.default_blend, 'add');  // piece-local wins; global says 'normal'
});

test('piece-layer route 404s when neither piece-local nor global exists', async () => {
  const res = await fetch(baseUrl + '/api/pieces/test-piece/layer/nonexistent/shader.frag');
  assert.equal(res.status, 404);
});

test('GET /api/pieces/:slug/analysis returns 404 when piece has no analysis JSON', async () => {
  // test-piece has analysis; create a sibling without one
  const fs = await import('node:fs/promises');
  const sibling = join(piecesDir, 'no-analysis');
  await fs.mkdir(sibling, { recursive: true });
  await fs.writeFile(join(sibling, 'meta.yaml'), 'title: no-analysis\nslug: no-analysis\nduration: 6\n');
  await fs.writeFile(join(sibling, 'shader.frag'), '#version 300 es\nprecision highp float;\nout vec4 fragColor;\nvoid main() { fragColor = vec4(0); }\n');
  const res = await fetch(baseUrl + '/api/pieces/no-analysis/analysis');
  assert.equal(res.status, 404);
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

test('GET /api/lib/:name returns a lib module', async () => {
  const res = await fetch(baseUrl + '/api/lib/noise.glsl');
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /float hash21/);
  assert.match(body, /float vnoise/);
});

test('GET /api/lib for a missing module returns 404', async () => {
  const res = await fetch(baseUrl + '/api/lib/does-not-exist.glsl');
  assert.equal(res.status, 404);
});

test('lib route rejects non-glsl and path-traversal names', async () => {
  for (const bad of ['noise.js', '..%2Fetc%2Fpasswd', 'sub/noise.glsl', 'noise', '.hidden.glsl']) {
    const res = await fetch(baseUrl + '/api/lib/' + bad);
    assert.equal(res.status, 404, `expected 404 for ${bad}`);
  }
});

test('GET /api/pieces/:slug/pass/:name serves pass shaders', async () => {
  // Write an extra pass shader into the test piece for this test only.
  writeFileSync(join(piecesDir, 'test-piece', 'sim.frag'),
    '#version 300 es\nprecision highp float;\nout vec4 fragColor;\nvoid main() { fragColor = vec4(0); }\n');
  const res = await fetch(baseUrl + '/api/pieces/test-piece/pass/sim.frag');
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /void main/);
});

test('pass route rejects non-.frag names', async () => {
  for (const bad of ['sim.js', 'shader', '..%2Fetc', 'sub/sim.frag']) {
    const res = await fetch(baseUrl + '/api/pieces/test-piece/pass/' + bad);
    assert.equal(res.status, 404, `expected 404 for ${bad}`);
  }
});

test('mtime aggregates over multi-pass shader files', async () => {
  // Add a sim.frag, patch meta to include a passes block, touch sim.frag — its
  // mtime must bubble up to the piece mtime endpoint.
  const piece = join(piecesDir, 'test-piece');
  writeFileSync(join(piece, 'sim.frag'),
    '#version 300 es\nprecision highp float;\nout vec4 fragColor;\nvoid main() { fragColor = vec4(1); }\n');
  writeFileSync(join(piece, 'meta.yaml'),
    'title: "Test Piece — Rolling Gradient"\n' +
    'slug: test-piece\n' +
    'duration: 6\n' +
    'uniforms: []\n' +
    'passes:\n' +
    '  - name: simulate\n' +
    '    shader: sim.frag\n' +
    '    target: { format: rgba16f, ping_pong: true }\n' +
    '    inputs: { u_state: simulate }\n' +
    '  - name: display\n' +
    '    shader: shader.frag\n' +
    '    target: screen\n' +
    '    inputs: { u_state: simulate }\n');
  const before = await fetch(baseUrl + '/api/pieces/test-piece/mtime').then((r) => r.json());

  // Bump sim.frag mtime into the future — must raise the aggregate.
  const future = Date.now() / 1000 + 60;
  const { utimesSync } = await import('node:fs');
  utimesSync(join(piece, 'sim.frag'), future, future);

  const after = await fetch(baseUrl + '/api/pieces/test-piece/mtime').then((r) => r.json());
  assert.ok(after.mtime > before.mtime, `mtime did not advance: ${before.mtime} -> ${after.mtime}`);
});

test('GET /api/pieces/:slug/file/:name serves piece files', async () => {
  const res = await fetch(baseUrl + '/api/pieces/test-piece/file/shader.frag');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('accept-ranges'), 'bytes');
  const body = await res.text();
  assert.match(body, /#version 300 es/);
});

test('file route rejects invalid filenames', async () => {
  for (const bad of ['.hidden', '..', '../etc', 'with/slash', 'space file']) {
    const res = await fetch(baseUrl + '/api/pieces/test-piece/file/' + encodeURIComponent(bad));
    assert.equal(res.status, 404, `expected 404 for ${bad}`);
  }
});

test('file route returns 404 for missing file', async () => {
  const res = await fetch(baseUrl + '/api/pieces/test-piece/file/nope.mp3');
  assert.equal(res.status, 404);
});

test('catalog sorts most-recent-first across created timestamps', async () => {
  // js-yaml parses `created:` into Date objects; the historical bug compared
  // String(date) — "Wed May 20…" — so order followed day-of-week names.
  // 2026-05-20 is a Wednesday and 2026-05-21 a Thursday: lexically W > T,
  // so the broken sort put the OLDER piece first.
  const fs = await import('node:fs/promises');
  for (const [slug, created] of [
    ['sort-older', '2026-05-20T12:00:00.000Z'],
    ['sort-newer', '2026-05-21T12:00:00.000Z'],
  ]) {
    await fs.mkdir(join(piecesDir, slug), { recursive: true });
    await fs.writeFile(join(piecesDir, slug, 'meta.yaml'),
      `title: ${slug}\nslug: ${slug}\ncreated: ${created}\nduration: 6\n`);
    await fs.writeFile(join(piecesDir, slug, 'shader.frag'),
      '#version 300 es\nprecision highp float;\nout vec4 fragColor;\nvoid main() { fragColor = vec4(0); }\n');
  }
  const body = await fetch(baseUrl + '/api/catalog').then((r) => r.json());
  const slugs = body.map((p) => p.slug);
  const newer = slugs.indexOf('sort-newer');
  const older = slugs.indexOf('sort-older');
  assert.ok(newer !== -1 && older !== -1, 'sort fixtures missing from catalog');
  assert.ok(newer < older, `expected sort-newer before sort-older, got ${slugs.join(', ')}`);
});

test('GET /api/critic-summary returns the latest verdict per slug', async () => {
  const res = await fetch(baseUrl + '/api/critic-summary');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body['test-piece'].verdict, 'ship-it');     // v2-i1 wins over v1
  assert.equal(body['test-piece'].version, 'v2-i1');
  assert.equal(body['test-piece'].count, 2);
  assert.equal(body['test-piece'].mesmerizing_passes, 5);
  assert.equal(body['test-piece'].composite, 4.4);          // mean of 5,4,4,4,5 (n/a skipped)
  assert.equal(body['prose-piece'].verdict, 'needs-tweak'); // scraped, no YAML tail
});

test('GET /api/pieces/:slug/critiques returns parsed critiques oldest-first', async () => {
  const res = await fetch(baseUrl + '/api/pieces/test-piece/critiques');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.slug, 'test-piece');
  assert.equal(body.critiques.length, 2);
  const [v1, v2] = body.critiques;
  assert.equal(v1.version, 'v1');
  assert.equal(v1.verdict, 'needs-tweak');
  assert.equal(v1.structured, true);
  assert.equal(v1.probes.mesmerizing.prediction, 'fail');
  assert.equal(v1.probes.music.motion_over_luminance, 'shader-pass');
  assert.equal(v1.scores.motion, 2);
  assert.equal(v1.composite, 3.6);
  assert.equal(v1.top_fix, 'add baseline per-beat motion');
  assert.equal(v2.version, 'v2-i1');
  assert.equal(v2.verdict, 'ship-it');
  assert.equal(v2.passes.mesmerizing, 5);
});

test('prose-only critique falls back to a scraped verdict', async () => {
  const res = await fetch(baseUrl + '/api/pieces/prose-piece/critiques');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.critiques.length, 1);
  assert.equal(body.critiques[0].structured, false);
  assert.equal(body.critiques[0].verdict, 'needs-tweak');
  assert.equal(body.critiques[0].scores, null);
});

test('piece without critiques returns an empty list', async () => {
  const res = await fetch(baseUrl + '/api/pieces/sort-newer/critiques');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body.critiques, []);
});

test('GET /api/critiques/:file serves raw critique markdown', async () => {
  const res = await fetch(baseUrl + '/api/critiques/test-piece-v1.md');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') ?? '', /text\/plain/);
  const body = await res.text();
  assert.match(body, /# Critique: test-piece v1/);
});

test('critique file route rejects traversal and non-md names', async () => {
  for (const bad of ['..%2F..%2Fpackage.json', 'test-piece-v1', '.hidden.md', 'sub%2Ffile.md', 'nope.md']) {
    const res = await fetch(baseUrl + '/api/critiques/' + bad);
    assert.equal(res.status, 404, `expected 404 for ${bad}`);
  }
});

test('file route honors Range requests', async () => {
  const full = await fetch(baseUrl + '/api/pieces/test-piece/file/shader.frag').then((r) => r.text());
  const total = Buffer.byteLength(full, 'utf8');
  const res = await fetch(baseUrl + '/api/pieces/test-piece/file/shader.frag', {
    headers: { Range: 'bytes=0-9' },
  });
  assert.equal(res.status, 206);
  assert.equal(res.headers.get('content-range'), `bytes 0-9/${total}`);
  const body = await res.text();
  assert.equal(body.length, 10);
  assert.equal(body, full.slice(0, 10));
});
