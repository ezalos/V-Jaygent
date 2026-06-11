# kinetic-energy — iteration 2 critique

Independent critic, read-only. Evidence snapshot:
`evidence/kinetic-energy-v2/` (the inspect-music stills get overwritten
by later runs; the copies are the permanent record). Track: 202.2s,
107.7 BPM, F# minor; sections at 0 / 7.3 / 18.3 / 33.7 / 128.1 /
186.3 / 192.0 / 197.2s.

Architecture: `passes:` ping-pong (sim → bins → trails → display),
state-accumulating. Stills under-grade it (seek-based stills
under-accumulate the trail buffer vs continuous playback); motion and
intensity were graded from frames extracted at 2fps out of the five
fresh window clips. `clip-drop.mp4` was EXCLUDED — it is a stale
capture at the old exposure (file dated before the re-render; all
`clip-w*` files and stills are post-fix).

## Iteration history

v1 verdict: needs-tweak — squint was the only non-passing mesmerizing
probe (peak still mean L 0.0065, 0.02% of pixels above half-brightness;
frames 2/4/5 had max L ≤ 0.37, not one bright pixel). The recorded
top_fix was applied verbatim: display exposure at `shader.frag` (now
line 121) raised from `aces(col * (0.9 + 0.5 * u_energy_smooth))` to
`aces(col * (1.7 + 0.9 * u_energy_smooth))`, with a comment documenting
the change. Nothing else in the piece changed (sim, bins, trails are
untouched; the v1 meta-honesty footnotes are still present, see
What's imperfect). The v1 caution — don't break quiet-reads-quiet and
don't bleach palette_cohesion=5 — is checked explicitly below: both
held.

Measured effect on the same anchors (v1 → v2):

- peak still (t=147.3): mean L 0.0065 → 0.0106, pixels > 0.5
  0.02% → 0.112%, max L → 0.693
- pre-peak still (t=126.6): max L 0.369 → 0.738 — the implosion knot
  the code promised ("particles streak inward, bright") is now VISIBLE
  as converging radial streaks (still 2, right edge + lower-left)
- quiet still (t=194.6): max L 0.35 → 0.814 but mean L only 0.0155
  and 98.4% of pixels below 0.25 — quiet stayed structurally quiet
- in continuous playback the drop window now swings mean L
  0.0036 ↔ 0.150 inside 5 seconds (clip-w2 f09 vs f04) — a 40x
  macro-dynamic range that simply did not exist on screen in v1

## The claim

This piece claims that velocity is light: a curl-noise-advected
particle field whose colour is literal kinetic energy (speed² on an
ember → amber → cream ramp over near-black), where the beat winds the
flow up, the downbeat / section boundary releases it as a radial burst
from a wandering blast centre, and the pre-boundary implosion gathers
the field inward — phase-lock as geometry, not brightness.

Same two honesty footnotes as v1 (code unchanged outside the exposure
line): meta says "2304-particle field" but `sim.frag`/`bins.frag` run
`NUM = 1024` (file headers still say 4096 and 2304); and
`idle_behaviour` claims "drive floored at 0.6 when silent" while the
code computes an effective silent drive of 0.08 (`sim.frag:81-85`).
Neither breaks the visual thesis; both are still uncorrected.

## Frame-by-frame

| Frame | t (s) | What's there |
|-------|-------|--------------|
| 0 (intro) | 1.0 | Black rectangle. Mean L 0.0048, max 0.021 — nothing visible. One second into the track, before the first section boundary (7.3s); the trail buffer has barely accumulated. Honest silence, but a still with nowhere to land. |
| 1 (verse) | 66.7 | Sparse warm filament curls: a cluster with cream-white cores lower-left, comet curls along the top and right edges, amber river fragment right-of-centre. Mean L 0.0131, max 0.81. Eye lands lower-left. |
| 2 (pre-peak) | 126.6 | The implosion now READS: converging radial streak-fans at the right edge and lower-left (bright amber needles pointing inward), plus a dim accent top-centre. Brightest still of the set (mean L 0.0211, 2.08% of pixels above 0.25). This is the held breath 1.5s before the 128.1s drop — and this time you can see what's being gathered. |
| 3 (peak) | 147.3 | Hot amber knot with curling cream-cored filaments centre-right, a band lower-right, dim curls on the left edge and upper-left wisps. Mean L 0.0106, max 0.69, 0.112% above 0.5 — up from 99.98% black in v1. |
| 4 (quiet) | 194.6 | One soft, fuzzy amber river-band drifting centre-right (defocus state — the soft edges read as slow), faint streak residue left. Mean L 0.0155, but 98.4% of pixels below 0.25; the frame is one calm gesture on a void. |
| 5 (outro) | 199.7 | Dim feathered amber band lower-left-centre, second dimmer cluster at the right edge. The piece exhaling 2.5s before the track ends. |

Clip evidence (extracted at 2fps, key frames copied to the evidence
dir; no frozen lead-in in any clip — every window's first two frames
differ):

- `clip-w0-intro` (2.2-7.2s): near-black (mean L 0.0036-0.0040,
  f01-f05) then the first ignition — f10 is a white dandelion-puff
  burst with radial needle spokes and comet darts right-of-centre,
  max L 0.997. The piece opens with darkness and detonates with the
  first boundary.
- `clip-w1-verse` (66.7s): field-wide wavy braided rivers with cream
  cores (f01, mean L 0.082) breathing down to sparse curls and back —
  per-beat swell visible in the numbers (mean L oscillates
  0.025-0.082 across ten frames).
- `clip-w2-build` (126.6-131.6s, drop at 128.1): the arc of the piece
  in five seconds. f01 dense golden feather-fields (the gather,
  defocused); f04 THE DETONATION — multiple firework starbursts of
  fine white-hot needle spokes, mean L 0.150, 12.8% of pixels above
  0.5; f06 the field collapses into a burning-cross of filament lines
  spanning the frame; f09-f10 near-black exhale (mean L 0.0036).
  Implosion → explosion → afterglow → darkness, all inside one window.
- `clip-w3-peak` (147.3s): sustained dense flame-lick braids, structure
  reconfiguring every half-second but flowing coherently (f01 curls
  upper-half → f04 zigzag lightning braids centre → f07 softer
  defocused braids → f10 diagonal rivers upper-left). Mean L
  0.018-0.074, per-frame delta 0.027-0.084 — bright AND alive.
- `clip-w4-outro` (196.7-201.7s): near-black (f01-f05 mean L 0.0037)
  then one final amber starburst puff lower-left (f08) that fades by
  f10 — the wind-down "puffs", as the sim comment promises.

## Mesmerizing probes

Declared timescales: **continuity 0.25s** (kinetic spark piece,
107.7 BPM), **divergence 20s** (202s arc, one very long body section)
— same scales as v1 so the verdicts are comparable. Prediction graded
from the five fresh window clips.

| Probe | Verdict | Justification |
|-------|---------|---------------|
| Eye-landing | pass | Landing candidates migrate across frames 1-5: lower-left cluster (1) → right-edge implosion fan + lower-left burst (2) → centre-right knot (3) → centre-right soft band (4) → lower-left band (5). 2-3 candidates per frame, never the same spot twice. Caveat: frame 0 offers nothing (black at t=1.0) — graded as intro silence, one second before the music exists, not as a composition failure. Headless cursor parks near centre, so some centre-adjacent clustering may be cursor attract. |
| Prediction | pass | (a) Continuity at 0.25s: all five clips show coherent comet-flow; the detonation is a velocity impulse integrated through the sim, so even the firework instant (w2-f04) reads as radial flow, not displacement jumps; no static, tearing, or chromatic separation anywhere. (b) Divergence at 20s: window vocabularies are categorically different — black-then-dandelion ignition (w0), wavy braided rivers (w1), feather-gather → firework detonation → burning-cross collapse → black (w2), sustained flame-lick braids (w3), darkness with one dying puff (w4). Different configurations AND different moods, not different brightnesses of one rule; alternate sections also reverse circulation (`sim.frag:75`). |
| Squint | **pass** | The probe that failed-weak in v1, re-judged from what the frames show now. Every still except frame 0 blurs to a legible macro light/dark composition: lower-left mass vs void (1), tri-pole — right-edge fan, lower-left burst, top accent (2), single hot mass centre-right vs black (3), one band vs void (4), band + far accent (5). Fine filament texture still rewards stepping close — the dual-resolution test passes both ways now. In continuous playback the macro structure is stronger still (2-13% of pixels above half-brightness at energetic moments). Frame 0 squints to nothing, but one silent second of a 202s piece doesn't flatten the composition the other eleven graded images show. |
| Hue drift | pass | One warm family across all sixteen graded images: rust ember (quiet bands) → amber (body braids) → cream-white cores (peak) → white-hot needle spokes at the single detonation instant. The drift tracks energy across 30s spans; no jumps, no lock, no cool intrusion (the brightest pixels stay R>G>B, e.g. mean bright RGB 0.78/0.67/0.51 in w3-f04). |
| Mystery | pass | The force field is never shown — iron filings, never the magnet. The blast centre wanders invisibly; the gather drains the frame toward an unseen attractor; circulation reverses quietly between sections. New this iteration: the burning-cross collapse (w2-f06) — a frame whose mechanics aren't explained by anything else the piece shows you — and the piece still withholds where the next detonation will come from. |

**Mesmerizing result: 5/5 passes.** Prediction — the hard gate —
passes both sub-tests; squint, the v1 blocker, now passes on measured
and visible evidence.

## Interaction probes

`cursor: true`; cursor attract in `sim.frag:122-128`, local focus-smear
in `shader.frag:75-79` — code unchanged from v1, so the shader-verdicts
carry over. Headless frames park the cursor near centre.

| Probe | Verdict | Why |
|-------|---------|-----|
| Composition | weak | Pull falloff is local (`smoothstep(0.28, 0.0, mr)`, ~quarter-canvas). Dwell gathers a knot and starves the rest (state-bearing), but a single move only recomposes locally. |
| Idle | shader-pass | Explicit guard `dot(u_mouse,u_mouse) > 1.0`; baseline drive + MIN_SPEED jitter keep the field alive with audio playing. |
| Readability | shader-pass | Sparks bend toward and gather at the cursor; speed-as-light means stirred sparks brighten — now visibly so at the raised exposure. One move reveals the mapping. |
| Reversibility | n/a-stateful | Particle positions and trails are state; returning the cursor cannot return the frame. Legitimate for this architecture. |
| Dominance | shader-pass | Cursor impulse 0.55·DT vs beat burst 2.7 and detonation 7.5 (`sim.frag:118`) — the cursor cannot drown the field. |
| Convention | shader-pass | Attract-toward-touch plus local soft-focus smear matches priors. |
| Latency | shader-pass | `u_mouse` read raw, no smoothing; force applies next sim frame, glow smear same-frame. |

**Interaction result: 5/7** — unchanged; the cursor is a competent
stirring tool, not a composer.

## Music reactivity probes

| Probe | Verdict | Why |
|-------|---------|-----|
| Motion-over-luminance | shader-pass | `drive = live·(0.16 + 1.8·bass_stem + 1.1·energy)` multiplies the curl velocity field (`sim.frag:85,103`); downbeat/drums fire radial velocity impulses (`sim.frag:111-118`); `u_to_section_change` drives the inward gravity pull (`sim.frag:98-100`). Replace any with a constant and positions change, not brightness. |
| Bass→movement | shader-pass | `u_audio_bass_stem` lives inside `drive` — it scales particle velocity, which feeds back into streak length (`trails.frag:84`) and luminance. Bass literally accelerates the field. |
| Rhythm-in-stills | pass | Still 2 is the implosion frozen mid-convergence — and now bright enough to read as convergence; w0-f10 and w4-f08 are detonations frozen mid-flight; streak length encodes velocity in every frame. |
| Quiet-reads-quiet | pass | **The v1 caution, checked explicitly.** The exposure change is multiplicative, and deposition stays purely speed-gated (`trails.frag:92`): still 4 is one slow fuzzy band with 98.4% of pixels below 0.25; clip-w4 idles at mean L 0.0037 for its first 2.5 seconds. Quiet is still calm in form, not a dimmed peak — the fix did not break it. |

**Music result: 4/4.**

## Song-level composition probes

`audio.analysis.json` present; shader uses `u_section_id`,
`u_section_progress`, `u_to_section_change`, `u_song_progress`,
`u_downbeat`, `u_beat_phase`, `u_bar_phase`, two stems.

| Probe | Verdict | Why |
|-------|---------|-----|
| Section-readability | pass | Intro (black silence), verse (sparse curls), pre-peak (converging implosion fans), peak (dense hot knot) are unambiguous — 4 distinct. Ambiguity: quiet (4) and outro (5) share the dim-band vocabulary. |
| Downbeat-anchored | shader-pass | Unchanged: circulation reversal on `u_section_id & 1` (`sim.frag:75`), hot-zone reseed per section (`shader.frag:91`), detonation on `u_section_progress → 0` (`sim.frag:116`), gather on `u_to_section_change` (`sim.frag:98`). |
| Pre-tension | pass | Shader references both tension uniforms, and the frame evidence is now strong: still 2 shows bright inward-streaking fans 1.5s before the drop; clip-w2 f01 shows the defocused feather-gather. The held breath is visible, not just dark. |
| Per-stem-discrimination | shader-pass | bass stem → sustained flow drive; drums stem → staccato radial impulses (`sim.frag:111`). Cruise vs punch, both geometric. |
| Long-arc | pass | From the clips (the honest source for an accumulation piece): trough at the intro (mean L 0.004), cruising verse (0.03-0.08), drop spike (0.15), sustained peak window (0.02-0.07), trough again in the outro (0.004). Clear maximum, clear quiet. Caveat: the seek-based stills invert peak vs quiet (0.0106 vs 0.0155) because stills under-accumulate — noted, not penalised. |
| Recapitulation | pass | Upgraded from v1's weak. The intro's radial-burst vocabulary now visibly returns: w0-f10 (first ignition — white dandelion puff on black) and w4-f08 (last gasp — dim amber starburst on black) are the same gesture at opposite energies. Related, with an unmistakable delta. The still pair (0 black vs 5 dim band) is weaker evidence; the clips carry the verdict. |

**Song-level result: 6/6** — the piece composes the song, start to
finish.

## Dual-input probes

Code unchanged from v1; verdicts carry over.

| Probe | Verdict | Why |
|-------|---------|-----|
| Dual-channel readability | interaction-unclear | Not testable headless; structurally plausible (global audio energy vs local cursor gather). |
| Channel-non-overlap | shader-pass | Disjoint ownership except `glowR` (audio base + bounded local cursor additive, `shader.frag:74-79`). |
| Music-without-cursor | shader-pass | Cursor guard zeroes its terms at idle; every music verdict above graded on cursor-idle material. |
| Cursor-without-music | shader-pass | Cursor terms have no audio dependency; stirring still accelerates and ignites local sparks. |
| Conflict-resolution | weak | The `glowR` overlap is additive — bounded (+0.012 vs 0.003-0.020 base) and local, but strictly the anti-pattern shape. |
| Authority-during-build | shader-pass | Gather suppresses `drive` by up to 60% (`sim.frag:99`) but the cursor force is ungated. |
| Idle-cell | shader-fail | Unchanged: the neither-cell computes effective drive ≈ 0.5 × 0.16 = 0.08 → sub-visible embers, contradicting meta's claimed 0.6 idle floor. The exposure raise (~1.9x) does not rescue a field whose deposition is speed²-gated at terminal speeds of 0.02-0.04. |

**Dual-input result: 4/7** — below the 5/7 "two hands" bar, same as
v1. The piece honestly declares `testability: audio-only`.

## Layered composition probes

n/a — the piece is a `passes:` pipeline (sim → bins → trails →
display), not a `layers:` stack; the layered probes don't apply.

## Claim check

**Pass — and stronger than v1.** Velocity-is-light is now legible at
every energy level: slow = dim rust embers (stills 4/5), fast =
cream-white cores (w3 braids), fastest = white-hot needle spokes
(w2-f04). The implosion → detonation phase-lock is geometric and now
visible in BOTH stills and motion: still 2 shows the gather as bright
converging streaks (v1's "reads as absence" complaint is fixed by the
same exposure change), and clip-w2 plays the full arc — gather,
firework detonation, burning-cross afterglow, exhale to black. The
radial burst from the wandering blast centre is frozen mid-flight in
w0-f10 and w4-f08. Remaining caveats, unchanged from v1 and not
verdict-flipping: the particle-count claim (2304 vs actual 1024) and
the idle-floor claim (0.6 vs effective 0.08) are still wrong in
meta.yaml.

## Scores

| Dimension | Score | Note |
|-----------|-------|------|
| Palette cohesion | 5 | **The v1 caution, checked explicitly.** One warm ramp over true black in all sixteen graded images; bright pixels stay warm-ordered (R>G>B). The detonation instant (w2-f04) pushes its needle spokes whiter than cream (59% near-neutral among the 12.8% bright pixels) — but as thin white-hot sparks on black for ~half a second, the incandescent asymptote of the speed² ramp, not a clinical-white sheet. No bleach. Watch-item: any further DEPOSIT or exposure raise would tip this. |
| Composition | 4 | Landing clusters migrate across stills 1-5 and empty zones are intrinsic; but frame 0 is vacant (silent intro) and quiet/outro share the single-band vocabulary. |
| Motion | 5 | Macro curl drift + per-beat staccato bursts + always-on per-particle jitter + focus breathing on separate clocks; the clips show per-frame deltas 0.027-0.084 at the peak with zero tearing; even the detonation reads as flow. |
| Intensity & dynamic range | 5 | Raised from v1's 4 — the fix bought exactly this. Honest floor (mean L 0.0036-0.004 in intro/outro/post-drop) AND a ceiling that finally fills the room: the drop hits mean L 0.150 with 12.8% of pixels above half-brightness, a 40x swing inside one 5s window, aces-compressed instead of clipped. Silence is part of the piece, and so — now — is the explosion. |
| Depth | 4 | Filaments → braided tufts → rivers → macro hot zones; the macro tier now actually reads (squint pass) but the hierarchy still stops at ~3 scales. |
| Form & ending | 4 | Arc legible end-to-end: darkness → first dandelion ignition at the 7.3s boundary → cruising body of gather/detonate cycles → drop → dim final puff (w4-f08) → composed exhale to black 2.5s before the track ends. Earned, if a familiar shape. |

## What's working

- **The fix did exactly what it was prescribed to do, and nothing it
  was warned not to.** One multiplicative exposure change: squint
  weak → pass (peak still 0.02% → 0.112% pixels above 0.5; pre-peak
  max L 0.369 → 0.738), intensity 4 → 5, quiet still structurally
  quiet (98.4% of quiet-frame pixels below 0.25), palette still 5.
  Textbook needs-tweak resolution.
- **The implosion knot is no longer a promise in a comment.** Still 2
  shows bright radial streaks converging at the blast centre 1.5s
  before the drop — the single best piece of pre-tension evidence the
  piece has produced across two iterations.
- **The drop is now an event.** clip-w2 f04: full-frame firework
  starbursts at mean L 0.150, forty times the luminance of the frames
  three seconds on either side of it — followed by the burning-cross
  collapse (f06), a vocabulary that appears nowhere else in the song.
  Phase-lock as geometry, delivered at visible brightness.
- **All audio bindings remain geometric** (4/4 per-frame, 6/6
  song-level): bass accelerates, drums punch radially, sections
  reverse circulation, boundaries gather-then-detonate. No FFT-bar
  decoration anywhere.
- **Recapitulation emerged without being asked for.** The
  ignition-puff gesture that opens the piece (w0-f10) returns as the
  dying puff that closes it (w4-f08) — same form, opposite energy.
  v1 graded this weak; the raised exposure made the rhyme visible.
- **Continuity is still flawless for a burst piece** — impulses go
  through the integrator; no tearing, static, or chromatic separation
  in any of the fifty extracted frames.

## What's imperfect (ranked)

1. **Meta honesty drift, carried over from v1 unfixed:** meta.yaml
   claims a "2304-particle field" (code: `NUM = 1024`), `sim.frag`'s
   header claims 4096/64x64, `bins.frag`'s header claims 2304, and
   `idle_behaviour` claims a 0.6 silent-drive floor (code: effective
   0.08, `sim.frag:81-85`). Five minutes of comment/meta edits; the
   piece is now strong enough that its paperwork lying about it is
   the worst thing left.
2. **The neither-cell still dies** (idle-cell shader-fail, dual-input
   4/7): no audio + no cursor ≈ black screen with sub-visible embers.
   Defensible under `testability: audio-only`, but it contradicts the
   meta claim above — fixing #1 honestly means either implementing
   the 0.6 floor or rewording idle_behaviour.
3. **Frame 0 is a black rectangle.** Honest silence at t=1.0, and the
   first ignition lands with the 7.3s boundary — but anyone who pauses
   or thumbnails the first seconds gets nothing. A barely-visible
   ember seed (sub-0.05 L) during the intro would give the eye a
   promise without breaking quiet-reads-quiet.
4. **Quiet and outro stills share one vocabulary** (soft dim band) —
   the only adjacent-section ambiguity left in section-readability.
5. **The detonation needles flirt with neutral white** (59% of bright
   pixels near-neutral in w2-f04). Currently reads as white-hot spark
   physics; it is also the ceiling — any future brightness raise
   should trim `DEPOSIT` (trails.frag:25) per the v1 caution rather
   than touching exposure again.

## Verdict

**chef-doeuvre.**

5/5 mesmerizing probes with Prediction passing both sub-tests, claim
check pass, all six dimensions ≥ 4, palette at 5. The v1 diagnosis was
right: the geometry, phase-lock, and palette were already working
underneath, and the single exposure Edit raised squint to a pass and
intensity to a 5 without breaking quiet-reads-quiet or bleaching the
palette — both cautions verified by measurement. Reconciling label
against data per the calibration rule: the three chef-d'oeuvre
criteria are met on the evidence, so the label is chef-doeuvre — not
rounded up from ship-it, and not held down by the remaining blemishes
(meta honesty drift, idle-cell, black frame 0), none of which gate the
verdict. Stop polishing the visuals; fix the paperwork (imperfection
#1) outside the iterate loop.

```yaml
piece: kinetic-energy
iteration: 2
verdict: chef-doeuvre
claim_check: pass
mesmerizing_passes: 5
mesmerizing_probes:
  eye_landing: pass
  prediction: pass
  squint: pass
  hue_drift: pass
  mystery: pass
interaction_passes: 5
interaction_probes:
  composition: weak
  idle: shader-pass
  readability: shader-pass
  reversibility: n/a-stateful
  dominance: shader-pass
  convention: shader-pass
  latency: shader-pass
music_passes: 4
music_probes:
  motion_over_luminance: shader-pass
  bass_movement: shader-pass
  rhythm_in_stills: pass
  quiet_reads_quiet: pass
song_level_passes: 6
song_level_probes:
  section_readability: pass
  downbeat_anchored: shader-pass
  pre_tension: pass
  per_stem_discrimination: shader-pass
  long_arc: pass
  recapitulation: pass
dual_input_passes: 4
dual_input_probes:
  dual_channel_readability: interaction-unclear
  channel_non_overlap: shader-pass
  music_without_cursor: shader-pass
  cursor_without_music: shader-pass
  conflict_resolution: weak
  authority_during_build: shader-pass
  idle_cell: shader-fail
layered_passes: n/a
scores:
  palette_cohesion: 5
  composition: 4
  motion: 5
  intensity: 5
  depth: 4
  form_ending: 4
top_fix: null
evidence:
  - evidence/kinetic-energy-v2/music-00-t1.0-intro.png
  - evidence/kinetic-energy-v2/music-01-t66.7-verse.png
  - evidence/kinetic-energy-v2/music-02-t126.6-pre-peak.png
  - evidence/kinetic-energy-v2/music-03-t147.3-peak.png
  - evidence/kinetic-energy-v2/music-04-t194.6-quiet.png
  - evidence/kinetic-energy-v2/music-05-t199.7-outro.png
  - evidence/kinetic-energy-v2/clip-w0-intro-f10.png
  - evidence/kinetic-energy-v2/clip-w1-verse-f01.png
  - evidence/kinetic-energy-v2/clip-w2-build-f01.png
  - evidence/kinetic-energy-v2/clip-w2-build-f04.png
  - evidence/kinetic-energy-v2/clip-w2-build-f06.png
  - evidence/kinetic-energy-v2/clip-w3-peak-f01.png
  - evidence/kinetic-energy-v2/clip-w3-peak-f04.png
  - evidence/kinetic-energy-v2/clip-w3-peak-f07.png
  - evidence/kinetic-energy-v2/clip-w3-peak-f10.png
  - evidence/kinetic-energy-v2/clip-w4-outro-f08.png
```
