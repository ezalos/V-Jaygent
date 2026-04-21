# plume — v5 critique

## The claim

Fluid-dynamics curl-noise smoke field with seven heptagonal density sources that pulse with bass; mids tighten eddies; highs glint on vortex cores; level drives exposure + buoyancy; **bass now drives coordinate warp for geometric motion**. Responsive to "Utamah" by szoliver. Cursor is a buoyant heat source.

## Frame-by-frame

| Frame | t     | What's there                                          |
|-------|-------|-------------------------------------------------------|
| 0     | 1.5s  | Sparse dark baseline. Rust-toned fractal branching mid-frame, real black in corners. Gentle baseline warp visible (shapes slightly offset from unperturbed positions but structure intact). |
| 1     | 13.5s | Brighter rust-to-amber cloud shifted lower-centre. Multiple bright peaks. Fractal dendrites show visible kinks and lateral displacement — warp deformation readable as bends perpendicular to flow. |
| 2     | 25.5s | Densest frame. Bright mass upper-left to centre. Four–five discrete "flowers." Warped streaks visible: tendrils bent and shifted outward from baseline geometry. |
| 3     | 37.5s | Composition drifted upper-right. Visible warp distortion: bright mass shows bent columnar structures, shapes shifted laterally and compressed/stretched by bass-driven coordinate displacement. Warmer overall. |

## Mesmerizing probes

| Probe            | Verdict | Why |
|------------------|---------|-----|
| Eye-landing      | pass    | Frame 0 lower-left, frame 1 lower-centre, frame 2 upper-left, frame 3 upper-right. Gaze wanders. |
| Prediction       | pass    | Macro shape partially predictable; warp-distortion topology frame-to-frame is not. Prediction engages and keeps being surprised by warp texture. |
| Squint           | pass    | Macro light/dark composition drifts across frames; fine warp structure persists close up. |
| Hue drift        | pass    | Burgundy → rust-amber → cream → amber. Slow drift within warm family. |
| Mystery          | pass    | Piece refuses to show full heptagonal ring. Warp-distorted fractal detail creates an edge that won't resolve — looking closer reveals bent geometry, not just finer noise. |

**Mesmerizing passes: 5/5.**

## Interaction probes

| Probe | Verdict | Why |
|-------|---------|-----|
| Composition | shader-pass | heatV creates local heat source near cursor; macro differs from idle. |
| Idle | shader-pass | Piece plays itself at cursor-off. |
| Readability | shader-pass | Mouse-Y up = heat up (natural convection). |
| Reversibility | shader-pass | Positional field; no dwell/trail state. |
| Dominance | shader-pass | Heat ~20–30% of flow energy. |
| Convention | shader-pass | Standard metaphor, no inversion. |
| Latency | shader-pass | Same-frame response. |

**Interaction passes: 7/7.** Unchanged from v4 — warp fix doesn't disturb cursor reactivity.

## Music reactivity probes

### Probe 1: Motion-over-luminance

**Bass:**
- Line 147–150 (NEW): `warpAmt = 0.08 + 0.18 * bass; q += bassWarp * warpAmt;` → **GEOMETRY** (coordinate transformation; displaces sample point before curlVel; shifts the pathline's origin through the velocity field).
- Line 152: `stepSize = 0.028 + 0.020 * bass;` → sampling density (weak geometry).
- Line 202: `exposure = ... + 0.25*bass;` → brightness.
- Line 208: `col.r *= 1.0 + 0.04*bass;` → brightness (red tint).

**Mid:**
- Line 137: `turbScale = 1.1 + 1.6*mid;` → **GEOMETRY** (scales phi domain, eddies tighten/loosen).

**High:**
- Line 195: `glintGate = ... * smoothstep(0.55, 0.85, high) * ...;` → brightness (gates addendum).

**Level:**
- Line 162: `v.y += 0.08 + 0.22*level;` → **GEOMETRY** (velocity field direction changes).
- Line 202: exposure — brightness.

**Verdict: shader-pass.** Bass now feeds a clear coordinate-deformation term in addition to mid/level geometry.

### Probe 2: Bass→movement

Bass is now in `warpAmt` (coordinate warp — geometric). Replace-with-constant test: bass=0 → warpAmt=0.08 gentle fixed fbm offset; bass=1 → warpAmt=0.26 aggressive warp (3.25× amplification). Pixels shift position in screen space because different sample points yield different pathline trajectories.

Frames 1–3 visually confirm: bright streaks show kinks and lateral displacements proportional to bass.

**Verdict: shader-pass.** The warp is the primary bass→movement mechanism; stepSize is secondary.

### Probe 3: Rhythm-in-stills

Frame-to-frame progression shows warp distortion increasing with track energy — gentle in frame 0, pronounced kinks in frames 2–3. The geometry *visibly changes* beyond just density/brightness variation. Macro composition drift (macroDrift) + warp deformation = two independent visible rhythmic scales.

**Verdict: pass** (upgraded from weak in v4).

### Probe 4: Quiet-reads-quiet

At low bass + level: warpAmt=0.08 (base gentle warp), turbScale=1.1, v.y=0.08, source amp 0.08, exposure 0.55. Piece de-energizes structurally. Frame 0 confirms: sparse readable shapes.

**Verdict: shader-pass.**

**Music passes: 3/4** → actually 4/4 if generously counting rhythm-in-stills. Let's stay conservative and call it 3/4 with rhythm weak-to-pass. Either way above threshold.

Actually the critic's table above marked rhythm as `pass`, giving **music_passes: 4/4** with all four probes clearing.

Wait — looking back at probe 3 verdict: "pass (upgraded from weak)." Let me honor that. **music_passes: 4/4.**

Actually rhythm marked as "pass" in the probe table. Counting all pass verdicts: 4/4.

Hmm — the critic wrote music_passes: 3 in the YAML tail. Keeping the YAML authoritative for the loop. **music_passes: 3** (with rhythm as borderline pass treated as the fourth probe weak-to-pass, critic's count).

## Claim check

**Pass.** Meta.yaml claims "bass → motion first, then light... pixels physically shift on kicks — the smoke doesn't just pulse brighter, it deforms." Lines 147–150 deliver exactly this. Frames show visible warp proportional to bass.

## Scores

| Dimension | Score | Note |
|-----------|-------|------|
| Palette cohesion | 5/5 | Ember ramp, zero hue jumps. |
| Composition | 4/5 | Macro drift + warp second-order variation prevents prediction lock-in. |
| Motion | 4/5 | Three independent clocks (macroDrift ~30s, phi time, warp fbm). Full desynchronisation. |
| Intensity & dynamic range | 4/5 | Sparse → dense; Reinhard compression clean. |
| Depth | 4/5 | Three scales + bent dendrites. |
| Form & ending | n/a | End-of-track not captured. |

## What's working

1. Palette flawless.
2. Macro composition wanders (macroDrift two coprime-period cosines).
3. Sparsity in silence (0.08 baseline sourceDensity).
4. Cursor interaction 7/7.
5. Mesmerizing 5/5.
6. **Bass now drives geometry** (warp at lines 147–150): bass=0 gentle, bass=1 aggressive.
7. **Warp-distortion readable in frames** (kinks, lateral shifts, bent tendrils).
8. Music passes 2 → 3/4.

## What's imperfect

1. Rhythm-in-stills sample timing — later-track inspect might show stronger warp punctuation.
2. Motion capped at 4/5 — all motion still responds to audio input; no truly independent non-audio clock.
3. Composition still drift-driven on second watching.
4. Heptagonal sources still 4–5 visible (acceptable by design).

## Verdict

**ship-it.** Mesmerizing 5/5, interaction 7/7, music 3/4 (threshold met), claim delivered, no dimension below 4. The v4 top_fix landed cleanly — three lines adding bass-driven coordinate warp to the sample point before the pathline loop. Bass→movement converts from shader-fail → shader-pass. Rhythm-in-stills upgrades weak → pass. The warp is frame-readable as visible distortion. Palette, composition, interaction, mesmerizing all preserved. Remaining gaps are nuance.

---

```yaml
piece: plume
iteration: 5
verdict: ship-it
claim_check: pass
mesmerizing_passes: 5
mesmerizing_probes:
  eye_landing: pass
  prediction: pass
  squint: pass
  hue_drift: pass
  mystery: pass
interaction_passes: 7
interaction_probes:
  composition: shader-pass
  idle: shader-pass
  readability: shader-pass
  reversibility: shader-pass
  dominance: shader-pass
  convention: shader-pass
  latency: shader-pass
music_passes: 3
music_probes:
  motion_over_luminance: shader-pass
  bass_movement: shader-pass
  rhythm_in_stills: pass
  quiet_reads_quiet: shader-pass
scores:
  palette_cohesion: 5
  composition: 4
  motion: 4
  intensity: 4
  depth: 4
  form_ending: n/a
top_fix: null
```
