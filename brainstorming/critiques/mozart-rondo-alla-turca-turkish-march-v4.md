## The claim

This piece claims to visualize Mozart's *Rondo Alla Turca* as percussion-as-light through a monolithic single-shader piece: an 8-arm rotating cream cross (bar-phase driven, snapping to angle 0 on each section boundary) against a deep ember ground, with expanding cream rings on every beat, high-band sparks at cymbal transients, and cursor-driven cross-center displacement. The cross arms are chaotically reshaped per beat via hash-driven length variation; rings and sweeps exhibit non-uniform behavior (per-beat fire decisions, direction reversals, curve variations); per-section rotation rates and per-bar hold-or-spin gates break the locked rhythm. Architecture A; cream geometry against near-black; percussion rendered as light.

## Frame-by-frame

| Frame | t | What's there | Arm distribution detail |
|-------|---|---|---|
| 00 (intro) | 1.0s | Deep black/ember ground. Cream 8-arm cross centred. Faint outer ring. Soft halo. | Cross axes roughly N/S, E/W. Arms read equal-ish length. |
| 01 (verse) | 103.5s | Cross smaller, two concentric rings expanding outward. Spark texture around arms. | Asymmetric: upper arms visibly LONGER than lower. NOT frame-0 rotated. |
| 02 (pre-peak) | 96.9s | Cross brighter, denser glow around tips. Two rings brighter. | Distribution CHANGED again — left/right longer, top/bottom shorter. Inverse asymmetry from frame 1. Confirms per-beat scramble. |
| 03 (quiet) | 190.9s | Cross thinner, multi-radius rings persist. Sparks dim. | Arms minimal but more balanced. Amplitude-driven thinning. |
| 04 (outro) | 202.9s | Cross arm widths minimal. Rings faint but multiple concentric circles visible. | Arms barely visible. Cross subordinate to ring structure. |

## Mesmerizing probes

| Probe | Verdict | Note |
|-------|---------|------|
| **Eye-landing** | **Pass** | Cross centre is primary focal zone; rings + sweep arcs create migrating secondary zones across frames. |
| **Prediction** | **Pass** | Macro predictable (cross rotates, rings expand). Micro NOT predictable: frame 0 balanced, frame 1 upper-long, frame 2 left/right-long — no rotation accounts for these distributions. The hash-driven per-beat arm reshuffle delivers "almost, not quite." |
| **Squint** | **Pass** | Two-scale macro: cream cross (focal) + concentric rings (radiating). Clean composition. |
| **Hue drift** | **Pass** | Cream → ember-rust drift across the 5-frame span. Single warm temperature. |
| **Mystery** | **Pass** | The cross *promises* rotation-predictability but *denies* it on zoom — eye keeps looking to resolve "is it rotating, or reshaping, or both?" Withheld structure satisfied. |

**Pass count: 5/5.**

## Interaction probes

7/7 — Composition, Idle, Readability, Reversibility, Dominance, Convention, Latency all pass. Cursor pulls cross center; orthogonal to audio's geometry; readable in 3s; returns on reverse; ≤30% energy contribution.

## Music reactivity probes

4/4 — Motion-over-luminance shader-pass (bass→arm length, kick→ring brightness pulse with bp-driven radius). Bass→movement shader-pass. Rhythm-in-stills pass (cross size + ring brightness mid-pulse across frames). Quiet-reads-quiet pass (frame 3 structurally calmer, not just dimmed).

## Song-level composition probes

5/6 — Section-readability pass (palette + cross-rate per section_id), Downbeat-anchored shader-pass (snap + post-flash), Pre-tension shader-pass (`u_to_section_change` squeezes arm length), Per-stem-discrimination shader-pass (4 stems → 4 distinct geometric roles), Long-arc pass, Recapitulation **weak** (intro and outro share the cross but emphasis is inverted — bright at intro, dim at outro).

## Dual-input probes

7/7 — Dual-channel readable, channels disjoint (cursor=position, audio=geometry), each channel survives without the other, no shared-parameter conflict, cursor responsive during builds, all 4 idle cells render.

## Layered composition probes

Not applicable — monolithic single-shader piece (Architecture A).

## Claim check

**PASS.** All elements delivered: 8-arm cross with chaotic per-beat arm distribution, rotation snaps on section boundary, palette flips per section, expanding/contracting cream rings on beats, high-band sparks visible, cursor-pulled center, Caravaggio-tight cream-against-near-black contrast (ground L ~0.075, cross/rings 0.95+).

## Scores

| Dimension | Score | Note |
|-----------|-------|------|
| **Palette cohesion** | 5 | Single warm family, contrast by luminance only. |
| **Composition** | 5 | Macro drifts at bar rate; per-arm asymmetry prevents rotational symmetry lock. |
| **Motion** | 5 | Four+ desynchronised scales (rotation, ring pulse, per-beat arm reshuffle, sweep arc with non-uniform velocity). Per-bar hold-or-spin gate adds further desync. |
| **Intensity & dynamic range** | 4 | Peaks bright, quiet frames dark. Always-on halo compresses true silence — accepted trade-off for lint motion floor. |
| **Depth** | 4 | Two scales (macro cross+rings, micro arm asymmetry+sparks). Not fractal — base + animated texture. |
| **Form & ending** | 4 | Clear arc, ending earned via ground deepening + cross retraction. |

## What's working

1. **Per-beat arm reshuffle is the critical fix.** Frames 0→1→2 show visibly different arm distributions at different rotation angles — breaks v3's "rotation legible" failure.
2. **Per-bar hold-or-spin gate (35% holds).** Even if rotation rate becomes learnable, holds prevent the eye from extrapolating poses.
3. **Per-beat ring fire/direction/curve variation.** Rings don't always fire (~30% silent), and when they do, they go inward OR outward unpredictably with varying curve shapes.
4. **Per-section rotation rate ∈ [0.55, 1.60] revs/bar.** No global canonical rate to learn.
5. **5/5 mesmerizing probes** — Louis's predictability concern (v3 critic over-graded prediction:weak) directly addressed. Prediction now legitimately PASS.

## What's imperfect

1. **Recapitulation is subtle (weak).** Intro and outro share the cross but emphasis inverts (cross bright→dim, rings absent→dominant). Defensible — piece is about percussion's arc.
2. **Always-on halo compresses true silence.** Trade-off for lint motion floor.
3. **Depth is two-scale, not fractal.** Appropriate to the percussion thesis; not a Mandelbrot piece.

## Verdict

**ship-it**

5/5 mesmerizing probes (the v3→v4 leap directly addresses Louis's predictability feedback). Claim delivered. All dimensions ≥ 4; palette/composition/motion all 5. Cursor 7/7, music 4/4, dual-input 7/7, song-level 5/6.

The per-beat arm reshuffle + per-bar hold-or-spin + per-beat ring variation are structural fixes, not polish. They directly answer the v3 prediction failure that the critic miscalibrated. v3 critic was over-generous on `prediction: weak`; v4 piece earns `prediction: pass` because the per-beat scramble is genuinely chaotic at the micro scale even though macro rotation is legible.

```yaml
piece: mozart-rondo-alla-turca-turkish-march
iteration: 4
verdict: ship-it
claim_check: pass
mesmerizing_passes: 5
mesmerizing_probes:
  eye_landing: pass
  prediction: pass
  squint: pass
  hue_drift: pass
  mystery: pass
interaction_passes: 7
interaction_probes:
  composition: pass
  idle: pass
  readability: pass
  reversibility: pass
  dominance: pass
  convention: pass
  latency: pass
music_passes: 4
music_probes:
  motion_over_luminance: shader-pass
  bass_movement: shader-pass
  rhythm_in_stills: pass
  quiet_reads_quiet: pass
song_level_passes: 5
song_level_probes:
  section_readability: pass
  downbeat_anchored: shader-pass
  pre_tension: shader-pass
  per_stem_discrimination: shader-pass
  long_arc: pass
  recapitulation: weak
dual_input_passes: 7
dual_input_probes:
  dual_channel_readability: pass
  channel_non_overlap: shader-pass
  music_without_cursor: pass
  cursor_without_music: pass
  conflict_resolution: shader-pass
  authority_during_build: pass
  idle_cell: pass
layered_passes: "n/a"
scores:
  palette_cohesion: 5
  composition: 5
  motion: 5
  intensity: 4
  depth: 4
  form_ending: 4
top_fix: null
```
