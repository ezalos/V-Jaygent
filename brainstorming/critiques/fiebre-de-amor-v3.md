# fiebre-de-amor — critique v3 (independent critic)

## The claim

This piece claims: **the interlocking cross-rhythms of Cuban timba drawn as
three coprime harmonograph comet-filaments that LEAD the frame, over a
rising-fever bed; a 2-3 rumba clave necklace-clock conducting from the
lower-left corner; section gear-shifts that RELOCATE the figure to new
regions; and a bloque that freezes the figure in the breakdown then SLAMS on
the bass return.**

**Declared timescales** (92 BPM, ~0.65 s/beat, 291 s — fast, kinetic):
- **continuity 0.3 s** · **divergence 18 s**

Iteration 3, a structural revision answering the v2 `structural-rethink`.
Each claimed change verified independently against captures before grading.

## Frame-by-frame

| Frame | t | What's there | Figure region (vs v2) |
|---|---|---|---|
| music-00 intro | 1.0 s | ONE faint brass comet lower-center-right; clock shrunk to lower-LEFT corner; near-empty top; dim wine pool | sparse, brass alone |
| music-02 pre-peak | 47.8 s | gold "leaf" comet UPPER-center; clock lower-left; magenta pool lower-right | figure top |
| music-03 peak | 64.7 s | crimson "Λ" comet UPPER-RIGHT; gold ring MID-LEFT; clock corner; red pool upper-left | upper-right + mid-left |
| music-01 verse | 109.5 s | pink + gold comets TOP; gold ring LOWER-RIGHT; clock corner; red pool center | top + lower-right |
| music-04 breakdown | 229.1 s | gold rings MID/LOWER-RIGHT (bloque, desaturating); clock corner; pink pools center | figure right |
| music-05 outro | 285.6 s | ONE gold brass comet UPPER-center-right; clock corner; cooled wine | sparse, brass alone |

The v2 fail sentence — "every still is the same composition" — **no longer
holds.** The clock is a small dim corner metronome; the comet figure occupies
genuinely different regions per section. The macro layout migrates.

## Mesmerizing criteria (9) — 9/9

eye_lands pass · landing_regions_2_4 pass · **regions_shift pass** (figure in
categorically different regions across the six stills; layout_varies 0.429) ·
prediction_continuity pass (trackability_all + jerk_smooth_all PASS 7/7,
warp 0.10-0.12; bursts smooth, no teleport/static) · **prediction_divergence
pass** (w3/w4/w5 at 40 s/37 s apart show categorically different
configurations; window_divergence min_ncd 0.981; migration engine confirmed —
no override needed this time) · squint_macro_structure pass (6/6) ·
fine_texture_reward pass (clave beads + filament hairs + haze; thinner than
the dense fractal reference corpus) · hue_drift pass (steps ≤6.8°) ·
mystery_withheld pass (comet never resolves; figure-vs-pool depth flips).

**Both prediction criteria pass — the hard gate is cleared; both v2 fails fixed.**

## Claim check — PASS

1. **Comets LEAD** — solo-pens max 241 owning center; solo-clave-clock mean
   0.27 in the dim corner (clockCtr -0.56,-0.30, R 0.16, ×0.42). v2 inversion fixed.
2. **Gear-shifts relocate** — stationHome(sec) per-section home, smoothed
   across the boundary; layout_varies 0.429.
3. **Sparse intro/cierre** — penActive: sec<3 brass alone, montuno..pregón all
   three, cierre 0.45 brass. Intro/outro clips show ONE comet.
4. **Bloque freeze→slam** — freqScale mix(1,0.10,bloque) sec6 + slam sec7.
5. **Warm arc, no cyan** — warm_arc 6/6; brass pen warmed off olive.

## Family criteria

- **Interaction 7/7** — composition/idle/readability/reversibility/dominance/
  convention pass; latency pass (documented override: conductor model, not a
  brush — figure responds within ~3 frames f05→f09).
- **Music 4/4** — motion_over_luminance, bass_movement, rhythm_in_stills,
  quiet_reads_quiet all pass (motion_dynamic_range 0.187).
- **Song-level 6/6** — section_readability NOW pass (distinct counts + station
  migration); downbeat_anchored, pre_tension, per_stem_discrimination (4 roles),
  long_arc, recapitulation pass.
- **Dual-input 6/7** — all pass except idle_cell fail (matrix-neither frozen:
  headless pins u_time to a non-playing audio clock — harness gap).
- **Layered 9/11** — all pass except layer_distinctness fail (3 transform/data
  layers solo to black by role) + multi_input_coupling fail (no keyboard capture
  exists — harness gap).
- **Integration 4/4** (perspective_consistency n/a).

## Dimension panels — all six ≤1 fail (0 after documented overrides)

palette_cohesion 5/5 · composition 5/5 (regions_migrate NOW pass; empty_zones
override — descriptive metric) · motion 5/5 · intensity 5/5 (arc 0.756 weak
proxy → has_peak/has_arc pass by ordered-still eye) · depth 4/4 ·
form_ending 4/4.

## Metrics panel

gate PASS. Stills: rms_contrast/squint_macro/no_blowout/depth_octaves/
warm_arc/lum_not_hue/dominant_hues all PASS; empty_zones FAIL (descriptive),
one_over_f FAIL (advisory). Piece: **layout_varies 0.429 PASS** (the headline
v2→v3 fix), hue_drift_smooth PASS, arc 0.756 FAIL (weak proxy, overridden).
Clips: trackability_all/jerk_smooth_all/never_frozen_all/window_divergence
(0.981)/motion_dynamic_range all PASS — 7/7.

Documented overrides: arc→has_arc (eye over weak proxy); empty_zones (demoted
to descriptive); cursor_latency (conductor not brush). **window_divergence: no
override needed in v3** — in v2 it was overridden DOWN (frozen layout, NCD
read pixel-shuffle); v3's layout genuinely migrates so eye + metric agree.

## What's working

- The structural fix is real: layout_varies frozen→0.429; figure in different
  regions across stills + the w3/w4/w5 windows; divergence passes on eye AND
  metric, no override.
- The comets now lead (solo-pens max 241 vs solo-clock mean 0.27 in the corner).
- Sections read distinct (penActive counts + station migration).
- Continuity stayed clean through the rethink (removing u_history + adding
  migration introduced no noise — 7/7 still).
- Craft holds: warm arc (olive fixed), no blowout, smooth hue drift, ≥3
  independent clocks, real coupling, 4 stem roles, bloque freeze→slam.

## What's imperfect (ranked)

1. idle_cell — matrix-neither freezes (headless audio-clock pin). Harness gap.
2. layer_distinctness — 3 transform layers solo to black (by role).
3. multi_input_coupling — keyboard untestable (no key-press capture).
4. Sparser than the chef-d'oeuvre corpus (airy filaments over near-black) —
   a taste note, not a fail.

## Harness gaps

- idle_cell — needs a wall-clock-driven neither-cell so synthetic self-play
  runs headless without u_audio_playing.
- multi_input_coupling — needs keyboard-input capture in inspect-interaction.mjs.
- layer_distinctness (contributing) — a composite-minus-layer capture so
  transform layers show their real contribution instead of soloing to black.

## Verdict

**ship-it.** Claim check PASS; prediction hard gate PASS/PASS (divergence now
agrees eye+metric); mesmerizing 9/9; every family floor met; all six
dimension panels ≤1 fail; total failed criteria 3 — all harness-gap / by-role,
named in harness_gaps. The structural rethink succeeded: the piece now
diverges, the comets lead, the sections read — without breaking the continuity
that was already good. Not chef-doeuvre (3 fails + non-zero harness_gaps, two
of which are capture-tooling not shader defects). Don't polish further; the
right next move is building the missing captures, not editing the shader.

```yaml
piece: fiebre-de-amor
iteration: 3
schema: 2
verdict: ship-it
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
interaction_passes: 7/7
interaction_probes:
  composition: pass
  idle: pass
  readability: pass
  reversibility: pass
  dominance: pass
  convention: pass
  latency: pass
music_passes: 4/4
music_probes:
  motion_over_luminance: pass
  bass_movement: pass
  rhythm_in_stills: pass
  quiet_reads_quiet: pass
song_level_passes: 6/6
song_level_probes:
  section_readability: pass
  downbeat_anchored: pass
  pre_tension: pass
  per_stem_discrimination: pass
  long_arc: pass
  recapitulation: pass
dual_input_passes: 6/7
dual_input_probes:
  dual_channel_readability: pass
  channel_non_overlap: pass
  music_without_cursor: pass
  cursor_without_music: pass
  conflict_resolution: pass
  authority_during_build: pass
  idle_cell: fail
layered_passes: 9/11
layered_probes:
  spatial_coupling: pass
  polyrhythm_of_clocks: pass
  eye_distribution: pass
  quiet_survives: pass
  order_meaningfulness: pass
  blend_saturation: pass
  coupling_cost: pass
  brightness_strobe: pass
  layer_distinctness: fail
  multi_input_coupling: fail
  visible_phase_lock: pass
integration_passes: 4/4
integration_probes:
  orphan_event: pass
  pasted_overlay: pass
  perspective_consistency: n/a
  boundary_artifacts: pass
  accretion_causality: pass
dimensions:
  palette_cohesion: { warm_arc: pass, lum_not_hue: pass, dominant_hues: pass, no_collapse: pass, hue_drift_smooth: pass }
  composition: { squint_macro: pass, landing_regions: pass, empty_zones: pass, layout_varies: pass, regions_migrate: pass }
  motion: { trackability: pass, jerk_smooth: pass, multi_scale_desync: pass, never_frozen: pass, direction_in_quiet: pass }
  intensity: { has_peak: pass, has_quiet: pass, quiet_flow_drops: pass, quiet_scale_tightens: pass, no_blowout: pass }
  depth: { multi_octave: pass, near_far_distinct: pass, fine_texture: pass, layer_interaction: pass }
  form_ending: { has_arc: pass, ending_differs: pass, recapitulation: pass, not_seamless_loop: pass }
metrics:
  gate: pass
  stills_passed: 49/54
  clips_passed: 7/7
harness_gaps:
  - criterion: idle_cell
    missing: idle-matrix neither-cell driven by a wall-clock (not the audio clock)
  - criterion: multi_input_coupling
    missing: keyboard-input capture in bin/inspect-interaction.mjs (per-zone key-press stills)
  - criterion: layer_distinctness
    missing: composite-minus-layer capture so transform layers show their real contribution
top_fix: null
evidence:
  - evidence/fiebre-de-amor-v3/music-03-t64.7-peak.png
  - evidence/fiebre-de-amor-v3/music-01-t109.5-verse.png
  - evidence/fiebre-de-amor-v3/clip-w3-t109.5-verse.mp4
  - evidence/fiebre-de-amor-v3/clip-w5-t186.2-cover.mp4
  - evidence/fiebre-de-amor-v3/solo-pens.png
  - evidence/fiebre-de-amor-v3/solo-clave-clock.png
  - evidence/fiebre-de-amor-v3/matrix-neither.mp4
  - evidence/fiebre-de-amor-v3/metrics.json
```
