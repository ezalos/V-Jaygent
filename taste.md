# taste.md — what makes a V-Jaygent piece good (v2: binary)

A grading constitution. `VISION.md` is the manifesto (prose, "what I'm
for"); this is the rubric (gradeable, criterion by criterion). The
critic agent invoked by `/vjay-iterate` reads this to grade pieces.

**v2 doctrine (2026-06-12).** Every criterion is ONE simple,
unambiguous, binary question. The only grades are **pass**, **fail**,
and **n/a**:

- `weak` / `weak-pass` are abolished. Not clearly pass = **fail**.
  The v1 round-down rule, taken to its conclusion: it is easier to
  over-polish a real weakness than to recover from ignoring one.
- `shader-pass` / `shader-fail` / `shader-unclear` are abolished. A
  criterion is answered from *captures and metrics* — things you can
  see or compute — never from reading code alone. Shader reads are
  corroboration, not verdicts.
- `frame-unclear` / `interaction-unclear` are abolished. If you can't
  tell from the evidence, the answer is **fail**.
- If a criterion is *untestable* because the capture or metric it
  needs doesn't exist, that is a harness gap, not a free pass: grade
  it **fail** AND record it under `harness_gaps` in the YAML tail with
  the missing capture named. The fix for a harness-gap fail is
  building the capture, not editing the shader.
- `n/a` is reserved for *genuinely inapplicable* criteria or families:
  a piece with no audio doesn't grade the music family; a piece whose
  thesis is ink that accumulates doesn't grade cursor reversibility; a
  piece with no receding plane doesn't grade perspective consistency.
  "I didn't capture it" is never n/a — that's a harness gap.

## How to grade

Evidence inputs, in order of authority:

1. **The machine metrics panel** — `python3 bin/aesthetic-metrics.py
   piece <slug>` (stills + clips). For every criterion tagged
   *measured* below, **the metrics panel value is authoritative unless
   the critic documents why the metric misfired** (e.g. a sanctioned
   palette exception, a near-black intro frame, a known weak proxy).
   The misfire note goes in the critique next to the overridden grade.
   Per-still tests apply to the *core stills* — all section stills
   except the first and last (intro/outro frames are often
   legitimately near-black and fail contrast tests vacuously).
2. **Section stills** — 4–6 PNGs at section anchors
   (`bin/inspect-music.mjs`, output `inspect-music/music-*.png`).
3. **Multi-window clips** — 4–5 short MP4s at distributed sample
   points (`bin/inspect-music.mjs` default for audio pieces, output
   `inspect-music/clip-w*-t*.mp4`, plus `clip-peak.mp4`). The two
   prediction criteria REQUIRE these; stills alone cannot grade them.
4. **Interaction captures** — `bin/inspect-interaction.mjs` output:
   cursor triptych `cursor-{a,b,c}.png`, reversibility pair
   `cursor-aba-{0,1}.png`, with/without pair
   `cursor-{active,idle}.png`, latency burst `latency-*.png`,
   idle-matrix clips `matrix-{both,music,cursor,neither}.mp4`,
   per-layer solos `solo-<layer>.png`. Until a given capture exists
   for a piece, every criterion that needs it fails with a
   `harness_gaps` entry naming it.
5. **The piece's `shader.frag` / `meta.yaml`** — for the claim check
   and as corroboration of what the captures show. Never the sole
   basis of a grade.
6. **`VISION.md`** and this document.

Snapshot the graded evidence to
`brainstorming/critiques/evidence/<slug>-vN/` — the negative corpus
for calibration accumulates from exactly these snapshots (see
§Calibration discipline).

## Mesmerizing — the first question (9 criteria)

Before anything else, the only question that matters: **does this
piece hold the eye without exhausting it?** A V-Jaygent piece should
capture *soft fascination* — involuntary attention that sustains for
minutes without fatigue. It sits between *bored* (not enough arousal,
eye leaves) and *overstimulated* (too much, eye flinches away). The
mesmerizing zone is where the eye keeps almost-predicting the next
frame but never fully gets there.

This isn't a vibe. It decomposes into nine binary criteria.

### `eye_lands`

**In frame 0 — and in every core still — does the eye find at least
one place to land?** Evidence: section stills.

Fail looks like uniform soup: no focal candidate anywhere, equal-weight
detail edge to edge, the eye gives up. If you have to hunt for
something to describe in the frame-by-frame table, this failed.

### `landing_regions_2_4`

**Are there 2–4 candidate landing regions per still — not 1, not 8+?**
Evidence: section stills (saliency-model support is not yet
implemented — research marker #3 — so this is graded by judgment:
count the regions you'd describe to someone on the phone).

One single locked spot = the gaze is trapped, the piece is
compositionally dead. Eight-plus small competing regions = confetti,
the gaze has no anchor. Both fail.

### `regions_shift`

**Do the landing regions move between stills, so the gaze can wander
and return?** Evidence: section stills; measured support:
`layout_varies` (the metric catches frozen macro layouts; region
movement on top of a varying layout is the critic's call).

"Frames 0–3 all have the bright mass in lower-centre" is the canonical
fail sentence. Write that sentence honestly if it's true.

### Prediction — the two-timescale hard gate

The next two criteria encode the house's load-bearing doctrine:
mesmerization is *Lyapunov-style chaos* — locally smooth, globally
divergent. Two opposite failure modes (too noisy, too predictable)
flank a narrow sweet spot. See VISION.md §"On unpredictability".

**Pick the timescales for THIS piece and declare them at the top of
the critique.** The scales are ranges, not constants:

- **Continuity scale: 100 ms to 2 s.** Short (≈100–300 ms) for
  fast/kinetic pieces (techno, hard drops, rapid line work); long
  (≈1–2 s) for ambient/slow/meditative pieces. The scale defines "the
  slice within which motion must be smooth and trackable".
- **Divergence scale: 5 s to 30 s.** Short (≈5–10 s) for short pieces
  (<90 s) or rapidly-reconfiguring pieces; long (≈20–30 s) for
  long-form immersive or slow ambient. The scale defines "the gap
  between sample windows that must look categorically different".

Declare both: e.g. "continuity 0.3 s, divergence 15 s (track has 165 s
arc, 136 BPM — fast continuity, medium divergence)". Two critics
grading with mismatched scales reach mismatched verdicts; declaring
them makes the grade reproducible.

**HARD GATE: `prediction_continuity` AND `prediction_divergence` must
both pass, or the verdict is `structural-rethink`** — no matter what
else passes. Unpredictability is a precondition, not a tradeoff
dimension. Neither criterion can be graded from stills; if the
multi-window clips are missing, both fail as harness gaps.

| `prediction_continuity` | `prediction_divergence` | Failure mode                 |
|-------------------------|-------------------------|------------------------------|
| pass                    | pass                    | Lyapunov sweet spot          |
| pass                    | fail                    | Too predictable / repetitive |
| fail                    | pass                    | Too noisy / discrete-glitchy |
| fail                    | fail                    | Worst of both                |

### `prediction_continuity`

**Within any continuity-scale slice of each multi-window clip, can the
eye track motion smoothly — no stutters, teleports, pixel-level noise,
chromatic-channel tearing, or per-beat micro-events that force the
prediction system to re-anchor?** Evidence: every
`inspect-music/clip-w*-t*.mp4`; measured: `trackability` +
`jerk_smooth` (clip panel `trackability_all`, `jerk_smooth_all` —
optical-flow warping error, pursuit-speed ceiling, flow jerk).

Fail looks like TV static, square-pixel artefacts, chromatic
separation, sudden displacement jumps — the eye reads "rendering bug",
not "chaos". This was the dopamine-v3 overshoot: stochastic tears +
chromatic separation + fine-scale curl noise created
continuity-breaking pixel artefacts.

### `prediction_divergence`

**Comparing slices from clips at least one divergence-scale apart in
audio time, do they show categorically different flow configurations
and event vocabularies — not the same rule re-shaded, re-seeded, or
at different brightness?** Evidence: the multi-window clips compared
pairwise; measured: `window_divergence` (pairwise NCD on
luminance-normalized frame stacks + flow-histogram distance — the
luminance normalization exists precisely so "different brightness"
can't fake divergence).

Two fail shapes:

- *Same vocabulary, different pixels.* Different cells lighting up,
  same generative rule. A viewer who watched any window can imagine
  the next. The dopamine-v2 failure.
- *Same dynamic system, different seed.* Same flow field, same warp,
  same RD stripe pattern — the eye knows what to expect.

**The fixes for the two prediction failures are opposite, so the
critique must say which one failed:**

- `prediction_continuity` failed (too noisy): drop discrete events —
  remove stochastic tears, chromatic separations, per-beat
  micro-pulses, fine-scale curl-noise components. Increase u_history
  smear (decay ≥ 0.90). Slow the time-evolution of any flow field.
  The chaos must come from cumulative smooth flow, not high-frequency
  events.
- `prediction_divergence` failed (too predictable): add a continuous
  chaos transformation layer — smooth curl-noise warp of `u_below`
  with slow time-evolution that re-anchors the flow field over ~30 s.
  Heavy u_history feedback that accumulates persistent structure.
  Cursor-driven perturbation as a second divergence source. OR convert
  to a state-bearing architecture (`passes:`) with bifurcations.

Pattern-grid pieces (oscillator lattices, particle grids, FFT bars,
fixed tessellations) and closed-form single-pass shaders are at
systematic risk on divergence. Pieces with stochastic per-event chaos
or chromatic-channel manipulation are at systematic risk on
continuity. The sweet spot is hypnotic flow that quietly takes you
somewhere you didn't expect.

### `squint_macro_structure`

**Mentally low-pass (blur) each core still: does a macro light/dark
composition emerge — not uniform grey?** Evidence: section stills;
measured: `squint_macro` (32×32 downsample, connected light region
0.5–50% of frame; threshold still being swept — 7/14 positives at
calibration — so a documented override is more legitimate here than
on the hard-gate metrics).

Uniform grey is the AI-art failure: the algorithm has no idea where
the eye should look, so it looks everywhere. Fail.

### `fine_texture_reward`

**Does stepping close reward the eye — is there sub-structure at
native resolution that the blurred view didn't show?** Evidence: a
native-resolution crop of each still (research marker #2;
Ikeda-style dual-resolution).

A crisp macro composition with nothing underneath reads as a graphic,
not a kinetic piece. In v1 that was "weak"; in v2 it fails.

### `hue_drift`

**Across the ordered stills, does the dominant hue drift slowly —
neither jumping between frames nor locked identical across all of
them?** Evidence: section stills; measured: `hue_drift_smooth` catches
the jumps (no adjacent-still jump > 40°) — the locked-frozen half of
the question is the critic's judgment on top.

Jumps (frame 0 amber, frame 1 cyan, frame 2 magenta) = flicker; pupils
fatigue, the viewer looks away. Locked (identical hue everywhere) =
the palette isn't breathing. Both fail. Pass looks like amber → wine →
mauve across 30 s.

### `mystery_withheld`

**Can you name, concretely, something the piece refuses to tell you —
an edge that won't resolve, a figure that might also be ground, a
depth that flips between interpretations?** Evidence: section stills +
clips. If you can't name the withheld thing in one sentence, this
fails.

Everything fully disclosed on first look = no reason to keep looking
after 3 seconds. Fail. Total obscurity with no hook = nothing to hold
onto. Also fail. (Kaplan's "mystery" is the most-cited preference
predictor but the meta-analytic evidence is heterogeneous — which is
exactly why this is phrased as "name the withheld structure", not
"rate the mystery".)

### Counting

Nine criteria. The verdict bars (§Verdicts) use: ship-it needs ≥ 8/9
with both prediction criteria passing; below 7/9 is automatically
`structural-rethink` — no dimension-polishing fix will save a piece
that doesn't mesmerize.

The still frame must already mesmerize. Motion is a bonus on top —
never a substitute for a captivating still. If frame 0 is boring, no
amount of animation redeems it. Equally: motion that's predictable
fatigues the eye as fast as no motion at all. The 20-second-window
test is the single most important check before shipping.

## Before grading: the claim check

Every piece states a thesis in `meta.yaml` (summary, description, or
the top-of-file comments). Pull it. Restate it in one sentence: "This
piece claims [X]."

Then look at the evidence and ask: **does it deliver the claim?**

This is binary. Pass or fail.

If the piece claims seven sources and four read on screen, claim check
fails. If the piece claims a reaction-diffusion coupling and the
frames show a smooth gradient with no pattern formation, claim check
fails. If the piece claims an arc over 60 seconds and the four spread
frames all look like the same moment, claim check fails.

A failed claim check is the top fix, regardless of how everything else
grades. Fix the lie first. Polish second. The claim check is a
pre-grading gate, not a tenth mesmerizing criterion — the families and
panels below still get graded either way.

## VJ lenses

Postures for how to look while grading — not extra scores.

**Structure honesty.** If the piece claims a structure (7-fold
symmetry, Julia set, reaction-diffusion, gravitational lensing), that
structure must *read* in the captures. Hidden structure is a lie. A
heptagonal source ring at radius 0.78 that only shows 4–5 points on
screen is dishonest to its own claim — call it out. For a piece
claiming a basin of attraction / chaotic field (see
`brainstorming/techniques/basins-of-attraction.md`): the honest
signature is *smooth interior lakes shredding into fine fractal
filigree at the boundaries*. A uniformly smooth gradient, or uniform
noise, fails the claim.

**Interaction agency.** When a piece is cursor- or music-reactive,
does the input *compose* the image or just decorate it? An FFT bar
responding to bass is decoration. Bass reshaping the heptagonal
radius, or the cursor dragging the Julia `c` parameter, is
composition.

**Silence as form.** Quiet passages aren't failed loud passages. Real
dark, sparse activity, low luminance — these are part of the piece,
not absence. Grade the quiet on its own terms, not against what the
peak frames do.

**Desynchronised clocks.** Mesmerizing motion requires multiple scales
on independent clocks — macro drift, meso breathing, micro shimmer,
each on its own period. When everything shares one `iTime` multiplier,
the eye pre-computes the next frame and leaves.

**Layered coupling.** When a piece declares `layers:`, layers must
*interact*, not just stack. The failure mode: three warm fbm fields
blended together — same content as a single shader, three times the
cost. Layered composition is non-alignment in space, time, and
reading-rate, plus enough coupling that the next two seconds aren't
predictable.

## Interaction criteria (7)

Run on pieces that declare cursor reactivity (shader references
`u_mouse` / `u_touches`). Adapted from Golan Levin's Painterly
Interfaces thesis via `brainstorming/techniques/interactivity.md`.
Family n/a when the piece has no cursor input at all.

1. **`composition`** — *Across the cursor triptych
   `cursor-{a,b,c}.png`, does the macro composition differ between the
   three cursor positions — beyond a local halo around the cursor?*
   Evidence: `bin/inspect-interaction.mjs` cursor triptych. Fail if
   only the region under the cursor changes.
2. **`idle`** — *With the cursor parked for 30 s, is the piece still
   alive — the eye still lands somewhere and motion still evolves?*
   Evidence: `matrix-neither.mp4` or `matrix-music.mp4` (a real idle
   clip — beware that `bin/inspect.mjs` parks `u_mouse` near canvas
   centre, not at (0,0); centred bullseyes in idle captures are
   usually cursor effects). Fail if the piece visibly dies without a
   cursor.
3. **`readability`** — *From the cursor captures alone, can you state
   the cursor→effect mapping in one sentence?* Evidence: cursor
   triptych + `matrix-cursor.mp4`. Can't tell = fail. A mapping that
   would require instructions for a cold viewer = fail.
4. **`reversibility`** — *Do `cursor-aba-0.png` and `cursor-aba-1.png`
   match (the piece returns after cursor a→b→a)?* Evidence:
   reversibility pair; SSIM > 0.9 is the intended bar when computed.
   **n/a** when the piece's stated thesis is accumulation (trails,
   ink, painting) — and the critique must say so explicitly.
5. **`dominance`** — *Comparing `cursor-active.png` against
   `cursor-idle.png`, is the piece still recognizably itself without
   the cursor — the cursor contributing at most roughly a third of the
   visible structure?* Evidence: with/without pair. Fail if the cursor
   drowns the field (the "swirl eating the quasicrystal" failure).
6. **`convention`** — *Does the first instinctive gesture produce the
   expected direction of effect — no inverted scroll/pan/zoom/drag
   priors?* Evidence: `matrix-cursor.mp4` / cursor triptych, judged as
   a cold viewer. Fail if the viewer's first instinct produces the
   wrong behaviour (e.g. mouse-Y zooming the wrong way).
7. **`latency`** — *In the latency burst `latency-*.png`, does the
   feature under the cursor track within ~3 frames (≈60 ms at 60 fps)
   of a fast move?* Evidence: latency burst. Fail if input smoothing
   is eating responsiveness.

See `brainstorming/techniques/interactivity.md` for artist references,
the pattern taxonomy (field modulation, parameter pilot, camera
control, velocity-driven, dwell, hybrid), and the "mouse-Y as zoom"
case study.

## Music criteria (4)

Run on pieces that declare audio reactivity — shader references
`u_audio_*`, `meta.time_source: audio`, or meta.yaml describes music
behaviour. Family n/a otherwise. These ask whether the piece *reacts*
well; the song-level family asks whether it *composes*.

1. **`motion_over_luminance`** — *Comparing the quiet-window capture
   against the peak-window capture, do shapes sit in different places
   — edges, ridges, and silhouettes move — rather than the same scene
   at different brightness?* Evidence: quiet vs peak stills and clips
   from `inspect-music/`. (Research marker #25: geometry delta must
   exceed the pure-luminance delta; the computed form is Stage-2
   work — until then this is the critic's eye on paired captures.)

   The shader is corroboration: audio terms feeding *geometric*
   parameters (coordinates, angles, radii, velocities, scales, warp
   amounts) corroborate a pass; audio terms feeding only *brightness*
   parameters (glow multipliers, additive flashes, envelope
   amplitudes, alpha) corroborate a fail. Concrete shapes:

   FAIL (brightness):
     - `coreEnv = 0.30 + 1.20 * bass;`   ← envelope of a glow
     - `wallLight *= 1.0 + 1.20 * bass;` ← gain on lighting
     - `pulseAmp = 0.10 + 1.70 * bass;`  ← amplitude of a ring
   PASS (geometry):
     - `pulseSpeed = 0.70 + 0.55 * bass;` ← ring *propagation rate*
     - `rimR = 1.05 - (0.55 + 0.22*bass) * relief;` ← wall *position*
     - `zoom *= 1.0 - 0.05 * bass;`       ← camera *displacement*
     - `theta += 0.03 * bass * sin(...);` ← angular *perturbation*

2. **`bass_movement`** — *When the kick hits in `clip-peak.mp4`, does
   something visibly MOVE within ~100 ms — a position, radius, angle,
   or scale changes — rather than only brighten?* Evidence: peak clip
   watched with audio. In most electronic music bass IS the beat; the
   viewer hears "kick" and must see geometry shift, not a glow
   envelope swell. The canonical fail: every `bass` term lives inside
   a brightness multiplier — the ring exists with or without bass,
   and bass only changes how brightly the independent motion reads.

3. **`rhythm_in_stills`** — *Do the captured stills show the piece
   mid-phase — a ring in flight, a chamber geometrically compressed on
   a hit, flow with clear direction — as opposed to the same scene at
   different brightness levels?* Evidence: section stills. The music
   should leave geometric evidence in frozen time.

4. **`quiet_reads_quiet`** — *In the quiet-window clip, is the form
   itself calmer — slower flow, tighter scale, calmer geometry, less
   warp — not merely dimmer?* Evidence: quiet-window clip vs peak
   clip; measured: `motion_dynamic_range` (lowest-window median flow
   ≤ 0.55 × highest). Silence must be silence in form, not dimness.

See `brainstorming/techniques/music-to-shader.md` for the "In Seven"
learnings (band→parameter mapping, section state machines, beat-snap
vs beat-follow, multiplicative vs additive flashes), the beat-grid
uniform rules, the flash-budget philosophy, and per-stem binding
etiquette.

## Song-level criteria (6)

Run on pieces that have an `audio.analysis.json` and reference any
song-level uniform (`u_section_*`, `u_downbeat`, `u_to_section_change`,
`u_song_progress`, `u_audio_*_stem`, `u_key_*`). Family n/a otherwise.
From `brainstorming/techniques/music-composition.md`.

1. **`section_readability`** — *Looking at the five section stills
   (`u_song_progress` ≈ 0.05/0.25/0.45/0.65/0.85) without the
   timeline, can you unambiguously assign at least 3 of 5 to their
   sections by visual character alone?* Evidence: section stills. Fail
   if all five look interchangeable.
2. **`downbeat_anchored`** — *In the clips, do at least 2 structural
   events (palette flip, layer reveal, mode toggle, expanding ring)
   land ON the bar grid — within ~100 ms of a downbeat or bar line —
   rather than merely whenever the track gets loud?* Evidence:
   multi-window clips watched against the analysis JSON's beat grid.
   Corroboration: events keyed to `u_downbeat` / `u_bar_index` /
   `u_section_id` corroborate a pass; every "big change" hanging off
   `u_audio_bass` corroborates a fail.
3. **`pre_tension`** — *Does the pre-peak capture look visibly
   different from mid-verse — squeezed, desaturated, withholding —
   before the drop lands?* Evidence: the pre-peak section still/clip
   vs the verse still. Corroboration: `u_to_section_change` /
   `u_section_progress` used in the shader. Unused pre-tension
   uniforms plus indistinguishable captures = fail.
4. **`per_stem_discrimination`** — *In a clip where you can hear two
   different stems doing different things (a drum hit and a bass
   swell, vocals entering over pads), do they produce visibly
   DIFFERENT responses — not both modulating the same parameter
   family?* Evidence: `clip-peak.mp4` and one verse clip, watched with
   audio. n/a when the piece has no stem analysis
   (`bin/analyze-audio.mjs --stems`). Corroboration: ≥2 distinct
   `u_audio_*_stem` uniforms bound to visually different roles.
5. **`long_arc`** — *Across stills ordered by `u_song_progress`, is
   there a visible peak/trough structure — a clear maximum AND a clear
   quiet moment?* Evidence: ordered section stills; measured support:
   `arc` (min/max mean-luminance ratio — a weak proxy, see
   §Calibration; the eye on ordered stills is the real test). Fail if
   flat.
6. **`recapitulation`** — *Comparing the intro still
   (`u_song_progress` ≈ 0.05) with the outro still (≈ 0.95): are they
   recognisably related, with one visible delta?* Evidence: intro +
   outro stills. Fail if completely unrelated; fail if identical.

## Dual-input criteria (7)

Run on pieces that declare BOTH cursor reactivity AND audio
reactivity. Family n/a otherwise. These ask whether the two
instruments are coordinated — "two hands on the instrument". From
`brainstorming/techniques/audio-cursor-together.md`. The idle-matrix
clips `matrix-{both,music,cursor,neither}.mp4` are this family's
backbone evidence.

1. **`dual_channel_readability`** — *Watching `matrix-both.mp4`, can
   you see within 5 s that BOTH channels are driving the piece?*
   Fail if one channel dominates and the other reads as decoration.
2. **`channel_non_overlap`** — *Comparing `matrix-music.mp4`,
   `matrix-cursor.mp4`, and `matrix-both.mp4`: can you name at least
   one feature that belongs to the music and one that belongs to the
   cursor — distinct jobs, not the same parameter pushed by both?*
   Corroboration: disjoint parameter sets (Pattern B) or
   floor-and-ceiling multiplicative coupling (Pattern A) in the
   shader; additive same-parameter coupling (the arms race)
   corroborates a fail.
3. **`music_without_cursor`** — *In `matrix-music.mp4` (cursor parked,
   track playing, 30 s), does the piece still pass its music-side
   criteria?* Fail if the cursor was load-bearing for music
   reactivity.
4. **`cursor_without_music`** — *In `matrix-cursor.mp4` (audio silent,
   cursor active, 30 s), does the piece still pass its cursor-side
   criteria?* Fail if music was load-bearing for cursor reactivity.
5. **`conflict_resolution`** — *Where both channels visibly touch the
   same feature, does the combination in `matrix-both.mp4` stay
   bounded — no blowout, no cancellation — when both push at once?*
   Floor-and-ceiling or mediated coupling passes; additive stacking
   that clips at the peak fails.
6. **`authority_during_build`** — *During a build (heading into a
   section change), does cursor motion still produce a visible
   response within ~100 ms?* Evidence: latency burst `latency-*.png`
   or `matrix-both.mp4` captured across a build. Reduced amplitude is
   fine; zero is not. Fail if cursor input is masked during loud
   sections.
7. **`idle_cell`** — *Do all four idle-matrix clips
   (`matrix-{both,music,cursor,neither}.mp4`) survive — none freezes,
   goes black, or looks broken, and the neither-cell self-plays with
   synthesised drivers?* Fail if any cell dies.

See `brainstorming/techniques/audio-cursor-together.md` for
role-assignment defaults (music structures + cursor modulates),
conflict-resolution patterns, the 5 coupling recipes, the
idle-behaviour matrix, and the 5 anti-patterns.

## Layered criteria (11)

Run on pieces that declare a layer stack — `meta.yaml` has a `layers:`
array. Family n/a otherwise. From
`brainstorming/techniques/layered-composition.md`, plus the three
probes added 2026-05-05 from the `stronger` build. Per-layer solos
`solo-<layer>.png` are this family's key new evidence.

1. **`spatial_coupling`** — *Does at least one layer visibly DISPLACE
   or refract what's beneath it — comparing `solo-<layer>.png` against
   the composite, do the pixels below move to a different place, not
   just change colour?* Evidence: per-layer solos + composite still.
   Corroboration: a `u_below` / `consume:` read used in a
   coordinate/UV expression, not a colour multiplier.
2. **`polyrhythm_of_clocks`** — *In a 10 s clip, can you find at least
   three motions with visibly different periods that do not pause
   together?* Evidence: any multi-window clip (+ solos to attribute
   motions to layers). Corroboration: ≥3 distinct clock sources across
   the stack from `{u_time, u_beat_phase, u_bar_phase,
   u_section_progress, u_audio_bass, u_audio_mid, u_audio_high,
   u_audio_*_stem, u_downbeat, u_mouse}`. All layers on one clock =
   fail; two clocks = fail (v1 called it weak; v2 rounds down).
3. **`eye_distribution`** — *Per core still, does the layer-dominance
   map give 2–4 regions — not one layer owning the whole frame, not
   8+ confetti fragments — ideally migrating across stills?* Evidence:
   section stills.
4. **`quiet_survives`** — *With the loudest layer removed, do the
   remaining layers still give the eye somewhere to land and something
   to track?* Evidence: the `solo-<layer>.png` set — look at what's
   left when the lead's solo is subtracted from the composite. Fail if
   removing the lead leaves a flat substrate
   (monolithic-with-a-flash).
5. **`order_meaningfulness`** — *In the composite, does at least one
   layer visibly occlude, mask, or filter another — so the stack has a
   front and a back?* Evidence: composite still vs solos. If the
   composite is indistinguishable from any reordering (pure additive
   soup), z-order is meaningless. Fail.
6. **`blend_saturation`** — *Is the peak-energy frame free of cream
   soup — NOT (mean luminance > 0.7 AND channel range < 0.1)?*
   Evidence: peak still; measured: `no_blowout`. This is the
   warm-on-warm collapse guard at the stack level.
7. **`coupling_cost`** — *Do the layers show BOTH at least one visible
   inter-layer response AND at least one motion that stays independent
   of the rest?* Evidence: clips + solos. Zero coupling (independent
   stack) fails; total coupling (everything moves together — the
   over-coupled DAG) also fails. Corroboration: coupling-DAG edges/N
   in the 1.0–1.5 band (each `u_below` read = 1, each `consume` = 1,
   each `u_history` self-loop = 0.5).
8. **`brightness_strobe`** — *In `clip-peak.mp4`, do at most one
   layer's contents blink in unison with loudness?* Evidence: peak
   clip + solos. Two or more layers strobing with the level = per-layer
   blink = fail. Corroboration: audio-on-brightness expressions (the
   FAIL shapes from `motion_over_luminance`) in ≥2 layer shaders.
9. **`layer_distinctness`** — *Is each `solo-<layer>.png` visually
   distinct from every other — can you name each layer's contribution
   to the composite?* Evidence: per-layer solos. Fail if removing any
   layer would leave a near-identical frame ("only one layer" —
   Louis's feedback on `stronger v3`). The Quayola strata principle
   made operational.
10. **`multi_input_coupling`** — *Across `matrix-music.mp4` and
    `matrix-cursor.mp4` (and key presses where declared), do at least
    TWO of {cursor, keyboard, audio} each produce visible change
    somewhere in the stack?* Evidence: idle-matrix clips. Pieces
    declaring `keyboard_synth: true` must additionally show per-key
    distinctness — different keys produce different effects, not the
    same effect triggered by any key.
11. **`visible_phase_lock`** — *In a music clip, does geometry visibly
    snap to the music's grid — a bar rotation completing one
    revolution per bar, a per-beat discrete event (rotation jump,
    tooth advance, scale pulse), an expanding ring on the downbeat, a
    section-transition flip?* Evidence: `clip-peak.mp4` + one verse
    clip with audio. Fail if the only audio coupling is amplitude
    swelling. Louis's "no phase detection" feedback caught pieces
    failing this even though they passed the per-frame music criteria.

See `brainstorming/techniques/layered-composition.md` for the artists,
coupling recipes (refraction, advection, force-field, mask-reveal,
feedback, SDF intersection), blend-mode analysis on warm palettes,
polyrhythmic clocks, and the 9 anti-patterns. See
`brainstorming/techniques/keyboard-synth.md` for the per-key contract.

## Integration criteria (5)

Added 2026-06-11 from the le-mystere-abyssal watchthrough: five
failure patterns a human watching live catches instantly and
stills-based grading historically missed. Each one shipped past the
critic at least once; none should again. These are explicitly
LIVE-MOTION criteria: at least one clip per flagged element, not
stills alone. Individual criteria are n/a when the piece genuinely has
no such element (no one-shots, no receding plane, no staged entries) —
say so explicitly.

1. **`orphan_event`** — *Does every visible one-shot (ring, flash,
   glyph) land within ±0.5 s of a cause the viewer can SEE or HEAR — a
   lyric, a beat, a visible collision — on the WORD or the HIT, not
   merely somewhere in the phrase or bar that contains it?* Evidence:
   a clip covering each one-shot, timestamps checked. An overlay that
   appears for its own reasons reads as a bug, not an event (the
   chorus-entry ring at 1:05 and the detached window-rim donut at 1:19
   both read as unexplained debris). Any orphan = fail.
2. **`pasted_overlay`** — *For each major element, can you name a
   neighbouring field that visibly displaces, lights, or occludes its
   boundary?* Evidence: one clip per major element. The water's waves
   must displace the hole's contour; the background must show through
   or bend inside a bubble. If the answer for any element is "none",
   it reads as a sticker. Fail.
3. **`perspective_consistency`** — *On every receding plane (sea,
   ground, ceiling), do expanding fronts, textures, and displacement
   shrink and slow toward the horizon?* Evidence: clip of the plane in
   motion. 1 cm of screen is not 1 cm of world; uniform screen-space
   motion on a perspective plane reads flat immediately. n/a if the
   piece has no receding plane.
4. **`boundary_artifacts`** — *Are element edges, tiling-cell
   boundaries, and frame edges free of hard clips — including when a
   glyph is stretched beyond its grid cell?* Evidence: clips + stills
   swept at edges and cell boundaries (the reversal's snow dashes
   clipped at cell boundaries at 2:38). Grids are invisible until a
   shape crosses one. Any hard clip = fail.
5. **`accretion_causality`** — *Does every side effect (mask, shadow,
   void) appear only at-or-after the element that owns it?* Evidence:
   clip spanning each staged entry (the hole's glitter-mask carved a
   void 13 seconds before the hole appeared). n/a if nothing is staged
   in over time.

## Dimension panels (6 panels, 28 criteria)

The v1 1–5 scores are replaced by binary criteria panels. Each panel
is the decomposition of one v1 dimension (research report Part 3).
Grade every criterion pass/fail/n/a; a panel with ≤ 1 fail is healthy
(see §Verdicts). For *measured* criteria the metrics panel is
authoritative unless the critic documents the misfire.

### palette_cohesion

The v1 anchor survives as the target: a single warm family throughout,
contrast by luminance only, near-black shadows, warm-cream highlights,
nothing cold mid-range — light through a single piece of glass. Disco
(complementary hue jumps, rainbow, warring temperatures) is the fail
direction.

- **`warm_arc`** — *Do ≥90% of colored pixels sit within the
  sanctioned hue arc in every core still?* Measured: `warm_arc`
  (house warm arc 315°–75° by default; a `palette_exception:` in
  meta.yaml sanctions a different arc for that piece — danzas-percs
  and le-mystere-abyssal are the two sanctioned non-warm pieces).
- **`lum_not_hue`** — *Is contrast carried by luminance, not hue —
  wide luminance range with a tight hue spread?* Measured:
  `lum_not_hue` (luminance range > 0.15 AND hue spread < 25°; the
  house discipline is far tighter than the literature's 60°).
- **`dominant_hues`** — *Are there at most 3 dominant hue clusters per
  core still?* Measured: `dominant_hues`. One of the two hard metric
  gates (14/14 positives at calibration).
- **`no_collapse`** — *Does every core still keep enough luminance
  contrast to avoid warm-on-warm soup?* Measured: `rms_contrast`
  (RMS ≥ 0.03 — corpus-fitted for near-black glow fields; the
  theory's 0.15 came from a different, layer-level measurement). The
  L<0.15 contrast-soup failure of all-mid-warm layer stacks lives
  here.
- **`hue_drift_smooth`** — *Is every adjacent-still hue step ≤ 40° —
  no wrap blink?* Measured: `hue_drift_smooth`. The anemone "blinking"
  bug — a linear palette ramp jumping cream→wine at the wrap point —
  is the canonical fail; cyclic N-waypoint palettes fix it.

### composition

Target: composition wanders at a human-readable pace (~15–60 s
periods); empty zones are intrinsic, not masks; the eye has somewhere
to land in each frame and it moves between frames. Fail direction:
same macro shape every frame, vignette doing the work the content
should.

- **`squint_macro`** — *Does each core still have a connected light
  region against a darker ground when downsampled — a macro
  composition that survives the squint?* Measured: `squint_macro`
  (region 0.5–50% of frame at 32×32). Same underlying test as the
  mesmerizing criterion `squint_macro_structure`; grade both — they
  should agree, and a disagreement means someone misread the
  evidence.
- **`landing_regions`** — *Does each still offer 2–4 attention
  regions?* Judgment from stills (saliency support unimplemented —
  research #3). Shares evidence with `landing_regions_2_4`.
- **`empty_zones`** — *Is there at least one genuine rest area — a
  darker, lower-detail zone where the eye can park — intrinsic to the
  content, not painted on by a vignette?* Measured: `empty_zones`,
  **but** calibration demoted this metric to descriptive (4/14
  positives pass; the house aesthetic fills the frame with glow —
  positives' median dark-rest area is 0.9%, far below the theory's
  10%). Treat the metric value as evidence and grade by judgment; the
  documented-misfire clause applies by default here until the
  threshold is re-fit.
- **`layout_varies`** — *Do the macro layouts differ across section
  stills — the downsampled luminance maps are not near-copies?*
  Measured: `layout_varies` (min pairwise correlation < 0.80).
- **`regions_migrate`** — *Do the attention regions sit in different
  places in different sections?* Judgment from stills (research #4 —
  automatable later via saliency centroids). Distinct from
  `layout_varies`: the layout can vary while the hot-spots stay
  parked.

### motion

Target: always mixing at multiple scales (minimum macro flow + fine
churn, desynchronised); never all frozen simultaneously; direction is
felt even when the music is quiet. Fail direction: one-scale pulse
locked to audio, flat between beats.

- **`trackability`** — *Can the eye lock onto and follow a continuous
  motion in every sampled clip — no stutter, no teleport, median speed
  under the smooth-pursuit ceiling?* Measured: `trackability`
  (per-clip flow-warping error ≤ 0.18, median speed ≤ 30 deg/s
  equivalent; piece-level `trackability_all`). Shares evidence with
  `prediction_continuity`.
- **`jerk_smooth`** — *Is the motion free of per-frame teleports and
  stutter — low acceleration deviation along flow trajectories?*
  Measured: `jerk_smooth` (mean |Δflow| ≤ 0.5; piece-level
  `jerk_smooth_all`).
- **`multi_scale_desync`** — *Are there at least two spatial scales of
  motion with different periods that do not pause together?* Judgment
  from clips (research #18 — band-decomposed flow correlation is
  Stage-2 work). One `iTime` multiplier driving everything is the
  corroborating fail signature.
- **`never_frozen`** — *Is there motion above the floor in every
  sampled clip, including the quiet ones?* Measured: `never_frozen`
  (mean flow ≥ 0.02 px/frame at flow scale; piece-level
  `never_frozen_all`). Static = death.
- **`direction_in_quiet`** — *In the quiet-section clip, does the
  motion still have a felt direction — rising, flowing, orbiting — not
  just residual jitter?* Judgment from the quiet clip (research #20 —
  net-coherent-flow ratio is computable later).

### intensity

Target: goes genuinely quiet in quiet sections (low luminance, low
activity, real dark) and peaks compress asymptotically rather than
clipping. Dynamic range extends both ways. Fail direction: always
loud or always quiet; no breath.

- **`has_peak`** — *Is one passage clearly the energetic maximum of
  the piece?* Judgment from ordered stills + clips; measured support:
  `arc`.
- **`has_quiet`** — *Is there a genuine quiet minimum — real dark,
  sparse activity — not just a less-loud loud?* Judgment from ordered
  stills + clips; measured support: `arc`.
- **`quiet_flow_drops`** — *Does motion energy actually drop in the
  quietest window — median flow ≤ ~55% of the most energetic
  window's?* Measured: `motion_dynamic_range`.
- **`quiet_scale_tightens`** — *Does quiet tighten the geometry —
  smaller scales, calmer forms, less warp — rather than only dimming
  it?* Judgment from quiet vs peak captures (research #29). Shares the
  question's spirit with `quiet_reads_quiet`; this one grades the
  *scale* axis specifically.
- **`no_blowout`** — *Is every core still free of blowout — NOT (mean
  luminance > 0.7 AND channel range < 0.1)?* Measured: `no_blowout`.
  One of the two hard metric gates (14/14 positives at calibration).
  Peaks must compress, not bleach to white.

### depth

Target: structure at every scale the rendered pixel size supports;
reads different up close than from afar. Fail direction: flat, one
resolution of noise, "base + texture" instead of a continuous
hierarchy.

- **`multi_octave`** — *Does each core still carry energy across at
  least 3 octaves of spatial frequency?* Measured: `depth_octaves`.
- **`near_far_distinct`** — *Does the still read differently from
  across the room than at nose distance?* Judgment: compare the
  downsampled view against the native still (research #42).
- **`fine_texture`** — *Does a native-resolution crop hold detail the
  full view hides?* Judgment from a centre crop (research #2). Shares
  evidence with `fine_texture_reward`.
- **`layer_interaction`** — *Do the layers visibly interact — is the
  composite more than the sum of the solos (refraction, occlusion,
  displacement visible where layers meet)?* Evidence: per-layer solos
  `solo-<layer>.png` vs composite (research #43). **n/a** for
  single-shader pieces with no layer stack.

### form_ending

Target: has an arc AND knows when to stop — the ending is earned (a
collapse, a flash, a considered fade); the piece is composed for its
duration. Fail direction: a loop with no awareness of its own length,
ending because the track does.

- **`has_arc`** — *Across the ordered stills, is there a visible
  build–peak–tail shape to the piece's energy?* Measured: `arc` —
  flagged a WEAK proxy at calibration (8/14 positives; per-still
  mean luminance approximates energy poorly). The eye on ordered
  stills outranks the number here whenever they disagree — document
  the override.
- **`ending_differs`** — *Is the outro frame visibly different from
  the intro — did the piece go somewhere?* Evidence: intro vs outro
  stills (research #39).
- **`recapitulation`** — *Are intro and outro recognisably related,
  with one visible delta — a return, changed?* Evidence: intro + outro
  stills (research #40). Same question as the song_level criterion of
  the same name graded from the same pair; for audio pieces grade
  both (they should agree), for non-audio pieces this panel copy is
  the only one graded.
- **`not_seamless_loop`** — *Would a viewer notice if the piece looped
  — i.e. it is NOT a seamless loop?* Evidence: intro vs outro stills +
  the outro clip. A piece indistinguishable at 0% and 100% fails.

## Verdicts

Five verdicts, evaluated top-down. "Applicable criteria" = everything
not n/a, across the claim check, all applicable families, and all six
dimension panels. Harness-gap fails count as fails everywhere; they
are excluded only from the needs-tweak "one shared shader fix" test
(their fix is building the capture, and it's named in
`harness_gaps.missing`).

- **chef-doeuvre** — claim check passes + ALL applicable criteria pass
  (families + dimensions) + zero `harness_gaps`. Stop.
- **ship-it** — claim check passes + both prediction criteria pass +
  total failed criteria ≤ 3 + no family below its floor + every
  dimension panel has ≤ 1 fail. Shippable; the remaining gap is
  nuance, not failure modes. Stop. Don't polish further.

  | family       | ship-it floor |
  |--------------|---------------|
  | mesmerizing  | ≥ 8/9         |
  | interaction  | ≥ 5/7         |
  | music        | ≥ 3/4         |
  | song_level   | ≥ 4/6         |
  | dual_input   | ≥ 5/7         |
  | layered      | ≥ 8/11        |

  When a family has n/a criteria, the denominators shrink — so read
  each floor as a maximum FAIL count over the applicable criteria:
  mesmerizing allows 1 fail, interaction 2, music 1, song_level 2,
  dual_input 2, layered 3. (`5/6` with one n/a meets the interaction
  floor; two fails there would not.)

  (Integration has no separate floor — its fails simply count toward
  the ≤ 3 total, and a single integration fail is very often the
  natural `top_fix`. The v1 palette gate — ship-it required
  palette ≥ 4 — is subsumed by "every dimension panel ≤ 1 fail".)
- **needs-tweak** — claim check passes (or is one fix away) + both
  prediction criteria pass + the failing criteria share ONE concrete
  shader-edit fix. `top_fix` is REQUIRED. The loop auto-applies it.
- **structural-rethink** — either prediction criterion fails, OR
  mesmerizing < 7/9, OR more than 6 total fails. Hand to user. Don't
  try to tweak a non-mesmerizing piece into mesmerization: a
  prediction fail almost always means injecting a chaos transformation
  layer or converting to a state-bearing architecture (`passes:`) — a
  one-line Edit won't fix it.
- **premise-wrong** — the claim itself is unachievable in this
  structure. Hand to user. Don't tweak.

Two tie-breaks, both round-down:

- A piece between bars (e.g. 4–6 scattered fails that don't share one
  fix, prediction passing) is `structural-rethink`. Same round-down
  doctrine as v1: over-polishing a real weakness is recoverable,
  ignoring one is not.
- A failed claim check that is NOT one fix away is
  `structural-rethink` (or `premise-wrong` if the claim can't be
  delivered by this structure at all). Fix the lie first.

The iterate loop parses the YAML tail (last fenced yaml block in the
critique) and branches on `verdict`. Loop caps at 8 iterations.

## Machine metrics panel

Stage-1 (stills) and Stage-2 (clips) metrics live in
`bin/aesthetic-metrics.py`:

```bash
python3 bin/aesthetic-metrics.py piece <slug>   # stills + clips panel
python3 bin/aesthetic-metrics.py clips <slug>   # clip metrics only
python3 bin/aesthetic-metrics.py gate  <slug>   # hard gates only (exit code)
```

Still tests: `squint_macro`, `rms_contrast`, `warm_arc`, `lum_not_hue`,
`no_blowout`, `one_over_f`, `empty_zones`, `depth_octaves`,
`dominant_hues`; per-piece: `arc`, `hue_drift_smooth`,
`layout_varies`. Clip tests: `trackability`, `jerk_smooth`,
`never_frozen` (per clip and `*_all`), `window_divergence`,
`motion_dynamic_range`.

Two tests hard-gate (14/14 positives at calibration): **`no_blowout`**
and **`dominant_hues`** — a piece failing either on its core stills
does not ship, full stop. `one_over_f` (spatial-frequency falloff in
the corpus-fitted band −4.5 to −2.2) maps to no single rubric
criterion: it is a necessary-not-sufficient texture-statistics filter,
reported in the panel as advisory and counted in `stills_passed`.

The critique summarises the panel in the YAML tail (`metrics:` key)
and the full JSON goes into the evidence snapshot.

## Calibration discipline

- **Thresholds live in `bin/aesthetic-metrics.py`** (the `THRESH` and
  `CLIP_THRESH` dicts), fitted on the graded corpus 2026-06-12 — NOT
  in this document, and not from theory. The research report's
  theory numbers mostly did not transfer to the house near-black glow
  aesthetic (RMS contrast theory 0.15 → corpus 0.03; 1/f slope theory
  −2.6..−1.6 → corpus −4.5..−2.2; hue spread theory 60° → house 25°).
  See `learning/calibration-stage1.md` for the full findings.
- **Disagreement re-fits.** When a metric disagrees with human
  judgment by more than one verdict tier, that's a re-fit trigger for
  its threshold — not a reason to hand-wave the metric in prose.
  Document the disagreement in the critique, then re-run
  `bin/aesthetic-metrics.py calibrate`.
- **The negative corpus accumulates via evidence snapshots.** At
  calibration there was only ONE negative-tier piece with stills —
  pass rates on positives measure recall, not discrimination. Keep
  snapshotting evidence for every graded version, and deliberately
  keep pre-fix evidence dirs (kinetic-energy-v1 is the model: v1 =
  needs-tweak, v2 = chef-doeuvre, both preserved — a labelled
  before/after pair).
- **Known weak spots** (from calibration): `arc` is a weak proxy
  (mean-L per still; the real arc test is clip-energy, Stage 2);
  `squint_macro`'s mask level 0.6 is a guess pending a sweep;
  `empty_zones` is demoted to descriptive; `warm_arc` needs the
  `palette_exception:` meta flag for sanctioned non-warm pieces (it
  has it — use it).

## Pseudo-science blacklist

From the research report (Part 5). Future edits to this rubric must
NOT absorb these — they look citable and are not:

1. **Golden-ratio / golden-rectangle preference.** Fechner's result is
   an artifact; replications split ~50/50. Do not reward 1.618
   framing, spiral overlays, or phi-based composition.
2. **"Fractal dimension 1.3–1.5 = beautiful" as a quality gate.**
   Real on average, but culture- and gender-moderated, static-image
   based. Descriptive only, never pass/fail.
3. **Universal hue-harmony angle rules** (Moon & Spencer;
   "complementary/triadic = harmonious"). Empirically rejected. Don't
   grade palettes by color-wheel geometry — the house warm-arc rule is
   doctrine, not physics, and is honest about it.
4. **Birkhoff M = O/C as a literal beauty score.** Unsupported. Use
   entropy/compressibility as descriptive features only.
5. **"More symmetry = more beauty" as a universal law.**
   Context-dependent; symmetry on organic content reads artificial.
   Not a positive gate for generative fields.
6. **Loudness→brightness as the goal of music coupling.** Cross-modally
   "natural" — and precisely the decorative strobe failure mode this
   rubric fails pieces for. A negative marker, never a target.
7. **Pop "neuroaesthetics" universals** (single-number beauty
   predictors, dopamine-as-beauty). Predictive processing is a
   framing here, not a measurement.

## How to use this during iteration

The critic agent writes a full Markdown critique to
`brainstorming/critiques/<slug>-vN.md` with these required sections in
order:

- `## The claim` — one-sentence thesis restatement from meta.yaml,
  plus the declared continuity and divergence timescales.
- `## Frame-by-frame` — table: Frame | t | What's there.
- `## Mesmerizing criteria` — table of the nine verdicts with
  justifications, each tied to the frame-by-frame observations and to
  named clips.
- `## Claim check` — pass/fail + one-paragraph justification.
- `## Family criteria` — one table per applicable family
  (interaction, music, song_level, dual_input, layered, integration);
  omit inapplicable families with one line saying why.
- `## Dimension panels` — six tables, criterion | grade | evidence.
- `## Metrics panel` — the `bin/aesthetic-metrics.py` summary, plus
  any documented metric overrides with reasons.
- `## What's working` — concrete wins. Required.
- `## What's imperfect` — ranked, each grounded in a specific capture.
- `## Harness gaps` — each untestable criterion with the capture or
  metric that would test it (or "none").
- `## Verdict` — one of the five values, with the bar arithmetic shown.

At the end of the markdown, a parseable YAML tail. The schema:

```yaml
piece: <slug>
iteration: <N>
schema: 2
verdict: <chef-doeuvre|ship-it|needs-tweak|structural-rethink|premise-wrong>
claim_check: <pass|fail>
mesmerizing_passes: <N/9>
mesmerizing_probes: { <9 keys>: pass|fail }
<family>_passes: <N/M or "n/a">          # omit family map entirely when n/a
<family>_probes: { each key: pass|fail|n/a }
dimensions:
  palette_cohesion: { warm_arc: pass, lum_not_hue: pass, dominant_hues: pass, no_collapse: pass, hue_drift_smooth: pass }
  # ...all six panels, every criterion key present...
metrics:                                  # machine panel summary (from bin/aesthetic-metrics.py)
  gate: pass|fail
  stills_passed: <N/M>
  clips_passed: <N/M or "n/a">
harness_gaps:                             # untestable criteria — each already counted as FAIL above
  - criterion: <key>
    missing: <capture or metric needed>
top_fix: null   # or {dimension, what, why, caution} — REQUIRED iff verdict == needs-tweak
evidence: [ evidence/<slug>-vN/<file>, "..." ]
```

A complete worked example (this is the shape the loop parses —
families are `mesmerizing`, `interaction`, `music`, `song_level`,
`dual_input`, `layered`, `integration`):

```yaml
piece: plume
iteration: 3
schema: 2
verdict: needs-tweak
claim_check: pass
mesmerizing_passes: 9/9
mesmerizing_probes:
  eye_lands: pass
  landing_regions_2_4: pass
  regions_shift: pass
  prediction_continuity: pass
  prediction_divergence: pass
  squint_macro_structure: pass
  fine_texture_reward: pass
  hue_drift: pass
  mystery_withheld: pass
interaction_passes: 5/6
interaction_probes:
  composition: pass
  idle: pass
  readability: pass
  reversibility: n/a    # thesis declares ink accumulation
  dominance: pass
  convention: pass
  latency: fail         # harness gap — see below
music_passes: 4/4
music_probes:
  motion_over_luminance: pass
  bass_movement: pass
  rhythm_in_stills: pass
  quiet_reads_quiet: pass
song_level_passes: 5/6
song_level_probes:
  section_readability: pass
  downbeat_anchored: pass
  pre_tension: fail
  per_stem_discrimination: pass
  long_arc: pass
  recapitulation: pass
dual_input_passes: 7/7
dual_input_probes:
  dual_channel_readability: pass
  channel_non_overlap: pass
  music_without_cursor: pass
  cursor_without_music: pass
  conflict_resolution: pass
  authority_during_build: pass
  idle_cell: pass
layered_passes: 11/11
layered_probes:
  spatial_coupling: pass
  polyrhythm_of_clocks: pass
  eye_distribution: pass
  quiet_survives: pass
  order_meaningfulness: pass
  blend_saturation: pass
  coupling_cost: pass
  brightness_strobe: pass
  layer_distinctness: pass
  multi_input_coupling: pass
  visible_phase_lock: pass
integration_passes: 4/4
integration_probes:
  orphan_event: pass
  pasted_overlay: pass
  perspective_consistency: n/a   # no receding plane
  boundary_artifacts: pass
  accretion_causality: pass
dimensions:
  palette_cohesion:
    warm_arc: pass
    lum_not_hue: pass
    dominant_hues: pass
    no_collapse: pass
    hue_drift_smooth: pass
  composition:
    squint_macro: pass
    landing_regions: pass
    empty_zones: pass
    layout_varies: pass
    regions_migrate: pass
  motion:
    trackability: pass
    jerk_smooth: pass
    multi_scale_desync: pass
    never_frozen: pass
    direction_in_quiet: pass
  intensity:
    has_peak: pass
    has_quiet: pass
    quiet_flow_drops: pass
    quiet_scale_tightens: fail
    no_blowout: pass
  depth:
    multi_octave: pass
    near_far_distinct: pass
    fine_texture: pass
    layer_interaction: pass
  form_ending:
    has_arc: pass
    ending_differs: pass
    recapitulation: pass
    not_seamless_loop: pass
metrics:
  gate: pass
  stills_passed: 52/54
  clips_passed: 14/15
harness_gaps:
  - criterion: latency
    missing: bin/inspect-interaction.mjs latency-*.png burst capture
top_fix:
  dimension: intensity
  what: |
    Wire u_section_progress into the macro scale: clamp the plume's
    spawn radius and advection speed down as u_to_section_change
    approaches the drop, so quiet/pre-drop passages tighten geometry
    instead of only dimming. One edit fixes both pre_tension and
    quiet_scale_tightens.
  why: |
    The pre-peak clip (clip-w2-t88.mp4) is indistinguishable from the
    verse clip except in brightness, and the quiet still keeps the
    full peak-size geometry at 40% luminance. Both fails share the
    missing section-driven scale term.
  caution: |
    Keep never_frozen passing — the clamp must slow and shrink the
    flow, not stall it. Floor the advection speed above the frozen
    threshold (0.02 at flow scale).
evidence:
  - evidence/plume-v3/music-02-t153.3-pre-peak.png
  - evidence/plume-v3/clip-w2-t88.mp4
  - evidence/plume-v3/metrics.json
```

(Verdict arithmetic for the example: three fails total — `pre_tension`,
`quiet_scale_tightens`, and the `latency` harness gap. The two shader
fails share one fix; the gap fail is excluded from the shared-fix test
and named in `harness_gaps`. Both prediction criteria pass, claim
passes → `needs-tweak` with `top_fix` mandatory.)

## Anti-patterns for the critic

Things the critic should *not* suggest:

- Changes that contradict `VISION.md` (cold palettes without a
  sanctioned exception, rainbow gradients, generic visualiser shapes,
  infinite loops).
- Changes that would flip a currently-passing criterion to fail in
  order to fix a failing one — unless the trade is explicitly named
  and the passing criterion is outside the mesmerizing family. The
  mesmerizing criteria outrank everything.
- Stylistic swaps ("try a different palette") when no failing
  criterion called for one.
- Multiple changes at once. One `top_fix` per iteration. Ranked
  second/third fixes can be held for later iterations.
- Inventing a `top_fix` to fill the slot when the fails don't share
  one fix. That's a `structural-rethink` verdict, not a tweak target.
- Grading a prediction criterion from stills, or any interaction
  criterion without its capture. Missing evidence is a fail + harness
  gap, never a soft pass.

## Meta

This rubric is itself a living document. When a piece teaches me a new
criterion worth grading, add it here — as ONE binary question with its
evidence named, checked against the §Pseudo-science blacklist. When a
criterion turns out to be redundant with another, merge them. The
critic cares about what's written here; keep it true.

Changelog:

- v2 binary rework, 2026-06-12 — every criterion one binary question;
  weak/shader-verdict/unclear vocabulary abolished; 1–5 dimension
  scores replaced by binary panels; machine metrics panel + harness
  gaps + schema-2 YAML tail added. Sources:
  `learning/research-binary-beauty-tests.md` (evidence catalog,
  markers #1–#50) and `learning/calibration-stage1.md` (corpus-fitted
  thresholds).
- Probe lineage: cursor probes 2026-04; music + song-level + dual-input
  probes 2026-04/05; layered probes 9–11 added 2026-05-05 (`stronger`
  build); prediction hard gate 2026-06-02 (dopamine builds); palette
  ship-gate 2026-05-11 (round-2 regrade); integration probes
  2026-06-11 (le-mystere-abyssal watchthrough).
