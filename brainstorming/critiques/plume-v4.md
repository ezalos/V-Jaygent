# plume — v4 critique

## The claim

A fluid-dynamics curl-noise smoke field with seven heptagonal density sources that pulse with bass; mids tighten turbulence eddies; highs produce sparse vortex-core glints; level drives exposure. Responsive to "Utamah" by szoliver. Cursor is a buoyant heat source.

## Frame-by-frame

| Frame | t     | What's there                                          |
|-------|-------|-------------------------------------------------------|
| 0     | 1.5s  | Sparse dark baseline. Rust-toned fractal branching mid-frame, real black in corners. Thin wisps; cream highlight lower-centre. No vignette ring. |
| 1     | 13.5s | Brighter rust-to-amber cloud shifted lower-centre. Multiple distinct bright peaks. Darker regions upper-left/right. Fractal dendrites at two scales. |
| 2     | 25.5s | Densest frame. Bright mass upper-left to centre. Four–five discrete "flowers" readable as separate events. Kaleidoscopic fine structure. Amber and cream mixed with burgundy shadows. |
| 3     | 37.5s | Composition drifted upper-right. Bright peaks in upper-right quadrant. Lower-left and lower-right darker. Warmer overall (more amber). |

## Mesmerizing probes

| Probe            | Verdict | Why |
|------------------|---------|-----|
| Eye-landing      | pass    | Frame 0 lands lower-left, frame 1 lower-centre, frame 2 upper-left, frame 3 upper-right. Gaze wanders. |
| Prediction       | pass    | Macro shape partially predictable; micro texture (dendrite topology at 0.01–0.001 scale) not. Prediction engages and keeps being partially surprised. |
| Squint           | pass    | Blurred view shows clear macro light/dark composition drifting across frames. Bright mass always distinct from dark surroundings. |
| Hue drift        | pass    | Burgundy-rich → rust-amber → warm cream → warm amber. Slow drift within single warm family. |
| Mystery          | pass    | Piece refuses to show full heptagonal ring (4–5 bright peaks visible at any moment). Fractal detail rewards deeper looking. |

**Mesmerizing passes: 5/5.**

## Interaction probes

| Probe | Verdict | Why |
|-------|---------|-----|
| Composition | shader-pass | `heatV` at lines 161–162 creates local heat source near cursor; macro composition differs from idle. |
| Idle | shader-pass | Frames captured with cursor off-screen show piece plays itself. |
| Readability | shader-pass | Mouse-Y up = heat source moves up — natural convection metaphor. |
| Reversibility | shader-pass | Heat field purely positional; no dwell/trail state. |
| Dominance | shader-pass | Heat ~20–30% of flow energy when on-screen; within budget. |
| Convention | shader-pass | No inverted controls. |
| Latency | shader-pass | Heat computed same-frame from current q; no lag filters. |

**Interaction passes: 7/7.**

## Music reactivity probes

### Probe 1: Motion-over-luminance

**Bass terms:**
- Line 104: `s += 0.70 * exp(-52.0 * d2) * (0.08 + 1.9 * bass);` → **Brightness** (source Gaussian amplitude; sources don't *move*, only pulse in brightness).
- Line 145: `stepSize = 0.028 + 0.020 * bass;` → **GEOMETRY (weak / arguable).** stepSize controls how densely we sample a fixed pathline; thicker trails but the underlying field is unchanged. Per taste.md's strict definition "things that decide WHERE pixels are," sampling density affects rendered thickness but not coordinate location. Flag as **shader-unclear leaning-fail.**
- Line 195: `exposure = 0.55 + 0.65*level + 0.25*bass;` → **Brightness**.
- Line 201: `col.r *= 1.0 + 0.04 * bass;` → **Brightness** (red tint).

**Mid terms:**
- Line 137: `turbScale = 1.1 + 1.6 * mid;` → **GEOMETRY** (scales the `phi()` domain; fbm octaves sample different frequencies; eddies tighten/loosen).

**High terms:**
- Line 189: `glintGate = smoothstep(...) * smoothstep(0.55, 0.85, high) * step(...);` → **Brightness** (gates a brightness addendum).

**Level terms:**
- Line 155: `v.y += 0.08 + 0.22 * level;` → **GEOMETRY** (velocity field; pathline direction changes with level).
- Line 195: `exposure` — brightness (already listed).

**Summary:** GEOMETRY = turbScale (mid), v.y offset (level), stepSize (bass, weak). BRIGHTNESS = source amplitude (bass), high gate, exposure, red tint.

**Verdict: shader-pass.** Audio does feed geometry via mid and level. Bass's only geometric contribution is stepSize which is sampling density, not coordinate transformation.

### Probe 2: Bass→movement

Bass appears only in `stepSize` (sampling density — arguable geometry) and three brightness terms. The velocity field (curlVel) is mid-modulated (turbScale) not bass-modulated. Source *locations* are bass-independent; only their amplitudes pulse.

Replace-with-constant test on stepSize: at bass=0, stepSize=0.028, fine sampling. At bass=1, stepSize=0.048, coarser sampling → trails appear slightly thicker. But *direction* and *speed* of pathline motion are unchanged. Features don't move — they render with different sampling density.

**Verdict: shader-fail.** Bass does not drive a clear geometric parameter in the strict sense. Per taste.md "things that decide WHERE pixels are," sampling density isn't WHERE — it's how-densely-we-sample-that-where.

### Probe 3: Rhythm-in-stills

Captured 1.5–37.5s window (early track, sparse bass). Frames show brightness variation (sparse → dense → dense) but no pulsation (no ring propagating, no radius change, no camera lurch). Macro composition drifts but that's macroDrift (autonomous), not audio. Density rises on sourceDensity amp × bass → brightness.

**Verdict: weak.** Mechanism exists (turbScale, v.y) but frames don't demonstrate beat-scale geometry.

### Probe 4: Quiet-reads-quiet

At low level + low bass: turbScale=1.1 (base turbulence), stepSize=0.028, v.y=0.08 (base buoyancy), source amplitude 0.08, exposure 0.55. Piece de-energizes structurally: fewer sources, smaller trails, quieter eddies. Frame 0 confirms dark sparse baseline.

**Verdict: shader-pass.**

**Music passes: 2/4.** Below 3/4 threshold. Bass is brightness-only; sampling-density doesn't count as true geometric motion.

## Claim check

**Pass with caution.** Meta.yaml promises "bass → density pulse at each of the seven sources + longer trails." Density pulse is brightness (delivered), longer trails come from stepSize (weakly geometric). Mid and high claims (turbulence + glints) are delivered. Level exposure delivered. Technically claim passes, but the piece's claim that bass "shapes the motion" is only partially true.

## Scores

| Dimension | Score | Note |
|-----------|-------|------|
| Palette cohesion | 5/5 | Ember ramp (black → burgundy → rust → cream). Zero hue jumps. Flawless. |
| Composition | 4/5 | Macro drift at human pace. Bright region shifts frame-to-frame. Prediction starts to lock in on second watching. |
| Motion | 3/5 | Multi-scale churn present but all scales respond to the same input (audio level, turbScale). Desynchronisation incomplete — when audio dies, all motion dampens. Bass doesn't drive independent motion. |
| Intensity & dynamic range | 4/5 | Frame 0 sparse, frames 2–3 dense. Exposure arc visible. Peaks compress via Reinhard. |
| Depth | 4/5 | Fractal layering at three scales. Kaleidoscopic fine structure rewards close looking. |
| Form & ending | n/a | End-of-track capture needed. |

## What's working

1. Palette flawless.
2. Macro composition wanders (macroDrift two coprime-period cosines).
3. Sparsity in silence (baseline sourceDensity reduced in v2 from 0.35 → 0.08).
4. Fine-scale kaleidoscopic fbm structure.
5. Cursor interaction passes all 7 probes — heat-rises metaphor is intuitive.
6. Mesmerizing 5/5.

## What's imperfect

1. **Bass→movement fails.** Only bass term that affects motion is stepSize (sampling density). True bass geometry would be `q += warp*bass` or `v *= (1+k*bass)`. Without it bass only pulses brightness.
2. **Rhythm-in-stills weak** (capture timing — early sparse bass).
3. Motion score drops because audio is the only modulator — all scales live on shared iTime with audio-modulated parameters; no independent non-audio motion clock.
4. Composition drift legible on second watching — macroDrift pattern becomes predictable.
5. Heptagonal sources borderline visible (4–5 at a time instead of 7) — acceptable design but sidesteps the claim.

## Verdict

**needs-tweak.** Mesmerizing 5/5, claim pass, interaction 7/7 — all higher gates pass. **Music 2/4 is the binding failure.** Top_fix is a concrete surgical addition: bass-driven warp to sample coordinates in the velocity field.

---

```yaml
piece: plume
iteration: 4
verdict: needs-tweak
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
music_passes: 2
music_probes:
  motion_over_luminance: shader-pass
  bass_movement: shader-fail
  rhythm_in_stills: weak
  quiet_reads_quiet: shader-pass
scores:
  palette_cohesion: 5
  composition: 4
  motion: 3
  intensity: 4
  depth: 4
  form_ending: n/a
top_fix:
  dimension: music_reactivity
  what: |
    Add bass-driven coordinate warping to the velocity sample. Before line 151
    (`vec2 v = curlVel(q, tp, turbScale);`), insert:

      float warpAmt = 0.08 + 0.18 * bass;
      vec2  warp    = vec2(fbm3(q * 0.5 + tp * 0.1),
                           fbm3(q * 0.5 + tp * 0.1 + 1.3));
      q            += warp * warpAmt;

    Now bass deforms the sample point BEFORE curlVel is evaluated — pixels
    shift position on kicks, not just change brightness.
  why: |
    Current bass usage is sampling-density only (stepSize at line 145), which
    fails taste.md's geometry test "things that decide WHERE pixels are."
    Adding warp to q pre-curlVel puts bass in a coordinate displacement term.
    Replace-with-constant test: bass=0 → gentle ambient warp (still alive);
    bass=1 → aggressive local distortion. Probe 2 passes. Music goes 2/4 → 3/4.
  caution: |
    Keep warpAmt modest (0.18 ceiling) so the field remains recognizable at
    bass=1. The warp should read as "kick shakes the smoke" not "kick scrambles
    the image." Test at bass=0.5 to ensure calm-field structure survives.
    Don't couple warp frequency too tightly to iTime — the ambient fbm drift
    should remain distinct from the bass-kick distortion.
```
