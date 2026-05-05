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

## Mesmerizing — the first question

Before any rubric, the only question that matters: **does this piece
hold the eye without exhausting it?** A V-Jaygent piece should
capture *soft fascination* — involuntary attention that sustains for
minutes without fatigue. It sits between *bored* (not enough arousal,
eye leaves) and *overstimulated* (too much, eye flinches away). The
mesmerizing zone is where the eye keeps almost-predicting the next
frame but never fully gets there.

This isn't a vibe. It decomposes into five probes the critic runs
explicitly from the 4 still frames. Each probe returns **pass**,
**fail**, or **weak** (a middle state where the probe doesn't fully
fail but doesn't confidently pass either). Only `pass` counts toward
the 5/5 threshold — `weak` is worth calling out in the critique but
doesn't count as success.

### Probe 1 — Eye-landing

Where does the eye land in frame 0? Is it the same place in frame 3?

- Single locked spot across all frames → the gaze is trapped, piece
  is compositionally dead. **Fail.**
- No landing place at all (uniform soup, no focal candidates) → the
  eye has nowhere, gives up. **Fail.**
- 2–4 candidate regions that shift between frames so the gaze can
  wander and return. **Pass.**

### Probe 2 — Prediction

From frames 0–3, could you confidently predict frame 4?

- Confidently yes → the loop is legible, the spell breaks on the
  next cycle. **Fail.**
- Nothing is predictable → no foothold, no rhythm, the eye gives up.
  **Fail.**
- Macro composition predictable, micro texture not → the "almost,
  not quite" zone — the viewer's prediction system keeps engaging
  and keeps being partially right. **Pass.**

### Probe 3 — Squint

Mentally low-pass (blur) each frame. Does a macro light/dark
composition emerge?

- Uniform grey → flat field of equal-weight detail, no composition.
  The AI-art failure: algorithm has no idea where the eye should
  look, so it moves everywhere. **Fail.**
- Crisp composition with no sub-structure surviving up close →
  reads as a graphic, not a kinetic piece. **Weak.**
- Macro structure emerges on the squint AND fine texture rewards
  stepping close (Ikeda-style dual-resolution). **Pass.**

### Probe 4 — Hue drift

How does the dominant hue behave across the four frames?

- Jumps (frame 0 amber, frame 1 cyan, frame 2 magenta) → flicker.
  Pupils fatigue, CNS flinches, the viewer looks away. **Fail.**
- Locked (identical hue across every frame) → palette isn't
  breathing at all. **Weak.**
- Slow drift within a warm family (amber → wine → mauve across 30s)
  → colour breathes. **Pass.**

### Probe 5 — Mystery

What does the piece *refuse to tell you*?

- Everything is fully disclosed on first look. Depth fully resolved,
  structure fully named, no ambiguity anywhere → no reason to keep
  looking after 3 seconds. **Fail.**
- Total obscurity with no hook → nothing to hold onto. **Fail.**
- An edge that won't resolve, a figure that might also be ground,
  a depth that flips between interpretations, a structure that
  promises more if you kept looking → Kaplan's "mystery" — the
  single strongest predictor of sustained preference. **Pass.**

### Decision

Count the passes. 5/5: the piece mesmerizes. 4/5: close, and the
failing probe is the top fix. 3/5 or below: the piece doesn't
mesmerize and no dimension-polishing fix will save it — that's a
`structural-rethink` verdict, not a `needs-tweak`.

The still frame must already mesmerize. Motion is a bonus on top —
never a substitute for a captivating still. If frame 0 is boring,
no amount of animation redeems it.

## Before scoring: the claim check

Every piece states a thesis in `meta.yaml` (summary, description, or
the top-of-file comments). Pull it. Restate it in one sentence:
"This piece claims [X]."

Then look at the frames and ask: **do they deliver the claim?**

This is binary. Pass or fail. Not 1-5.

If the piece claims seven sources and four read on screen, claim
check fails. If the piece claims a reaction-diffusion coupling and
the frames show a smooth gradient with no pattern formation, claim
check fails. If the piece claims an arc over 60 seconds and the
four spread frames all look like the same moment, claim check fails.

A failed claim check is the top fix, regardless of how the 1-5 scores
come out. Fix the lie first. Polish second.

The claim check is a pre-scoring gate, not a seventh dimension. The
six dimensions below still get scored either way.

## VJ lenses

Four lenses the critic applies *on top* of the 6 dimensions. Not new
scores — postures for how to look when grading.

**Structure honesty.** If the piece claims a structure (7-fold
symmetry, Julia set, reaction-diffusion, gravitational lensing), that
structure must *read* in the frames. Hidden structure is a lie. A
heptagonal source ring at radius 0.78 that only shows 4-5 points on
screen is dishonest to its own claim. Call it out. Touches mostly
Composition and Depth.

**Interaction agency.** When a piece is cursor- or music-reactive,
does the input *compose* the image or just decorate it? An FFT bar
responding to bass is decoration. Bass reshaping the heptagonal
radius, or cursor dragging the Julia `c` parameter, is composition.
Decorative reactivity scores low on Motion. Compositional reactivity
scores high.

*Cursor probes (from `brainstorming/techniques/interactivity.md`,
adapted from Golan Levin's Painterly Interfaces thesis). Run on
pieces that declare cursor reactivity. A piece must pass 5/7 to
claim "cursor as instrument"; 3/7 or fewer and the interaction is
decorative.*

1. **Composition probe.** Sample the piece with the cursor at three
   distinct positions. Does the *macro composition* differ between
   frames, or only the local region near the cursor? Fail if only
   local.
2. **Idle probe.** With `u_mouse == (0,0)` for 30 s, does the piece
   still pass Mesmerizing probes 1 (eye-landing) and 2 (prediction)?
   Fail if the piece visibly dies without a cursor.
3. **Readability probe.** Could a cold viewer grasp the mapping
   within 3 seconds and two cursor moves, with no UI? Fail if the
   mapping requires instructions.
4. **Reversibility probe.** Cursor at a, then b, then back to a.
   Does the frame return? Stateful patterns (trails, dwell) can
   legitimately fail — but the critique must call out which ones.
5. **Dominance probe.** Is the cursor's contribution to rendered
   energy ≤ ~30% of the piece's total structural energy? Fail if
   the cursor drowns the field (the "swirl eating the quasicrystal"
   failure mode).
6. **Convention probe.** Does the mapping fight standard priors?
   Mouse-Y → zoom, drag-to-rotate-Z, radial-drag to trigger, any
   inversion of scroll/pan/drag conventions. Fail if the viewer's
   first instinct produces the wrong behaviour.
7. **Latency probe.** Render a feature directly under the cursor.
   Move fast. Does the feature lag by more than ~3 frames (≈60 ms
   at 60 fps)? Fail if yes — input smoothing is eating responsiveness.

See `brainstorming/techniques/interactivity.md` for artist
references, pattern taxonomy (field modulation, parameter pilot,
camera control, velocity-driven, dwell, hybrid), and the "mouse-Y
as zoom" case study.

*Music probes (from `brainstorming/techniques/music-to-shader.md`).
Run on pieces that declare audio reactivity — shader references
`u_audio_*`, `meta.time_source: audio`, or meta.yaml describes
music behaviour. A piece must pass 3/4 to claim that music composes
it; 2/4 or fewer and the audio is decoration.*

1. **Motion-over-luminance probe.** Read the shader. Do `u_audio_*`
   uniforms feed into *geometric* parameters (things that decide
   WHERE pixels are — coordinates, angles, radii, velocities,
   scales, warp amounts, positions), or only into *brightness*
   parameters (things that decide HOW BRIGHT a pixel is — glow
   multipliers, additive flashes, wall-light gains, envelope
   amplitudes, alpha)? The test is "if I render the piece with this
   term replaced by a constant, do *shapes* change or only
   *brightness*?"

   Concrete FAIL shapes (all brightness):
     - `coreEnv = 0.30 + 1.20 * bass;`   ← envelope of a glow
     - `wallLight *= 1.0 + 1.20 * bass;` ← gain on lighting
     - `pulseAmp = 0.10 + 1.70 * bass;`  ← amplitude of a ring
     - `sigma = 1.1 + 5.2 * mid;`        ← opacity/density (count
       as geometric only if σ drives a motion scale, not just fade)

   Concrete PASS shapes (geometry):
     - `pulseSpeed = 0.70 + 0.55 * bass;` ← ring *propagation rate*
     - `rimR = 1.05 - (0.55 + 0.22*bass) * relief;` ← wall *position*
     - `zoom *= 1.0 - 0.05 * bass;`       ← camera *displacement*
     - `theta += 0.03 * bass * sin(...);` ← angular *perturbation*
     - `warpAmt = 0.08 + 0.28 * level;`   ← deformation *amount*

   Fail if every `u_audio_*` usage is a brightness-family expression.
   Shader-verdict form (`shader-pass` / `shader-fail` /
   `shader-unclear`) with line citations.

2. **Bass→movement probe.** Specifically: does `u_audio_bass` appear
   in at least one PASS-shape expression from probe 1's taxonomy?
   Mids and level may push structure (warp, haze scale) — that's
   fine for probe 1 — but *bass specifically* must move something,
   because in most electronic music bass IS the beat and the viewer
   hears "kick" while seeing nothing shift in geometry if bass is
   only wired to glow envelopes.

   The canonical FAIL shape: every `bass` term is inside a
   brightness multiplier (`1 + k*bass`, `a + b*bass` where the
   output is an intensity/envelope/amplitude). The ring exists,
   the glow exists, the rim kick exists — with or without bass —
   and bass only changes their brightness. The motion is
   *independent of bass*; bass modulates only how brightly that
   independent motion reads.

   PASS shapes: bass appears in an expression that determines a
   coordinate, angle, radius, velocity, scale, warp, or camera
   transform — something whose removal would visibly reposition
   pixels, not dim them.

   Shader-verdict form.
3. **Rhythm-in-stills probe.** Do the captured frames show the piece
   *mid-phase* — a ring in flight, a chamber geometrically
   compressed on a hit, flow with clear direction — as opposed to
   "the same scene at different brightness levels"? The music should
   leave geometric evidence in frozen time. Frame-driven;
   pass/fail/weak.
4. **Quiet-reads-quiet probe.** At low `u_audio_level`, does the
   piece de-energize *structurally* — slower flow, tighter scale,
   calmer geometry, less warp — or just drop in luminance? Silence
   must be silence in form, not dimness. Shader-verdict form when
   no quiet frame was captured; frame-verdict when one was.

See `brainstorming/techniques/music-to-shader.md` for the
"In Seven" learnings (band→parameter mapping, section state
machines, beat-snap vs beat-follow, multiplicative vs additive
flashes), the beat-grid uniform rules (clocks vs amplitudes), the
flash-budget philosophy, and per-stem binding etiquette.

*Song-level composition probes (from
`brainstorming/techniques/music-composition.md`). Run on pieces
that have an `audio.analysis.json` and reference any of the song-
level uniforms (`u_section_*`, `u_downbeat`, `u_to_section_change`,
`u_song_progress`, `u_audio_*_stem`, `u_key_*`). These probes
ride on top of the per-frame probes above — the per-frame
probes ask if the piece reacts well; these ask if it composes
well. A piece must pass 4/6 to claim "song-aware composition";
2/6 or fewer means the piece is reactive only.*

1. **Section-readability probe (frame-verdict).** Render 5+ frames
   at `u_song_progress` ∈ {0.05, 0.25, 0.45, 0.65, 0.85} — one per
   section centre. Without seeing the timeline, can a viewer guess
   which section each frame is from? *Pass if 3/5 are unambiguously
   distinct. Fail if all five look interchangeable.*
2. **Downbeat-anchored probe (shader-verdict).** List the
   structural events in the shader (palette flip, layer reveal,
   mode toggle). Are they keyed to `u_downbeat` / `u_bar_index` /
   `u_section_id` (composition) or to `u_audio_bass` /
   `u_audio_kick` (reaction)? *Pass if ≥2 structural events use
   composition uniforms. Fail if every "big change" is amplitude-
   triggered.*
3. **Pre-tension probe (shader + frame).** Shader: does the piece
   reference `u_to_section_change` or `u_section_progress`? Frame:
   render at 30s and 8s before a known drop — visibly different
   (squeeze, desaturation, withholding)? *Pass if both. Fail if
   `u_to_section_change` is unused.*
4. **Per-stem-discrimination probe (shader-verdict).** Read the
   audio bindings. Are at least two distinct `u_audio_*_stem`
   uniforms used, and bound to *visually different roles* (not both
   modulating brightness)? *Pass if yes. Fail if all four bound, or
   if all bound to the same parameter family.*
5. **Long-arc probe (frame-verdict).** Render 12 frames at evenly
   spaced `u_song_progress`. Is there a visible peak/trough
   structure? *Pass if the density/contrast curve has a clear
   maximum and a clear quiet moment. Fail if flat.*
6. **Recapitulation probe (frame-verdict).** Compare frame at
   `u_song_progress = 0.05` (intro) with `u_song_progress = 0.95`
   (outro). Recognisably related, with one visible delta? *Pass if
   related-with-delta. Fail if completely unrelated, or identical.*

*Dual-input probes (from
`brainstorming/techniques/audio-cursor-together.md`). Run on pieces
that declare BOTH cursor reactivity (shader references `u_mouse`)
AND audio reactivity (shader references `u_audio_*`). These probes
ask whether the two instruments are properly coordinated. A piece
must pass 5/7 to claim "two hands on the instrument".*

1. **Dual-channel readability probe (frame + interaction).** Within
   5s of moving the cursor while music plays, can a viewer perceive
   that BOTH channels are driving the piece? *Pass if yes. Fail if
   one channel dominates and the other reads as decoration.*
2. **Channel-non-overlap probe (shader-verdict).** List parameters
   driven by `u_audio_*` and parameters driven by `u_mouse`. Are
   they DISJOINT (Pattern B), or floor-and-ceiling multiplicative
   (Pattern A), or *additive* (arms race)? *Pass if disjoint or
   floor-ceiling. Fail if additive on the same parameter.*
3. **Music-without-cursor probe (shader + 30s capture).** Hold
   `u_mouse == (0,0)` for 30s with track playing. Does the piece
   still pass all music-side probes (per-frame + song-level)?
   *Pass if yes. Fail if cursor was load-bearing for music
   reactivity.*
4. **Cursor-without-music probe (shader + 30s capture).** With
   audio silent, does the piece still pass the cursor-side probes?
   *Pass if yes. Fail if music was load-bearing for cursor
   reactivity.*
5. **Conflict-resolution probe (shader-verdict).** For each
   parameter touched by both channels, is the relationship floor-
   and-ceiling, disjoint with a mediator, or additive? *Additive
   fails.*
6. **Authority-during-build probe (frame + interaction).** During
   a build (`u_section_progress > 0.7` heading into
   `u_to_section_change`), cursor motion must still produce
   visible response within ~100ms. Reduced amplitude is fine, zero
   is not. *Pass if responsive. Fail if cursor input is masked
   during loud sections.*
7. **Idle-cell probe (4× 30s capture).** Run the piece in each of
   the four idle-matrix cells (both, music-only, cursor-only,
   neither). None should freeze, go black, or look broken; the
   neither-cell must self-play with synthesised drivers. *Pass if
   all four cells survive. Fail if any cell dies.*

See `brainstorming/techniques/audio-cursor-together.md` for the
artists, role-assignment defaults (music structures + cursor
modulates), conflict-resolution patterns (floor-ceiling vs disjoint),
the 5 coupling recipes (cursor-modulated section transitions, music-
gated cursor strength, cursor as 5th stem, cursor focus + music
ground, hybrid silence), the idle-behaviour matrix, and the 5
anti-patterns.

**Silence as form.** Quiet passages aren't failed loud passages.
Real dark, sparse activity, low luminance — these are part of the
piece, not absence. Grade the quiet on its own terms, not against
what the peak frames do. Touches Intensity & dynamic range.

**Desynchronised clocks.** Mesmerizing motion requires multiple
scales on independent clocks — macro drift, meso breathing, micro
shimmer, each on its own period. When everything shares one
`iTime` multiplier, the eye pre-computes the next frame and leaves.
Check the shader for whether `iTime` is scaled differently in
different terms, or whether one animation drives all channels.
Touches Motion and Depth.

**Layered coupling.** When a piece declares `layers:` in its
`meta.yaml`, layers must *interact*, not just stack. The failure
mode: three warm fbm fields blended together — same content as a
single shader, just three times the cost. Layered composition is
non-alignment in space, time, and reading-rate, plus enough coupling
that the next two seconds aren't predictable. Touches Composition,
Motion, and Depth.

*Layered-composition probes (from
`brainstorming/techniques/layered-composition.md`). Run on pieces
that declare a layer stack — `meta.yaml` has a `layers:` array. A
piece must pass 6/8 to claim "layered composition"; 4/8 or fewer
and the layer-stack architecture isn't doing work the piece couldn't
do in a single shader.*

1. **Spatial-coupling probe.** Read the layer manifest. Does at
   least one layer declare `u_below` or a `consume:` channel, AND
   use the consumed value in a coordinate / UV / position (geometric
   use), not just a colour multiplier (decorative)? Mental
   visualisation: zero out that layer's `u_below` term — would
   pixels beneath move to a different place? *Fail if no, pass if
   yes.* Shader-verdict.
2. **Polyrhythm-of-clocks probe.** Count distinct clock sources
   across the stack from `{u_time, u_beat_phase, u_bar_phase,
   u_section_progress, u_audio_bass, u_audio_mid, u_audio_high,
   u_audio_*_stem, u_downbeat, u_mouse}`. *Fail if all layers share
   one clock; weak if 2; pass if ≥ 3 distinct clocks across ≤ 4
   layers.* Shader-verdict.
3. **Eye-distribution probe.** From the captured frames, estimate
   the dominance map per pixel. *Fail if 1 region (one layer
   dominates) or 8+ small regions (chaotic); pass if 2-4 regions
   per frame, ideally migrating across captured frames.* Frame-
   verdict.
4. **Quiet-survives probe.** Mentally zero out the loudest single
   layer for ~10s. Do remaining layers still pass eye-landing and
   prediction? *Fail if removing the lead leaves a flat substrate
   (monolithic-with-a-flash); pass if the rest still composes.*
   Shader-verdict on the layer manifest.
5. **Order-meaningfulness probe.** Mentally swap declaration order
   of two non-adjacent layers. Would the composite change
   meaningfully? *Fail if near-identical (z-order chaos); pass if
   visibly broken.* Shader-verdict.
6. **Blend-saturation probe.** From a peak-energy frame, sample
   mean luminance and per-channel range. *Fail if mean L > 0.7 AND
   max-min channel range < 0.1 (cream soup); pass if luminance
   contrast ≥ 0.3 within frame.* Frame-verdict.
7. **Coupling-cost probe.** Count edges in the coupling DAG (each
   `u_below` read = 1; each `consume` = 1; each `u_history` self-
   loop = 0.5). *Pass if 1.0 ≤ edges/N ≤ 1.5 (sparsely meaningful);
   fail if 0 (independent stack) or ≥ 2N (over-coupled).* Manifest-
   verdict.
8. **Brightness-strobe probe.** Grep layer shaders for audio-on-
   brightness expressions (FAIL shapes from Music probe 1). *Fail
   if ≥ 2 of N layers have brightness-shaped audio bindings (per-
   layer blink); pass if ≤ 1 layer does.* Shader-verdict.

See `brainstorming/techniques/layered-composition.md` for the
artists, coupling recipes (refraction, advection, force-field,
mask-reveal, feedback, SDF intersection), blend-mode analysis on
warm palettes, polyrhythmic clocks, and the 9 anti-patterns.

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

Three requirements, all must be true:

1. **Mesmerizing**: 5/5 probes pass (eye-landing, prediction, squint,
   hue drift, mystery).
2. **Claim check**: pass. The piece delivers its stated thesis.
3. **All testable dimensions ≥ 4** on the 1-5 rubric below.

A score of 5 on one dimension doesn't compensate for 1 on another,
and no amount of dimension polish makes a non-mesmerizing piece a
chef d'oeuvre. Any single dimension at 2 or below is a stop-and-fix
signal — don't polish other parts until that one's at least a 3.

Partial exceptions: Form & ending can only be graded with
end-of-track material, which `bin/inspect.mjs` doesn't currently
capture. When scoring a piece, if this dimension is untestable, mark
it `n/a` and grade only the other five. The ≥ 4 threshold adjusts to
all testable dimensions.

## How to use this during iteration

The critic agent writes a full Markdown critique to
`brainstorming/critiques/<slug>-vN.md` with these required sections
in order:

- `## The claim` — one-sentence thesis restatement from meta.yaml
- `## Frame-by-frame` — 4-row table: Frame | t | What's there
- `## Mesmerizing probes` — table of five probe verdicts with
  justifications, each tied to the frame-by-frame observations
- `## Claim check` — pass/fail + one-paragraph justification
- `## Scores` — table: Dimension | Score | Note (one-line observation)
- `## What's working` — concrete wins. Required.
- `## What's imperfect` — ranked, each grounded in a specific frame
- `## Verdict` — one of the five values below

At the end of the markdown, a parseable YAML tail:

```yaml
piece: plume
iteration: 2
verdict: needs-tweak     # chef-doeuvre | ship-it | needs-tweak | structural-rethink | premise-wrong
claim_check: fail         # pass | fail
mesmerizing_passes: 4     # 0-5
mesmerizing_probes:
  eye_landing: pass
  prediction: pass
  squint: pass
  hue_drift: pass
  mystery: fail
music_passes: 2           # 0-4 or "n/a" if piece is not audio-reactive
music_probes:             # omit entirely if n/a
  motion_over_luminance: shader-fail
  bass_movement: shader-fail
  rhythm_in_stills: fail
  quiet_reads_quiet: pass
scores:
  palette_cohesion: 5
  composition: 4
  motion: 4
  intensity: 4
  depth: 5
  form_ending: n/a
top_fix:                   # required only when verdict == needs-tweak; null otherwise
  dimension: composition
  what: |
    Pull heptagonal source radius from 0.78 to 0.60 so all seven
    points are always on-screen. Fixes the failed claim check from
    v1 ("claims seven but half are off-stage").
  why: |
    Frames 0-3 show 4-5 visible sources, never all 7. The piece
    claims seven — right now it's lying.
  caution: |
    Don't over-compress the ring — at 0.60 the sources must still
    read as distinct seven, not merge into a star.
```

Verdict semantics:

- **chef-doeuvre** — mesmerizing (5/5 probes), claim delivered, all
  testable dimensions ≥ 4. Stop.
- **ship-it** — mesmerizing (≥ 4/5 probes), claim delivered, no
  dimension below 3. Shippable. Remaining gap is nuance, not
  failure modes. Stop. Don't polish further.
- **needs-tweak** — 4/5 probes pass, claim delivered or close, one
  concrete shader change will raise the missing dimension or probe.
  Loop auto-applies `top_fix`.
- **structural-rethink** — 3/5 or fewer probes, or scoring low in a
  way that needs a bigger change than one Edit. Hand to user. This
  is the right verdict when mesmerizing quality is absent — don't
  try to tweak a non-mesmerizing piece into mesmerization.
- **premise-wrong** — the claim itself is broken or unachievable
  with this structure. Hand to user. Don't tweak.

The iterate loop parses the YAML tail (last fenced yaml block in the
file) and branches on `verdict`. Loop caps at 8 iterations.

## Anti-patterns for the critic

Things the critic should *not* suggest:

- Changes that contradict `VISION.md` (cold palettes, rainbow
  gradients, generic visualiser shapes, infinite loops).
- Changes that make a 5-rated dimension drop below 5 to gain a point
  elsewhere.
- Changes that would break a currently-passing mesmerizing probe to
  gain a point on a rubric dimension. The probes outrank the rubric.
- Stylistic swaps ("try a different palette") when neither the
  grade nor a probe failure called for one.
- Multiple changes at once. One top fix per iteration. Ranked
  second/third fixes can be held for later iterations.
- Inventing a `top_fix` to fill the slot when the piece fails 3+
  probes. That's a `structural-rethink` verdict, not a tweak target.

## Meta

This rubric is itself a living document. When a piece teaches me a
new dimension worth scoring (e.g., "coupling of music and visuals"
for audio-reactive work), add it here. When a dimension turns out to
be redundant with another, merge them. The critic cares about what's
written here; keep it true.
