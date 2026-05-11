# aurora — critique v1

## The claim

This piece claims warm aurora ribbons curling across a dusk sky — dense
flowing volume of ribbons that wave, bend, and merge. Cursor injects a
localized swirl that disrupts the ribbons. Self-plays without input.

## Frame-by-frame

(Bias-guard applied: rounded DOWN, anchored to apollonian-foam + braid
chef-d'oeuvre frames. Each observation tied to actual pixels seen.)

| Frame | t      | What's there                                                  |
|-------|--------|---------------------------------------------------------------|
| 0     | 1.5s   | Two small dye-clusters: one upper-right (pink-tinted), one    |
|       |        | lower-mid (orange marbled). Vast dusk-purple void between.    |
|       |        | Best frame for "ribbons on a sky".                            |
| 1     | 5.7s   | Marbled gold-tan dye covers ~60% of frame top. Looks like     |
|       |        | smeared mineral oil, not aurora ribbons. Lower third clear.   |
| 2     | 9.9s   | ~70% of frame filled with tan-amber ribbons; few clear gaps.  |
|       |        | No dominant landing zone — eye wanders.                       |
| 3     | 14.1s  | Composition splits along bottom-left vs upper-right; both     |
|       |        | regions read at similar warmth/density. Marbled, not ribboned.|
| 4     | 18.3s  | Whole frame fills with brown-tan dye-fog. Reads as "rust-     |
|       |        | colored marble". No empty sky.                                |

## Mesmerizing probes

Compared to apollonian-foam frame 2 (deep recursive fractal balls with
warm cores on real black) and braid frame 2 (4 distinct lensing balls
with central kaleidoscope fold) as the bar.

| Probe        | Verdict | Why                                                       |
|--------------|---------|-----------------------------------------------------------|
| Eye-landing  | weak    | Frame 0 has 2 clusters, but frames 1-4 read as uniform    |
|              |         | marbled fog. No dominant landing zone. Bias guard: would  |
|              |         | lose side-by-side against braid's 4-balls — call it weak. |
| Prediction   | pass    | Curl-noise advection is genuinely chaotic; frame 4 not    |
|              |         | predictable from 0-3. The one honest probe.               |
| Squint       | fail    | Blurred, the piece reads as a uniform mid-warmth field.   |
|              |         | Macro composition collapses to "tan rectangle".           |
| Hue drift    | weak    | Narrow gold→ember band by design. Doesn't visibly breathe |
|              |         | within the 18s. Constrained on purpose — but constrained  |
|              |         | reads as locked, not as a breathing palette.              |
| Mystery      | fail    | The piece shows you what it is in frame 0. No hidden      |
|              |         | structure, no fractal close-up reward, no sub-resolution  |
|              |         | tell. Compare to ferment's filigree zones.                |

**Mesmerizing passes: 1/5.** Per the rubric: 3/5 or fewer → verdict must
be `structural-rethink` or `premise-wrong`, not `needs-tweak`.

## Interaction probes

Not run in detail — inspect-music captures with `u_mouse == (0,0)` so the
cursor swirl can't be evaluated from these frames. The shader implements
`cursorSwirl()` correctly (perpendicular gaussian-falloff rotational
velocity, dispatched only when `!mouseIdle(u_mouse)`); architecture
supports a live demo. Idle composition is what gets graded headless and
that's where the piece fails.

## Claim check

**fail.** The brief asked for ribbons that wave, bend, and merge. What
shipped is a Stam-advected dye field that visually reads as marbled fog
or rust-colored mineral oil, not as ribbon curtains. The algorithm is
honest fluid advection (architecture C was the right pick), but the
visual realization doesn't deliver "ribbons".

Two specific gaps:
1. No filament directionality — density is sampled isotropically, so
   contours read as blobs, not as flowing curves. Real aurora ribbons
   are vertical curtains; the curl-noise velocity field is too tangled
   to produce coherent vertical streaks.
2. Density saturates the frame by t=9s. Decay 0.985 + source 0.014+0.010
   is mistuned — once dye accumulates, advection just moves it around
   rather than creating birth/death cycles of distinct ribbons.

## Scores

(Anchored against the chef-d'oeuvre bar; bias-guard ROUND DOWN.)

| Dimension                | Score | Note                                                    |
|--------------------------|-------|---------------------------------------------------------|
| Palette cohesion         | 3/5   | Warm-only achieved (lint passed at 0% cool), but range  |
|                          |       | is narrow gold→ember; no real near-black anchor.        |
| Composition              | 3/5   | Composition lint passes via aggregate, but per-frame    |
|                          |       | the eye-landing zones don't survive — marbled fog.      |
| Motion                   | 3/5   | Curl advection real, but only u_time as clock source.   |
|                          |       | No polyrhythm. Idle motion passes lint (0.108) but is   |
|                          |       | uniform drift, not punctuated by events.                |
| Intensity & dynamic range| 2/5   | Mean luminance 0.166 from lint; ribbons sit at similar  |
|                          |       | brightness everywhere. No true blacks (real aurora has  |
|                          |       | sky around the curtains). Compare braid frame 0's near- |
|                          |       | black background.                                       |
| Depth                    | 2/5   | One density field. Multi-scale on paper (fbm 2 octaves) |
|                          |       | but the visible output is single-scale puddles, not     |
|                          |       | recursive structure. Compare apollonian's recursion.    |
| Form & ending            | n/a   | 30s loop, can't grade from stills.                      |

## What's working

1. **Architecture gate caught it right.** This IS a state-bearing field
   piece. The cursor-disruption-must-persist requirement maps cleanly to
   architecture C, and the audit confirms `declared C matches
   implementation` (passes: simulate→display). Wrong-arch failures would
   not be salvageable; this one is.
2. **Stam advection is honest.** The curl-noise streamfunction, backward
   trace, wrap-edges, source-and-decay loop are textbook. No PDE length-
   scale shortcut was needed (Stam is not pattern-forming).
3. **Warm palette stays warm.** 0% cool pixels in lint. Mauve carefully
   excluded from the hue range.
4. **Idle survives.** lint-idle PASS (luminance 0.166, motion 0.108).
   No-input self-play works.
5. **Composition lint passes.** Top/bottom split 47/53 — quadrant share
   distributed.
6. **Cursor handler architecturally sound.** `cursorSwirl()` is the
   right primitive (gaussian-falloff rotational velocity), gated on
   `!mouseIdle()`.

## What's imperfect

1. **Reads as marbled fog, not as ribbons.** This is the #1 fix. By
   t=9s the dye covers most of the frame uniformly. Needs filament
   directionality — sample density biased along the velocity tangent
   (anisotropic shading) OR use a much higher-frequency streamfunction
   so filaments are narrow not puddly OR add a vertical bias to give
   curtain-like draping. Suggested approach: in the display shader,
   compute the velocity at each pixel (re-evaluate `curlVelocity`)
   and modulate ribbon brightness by `1.0 + 0.5 * dot(velocity_unit,
   gradient_unit)` so contours pointing along the flow are emphasised.
2. **Density saturates by mid-clip.** Source 0.014 + roam 0.010 with
   decay 0.985 sums to a steady-state ~0.55 in injection regions. Want
   steady-state ~0.20 so ribbons read against substrate, not as covering
   layer. Reduce source amplitudes to ~0.007/0.005 OR strengthen decay
   to 0.975.
3. **Eye-landing absent.** No 2-4 distinct landing candidates as the
   brief gates promised — they exist in frame 0 but dissolve into
   marble by frame 2. Tied to #1 (saturation).
4. **Single-clock motion.** audit-piece warned on this. With no audio,
   only `u_time` drives motion. No polyrhythm. For a no-audio piece
   this is intrinsic to the brief — not a fix candidate.
5. **Palette doesn't breathe.** Hue oscillates only ±0.18 around 0.20
   (gold→ember). Frames look temporally similar. Widening to ±0.30 (still
   staying out of mauve) would give visible drift.

## Verdict

**structural-rethink.**

1/5 mesmerizing probes. Per the rubric, this is mandatory: cannot
ship `needs-tweak` when 4+ probes failed. The piece needs more than
one Edit to recover — the ribbon-vs-fog gap is a display-pass rewrite
(velocity-anisotropic shading), and the saturation is a sim-pass tune,
together they're a coordinated change set.

Importantly: the **architecture choice was correct** — architecture A
would have made the cursor-disrupt-persists requirement unfulfillable;
architecture B would force ribbons into discrete sprites; architecture
D would blur into haze; architecture E would lack clean persistence.
C is right; the visual realization is what fell short.

Hand back to user. Not shipping at 1/5 mesmerizing.

```yaml
piece: aurora
iteration: 1
verdict: structural-rethink
claim_check: fail
mesmerizing_passes: 1/5
mesmerizing_probes:
  eye_landing: weak
  prediction: pass
  squint: fail
  hue_drift: weak
  mystery: fail
interaction_passes: n/a   # not testable headless; shader logic sound
music_passes: n/a
song_level_passes: n/a
dual_input_passes: n/a
layered_passes: n/a
scores:
  palette_cohesion: 3
  composition: 3
  motion: 3
  intensity: 2
  depth: 2
  form_ending: n/a
top_fix: null
```
