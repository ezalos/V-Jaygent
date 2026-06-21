# days-without-you — v4 critique (builder) — DESTRUCTION + 3-COLOUR

Louis on v3 (Lenia colony): "the background is nice, but it's not moving enough,
we would like more destructive actions linked to music ... different part
according to the music so the destruction methods evolve ... only orange is too
boooooring, choose 2 more colors." All four addressed.

## What changed

1. **Music-linked DESTRUCTION** — a damage channel (.g) carves the colony, which
   regrows into the scars (a growth↔destruction cycle = far more motion).
2. **Methods evolve per section**: verse/drop → expanding SHOCKWAVE rings; vocal →
   radial CRACKS from a wandering fault; build → a sweeping RIP/slash; climax →
   multi-point SHATTER blasts every beat; outro/fade → global DISSOLUTION burn.
   Idle cycles the methods so it stays alive + varied with no audio.
3. **3 colours by meaning**: TEAL = living colony, AMBER/GOLD = membrane rims,
   MAGENTA→white = destruction front with ORANGE embers in the wake.

## What I see (full-arc audio inspect)

- verse (verse-shockwave.png): teal colony with a clean expanding shockwave void.
- vocal (vocal-cracks.png): teal/cream maze torn by a bright MAGENTA radial-crack
  star — three colours vivid and harmonious.
- build: a magenta rip line sweeps across.
- climax (climax.png): teeming teal colony, shatter blasts flashing on beats.
- outro/fade (fade-dissolution.png): noisy dissolution burning the colony down.
The destruction METHOD is visibly different per section (montage:
destruction-methods-by-section.png).

## Machine checks

- lint-idle: PASS — **mean motion 0.1804** (floor 0.025, ~7×; v3 was 0.096, v1
  0.034). The destruction events decisively fix "not moving enough."
- lint-composition: PASS. metrics gate: PASS (no_blowout + dominant_hues).
- **lint-palette: FAIL — intentional override.** The colony is dominantly teal
  (cool). Louis explicitly asked for more than orange; teal=life / warm(orange+
  magenta)=destruction fits VISION's "cold exception" (cool form + warm with
  physical meaning). Documented override, not a defect.

## Honest weaknesses

- Climax SHATTER reads best in motion (per-beat flashes; a still can land between
  pulses). Shockwave/cracks/rip/dissolution read in stills too.
- The teal colony still leans dense in the energetic body (the structured-sparse
  look is strongest); acceptable — density is the energy arc.

## Verdict (builder): ship-it

Directly addresses every point of Louis's redline: more motion (0.18), music-
linked destruction, per-section destruction vocabulary, and a 3-colour palette
that fits together. Handing to Louis for the verdict.

```yaml
piece: days-without-you
iteration: 4
schema: 2
verdict: ship-it
claim_check: pass
continuity_scale: 0.4s
divergence_scale: 18s
mesmerizing_passes: 8/9
mesmerizing_probes:
  eye_lands: pass
  landing_regions_2_4: pass
  regions_shift: pass
  prediction_continuity: pass
  prediction_divergence: pass
  squint_macro_structure: pass
  fine_texture_reward: pass
  hue_drift: pass            # now teal->magenta->orange across destruction, not locked
  mystery_withheld: pass
interaction_passes: 5/6
interaction_probes:
  composition: pass
  idle: pass
  readability: pass
  reversibility: n/a
  dominance: pass
  convention: pass
  latency: pass
music_passes: 4/4
music_probes:
  motion_over_luminance: pass
  bass_movement: pass
  rhythm_in_stills: pass      # destruction events land on the beat, visible in stills
  quiet_reads_quiet: pass
song_level_passes: 5/6
song_level_probes:
  section_readability: pass   # destruction METHOD differs per section
  downbeat_anchored: pass
  pre_tension: fail
  per_stem_discrimination: pass
  long_arc: pass
  recapitulation: fail
dual_input_passes: 6/7
dual_input_probes:
  dual_channel_readability: pass
  channel_non_overlap: pass
  music_without_cursor: pass
  cursor_without_music: pass
  conflict_resolution: pass
  authority_during_build: fail
  idle_cell: pass
integration_passes: 3/3
integration_probes:
  orphan_event: pass
  pasted_overlay: pass
  perspective_consistency: n/a
  boundary_artifacts: pass
  accretion_causality: pass
dimensions:
  palette_cohesion:
    warm_arc: fail            # intentional: teal+magenta+orange per Louis (cold exception)
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
    multi_octave: pass
    near_far_distinct: pass
    fine_texture: pass
    layer_interaction: n/a
  form_ending:
    has_arc: pass
    ending_differs: pass
    recapitulation: fail
    not_seamless_loop: pass
metrics:
  gate: pass
  idle_motion: 0.1804
  idle_lum: 0.1924
  palette_lint: "fail (intentional teal override per Louis; cold exception)"
harness_gaps:
  - criterion: pre_tension / recapitulation / authority_during_build
    missing: "pre-drop squeeze not wired; fade past 378s + build-cursor not isolated this run"
top_fix: null
evidence:
  - evidence/days-without-you-v4/destruction-methods-by-section.png
  - evidence/days-without-you-v4/verse-shockwave.png
  - evidence/days-without-you-v4/vocal-cracks.png
  - evidence/days-without-you-v4/climax.png
  - evidence/days-without-you-v4/fade-dissolution.png
  - evidence/days-without-you-v4/metrics.json
```
