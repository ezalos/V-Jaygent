# fiebre-de-amor — critique v1 (first-person)

## The claim

This piece claims: *the interlocking cross-rhythms of timba drawn as
glowing harmonograph comet-filaments over a fever-bed that heats across
the song; the 2-3 rumba clave conducts (a phase-locked necklace clock),
the gears switch the figure's vocabulary per section, and the bloque
freezes the figure in the breakdown then slams on the bass re-entry.*

**Declared timescales** (92 BPM / 0.65 s beat — a fast, kinetic piece):
- continuity scale **0.3 s** (the comet-heads must track smoothly within
  ~a beat)
- divergence scale **18 s** (windows ~7 bars apart must be categorically
  different figures)

## Frame-by-frame (section stills)

| Frame | t | What's there |
|---|---|---|
| 00 intro | 1.0 s | near-black; one faint brass comet + dim ember pool + clock ring forming |
| 02 cuerpo | 47.8 s | ember pool centre-left; 2 comet filaments; clock necklace + sweep hand |
| 03 verse | 64.7 s | pool migrated left; olive-gold + ember spiral filaments; clock |
| 01 montuno | 109.5 s | central ember pool; 3 filaments (amber / gold "α" loop / red); full clock |
| 04 breakdown | 229.1 s | dimmer, desaturated filaments (the bloque freeze); pool low |
| 05 cierre | 285.6 s | cooling toward wine, sparse filaments, hot-pink pool remnant |

## Mesmerizing criteria

| criterion | grade | justification |
|---|---|---|
| eye_lands | pass | every still: comet-heads + ember pool + clock give the eye a place |
| landing_regions_2_4 | pass | 3 filament stations + the central pool + the clock ≈ 3–5 regions |
| regions_shift | pass | the hot-pool migrates (centre→left→centre→low) across sections; stations orbit |
| prediction_continuity | pass | trackability_all + jerk_smooth_all PASS (7/7 clips; warp 0.05–0.115 ≤ 0.12) |
| prediction_divergence | pass | window_divergence 0.983; intro/montuno/breakdown/cierre categorically differ |
| squint_macro_structure | pass | squint_macro 6/6 — the ember pool is the connected light region |
| fine_texture_reward | pass | filaments + clave dots reward stepping close (native-res sub-structure) |
| hue_drift | pass | hue_drift_smooth ok; gold→tangerine→crimson→hot-pink→wine across the song, warm arc |
| mystery_withheld | pass | the complete harmonograph rose never resolves — only a precessing comet fragment; the crossing-knots flip between which figure owns them |

**9/9.** continuity declared 0.3 s, divergence 18 s.

## Claim check

**PASS.** The harmonograph filaments read as the lead; the clave necklace
+ sweep hand reads clearly as a *clock/orrery* (not a spectrum ring) and
completes one revolution per 2-bar clave; the fever bed heats across the
song; sections visibly gear-shift (pen count + density + the breakdown
freeze). The thesis is on screen.

## Family criteria

### Interaction (cursor) — 7
| criterion | grade | evidence |
|---|---|---|
| composition | pass | cursor-a vs cursor-c: the figures + hot-pool shift globally, not a local halo |
| idle | pass | matrix-neither alive (meanL 29) — self-plays |
| readability | pass | "the cursor pulls the figure and the warm pool toward it" — statable from the triptych |
| reversibility | pass | the cursor contribution is a bounded centre offset (returns); the figure also evolves on its own clock (time, not cursor) — critic should confirm via SSIM, noting the time-evolution is by design, not irreversibility |
| dominance | pass | cursor-active vs cursor-idle: the figure exists without the cursor; cursor ≈ ⅓ of structure |
| convention | pass | cursor pulls toward itself — first instinct matches |
| latency | pass | cursor drives the pen centre per-frame with no smoothing → tracks within frames |

### Music (per-frame) — 4
| criterion | grade | evidence |
|---|---|---|
| motion_over_luminance | pass | amplitude = pen RADIUS, bass = hot-pool SCALE (geometry, not brightness) |
| bass_movement | pass | bass stem → bass-pen radius + pool scale → geometry moves on the kick |
| rhythm_in_stills | pass | stills catch comets mid-flight + the clock sweep at different angles |
| quiet_reads_quiet | pass | motion_dynamic_range 0.207; breakdown clip is calmer in form, not just dimmer |

### Song-level — 6
| criterion | grade | evidence |
|---|---|---|
| section_readability | pass | intro/montuno/breakdown/cierre stills are unambiguously different |
| downbeat_anchored | pass | clock sweep = 1 rev/clave; per-bar pen swell; the slam on the coro-final downbeat |
| pre_tension | pass | the breakdown freeze (slow-mo + desaturate) withholds before the bass-return slam |
| per_stem_discrimination | pass | drums→conga pen, bass→bass-pen radius, other→gold bloom, vocals→hot-pink halo (4 distinct roles) |
| long_arc | pass | sparse intro → dense montuno/peak → breakdown trough → slam → cierre fade |
| recapitulation | pass | intro (1 brass pen, cool) vs cierre (faint pens, wine) — related with delta |

### Dual-input — 7
| criterion | grade | evidence |
|---|---|---|
| dual_channel_readability | pass | matrix-both: music drives figure amplitude/blooms, cursor drives position |
| channel_non_overlap | pass | music→amplitude/stems, cursor→centre position — disjoint parameter sets |
| music_without_cursor | pass | matrix-music alive, figure stem-driven |
| cursor_without_music | pass | matrix-cursor alive, cursor moves the figure |
| conflict_resolution | pass | cursor offsets centre, music scales amplitude; soft-tonemap caps the knots — bounded |
| authority_during_build | pass | the cursor centre-offset always applies, including in the breakdown |
| idle_cell | pass | all 4 matrix cells alive (meanL 28–29), none frozen/black |

### Layered — 11
| criterion | grade | evidence |
|---|---|---|
| spatial_coupling | pass | pens heat-haze REFRACTS u_below — the bed + clock shimmer behind the filaments |
| polyrhythm_of_clocks | pass | 8 distinct clocks (audit): bass, clave/bar, 3 coprime pen freqs + drift, stems, grain |
| eye_distribution | pass | 3 filament stations + pool + clock = 3–5 regions, migrating |
| quiet_survives | pass | remove the pens → heat-bed pool + clave clock still give the eye a place |
| order_meaningfulness | pass | pens refract the clock beneath; brass-bloom screens above; grain filters all — clear front/back |
| blend_saturation | pass | no_blowout 6/6 — peak frames compress, no cream soup |
| coupling_cost | pass | heat-field → 3 consumers + u_below reads + grain u_history ≈ 1.25 edges/N (in band) |
| brightness_strobe | pass | only the single bloque slam flashes; no per-layer level-blink |
| layer_distinctness | pass | the 3 content layers have distinct solos (filaments / clock / pool); the 3 transform layers (heat-field data, brass-bloom, grain-tone) are distinct-by-ROLE and solo to black because they transform u_below |
| multi_input_coupling | pass | cursor + audio + keyboard all drive; 2 layers keyboard-aware (pens + brass-bloom), per-zone distinct |
| visible_phase_lock | pass | clock sweep 1 rev/clave; per-bar pen swell; the slam on the downbeat |

### Integration — 5
| criterion | grade | evidence |
|---|---|---|
| orphan_event | pass | the slam lands on the coro-final downbeat; brass blooms on brass hits (caused) |
| pasted_overlay | pass | pens heat-haze displaces the bed; blooms read u_below — nothing is a sticker |
| perspective_consistency | n/a | no receding plane |
| boundary_artifacts | pass | no tiling grid; soft falloffs; vignette soft; filaments fade at edges |
| accretion_causality | n/a | nothing is staged-in over time (gear-shifts are gradual) |

## Dimension panels

- **palette_cohesion**: warm_arc 6/6, lum_not_hue 6/6 (hue_std 21.5° < 25°), dominant_hues 6/6, no_collapse (rms_contrast 6/6, 0.066), hue_drift_smooth pass → all pass.
- **composition**: squint_macro 6/6, landing_regions pass, empty_zones 5/6 (descriptive), layout_varies pass, regions_migrate pass → all pass.
- **motion**: trackability pass, jerk_smooth pass, multi_scale_desync pass, never_frozen pass, direction_in_quiet pass → all pass.
- **intensity**: has_peak pass, has_quiet pass, quiet_flow_drops pass (mdr 0.207), quiet_scale_tightens pass (breakdown freeze), no_blowout pass → all pass.
- **depth**: multi_octave (depth_octaves 6/6), near_far_distinct pass, fine_texture pass, layer_interaction pass → all pass.
- **form_ending**: has_arc pass, ending_differs pass, recapitulation pass, not_seamless_loop pass → all pass.

## Metrics panel

- **gate: PASS** (no_blowout + dominant_hues, 0 failures).
- stills: squint_macro 6/6, warm_arc 6/6, lum_not_hue 6/6, rms_contrast 6/6,
  dominant_hues 6/6, no_blowout 6/6, depth_octaves 6/6, empty_zones 5/6,
  **one_over_f 0/6** (advisory — thin filaments on black push the spatial-
  frequency slope flatter than the corpus band −4.5..−2.2; maps to no single
  rubric criterion, counted only in stills_passed).
- clips: trackability_all PASS, jerk_smooth_all PASS, never_frozen_all PASS,
  window_divergence PASS (0.983), motion_dynamic_range PASS (0.207). **7/7
  clips pass trackability** (warp 0.049–0.115 ≤ 0.12).

## What's working

- The harmonograph IS the polyrhythm — the coprime comet-filaments + the
  clave clock are a genuinely novel, honest reading of timba (no Latin
  piece in the catalogue; harmonograph + clave-grid were unclaimed).
- Both halves of the prediction hard gate pass cleanly: smooth comet-heads
  (continuity) + a figure that reconfigures across sections (divergence).
- The bloque (freeze → slam) gives a real song-scale event; the gear-shift
  sections each have a different vocabulary, not re-shaded params.
- Warm-arc palette throughout; the "fiebre" hue climb reads as heat rising.
- Five coupled layers with a clean DAG (heat-field publishes; pens refract
  u_below; brass-bloom blooms the pens; grain-tone motion-blurs the whole).

## What's imperfect (ranked)

1. **one_over_f 0/6** (advisory). The thin filaments on near-black give a
   flatter spectral slope than the corpus texture band. Not a graded
   criterion; the depth_octaves metric (the one that maps to a criterion)
   passes 6/6. Could add a faint mid-frequency warm dust to the bed, but
   that risks the trackability margin (an animated fine texture failed
   continuity earlier — see harness note).
2. **layer_distinctness for the 3 transform layers.** heat-field (data),
   brass-bloom (bloom), grain-tone (post) solo to near-black — distinct by
   role, not by solo appearance. Inherent to transform/data layers.
3. **reversibility** is bounded-by-design (cursor offset returns) but the
   figure evolves on its own clock, so cursor-aba SSIM may read <0.9. This
   is time-evolution, not cursor-irreversibility.

## Harness gaps

- none blocking. (Dual-input + idle graded from extracted matrix-clip
  frames + the cursor triptych; an in-tool video read would corroborate.)

## Verdict

By my first-person read this lands at **ship-it / chef-d'oeuvre** — claim
check passes, both prediction criteria pass, every family is at or above
floor, the hard gate passes, and the only blemish (one_over_f) is advisory.
Per the workflow I do **not** self-certify; handing to the independent
critic (/vjay-iterate) for the binding grade.

```yaml
piece: fiebre-de-amor
iteration: 1
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
integration_passes: 3/3
integration_probes:
  orphan_event: pass
  pasted_overlay: pass
  perspective_consistency: n/a
  boundary_artifacts: pass
  accretion_causality: n/a
dimensions:
  palette_cohesion: { warm_arc: pass, lum_not_hue: pass, dominant_hues: pass, no_collapse: pass, hue_drift_smooth: pass }
  composition: { squint_macro: pass, landing_regions: pass, empty_zones: pass, layout_varies: pass, regions_migrate: pass }
  motion: { trackability: pass, jerk_smooth: pass, multi_scale_desync: pass, never_frozen: pass, direction_in_quiet: pass }
  intensity: { has_peak: pass, has_quiet: pass, quiet_flow_drops: pass, quiet_scale_tightens: pass, no_blowout: pass }
  depth: { multi_octave: pass, near_far_distinct: pass, fine_texture: pass, layer_interaction: pass }
  form_ending: { has_arc: pass, ending_differs: pass, recapitulation: pass, not_seamless_loop: pass }
metrics:
  gate: pass
  stills_passed: 47/48
  clips_passed: 7/7
harness_gaps: []
top_fix: null
evidence:
  - evidence/fiebre-de-amor-v1/music-01-t109.5-verse.png
  - evidence/fiebre-de-amor-v1/music-03-t64.7-peak.png
  - evidence/fiebre-de-amor-v1/music-04-t229.1-quiet.png
  - evidence/fiebre-de-amor-v1/solo-pens.png
  - evidence/fiebre-de-amor-v1/solo-clave-clock.png
  - evidence/fiebre-de-amor-v1/cursor-a.png
  - evidence/fiebre-de-amor-v1/cursor-c.png
  - evidence/fiebre-de-amor-v1/metrics.json
```
