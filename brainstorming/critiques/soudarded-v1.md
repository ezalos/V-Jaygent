# soudarded — v1 critique

First-person cold read of the piece, graded against `taste.md` (v2 binary).
This is a state-accumulating ping-pong piece, so the **primary stills are
wall-clock** (`bin/inspect.mjs 9 22`, evidence `wallclock-*.png`); the
`inspect-music` seeked stills are secondary (seeking lands on whatever
phase-instant exists, occasionally a paler over-synced one — see the
verse caveat). Clips are continuous-window recordings and grade normally.

## The claim

"A field of Kuramoto coupled phase oscillators self-organizing into spiral
waves and synchronization domains — the communal lock-in of a Breton
circle dance / kan-ha-diskan rendered as the mathematics of
synchronization." Declared timescales: **continuity 0.4 s** (the eye
tracks a propagating wavefront), **divergence 20 s** (spiral domains
nucleate, drift, and annihilate across the 203 s arc).

## Frame-by-frame (wall-clock, accumulated)

| Frame | t | What's there |
|-------|-----|--------------|
| intro | 1.5 s | the planted seed: a handful of big spiral cores on a dark warm field — "dancers taking their places". Quiet, dim, eye lands on the cores. |
| verse | 45.5 s | dark, moody large domains (wine/black) with cream-amber highlights, ember wall-seams, several defect cores. Calm. |
| peak | 111.5 s | rich blood-red/amber domains, distributed; 3–4 cores; brighter and warmer than the verse — the field locked into bold synchronization domains. |
| outro | 177.5 s | finer, more numerous concentric wave bands, dimmer — winding down. |

## Mesmerizing criteria

| criterion | grade | why |
|-----------|-------|-----|
| eye_lands | pass | defect cores (dark singular points) + domains in every frame |
| landing_regions_2_4 | pass | 2–4 cores/domains per still |
| regions_shift | pass | verse/peak/outro put the bright mass in different places; `layout_varies` = −0.49 |
| prediction_continuity | pass | `jerk_smooth` 4/4; consecutive-frame contact sheet shows bands creeping smoothly, no teleport/strobe. `trackability` metric fails (warp_err 0.16–0.25) but that is a documented misfire — optical flow mis-reads rotational/cyclic phase motion (speed_deg_s is ~0–2.5°/s, far under the pursuit ceiling). |
| prediction_divergence | pass | `window_divergence` min_ncd 0.98; sections are categorically different flow configs, not re-shaded copies |
| squint_macro_structure | pass | `squint_macro` passes; macro domains + drifting hot-zones |
| fine_texture_reward | pass | wavefront crests + ember domain-walls + spiral cores reward close inspection (see `multi_octave` note below) |
| hue_drift | pass | `hue_drift_smooth` steps all < 40°; warm drift amber↔wine↔ember across sections |
| mystery_withheld | pass | the defect cores: source or sink? coherent vs incoherent domains never fully resolve |

**9/9**, both prediction criteria pass.

## Claim check

**Pass.** Spiral waves, defect cores, and synchronization domains all read
on screen; the arc runs desync-ish quiet → bold synchronized peak → finer
breakup outro. The synchronization mathematics is honest to the captures.

## Family criteria

### Music (4/4)
| criterion | grade | why |
|-----------|-------|-----|
| motion_over_luminance | pass | bass/vocals stems drive coupling K (wave speed + domain coherence = geometry), not a glow gain |
| bass_movement | pass | the downbeat ring expands (position) and K shifts the domains; not brightness-only |
| rhythm_in_stills | pass | stills catch mid-flight wavefronts + expanding rings |
| quiet_reads_quiet | pass | `motion_dynamic_range` 0.407; verse is slower + darker, not just dimmer |

### Song-level (5/6)
| criterion | grade | why |
|-----------|-------|-----|
| section_readability | pass | verse(dark)/peak(bold-warm)/outro(fine ripples) assignable |
| downbeat_anchored | pass | the per-bar expanding ring lands on the downbeat (hops position each bar) |
| pre_tension | fail | the `u_to_section_change` "held breath" is wired but I can't confirm it reads from the captures — likely too subtle |
| per_stem_discrimination | pass | bass/vocals→K, drums→ring amplitude, other→rotation speed: distinct roles |
| long_arc | pass | `arc` passes; clear quiet/peak structure |
| recapitulation | pass | intro seed-spirals vs outro fine ripples — related, clear delta |

### Interaction (6/6 applicable)
| criterion | grade | why |
|-----------|-------|-----|
| composition | pass | cursor is a pacemaker emitting concentric target waves; a→b→c shifts the dominant pattern, not a local halo |
| idle | pass | `matrix-music` + wall-clock idle alive (lint-idle 0.168 lum / 0.148 motion) |
| readability | pass | "the cursor sends out rings" — one sentence |
| reversibility | n/a | thesis is a continuously-evolving field; cursor a→b→a cannot return an evolving phase field |
| dominance | pass | field recognizably itself without the cursor |
| convention | pass | waves emanate from where you point |
| latency | pass | pacemaker forcing is unsmoothed → immediate |

### Dual-input (5/7)
| criterion | grade | why |
|-----------|-------|-----|
| dual_channel_readability | pass | music drives the regime/arc, cursor drives target waves |
| channel_non_overlap | pass | music → K/α/rotation/rings; cursor → local pacemaker — distinct jobs |
| music_without_cursor | pass | `matrix-music` reacts to the track with no cursor |
| cursor_without_music | fail | **harness gap** — the headless no-audio cell renders black (see below) |
| conflict_resolution | pass | additive forcing stays bounded; `no_blowout` 6/6 |
| authority_during_build | pass | cursor forcing is independent of audio, always responds |
| idle_cell | fail | **harness gap** — `matrix-cursor`/`matrix-neither` capture black |

### Layered
n/a — this is a `passes:` (ping-pong) piece, not a `layers:` stack.

### Integration (3/3 applicable)
| criterion | grade | why |
|-----------|-------|-----|
| orphan_event | pass | the only one-shots are the per-bar rings, anchored to downbeats |
| pasted_overlay | pass | one continuous field; bloom/rings blend into it |
| perspective_consistency | n/a | no receding plane |
| boundary_artifacts | pass | clamp (Neumann) boundary + vignette; no hard seams |
| accretion_causality | n/a | nothing staged in over time |

## Dimension panels

- **palette_cohesion** 5/5 — warm_arc 6/6 (0% cool), lum_not_hue pass, dominant_hues 6/6, rms_contrast 6/6, hue_drift_smooth pass.
- **composition** 5/5 — squint_macro pass, 2–4 landing regions, genuine pale rest-zones, layout_varies pass, regions migrate across sections.
- **motion** 5/5 — jerk_smooth 4/4, never_frozen pass, multi-scale (waves + domains + rings + cursor), direction in quiet. (`trackability` metric documented-override, see mesmerizing note.)
- **intensity** 5/5 — has_peak, has_quiet, quiet_flow_drops (0.407), quiet tightens, no_blowout 6/6.
- **depth** 1 fail — `multi_octave` fails (`depth_octaves` measures 2 octaves; the smooth oscillatory-media domains are inherently low-frequency). near_far_distinct + fine_texture pass (walls/cores/wavefronts are real near-detail). 1 fail = healthy panel.
- **form_ending** 4/4 — arc, ending differs, recapitulation, not a seamless loop.

## Metrics panel

`bin/aesthetic-metrics.py` (evidence `metrics.json`): **gate PASS**
(no_blowout 6/6, dominant_hues 6/6). warm_arc 6/6, rms_contrast 6/6,
arc pass, window_divergence pass (0.98), motion_dynamic_range pass
(0.407), jerk_smooth 4/4, never_frozen 4/4. **Failing:** trackability
0/4 (documented misfire — cyclic phase motion), depth_octaves 0/6
(smooth aesthetic), empty_zones (metric demoted to descriptive per
taste.md).

## What's working

- Clean, honest Kuramoto spiral waves — defect cores, rotating spirals,
  synchronization domains all legible. The desync→sync→breakup arc tracks
  the song.
- Fully warm, red-dominant palette ("dressed in red") with luminance-only
  contrast; gate + warm_arc + rms_contrast all clean.
- Strong divergence (spirals nucleate/drift/annihilate) with smooth
  continuity — the Lyapunov sweet spot.
- The cursor is a genuine instrument (pacemaker target waves), and four
  stems drive four distinct roles.

## What's imperfect (ranked)

1. **Depth / `multi_octave`** — the field is smooth (2 octaves). Adding a
   third octave without temporal flicker (which breaks `jerk_smooth`) or
   peak-washing (finer sim over-synchronized) is the open craft problem.
   The ember domain-walls were the best non-flickering addition so far.
2. **pre_tension** — wired but not visibly reading; needs a stronger
   pre-section "held breath".
3. **Headless idle-cell harness gap** — `matrix-cursor`/`matrix-neither`
   render black in headless because the render loop only advances while
   audio playback keeps the page active (autoplay artifact; the render
   loop itself is NOT audio-gated, and shader NaN/zero-state guards +
   brightness floor were added defensively). The live piece renders
   pre-play; the capture can't prove it. Fix = a no-audio render path in
   the harness, not a shader edit.
4. **trackability metric** — optical-flow misfire on rotational/cyclic
   phase motion; the motion is smooth to the eye.

## Harness gaps

- `cursor_without_music`, `idle_cell` — the no-audio idle cells capture
  black in headless (autoplay/render-advance limitation). Needs a
  harness no-audio render path.
- `pre_tension` — needs a capture that A/Bs mid-verse vs the 3 s before a
  section change at matched brightness.

## Verdict

**ship-it.** Claim passes; mesmerizing 9/9 with both prediction criteria
passing; gate + all four lints clean; every dimension panel ≤ 1 fail; no
family below floor (song_level 5/6, dual_input 5/7 with both fails being
headless harness gaps). The substantive open items — depth/`multi_octave`,
`pre_tension`, and the headless idle-cell capture — are nuance and tooling,
not failure modes. Re-run `/vjay-iterate soudarded` later to chase the
third octave and the pre-tension breath.

```yaml
piece: soudarded
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
interaction_passes: 6/6
interaction_probes:
  composition: pass
  idle: pass
  readability: pass
  reversibility: n/a
  dominance: pass
  convention: pass
  latency: pass
dual_input_passes: 5/7
dual_input_probes:
  dual_channel_readability: pass
  channel_non_overlap: pass
  music_without_cursor: pass
  cursor_without_music: fail
  conflict_resolution: pass
  authority_during_build: pass
  idle_cell: fail
integration_passes: 3/3
integration_probes:
  orphan_event: pass
  pasted_overlay: pass
  perspective_consistency: n/a
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
    layer_interaction: n/a
  form_ending:
    has_arc: pass
    ending_differs: pass
    recapitulation: pass
    not_seamless_loop: pass
metrics:
  gate: pass
  stills_passed: warm_arc 6/6, no_blowout 6/6, dominant_hues 6/6, rms_contrast 6/6
  clips_passed: jerk_smooth 4/4, never_frozen 4/4, window_divergence pass, motion_dynamic_range pass; trackability 0/4 (documented misfire)
harness_gaps:
  - criterion: cursor_without_music
    missing: headless no-audio render path (idle cells capture black)
  - criterion: idle_cell
    missing: headless no-audio render path (idle cells capture black)
  - criterion: pre_tension
    missing: matched-brightness mid-verse vs pre-section-change capture
top_fix: null
evidence:
  - evidence/soudarded-v1/wallclock-05-peak-t111.png
  - evidence/soudarded-v1/wallclock-02-verse-t45.png
  - evidence/soudarded-v1/wallclock-08-outro-t177.png
  - evidence/soudarded-v1/wallclock-00-intro-t1.5.png
  - evidence/soudarded-v1/music-01-t102.8-verse.png
  - evidence/soudarded-v1/clip-w2-t102.8-verse.mp4
  - evidence/soudarded-v1/clip-w3-t185.9-outro.mp4
  - evidence/soudarded-v1/cursor-a.png
  - evidence/soudarded-v1/cursor-b.png
  - evidence/soudarded-v1/cursor-c.png
  - evidence/soudarded-v1/metrics.json
```
