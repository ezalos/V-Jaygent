# topic-quality-system-upgrade

How to upgrade the V-Jaygent production pipeline so every new piece
lands in the top quintile (≥ ship-it, ideally chef-d'oeuvre-adjacent)
on first attempt, rather than relying on /vjay-iterate to claw mid
pieces back up.

Built 2026-05-11 from the round-2 catalogue regrade (which produced
3 chef-d'oeuvre, 10 ship-it, 5 needs-tweak, 14 structural / premise
broken).

## The data

### Top 8 share six structural properties

apollonian-foam, braid, cirrus, eclipse, ferment, throb, cymatic, brick.

1. **A named canonical algorithm.** Apollonian SDF, gravitational
   lensing, coprime tooth-wheels, Julia set, Gray-Scott RD,
   percussion-driven geometry, Chladni nodal patterns, brick + crack.
   Nothing is invented; everything is a math primitive in the
   V-Jaygent dialect.
2. **Multi-scale by construction.** Recursive folds, fractal sampling,
   polyrhythmic clocks, or RD interfaces. Removing one scale of detail
   breaks the piece — there's no "base + texture" split.
3. **2-4 eye-landing candidates per frame.** Four braid balls, the
   five cirrus rings, two eclipse bodies, kick+cross+spark in throb,
   ghost-face cracks in brick. No piece is "one big subject in the
   middle".
4. **Single warm cycle palette.** Every chef-d'oeuvre and ship-it
   piece uses a cosine palette through {amber, ember, wine, mauve,
   cream}. No exceptions. No cool intrusions.
5. **Survives idle.** Renders meaningfully at `u_mouse == (0,0)` and
   `u_audio_* == 0`. The piece doesn't need inputs to be alive;
   inputs *enrich* it.
6. **Claim is concrete and stills-verifiable.** "5 coprime tooth-
   wheels", "Gray-Scott RD spots growing into mazes", "kick fires a
   ring, snare fires a cross". Not "a song about water".

### Bottom 14 fail on a small number of recurring failure modes

| Failure mode                           | Pieces affected | Count |
|---------------------------------------|-----------------|-------|
| Palette violation (cool / disco)      | ocean-jb, plasma, well, in-seven, atoll, first-bloom, break-on-through, so-hollow | **8** |
| Claim fails (frames ≠ thesis)         | ferrofluid, ferrohands, breath, so-hollow, atoll, kindling, father-ocean, plume, in-seven, ocean-jb | **10** |
| Eye locks centre (composition fail)   | ferrohands, so-hollow, breath, first-bloom, kindling, in-seven, father-ocean, strata | **8** |
| Depth flat (one resolution)           | trine, ferrofluid, father-ocean, first-bloom, breath, kindling, so-hollow | **7** |
| Density / saturation bleach           | breath, so-hollow                                                                   | 2 |
| PDE length scale missing              | ferrofluid, ferrohands                                                              | 2 |
| Needs user input (untestable idle)    | atoll, ferrohands, plasma-keys, stronger-live                                       | 4 |

Eight of fourteen fail palette. Ten of fourteen fail claim. Six fail
**both**. These are the system's biggest leaks.

## Root causes

1. **The brief stage doesn't enforce success patterns.** The
   /vjay-new-piece skill brainstorms freely; nothing requires the
   brief to name a canonical algorithm, pre-declare a warm cycle, or
   guarantee self-play.
2. **The scaffold starts from a blank shader.** Warm palette isn't
   pre-wired, multi-scale FBM isn't pre-imported, length-scale
   modulation for PDE pieces isn't a default.
3. **The critic is a post-mortem.** Problems caught after the build
   are expensive to fix. Build-time gates would be cheaper.
4. **The taste rubric ships pieces with palette = 3.** "ship-it" lets
   any dim ≥ 3 through, which is how prism, lodestone, and stronger
   ship despite palette tension.
5. **Pieces that require user inputs to be alive still ship.** Atoll,
   ferrohands, stronger all need keys/cursor — but headless grading
   can't exercise that, and most viewers won't either.

## Interventions, ranked by leverage × effort

### First wave — sub-day work, very high leverage

**A. Brief gates.** Add to /vjay-new-piece: reject briefs that don't
declare (a) a canonical algorithm, (b) ≥ 2 eye-landing candidates,
(c) warm cycle stops, (d) idle / no-input behaviour. Catches ~80% of
bottom-tier failures before line 1 of GLSL.

**B. Palette lint.** `bin/lint-palette.mjs`: sample 30 frames, compute
hue histogram, fail if > 5% of pixels in cool zone (hue 150°-330°
outside the warm cycle). Run during sanity render, block ship if
fail. Would have stopped ocean-jb, plasma, break-on-through,
first-bloom, atoll automatically.

**C. Tighten the ship-it threshold.** Edit `taste.md`: require
`palette_cohesion ≥ 4` not just `no dim < 3`. The current rubric
ships pieces that drift on palette.

**D. Canonical-piece catalog.** Snapshot the 8 top-tier pieces as
named patterns in `brainstorming/techniques/canonical-pieces.md`. New
briefs reference one ("a Gray-Scott piece for X", "a coprime-wheels
piece for Y") and inherit the success structure.

### Second wave — week of work, high leverage

**E. Scaffold defaults.** Every new piece scaffolds with
`lib/palette/warm-cycle.glsl` linked, an `idleDrift(t)` ambient term
baked in, ≥ 2-octave FBM included. Deleting any of these requires a
comment justifying why.

**F. Auto-iterate on first-pass failure.** /vjay-new-piece auto-loops
/vjay-iterate up to 3 times if verdict ≠ ship-it+. Currently it stops
at the first critique.

**G. PDE / density guards.** For pieces using ping-pong feedback,
scaffold includes a length-scale modulation term (hex / grid) and
cubic damping. Comment explains Rosensweig + ember-decay rules.

**H. Self-play probe at scaffold.** Render the scaffold at
`u_mouse == (0,0)` and `u_audio_* == 0` before declaring it done. If
the frame is empty / dead, fail the scaffold step.

### Third wave — multi-week, structural

**I. Brief-stage storyboard.** Render an ASCII / simple-GLSL sketch
of 5 section-anchored frames *before* writing the full shader. Grade
the storyboard against mesmerizing probes. Catch "boring intro" /
"eye-locked centre" pre-build.

**J. Per-piece testability declaration.** Every piece declares its
inspect modality in `meta.yaml`: `pure-self-play | audio-only |
cursor-required | keyboard-required`. Cursor/keyboard pieces require
a test-driver script (`inspect-with-inputs.mjs`).

**K. Anti-pattern lint.** Extend `bin/audit-piece.mjs` with the
specific anti-patterns from this round: brightness-only audio
coupling, single-FBM-octave, single-clock-everything, no-warm-cycle-
helper-used, mesa-prone PDE without length scale.

## Expected impact

If first-wave is implemented:

- Palette failures should drop near-zero (lint catches them).
- Claim failures should drop substantially (brief gates require
  concrete + stills-verifiable thesis).
- Bottom-tier rate (currently 14/32 ≈ 44%) should fall to ~15%.
- Median composite should rise from ~17 to ~22+.
- Top-tier rate (currently 3/32 ≈ 9%) probably stays roughly the
  same — chef-d'oeuvre depends on the canonical-algorithm + multi-
  scale architectural choices that lint can't enforce, only
  encourage.

## Caveats discovered during the regrade

- Pieces without `audio.analysis.json` get audio-time spread (not
  section-anchored) and likely under-score. plume and in-seven both
  dropped hard partly because of this. Running
  `bin/analyze-audio.mjs` should be mandatory for any piece with
  audio.mp3.
- The round-2 critique is more critical than round 1; some demotions
  may reflect critic calibration rather than piece quality. Worth a
  spot-check on plume and in-seven specifically after analysis is
  regenerated.

## Recommended first move

Implement the **first wave (A-D)** in one batch. Each item is
1-3 hours of work:

1. Write `brainstorming/techniques/canonical-pieces.md` (D)
2. Add brief gates to `/vjay-new-piece` skill (A)
3. Build `bin/lint-palette.mjs` (B)
4. Edit `taste.md` to raise the ship-it bar (C)

After that, measure: dispatch a /vjay-new-piece run on a fresh brief
and see whether the median composite shifts.
