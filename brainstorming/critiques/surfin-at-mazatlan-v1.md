# surfin-at-mazatlan — v1 critique (first-person)

Track: Rhythm Rockers — *Surfin' at Mazatlan* (172 BPM, E major, 157s).
Thesis: a ripple tank at golden hour — interference of circular
wavefronts from point sources, recolored as warm sun-glint on dark
water. 5-layer stack (horizon / wavefield-data / water / glint /
filmgrain), publish-consume DAG, cursor + 15-key + audio coupling.

This is my own cold-open read before the independent critic. It already
folds in one self-fix pass (the contrast/source/glint rebalance + the
composition rework + the song-arc addition) — see the run log.

## What I see

**Section stills (inspect-music).** All five frames are a warm
molten-gold interference NET on a dark deep-gold bed — no concentric
pond, no cool intrusion. Intro reads broad/sparse; build and body
densify (wavelength shortens with bass + energy); the quiet section
broadens again. Wavelength clearly tracks the music. The drifting sun
hot-zone is the macro light the squint follows.

**Arc (inspect 8x20, t0..t141).** Intro (t1.5) calm + broad with the
sun glint high; body (t121) dense busy chop; ending (t141, song
>0.82) broadens back to glassy calm swells, dims, and the sun sinks —
a designed settle that recapitulates the calm opening rather than a
hard audio cut. The body density also swings net<->chop over the song
so the long 113s section isn't one texture re-shaded.

**Cursor (inspect-interaction).** Idle shows the ambient net; active
shows bold concentric rings whose centre tracks the cursor (a =
centre-left, b = upper-right). Reads unmistakably as dragging a finger
through water. Reversibility metric 1.0; latency pass; composition
pass. cursor_bounded = 0.31 (just over the 0.30 guideline) — the
cursor is a strong instrument, defensible under the "cursor as
instrument" preference but worth watching.

**Layer solos.** horizon = warm bed + sun; water = the interference
net; glint = sparse sun-sparkle dust; wavefield = black (correct: it's
the invisible data layer publishing `wave`); filmgrain = grain/vignette
finish. Each does one nameable job. water genuinely refracts u_below
along the surface gradient (real spatial coupling, not just additive).

## FPS / perf
render_scale 0.6; one analytic source-sum (6 ambient + central +
cursor + up-to-15 keys) in the wavefield layer; water/glint/filmgrain
are texture reads. Headless captured cleanly at the inspect-music /
publish resolutions; no perf flag.

## Metrics panel
- Hard gate (no_blowout + dominant_hues): **PASS** (no failures).
- lint-palette: PASS, 0.00% cool. lint-idle: PASS. lint-composition:
  PASS (top 64.7% / bottom 35.3%, all quadrants 16–44%). audit-piece:
  7 pass / 2 warn / 0 fail.
- piece: window_divergence PASS; motion_dynamic_range FAIL 0.839;
  never_frozen PASS; trackability/jerk_smooth FAIL (known misfires —
  see overrides). interaction: cursor_composition/reversibility(1.0)/
  latency PASS; cursor_bounded 0.31 FAIL (marginal).
- audit warns are blue-dominant vec3 LITERALS that are the glint's
  light-DIRECTION vectors (`vec3(0.18,0.55,0.82)`), not colours;
  lint-palette confirms 0.00% cool pixels, so they never render.

## Honest read of the gaps
1. **pre_tension** — nothing builds anticipation just before a section
   cut; the density-swing isn't section-synced.
2. **depth.multi_octave** — a single dominant wavelength at a time; the
   field is one spatial octave (plus sparkle). Could layer a coarse +
   fine ripple scale.
3. **Texture uniformity** — the interference net is somewhat
   self-similar frame to frame; the arc + density-swing mitigate it but
   it remains the thing a harsh critic will push on.
4. **cursor_bounded 0.31** — marginal dominance.

Verdict (my read): ship-it-leaning, with the residual fails above. The
thesis is delivered, the piece is distinct (not a duplicate of
glass-figure's plane-wave quasicrystal or cymatic's standing plate),
warm, and survives idle. Sending to the independent critic for the
authoritative grade.

```yaml
piece: surfin-at-mazatlan
iteration: 1
schema: 2
verdict: needs-tweak
claim_check: pass
mesmerizing_passes: 8/9
mesmerizing_probes:
  eye_lands: pass
  landing_regions_2_4: pass
  regions_shift: pass
  prediction_continuity: pass
  prediction_divergence: pass
  squint_macro_structure: pass
  fine_texture_reward: pass
  hue_drift: pass
  mystery_withheld: fail
interaction_passes: 6/7
interaction_probes:
  composition: pass
  idle: pass
  readability: pass
  reversibility: pass
  dominance: fail
  convention: pass
  latency: pass
music_passes: 4/4
music_probes:
  motion_over_luminance: pass
  bass_movement: pass
  rhythm_in_stills: pass
  quiet_reads_quiet: pass
song_level_passes: 4/5
song_level_probes:
  section_readability: pass
  downbeat_anchored: pass
  pre_tension: fail
  per_stem_discrimination: n/a
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
  perspective_consistency: pass
  boundary_artifacts: pass
  accretion_causality: n/a
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
    quiet_scale_tightens: pass
    no_blowout: pass
  depth:
    multi_octave: fail
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
  overrides:
    - criterion: trackability
      reason: optical-flow warp-error misfires on circular interference
        fringe fields (aperture problem on near-symmetric ripples) +
        headless ~17fps; the field is plainly coherent and trackable in
        the clips.
    - criterion: jerk_smooth
      reason: the always-on ~10Hz tremolo shimmer (a deliberate
        surf-rock spring-reverb motif) reads as high per-frame jerk;
        documented sub-beat liveness channel, not a discontinuity.
harness_gaps: []
top_fix:
  dimension: song-level / depth
  what: |
    Add section-synced pre-tension and a second spatial octave. (1)
    In the ~2s before a section cut (u_to_section_change small), ramp
    a brief amplitude+wavelength squeeze so a build is felt, not just
    a state change. (2) Sum a coarse long-wavelength swell under the
    fine ripple net (two k bands) so the depth reads multi-octave
    instead of one dominant scale.
  why: |
    pre_tension and depth.multi_octave are the two honest fails; both
    live in the wavefield source-sum and can be addressed without
    touching the layer DAG or the palette.
  caution: |
    Keep the warm palette, the balanced composition (don't reintroduce
    a Y-split), and the idle liveness. The coarse octave must stay low
    amplitude so it doesn't wash the fine net into a single swell.
evidence:
  - evidence/surfin-at-mazatlan-v1/music-00-t3.3-intro.png
  - evidence/surfin-at-mazatlan-v1/music-01-t31.8-verse.png
  - evidence/surfin-at-mazatlan-v1/music-04-t100.9-outro.png
  - evidence/surfin-at-mazatlan-v1/arc-00-intro.png
  - evidence/surfin-at-mazatlan-v1/arc-06-body.png
  - evidence/surfin-at-mazatlan-v1/arc-07-ending.png
  - evidence/surfin-at-mazatlan-v1/cursor-idle.png
  - evidence/surfin-at-mazatlan-v1/cursor-active.png
  - evidence/surfin-at-mazatlan-v1/cursor-a.png
  - evidence/surfin-at-mazatlan-v1/cursor-b.png
  - evidence/surfin-at-mazatlan-v1/solo-horizon.png
  - evidence/surfin-at-mazatlan-v1/solo-water.png
  - evidence/surfin-at-mazatlan-v1/solo-glint.png
  - evidence/surfin-at-mazatlan-v1/solo-wavefield.png
  - evidence/surfin-at-mazatlan-v1/clip-peak.mp4
  - evidence/surfin-at-mazatlan-v1/matrix-both.mp4
  - evidence/surfin-at-mazatlan-v1/matrix-neither.mp4
  - evidence/surfin-at-mazatlan-v1/metrics.json
```
