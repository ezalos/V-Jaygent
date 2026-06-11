# ink-bloom — iteration 1 critique

First recorded critique (the piece was iterated in past sessions; no
critique was written down). Independent critic, read-only, 2026-06-11.
Track: Nils Frahm "Says" — 499 s, detected 152 BPM (double-time read of
a ~76 BPM pulse), C minor, 7 sections (0 / 13.5 / 263.9 / 297.5 /
337.7 / 399.8 / 486.6).

**Evidence base and its limits.** This is a state-accumulating
`passes:` piece; `bin/inspect-music.mjs` seeks, which resets the
pigment buffer, so all six section-anchored stills and ALL FIVE
multi-window clips show near-blank paper (verified: 10 frames
extracted from `clip-peak.mp4`, `clip-w1`, `clip-w4` at 2 fps are
empty cream with only the macro light-pool drifting). That is the
documented harness artefact from meta.yaml, not the piece. The piece
is graded from the wall-clock run (`bin/inspect.mjs ink-bloom 8 55`,
audio from t=0, frames t1.5–t386.5). Two caveats on that run carry
through this whole critique: (1) headless renders ~17 fps vs 60 live,
so deposition lags ~3.5x — the live piece is *denser* at the same
timestamp; (2) the harness parks the cursor near canvas centre, so
`mouseOn` was true throughout — some central wetness/pigment in every
wall-clock frame is parked-cursor contribution, not the autonomous
brush. All graded images are snapshotted in
`evidence/ink-bloom-v1/`.

## The claim

This piece claims to be a watercolour that paints itself over the
length of the song: a curl-noise current bleeds a persistent pigment
field, the paint look (edge-darkened rims, granulation, multiply-only
glazes) is applied per-frame and never fed back, pigment never fades,
sections admit new pigment families (indigo → +sienna → +carmine),
and at the end the dried painting stands.

## Frame-by-frame

Wall-clock run, 55 s spacing (section in parentheses):

| Frame | t      | What's there |
|-------|--------|--------------|
| 0 | 1.5 s (s0)   | Bare cream paper, soft deckle vignette, ~5 dilute foxing stains (indigo-led, one warm) scattered mid-field. Honest near-silence; eye has only the stains. |
| 1 | 56.5 s (s1)  | A constellation of ~12 distinct dabs — sienna and indigo alternating — looping left-of-centre, plus a strong indigo knot upper-right-of-centre with bled tendrils. Each dab is a separate bar-snapped bloom; rims already forming. |
| 2 | 111.5 s (s1) | The dabs have bled into a connected cloud arcing lower-left → upper-centre; cauliflower-style wobbly boundaries with visibly darker rims; indigo knot persists upper-right, now smeared. Same structures as frame 1, grown — coherent evolution, no re-anchoring. |
| 3 | 166.5 s (s1) | Cloud fills the centre; warm/cool interleave inside the mass; small dense red-orange spots; pale interior channels where washes dried. Macro light/dark composition obvious on squint. |
| 4 | 221.5 s (s1) | Denser still; a pale negative channel snakes through the middle of the mass (figure/ground flips); granulation texture readable up close; edges of the painting still soft into bare paper. |
| 5 | 276.5 s (s2) | Carmine has unmistakably entered — red strokes centre and lower-right woven into the indigo/sienna body. First frame where three families read. Section entry visible as a vocabulary change, not a re-shade. |
| 6 | 331.5 s (s3) | Densest, most painterly frame: full multicolour mass, reds/indigo/sienna interleaved, darker mid-tones, rims and grain everywhere. Two-brush section — deposition clearly broader than before. |
| 7 | 386.5 s (s4) | Categorically different configuration: the whole painting dragged into a directional vertical-diagonal smear, a wine/indigo column left-of-centre with combed streaks — the section current visibly took the painting somewhere. Bare paper right third. |

Section-anchored stills (`music-00..05`) and all clip frames: blank
paper + warm-up traces in capture order, graded only as harness
artefact evidence, not as the piece.

## Mesmerizing probes

Declared timescales for Prediction: **continuity 1 s** (slow ambient
swells), **divergence 30 s** (499 s long-form immersive piece). The
55 s-spaced wall-clock frames over-satisfy the divergence gap; the
continuity sub-test has no valid motion evidence (all clips are
post-seek blanks) and is graded from the shader.

| Probe | Verdict | Why |
|-------|---------|-----|
| Eye-landing | pass | Landing candidates exist and migrate: dab loop + indigo knot (frame 1) → cloud arc (2-3) → pale interior channel (4) → carmine strokes (5) → smeared column (7). 2–4 candidates per frame, never the same spot twice. Frame 0 is sparse (foxing stains only) — sanctioned intro bareness, the arc requires it. |
| Prediction | pass | (a) Continuity: **shader-pass** — semi-Lagrangian advection at `vel*DT`, gaussian splats, smooth cosine gust; no stochastic tears, no chromatic separation, no audio-on-brightness flashes anywhere in either pass; the bar-snap brush jump relocates an *injection source*, deposited paint never jumps. The chaos is cumulative smooth flow — exactly the (a)-safe architecture. Not frame-verifiable: every existing clip is post-seek blank. (b) Divergence: **pass from frames** — consecutive 55 s windows show categorically different vocabularies, not re-seeded sameness: discrete dab constellation (1) → merged rimmed washes (2-4) → carmine entry (5) → two-brush density (6) → whole-field directional smear (7). A viewer who watched window 1 cannot imagine window 7. |
| Squint | pass | Frames 2–7 blur to a clear dark-mass-on-cream macro composition with the pale channel and the wandering light pool giving light/dark structure; up close the grain, rims, and per-family granulation offsets reward stepping in (dual-resolution). Frame 0–1 are squint-sparse but carried by the arc. |
| Hue drift | pass | Dominant tone is locked to warm cream paper, but the pigment cast drifts slowly and directionally over minutes — indigo-led open, sienna joining, carmine arriving at s2, plus the energy-gated warm lean. No frame-to-frame jumps anywhere in the run. |
| Mystery | pass | The piece withholds the painting's future: golden-angle bar snaps mean the next bloom's position never repeats; the pale negative channels (frame 4) flip figure/ground; the abstract mass never resolves into a nameable image — "what is it painting?" stays open all song. Kaplan's promise-of-more is the literal premise. |

**Mesmerizing result: 5/5 passes** — with the explicit caveat that the
Prediction continuity sub-test is shader-grounded, not motion-verified
(see Verdict).

## Interaction probes

Piece declares `cursor: true`; sim reads `u_mouse` + `u_touches`.
No multi-cursor-position captures exist, so these are shader verdicts
(sim.frag lines cited).

| Probe | Verdict | Why |
|-------|---------|-----|
| Composition | shader-pass | Cursor injects persistent pigment (`inj += leadW * 0.030 * s3`, sim.frag:252-255) — every stroke permanently rewrites the painting's macro composition, the strongest possible composition coupling. The parked-cursor contamination of the wall-clock frames is accidental proof. |
| Idle | shader-pass | Autonomous brush (lissajous + bar-snap, sim.frag:135-141), phantom ~91 BPM clocks when silent (line 96-99), live floor 0.55, foxing stains at frame 0. Caveat: meta documents a marginal lint-idle number (~0.022 vs 0.025) as a seek artefact; no uncontaminated idle capture exists to verify by eye. |
| Readability | shader-pass | Drag → paint appears under the brush + local swirl. The most self-evident mapping a painting can have; zero instructions needed. |
| Reversibility | n/a-stateful | Intentionally fails: paint persists — that IS the thesis. Called out as the rubric requires. |
| Dominance | shader-pass | Cursor splat is local (gaussian r≈0.034, swirl falloff exp(-r²/0.012)); the uptake ceiling (line 217) stops a determined cursor from flooding density past 2.4. Casual use stays well under ~30% of structural energy. |
| Convention | shader-pass | Drag-to-paint, swirl-toward-bristles. No prior is fought. |
| Latency | shader-pass | Injection and stir are sampled directly at `u_mouse` with no smoothing — sub-frame response. |

**Interaction result: 6/7** (reversibility n/a-stateful, by design).
Cursor-as-instrument claim holds. Keyboard: 15 per-key dab positions
with hashed heights, whites drop the lead family, blacks always indigo,
attack splashes water (lines 267-277) — per-key distinctness is real.

## Music reactivity probes

| Probe | Verdict | Why |
|-------|---------|-----|
| Motion-over-luminance | shader-pass | Audio feeds geometry almost everywhere: energy scales current speed (sim.frag:112), gyre strength (124), curl gain (131), brush radius (232); beat phase drives the gust *velocity* swell (110-112); downbeat pushes a radial velocity ring (147-153); u_audio_high jitters the brush *position* (140-141). Brightness-family uses exist only in the display macro envelope (shader.frag:92-96) and are secondary. |
| Bass→movement | shader-weak | No `u_audio_bass` anywhere; `u_audio_kick` is declared (sim.frag:18) but **never used** — dead code. The pulse→motion job is done by the beat-phase gust and downbeat ring (clock uniforms, not bass amplitude). Defensible for an ambient piano track with no kick, but the amplitude-of-low-end binding the probe asks for is absent. |
| Rhythm-in-stills | pass | Frame 1's constellation of ~12 separate dabs is frozen evidence of per-bar seeding; frame 7's combed directional streaks show the current mid-flight. These are geometric music traces, not brightness states. |
| Quiet-reads-quiet | pass | Frame 0 is honestly near-blank (intro brushRate ×0.3, line 231); low energy slows the current and thins deposition (0.012+0.085·energy; 0.012+0.045·energy) — structural de-energization, not dimming. |

**Music result: 3/4.** Music composes the piece (≥3/4 bar met).

## Song-level composition probes

Analysis JSON present; sim references `u_section_id`, `u_bar_index`,
`u_downbeat`, `u_beat_phase`/`u_bar_phase`.

| Probe | Verdict | Why |
|-------|---------|-----|
| Section-readability | pass | s0 bare (frame 0), s1 indigo/sienna washes (1-4), s2 carmine entry (5), s3 two-brush density (6), s4 directional smear + backruns (7) — 4 of 5 sampled sections are unambiguously distinct; accumulation confounds within-section sameness but the family entries and heading snaps are legible. |
| Downbeat-anchored | shader-pass | ≥2 structural events on composition uniforms: section heading snap (GOLDEN·(sec+3), line 107), per-bar golden-angle brush jump (u_bar_index, 137), downbeat backrun ring (u_downbeat, 147-153), per-section gyre flip (sec&1, 122), family entry (u_section_id, 89). |
| Pre-tension | fail | `u_to_section_change` is not referenced; `u_section_progress` is declared (line 25) but never used. "Says" has one of the most famous long swells in ambient music and the visual does not foreshadow it — sections arrive unannounced. |
| Per-stem-discrimination | fail | No `u_audio_*_stem` uniforms despite stems existing in the analysis JSON. |
| Long-arc | pass | The 8-frame density/contrast curve has a real quiet (frame 0) and a clear maximum (frames 6-7); the composed s6 drying tail is in the code (mobility ×0.2, brushRate→0.0005) but past the capture window. |
| Recapitulation | weak | By design it is exact (the intro's bare paper returns as the *ground* of the dried painting — related with the maximal delta), but no valid end-of-track frame exists (music-05 is a seek artefact), so this stays unverified. |

**Song-level result: 3/6.** Above the 2/6 reactive-only floor, below
the 4/6 "song-aware composition" claim bar — section-aware, not yet
song-aware.

## Dual-input probes

| Probe | Verdict | Why |
|-------|---------|-----|
| Dual-channel readability | shader-pass | Music drives the global current/blooms, cursor paints locally and instantly — both legible within seconds. |
| Channel-non-overlap | pass | Roles are disjoint: audio scales the *global* flow and autonomous deposition; cursor adds a *local* stir + its own injection. Both are gated by the same wetness/uptake mediators rather than stacking additively into an arms race. |
| Music-without-cursor | pass | The wall-clock run is effectively this cell (parked cursor aside): autonomous brush, bar snaps, family entries all visible without input. |
| Cursor-without-music | shader-pass | Idle metronome (phantom beat/bar clocks) + live floor 0.55 keep the current alive; cursor painting works against it (lines 96-99, 80). |
| Conflict-resolution | pass | Wetness gates all motion (mobility, line 176); uptake gates all injection (line 282) — floor-and-ceiling, not additive. |
| Authority-during-build | shader-pass | Cursor force and injection carry no energy mask — full responsiveness at any loudness. |
| Idle-cell | shader-unclear | The neither-cell is designed (foxing stains, phantom clocks, slow bleach) but lint-idle sits marginally below floor and no uncontaminated idle capture exists; meta says verify by eye on a wall-clock idle run, which this critique could not do. |

**Dual-input result: 6/7.** Two-hands-on-the-instrument claim holds.

## Layered composition probes

n/a — the piece is a `passes:` architecture (pigment sim + display),
not a `layers:` stack; the layered probe family does not apply. The
multi-input coupling concern it embeds is covered above (cursor +
keyboard + audio all reach the sim).

## Claim check

**Pass.** The wall-clock frames deliver the thesis: bare paper paints
itself into a dense watercolour over 386 s of captured song; every
identity cue from the technique doc is visible (edge-darkened rims from
frame 2 on, granulation in the dense frames, multiply-only darkening —
nothing ever blows toward white, wobbly wash boundaries, cauliflower
backrun shapes); pigment visibly never fades (every structure in frame
1 is still traceable, grown, in frame 2); families enter in the claimed
order (indigo-led open, sienna, carmine at s2). The "dried painting
stands" ending is composed in code but past the capture window —
unverified, not contradicted.

## Scores

| Dimension | Score | Note |
|-----------|-------|------|
| Palette cohesion | 4 | Deliberate, muted sienna/carmine/indigo triad on the sanctioned cream ground, multiply-only so glazes only darken; coheres as one watercolour box. Not the single-warm-family 5 by the letter — indigo is genuinely cool mid-range, sitting next to sienna (a blue/orange pair) by design. |
| Composition | 4 | The painting wanders and accumulates at a human pace; bare paper is an intrinsic empty zone; the eye moves between frames. Held off 5: the mass is centre-biased all song (brush wander confined to a central ~0.42 radius, edges bare in every frame) — the macro shape is always "central mass on cream". |
| Motion | 4 | Multi-scale and desynchronised by construction: section current, macro gyre, curl texture, bar-snap jumps, beat gust, sub-beat hand shimmer, downbeat rings — clocks from u_time multipliers 0.013→12.3 plus beat/bar/section. Direction is *felt* in frame 7. Held off 5: stills cannot confirm "never all frozen", and headless under-runs the sim 3.5x. |
| Intensity & dynamic range | 4 | Honest floor (bare intro, dilute washes at low energy) and a real build; peaks compress asymptotically via the uptake ceiling instead of clipping. The drying-outro silence-as-form is composed but uncaptured. |
| Depth | 4 | Paper tooth at three scales, granulation, rims, interior wash gradients, macro mass — reads differently up close vs afar (frames 3-6). Held off 5: the half-res sim keeps mid-scale flow soft; the finest detail is static grain rather than structure that rewrites the coarse. |
| Form & ending | n/a | No valid end-of-track capture (music-05 is a seek artefact; wall-clock run stops at 386.5 s). The arc-so-far is visible; the s6 drying ending exists only in code. |

## What's working

- **The thesis lands on screen.** Eight wall-clock frames tell the
  exact claimed story: blank paper → bar-seeded blooms → merged rimmed
  washes → new families per section → a current that takes the painting
  somewhere. Accumulation-as-composition genuinely works.
- **The watercolour identity cues all read.** Blur-difference rims
  (frames 2-4), granulation in the dense passages (6), multiply-only
  darkening (nothing ever bleaches), wobbly boundaries, backrun-shaped
  cauliflower edges — the full Curtis/Lieberman cue set from
  `techniques/watercolor-ink.md`, visible, not just implemented.
- **Phase-lock leaves frozen evidence.** Frame 1's ~12-dab
  constellation is the bar grid printed onto the canvas; the
  golden-angle snap means it never repeats.
- **Sections are vocabulary changes, not re-shades** — carmine's
  entry at frame 5 and the s4 heading-smear at frame 7 are different
  *events*, exactly what the section-vocabulary lesson asks for.
- **The architecture dodges the baked-artefact trap** — paint-look
  never fed back, fbmRot not fbmGrid, per-axis time multipliers,
  vel·DT advection: every known feedback footgun pre-empted, and the
  smooth-flow design is structurally safe against Prediction's
  too-noisy failure mode.

## What's imperfect

1. **The evidence rig cannot fully verify the piece — and that blocks
   the top verdict.** Every clip is post-seek blank, so the Prediction
   continuity sub-test, the idle cell, and the dried-painting ending
   all rest on shader reading. The piece needs a wall-clock *clip*
   (continuous capture mid-run after warm-up, plus one at the 486 s
   drying boundary) and one uncontaminated idle run before
   chef-doeuvre can honestly be called. This is a harness gap, but the
   unverified items are real criteria.
2. **Pre-tension is absent** (`u_section_progress` and
   `u_to_section_change` unused — the former declared then dead,
   sim.frag:25). The 399.8 s climax entry would land far harder if the
   minute before it visibly withheld — slowing current, drying paper,
   thinning deposition into the boundary.
3. **Dead/unbound audio intent:** `u_audio_kick` (sim.frag:18) and
   `u_song_progress` (sim.frag:27, shader.frag:11) declared but never
   used; stems exist in the analysis JSON and are unbound
   (per-stem-discrimination fail). The piano stem picking the lead
   family, or strings driving wetness, is sitting on the table.
4. **Centre-bias:** brush wander + bar offset keep all deposition in a
   central disc; every frame is a central mass with bare margins. A
   slow drift of the wander centre itself (15-60 s period) would let
   the painting claim other quadrants of the paper.
5. **Climax smear risk, unverified:** frame 7 shows the s4 current
   dragging the *whole* painting into a streak — gorgeous once, but if
   s5 (399.8-486.6) sustains it, eighty seconds of high-energy
   advection could comb the accumulated painting into mud before the
   drying sets. No capture exists past 386.5 s to check.
6. Trivial: meta says idle live floor 0.45, code says 0.55
   (sim.frag:80) — doc drift.

## Verdict

**ship-it.**

Recorded data: mesmerizing 5/5, claim pass, all testable dimensions 4,
palette ≥ 4, Prediction passing — which reads one notch from
chef-doeuvre. The verdict is deliberately ship-it, not chef-doeuvre,
and not by rounding: the chef-doeuvre bar's load-bearing probe
(Prediction) has its continuity half resting entirely on shader
reading, because every motion artefact this piece has ever produced is
a post-seek blank; the idle cell and the composed ending are likewise
unverified, and every wall-clock frame carries parked-cursor
contamination. A hard-gate probe verified only structurally is enough
to ship on — the architecture is the textbook (a)-safe design — but
not enough to certify a masterpiece on a first recorded critique. The
piece itself needs no tweak loop; the *next critique* needs better
evidence (wall-clock clips after warm-up, an end-of-track frame, one
clean idle run), and the pre-tension/stem items (#2, #3) are the
polish that would carry it past the bar if Louis wants a v2 pass.

```yaml
piece: ink-bloom
iteration: 1
verdict: ship-it
claim_check: pass
mesmerizing_passes: 5
mesmerizing_probes:
  eye_landing: pass
  prediction: pass
  squint: pass
  hue_drift: pass
  mystery: pass
interaction_passes: 6
interaction_probes:
  composition: shader-pass
  idle: shader-pass
  readability: shader-pass
  reversibility: n/a-stateful
  dominance: shader-pass
  convention: shader-pass
  latency: shader-pass
music_passes: 3
music_probes:
  motion_over_luminance: shader-pass
  bass_movement: shader-weak
  rhythm_in_stills: pass
  quiet_reads_quiet: pass
song_level_passes: 3
song_level_probes:
  section_readability: pass
  downbeat_anchored: shader-pass
  pre_tension: fail
  per_stem_discrimination: fail
  long_arc: pass
  recapitulation: weak
dual_input_passes: 6
dual_input_probes:
  dual_channel_readability: shader-pass
  channel_non_overlap: pass
  music_without_cursor: pass
  cursor_without_music: shader-pass
  conflict_resolution: pass
  authority_during_build: shader-pass
  idle_cell: shader-unclear
layered_passes: n/a
scores:
  palette_cohesion: 4
  composition: 4
  motion: 4
  intensity: 4
  depth: 4
  form_ending: n/a
top_fix: null
evidence:
  - evidence/ink-bloom-v1/music-00-t1.0-intro.png
  - evidence/ink-bloom-v1/music-01-t359.4-verse.png
  - evidence/ink-bloom-v1/music-02-t398.3-pre-peak.png
  - evidence/ink-bloom-v1/music-03-t428.5-peak.png
  - evidence/ink-bloom-v1/music-04-t138.7-quiet.png
  - evidence/ink-bloom-v1/music-05-t492.9-outro.png
  - evidence/ink-bloom-v1/frame-00-t1.5s.png
  - evidence/ink-bloom-v1/frame-01-t56.5s.png
  - evidence/ink-bloom-v1/frame-02-t111.5s.png
  - evidence/ink-bloom-v1/frame-03-t166.5s.png
  - evidence/ink-bloom-v1/frame-04-t221.5s.png
  - evidence/ink-bloom-v1/frame-05-t276.5s.png
  - evidence/ink-bloom-v1/frame-06-t331.5s.png
  - evidence/ink-bloom-v1/frame-07-t386.5s.png
  - evidence/ink-bloom-v1/clip-peak-f00.png
  - evidence/ink-bloom-v1/clip-peak-f01.png
  - evidence/ink-bloom-v1/clip-peak-f02.png
  - evidence/ink-bloom-v1/clip-peak-f03.png
  - evidence/ink-bloom-v1/clip-w1-f00.png
  - evidence/ink-bloom-v1/clip-w1-f01.png
  - evidence/ink-bloom-v1/clip-w1-f02.png
  - evidence/ink-bloom-v1/clip-w4-f00.png
  - evidence/ink-bloom-v1/clip-w4-f01.png
  - evidence/ink-bloom-v1/clip-w4-f02.png
```
