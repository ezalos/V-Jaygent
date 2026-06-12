# kinetic-energy — iteration 3 critique (first grading under taste.md v2 binary)

Independent critic, read-only. This is a RE-GRADE of the unchanged v2
shader under the new binary rubric (taste.md v2, 2026-06-12): grades are
pass | fail | n/a only, can't-tell rounds to fail, missing or inadequate
captures fail with a `harness_gaps` entry. Do not anchor on v2's
chef-doeuvre — that verdict was earned under the old vocabulary.

Track: 202.2 s, 107.7 BPM, F# minor; sections at 0 / 7.3 / 18.3 / 33.7 /
128.1 / 186.3 / 192.0 / 197.2 s. Architecture: `passes:` ping-pong
(sim → bins → trails → display), state-accumulating — seek-based stills
under-accumulate the trail buffer, so motion grades come from the five
fresh window clips (2026-06-11 19:55 batch). `clip-drop.mp4` is a stale
capture from an earlier batch (10:19) and was EXCLUDED. `clip-peak.mp4`
is bit-identical to `clip-w3-t147.3-peak.mp4` (md5 match) — they are one
capture. Interaction captures are fresh (2026-06-12 01:23) but the
idle-matrix cells are ~3 s each, not the 30 s the rubric specifies, and
`manifest.json` declares `stills_comparable: false` (wall-clock piece) —
both facts shape the interaction grades below.

Evidence snapshot: `evidence/kinetic-energy-v3/` (56 files, incl.
`metrics.json`). The six stills are bit-identical to the v2 evidence
copies (md5-verified), so the machine panel — which read from
`evidence/kinetic-energy-v2` — applies 1:1 to the current captures.

## The claim

This piece claims that **velocity is light**: a curl-noise-advected
particle field whose colour is literal kinetic energy (speed² on an
ember → amber → cream ramp over near-black), where the beat winds the
flow up, the downbeat / section boundary releases it as a radial burst
from a wandering blast centre, and the pre-boundary implosion gathers
the field inward — phase-lock as geometry, not brightness.

Declared prediction timescales (same as v1/v2 so verdicts stay
comparable): **continuity 0.25 s** (kinetic spark piece, 107.7 BPM —
fast end of the range), **divergence 20 s** (202 s arc with one very
long body section — long end of medium).

Honesty footnotes, still uncorrected since v1: meta claims a
"2304-particle field" while `sim.frag` runs `NUM = 1024` (its ABOUTME
header still says 4096/64x64); `idle_behaviour` claims "drive floored
at 0.6 when silent" while the code computes `mix(0.5,1.0,u_audio_playing)
× 0.16` ≈ 0.08 effective. Neither changes what's on screen; both are
paperwork lying about the piece.

## Frame-by-frame

| Frame | t (s) | What's there |
|-------|-------|--------------|
| 0 (intro) | 1.0 | Black rectangle. Mean L 0.0048, max L 0.021 — not one visible pixel. One second into the track, six seconds before the first ignition. Honest silence; nowhere for the eye to land. |
| 1 (verse) | 66.7 | Sparse warm filament curls on void: cluster with cream cores lower-left, amber river fragment lower-centre-right, comet curls along the top edge and upper-left. Mean L 0.0131, max 0.81. Eye lands lower-left. |
| 2 (pre-peak) | 126.6 | The implosion reads: bright converging streak-fans at the right edge and lower-left (amber needles pointing inward), dim accent top-centre, fourth fan bottom-centre. Brightest still (mean L 0.0211, 2.08 % of pixels > 0.25), 1.5 s before the 128.1 s drop. |
| 3 (peak) | 147.3 | Hot amber knot with curling cream-cored filaments centre-right, band along the lower-right edge, dim curls left edge and upper-left. Mean L 0.0106, 0.112 % > 0.5. Sparse for a peak — the seek-based still under-accumulates vs the clip at the same timestamp (clip-w3 f04 mean L 0.0738). |
| 4 (quiet) | 194.6 | One soft, motion-blurred amber river-band drifting centre-right (defocus state), stippled grain inside it, faint streak residue left. Mean L 0.0155, 98.4 % of pixels < 0.25. One calm gesture on a void. |
| 5 (outro) | 199.7 | Dim feathered amber band lower-left-centre (radial needle texture — the wind-down puff mid-bloom), dimmer cluster at the right edge. Mean L 0.0129. Exhaling 2.5 s before the track ends. |

Clip evidence (frames extracted at 2 fps; dense slice at 12 fps; all in
the evidence dir):

- `clip-w0-intro` (2.2–7.2 s): near-black, then f10 (6.7–7.2 s) — the
  first ignition, a white dandelion-puff starburst right-of-centre with
  radial needle spokes (mean L 0.0292, max 0.997), landing on the first
  strong beats of the track (beats at 6.25 / 6.83 / 7.38 s, boundary
  7.34 s).
- `clip-w1-verse` (66.7 s): field-wide wavy braided rivers with cream
  cores (f01) breathing down to sparse curls (f05) and back to one
  dominant river with branches (f10).
- `clip-w2-build` (126.6–131.6 s, drop at 128.06): the piece's arc in
  five seconds. f01 dense golden feather-gather (defocused); f04
  (128.1–128.6 s) THE DETONATION — multiple firework starbursts of
  white-hot needle spokes, mean L 0.1499, 12.8 % of pixels > 0.5; f06 the
  burning-cross collapse — two full-frame filament lines crossing
  left-of-centre; f09 near-black exhale (mean L 0.0036). A 40× mean-L
  swing inside one window.
- `clip-w3-peak` (147.3 s, = clip-peak): sustained dense flame-lick
  braids, reconfiguring at roughly beat cadence while flowing coherently
  (f01 curls upper-half → f04 zigzag braids centre, mean L 0.0738 → f07
  softer defocused braids → f10 diagonal rivers). Dense 12 fps slice
  (f01–f12, 83 ms apart): the same braid structures evolve continuously
  across all twelve frames — no teleports, no pixel static, no
  chromatic tearing; what oscillates is sharpness (the defocus
  breathing) and brightness.
- `clip-w4-outro` (196.7–201.7 s): dim ember field; the final-boundary
  (197.18 s) detonation blooms slowly through trail accumulation into a
  dim starburst puff lower-left, peaking at f08 (200.2 s, mean L 0.0201)
  and fading by f10. The opening ignition gesture at dying energy.

## Mesmerizing criteria

| Criterion | Verdict | Justification |
|-----------|---------|---------------|
| eye_lands | **fail** | The criterion includes frame 0 by name, and frame 0 (t = 1.0) is a black rectangle — max L 0.021, nothing to land on. Core stills 1–4 all offer landing spots (lower-left cluster / right-edge fan / centre-right knot / centre band), but the v2-binary rubric kills the "intro silence" excuse v2 leaned on: a viewer or thumbnailer who pauses the first six seconds gets nothing. |
| landing_regions_2_4 | pass | Core stills: f1 has 3 (lower-left cluster, lower-right river, top-edge curls), f2 has 3–4 (right fan, lower-left fan, top + bottom accents), f3 has 2–3 (knot, edge band, left curls), f4 has 2 (band, left residue). Never 1, never 8+. |
| regions_shift | pass | Lower-left (f1) → right-edge fan + lower-left (f2) → centre-right knot (f3) → centre band (f4) → lower-left band (f5); measured support `layout_varies` pass (min pairwise corr −0.039 — the layouts are close to anti-correlated). |
| prediction_continuity | pass | At 0.25 s: the dense 12 fps slice of clip-w3 shows position-continuous braid evolution across all twelve frames; every other clip shows coherent comet-flow; detonations are velocity impulses integrated through the sim so even the firework instant reads as radial flow. None of the fail shapes (static, square artefacts, channel tearing, displacement jumps) appears in any of the ~50 frames examined. Measured: `trackability_all` pass (warp_err 0.042–0.119, all ≤ 0.12); `jerk_smooth_all` fail on one clip — documented as a metric misfire below (§Metrics panel), not a visible continuity break. |
| prediction_divergence | pass | At 20 s: window vocabularies are categorically different — black-then-dandelion ignition (w0), braided rivers breathing (w1), feather-gather → detonation → burning-cross → black (w2), sustained flame braids (w3), darkness with one dying puff (w4) — plus alternate sections reverse circulation (`sim.frag` sgn flip). Measured: `window_divergence` pass (min NCD 0.953 ≥ 0.90 after luminance normalization; min flowhist 0.015 ≥ 0.002). Closest pair is verse/peak (shared braid vocabulary at different density and configuration). |
| squint_macro_structure | pass (metric override) | Core stills blur to legible light/dark: lower-left mass vs void (f1), tri-pole fans (f2), single hot mass centre-right (f3), one band on void (f4). The `squint_macro` metric fails f1 (0.002) and f3 (0.0049, threshold 0.005): its 0.6 mask level counts only hot cores and is blind to the dim-amber braid mass (L ≈ 0.1–0.3) that actually carries the macro reading. taste.md flags this threshold as mid-sweep (7/14 positives) and sanctions documented overrides here. Not uniform grey, not uniform black — placed light on real dark. |
| fine_texture_reward | pass | Native-res crops reward: the braids resolve into dozens of parallel filament strands (f1–f3), the quiet band into stippled grain (f4), the outro band into radial needles (f5). The blurred view shows none of this. |
| hue_drift | pass | Measured `hue_drift_smooth` pass (max adjacent step 2.4°). Not locked either: the mix drifts with energy — cream-cored amber (verse/peak) → golden (pre-peak) → rust (quiet/outro tail), and within clips rust → amber → cream → white-hot tracks speed². |
| mystery_withheld | pass | Nameable in one sentence: you see the iron filings, never the magnet — the force field and the wandering blast centre are never shown, the gather drains the frame toward an unseen attractor, and the burning-cross collapse (w2-f06) is never explained by anything else the piece shows. |

**Mesmerizing: 8/9.** Both prediction criteria pass — the hard gate
holds. The single fail is eye_lands on the black frame 0.

## Claim check

**Pass.** Velocity-is-light is legible at every energy level: slow = dim
rust embers (stills 4/5), fast = cream-cored braids (w1/w3), fastest =
white-hot needle spokes at the detonation (w2-f04). The
implosion → detonation phase-lock is geometric and visible in both
domains: still 2 freezes the gather as bright converging fans 1.5 s
before the drop, and clip-w2 plays gather → firework → burning-cross →
black exhale across the 128.06 s boundary. The radial burst from the
wandering blast centre is frozen mid-flight in w0-f10 and w4-f08 at
opposite energies. Caveats that don't flip the verdict but must finally
get fixed: the particle-count claim (2304 vs actual 1024) and the
idle-floor claim (0.6 vs effective 0.08) are still wrong in meta.yaml —
the visual thesis delivers; its paperwork lies.

## Family criteria

### Interaction (7) — applicable (`cursor: true`)

The backbone problem: `manifest.json` says `stills_comparable: false` —
this is a wall-clock piece, so time advances between the triptych / aba
/ active-idle captures, and in a state-bearing chaotic field EVERYTHING
differs between two instants whether or not the cursor moved. The
cursor stills can prove "the piece is recognizably itself" (identity is
robust to time deltas) but cannot attribute composition deltas to the
cursor. On top of that the matrix cells are ~3 s, a tenth of the 30 s
spec — too short for a dwell-gather effect to develop in a silent field.

| Criterion | Verdict | Why |
|-----------|---------|-----|
| composition | **fail** (harness gap) | cursor-a/b/c show three different macro layouts, but wall-clock + state-bearing chaos means the deltas cannot be attributed to cursor position. The interaction metric agrees it can't tell: `cursor_composition` "pass 0.493" carries the panel's own note "time delta contaminates the comparison" — a self-flagged misfire, overridden to fail. Needs a paused-clock comparable triptych. |
| idle | pass | matrix-music (cursor parked, track playing) is fully alive — field-wide braided rivers, mean L 0.083 at f04; matrix-neither survives at ember level (three dim curl knots, visibly evolving f01→f06, activity 0.0123 above the frozen floor). |
| readability | **fail** (harness gap) | From matrix-cursor (3 s, audio silent) the field just decays to dim wisps (mean L 0.0050 by f04) — no feature attributable to the cursor appears, so no cursor→effect mapping can be stated from captures alone. Can't tell = fail. Needs the 30 s matrix-cursor of the spec. |
| reversibility | n/a | Stated thesis is accumulation — particles carry state and "fast particles … leave long streaks"; returning the cursor cannot return the frame. Said explicitly per taste.md's n/a clause. (The contaminated measurement: aba SSIM 0.897, just under the 0.9 bar, with time delta included.) |
| dominance | pass | cursor-active vs cursor-idle: both are unmistakably the same dim ember-filament piece, same palette, same vocabulary, similar luminance; the cursor contributes at most a modest central activity delta (metric `cursor_bounded` 0.257 ≤ 1/3 — and wall-clock contamination makes that an over-estimate of the cursor share). |
| convention | **fail** (harness gap) | No cursor-attributable response is visible in matrix-cursor or the triptych, so the direction of the first gesture's effect cannot be judged as a cold viewer. Can't tell = fail. Same missing capture as readability. |
| latency | **fail** (harness gap) | latency.mp4 (0.78 s, 11 frames extracted) shows a dim braid field with no identifiable feature tracking a cursor move — the cursor's position is unknowable from the capture, so ≤ 3-frame tracking can't be verified. Needs a latency burst with cursor-position annotation (the spec's latency-*.png waypoints). |

**Interaction: 2/6 over applicable criteria — BELOW the ship-it floor**
(floor allows max 2 fails; there are 4). All four fails are
harness-gap fails: the captures as built cannot answer the questions
for a wall-clock, state-bearing piece.

### Music (4) — applicable (audio-reactive, stems)

| Criterion | Verdict | Why |
|-----------|---------|-----|
| motion_over_luminance | pass | Quiet vs peak: shapes sit in different places entirely — one slow horizontal band centre-right (still 4) vs dense zigzag braids spanning the frame (w3-f04); edges, silhouettes, and streak directions all move. Corroboration: every audio term is geometric — `drive = live·(0.16 + 1.8·bass_stem + 1.1·energy)` multiplies velocity, downbeat/drums fire radial impulses, `u_to_section_change` pulls inward. |
| bass_movement | pass | In clip-peak the braid configuration reconfigures at beat cadence (f01→f04→f07→f10 are different geometries, ~0.56 s beat period) and the dense slice shows new burst arms appearing within one–two 83 ms frames of beat boundaries; at the macro scale the 128.06 s drop moves the entire field outward (w2-f04). Corroboration: bass stem lives inside `drive` (velocity), not inside a brightness multiplier. |
| rhythm_in_stills | pass | Still 2 is the implosion frozen mid-convergence (needles pointing inward); w0-f10 / w4-f08 are detonations frozen mid-flight; streak length encodes velocity in every frame. |
| quiet_reads_quiet | pass | Measured `motion_dynamic_range` 0.133 (quiet window's median flow is 13 % of the peak's, ≤ 0.55 bar). Still 4 is one slow soft band — calmer in form (short streaks, defocus), not a dimmed peak. |

**Music: 4/4.**

### Song-level (6) — applicable (analysis JSON + u_section_*/u_downbeat/u_song_progress/stems)

| Criterion | Verdict | Why |
|-----------|---------|-----|
| section_readability | pass | Without the timeline: intro (black) ✓, pre-peak (converging implosion fans) ✓, peak (hot cream-cored knot — denser and hotter than the verse's scattered dim curls) ✓ — 3+ unambiguous. Residual ambiguity: quiet (4) and outro (5) share the dim-band vocabulary. |
| downbeat_anchored | pass | ≥ 2 structural events on the grid: the drop detonation lands inside w2-f04 (128.1–128.6 s; boundary 128.06, downbeat 128.50) and the first ignition inside w0-f10 (6.7–7.2 s; beats 6.83/7.38, boundary 7.34) — both on-grid within the 2 fps capture resolution, and both keyed to clock uniforms in the code (`u_section_progress` flip, `u_downbeat`/beatHit), not to loudness. The outro puff seeds at the 197.18 s final boundary. |
| pre_tension | pass | Still 2 vs still 1: converging directional fans vs relaxed scattered curls — squeezed and withholding, 1.5 s before the drop; clip-w2 f01 shows the defocused feather-gather. `u_to_section_change` drives the inward pull. |
| per_stem_discrimination | pass | Two stems, two visibly different jobs: bass stem = sustained cruise (the verse's flowing braid rivers, w1), drums stem = staccato radial needle flares (build/peak bursts, w2/w3). Cruise vs punch, both geometric. |
| long_arc | pass | From the clips (the honest source for an accumulation piece): trough at intro (mean L 0.004) → cruising verse (0.03–0.08) → drop spike (0.150) → sustained peak (0.02–0.07) → trough at outro (0.004). Measured `arc` 0.225 pass (weak proxy; the eye agrees here). Stills alone invert peak/quiet (0.0106 vs 0.0155) because seeks under-accumulate — noted, clips carry it. |
| recapitulation | pass | The opening gesture returns at opposite energy: w0-f10 (white dandelion ignition on black) ↔ w4-f08 (dim amber starburst puff on black, mean L 0.029 vs 0.020). Related, one unmistakable delta. The still pair (black vs dim band) is weaker evidence; the clips carry the verdict — documented. |

**Song-level: 6/6.**

### Dual-input (7) — applicable (cursor + audio)

| Criterion | Verdict | Why |
|-----------|---------|-----|
| dual_channel_readability | pass | In matrix-both, two signatures are visible inside 3 s: the field-wide beat-driven swell (music) and a persistent gathered knot dead-centre with radial arms (cursor) — f04's central concentration has no counterpart in matrix-music f04, whose rivers spread laterally with no centre bias. |
| channel_non_overlap | pass | Nameable disjoint features across the cells: music owns global drive/swell and the braid rivers (matrix-music); the cursor owns the local central gather (matrix-both vs matrix-music delta). Corroboration: disjoint parameters — audio → drive/burst/detonate, cursor → local attract force; the only shared target (`glowR`) is a bounded local additive. |
| music_without_cursor | pass | matrix-music alone passes the music-side criteria: alive field-wide, beat-cadence reconfiguration, mean L 0.083 — the cursor is not load-bearing for music reactivity. |
| cursor_without_music | **fail** (harness gap) | In matrix-cursor (audio silent) the field decays to dim wisps with no visible cursor response — the cursor-side criteria do not survive silence on this capture. The 3 s window also cannot show the dwell-gather a 30 s capture might; fail either way, capture named. |
| conflict_resolution | pass | matrix-both stays bounded with both channels pushing: bright central knot at mean L 0.0699, max 1.0 on thin needle cores only, no blowout (`no_blowout` passes everywhere), no cancellation — the knot and the swell coexist. |
| authority_during_build | **fail** (harness gap) | No capture spans a build: matrix-both sits at the 147.3 s peak window and latency.mp4 is 0.78 s of un-annotated darkness. Cursor authority during the 120–128 s gather is untestable as captured. |
| idle_cell | pass | All four cells survive: both (activity 0.428) and music (0.603) are loudly alive; cursor (0.048) drifts dim wisps; neither (0.0123) holds three slowly-curling visible ember knots across all 3 s — nothing freezes, goes fully black, or looks broken. Measured `idle_matrix_alive` pass. |

**Dual-input: 5/7 — meets the floor exactly** (2 fails allowed, 2
fails present, both harness gaps).

### Layered (11)

Not applicable — the piece is a `passes:` pipeline (sim → bins →
trails → display), not a `layers:` stack; there are no per-layer solos
because there are no layers (`manifest.json` `layers: []`).

### Integration (5) — graded from clips

| Criterion | Verdict | Why |
|-----------|---------|-----|
| orphan_event | pass | Every one-shot has a perceivable cause: the first dandelion ignition rides the track's first strong beats (6.83/7.38 s, w0-f10); the drop detonation lands on the 128.06 s boundary the listener hears as the drop (w2-f04); per-beat needle flares ride the beat grid by construction (clock uniforms, w3); the wind-down puff seeds at the 197.18 s final boundary and blooms continuously out of the visible ember field (w4 f01→f08) — no element ever pops in for its own reasons. |
| pasted_overlay | n/a | One integrated particle field; no discrete overlay elements exist — bursts displace the same medium they live in. |
| perspective_consistency | n/a | No receding plane. |
| boundary_artifacts | pass | Swept the stills and ~50 clip frames at frame edges: fans and rivers are cut by the frame with soft feathered ends (normal cropping), the burning-cross filaments run continuously edge to edge, and no tiling-cell seams or square splat clips appear anywhere (the bins grid stays invisible). |
| accretion_causality | pass | The only staged side effects are trail blooms and the outro puff — each appears at-or-after the particles/detonation that own it (w4: boundary at f01-f02, bloom peaks f08). Nothing pre-echoes its cause. |

**Integration: 3/3 over applicable criteria.**

## Dimension panels

### palette_cohesion — 0 fails

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| warm_arc | pass | Measured: 1.0 on every coloured still; intro near-monochrome (note in panel). Not a cool pixel in 22 graded images; bright cores stay warm-ordered (R>G>B). |
| lum_not_hue | pass | Measured: every core still — L range 0.17–0.33 against hue std 5.1–7.1°. Contrast is carried entirely by luminance. |
| dominant_hues | pass | Measured: 1 hue cluster per coloured still (hard gate, passes). |
| no_collapse | pass | Measured `rms_contrast`: core stills 0.035–0.057, all ≥ 0.03. (Frame 0 fails at 0.0001 but is excluded as non-core per the panel's own rule.) |
| hue_drift_smooth | pass | Measured: adjacent-still steps 2.4/1.8/1.0/0.0° — no wrap blink. |

### composition — 0 fails

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| squint_macro | pass (override) | Metric fails music-01 (0.002) and music-03 (0.0049 vs 0.005 floor); override documented in §Metrics panel — the 0.6 mask is blind to the dim braid mass that carries the macro read. Same call as the mesmerizing `squint_macro_structure` row — they agree. |
| landing_regions | pass | 2–4 regions per core still (see mesmerizing `landing_regions_2_4`). |
| empty_zones | pass | Metric demoted to descriptive; judged by eye: the voids are intrinsic (89–95 % genuinely dark rest area, no vignette doing the work) — the chiaroscuro IS the composition. |
| layout_varies | pass | Measured: min pairwise correlation −0.039 < 0.80. |
| regions_migrate | pass | Hot zones sit lower-left → right-edge → centre-right → centre → lower-left across stills 1–5. |

### motion — 0 fails

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| trackability | pass | Measured: all five clips pass (warp_err 0.042–0.119 ≤ 0.12; median speeds 0–1.29 deg/s, far under the pursuit ceiling). |
| jerk_smooth | pass (override) | Measured `jerk_smooth_all` FAILS via clip-w3 (0.2064 vs jerk_max 0.20, a 3 % excursion against a threshold the code marks PROVISIONAL, corpus n = 25 clips / 4 pieces). Override documented in §Metrics panel: the dense 12 fps slice shows zero teleports/stutter — the flow-jerk comes from beat-locked radial velocity impulses (the thesis mechanism bass_movement REQUIRES) plus defocus breathing, which Farnebäck flow reads as acceleration. Re-fit trigger filed. |
| multi_scale_desync | pass | In clip-w3: macro river drift, meso braid curling, fine filament shimmer, and the focus-breathing cycle run on visibly different periods and never pause together; clocks corroborated (u_time envelopes 0.037/0.061, u_beat_phase, per-frame hash jitter). |
| never_frozen | pass | Measured: all clips ≥ 0.0697 mean flow (floor 0.0005); the quiet windows drift, never stall. |
| direction_in_quiet | pass | clip-w4: the ember band drifts coherently leftward and the puff radiates from its centre — felt direction, not residual jitter. |

### intensity — 0 fails

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| has_peak | pass | The drop window is the unambiguous maximum: w2-f04 mean L 0.1499, 12.8 % of pixels > 0.5 — 40× the frames three seconds either side. |
| has_quiet | pass | Real dark: intro/outro clips idle at mean L 0.0036–0.004; the build holds a near-black breath before the drop. |
| quiet_flow_drops | pass | Measured `motion_dynamic_range` 0.133 ≤ 0.55. |
| quiet_scale_tightens | pass | Quiet tightens form, not just light: streaks shorten (speed-gated deposition), the field contracts to one band, defocus softens edges (still 4 vs w3-f04). |
| no_blowout | pass | Measured: every still passes (hard gate); peak frames compress through aces — max mean L 0.15 at the detonation, nowhere near bleach. |

### depth — 1 fail

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| multi_octave | **fail** | Measured `depth_octaves`: music-04 carries only 2 octaves (threshold 3) — the defocus state genuinely collapses the fine scale in the quiet core still; music-05 also reads 2 (non-core). No misfire to document: the value is real, the quiet band is a soft blur with stipple but no mid-scale structure. (music-01/02/03: 3/5/5 — the energetic stills are fine.) |
| near_far_distinct | pass | Downsampled: glow masses on black; native: filament strands. Two different images. |
| fine_texture | pass | Centre crops hold filament detail the full view hides (agrees with mesmerizing `fine_texture_reward`). |
| layer_interaction | n/a | No layer stack (passes pipeline). |

### form_ending — 0 fails

| Criterion | Grade | Evidence |
|-----------|-------|----------|
| has_arc | pass | Measured `arc` 0.225 pass; the eye on clips agrees (trough → cruise → spike → trough) — no override needed despite the proxy's weakness. |
| ending_differs | pass | Intro still: empty black. Outro still: visible feathered puff band. The piece went somewhere and is exhaling, not resetting. |
| recapitulation | pass | Same verdict as the song-level row, same evidence: ignition puff ↔ dying puff (clips carry it). |
| not_seamless_loop | pass | A loop would be noticed: the outro holds a visible dying starburst then fades; the intro holds six seconds of black then a white dandelion ignition — the seam would read as a hard reset of vocabulary. |

## Metrics panel

Source: `bin/aesthetic-metrics.py piece|interaction|gate kinetic-energy`
(`metrics.json` in the evidence dir; stills read from the v2 evidence
dir, which is md5-identical to the current captures).

- **Gate: pass** (no_blowout + dominant_hues clean on all stills).
- **Stills: 43/54 per-still tests + 3/3 piece-level = 46/57.** Fails:
  frame 0 (rms_contrast, squint_macro, empty_zones, one_over_f — all
  vacuous on a black intro frame, excluded from core anyway),
  one_over_f on music-02/03/05 (−1.73 to −2.10, just outside the
  −4.5..−2.2 band — advisory, maps to no criterion), squint_macro on
  music-01/03 (overridden, below), depth_octaves on music-04/05
  (music-04 drives the multi_octave fail above).
- **Clips: 14/15 per-clip + 4/5 piece-level = 18/20.** Sole failure
  chain: clip-w3 jerk_smooth 0.2064 → jerk_smooth_all.
- **Interaction: 3/4** (cursor_composition pass*, cursor_bounded pass,
  idle_matrix_alive pass; cursor_reversibility 0.897 fail) — with the
  panel's own note on three of four: "wall-clock piece: time delta
  contaminates the comparison". `stills_comparable: false`.

Documented metric overrides (each next to its grade above):

1. **squint_macro → pass** (mesmerizing + composition). The 0.6 mask
   level counts only hot cores; the dim-amber braid mass (L ≈ 0.1–0.3)
   that visibly carries the macro composition in music-01/03 is
   invisible to it. taste.md flags the threshold as mid-sweep (7/14
   positives at calibration) and explicitly legitimizes overrides here.
2. **jerk_smooth → pass** (motion; feeds prediction_continuity). The
   0.2064 value is 3 % over a PROVISIONAL threshold (code comment:
   corpus n = 25 clips / 4 pieces, positives p90 = 0.12). The visible
   fail shapes the metric proxies for — teleports, stutter — are
   absent in the 12 fps dense slice (evidence
   clip-w3-peak-dense-f01..f12). The excursion's sources are the
   beat-locked radial velocity impulses that ARE the piece's
   phase-lock thesis (and that bass_movement doctrine demands) and the
   defocus breathing, which optical flow misreads as acceleration on a
   sparse spark field. **Re-fit trigger per §Calibration discipline:**
   mechanically applied, this metric would fail the hard gate and
   demote a piece whose motion grades clean by eye — a
   greater-than-one-tier disagreement. Re-run
   `bin/aesthetic-metrics.py calibrate` with beat-impulse pieces in
   the corpus before trusting jerk_max = 0.20 on phase-locked pieces.
3. **cursor_composition "pass" → criterion fail** (interaction). The
   metric's own output note declares the comparison contaminated by
   the wall-clock time delta; a 0.493 frame difference between
   cursor-a/b/c cannot be attributed to the cursor in a state-bearing
   piece. The metric needs `stills_comparable: true` input to mean
   anything; until then the criterion fails as a harness gap.

## What's working

- **The hard gate survives the binary regime.** Continuity: twelve
  consecutive 83 ms frames of the peak window show the same braids
  smoothly evolving — zero teleports, zero static, zero tearing across
  ~50 examined frames. Divergence: min NCD 0.953 across all window
  pairs after luminance normalization, and five genuinely different
  vocabularies (ignition / rivers / gather-detonate-cross / flame
  braids / dying puff). The Lyapunov sweet spot, measured and visible.
- **Phase-lock as geometry, delivered.** The drop detonation lands in
  the frame straddling the 128.06 s boundary at 40× the surrounding
  luminance; the first ignition rides the track's first strong beats;
  per-beat needle flares reconfigure the peak braids at beat cadence.
  All of it position/velocity, none of it a glow envelope — 4/4 music,
  6/6 song-level.
- **The palette panel is flawless under the measured regime.** 1 hue
  cluster, luminance-carried contrast (hue std ≤ 7° everywhere),
  smooth 2.4°-max drift, zero blowout, real blacks. Strano chiaroscuro
  surviving binary scrutiny untouched.
- **The recapitulation rhyme still lands**: white dandelion ignition
  (w0-f10) ↔ dim dying starburst (w4-f08) — same gesture, opposite
  energy, and now graded pass under a stricter rubric than the one
  that first noticed it.
- **Integration is clean** — for a piece full of one-shot detonations,
  every burst has an audible or visible cause, and there isn't a hard
  edge or grid seam anywhere in the captures.

## What's imperfect (ranked, v2 priority order)

1. **The interaction family is below its floor (2/6), entirely on
   harness gaps.** The piece declares `cursor: true` but no existing
   capture can prove the cursor does anything: the triptych and
   aba/active-idle pairs are wall-clock contaminated
   (`stills_comparable: false`), the matrix cells run 3 s instead of
   the spec's 30 s, and the latency clip has no cursor-position
   annotation. Four interaction criteria + two dual-input criteria
   fail untestable. **The fix is building captures, not editing the
   shader**: a paused-clock (or audio-time-pinned) triptych mode, 30 s
   matrix cells, a cursor-path overlay or known waypoints in the
   latency burst, and one matrix-both window spanning a build
   (t ≈ 120–130 s). Only after those exist can anyone say whether the
   cursor story also needs shader work.
2. **Frame 0 is a black rectangle (eye_lands fail).** Max L 0.021 at
   t = 1.0; the first six seconds offer nothing to land on. v1 and v2
   both noted it; the binary rubric finally prices it. A sub-0.05 L
   ember seed during the intro silence would fix it without touching
   quiet_reads_quiet (the v2-era suggestion stands).
3. **The quiet still carries only 2 octaves (multi_octave fail,
   measured).** The defocus state blurs away the mid-scale: music-04
   is one soft band with stipple. Keeping a thread of sharp filament
   detail through the defocus (cap the blur radius, or exempt the
   brightest cores from defocus) would restore the third octave
   without breaking the calm.
4. **Meta honesty drift, now three critiques old:** 2304 vs 1024
   particles, 4096/64x64 in sim.frag's header, 0.6 vs 0.08 idle
   floor. Five minutes of paperwork.
5. **Calibration debts this critique surfaced** (rubric-side, not
   piece-side): jerk_max = 0.20 misfires on beat-impulse pieces;
   squint_macro's 0.6 mask is blind to dim-mass chiaroscuro; the
   interaction metrics need `stills_comparable` to gate their own
   validity. All three are filed as re-fit triggers, not hand-waves.

## Harness gaps

| Criterion | Missing capture |
|-----------|-----------------|
| composition (interaction) | paused-clock comparable cursor triptych — piece is wall-clock; needs a capture mode that pins time so cursor deltas are attributable |
| readability (interaction) | 30 s matrix-cursor.mp4 per taste spec (current cell is 3 s; dwell-gather cannot develop) |
| convention (interaction) | same 30 s matrix-cursor, plus cursor-path overlay |
| latency (interaction) | latency burst with cursor-position annotation (latency-*.png with known waypoints) |
| cursor_without_music (dual_input) | 30 s matrix-cursor.mp4 |
| authority_during_build (dual_input) | matrix-both captured across a section build (e.g. t ≈ 120–130 s) |

Each gap is already counted as a FAIL in its family above. No other
criterion lacked evidence.

## Verdict

**structural-rethink** — with an unusual shape: the structure that
needs rethinking is mostly the capture harness, not the shader.

Bar arithmetic:

- Claim check: pass.
- Mesmerizing: 8/9 (eye_lands fail); **both prediction criteria pass**
  — the hard gate holds.
- Families over applicable criteria: interaction 2/6 (**below floor**,
  4 fails vs 2 allowed), music 4/4, song_level 6/6, dual_input 5/7
  (at floor), layered n/a, integration 3/3.
- Dimension panels: palette 0 fails, composition 0, motion 0,
  intensity 0, depth 1 (multi_octave), form_ending 0 — every panel
  ≤ 1 fail.
- **Total fails: 8** (eye_lands; composition, readability, convention,
  latency; cursor_without_music, authority_during_build;
  multi_octave). Harness-gap fails: 6 of the 8.
- Verdict ladder: chef-doeuvre out (fails + gaps). Ship-it out twice
  over (total fails 8 > 3; interaction below floor). Needs-tweak out:
  excluding the six gap fails leaves eye_lands + multi_octave, which
  do not share one shader edit — and the letter of the rubric routes
  "> 6 total fails" to structural-rethink regardless.

Reading for the handback: the piece itself is two small shader fixes
away from where v2 thought it already was — the visual core (both
predictions, 4/4 music, 6/6 song-level, five clean panels, gate pass)
holds up under the strictest rubric this repo has had. What collapsed
under v2-binary is *evidence discipline*: a wall-clock, state-bearing,
cursor-declaring piece cannot currently prove its own interactivity.
Build the four capture upgrades first (gap table above); then a
needs-tweak round can take the intro ember seed (eye_lands) and the
defocus octave floor (multi_octave); the meta paperwork can be fixed
any time outside the loop. Re-grading with real captures could land
anywhere from ship-it to another rethink depending on what the cursor
actually does on screen — which is exactly the question the current
harness can't answer.

```yaml
piece: kinetic-energy
iteration: 3
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
  composition: fail        # harness gap — wall-clock contaminated triptych
  idle: pass
  readability: fail        # harness gap — 3 s matrix-cursor, no legible mapping
  reversibility: n/a       # thesis declares streak/state accumulation
  dominance: pass
  convention: fail         # harness gap — no attributable cursor response
  latency: fail            # harness gap — un-annotated latency clip
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
dual_input_passes: 5/7
dual_input_probes:
  dual_channel_readability: pass
  channel_non_overlap: pass
  music_without_cursor: pass
  cursor_without_music: fail   # harness gap — 3 s silent-cursor cell
  conflict_resolution: pass
  authority_during_build: fail # harness gap — no build-spanning capture
  idle_cell: pass
integration_passes: 3/3
integration_probes:
  orphan_event: pass
  pasted_overlay: n/a          # single integrated field, no overlay elements
  perspective_consistency: n/a # no receding plane
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
    squint_macro: pass         # documented override — 0.6 mask blind to dim braid mass
    landing_regions: pass
    empty_zones: pass
    layout_varies: pass
    regions_migrate: pass
  motion:
    trackability: pass
    jerk_smooth: pass          # documented override — provisional jerk_max, re-fit filed
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
    multi_octave: fail         # measured — quiet core still carries 2 octaves
    near_far_distinct: pass
    fine_texture: pass
    layer_interaction: n/a     # no layer stack
  form_ending:
    has_arc: pass
    ending_differs: pass
    recapitulation: pass
    not_seamless_loop: pass
metrics:
  gate: pass
  stills_passed: 46/57
  clips_passed: 18/20
  interaction_passed: 3/4
  overrides:
    - squint_macro: "pass — 0.6 mask level blind to dim-amber braid mass carrying the macro read (threshold mid-sweep per taste.md)"
    - jerk_smooth: "pass — 0.2064 vs PROVISIONAL jerk_max 0.20; dense 12fps slice shows no teleports/stutter; beat impulses + defocus breathing inflate flow jerk; re-fit trigger filed"
    - cursor_composition: "metric pass overridden to criterion fail — panel self-flags wall-clock contamination; delta not attributable to cursor"
harness_gaps:
  - criterion: composition
    missing: paused-clock comparable cursor triptych (piece is wall-clock; stills_comparable=false)
  - criterion: readability
    missing: 30 s matrix-cursor.mp4 per taste spec (current cell is 3 s)
  - criterion: convention
    missing: 30 s matrix-cursor.mp4 with cursor-path overlay
  - criterion: latency
    missing: latency burst with cursor-position annotation (latency-*.png waypoints)
  - criterion: cursor_without_music
    missing: 30 s matrix-cursor.mp4
  - criterion: authority_during_build
    missing: matrix-both.mp4 captured across a section build (t ≈ 120–130 s)
top_fix: null
evidence:
  - evidence/kinetic-energy-v3/music-00-t1.0-intro.png
  - evidence/kinetic-energy-v3/music-01-t66.7-verse.png
  - evidence/kinetic-energy-v3/music-02-t126.6-pre-peak.png
  - evidence/kinetic-energy-v3/music-03-t147.3-peak.png
  - evidence/kinetic-energy-v3/music-04-t194.6-quiet.png
  - evidence/kinetic-energy-v3/music-05-t199.7-outro.png
  - evidence/kinetic-energy-v3/clip-w0-intro-f01.png
  - evidence/kinetic-energy-v3/clip-w0-intro-f10.png
  - evidence/kinetic-energy-v3/clip-w1-verse-f01.png
  - evidence/kinetic-energy-v3/clip-w1-verse-f05.png
  - evidence/kinetic-energy-v3/clip-w1-verse-f10.png
  - evidence/kinetic-energy-v3/clip-w2-build-f01.png
  - evidence/kinetic-energy-v3/clip-w2-build-f04.png
  - evidence/kinetic-energy-v3/clip-w2-build-f06.png
  - evidence/kinetic-energy-v3/clip-w2-build-f09.png
  - evidence/kinetic-energy-v3/clip-w3-peak-f01.png
  - evidence/kinetic-energy-v3/clip-w3-peak-f04.png
  - evidence/kinetic-energy-v3/clip-w3-peak-f07.png
  - evidence/kinetic-energy-v3/clip-w3-peak-f10.png
  - evidence/kinetic-energy-v3/clip-w3-peak-dense-f01.png
  - evidence/kinetic-energy-v3/clip-w3-peak-dense-f02.png
  - evidence/kinetic-energy-v3/clip-w3-peak-dense-f03.png
  - evidence/kinetic-energy-v3/clip-w3-peak-dense-f04.png
  - evidence/kinetic-energy-v3/clip-w3-peak-dense-f05.png
  - evidence/kinetic-energy-v3/clip-w3-peak-dense-f06.png
  - evidence/kinetic-energy-v3/clip-w3-peak-dense-f07.png
  - evidence/kinetic-energy-v3/clip-w3-peak-dense-f08.png
  - evidence/kinetic-energy-v3/clip-w3-peak-dense-f09.png
  - evidence/kinetic-energy-v3/clip-w3-peak-dense-f10.png
  - evidence/kinetic-energy-v3/clip-w3-peak-dense-f11.png
  - evidence/kinetic-energy-v3/clip-w3-peak-dense-f12.png
  - evidence/kinetic-energy-v3/clip-w4-outro-f01.png
  - evidence/kinetic-energy-v3/clip-w4-outro-f08.png
  - evidence/kinetic-energy-v3/cursor-a.png
  - evidence/kinetic-energy-v3/cursor-b.png
  - evidence/kinetic-energy-v3/cursor-c.png
  - evidence/kinetic-energy-v3/cursor-aba-0.png
  - evidence/kinetic-energy-v3/cursor-aba-1.png
  - evidence/kinetic-energy-v3/cursor-active.png
  - evidence/kinetic-energy-v3/cursor-idle.png
  - evidence/kinetic-energy-v3/matrix-both-f01.png
  - evidence/kinetic-energy-v3/matrix-both-f04.png
  - evidence/kinetic-energy-v3/matrix-both-f06.png
  - evidence/kinetic-energy-v3/matrix-music-f01.png
  - evidence/kinetic-energy-v3/matrix-music-f04.png
  - evidence/kinetic-energy-v3/matrix-music-f06.png
  - evidence/kinetic-energy-v3/matrix-cursor-f01.png
  - evidence/kinetic-energy-v3/matrix-cursor-f04.png
  - evidence/kinetic-energy-v3/matrix-cursor-f06.png
  - evidence/kinetic-energy-v3/matrix-neither-f01.png
  - evidence/kinetic-energy-v3/matrix-neither-f04.png
  - evidence/kinetic-energy-v3/matrix-neither-f06.png
  - evidence/kinetic-energy-v3/latency-f01.png
  - evidence/kinetic-energy-v3/latency-f06.png
  - evidence/kinetic-energy-v3/latency-f11.png
  - evidence/kinetic-energy-v3/metrics.json
```
