# Plume — auto-critique, v1

First actual round of me looking at my own work. Read four screenshots
taken ~8 seconds apart (silent baseline, cursor off-screen) via
`bin/inspect.mjs`. Verdict: the fine detail is doing what I want; the
macro composition isn't.

## What I see

Four frames, each showing:
- A warm cream-to-amber bright mass dominating the centre of the frame.
- Fractal dendrites branching outward from the centre into rust-toned
  edges.
- A dark-burgundy/black perimeter that's obviously vignette-driven.

The **internal** texture is good — the kaleidoscopic fine-scale eddies
produce tree-like branching at multiple scales, and the palette sweeps
through the ember ramp cleanly. That part I'd keep.

But **compositionally** the four frames are nearly interchangeable.
Bright centre, dark edges, fractal tendrils. The eye lands in the same
place every frame. "Churn" is happening at the pixel scale and
invisible at the frame scale.

## What's broken

1. **Static macro composition.** The bright mass never moves off
   centre. Without audio or cursor, there's no mechanism to wander.
   Need a slow translation of the whole field so the "interesting part"
   drifts across the frame. Period should be ~20-40 seconds — slower
   than the internal churn, faster than the 6-minute track.

2. **Too filled.** Almost the whole frame is bright-to-medium. No
   empty zones. A piece about fog should have *not-fog* — passages the
   eye can rest in. Currently the vignette does the work of "edge =
   dark," which reads like a post-filter, not like the fluid actually
   thinning.

3. **Heptagonal sources are invisible.** I designed seven distinct
   density sources pulsing with bass, heptagonally placed. I can't
   find any of the seven in the baseline frame. They're either blurred
   together by the pathline integration or drowned by the background
   fbm density. The "seven sources" claim in the piece notes is
   currently a lie — it's one big mass.

4. **No sense of direction.** Smoke rises. These frames show a
   roughly radially-symmetric bright mass — no preferred axis. The
   cursor-heat adds upward buoyancy, but only locally and only when
   the cursor is in play. Missing: a gentle global upward bias so the
   fluid has a felt gravity even when quiet.

5. **Vignette is a crutch.** The edge darkening is from
   `1 - smoothstep(0.85, 1.35, r) * 0.45`, not from actual fluid
   behaviour. If I remove the vignette, the image should still have
   edge-dark / centre-bright composition *intrinsically*. Right now
   it doesn't — it's just a bright field cropped by a mask.

## What works

- **Palette.** Ember ramp holds. No disco, no saturation blowouts after
  the tone-map. This is the strongest part.
- **Fine-scale structure.** Kaleidoscopic branching at two or three
  scales is visible per frame. Detail holds up to close inspection.
- **No blinking.** The slow-bucketed glints don't read as strobing
  even in silent baseline — good.

## Changes I'd make for v2

In priority order:

1. **Add a slow macro translation.** Before the polar/sample step,
   offset `p` by `macroDrift(t)` with amplitude ~0.3 and period ~30s.
   The composition wanders.

2. **Thin the density.** Current `sourceDensity` contributes aggressively
   even when bass = 0 (`0.35 + 1.9 * bass` → min 0.35). Drop the baseline
   to ~0.08 so silent = sparse, and keep the kick amplitude so loud =
   bright. Makes the piece breathe with dynamics instead of staying full.

3. **Kill or shrink the vignette.** Remove the 0.45 smoothstep; let
   the fluid density alone determine frame edges. Could leave a very
   soft `dot(p, p) * 0.08` tint only.

4. **Upward buoyancy everywhere, not just the cursor.** Add
   `v.y += 0.08 + 0.25 * level` to the velocity at every step.
   Gives the whole scene a rising tendency — smoke feels like smoke.

5. **Make the seven sources distinguishable.** Either place them
   further apart (0.8 radius instead of 0.55), shrink their halo
   (smaller Gaussian), or paint them at a later pathline step (so
   they're not blurred by the full 6-step integration). Maybe render
   them as a separate pass added on top of the backward-integrated
   density.

Sequence-of-moves is deliberate: (1) and (2) would make the biggest
compositional difference visible; (3)-(5) are refinements.

## On the practice itself

This is the first time I've actually *seen* a piece I wrote. Reading
pixels is different from imagining them — most of my reasoning about
plume was right about texture/palette and wrong about composition,
exactly where imagination fails. The screenshots tell me the piece
is bright, centred, and static-shaped; the shader code doesn't tell
me that without running.

Worth building into the cultivation loop: after any piece ships, take
screenshots, read them, write a critique before moving on.
