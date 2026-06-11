# pbms — out-of-scope observations

Captured moments where something was noticed but explicitly not fixed in
the current task (pre-existing, out-of-scope, not-my-bug, or deferred).
Each entry is a seed for a later focused pass. Append new entries at the
top.

Entry format:

```
## YYYY-MM-DD — short title
**Context:** what was happening when I noticed it.
**Observation:** what the pbm is; anchor with file:line when possible.
**Status:** open | fixed | wontfix
```

---

## 2026-06-11 — record-mode clip capture broken (empty webm / no program)
**Context:** le-mystere-abyssal phase 3 — running the standard
`bin/inspect-music.mjs` clip pass for the motion check.
**Observation:** `window.__vj.record()` (studio/runtime.mjs:2937,
canvas.captureStream + MediaRecorder vp9) returns a 110-byte empty webm,
crashing the ffmpeg convert at bin/inspect-music.mjs:318. Reproduction is
flaky: a fresh page with `?record=1` recorded 79KB/2s once, but
seek-then-record and repeat runs fail with `no program compiled in time`
(waitForProgram → currentProgram null) or empty bytes. anemone also fails
shader compile in record mode. Screenshots work fine throughout — only
captureStream/MediaRecorder and the GPU-init race are affected. Last
known-good clip recording: 2026-05-25 (anemone clip-peak.mp4, 5.7MB).
Suspects: Playwright/Chromium update since 05-25; headless GPU context
flakiness (memory: "GPU init race" caveat). Blocks /vjay-iterate's
clip-based probes — fix before the le-mystere-abyssal critic pass.
**Status:** open

## 2026-04-19 — smoke-shaders.mjs over-strict on console errors
**Context:** Running `node bin/smoke-shaders.mjs touch-probe` during mobile-support Task 7 verification.
**Observation:** `bin/smoke-shaders.mjs:67-71` treats ANY `console.error` (including incidental 404s on favicons, optional assets) as a shader-compile failure. Reproduces on `aperture` (no audio, simple shader) with a bare 404 message that the script doesn't surface the URL for. Should filter to GLSL / shader-specific console output, or explicitly list which fetch URLs count.
**Status:** open

## 2026-04-16 — lib/*.glsl extractions untracked in git
**Context:** Committing lodestone v2 (commit b4329e5). Shader
`#include`s `math.glsl` and `tonemap.glsl` per VISION.md's
"generic utilities live in `lib/`" policy. Those files exist on
Louis's working tree but are **not tracked in git** — `git status`
shows `?? lib/diffusion.glsl`, `lib/math.glsl`, `lib/noise.glsl`,
`lib/sdf.glsl`, `lib/tonemap.glsl`. Only `lib/billiards.glsl` is in
HEAD.
**Observation:** A fresh clone of `master` will fail to compile
lodestone (and any other piece that #includes these libs locally).
The extractions look like Louis's in-progress factoring work — he
probably wants to commit them in his own grouping alongside other
pieces that also depend on them. Not fixing unilaterally to avoid
overreach.
**Status:** open — Louis to commit `lib/*.glsl` extractions when
ready.

## 2026-04-16 — autoplayArmed TDZ in studio/runtime.mjs
**Context:** While rendering `pieces/breath` via `bin/inspect.mjs`, the
studio page showed a red "COMPILE ERROR" banner: `Cannot access
'autoplayArmed' before initialization`. Frames still captured because
`page.click('#stage')` unlocks audio through the click listener, but the
armed-gesture autoplay path threw.
**Observation:** `studio/runtime.mjs:775` calls `armFirstGestureAutoplay()`
from `attachAudio()`, which reads `autoplayArmed` declared at
`studio/runtime.mjs:786` with `let`. If `attachAudio` runs during module
initialization before line 786 is evaluated, the reference is in the
temporal dead zone. Fix: hoist the `let autoplayArmed = false` above
`attachAudio`, or move the declaration to the top of the file alongside
the other module-level `let`s (around lines 91-98).
**Status:** fixed — `let autoplayArmed = false;` now lives at
`studio/runtime.mjs:184`, well before the line 493 top-level await. The
remaining post-await module declarations (`idleTimer` line 2048, the
`helpXxxEl` consts line 2081-2085) are only read inside post-boot event
handlers, so they're not in TDZ during initialisation.
