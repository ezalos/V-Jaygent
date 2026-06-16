# surfin-at-mazatlan — v3 critique (descent redesign)

Continues v1/v2. **Louis watchthrough redline (2026-06-16):** "rhythm is
well understood but it lacks dramatic changes in the overall design...
make some sort of progression into a narrative because the song gets
deeper and deeper over the same bassline. Graduate the color from
yellow-orange into purple-blue over time. Ripples are fine, just make
them larger / more extended. Add something on top to mix with it."

Louis's two dial-setting calls (via AskUserQuestion): color → **stop at
twilight violet, keep a warm anchor** (not full deep-blue); added
element → **rising motes**.

## The redesign — the piece is now a DESCENT
The song deepens over one bassline, so the image sinks with it: a
golden-hour ripple-tank surface → the cool deep, driven by
`u_song_progress` (= descent).

- **Color (warm→violet, warm anchor):** the bed graduates golden →
  amber → wine → twilight violet as we sink, but the warm anchor stays —
  the last light is caught on the wave CRESTS + glint while the bed and
  troughs cool. The sun reddens and SETS by mid-song (the dramatic
  pivot / surface-break), after which faint cold light filters from the
  surface far above.
- **Ripples larger / more extended:** wavelength grows and wave speed
  slows with depth (surface bass-chop → vast slow deep swells); the
  source falloff was loosened so wavefronts reach further.
- **Progression, not cycle:** the dominant grammar is now monotonic by
  depth — surface fine NET → mid rolling BANDS → deep vast RINGS — not
  the v2 cyclic rotation.
- **New element (rising motes):** sparse suspended particles drift UP as
  we descend (three parallax bands), warm last-light near the surface →
  cool pale-violet glint in the deep. Cursor brightens nearby motes; a
  held key stirs up more. The "I'm sinking" cue + a kinetic counterpoint
  to the ripples.

## What I see (inspect 8x20 across the song)
- t1.5 SURFACE — warm golden net, sun glint high, a few motes.
- t61.5 mid — sun setting, palette tipping; (the centered rings here are
  the `inspect.mjs` parked-cursor artifact, not the autonomous mode).
- t101.5 deepening — dusky VIOLET bed, warm gold ring-arcs (the anchor),
  motes scattered and rising.
- t141.5 DEEP — violet/indigo, vast slow warm ring-swells, a suspended
  mote field, vignette enclosing. Unmistakably "the deep."
A dramatic warm→cool, surface→deep before/after — the missing arc.

## Metrics / gates
- lint-composition PASS (top 51.5% / bottom 48.5% — the motes + descent
  improved balance). lint-idle PASS. smoke clean (6 layers).
- Hard gate (no_blowout + dominant_hues) PASS; lint-palette PASS 0.00%
  cool — **but this is a harness blind spot, not warm-purity:** the 5
  section-anchored stills only reach song-progress ~0.64 (still
  warm-dominant); the true violet lives in the last ~20% (descent>0.8)
  which those stills never sample. The deep IS cool by design — a
  DELIBERATE per-piece override of VISION's warm-only rule, at Louis's
  explicit request. The warm anchor (crests/glint) keeps it dusky-violet,
  not blue.

## Watch items
- **Palette override** is intentional and owner-directed; do not "fix"
  the cool deep in a future pass. Warm-only is waived for this piece.
- **Cursor reach:** the loosened falloff makes the cursor source ripple
  reach further (bigger rings when dragged). Kept as a strong instrument
  per Louis's preference; re-evaluate if it overwhelms on a watchthrough.
- The autonomous band mode (mid-song) is masked in `inspect.mjs` by the
  parked-cursor central ring; grade it from matrix-music / live, not the
  centered inspect stills.

Verdict: ship-it (owner-directed redesign; delivers all four asks —
narrative progression, warm→violet color, larger/extended ripples, a
new mixing element — and keeps the rhythm coupling Louis liked). Louis's
watchthrough is the authoritative grade from here.

```yaml
piece: surfin-at-mazatlan
iteration: 3
schema: 2
verdict: ship-it
note: owner-directed descent redesign; warm-only palette deliberately overridden
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
interaction_passes: 6/7
interaction_probes:
  composition: pass
  idle: pass
  readability: pass
  reversibility: pass
  dominance: fail
  convention: pass
  latency: pass
song_level_passes: 5/5
song_level_probes:
  section_readability: pass
  downbeat_anchored: pass
  pre_tension: pass
  per_stem_discrimination: n/a
  long_arc: pass
  recapitulation: pass
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
dimensions:
  palette_cohesion:
    warm_arc: n/a   # deliberate warm->violet descent; warm-only waived this piece
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
  form_ending:
    has_arc: pass
    ending_differs: pass
    recapitulation: pass
    not_seamless_loop: pass
metrics:
  gate: pass
  overrides:
    - criterion: palette warm_arc / lint-palette
      reason: owner-directed warm->twilight-violet descent; warm-only rule
        waived for this piece. lint-palette passes only because section
        stills stop at song-progress ~0.64; the deep (>0.8) is cool by design.
    - criterion: dominance
      reason: loosened source falloff makes the cursor a reachier instrument;
        kept per the cursor-as-instrument preference.
harness_gaps:
  - "section-anchored stills don't sample song-progress > 0.64, so the deep
     violet + dense motes go ungraded by the frame lints; grade the deep
     from inspect.mjs 8x20 frame-06/07 + live."
evidence:
  - evidence/surfin-at-mazatlan-v3/descent-00-surface-t1.png
  - evidence/surfin-at-mazatlan-v3/descent-03-mid-t61.png
  - evidence/surfin-at-mazatlan-v3/descent-05-deepening-t101.png
  - evidence/surfin-at-mazatlan-v3/descent-07-deep-t141.png
```
