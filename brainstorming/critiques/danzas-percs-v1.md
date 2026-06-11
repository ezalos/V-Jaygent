# danzas-percs — iteration 1 critique (first recorded)

Independent critic, first recorded critique for this piece. The piece
has been iterated in prior sessions (v1 fixed 2×2 ring lattice →
hashed rings + multi-spawn bars + intersection detonations, commit
cf79aba) but no critique was ever written down; this document is the
baseline. Architecture C (Gray-Scott ping-pong `passes:`, rgba16f at
half res, 8 substeps). Track: Alpha Tracks "April Audrey / Danzas
Percs", 143.5 BPM, D# minor, 375 s, 8 analysed sections. This is the
sanctioned cold-palette piece — VISION.md's cold exception was added
*because of* this piece (steel = diffusion, ember = reaction).

**Evidence basis.** All six `inspect-music` stills plus frames
extracted from the committed clips (`clip-peak.mp4` at fps=2; window
clips w0/w1/w3/w4 at fps=1). Everything graded from is snapshotted in
`evidence/danzas-percs-v1/`. Three evidence caveats, established
before grading:

1. **Stills under-represent accumulated state.** `music-01-t356.4`
   shows one ring on near-empty steel; `clip-w3` at the *same
   timestamp* shows a dense worm/spot field. The stills were rendered
   seek-style and the RD state never accumulated (known
   accumulation-piece failure). Where stills and clips disagree, the
   clips are authoritative.
2. **Every clip's first ~1.5–2 s is a frozen lead-in** (pixel delta
   exactly 0.0000 between clip-peak f01–f04 at fps=2, same in w0/w3/w4).
   Capture artefact, not the piece. Continuity graded from the live
   tail of each clip.
3. **The drop was never sampled.** `clip-peak.mp4` is byte-identical
   to `clip-w2-t189.7` (mean abs diff 0.0) — the "peak" label comes
   from the energy envelope, which peaks at t≈190 (section 2). Section
   5, THE DROP (251.6–351 s, the longest act, the coral-labyrinth
   regime), has zero captured coverage in stills or clips. The
   labyrinth claim is graded shader-side only.

## The claim

This piece claims that a canonical Gray-Scott medium rendered as cold
brushed steel will show its chemistry honestly — only freshly-ignited
reaction glows ember (kick-fronts and new wakes; settled pattern cools
back to steel) — while every beat launches a hash-positioned
travelling annulus (three on bar-starts, crossings detonating into
pattern blooms), sections morph the Turing regime
(solitons → spots → worms → mitosis → coral labyrinth), one sustained
diffusion-scale sweep coarsens the wavelength across 6 minutes, and
the ending starves the feed so the pattern dissolves to black.

## Frame-by-frame

| Frame | t (s) | Section | What's there |
|-------|-------|---------|--------------|
| still 0 | 1.0 | s0 silent intro | Near-black blue substrate, a handful of faint steel specks (the sparse seed). Genuinely empty. Eye has almost nothing. |
| still 2 | 170.7 | s1 groove (end) | Dense steel worm-tangle upper-right with brushed-metal relief; large ember annulus lower-left mid-flight; dark intrinsic empty zone lower-right. Two clear landing candidates. |
| still 3 | 189.7 | s2 worms | Ring dance: 5+ annuli at hashed positions/diameters, two burning ember, the rest cooled steel; scattered spot debris between. Mid-phase propagation frozen. |
| still 4 | 245.8 | s4 break | Dim navy mitosis field — dotted/dashed spots quietly dividing, circular wake ghosts, zero ember, no rings (drums gate shut). Structurally quiet, not just dim. |
| still 1 | 356.4 | s6 wind-down | One ember annulus mid-flight on sparse steel. **Understates the real state** — see clip-w3, which shows a full worm/spot field at this same t. |
| still 5 | 370.8 | s7 outro | Coarse diagonal-banded decay with dense small spots, very dark — the field dissolving under F-starvation. (Clip-w4 at 369.7 is already fully black; still is stale-state, the clip is authoritative for the end.) |
| clip-peak f00→f03 | ≈190+0.2…4.2 | s2 | Worm colony left third, ring cluster with ember accents centre, dark right third. f02 catches a downbeat: cold-white edge-flash lights the whole pattern's rims (mean L 0.088 → 0.176), then falls back. f03: a fresh ember annulus has appeared bottom-centre at a new hashed site. Inter-frame mean deltas 0.026–0.099 — strong continuous motion. |
| clip-w0 f00/f04 | 3.7→8.4 | s0 | Black both ends (max L 0.075). The cold open is 12 s of near-nothing. |
| clip-w1 f00/f04 | 170.7→175.4 | s1→s2 boundary (172.2) | f00: giant ember ring + diagonal streak wakes. f04: the frame has *re-patterned* — ember-washed worm bloom everywhere, the new regime's fresh chemistry burning. The section boundary visibly changes the vocabulary inside one 4.7 s clip (flash at the boundary, L 0.058→0.143→0.078). |
| clip-w3 f00/f03 | 356.4→360.4 | s6 | Dense settled worm/spot field, chunkier wavelength than s1/s2 (the coarsening reads), rare ember pinpoints, one wake ring growing an ember crown by f03. |
| clip-w4 f00/f03 | 369.7→373.7 | s7 | Black (max L 0.071, deltas ≈0.001). The dissolution is complete ~5 s before the track ends. |

## Mesmerizing probes

Declared timescales for Prediction: **continuity 0.3 s** (143.5 BPM
techno, beat = 0.42 s, fast kinetic), **divergence 20 s** (375 s
long-form with 8 sections).

| Probe | Verdict | Why |
|-------|---------|-----|
| Eye-landing | pass | Candidates shift across the body of the piece: ember ring lower-left (still 2) → ring cluster upper-centre (still 3) → nothing-but-field (still 4) → fresh annulus bottom-centre (clip-peak f03). 2–4 candidates per frame, migrating. Caveat: the bookends (w0, w4) offer *nothing* — graded as silence-as-form, but it's ~20 s of no landing place total. |
| Prediction | pass | (a) Continuity at 0.3 s: smooth — RD evolution + expanding annuli + coherent downbeat edge-flash; no tears, no chromatic separation, no pixel noise (clip-peak f00→f03, deltas 0.03–0.10 and trackable). (b) Divergence at 20 s: windows are categorically different — empty steel (w0) vs ember ring + boundary re-pattern bloom (w1) vs ring-dance on worms (peak) vs settled coarse colony (w3) vs black dissolution (w4). The next ring's centre/diameter is hashed per beat; the medium accumulates every scar, so no window is re-derivable from another. Untested residual risk: two windows *inside* the unsampled 99 s drop could share one vocabulary — the coarsening sweep and intersection detonations are the hedges, but no capture proves it. |
| Squint | pass | The two wandering Gaussian hot-zones do their job: clip-peak frames blur to bright-upper-left / dark-right; w3 blurs to a centre-bright colony on dark ground. Up close the brushed-steel relief and spot debris reward the step-in (dual-resolution). |
| Hue drift | weak | The dominant hue is locked midnight-steel in every single frame; what breathes is luminance and the ember-accent *ratio* (zero in s0/s4/s7, flooding briefly after the s1→s2 boundary). That is the cold-question design working as written ("cohesion via luminance inside one cold family") — but by the probe's letter the dominant hue never drifts, and the ±4% per-section temperature tilt is invisible in the captures. Not a flicker fail; not a breathing pass. |
| Mystery | pass | The piece withholds its central rule: why do some rims burn ember while identical-looking neighbours stay cold? (Answer — freshness band-pass — is invisible; the viewer just sees the fire choose.) Where the next ring lands is undisclosed by construction. The etched-metal relief flips between "engraving" and "living colony" readings. |

**Mesmerizing result: 4/5 passes, Prediction (the hard gate) among
them.** Hue drift is the miss, and it is a *deliberate* consequence of
the sanctioned cold experiment, not an accident.

## Interaction probes

Piece declares `cursor: true`; `u_mouse` feeds both passes.

| Probe | Verdict | Why |
|-------|---------|-----|
| Composition | shader-pass | Cursor Gaussian brush injects v into the sim (sim.frag:169–176); injected pattern *persists and grows* — the RD digests it into permanent wakes, so cursor history rewrites the macro field, not just the local pixel. |
| Idle | pass | All clips are effectively idle-cursor captures and the piece self-plays (RD + beat-fronts). Declared idle behaviour (seeded spots + no fronts without audio) is consistent with sim.frag:122 gating. |
| Readability | shader-pass | Hover → v injection → reaction spike → freshness band-pass → ember bloom under the finger within frames. "I touch, it burns" needs no instructions. |
| Reversibility | n/a-stateful | Deliberately irreversible — the brush feeds a persistent medium; wakes remain after the cursor leaves. Legitimate stateful fail, called out per rubric. |
| Dominance | shader-pass | Brush radius ≈0.04 of frame (exp(-600·d²)), feed 0.09; the field's own dynamics dwarf it globally. Local specular lift +0.55 is cosmetic. Well under the 30% energy ceiling. |
| Convention | shader-pass | Hover-to-paint plus local light-the-metal; no inverted priors. |
| Latency | shader-pass | Injection is unsmoothed, same-frame; ember EMA (mix 0.08 × 8 substeps) flares within ~2–3 frames. No input filtering in the path. |

**Interaction result: 6/7** (reversibility n/a-stateful).

## Music reactivity probes

| Probe | Verdict | Why |
|-------|---------|-----|
| Motion-over-luminance | shader-pass | The audio mostly decides WHERE: `u_beat_phase` is the ring radius clock (sim.frag:135, `r = u_beat_phase * rMax`), `u_beat_index` hashes the centre (sim.frag:123,131), `u_audio_other_stem` moves the feed rate F and `u_audio_high` the kill rate k (sim.frag:90–91) — those reshape the pattern itself. Brightness-family uses exist (display downbeat edge-flash, `u_energy_smooth` exposure, grain) but they are the minority. |
| Bass→movement | shader-pass | No `u_audio_bass` uniform; the percussion channel is `u_audio_drums_stem`, which gates the kick-front injection (sim.frag:124, smoothstep 0.12–0.45). Replace it with a constant and rings fire through silences — with it, fronts exist only when drums do, and the front's *position over time* is the beat clock itself. The kick literally travels. |
| Rhythm-in-stills | pass | Still 3 and clip-peak f03 freeze annuli mid-flight at different radii — propagation caught in the act, not "same scene brighter". |
| Quiet-reads-quiet | pass | Still 4 (break): no rings, no ember, thinner mitosis regime — structurally becalmed. w0/w4: silence renders as near-black. The quiet is formal, not dimmed loudness. |

**Music result: 4/4.**

## Song-level composition probes

`audio.analysis.json` present; shader references `u_section_id`,
`u_section_progress`, `u_to_section_change`, `u_song_progress`,
`u_downbeat`, `u_bar_phase`, two stems.

| Probe | Verdict | Why |
|-------|---------|-----|
| Section-readability | pass | The five non-bookend captures are unambiguously distinct: empty steel / worm-tangle + ember ring / ring dance / mitosis dots / coarse colony → diagonal decay. A viewer could order most of them blind. (Caveat: s5, the drop, never sampled.) |
| Downbeat-anchored | shader-pass | Structural events keyed to composition uniforms: regime morph on `u_section_id` (sim.frag:84–86), boundary sweep on section-elapsed time (sim.frag:153–165), triple-ring spawn on `u_bar_phase` (sim.frag:125), edge-flash on `u_downbeat` (shader.frag:115). Well over the ≥2 bar. |
| Pre-tension | shader-fail | `u_to_section_change` is referenced (sim.frag:154) but only to *recover elapsed time* for the post-boundary sweep — nothing anticipates a boundary before it arrives. No squeeze, no withholding, no visual inhale before the 251.6 s drop. The uniform is used; the pre-tension semantics are absent. |
| Per-stem-discrimination | shader-pass | `u_audio_drums_stem` → front injection (geometry events); `u_audio_other_stem` → feed-rate F (pattern density). Two stems, two visually different roles. |
| Long-arc | pass | Captured curve: black → growing colony → ring-dance peak → thinned break → (unsampled drop) → coarse settled field → black. Clear maximum and two honest troughs. |
| Recapitulation | weak | Intro and outro are both near-black substrate — related, yes, but from clip evidence (w0 vs w4) they are nearly *identical* blacks; the delta (the diagonal-banded dissolution texture in still 5) is only visible in a stale-state still and lives ~5 s before full black. The arc bookends rhyme, but the rhyme is emptiness twice. |

**Song-level result: 4/6.** Clears the "song-aware composition" bar.

## Dual-input probes

Both `u_mouse` and `u_audio_*` declared and wired.

| Probe | Verdict | Why |
|-------|---------|-----|
| Dual-channel readability | interaction-unclear | Needs live cursor+music capture; not testable from these artefacts. |
| Channel-non-overlap | shader-pass | Both channels inject into the v field but at disjoint *loci* — audio at hashed ring sites, cursor under the pointer — with the RD medium as the shared mediator (the "cursor as 5th stem" pattern, ferment lineage). No global parameter is contested. |
| Music-without-cursor | pass | The clips are this cell, and the music probes pass in them. |
| Cursor-without-music | shader-pass | `u_section_id < 0` falls back to the spots regime (sim.frag:82–83); fronts/sweeps gate off (sim.frag:122) but the brush and the medium remain fully alive. |
| Conflict-resolution | shader-pass | Spatially disjoint injection into a mediating field; no additive arms race on any scalar. |
| Authority-during-build | shader-pass | The brush is gated by nothing — full strength regardless of section energy (sim.frag:169–176). |
| Idle-cell | interaction-unclear | The neither-cell (no audio, no cursor) rides on the sparse seed (threshold deliberately high, sim.frag:65–67) digesting under the spots regime. Should live, but the seed is *very* sparse and no capture proves the cell doesn't sit near-empty for a long time. |

**Dual-input result: 5/7.**

## Layered composition probes

n/a — this piece is a `passes:` architecture (sim + display), not a
`layers:` stack. No layer manifest to probe.

## Claim check

**Pass.** The thesis pixel is real: in every captured frame the ember
is exactly where fresh chemistry is — burning annuli mid-flight,
the just-re-patterned bloom after the s1→s2 boundary (clip-w1 f04) —
and settled pattern is provably cold (clip-w3's mature colony is
steel with rare ember pinpoints). Beat-hashed travelling rings:
visible at different centres/diameters in still 3 and across
clip-peak. Regime morphing: four distinct vocabularies captured.
Wavelength coarsening: w3's colony is visibly chunkier than s1/s2's
worms. Ending starvation: w4 is honest black. Two elements rest on
shader trust rather than captures: the triple-ring/intersection
detonation (the math is there, sim.frag:128–145; multi-ring frames
exist but no still isolates a detonation lens) and the drop's coral
labyrinth (REGIMES[5] = (0.0545, 0.062) is the right Pearson
neighbourhood, but no frame samples 251.6–351 s). Neither gap
contradicts a capture; the claim stands.

## Scores

| Dimension | Score | Note |
|-----------|-------|------|
| Palette cohesion | 4 | Disciplined steel family + physically-motivated ember, per the VISION cold exception (sanctioned for this piece by name). Not 5: the post-boundary ember flood (clip-w1 f04) briefly makes the accent the body — honest to the chemistry, but for those seconds "ember rare" isn't true. |
| Composition | 4 | Hot-zones wander, ring sites hash across the frame, empty zones are intrinsic (dark right third of clip-peak). Not 5: ~20 s of combined near-black bookends plus the break still (still 4) reading as uniform speckle leave several stretches with no compositional event. |
| Motion | 5 | Genuinely multi-scale and desynchronised: continuous RD churn, 0.42 s ring flights, per-bar triples, per-section sweeps, a 375 s wavelength drift, sub-beat grain. Direction is felt (fronts propagate; spots divide) even in the break. |
| Intensity & dynamic range | 5 | Real dark (w0/w4 max L 0.07; break is dim AND becalmed), peaks Reinhard-compressed (downbeat flash tops at L 0.67, no bleach). Both ends of the range are honest. |
| Depth | 4 | Grain → brushed-steel relief → worm/spot wavelength → ring arcs → macro hot-zones. Reads different at three distances. Not 5: the RD wavelength is single-scale per regime, so the mid-band is one resolution of structure, base+texture rather than a continuous hierarchy. |
| Form & ending | 4 | Testable here (the dissolution is captured): silence → growth → peak → break → second act → starve-to-black. Composed for its duration. Not 5: the dissolution completes ~5 s early (w4 black at 369.7), so the track outlives the picture; and the recapitulation is emptiness-rhymes-with-emptiness. |

## What's working

- **The thesis lands visually.** "Chemistry burns hot, pattern settles
  cold" is readable in the frames without explanation — ember tracks
  freshness so precisely that clip-w1's regime change reads as the
  *new* chemistry catching fire, then clip-w3 shows the same medium
  grown old and cold. The non-warm experiment's hard part (ember-rare
  via the EMA band-pass) demonstrably works.
- **Propagation, not pulse — delivered.** Rings are caught mid-flight
  at hashed sites and diameters (still 3, clip-peak f03). No generic
  kick-brightness anywhere in the sim; the percussion's footprint is
  geometric.
- **Section vocabulary, not re-shaded params.** Solitons / worms /
  mitosis dots / coarse colony / dissolution are different *event
  vocabularies*, exactly what the section-vocabulary lesson demands —
  and the s1→s2 boundary visibly re-patterns the frame inside a
  single 4.7 s clip.
- **Silence as form.** The cold open, the becalmed break, and the
  starved ending are all structurally quiet, not dimmed loudness.
- **The cold palette is earned.** Steel = diffusion, ember = reaction
  gives the hue a physical cause; the frames read as lit metal, not
  printed graphics. The experiment that opened VISION's cold door is
  visible in the captures.

## What's imperfect

1. **Hue drift is weak (the 5th probe).** The dominant hue is
   midnight-steel in every frame; breathing is delegated entirely to
   luminance and ember ratio, and the ±4% per-section tilt
   (shader.frag:65–66) is invisible in captures. This is the
   cold-cohesion design working as specified — fixing it by drifting
   the body hue would fight `cold-question.md`'s own rule, so any
   improvement has to come from making the *steel ramp's* cool-white ↔
   midnight balance swing wider with sections, not from new hues.
2. **No pre-tension.** `u_to_section_change` exists in the shader only
   as a time-recovery trick (sim.frag:153–155). The 251.6 s drop —
   the track's whole reason for a 26 s break — arrives unannounced;
   nothing tightens, starves, or inhales beforehand. Song-level probe
   failed on this alone.
3. **The evidence pipeline missed the drop.** clip-peak duplicates w2
   (t=189.7, energy-envelope peak); sections 5 (99 s!) and 3 have zero
   coverage, and the seek-rendered stills (music-01, music-05)
   misrepresent accumulated state. Next inspect run needs wall-clock
   sampling with a window inside 251.6–351 s before anyone grades the
   labyrinth or within-drop divergence.
4. **The bookends are long blacks.** 12 s of near-nothing at the open
   and ~5 s of full black before the track ends (w0, w4). Defensible
   as silence-as-form; still the piece's least generous stretches, and
   the early-completing dissolution means the picture ends before the
   music does.
5. **Nit:** sim.frag:80 comment says "previous = (id+3) % 4" while the
   code (correctly) does `(u_section_id + 7) % 8` — stale comment.

## Verdict

**ship-it.** 4/5 mesmerizing probes with Prediction — the hard gate —
passing on both timescales (smooth RD continuity within clips,
categorically different vocabularies across windows), claim check
pass, no dimension below 3, palette 4 ≥ the ship gate. Not
chef-d'oeuvre: hue drift is honestly weak — the cold family locks the
dominant hue by design, and per the calibration rule an ambiguous
probe rounds down, not up. The remaining gaps (pre-tension, drop
coverage, bookend generosity) are nuance and tooling, not failure
modes; no single Edit would convert the hue-drift weak into a pass
without fighting the sanctioned cold-cohesion rule, so this is not a
needs-tweak. The piece delivers its stated thesis on camera.

```yaml
piece: danzas-percs
iteration: 1
verdict: ship-it
claim_check: pass
mesmerizing_passes: 4
mesmerizing_probes:
  eye_landing: pass
  prediction: pass
  squint: pass
  hue_drift: weak
  mystery: pass
interaction_passes: 6
interaction_probes:
  composition: shader-pass
  idle: pass
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
song_level_passes: 4
song_level_probes:
  section_readability: pass
  downbeat_anchored: shader-pass
  pre_tension: shader-fail
  per_stem_discrimination: shader-pass
  long_arc: pass
  recapitulation: weak
dual_input_passes: 5
dual_input_probes:
  dual_channel_readability: interaction-unclear
  channel_non_overlap: shader-pass
  music_without_cursor: pass
  cursor_without_music: shader-pass
  conflict_resolution: shader-pass
  authority_during_build: shader-pass
  idle_cell: interaction-unclear
layered_passes: n/a
scores:
  palette_cohesion: 4
  composition: 4
  motion: 5
  intensity: 5
  depth: 4
  form_ending: 4
top_fix: null
evidence:
  - evidence/danzas-percs-v1/music-00-t1.0-intro.png
  - evidence/danzas-percs-v1/music-01-t356.4-verse.png
  - evidence/danzas-percs-v1/music-02-t170.7-pre-peak.png
  - evidence/danzas-percs-v1/music-03-t189.7-peak.png
  - evidence/danzas-percs-v1/music-04-t245.8-quiet.png
  - evidence/danzas-percs-v1/music-05-t370.8-outro.png
  - evidence/danzas-percs-v1/clip-peak-f00.png
  - evidence/danzas-percs-v1/clip-peak-f01.png
  - evidence/danzas-percs-v1/clip-peak-f02.png
  - evidence/danzas-percs-v1/clip-peak-f03.png
  - evidence/danzas-percs-v1/clip-w0-f00.png
  - evidence/danzas-percs-v1/clip-w0-f04.png
  - evidence/danzas-percs-v1/clip-w1-f00.png
  - evidence/danzas-percs-v1/clip-w1-f04.png
  - evidence/danzas-percs-v1/clip-w3-f00.png
  - evidence/danzas-percs-v1/clip-w3-f03.png
  - evidence/danzas-percs-v1/clip-w4-f00.png
  - evidence/danzas-percs-v1/clip-w4-f03.png
```
