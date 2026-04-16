# taste.md — what makes a V-Jaygent piece good

A scoring rubric. `VISION.md` is the manifesto (prose, "what I'm for");
this is the rubric (scorable, per-dimension 1-5). The critic agent
invoked by `/vjay-iterate` reads this to grade pieces.

## How to score

Six dimensions, each 1-5. Whole integers, no half-points.

Scoring inputs:
- 4-6 PNG frames captured at spread time offsets (`bin/inspect.mjs`)
- The piece's `shader.frag` and `meta.yaml`
- `VISION.md` for aesthetic context
- This document for the rubric itself

Each dimension describes only its 1, 3, and 5 anchor points; scores of
2 and 4 are "between" values. If a score is ambiguous, round down —
it's easier to over-polish a real weakness than recover from ignoring one.

## Dimensions

### 1. Palette cohesion
**1** — Disco. Complementary hue jumps (pink next to green, cyan next
  to gold). Rainbow. Multiple warring temperatures in the same frame.
**3** — Mostly coherent but one or two passages drift. A section pushes
  into complementary territory under peaks.
**5** — Single warm family throughout. Contrast by **luminance only**.
  Near-black shadows, warm-cream highlights, nothing cold mid-range.
  Looks like light through a single piece of glass.

### 2. Composition
**1** — Static. Same macro shape every frame. Eye lands in the same
  spot. Vignette or frame edge doing the work the content should.
**3** — Some drift or rotation, but the fundamental shape repeats
  within 10 seconds. Empty zones present but only at the edges.
**5** — Composition wanders at a human-readable pace (periods
  ~15-60s). Empty zones are intrinsic, not from masks. The eye has
  somewhere to land in each frame, and it moves between frames.

### 3. Motion
**1** — One-scale pulse locked to audio. No small-scale internal
  churn. Flat between beats.
**3** — Motion at two distinct scales but they're synchronised — when
  one pauses, all do.
**5** — Always mixing at multiple scales (minimum: macro flow + fine
  churn, desynchronised). Never all frozen simultaneously. Direction
  is felt (rising, flowing, orbiting) even when the music is quiet.

### 4. Intensity & dynamic range
**1** — Always loud or always quiet. No breath. Peaks bleach to white
  or silence registers as dead.
**3** — Responds to peaks but without an honest floor. Or has quiet
  moments but no build.
**5** — Goes genuinely quiet in quiet sections (low luminance, low
  activity, real dark) and peaks compress asymptotically rather than
  clipping. Dynamic range extends both ways. Silence is part of the
  piece, not the absence of it.

### 5. Depth
**1** — Flat. No structural detail on zoom. One resolution of noise.
**3** — Two scales of visible detail, but the fine scale doesn't
  rewrite the coarse. Looks like "base + texture" rather than a
  continuous hierarchy.
**5** — Structure at every scale the rendered pixel size supports.
  Fractal. Reads different up close than from afar. You could zoom in
  indefinitely (in theory) and never hit a flat region.

### 6. Form & ending
**1** — Loop. No arc. No awareness of its own length. Piece ends
  because the track does, not because it was composed.
**3** — Has an arc (build, climax, tail) but the end is arbitrary —
  cut off rather than resolved.
**5** — Has an arc AND knows when to stop. Ending is earned — a
  collapse, a flash, a considered fade. The piece is **composed** for
  its duration, not running indefinitely.

## Chef d'oeuvre

**All six dimensions ≥ 4.** Any single dimension at 2 or below is a
stop-and-fix signal — don't polish other parts until that one's at
least a 3. One dimension at 5 doesn't compensate for another at 1.

Partial exceptions: Form & ending can only be graded with end-of-track
material, which `bin/inspect.mjs` doesn't currently capture. When
scoring a piece, if this dimension is untestable, mark it `n/a` and
grade only the other five. Chef d'oeuvre threshold adjusts to ≥ 4 on
all testable dimensions.

## How to use this during iteration

The critic agent output should be a block like:

```yaml
piece: plume
version: v2
scores:
  palette_cohesion: 5
  composition: 4
  motion: 4
  intensity: 4
  depth: 5
  form_ending: n/a
chef_doeuvre: false
top_fix: >
  Pull heptagonal source radius from 0.78 to 0.60 so all seven
  points are always on-screen. This raises composition to 5 by
  eliminating the off-stage sources issue called out in v1.
rationale: >
  Frames 0-3 show 4-5 visible sources, never all 7. The piece
  claims seven but half are behind the frame.
```

The iterate skill reads this, applies `top_fix` via Edit, re-renders,
re-inspects, re-scores. Loop caps at 4 iterations or when
`chef_doeuvre: true`.

## Anti-patterns for the critic

Things the critic should *not* suggest:

- Changes that contradict `VISION.md` (cold palettes, rainbow gradients,
  generic visualiser shapes, infinite loops).
- Changes that make a 5-rated dimension drop below 5 to gain a point
  elsewhere.
- Stylistic swaps ("try a different palette") when the grade didn't
  call for a palette change.
- Multiple changes at once. One top fix per iteration. Ranked second/
  third fixes can be held for later iterations.

## Meta

This rubric is itself a living document. When a piece teaches me a
new dimension worth scoring (e.g., "coupling of music and visuals"
for audio-reactive work), add it here. When a dimension turns out to
be redundant with another, merge them. The critic cares about what's
written here; keep it true.
