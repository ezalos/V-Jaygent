// ABOUTME: Shared Playwright Chromium launcher for V-Jaygent render tooling.
// ABOUTME: One blessed config — new headless + ANGLE gl-egl on the real GPU.
//
// History (2026-06-11 regression hunt): the old headless shell cannot reach
// the host GPU, so '--use-angle=swiftshader' (adopted 2026-06-03 to dodge a
// GPU-init race) software-rendered everything. Monolithic pieces survived at
// ~30fps, but FBO pipelines (layers:/passes:) crawled at 3-7fps — MediaRecorder
// clips captured ~1 frame and came back as 110-byte empty webms. New headless
// (channel: 'chromium') + '--use-gl=angle --use-angle=gl-egl' runs on the
// RTX 4090 at 60fps (measured: 63fps, 1.4MB per 2s clip). The bare
// '--enable-gpu' default backend still hits the init race — the explicit
// angle backend is what makes it reliable.

import { chromium } from 'playwright';

export const RENDER_ARGS = [
  '--autoplay-policy=no-user-gesture-required',
  '--enable-gpu',
  '--use-gl=angle',
  '--use-angle=gl-egl',
  '--ignore-gpu-blocklist',
  '--no-sandbox',
];

export async function launchRenderBrowser() {
  return chromium.launch({
    channel: 'chromium',   // new headless — old headless shell has no GPU path
    headless: true,
    args: RENDER_ARGS,
  });
}
