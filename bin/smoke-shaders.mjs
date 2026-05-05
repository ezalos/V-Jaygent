#!/usr/bin/env node
// ABOUTME: Headless smoke-test — launches the studio, visits every piece in the
// ABOUTME: catalog via Playwright, and fails if any piece logs a shader compile error.
import { chromium } from 'playwright';
import { createStudioServer } from '../studio/server.mjs';
import { fileURLToPath } from 'node:url';

const piecesDir = fileURLToPath(new URL('../pieces', import.meta.url));
const server = createStudioServer({ piecesDir });
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}`;

const catalog = await (await fetch(`${baseUrl}/api/catalog`)).json();
const slugs = process.argv.slice(2).length
  ? process.argv.slice(2)
  : catalog.map((p) => p.slug);

const browser = await chromium.launch();
const failures = [];

// Warm-up page: chromium's first GPU init after launch sometimes races the
// runtime's initial shader compile, producing a null shader handle in the
// first context even though the runtime code is correct. Burn one page on a
// no-op navigation before real checks so subsequent contexts see a settled GPU.
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${baseUrl}/`).catch(() => {});
  await page.waitForTimeout(400);
  await ctx.close();
}

for (const slug of slugs) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(String(err)));

  try {
    await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'domcontentloaded' });
    // Wait for the runtime to have either rendered a frame OR shown an error.
    // Playwright sometimes fires goto before chromium finishes GPU init; the
    // runtime's first compile can race with that, so polling is more reliable
    // than a fixed sleep.
    await page.waitForFunction(() => {
      const err = document.getElementById('error');
      if (err && !err.classList.contains('hidden')) return true;
      const c = document.getElementById('stage');
      // Canvas has non-zero dims AND at least one frame has elapsed — by now
      // the runtime has either succeeded or populated the error overlay.
      return c && c.width > 0 && c.height > 0 && performance.now() > 2000;
    }, { timeout: 6000 }).catch(() => {});

    const errorVisible = await page.evaluate(() => {
      const el = document.getElementById('error');
      return el && !el.classList.contains('hidden');
    });
    const errorText = errorVisible
      ? await page.evaluate(() => document.getElementById('error')?.textContent ?? '')
      : '';

    // Verify the canvas isn't rendering the fallback shader (uniform
    // vec4(0.5, 0.0, 0.0, 1.0) — convention for "engine load failed").
    // Smoke should not pass a piece that "compiles clean" but silently fell
    // back to the red. Sample 5 pixels: if ALL look like fallback-red AND
    // they're nearly identical (low variance), the canvas is the fallback.
    // Pieces with red imagery (brick, prism on a hot beat) sample varied
    // colors at different points and pass.
    let visualCheck = { ok: true };
    try {
      const buf = await page.locator('#stage').screenshot();
      const samples = await page.evaluate(async (b64) => {
        const blob = await (await fetch('data:image/png;base64,' + b64)).blob();
        const bmp = await createImageBitmap(blob);
        const c2d = new OffscreenCanvas(bmp.width, bmp.height).getContext('2d');
        c2d.drawImage(bmp, 0, 0);
        const pts = [
          [bmp.width >> 1, bmp.height >> 1],            // centre
          [bmp.width >> 2, bmp.height >> 2],            // upper-left quadrant
          [(bmp.width * 3) >> 2, bmp.height >> 2],      // upper-right
          [bmp.width >> 2, (bmp.height * 3) >> 2],      // lower-left
          [(bmp.width * 3) >> 2, (bmp.height * 3) >> 2],// lower-right
        ];
        return pts.map(([x, y]) => {
          const d = c2d.getImageData(x, y, 1, 1).data;
          return [d[0], d[1], d[2], d[3]];
        });
      }, buf.toString('base64'));
      // Each sample matches fallback if r in [100,150], g<25, b<25.
      const looksFallback = (p) => p[0] >= 100 && p[0] <= 150 && p[1] < 25 && p[2] < 25;
      const allFallback = samples.every(looksFallback);
      // Variance check — fallback is uniform; real pieces vary.
      const rs = samples.map((p) => p[0]);
      const range = Math.max(...rs) - Math.min(...rs);
      if (allFallback && range < 8) {
        visualCheck = {
          ok: false,
          reason: `fallback-red shader visible (5 samples uniform-red; first=${samples[0].join(',')}); layer engine did not render`,
        };
      }
    } catch (e) {
      console.log(`      [smoke] screenshot failed: ${e.message}`);
    }

    if (errorVisible || pageErrors.length || errors.length || !visualCheck.ok) {
      failures.push({ slug, errorVisible, errorText, consoleErrors: errors, pageErrors, visualCheck });
      console.log(`  ✗ ${slug}`);
      if (errorText) console.log(`      overlay: ${errorText.slice(0, 300).replace(/\s+/g, ' ')}`);
      for (const e of errors) console.log(`      console: ${e.slice(0, 300)}`);
      for (const e of pageErrors) console.log(`      pageerror: ${e.slice(0, 300)}`);
      if (!visualCheck.ok) console.log(`      visual: ${visualCheck.reason}`);
    } else {
      console.log(`  ✓ ${slug}`);
    }
  } catch (err) {
    failures.push({ slug, err: String(err) });
    console.log(`  ✗ ${slug} — ${err.message}`);
  } finally {
    await ctx.close();
  }
}

await browser.close();
await new Promise((resolve) => server.close(resolve));

if (failures.length) {
  console.error(`\n${failures.length} / ${slugs.length} pieces failed`);
  process.exit(1);
}
console.log(`\nall ${slugs.length} pieces compiled clean`);
