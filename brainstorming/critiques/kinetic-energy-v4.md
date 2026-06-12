# kinetic-energy — iteration 4 critique (re-grade with the upgraded interaction harness)

Independent critic, read-only. The shader is UNCHANGED since v2; this
iteration exists because v3's structural-rethink rested on 6
harness-gap fails, and the capture harness has since been upgraded to
close every one of them: frozen-clock cursor stills with an a↔a2 drift
baseline (`manifest.json: clock_frozen: true, stills_comparable:
"frozen-clock-state-advances"`), 30 s idle-matrix cells (taste spec),
an annotated latency burst (cursor jump at 500 ms = frame 6, 60 fps),
and a 12 s `build-cursor.mp4` spanning the pre-peak build
(t = 120.1–132.1 s). Per the handback instruction: no anchoring on
v3's verdict in either direction — every previously-gapped criterion
is re-derived from the new evidence; frame observations from v3 carry
only where the captures are bit-identical.

Track: 202.2 s, 107.7 BPM, F# minor; sections at 0 / 7.3 / 18.3 /
33.7 / 128.1 / 186.3 / 192.0 / 197.2 s. Architecture: `passes:`
ping-pong (sim → bins → trails → display), state-accumulating.

Capture provenance: the six `inspect-music` stills and five window
clips are **bit-identical to the v3 evidence** (md5-verified for the
stills; same 2026-06-11 19:54 batch), so the music-side observations
and the piece-panel metrics carry over 1:1. The `inspect-interaction`
set is **entirely fresh** (2026-06-12 08:43–08:49) and to spec.
Machine panel: `metrics.json` in the evidence dir (= the handed
`/tmp/ke-metrics-v4.json`).

## Iteration history (v3 → v4)

v1 needs-tweak (exposure) → v2 chef-doeuvre (old rubric) → v3
structural-rethink (v2-binary: 8 fails, 6 of them harness gaps) → v4:
**the harness gaps are all closed, and all six gapped criteria
converted to REAL fails** — the captures arrived and confirmed the
worst-case reading on every single one:

| Criterion (family) | v3 | v4 |
|---|---|---|
| composition (interaction) | fail — gap (wall-clock triptych) | **fail — real** (measured: delta 0.486 < 0.640 needed = 2× drift 0.320) |
| readability (interaction) | fail — gap (3 s matrix-cursor) | **fail — real** (30 s matrix-cursor is black from t ≈ 4 s; no mapping exists) |
| convention (interaction) | fail — gap (no attributable response) | **fail — real** (first gesture produces no visible effect at all) |
| latency (interaction) | fail — gap (un-annotated clip) | **fail — real** (annotated jump at f06; nothing appears through f42 = 600 ms) |
| cursor_without_music (dual) | fail — gap (3 s silent cell) | **fail — real** (cursor cell dies visually; activity 0.0144 ≈ floor) |
| authority_during_build (dual) | fail — gap (no build capture) | **fail — real** (zero cursor response across 12 s of build orbit) |

Worse: the better captures also **flip three v3 passes** that had been
graded from the under-spec 3 s cells — `dual_channel_readability`,
`channel_non_overlap`, and `idle_cell` (the 30 s neither-cell goes
visually black; documented metric override below). Two of v3's three
metric overrides dissolved the other way: the re-fit `squint_macro`
(dual-level × dual-polarity, ≥75 %-of-core aggregation) and the re-fit
`jerk_smooth` threshold now pass on their own — both v3 re-fit
triggers were honored.

## The claim

This piece claims that **velocity is light**: a curl-noise-advected
particle field whose colour is literal kinetic energy (speed² on an
ember → amber → cream ramp over near-black), where the beat winds the
flow up, the downbeat / section boundary releases it as a radial burst
from a wandering blast centre, and the pre-boundary implosion gathers
the field inward — phase-lock as geometry, not brightness.

Declared prediction timescales (held constant since v1 for
comparability): **continuity 0.25 s** (kinetic spark piece,
107.7 BPM), **divergence 20 s** (202 s arc, one very long body
section).

Honesty footnotes, four critiques old and now partly
**capture-disproven** rather than merely code-suspicious: meta claims
a "2304-particle field" (`sim.frag` runs `NUM = 1024`; its ABOUTME
still says 4096/64x64); `idle_behaviour` claims "drive floored at 0.6
when silent" and "cursor stirs the field" — the new 30 s
matrix-neither and matrix-cursor cells show the field visually DEAD
from ~5 s onward in silence, cursor orbiting or not. The visual thesis
still delivers (see claim check); the paperwork now lies about
behaviour we have film of.

## Frame-by-frame

Stills bit-identical to v3; observations re-verified by eye and
carried.

| Frame | t (s) | What's there |
|-------|-------|--------------|
| 0 (intro) | 1.0 | Black rectangle. Mean L 0.0048, max L 0.021 — not one visible pixel, six seconds before first ignition. |
| 1 (verse) | 66.7 | Sparse warm filament curls on void: cream-cored cluster lower-left, amber river fragment lower-centre-right, comet curls top edge. Mean L 0.0131. |
| 2 (pre-peak) | 126.6 | The implosion frozen: bright converging streak-fans right edge + lower-left, needles pointing inward, 1.5 s before the 128.1 s drop. Brightest still (mean L 0.0211). |
| 3 (peak) | 147.3 | Hot amber knot with curling cream-cored filaments centre-right, band lower-right edge, dim curls left. Mean L 0.0106 (seek under-accumulates; clip-w3 at the same t runs mean L 0.07). |
| 4 (quiet) | 194.6 | One soft motion-blurred amber river-band centre-right (defocus state), stippled grain, faint left residue. Mean L 0.0155. |
| 5 (outro) | 199.7 | Dim feathered amber band lower-left-centre with radial needle texture, dimmer cluster right edge. Mean L 0.0129. |

Clip evidence (fresh extractions this round in the evidence dir;
fuller 2 fps + 12 fps coverage in `evidence/kinetic-energy-v3/`, same
files): clip-w3 frames at 1.0 / 2.5 / 4.0 s show dense flame-lick
braids reconfiguring at beat cadence while flowing continuously (mean
L 0.033 → 0.072 → 0.070) — same braid structures evolving, no
teleports, no static.

## Mesmerizing criteria

| Criterion | Verdict | Justification |
|-----------|---------|---------------|
| eye_lands | **fail** | Frame 0 is included by name and frame 0 is a black rectangle (max L 0.021 at t = 1.0). Core stills 1–4 all offer landing spots; the first six seconds offer nothing. Unchanged since v3 — the shader didn't change. |
| landing_regions_2_4 | pass | f1: 3 (lower-left cluster, lower-right river, top-edge curls); f2: 3–4 (right fan, lower-left fan, top/bottom accents); f3: 2–3; f4: 2. Never 1, never 8+. |
| regions_shift | pass | Lower-left (f1) → right-edge + lower-left fans (f2) → centre-right knot (f3) → centre band (f4) → lower-left band (f5). Measured `layout_varies` pass (min pairwise corr −0.039). |
| prediction_continuity | pass | At 0.25 s: the 12 fps dense slice (v3 evidence, same capture) and this round's w3 frames show position-continuous braid evolution; detonations integrate through the sim as radial flow. Measured: `trackability_all` pass (warp_err 0.042–0.119) and — new this round — `jerk_smooth_all` passes outright (w3 = 0.2064 under the re-fit threshold; v3's documented override is now the metric's own verdict). |
| prediction_divergence | pass | At 20 s: five categorically different window vocabularies — ignition puff (w0), braided rivers breathing (w1), gather → detonation → burning-cross → black (w2), sustained flame braids (w3), darkness with one dying puff (w4) — plus alternate-section circulation reversal. Measured: `window_divergence` pass (min NCD 0.953, min flowhist 0.015). |
| squint_macro_structure | pass | Core stills blur to legible light/dark placements (lower-left mass / tri-pole fans / single hot mass / one band). The re-fit `squint_macro` aggregate now passes on its own (3/4 core stills ≥ 75 % rule) — no critic override needed, and the eye agrees. |
| fine_texture_reward | pass | Native-res crops resolve the braids into dozens of parallel filament strands, the quiet band into stipple, the outro band into radial needles. |
| hue_drift | pass | Measured `hue_drift_smooth` pass (max adjacent step 2.4°); not locked — cream-cored amber → golden → rust tracks energy, rust → cream tracks speed² within clips. |
| mystery_withheld | pass | One sentence: you see the iron filings, never the magnet — the flow field and wandering blast centre are never shown; the burning-cross collapse is never explained. |

**Mesmerizing: 8/9.** Both prediction criteria pass — the hard gate
holds. The single fail is eye_lands on the black frame 0.

## Claim check

**Pass.** Velocity-is-light is legible at every energy level (dim rust
embers when slow, cream-cored braids when fast, white-hot needle
spokes at the detonation), and the implosion → detonation phase-lock
is geometric in both stills (f2 frozen mid-convergence) and clips (w2:
gather → firework → burning-cross → exhale across the 128.06 s
boundary). The claim check grades the thesis, and the thesis delivers.
BUT the meta paperwork around the thesis is now disproven on film, not
just suspicious from code: "drive floored at 0.6 when silent" — the
30 s neither-cell sits at the warm floor (mean L 0.00364, max RGB
≤ 21/255) from ~5 s onward; "cursor stirs the field" — four fresh
captures show no visible stir anywhere. Those lines must be corrected
(or made true) regardless of which handback path is taken.

## Family criteria

### Interaction (7) — applicable (`cursor: true`, `u_mouse` in sim + display)

The new harness closes v3's attribution problem: the clock is frozen
(`clock_frozen: true`), the sim still steps, and `cursor-a2.png`
(position a recaptured at the end of the stills block) gives the
pure-drift baseline — measured drift 0.3198. Cursor deltas must beat
2× that to count as cursor-caused. They don't.

| Criterion | Verdict | Why |
|-----------|---------|-----|
| composition | **fail** (measured) | `cursor_composition` fail: a/b/c delta 0.486 < 0.640 needed (2× drift baseline 0.320). The eye agrees: cursor-a/b/c are the same dim ember-braid field with no knot, halo, or mass at any of the three cursor positions; a↔a2 (no cursor change at all) differs about as much as a↔b. The macro composition belongs to the sim, not the cursor. |
| idle | pass | Cursor parked 30 s with the track playing (`matrix-music.mp4`): fully alive — field-wide braid rivers, mean L 0.025–0.067 across t = 4/8/16/22/28, beat-driven reconfiguration throughout. The piece does not need the cursor to live; it needs the music (the silence case is graded at idle_cell). |
| readability | **fail** | From the cursor captures alone, no mapping can be stated: the 30 s `matrix-cursor.mp4` (audio silent, cursor orbiting at 20 Hz pointermove, 2.6 s/rev) decays to the warm floor by t ≈ 4 s and stays there — mean L 0.00364, max RGB 2–19 from t = 4 to 28 — a black screen with an invisible orbit on top. Nothing on screen answers the cursor; there is nothing to read. |
| reversibility | n/a | Thesis is accumulation (trails; "fast particles … leave long streaks") — n/a per taste.md's explicit clause, stated here explicitly. For the record the new drift-adjusted metric passes anyway (`cursor_reversibility` 0.912 ≥ 0.9). |
| dominance | pass | cursor-active vs cursor-idle: unmistakably the same piece — same palette, same braid vocabulary, similar mass placement; measured `cursor_bounded` 0.281 ≤ 1/3. (Trivially aided by the cursor contributing almost nothing, but the criterion asks exactly this question and it passes.) |
| convention | **fail** | The first instinctive gesture produces NO visible effect — not a wrong direction, no direction. In matrix-cursor the orbiting pointer changes nothing visible for 30 s; in the latency burst the jump produces nothing. A cold viewer cannot even discover that the piece is cursor-reactive. Can't-tell = fail. |
| latency | **fail** (measured) | `cursor_latency`: "no visual response detected after the cursor jump" (frames_at_60fps: null). By eye: f04 (pre-jump) through f42 (600 ms post-jump) show the same dim braid slowly decaying; no feature appears at or moves toward the new cursor position, within 3 frames or within 36. |

**Interaction: 2/6 over applicable criteria — below the ship-it floor**
(2 fails allowed, 4 present). In v3 these were harness-gap fails; in
v4 they are the piece's own. Corroboration for why: the sim's cursor
impulse is `fall² · 0.55 · DT` against beat bursts at `2.7 · DT`,
detonations at `7.5 · DT`, and the gather at `2.4 · DT` — the cursor
is the weakest force in the system by 4–14×; and in silence
(`drive ≈ 0.08`) particle speeds sit below the speed²-colour
visibility threshold, so even a successful gather deposits no visible
light. The display-pass cursor term (+0.012 glowR within r 0.28) is a
glow-radius tweak on near-black trails — invisible by construction
when the field is dim.

### Music (4) — applicable (audio-reactive, stems)

Music-side captures are bit-identical to v3; verdicts re-checked
against the same evidence and carried.

| Criterion | Verdict | Why |
|-----------|---------|-----|
| motion_over_luminance | pass | Quiet vs peak: shapes sit in different places entirely (one slow band centre-right vs frame-spanning zigzag braids); silhouettes and streak directions move. Every audio term is geometric (drive → velocity; downbeat/drums → radial impulse; `u_to_section_change` → inward pull). |
| bass_movement | pass | clip-peak braid configuration reconfigures at beat cadence (~0.56 s); new burst arms appear within 1–2 frames of beat boundaries in the 12 fps slice; the 128.06 s drop moves the whole field outward. Bass stem lives in `drive` (velocity), not in a brightness multiplier. |
| rhythm_in_stills | pass | Still 2 is the implosion frozen mid-convergence; w0-f10 / w4-f08 are detonations frozen mid-flight; streak length encodes velocity in every frame. |
| quiet_reads_quiet | pass | Measured `motion_dynamic_range` 0.133 ≤ 0.55; still 4 is one slow soft band — calmer in form (short streaks, defocus), not a dimmed peak. |

**Music: 4/4.**

### Song-level (6) — applicable (analysis JSON + section/downbeat/stem uniforms)

Same captures as v3; carried after re-check.

| Criterion | Verdict | Why |
|-----------|---------|-----|
| section_readability | pass | Blind assignment of 3+ of 5: intro (black), pre-peak (converging fans), peak (hot dense knot vs the verse's scattered dim curls). Quiet/outro share a vocabulary — residual ambiguity, same as v3. |
| downbeat_anchored | pass | Drop detonation lands inside the frame straddling the 128.06 s boundary (w2-f04); first ignition rides the first strong beats (w0-f10, beats 6.83/7.38 s); outro puff seeds at the 197.18 s final boundary. All keyed to clock uniforms, not loudness. |
| pre_tension | pass | Still 2 vs still 1: converging directional fans vs relaxed scattered curls — squeezed and withholding 1.5 s before the drop; w2-f01 shows the defocused feather-gather. |
| per_stem_discrimination | pass | Bass stem = sustained cruise (verse braid rivers); drums stem = staccato radial needle flares (build/peak). Cruise vs punch, both geometric. |
| long_arc | pass | From clips: 0.004 (intro) → 0.03–0.08 (verse) → 0.150 (drop) → 0.02–0.07 (peak) → 0.004 (outro). Measured `arc` 0.225 pass. |
| recapitulation | pass | White dandelion ignition (w0-f10) ↔ dim dying starburst (w4-f08) — same gesture, opposite energy, one unmistakable delta. |

**Song-level: 6/6.**

### Dual-input (7) — applicable (cursor + audio declared)

The backbone evidence is now to spec: four 30 s matrix cells + the
12 s build-cursor capture. Graded at matched timestamps across cells
(all cells start at audio t = 147.3).

| Criterion | Verdict | Why |
|-----------|---------|-----|
| dual_channel_readability | **fail** | Watching matrix-both: ONE channel reads. The music signature (beat-driven swells, braid rivers) is obvious within 5 s; no cursor signature is identifiable in 30 s — at matched timestamps (t = 8/16/22/28) matrix-both and matrix-music show the same braid-river vocabulary in different chaotic configurations, with no knot or feature tracking the 2.6 s/rev orbit. v3's pass came from a 3 s cell and a "central knot" that the 30 s capture does not reproduce. Converted on better evidence. |
| channel_non_overlap | **fail** | One feature that belongs to the music: easy (beat swell, braids). One that belongs to the cursor: none nameable — matrix-cursor is a black screen, and matrix-both minus matrix-music yields only generic chaotic divergence, not an attributable feature. Converted on better evidence. |
| music_without_cursor | pass | matrix-music alone passes the music-side criteria — alive field-wide, beat-cadence reconfiguration, mean L up to 0.067. The cursor is not load-bearing for music reactivity. |
| cursor_without_music | **fail** (real, was gap) | The 30 s silent-cursor cell: one comet visible in the first ~2 s (residual state), then the warm floor — mean L 0.00364, max RGB ≤ 19 — for the remaining 26 s while the cursor orbits at 20 Hz. The cursor-side criteria do not survive silence; nothing does. |
| conflict_resolution | pass | Both channels pushing in matrix-both stays bounded: mean L 0.049–0.075, max 255 on thin needle cores only, no blowout (`no_blowout` clean), no cancellation — the music signature survives intact. |
| authority_during_build | **fail** (real, was gap) | build-cursor.mp4 spans t = 120.1–132.1 s with the cursor orbiting throughout. What's on film is the build's own program — comet (t0.5), braid swirl (t4), defocused feather-gather (t6), THE DROP detonation lower-right (t8 = 128.1 s), burning-cross (t10), exhale (t11.5) — with zero visible cursor response at any point. Reduced amplitude would be fine; zero is not. Corroboration: during the gather the cursor force (0.55) is fighting the implosion pull (2.4) plus suppressed drive. |
| idle_cell | **fail** (metric overridden, documented) | The neither-cell goes black: from t ≈ 5 s to 30 s, mean L is pinned at the warm floor 0.00364 with max RGB 2–21 — a dead screen to any human eye, 25 of 30 seconds. matrix-cursor is identical. The `idle_matrix_alive` metric passes (neither 0.0042) — misfire documented in §Metrics panel: its activity floor counts sub-perceptual churn in pixels valued 1–21/255. The criterion's own words are "none … goes black"; two of four cells do. |

**Dual-input: 2/7 — far below the floor** (2 fails allowed, 5
present). The piece is a one-instrument piece wearing a two-instrument
badge.

### Layered (11)

Not applicable — `passes:` pipeline (sim → bins → trails → display),
no `layers:` array, no per-layer solos (`manifest.json: layers: []`).

### Integration (5) — graded from clips (bit-identical to v3); carried after re-check

| Criterion | Verdict | Why |
|-----------|---------|-----|
| orphan_event | pass | Every one-shot has a perceivable cause: first ignition on the first strong beats; drop detonation on the audible 128.06 s boundary; per-beat flares on the grid; outro puff seeded at the final boundary and blooming out of the visible ember field. |
| pasted_overlay | n/a | One integrated particle field; bursts displace the medium they live in. |
| perspective_consistency | n/a | No receding plane. |
| boundary_artifacts | pass | Frame edges cut fans with soft feathered ends; the burning-cross runs continuously edge to edge; no tiling-cell seams (the bins grid stays invisible) across stills + ~50 clip frames. |
| accretion_causality | pass | Trail blooms and the outro puff appear at-or-after the particles that own them; nothing pre-echoes its cause. |

**Integration: 3/3 over applicable criteria.**

## Dimension panels

### palette_cohesion — 0 fails

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| warm_arc | pass | Measured 1.0 on every coloured still; intro near-monochrome (panel note). |
| lum_not_hue | pass | Measured: L range 0.17–0.33 vs hue std 5.1–7.1° on every core still. |
| dominant_hues | pass | Measured: 1 hue cluster per coloured still (hard gate). |
| no_collapse | pass | Measured `rms_contrast` 0.035–0.057 on core stills (≥ 0.03); frame 0 excluded as non-core. |
| hue_drift_smooth | pass | Measured: steps 2.4/1.8/1.0/0.0°. |

### composition — 0 fails

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| squint_macro | pass | Re-fit metric aggregate passes (≥75 % of core stills: m02 0.0205, m03 0.0068, m04 0.0195 pass; m01 0.0029 the one miss). No override needed this round — v3's documented misfire was a re-fit trigger and the re-fit landed. |
| landing_regions | pass | 2–4 regions per core still (see mesmerizing row). |
| empty_zones | pass | Metric descriptive-only; by eye the voids are intrinsic (89–95 % genuinely dark rest area, no vignette doing the work). |
| layout_varies | pass | Measured: min pairwise correlation −0.039 < 0.80. |
| regions_migrate | pass | Hot zones: lower-left → right-edge → centre-right → centre → lower-left across stills 1–5. |

### motion — 0 fails

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| trackability | pass | Measured: all five clips (warp_err 0.042–0.119 ≤ 0.18; median speeds 0–1.29 deg/s). |
| jerk_smooth | pass | Measured: `jerk_smooth_all` passes outright this round (w3 0.2064 under the re-fit threshold). v3's override → v4's clean metric pass. |
| multi_scale_desync | pass | clip-w3: macro river drift, meso braid curling, fine filament shimmer, focus-breathing on different periods; clocks corroborated (0.037/0.061 envelopes, u_beat_phase, per-frame hash jitter). |
| never_frozen | pass | Measured: all clips ≥ 0.0697 mean flow. |
| direction_in_quiet | pass | clip-w4: ember band drifts coherently leftward; the puff radiates from its centre. |

### intensity — 0 fails

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| has_peak | pass | w2-f04 detonation: mean L 0.1499, 12.8 % of pixels > 0.5 — 40× its neighbours. |
| has_quiet | pass | Intro/outro clips idle at mean L 0.0036–0.004; the build holds a near-black breath. |
| quiet_flow_drops | pass | Measured `motion_dynamic_range` 0.133 ≤ 0.55. |
| quiet_scale_tightens | pass | Streaks shorten, field contracts to one band, defocus softens edges (still 4 vs w3 frames). |
| no_blowout | pass | Measured: every still (hard gate); peak compresses through aces. |

### depth — 1 fail

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| multi_octave | **fail** | Measured `depth_octaves`: music-04 carries 2 octaves (threshold 3; music-05 also 2, non-core). Real, not a misfire: the defocus state genuinely blurs away the mid-scale in the quiet core still. m01/02/03: 3/5/5. |
| near_far_distinct | pass | Downsampled: glow masses on black; native: filament strands. |
| fine_texture | pass | Centre crops hold filament detail the full view hides. |
| layer_interaction | n/a | No layer stack. |

### form_ending — 0 fails

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| has_arc | pass | Measured `arc` 0.225 pass; eye on clips agrees (trough → cruise → spike → trough). |
| ending_differs | pass | Empty black intro vs visible feathered puff band outro. |
| recapitulation | pass | Ignition puff ↔ dying puff (clips carry it; same verdict as song-level). |
| not_seamless_loop | pass | The outro holds a dying starburst then fades; a loop seam would read as a hard vocabulary reset. |

## Metrics panel

Source: handed `piece` + `interaction` + `gate` JSON
(`evidence/kinetic-energy-v4/metrics.json`; stills read from the
md5-identical v3 evidence copies).

- **Gate: pass** (no_blowout + dominant_hues clean; `failures: []`).
- **Stills: 44/54 per-still + 3/3 piece-level = 47/57.** Fails: frame
  0 (rms_contrast, squint_macro, empty_zones, one_over_f — vacuous on
  the black intro, non-core), squint_macro on music-01 (0.0029; the
  aggregate still passes at ≥75 % of core), one_over_f on
  music-02/03/05 (−1.73…−2.10, advisory, maps to no criterion),
  depth_octaves on music-04/05 (drives the multi_octave fail).
  New `aggregates` block: squint_macro PASS, one_over_f FAIL
  (advisory), depth_octaves FAIL; everything else pass.
- **Clips: 15/15 per-clip + 5/5 piece-level = 20/20.** v3's sole
  failure chain (clip-w3 jerk 0.2064 vs provisional 0.20) is gone —
  the threshold was re-fit per v3's trigger and the value now passes.
- **Interaction: 3/5** — cursor_reversibility 0.912 pass (drift-
  adjusted), cursor_bounded 0.281 pass, idle_matrix_alive pass;
  **cursor_composition FAIL** (delta 0.486 < needed 0.640 = 2× drift
  baseline 0.320), **cursor_latency FAIL** ("no visual response
  detected after the cursor jump"). `stills_comparable:
  "frozen-clock-state-advances"`, drift_baseline 0.3198.

Documented metric override (one, the reverse direction from v3's):

1. **idle_matrix_alive pass → idle_cell criterion fail.** The metric's
   per-cell activity values (cursor 0.0144, neither 0.0042) clear its
   floor, but they are measuring sub-perceptual churn: from t ≈ 5 s to
   30 s both silent cells sit at mean L exactly 0.00364 (the shader's
   near-black warm floor `vec3(0.005, 0.0035, 0.0025)`) with max RGB
   between 2 and 21 out of 255. On any real screen that is a black
   rectangle for 25 of 30 seconds. The criterion text is explicitly
   visual ("none … goes black"); the eye outranks an activity floor
   that triggers on invisible pixel flicker. Re-fit trigger: the
   aliveness floor should be stated in perceptual luminance terms
   (e.g. require some fraction of frames with max L above a visibility
   threshold), not raw frame-delta activity.

No other overrides: both of v3's piece-side overrides (squint_macro,
jerk_smooth) are moot after the threshold re-fits, and both
measured interaction fails (cursor_composition, cursor_latency) agree
with the eye.

## What's working

- **The music side survives everything we can throw at it.** 4/4
  music, 6/6 song-level, 3/3 integration, both prediction criteria
  measured and passing (NCD 0.953; warp_err ≤ 0.119), and the
  drop-straddling detonation still lands within one capture frame of
  the 128.06 s boundary at 40× surrounding luminance. As a
  music-driven piece this is close to flawless under the binary
  rubric.
- **The metrics-calibration loop worked as designed.** v3 filed two
  re-fit triggers (squint_macro mask blindness, provisional jerk_max);
  both thresholds were re-fit; both criteria now pass by machine with
  the critic's eye in agreement. One override each way across two
  iterations is the system functioning, not noise.
- **The new interaction harness is decisive.** Frozen clock + a↔a2
  drift baseline + 30 s cells + annotated latency + build-spanning
  capture: every question v3 couldn't answer now has a filmed answer.
  No criterion in this critique is graded on a missing capture.
- **Palette, motion, intensity, form panels: zero fails** — the
  Strano chiaroscuro, the focus-breathing, the real darks, and the
  ignition↔dying-puff rhyme all hold under the strictest evidence
  this repo has produced.

## What's imperfect (ranked)

1. **The cursor is a paper instrument.** `cursor: true`, "cursor
   stirs the field" — and four independent fresh captures show
   nothing: no composition delta beyond sim drift (0.486 < 0.640
   measured), no response to a step jump within 600 ms, a black
   screen through 30 s of silent orbiting, zero visible authority
   during the build. Root cause is structural, in two parts:
   (a) the sim-side attract (`fall² · 0.55 · DT`, radius 0.28) is the
   weakest force in the system — 4–14× under the gather, bursts, and
   detonations it competes with; (b) the piece's only light source is
   speed²-coloured trail deposition, so in silence (drive ≈ 0.08) even
   a successful cursor gather happens below the visibility threshold —
   the cursor stirs a field that emits no light to show it. A visible
   cursor needs its own light budget (e.g. cursor-local deposition or
   drive floor scaled near the pointer), not just a bigger force
   constant.
2. **Five of the seven dual-input criteria fail** — the downstream
   image of (1) plus the dead silent cells. The piece is excellent as
   a one-input instrument and claims to be a two-input one.
3. **The silent idle is a dead screen** (idle_cell fail, metric
   overridden). meta promises "living baseline flow, drive floored at
   0.6 when silent"; the code computes an effective 0.08 and the
   30 s neither-cell sits at the warm floor from t ≈ 5 s. Either make
   the paperwork true (raise the silent drive floor so embers stay
   visibly aglow) or true the paperwork.
4. **Frame 0 is still a black rectangle** (eye_lands fail; noted in
   v1, v2, v3). A sub-0.05 L ember seed during the intro silence
   remains the obvious fix and would not threaten quiet_reads_quiet.
5. **The quiet still carries 2 octaves** (multi_octave fail,
   measured, real). Cap the defocus blur radius or exempt the
   brightest cores so a thread of sharp filament survives the calm.
6. **Meta honesty drift, fourth critique running:** 2304 vs 1024
   particles, 4096/64x64 in sim.frag's header, the 0.6-vs-0.08 idle
   floor — now joined by "cursor stirs the field" being disproven on
   film. Five minutes of paperwork, or one structural fix that makes
   the paperwork true.

## Harness gaps

None. All six v3 gaps were closed by the harness upgrade
(frozen-clock triptych + drift baseline, 30 s matrix cells, annotated
latency burst, build-cursor capture), and no criterion in this
critique lacked the capture or metric it needed. The one metric
disagreement (idle_matrix_alive) is a threshold re-fit trigger, not a
missing capture.

## Verdict

**structural-rethink** — and this time the structure that needs
rethinking is the shader's cursor story (or the claim of one), not
the harness.

Bar arithmetic:

- Claim check: pass.
- Mesmerizing: 8/9 (eye_lands fail); **both prediction criteria
  pass** — the hard gate holds.
- Families over applicable criteria: interaction 2/6 (**below floor**:
  4 fails vs 2 allowed), music 4/4, song_level 6/6, dual_input 2/7
  (**below floor**: 5 fails vs 2 allowed), layered n/a,
  integration 3/3.
- Dimension panels: palette 0 fails, composition 0, motion 0,
  intensity 0, depth 1 (multi_octave), form_ending 0 — every panel
  ≤ 1 fail.
- **Total fails: 11** (eye_lands; composition, readability,
  convention, latency; dual_channel_readability, channel_non_overlap,
  cursor_without_music, authority_during_build, idle_cell;
  multi_octave). Harness-gap fails: **0 of the 11.**
- Verdict ladder: chef-doeuvre out (fails > 0). Ship-it out three ways
  (11 > 3 total; two families below floor). Needs-tweak out (the fails
  do not share one shader edit — and 11 > 6 routes to
  structural-rethink regardless). **structural-rethink** by the
  "> 6 total fails" rule, with prediction passing and mesmerizing
  ≥ 7/9.

Reading for the handback — two coherent paths, opposite costs:

- **Path A (make the claim true):** give the cursor a light budget and
  real authority. Concretely: cursor-local trail deposition (the
  trails pass deposits a dim ember glow along the pointer's wake
  independent of particle speed), a silent-drive floor near the
  pointer, and a force constant that wins locally against the gather
  (≥ 2.4 within its radius). That addresses composition, readability,
  convention, latency, cursor_without_music, authority_during_build,
  dual_channel_readability, channel_non_overlap, AND the idle_cell /
  meta-honesty cluster in one architecture change: the cursor becomes
  a second light source, not a second force whispering into a storm.
- **Path B (true the claim):** retire the cursor — remove the
  `u_mouse` blocks from sim.frag and shader.frag, set `cursor: false`,
  fix the idle_behaviour/particle-count lines. Interaction and
  dual_input become n/a; the remaining fails are eye_lands (intro
  ember seed), multi_octave (defocus floor), idle_cell's underlying
  silent-death (raise the silent drive so the embers visibly survive
  — still worth doing for the standalone idle story). That is a
  ship-it-shaped piece in one honest amputation.

Path A is the one consistent with the house default (cursor as
instrument); Path B is the honest small piece. What the evidence rules
out is the current middle: shipping a cursor claim no capture can see.

```yaml
piece: kinetic-energy
iteration: 4
schema: 2
verdict: structural-rethink
claim_check: pass
mesmerizing_passes: 8/9
mesmerizing_probes:
  eye_lands: fail
  landing_regions_2_4: pass
  regions_shift: pass
  prediction_continuity: pass
  prediction_divergence: pass
  squint_macro_structure: pass
  fine_texture_reward: pass
  hue_drift: pass
  mystery_withheld: pass
interaction_passes: 2/6
interaction_probes:
  composition: fail        # measured — delta 0.486 < 0.640 (2x drift baseline 0.320)
  idle: pass
  readability: fail        # 30 s matrix-cursor at warm floor from t≈4 s; no mapping visible
  reversibility: n/a       # accumulation thesis (metric passes 0.912 regardless)
  dominance: pass
  convention: fail         # first gesture produces no visible effect at all
  latency: fail            # measured — no response through f42 (600 ms post-jump)
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
dual_input_passes: 2/7
dual_input_probes:
  dual_channel_readability: fail  # only the music channel reads in matrix-both over 30 s
  channel_non_overlap: fail       # no nameable cursor-owned feature exists
  music_without_cursor: pass
  cursor_without_music: fail      # silent-cursor cell visually black for 26 of 30 s
  conflict_resolution: pass
  authority_during_build: fail    # zero visible cursor response across build-cursor.mp4
  idle_cell: fail                 # neither-cell goes black t≈5–30 s (metric overridden, documented)
integration_passes: 3/3
integration_probes:
  orphan_event: pass
  pasted_overlay: n/a            # single integrated field, no overlay elements
  perspective_consistency: n/a   # no receding plane
  boundary_artifacts: pass
  accretion_causality: pass
dimensions:
  palette_cohesion:
    warm_arc: pass
    lum_not_hue: pass
    dominant_hues: pass
    no_collapse: pass
    hue_drift_smooth: pass
  composition:
    squint_macro: pass           # re-fit metric aggregate passes; no override needed
    landing_regions: pass
    empty_zones: pass
    layout_varies: pass
    regions_migrate: pass
  motion:
    trackability: pass
    jerk_smooth: pass            # re-fit threshold; w3 0.2064 now passes by machine
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
    multi_octave: fail           # measured — quiet core still carries 2 octaves
    near_far_distinct: pass
    fine_texture: pass
    layer_interaction: n/a       # no layer stack
  form_ending:
    has_arc: pass
    ending_differs: pass
    recapitulation: pass
    not_seamless_loop: pass
metrics:
  gate: pass
  stills_passed: 47/57
  clips_passed: 20/20
  interaction_passed: 3/5
  overrides:
    - idle_matrix_alive: "pass overridden to idle_cell fail — activity floor counts sub-perceptual churn; both silent cells sit at the warm floor (mean L 0.00364, max RGB 2–21/255) from t≈5 s to 30 s; criterion text is visual ('goes black'); re-fit trigger filed for a perceptual-luminance aliveness floor"
harness_gaps: []
top_fix: null
evidence:
  - evidence/kinetic-energy-v4/metrics.json
  - evidence/kinetic-energy-v4/manifest.json
  - evidence/kinetic-energy-v4/music-00-t1.0-intro.png
  - evidence/kinetic-energy-v4/music-01-t66.7-verse.png
  - evidence/kinetic-energy-v4/music-02-t126.6-pre-peak.png
  - evidence/kinetic-energy-v4/music-03-t147.3-peak.png
  - evidence/kinetic-energy-v4/music-04-t194.6-quiet.png
  - evidence/kinetic-energy-v4/music-05-t199.7-outro.png
  - evidence/kinetic-energy-v4/clip-w3-peak-t1.0s.png
  - evidence/kinetic-energy-v4/clip-w3-peak-t2.5s.png
  - evidence/kinetic-energy-v4/clip-w3-peak-t4.0s.png
  - evidence/kinetic-energy-v4/cursor-a.png
  - evidence/kinetic-energy-v4/cursor-b.png
  - evidence/kinetic-energy-v4/cursor-c.png
  - evidence/kinetic-energy-v4/cursor-a2.png
  - evidence/kinetic-energy-v4/cursor-aba-0.png
  - evidence/kinetic-energy-v4/cursor-aba-1.png
  - evidence/kinetic-energy-v4/cursor-active.png
  - evidence/kinetic-energy-v4/cursor-idle.png
  - evidence/kinetic-energy-v4/latency-f04.png
  - evidence/kinetic-energy-v4/latency-f06.png
  - evidence/kinetic-energy-v4/latency-f09.png
  - evidence/kinetic-energy-v4/latency-f12.png
  - evidence/kinetic-energy-v4/latency-f20.png
  - evidence/kinetic-energy-v4/latency-f42.png
  - evidence/kinetic-energy-v4/matrix-cursor-t1.png
  - evidence/kinetic-energy-v4/matrix-cursor-t4.png
  - evidence/kinetic-energy-v4/matrix-cursor-t8.png
  - evidence/kinetic-energy-v4/matrix-cursor-t12.png
  - evidence/kinetic-energy-v4/matrix-cursor-t16.png
  - evidence/kinetic-energy-v4/matrix-cursor-t20.png
  - evidence/kinetic-energy-v4/matrix-cursor-t24.png
  - evidence/kinetic-energy-v4/matrix-cursor-t28.png
  - evidence/kinetic-energy-v4/matrix-neither-t1.png
  - evidence/kinetic-energy-v4/matrix-neither-t8.png
  - evidence/kinetic-energy-v4/matrix-neither-t16.png
  - evidence/kinetic-energy-v4/matrix-neither-t24.png
  - evidence/kinetic-energy-v4/matrix-music-t4.png
  - evidence/kinetic-energy-v4/matrix-music-t8.png
  - evidence/kinetic-energy-v4/matrix-music-t16.png
  - evidence/kinetic-energy-v4/matrix-music-t22.png
  - evidence/kinetic-energy-v4/matrix-music-t28.png
  - evidence/kinetic-energy-v4/matrix-both-t4.png
  - evidence/kinetic-energy-v4/matrix-both-t8.png
  - evidence/kinetic-energy-v4/matrix-both-t16.png
  - evidence/kinetic-energy-v4/matrix-both-t22.png
  - evidence/kinetic-energy-v4/matrix-both-t28.png
  - evidence/kinetic-energy-v4/build-cursor-t0.5.png
  - evidence/kinetic-energy-v4/build-cursor-t2.png
  - evidence/kinetic-energy-v4/build-cursor-t4.png
  - evidence/kinetic-energy-v4/build-cursor-t6.png
  - evidence/kinetic-energy-v4/build-cursor-t8.png
  - evidence/kinetic-energy-v4/build-cursor-t10.png
  - evidence/kinetic-energy-v4/build-cursor-t11.5.png
```
