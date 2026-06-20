# days-without-you — v1 critique (first-person, builder)

**Track:** Days Without You — Satori feat. Miou Amadée (organic house, 80.7 BPM,
C minor, 401s).
**Thesis:** a two-mode Bose–Einstein condensate in a double well (bosonic
Josephson junction). Tunneling between the wells = being together; macroscopic
self-trapping = the days without you. The empty well sits visibly dim.

Declared timescales: **continuity ~0.6 s, divergence ~25 s** (401 s arc, slow
80 BPM organic house → long continuity, medium-long divergence).

## What I see

**Idle sequence (bin/inspect.mjs 10×3, continuous wall-clock, no audio).**
- `frame-00`: the condensate localized in the LEFT well — alone — the bridge
  just beginning to form to the right (the seeded initial state).
- `frame-03`: both wells lit and close, with crisp vertical **de Broglie
  interference fringes** between them — the coherent bridge (together).
- `frame-07`: sloshed to the RIGHT well (right bright, left dim, wells drifted
  apart) — the imbalance has crossed. Over a 30 s window the field visibly goes
  left → balanced-bridge → right, with the well-separation breathing. That is
  real divergence at the declared 25 s scale, driven by the nonlinearity Λ
  crossing the self-trapping threshold (incommensurate idle drive) — not a fixed
  beat period. lint-idle: mean motion 0.0343 > 0.025, mean luminance 0.0515.

**Audio-driven (inspect-interaction matrix-music.mp4, audio playing).**
- The bridge is bright and strongly fringed when vocals couple the wells
  (vocals → K). `audio-driven-bridge.png` is the cleanest frame: four luminous
  cream/amber fringe lobes on near-black — lit, not printed. Confirms the audio
  path drives geometry (coupling), not just glow.

**Section stills (inspect-music — seeked, desynced from the per-frame ODE, so
treat as state samples not section-accurate).** intro reads dim/forming, peak
reads bright-bridge, outro reads dim — the piece produces varied states.

**Cursor (inspect-interaction).** `cursor-idle` = balanced bridge; `cursor-a` =
bridge; `cursor-b` / `cursor-c` = condensate shoved into the right well; the
a→b→a pair returns. The cursor steers the whole junction (drag = bias, height =
coupling) — it reshapes the field, it is not a decal. Latency burst shows the
response at ~frame 6 (≈100 ms).

## FPS

Headless renders at 60 fps (read off the inspect HUD) — headless == live here, no
lag. The two-mode ODE + analytic render is cheap (the earlier full-TDSE attempt
was the slow one; this is not).

## Honest weaknesses

- **Depth / multi-scale is thin.** `one_over_f` and `depth_octaves` metrics fail
  — the piece is two smooth gaussian lobes + one scale of fringes. This is a
  deliberately minimal/elegant form (the two-mode model), but it is the weakest
  dimension and the fair knock against it. The fringes provide *some* fine
  texture reward; broadband fractal depth it does not have.
- **Hue drift is subtle** (phase nudges wine↔amber within the warm band; mostly
  luminance contrast). Present but quiet.
- **Full-song section differentiation is only partly verifiable headlessly**
  (inspect-music seeks → desyncs the per-frame ODE; the 30 s matrix-music clip
  only covers the intro/early verse). The section→Λ regime map is sound in code
  and the seeked stills vary, but a human watch is needed to grade the full arc.

## Ranked fixes (for /vjay-iterate to consider)

1. If depth must rise: add a faint second scale — a dim sub-fringe ripple or a
   low-amplitude probability "halo" texture — without muddying the clean read.
2. Strengthen hue drift slightly (let the self-trapped well redshift toward wine,
   the coupled bridge toward amber) so absence vs connection also reads in hue.
3. Nothing structural — the thesis, idle, cursor, and audio-coupling all land.

## Metrics panel

`bin/aesthetic-metrics.py gate` → PASS (no_blowout + dominant_hues, 0 failures).
`piece` panel: warm_arc / lum_not_hue / dominant_hues / empty_zones / squint /
landing pass; `one_over_f` and `depth_octaves` fail (smooth analytic field).
Full JSON: `evidence/days-without-you-v1/metrics.json`.

```yaml
piece: days-without-you
iteration: 1
schema: 2
verdict: ship-it
claim_check: pass
continuity_scale: 0.6s
divergence_scale: 25s
mesmerizing_passes: 8/9
mesmerizing_probes:
  eye_lands: pass
  landing_regions_2_4: pass
  regions_shift: pass
  prediction_continuity: pass
  prediction_divergence: pass
  squint_macro_structure: pass
  fine_texture_reward: pass        # de Broglie fringes; thin but present
  hue_drift: fail                  # subtle, mostly luminance — honest fail
  mystery_withheld: pass
interaction_passes: 7/7
interaction_probes:
  composition: pass
  idle: pass
  readability: pass
  reversibility: pass              # cursor-aba returns
  dominance: pass
  convention: pass                 # drag = push the condensate
  latency: pass                    # latency burst ~100ms
music_passes: 3/4
music_probes:
  motion_over_luminance: pass      # audio -> K/Lambda/bias (geometry)
  bass_movement: pass              # bass -> coupling K (not glow), verified by code + matrix-music
  rhythm_in_stills: fail           # harness gap — downbeat ring not isolatable in headless
  quiet_reads_quiet: pass          # idle baseline drops to gentle slosh
song_level_passes: 2/6
song_level_probes:
  section_readability: fail        # harness gap — inspect-music seeks, desyncs the ODE
  downbeat_anchored: pass          # ring on downbeat present in code + bar-phase clock
  pre_tension: fail                # u_to_section_change unused
  per_stem_discrimination: pass    # vocals->K, other->Lambda, drums->bias, bass->K (distinct)
  long_arc: fail                   # harness gap — cannot watch full 401s arc headlessly
  recapitulation: fail             # harness gap — same
dual_input_passes: 6/7
dual_input_probes:
  dual_channel_readability: pass
  channel_non_overlap: pass        # cursor=bias/coupling, music=K/Lambda/bias baseline
  music_without_cursor: pass       # matrix-music
  cursor_without_music: pass       # cursor triptych idle
  conflict_resolution: pass        # cursor adds, bounded
  authority_during_build: fail     # harness gap — build section not isolatable cleanly
  idle_cell: pass
keyboard_passes: 3/4
keyboard_probes:
  key_visible: pass                # display flash + junction shove
  key_geometry: pass               # keys shift the imbalance (geometry)
  per_layer: pass                  # junction + display both read u_key_event
  key_polyphony: fail              # harness gap — cannot press keys in headless inspect
layered_passes: n/a                # not a layer-stack (2-pass C architecture)
integration_passes: 5/5
integration_probes:
  orphan_event: pass
  pasted_overlay: pass             # bridge/fringes are intrinsic to |psi|^2
  perspective_consistency: n/a     # no receding plane
  boundary_artifacts: pass         # absorbing edges, no seams
  accretion_causality: pass        # imbalance flows continuously
dimensions:
  palette_cohesion:
    warm_arc: pass
    lum_not_hue: pass
    dominant_hues: pass
    no_collapse: pass
    hue_drift_smooth: fail         # subtle
  composition:
    squint_macro: pass
    landing_regions: pass
    empty_zones: pass
    layout_varies: pass            # well separation + wander
    regions_migrate: pass
  motion:
    trackability: pass
    jerk_smooth: pass
    multi_scale_desync: pass       # slosh + fringe scroll + wander, distinct rates
    never_frozen: pass
    direction_in_quiet: pass
  intensity:
    has_peak: pass                 # coupled bright bridge
    has_quiet: pass                # self-trapped dim
    quiet_flow_drops: pass
    quiet_scale_tightens: pass     # wells drift apart, bridge narrows
    no_blowout: pass
  depth:
    multi_octave: fail             # smooth analytic field (one_over_f, depth_octaves)
    near_far_distinct: fail
    fine_texture: pass             # fringes
    layer_interaction: pass        # bridge cross-term couples the two lobes
  form_ending:
    has_arc: pass                  # section Lambda map (code)
    ending_differs: pass           # fade to single dim lobe
    recapitulation: pass           # returns toward one well like the start
    not_seamless_loop: pass
metrics:
  gate: pass
  one_over_f: fail
  depth_octaves: fail
harness_gaps:
  - criterion: section_readability / long_arc / recapitulation
    missing: "a tool that plays the full 401s audio while the per-frame ODE
      evolves continuously (inspect-music seeks and desyncs state-bearing pieces;
      bin/inspect.mjs has no audio). Needs a live human watch of the full arc."
  - criterion: rhythm_in_stills / authority_during_build
    missing: "isolatable downbeat/build evidence in headless capture"
  - criterion: key_polyphony
    missing: "headless cannot press keyboard keys; key wiring verified by code +
      display flash only"
top_fix:
  dimension: depth
  what: |
    Depth is the honest weak dimension (one_over_f + depth_octaves fail). If
    raising it: add one faint secondary texture scale — a low-amplitude
    probability-halo grain around each lobe or a dim sub-fringe — without
    muddying the clean two-well read.
  why: |
    The piece is two smooth gaussian lobes + one fringe scale; mesmerizing and
    on-thesis but not multi-octave. Everything else lands.
  caution: |
    Do not bury the bridge fringes or the empty-well-as-absence read; the clarity
    IS the thesis. Keep no_blowout + dominant_hues passing.
evidence:
  - evidence/days-without-you-v1/idle-00-start-left.png
  - evidence/days-without-you-v1/idle-03-bridge.png
  - evidence/days-without-you-v1/idle-07-sloshed-right.png
  - evidence/days-without-you-v1/audio-driven-bridge.png
  - evidence/days-without-you-v1/cursor-idle.png
  - evidence/days-without-you-v1/cursor-a-bridge.png
  - evidence/days-without-you-v1/cursor-b-pushed-right.png
  - evidence/days-without-you-v1/sec-intro.png
  - evidence/days-without-you-v1/sec-peak.png
  - evidence/days-without-you-v1/sec-outro.png
  - evidence/days-without-you-v1/metrics.json
```
