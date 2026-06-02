#!/usr/bin/env node
// ABOUTME: Offline parameter explorer for chaos-game + strange-attractor seeds.
// ABOUTME: Computes the orbit in a headless canvas (playwright) and saves a PNG.
//
// Usage:
//   node bin/explore-attractor.mjs clifford <a> <b> <c> <d>     [opts]
//   node bin/explore-attractor.mjs dejong   <a> <b> <c> <d>     [opts]
//   node bin/explore-attractor.mjs chaos-game <n_vertex> <k>    [opts]   # k = restriction depth 0|1|2|3
//   node bin/explore-attractor.mjs gallery clifford|dejong              # canonical seed set side-by-side
//
// Options:
//   --r <float>      jump fraction for chaos-game (default 0.5)
//   --iter <N>       iterations (default 5_000_000)
//   --size <px>      output size (default 1024)
//   --burn <N>       discard first N points (default 50)
//   --bg <hex>       background hex (default 000000)
//   --fg <hex>       foreground hex (default ffffff)
//   --gamma <f>      log-tone-map gamma (default 0.45)
//   --out <path>     output PNG (default ./out.png)
//   --headed         show the browser window (for debugging)
//
// Reference: brainstorming/techniques/{chaos-game,strange-attractors}.md.

import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

function parseArgs(argv) {
  const out = {
    kind: null,
    positional: [],
    opts: {
      r: 0.5,
      iter: 5_000_000,
      size: 1024,
      burn: 50,
      bg: '000000',
      fg: 'ffffff',
      gamma: 0.45,
      out: 'out.png',
      headed: false,
    },
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!out.kind) { out.kind = a; continue; }
    if (a === '--headed') { out.opts.headed = true; continue; }
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[++i];
      if (!(key in out.opts)) { console.error(`unknown option --${key}`); process.exit(2); }
      out.opts[key] = typeof out.opts[key] === 'number' ? Number(val) : val;
      continue;
    }
    out.positional.push(a);
  }
  return out;
}

const CANONICAL = {
  clifford: [
    { label: 'web',   a: -1.25, b: -1.25, c: -1.82, d: -1.91 },
    { label: 'lace',  a: -1.2,  b: -1.9,  c:  1.8,  d: -1.6  },
    { label: 'fold',  a: -1.7,  b:  1.8,  c: -1.9,  d: -0.4  },
    { label: 'curl',  a:  1.7,  b:  1.7,  c:  0.6,  d:  1.2  },
  ],
  dejong: [
    { label: 'sharp',  a:  1.4, b: -2.3, c:  2.4, d: -2.1 },
    { label: 'three',  a: -2.0, b: -2.0, c: -1.2, d:  2.0 },
    { label: 'bloom',  a:  1.641, b: 1.902, c: 0.316, d: 1.525 },
    { label: 'spiral', a: -2.7, b: -0.09, c: -0.86, d: -2.2 },
  ],
};

function buildHtml({ kind, params, opts, panels = null }) {
  // panels: optional array of {label, params} for gallery mode.
  return `<!doctype html>
<html><body style="margin:0;background:#${opts.bg};color:#fff;font-family:monospace">
<canvas id="c" width="${opts.size}" height="${opts.size}"
        style="display:block;background:#${opts.bg}"></canvas>
<div id="status" style="position:fixed;top:8px;left:8px;font-size:12px;opacity:0.6"></div>
<script>
const SIZE = ${opts.size};
const ITER = ${opts.iter};
const BURN = ${opts.burn};
const GAMMA = ${opts.gamma};
const BG = ${JSON.stringify(opts.bg)};
const FG = ${JSON.stringify(opts.fg)};
const KIND = ${JSON.stringify(kind)};
const PARAMS = ${JSON.stringify(params)};
const PANELS = ${JSON.stringify(panels)};

function hexRgb(h){return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}

// --- Algorithms ---------------------------------------------------------
function iterClifford(p, P){
  const x = Math.sin(P.a*p[1]) + P.c*Math.cos(P.a*p[0]);
  const y = Math.sin(P.b*p[0]) + P.d*Math.cos(P.b*p[1]);
  return [x, y];
}
function iterDeJong(p, P){
  const x = Math.sin(P.a*p[1]) - Math.cos(P.b*p[0]);
  const y = Math.sin(P.c*p[0]) - Math.cos(P.d*p[1]);
  return [x, y];
}
function makeChaosStepper(P){
  // P: { n, k, r }
  const n = P.n, k = P.k, r = P.r;
  const vx = new Float64Array(n), vy = new Float64Array(n);
  for (let i=0;i<n;i++){
    const ang = i * 2 * Math.PI / n + Math.PI/2;
    vx[i] = Math.cos(ang); vy[i] = Math.sin(ang);
  }
  const hist = [99,98,97]; // last, prev1, prev2 (only first k used)
  function pickVertex(){
    let v = Math.floor(Math.random()*n);
    if (k === 0) return v;
    if (k === 1) {
      while (v === hist[0]) v = Math.floor(Math.random()*n);
      return v;
    }
    // k >= 2 : neighbor restriction only when last k history entries equal
    const equal = (k===2) ? (hist[0] === hist[1])
                          : (hist[0] === hist[1] && hist[1] === hist[2]);
    if (!equal) return v;
    // reject neighbors of hist[0] (with wrap-around)
    const prev = hist[0];
    while (Math.abs(v - prev) === 1 || (v+1)%n === prev || (prev+1)%n === v){
      v = Math.floor(Math.random()*n);
    }
    return v;
  }
  return function step(p){
    const v = pickVertex();
    hist[2] = hist[1]; hist[1] = hist[0]; hist[0] = v;
    return [p[0] + r*(vx[v]-p[0]), p[1] + r*(vy[v]-p[1])];
  };
}

// --- Render -------------------------------------------------------------
function renderPanel(ctx, kind, params, originX, originY, size){
  const hist = new Uint32Array(size*size);
  let p = [0, 0];
  let step;
  if (kind === 'clifford') step = (q)=>iterClifford(q, params);
  else if (kind === 'dejong') step = (q)=>iterDeJong(q, params);
  else if (kind === 'chaos-game') step = makeChaosStepper(params);
  else throw new Error('unknown kind '+kind);

  // 1. First pass: bounds discovery on a sample.
  const sample = Math.min(20000, ITER>>4);
  let bx0=Infinity,bx1=-Infinity,by0=Infinity,by1=-Infinity;
  for (let i=0;i<BURN;i++) p = step(p);
  let q = p;
  for (let i=0;i<sample;i++){
    q = step(q);
    if (q[0]<bx0) bx0=q[0]; if (q[0]>bx1) bx1=q[0];
    if (q[1]<by0) by0=q[1]; if (q[1]>by1) by1=q[1];
  }
  // Pad bounds 4% so edges don't clip.
  const padX = (bx1-bx0)*0.04, padY=(by1-by0)*0.04;
  bx0 -= padX; bx1 += padX; by0 -= padY; by1 += padY;
  // Square the bounds.
  const cx = 0.5*(bx0+bx1), cy = 0.5*(by0+by1);
  const half = 0.5*Math.max(bx1-bx0, by1-by0);
  bx0 = cx-half; bx1 = cx+half; by0 = cy-half; by1 = cy+half;

  // 2. Main accumulation pass.
  q = p;
  let maxBin = 1;
  for (let i=0;i<ITER;i++){
    q = step(q);
    const u = (q[0]-bx0)/(bx1-bx0);
    const v = (q[1]-by0)/(by1-by0);
    if (u<0||u>=1||v<0||v>=1) continue;
    const px = (u*size)|0;
    const py = ((1-v)*size)|0; // flip y so up is up
    const idx = py*size + px;
    const c = ++hist[idx];
    if (c > maxBin) maxBin = c;
  }

  // 3. Tone-map: gamma * log(1 + density / scale).
  const [br,bg,bb] = hexRgb(BG);
  const [fr,fg,fb] = hexRgb(FG);
  const img = ctx.createImageData(size, size);
  const logMax = Math.log(1 + maxBin);
  for (let i=0;i<hist.length;i++){
    const t = Math.pow(Math.log(1+hist[i]) / logMax, GAMMA);
    const r = br + (fr-br)*t;
    const g = bg + (fg-bg)*t;
    const b = bb + (fb-bb)*t;
    const o = i*4;
    img.data[o]   = r;
    img.data[o+1] = g;
    img.data[o+2] = b;
    img.data[o+3] = 255;
  }
  ctx.putImageData(img, originX, originY);
}

const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const status = document.getElementById('status');

(async function(){
  ctx.fillStyle = '#'+BG; ctx.fillRect(0,0,SIZE,SIZE);
  if (PANELS) {
    const N = PANELS.length;
    const cols = Math.ceil(Math.sqrt(N));
    const rows = Math.ceil(N/cols);
    const cell = Math.floor(SIZE / Math.max(cols, rows));
    for (let i=0;i<N;i++){
      const x = (i % cols) * cell;
      const y = Math.floor(i/cols) * cell;
      status.textContent = 'panel '+(i+1)+'/'+N+' ('+PANELS[i].label+')';
      await new Promise(r=>setTimeout(r,0));
      renderPanel(ctx, KIND, PANELS[i].params, x, y, cell);
      ctx.fillStyle = '#'+FG;
      ctx.font = '14px monospace';
      ctx.fillText(PANELS[i].label, x+6, y+18);
    }
  } else {
    status.textContent = 'rendering...';
    await new Promise(r=>setTimeout(r,0));
    renderPanel(ctx, KIND, PARAMS, 0, 0, SIZE);
  }
  status.textContent = 'done';
  document.title = 'DONE';
})();
</script>
</body></html>`;
}

function parseSubcommand(kind, positional, opts) {
  if (kind === 'clifford' || kind === 'dejong') {
    if (positional.length !== 4) {
      console.error(`${kind} requires 4 args: a b c d`);
      process.exit(2);
    }
    const [a,b,c,d] = positional.map(Number);
    return { params: { a, b, c, d } };
  }
  if (kind === 'chaos-game') {
    if (positional.length !== 2) {
      console.error('chaos-game requires 2 args: n_vertex k_depth (0..3)');
      process.exit(2);
    }
    const n = Number(positional[0]);
    const k = Number(positional[1]);
    if (n < 3 || k < 0 || k > 3) { console.error('n>=3, 0<=k<=3'); process.exit(2); }
    return { params: { n, k, r: opts.r } };
  }
  if (kind === 'gallery') {
    const sub = positional[0];
    if (!CANONICAL[sub]) { console.error(`gallery <clifford|dejong>`); process.exit(2); }
    const panels = CANONICAL[sub].map(s => ({ label: s.label, params: { a:s.a, b:s.b, c:s.c, d:s.d } }));
    return { panels, panelKind: sub };
  }
  console.error('unknown kind: '+kind);
  console.error('usage: clifford | dejong | chaos-game | gallery');
  process.exit(2);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.kind) {
    console.error('usage: node bin/explore-attractor.mjs <clifford|dejong|chaos-game|gallery> ...');
    process.exit(2);
  }
  const { params, panels, panelKind } = parseSubcommand(args.kind, args.positional, args.opts);
  const renderKind = panels ? panelKind : args.kind;

  const html = buildHtml({ kind: renderKind, params, opts: args.opts, panels });

  const browser = await chromium.launch({ headless: !args.opts.headed });
  try {
    const ctx = await browser.newContext({ viewport: { width: args.opts.size, height: args.opts.size } });
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    // Wait for the page to flip its title to DONE.
    await page.waitForFunction(() => document.title === 'DONE', null, { timeout: 120000 });
    const buf = await page.locator('#c').screenshot({ omitBackground: false });
    const outPath = resolve(process.cwd(), args.opts.out);
    await writeFile(outPath, buf);
    console.log(outPath);
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
