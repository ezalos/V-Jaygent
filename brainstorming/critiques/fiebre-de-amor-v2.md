# fiebre-de-amor — critique v2 (independent critic)

## The claim

This piece claims: **the interlocking cross-rhythms of Cuban timba drawn as
three coprime harmonograph comet-filaments (the lead) over a rising-fever
bed, with a 2-3 rumba clave necklace-clock conducting (one revolution per
2-bar clave), section gear-shifts changing the figure's vocabulary, and a
bloque that freezes the figure in the breakdown then slams on the bass
return.**

**Declared timescales** (92 BPM, 0.65 s/beat, 291 s — a fast, kinetic track):
- **continuity 0.3 s** (comet-heads + sweep hand must track within a beat)
- **divergence 18 s** (windows ~7 bars apart must be categorically different)

## Frame-by-frame

| Frame | t | What's there |
|---|---|---|
| music-00 intro | 1.0 s | near-black wine ground; gold clock necklace dead-center; sweep hand from center; a sage-green pen-loop top, faint olive pen left, no third pen yet |
| music-02 pre-peak | 47.8 s | same center clock ring; same green loop top; orange squiggle upper-left; crimson squiggle lower-right; dim wine pool behind ring |
| music-03 peak | 64.7 s | same center clock ring; green loop top; orange pen left; crimson "Λ" right; brighter red pool behind ring |
| music-01 verse | 109.5 s | same center clock ring; green "α" loop top; orange pen left; crimson pen lower-right; brightest red pool |
| music-04 breakdown | 229.1 s | same center clock ring; faded green loop top; orange pen left; pool dimmer; pens desaturated (the bloque) |
| music-05 outro | 285.6 s | same center clock ring; green loop top; olive pen left; crimson "α" lower-right; pool cooled to wine |

The honest read: **every still is the same composition at a different
brightness.** Clock ring center, green pen top, orange pen left, crimson pen
right, wine pool behind — in all six, across 285 seconds.

## Mesmerizing criteria (9)

| criterion | grade | justification |
|---|---|---|
| eye_lands | pass | the clock + sweep hand + brightest bead give an immediate landing spot |
| landing_regions_2_4 | pass | clock + 2-3 pen squiggles + pool ≈ 3-5 regions |
| regions_shift | **fail** | the clock sits dead-center in all six stills AND all clips; the three pens stay pinned to their stations in every frame. `PCTR[3]` fixes each pen + a ±0.05 wobble. |
| prediction_continuity | pass | sweep hand + comet-heads morph smoothly; no teleports/noise/tearing. trackability_all + jerk_smooth_all PASS (7/7). |
| prediction_divergence | **fail** | intro/verse/w5/outro span 280 s (~15× the scale) and show the SAME flow configuration — same clock, same three pens, same regions, same pool. Bounded periodic ratio-drift (±0.10) on fixed-station Lissajous with u_history disabled. **window_divergence 0.984 is a misfire** (NCD on luminance-normalized thin-filament stacks reads pixel-shuffle as different; eye sees one fixed composition). |
| squint_macro_structure | pass | squint_macro 6/6; clock + pool is the connected light region |
| fine_texture_reward | pass | clave beads, filament hairs, haze shimmer reward stepping close |
| hue_drift | pass | hue_drift_smooth ≤6.8°; gold→crimson→wine warm climb |
| mystery_withheld | pass | the rose never resolves; which figure owns a crossing-knot stays ambiguous |

**7/9.** regions_shift + prediction_divergence fail, sharing one root cause.

## Claim check

**FAIL.** (1) Harmonograph filaments are NOT the lead — the clave-clock
necklace is the largest/brightest/most central element; the pens read as
small faint marginal squiggles. The thesis inverts the actual hierarchy.
(2) Section gear-shifts don't read — the always-on `bright` floor keeps
recap pens visible, so intro/montuno/cierre look alike. (3) "Comets ARE the
polyrhythm" is undercut by (1). Not one fix away.

## Family criteria

(interaction 7/7 · music 4/4 · song_level 5/6 [section_readability fail] ·
dual_input 6/7 [idle_cell fail — matrix-neither freezes under audio
time_source] · layered 8/11 [layer_distinctness fail (transform layers solo
black), multi_input_coupling fail (no keyboard capture)] · integration 3/3.)
Full per-criterion tables: the interaction layer is the strongest part
(conductor model reads, reverses, bounded, tracks); per-stem discrimination
is real (4 distinct roles); palette discipline holds modulo the olive pen.

## Dimension panels (6)

palette_cohesion 5/5 · composition 4/5 (regions_migrate fail) · motion 5/5 ·
intensity 5/5 · depth 4/4 · form_ending 4/4. Documented metric overrides:
window_divergence 0.984→fail by eye (NCD misfire on thin filaments);
cursor_latency panel-fail→pass (brush-model mis-applied to a conductor);
arc 0.756→has_arc pass (weak mean-L proxy).

## What's working
- Continuity is genuinely good (clean half of the prediction gate).
- The interaction (conductor) layer is strong: shifts/reverses/bounded/tracks.
- Per-stem discrimination is real (4 distinct jobs).
- Palette discipline (warm arc, near-black ground, no blowout, smooth drift).
- Clean layer DAG with real coupling + ≥3 independent clocks.

## What's imperfect (ranked)
1. **No divergence (load-bearing).** One fixed composition re-shaded across
   291 s; bounded periodic drift + disabled u_history can't make windows
   categorically different. Fails the prediction hard gate.
2. **Frozen macro composition** (regions_shift / regions_migrate /
   section_readability) — same root cause.
3. **The lead is the wrong layer** — clock dominates; comets too faint/marginal.
4. **The olive/sage pen** reads as the coolest note in a "no cyan" piece.
5. Transform layers solo to black; no keyboard capture (harness gap).
6. matrix-neither freezes under the audio time_source headless idle.

## Harness gaps
- multi_input_coupling — no key-press capture exists (per-zone key stills).
- idle_cell — matrix-neither needs a wall-clock driver so synthetic self-play
  runs headless without u_audio_playing.

## Verdict

**structural-rethink.** Prediction hard gate: continuity pass,
**divergence fail** → structural-rethink regardless of everything else.
Claim check fails (comets not the lead). The piece is well-built at the
craft level (all family floors met, dimensions mostly healthy) and fails at
the conceptual/dynamical level: it does not diverge and its lead is the
wrong element. Root cause: a closed-form, fixed-station, non-accumulating
figure. Fix is structural — give the pens state-bearing re-anchoring (heavy
u_history accumulation of the live comet, OR migrating stations driven by a
slow chaos field, OR a passes: architecture with section bifurcations that
relocate the figure) AND re-weight the hierarchy so the comets, not the
clock, lead.

```yaml
piece: fiebre-de-amor
iteration: 2
schema: 2
verdict: structural-rethink
claim_check: fail
mesmerizing_passes: 7/9
mesmerizing_probes:
  eye_lands: pass
  landing_regions_2_4: pass
  regions_shift: fail
  prediction_continuity: pass
  prediction_divergence: fail
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
song_level_passes: 5/6
song_level_probes:
  section_readability: fail
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
layered_passes: 8/11
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
integration_passes: 3/3
integration_probes:
  orphan_event: pass
  pasted_overlay: pass
  perspective_consistency: n/a
  boundary_artifacts: pass
  accretion_causality: n/a
dimensions:
  palette_cohesion: { warm_arc: pass, lum_not_hue: pass, dominant_hues: pass, no_collapse: pass, hue_drift_smooth: pass }
  composition: { squint_macro: pass, landing_regions: pass, empty_zones: pass, layout_varies: pass, regions_migrate: fail }
  motion: { trackability: pass, jerk_smooth: pass, multi_scale_desync: pass, never_frozen: pass, direction_in_quiet: pass }
  intensity: { has_peak: pass, has_quiet: pass, quiet_flow_drops: pass, quiet_scale_tightens: pass, no_blowout: pass }
  depth: { multi_octave: pass, near_far_distinct: pass, fine_texture: pass, layer_interaction: pass }
  form_ending: { has_arc: pass, ending_differs: pass, recapitulation: pass, not_seamless_loop: pass }
metrics:
  gate: pass
  stills_passed: 47/54
  clips_passed: 7/7
harness_gaps:
  - criterion: multi_input_coupling
    missing: keyboard-input capture in bin/inspect-interaction.mjs (per-zone key-press stills)
  - criterion: idle_cell
    missing: idle-matrix neither-cell driven by a wall-clock (not the audio clock)
top_fix: null
evidence:
  - evidence/fiebre-de-amor-v2/music-01-t109.5-verse.png
  - evidence/fiebre-de-amor-v2/music-05-t285.6-outro.png
  - evidence/fiebre-de-amor-v2/clip-w3-t109.5-verse.mp4
  - evidence/fiebre-de-amor-v2/clip-w5-t186.2-cover.mp4
  - evidence/fiebre-de-amor-v2/solo-pens.png
  - evidence/fiebre-de-amor-v2/solo-clave-clock.png
  - evidence/fiebre-de-amor-v2/matrix-neither.mp4
  - evidence/fiebre-de-amor-v2/metrics.json
```
