# kinetic-energy — iteration 1 critique

First recorded critique (the piece was iterated in past sessions; no
critique was written down). Independent critic, read-only. Evidence
snapshot: `evidence/kinetic-energy-v1/` — the inspect-music stills get
overwritten by later runs, so the copies there are the permanent record
of what this critique graded from. Track: 202.2s, 107.7 BPM, F# minor;
sections at 0 / 7.3 / 18.3 / 33.7 / 128.1 / 186.3 / 192.0 / 197.2s.

Architecture note: `passes:` ping-pong (sim → bins → trails → display),
state-accumulating — stills under-grade it; motion was graded from
frames extracted out of `clip-drop.mp4` / `clip-peak.mp4` and the five
window clips (`ffmpeg fps=2`), per the accumulation-pieces lesson.

## The claim

This piece claims that velocity is light: a curl-noise-advected
particle field whose colour is literal kinetic energy (speed² on an
ember → amber → cream ramp over near-black), where the beat winds the
flow up, the downbeat / section boundary releases it as a radial burst
from a wandering blast centre, and the pre-boundary implosion gathers
the field inward — phase-lock as geometry, not brightness.

Two honesty footnotes from reading the code against meta.yaml: the
thesis says "2304-particle field" but `sim.frag` / `bins.frag` actually
run `NUM = 1024` (the file headers say 4096 and 2304 respectively —
three different numbers, one truth); and `idle_behaviour` claims "drive
floored at 0.6 when silent" but the code floors `live` at 0.5 over a
0.16 base (`sim.frag:81-85`), an effective silent drive of 0.08.
Neither breaks the visual thesis; both should be corrected eventually.

## Frame-by-frame

| Frame | t (s) | What's there |
|-------|-------|--------------|
| 0 (intro) | 1.0 | Full-frame radial fan of fine amber needle-streaks detonating from top-centre (the t=0 section-boundary detonation), torus-wrapped mirror fan below. Brightest still of the set (mean L 0.040). Eye lands on the fan origin. |
| 1 (verse) | 66.7 | Near-black. Sparse spark constellation right-of-centre with comet curls, a second dimmer cluster on the left edge. Mean L 0.007, max 0.81 — a few genuinely hot pixels on a void. |
| 2 (pre-peak) | 126.6 | Almost empty — faint ember filaments lower-left, one dim cream smudge upper-left. Max L 0.369: not one bright pixel in the frame. This is the implosion gather 1.4s before the 128.1s boundary — the held breath is real, but the promised bright inward-streaking knot does not read. |
| 3 (peak) | 147.3 | Sparse amber spark-curls centre-right with a small concentrated cluster; scattered singles elsewhere. Mean L 0.0065, 0.02% of pixels above half-brightness — the song's peak still is 99.9% black. |
| 4 (quiet) | 194.6 | Dim rust-ember band drifting horizontally across the lower-left half, soft and fuzzy (defocus state). Structurally calm, genuinely dark. Max L 0.35. |
| 5 (outro) | 199.7 | A single faint ember arc lower-centre/left, dimmest frame (max L 0.23). The piece is exhaling to black 2.5s before the track ends. |

Clip evidence (extracted frames, copied to the evidence dir):

- `clip-drop` (boundary at 128.1s): f01 near-black gather →
  f03-f05 sparks igniting in spreading clusters → f07 field-wide
  ignition, golden radial tufts exploding from lower-left, distinct
  flow streams → f09 dense multi-zone ember field. Mean L ramps
  0.004 → 0.014 in ~4s; per-frame pixel delta triples. The
  implosion → detonation arc is real and legible in motion.
- `clip-peak` (147.3s): braided streak-rivers with cream-white hot
  cores building across upper-left and centre-right; coherent
  comet-trail motion, no tearing or glitch.
- `clip-w2-build` (126.6s): the held breath — near-black with faint
  diffuse embers; confirms still 2 is representative, not a seek
  artefact.
- `clip-w4-outro` (196.7s): one soft dim braided river crossing
  left-centre; quiet but alive.

## Mesmerizing probes

Declared timescales: **continuity 0.25s** (kinetic spark piece,
107.7 BPM), **divergence 20s** (202s arc with one very long body
section). Prediction graded from the seven committed clips.

| Probe | Verdict | Justification |
|-------|---------|---------------|
| Eye-landing | pass | Landing candidates migrate: fan origin top-centre (frame 0) → right-of-centre swarm (1) → centre-right cluster (3) → lower-left band (4) → lower-centre arc (5). 2-3 candidates per frame, never the same spot twice. Caveat: frame 2 offers almost nothing to land on, and the headless cursor parks near canvas centre, so some centre-adjacent clustering may be cursor attract, not pure composition. |
| Prediction | pass | (a) Continuity at 0.25s: streak motion in every clip is smooth coherent comet-flow — bursts are velocity impulses integrated through the sim, so even the detonation reads as flow, not displacement jumps; no static, no chromatic tearing. (b) Divergence at 20s: window vocabularies differ categorically — full-frame radial needle-fan (intro), braided amber river (verse), near-black held-breath gather (build), dense white-hot braids (peak), implosion→field-wide detonation (drop), lone dim river (outro) — plus alternate sections reverse circulation (`sim.frag:75`). Different configurations and moods, not different brightnesses of one rule. Closest call: verse vs peak share the braided-river vocabulary at different density. |
| Squint | **weak** | The chiaroscuro intent is there — hot clusters on true black — but four of six stills squint to near-empty: peak still mean L 0.0065 with 0.02% of pixels above 0.5; frames 2/4/5 have max L ≤ 0.37 (not one bright pixel). The macro light/dark composition the two wandering hot-zones (`shader.frag:91-98`) are supposed to guarantee only actually emerges in the clips' loudest moments. Fine texture rewards stepping close (filament braids), but the macro half of the dual-resolution test is under-exposed out of existence in most stills. |
| Hue drift | pass | Single warm family throughout: rust ember (quiet frames) → amber (body) → cream-white cores (peak clip f09). The mix drifts with energy across 30s spans; no jumps, no lock, zero cool intrusion in any frame. |
| Mystery | pass | The force field is never shown — you see the iron filings, never the magnet. The blast centre wanders invisibly; the gather drains the frame toward an unseen attractor before each boundary; circulation quietly reverses between sections. The piece withholds where the next detonation will come from. |

**Mesmerizing result: 4/5 passes** (squint weak). Prediction — the
hard gate — passes on both sub-tests.

## Interaction probes

`cursor: true`; cursor attract in `sim.frag:122-128`, local focus-smear
in `shader.frag:75-79`. Headless frames park the cursor near centre, so
all verdicts are shader-verdicts.

| Probe | Verdict | Why |
|-------|---------|-----|
| Composition | weak | Pull falloff is local (`smoothstep(0.28, 0.0, mr)`, ~quarter-canvas). Dwell gathers a knot and starves the rest over time (state-bearing), which is macro-ish, but a single cursor move only recomposes locally. |
| Idle | shader-pass | Explicit guard `dot(u_mouse,u_mouse) > 1.0` — idle adds nothing and removes nothing; baseline drive + MIN_SPEED jitter keep the field alive (with audio playing). |
| Readability | shader-pass | Sparks bend toward and gather at the cursor; speed-as-light means stirred sparks brighten. One move reveals the mapping. |
| Reversibility | n/a-stateful | Particle positions and trails are state; returning the cursor cannot return the frame. Legitimate for this architecture — called out, not penalised. |
| Dominance | shader-pass | Cursor impulse 0.55·DT vs beat burst 2.7 and detonation 7.5 (`sim.frag:118`) — the cursor cannot drown the field. |
| Convention | shader-pass | Attract-toward-touch plus local soft-focus smear matches priors; no inverted mappings. |
| Latency | shader-pass | `u_mouse` is read raw, no smoothing; force applies next sim frame and the glow smear is same-frame in display. |

**Interaction result: 5/7** — cursor-as-instrument claim holds, barely;
the cursor is a competent stirring tool, not a composer.

## Music reactivity probes

| Probe | Verdict | Why |
|-------|---------|-----|
| Motion-over-luminance | shader-pass | `drive = live·(0.16 + 1.8·bass_stem + 1.1·energy)` multiplies the curl velocity field (`sim.frag:85,103`); downbeat/drums fire radial velocity impulses (`sim.frag:111-118`); `to_section_change` drives an inward gravity pull (`sim.frag:98-100`). Replace any with a constant and *positions* change, not brightness. Display-pass brightness accents (`shader.frag:104-105`) exist but ride on top of geometric motion. |
| Bass→movement | shader-pass | `u_audio_bass_stem` lives inside `drive` — it scales particle velocity, and speed feeds back into both streak length (`trails.frag:84`) and luminance. Bass literally accelerates the field. |
| Rhythm-in-stills | pass | Frame 0 is a detonation frozen mid-flight; frame 2 is the implosion's held breath; streak length encodes velocity in every frame. Frozen time shows phase, not just gain. |
| Quiet-reads-quiet | pass | Deposition is purely speed-gated (`trails.frag:92`) and streaks shorten as speed drops — quiet is structurally calmer (frames 4/5: slow dim drifting bands), not a dimmed peak. |

**Music result: 4/4.**

## Song-level composition probes

`audio.analysis.json` present; shader uses `u_section_id`,
`u_section_progress`, `u_to_section_change`, `u_song_progress`,
`u_downbeat`, `u_beat_phase`, `u_bar_phase`, two stems.

| Probe | Verdict | Why |
|-------|---------|-----|
| Section-readability | pass | Intro (radial fan), build (near-black gather), outro (dim lone river) are unambiguous — 3+ distinct. Verse vs peak stills are the ambiguity: both sparse spark clusters at the same mean luminance (0.0067 vs 0.0065). |
| Downbeat-anchored | shader-pass | ≥2 structural events on composition uniforms: circulation reversal on `u_section_id & 1` (`sim.frag:75`), hot-zone reseed per section (`shader.frag:91`), detonation on `u_section_progress → 0` (`sim.frag:116`), gather on `u_to_section_change` (`sim.frag:98`). |
| Pre-tension | pass | `u_to_section_change` drives both the inward pull and the focus softening (`shader.frag:62-68`); frame 2 / clip-w2 show the visibly withheld near-black breath 1.4s before the drop. Shader + frame both confirm. |
| Per-stem-discrimination | shader-pass | bass stem → sustained flow drive; drums stem → staccato radial impulses (`sim.frag:111`). Two stems, two visually different roles (cruise vs punch), both geometric. |
| Long-arc | pass | Across stills + clips: moderate intro burst → cruising verse → dark gather trough → densest/brightest peak (clip-peak f09) → dim quiet → dimmest outro. Clear maximum and clear trough. |
| Recapitulation | weak | Intro and outro share medium and palette (streak field, warm ramp) with a huge energy delta, but the intro's signature radial-fan geometry never visibly returns — the relation is material, not compositional. |

**Song-level result: 5/6** — this piece genuinely composes, not just
reacts.

## Dual-input probes

| Probe | Verdict | Why |
|-------|---------|-----|
| Dual-channel readability | interaction-unclear | Not testable headless; structurally plausible (global audio energy vs local cursor gather) but unverified. |
| Channel-non-overlap | shader-pass | Mostly disjoint ownership: audio owns drive/burst/detonate/focus/exposure; cursor owns a local attract force and a local glow-radius add. Forces compose through the integrator. One shared target: `glowR` gets audio base + cursor additive (`shader.frag:74-79`) — bounded and local, so no arms race. |
| Music-without-cursor | shader-pass | The cursor guard zeroes its terms at idle; every music verdict above was graded on cursor-idle material. |
| Cursor-without-music | shader-pass | Cursor terms have no audio dependency; stirring still accelerates and ignites local sparks. The *surrounding* field goes near-black (see idle-cell). |
| Conflict-resolution | weak | The `glowR` overlap is additive rather than floor-and-ceiling — bounded (+0.012 vs 0.003-0.020 base) and local, but strictly the anti-pattern shape. |
| Authority-during-build | shader-pass | The gather suppresses `drive` by up to 60% (`sim.frag:99`) but the cursor force is not gated — cursor authority survives the build. |
| Idle-cell | shader-fail | The neither-cell (no audio, no cursor) computes effective drive ≈ 0.5 × 0.16 = 0.08 → terminal speeds ~0.02-0.04 → per-splat luminance ≤ 0.01, and `arc = 0` at `u_song_progress = 0` multiplies a further 0.7 (`shader.frag:109-111`). That is a black screen with sub-visible embers — and it contradicts meta's claimed 0.6 idle drive floor. |

**Dual-input result: 4/7** — below the 5/7 "two hands on the
instrument" bar. The cursor is a garnish on an audio-dominant piece
(which `testability: audio-only` honestly admits).

## Layered composition probes

n/a — the piece is a `passes:` pipeline (sim → bins → trails →
display), not a `layers:` stack; the layered probes don't apply.

## Claim check

**Pass.** Velocity-is-light delivers: speed² colour grading is visible
in every frame (slow = dim rust embers in frames 4/5, fast = cream-white
cores in clip-peak f09), streaks lengthen with speed, and the
implosion → detonation phase-lock is geometric and legible in
clip-drop (near-black gather f01 → field-wide radial ignition f07-09).
The radial burst from the wandering blast centre is frozen mid-flight
in frame 0. Two caveats that don't flip the verdict: the "bright
inward-streaking" implosion knot promised in `sim.frag:100-101` is
invisible at current exposure (frame 2 max L 0.37 — the gather reads
as absence, not convergence), and the particle-count claim (2304) is
wrong by more than 2x (code runs 1024).

## Scores

| Dimension | Score | Note |
|-----------|-------|------|
| Palette cohesion | 5 | Ember → amber → cream over true black; not a cool pixel in ten graded images; the white cores are warm cream, not clinical white. |
| Composition | 4 | Landing clusters migrate across all six stills and empty zones are intrinsic; but the composition often collapses to 1-2 dim clusters, and frame 2 is nearly vacant. |
| Motion | 5 | Macro curl drift + per-beat staccato bursts + always-on per-particle jitter + focus breathing, on separate clocks (u_time 0.053/0.041 envelopes, beat_phase, per-frame hash); direction is always felt; the gather still moves while suppressing flow. |
| Intensity & dynamic range | 4 | Honest floor (real black quiets, withheld build) and asymptotic aces peaks — but the ceiling is timid: mean L 0.014 at the drop's climax. The drop fills a corner, not the room. |
| Depth | 4 | Filaments → braided tufts → rivers → macro hot zones; fine structure builds the coarse, but the hierarchy stops at ~3 scales and the macro tier barely reads (see squint). |
| Form & ending | 4 | Arc is legible end-to-end: opening detonation, long body of gather/detonate cycles, dim exhale by 199.7s with the `u_song_progress` ease-out — a composed fade, if a slightly generic one. |

## What's working

- **The implosion → explosion physics is the real thing.** clip-drop
  shows a held-breath near-black gather snapping into a field-wide
  radial ignition with mean luminance tripling in ~4s — phase-lock as
  geometry, exactly the thesis. Best moment in the piece.
- **All audio bindings are geometric.** 4/4 per-frame music probes and
  5/6 song-level probes — bass accelerates, drums punch radially,
  sections reverse circulation and reseed the composition, the
  boundary gathers then detonates. No FFT-bar decoration anywhere.
- **Quiet genuinely reads quiet.** Speed-gated deposition means
  silence is slow and dark *in form* (frames 4/5), not a dimmed peak.
- **Palette discipline is total.** One warm ramp, luminance-only
  contrast, true blacks — Strano chiaroscuro honoured.
- **Continuity is flawless for a burst piece.** Impulses go through
  the integrator, so even detonations read as flow; no tearing,
  static, or chromatic separation in any clip.

## What's imperfect (ranked)

1. **The piece is under-exposed to the point of self-erasure in
   stills (squint weak).** Peak still: mean L 0.0065, 0.02% of pixels
   above half-brightness; frames 2/4/5 contain literally no bright
   pixel (max L ≤ 0.37). The macro envelope (`shader.frag:95-98`)
   exists in code but can't read when the trail field underneath it
   deposits this faintly. A paused frame at most timestamps is a black
   rectangle with faint smudges — and the still must already
   mesmerize. This also hides the implosion knot the code promises
   ("particles streak inward, bright") and caps Intensity at 4.
2. **Dual-input coordination is below its claim bar (4/7).** The
   neither-cell goes effectively black (shader-fail) and contradicts
   meta's stated 0.6 idle floor (code: live 0.5 × base 0.16 = 0.08
   effective). Either implement the claimed floor or drop the
   "living baseline when silent" sentence from meta.
3. **Verse and peak stills are near-interchangeable** (mean L 0.0067
   vs 0.0065, same sparse-spark vocabulary) — the long 33.7-128s body
   section leans on density alone for differentiation.
4. **Meta honesty drift**: 2304 vs 1024 particles, stale file headers
   (4096/64x64 in sim.frag, 2304/48x48 in bins.frag).
5. **Recapitulation is material, not compositional** — the intro's
   radial fan never returns; the outro is just the dimmest river.

## Verdict

**needs-tweak.**

4/5 mesmerizing probes with Prediction (the hard gate) passing on both
sub-tests, claim check pass, no dimension below 3, palette at 5 — but
squint is weak for a measurable, single-Edit reason: the display
exposure is tuned so low that the song's own peak still is 99.9% black
and the macro composition only exists in the clips' loudest seconds.
This is not a structural problem — the geometry, phase-lock, and
palette are all working underneath; the light just needs to be turned
up into the range where the squint can see what the sim is doing. One
multiplicative exposure change raises the weak probe without touching
anything that currently passes.

### Proposed fix

Raise the display exposure in `shader.frag:118` from
`col = aces(col * (0.9 + 0.5 * u_energy_smooth));` to
`col = aces(col * (1.7 + 0.9 * u_energy_smooth));` — roughly doubling
the tonemap input across the board with a slightly steeper energy
slope. Multiplicative, so quiet stays proportionally quiet and aces
compresses the peak asymptotically instead of clipping. (If the peak
braids then bleach past cream, trim `DEPOSIT` in trails.frag rather
than reverting the exposure.) Details in the YAML tail.

```yaml
piece: kinetic-energy
iteration: 1
verdict: needs-tweak
claim_check: pass
mesmerizing_passes: 4
mesmerizing_probes:
  eye_landing: pass
  prediction: pass
  squint: weak
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
song_level_passes: 5
song_level_probes:
  section_readability: pass
  downbeat_anchored: shader-pass
  pre_tension: pass
  per_stem_discrimination: shader-pass
  long_arc: pass
  recapitulation: weak
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
  intensity: 4
  depth: 4
  form_ending: 4
top_fix:
  dimension: squint (mesmerizing probe) / intensity
  what: |
    In shader.frag line 118, raise the tonemap exposure from
    `col = aces(col * (0.9 + 0.5 * u_energy_smooth));` to
    `col = aces(col * (1.7 + 0.9 * u_energy_smooth));`. One Edit,
    multiplicative, bounded by aces. If the peak then bleaches past
    warm cream over large areas, compensate by trimming DEPOSIT in
    trails.frag (1.15 -> 0.95) instead of reverting the exposure.
  why: |
    Squint is the only non-passing mesmerizing probe and it fails on
    numbers, not taste: the peak still (frame 3, t=147.3) has mean
    luminance 0.0065 with 0.02% of pixels above 0.5, and frames 2/4/5
    have max luminance <= 0.37 - no bright pixel at all. The macro
    hot-zone envelope (shader.frag:95-98) and the implosion knot
    (sim.frag:100) are both invisible at this exposure. The clips
    prove the structure is there; the display pass is hiding it.
  caution: |
    Must not break quiet-reads-quiet (keep the change multiplicative -
    no additive floor, leave the 0.005 near-black clamp and vignette
    alone) nor palette_cohesion = 5 (aces on the warm ramp stays warm;
    verify the drop's cream cores don't spread into clinical white
    sheets - that's the DEPOSIT trim's job if it happens).
evidence:
  - evidence/kinetic-energy-v1/music-00-t1.0-intro.png
  - evidence/kinetic-energy-v1/music-01-t66.7-verse.png
  - evidence/kinetic-energy-v1/music-02-t126.6-pre-peak.png
  - evidence/kinetic-energy-v1/music-03-t147.3-peak.png
  - evidence/kinetic-energy-v1/music-04-t194.6-quiet.png
  - evidence/kinetic-energy-v1/music-05-t199.7-outro.png
  - evidence/kinetic-energy-v1/clip-drop-f01.png
  - evidence/kinetic-energy-v1/clip-drop-f07.png
  - evidence/kinetic-energy-v1/clip-peak-f09.png
  - evidence/kinetic-energy-v1/clip-w2-build-f02.png
```
