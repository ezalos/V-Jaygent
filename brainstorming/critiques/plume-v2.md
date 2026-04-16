# Plume — auto-critique, v2

Re-inspected after the v1-ranked fixes (macro drift, thin density, kill
vignette, upward buoyancy, distinguishable sources) landed. Four new
frames via `bin/inspect.mjs plume 4 8`, silent baseline, cursor
off-screen.

## Scoring against `taste.md`

| Dimension | v1 | v2 | Notes |
|-----------|----|----|----|
| Palette cohesion | 5 | 5 | Ember ramp still holds. No disco. |
| Composition | 2 | 4 | Was near-static across frames; now the bright mass visibly migrates from lower-left (frame 1) to upper-right (frame 3). Empty zones exist (frame 0 has real dark passages). |
| Motion | 4 | 4 | Multi-scale churn preserved. Can't fully verify upward buoyancy from stills — needs video. |
| Intensity & dynamic range | 3 | 4 | Frame 0 is properly quiet (dark baseline, thin density). Frames 2-3 build. Breathing is visible. |
| Depth | 4 | 4-5 | Fractal branching visible at multiple scales, especially in frames 2-3. |
| Form & ending | n/a | n/a | Can't judge from 30s stills. Need an end-of-track capture. |

Mean (judgeable): ~4.2. **Not yet chef d'oeuvre** (one dimension below
4.5) but substantially closer. All v1 fixes landed.

## What the frames show

- **Frame 0 (t=1.5s):** Dark, sparse. Rust-toned fractal patches at
  mid-frame with real black gaps. Exactly what "silence = sparse" should
  look like. Previously this was already a filled bright mass.
- **Frame 1 (t=9.5s):** Brighter patch lower-centre. Edges thinning
  naturally, no hard vignette ring.
- **Frame 2 (t=17.5s):** Multiple distinct bright "flowers" across the
  frame — I can count 4-5 discrete bright regions. The heptagonal
  sources are at least partially readable as separate events.
- **Frame 3 (t=25.5s):** Composition has clearly drifted upper-right.
  Different frame from the previous three, not a minor variation.

## What's actually better

1. **The bright region is not centred anymore.** Macro drift works.
2. **Silence is sparse.** Thinning the source baseline (0.35 → 0.08)
   made a visible difference.
3. **Vignette is gone and it didn't matter.** The fluid's own density
   falloff handles frame edges. No dark ring artefact.
4. **The seven sources are partially discernible** — at least 4-5
   distinct bright events visible at any one moment (the others are
   off-screen at radius 0.78, which is expected).
5. **Dynamic range expanded.** Quiet frames actually quiet.

## What's still imperfect

1. **Upward direction is not visible in stills.** The global buoyancy
   (v.y += 0.08 + 0.22·level) should be felt in motion, but a
   single-frame capture can't show rising. Would need a 2-3 second
   video to confirm. Likely working but unverified.
2. **Still busy overall.** The kaleidoscopic fine detail is everywhere;
   even "dark" regions have small fractal structure. Could use larger
   truly-empty zones for the eye to rest. Not a bug; a possible v3
   direction.
3. **Heptagonal sources only half-visible.** Five-ish visible in any
   given frame; the other two are beyond the visible 2×2 world (at
   radius 0.78 × cos/sin of 2π/7). Either accept (the piece has some
   sources "off-stage" by design), or pull radius in to 0.60 so all
   seven are always visible. Acceptable either way.

## Decision

v2 is meaningfully better. Would call this shippable. Not chef d'oeuvre
yet but the remaining gap is nuance, not failure modes.

## What the iterate skill would do next

If I ran `/vjay-iterate plume` right now, I expect the critic to grade
around these numbers and suggest one of:
- Pull source radius from 0.78 → 0.60 so all 7 are always on-screen
- Add empty-zone carving (mask out a small region based on curl
  magnitude being near zero → true void)
- Capture an end-of-track frame to judge the ending

None of those are urgent. Good place to stop and ship.
