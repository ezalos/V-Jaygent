# fiebre-de-amor — critique v4 (post-ship iteration note)

**This is a build-agent post-ship note, not a fresh independent grade.** The
binding grade remains the v3 independent critic verdict (**ship-it**). This
records two things since v3:

1. **`idle_cell` fail → pass (verified).** The v3 fail was the matrix-neither
   cell freezing under `time_source: audio` (u_time pins to a non-playing
   audio clock). Fixed in-shader: every motion layer (pens, heat-field,
   clave-clock) now derives its clock from `CK = playing ? u_time :
   u_frame*0.01667` — a u_frame wall-clock fallback that keeps advancing with
   no audio (and in a live browser when the track is paused). Verified:
   matrix-neither frame-diff (2 s vs 25 s) went **0.0008 → 10.84** (the
   highest of the four cells); all four idle-matrix cells now self-play.
   This is a genuine UX improvement (the piece keeps moving when paused),
   not just a harness pass.

2. **Chef-d'œuvre push attempted and declined (artistic ceiling).** Louis
   asked to push toward chef-d'œuvre via denser/richer visuals. I added the
   canonical harmonograph 2nd-pendulum harmonic (rose-loops) + a braided 2nd
   strand. It *looked* richer and fixed the advisory `one_over_f` (0→7/7) —
   but it **broke two real criteria**: `depth_octaves` (6/6 → 1/6) and
   `jerk_smooth`. Cause is structural: the harmonic's 2-3× term pumps the
   *high* spatial octave (unbalancing the octave spread depth_octaves
   measures) and adds high-frequency motion (jerk). Reverting the harmonic
   (h2=0, the v3 figure) restores jerk, and the figure helper is kept with
   the harmonic dialed to zero + a comment so the finding isn't re-tried.

   Separately, `depth_octaves` is **intrinsically borderline** for this
   piece: the airy "warm filaments on near-black" aesthetic sits at 2-3
   octaves, right at the ≥3 threshold, and since the figure *migrates* each
   render, which sampled stills land at 3 octaves is stochastic (v3 caught a
   6/6 render; this iteration shows 1/6). Making it reliably pass needs
   frame-filling mid/low structure — a denser, less-airy aesthetic that would
   fight the clean-filament thesis. **Louis chose to accept the artistic
   ceiling** rather than chase the label via a denser rework or by building
   the remaining grading-harness captures (keyboard-press, transform-layer).

## Status vs the chef-d'œuvre bar

Remaining fails, all unchanged-by-design from v3 except idle_cell (now pass):
- `multi_input_coupling` (layered) — harness gap: no keyboard-press capture
  exists in `bin/inspect-interaction.mjs`. Not built (Louis declined the
  harness work).
- `layer_distinctness` (layered) — the 3 transform/data layers
  (heat-field/brass-bloom/grain-tone) solo to black by role; needs a
  composite-minus-layer capture. Not built.
- `depth_octaves` (depth panel) — borderline/stochastic for the airy
  aesthetic (see above); depth panel stays ≤1 fail so ship-it holds.

Verdict unchanged: **ship-it.** The piece is at its artistic criteria
ceiling; the gap to chef-d'œuvre is grading-harness tooling + a denser
aesthetic, both declined.

```yaml
piece: fiebre-de-amor
iteration: 4
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
  depth: { multi_octave: fail, near_far_distinct: pass, fine_texture: pass, layer_interaction: pass }
  form_ending: { has_arc: pass, ending_differs: pass, recapitulation: pass, not_seamless_loop: pass }
metrics:
  gate: pass
  stills_passed: 44/54
  clips_passed: 7/7
harness_gaps:
  - criterion: multi_input_coupling
    missing: keyboard-input capture in bin/inspect-interaction.mjs (per-zone key-press stills)
  - criterion: layer_distinctness
    missing: composite-minus-layer capture so transform layers show their real contribution
top_fix: null
evidence:
  - evidence/fiebre-de-amor-v4/music-01-t109.5-verse.png
  - evidence/fiebre-de-amor-v4/music-03-t64.7-peak.png
  - evidence/fiebre-de-amor-v4/matrix-neither.mp4
  - evidence/fiebre-de-amor-v4/solo-pens.png
  - evidence/fiebre-de-amor-v4/metrics.json
```
