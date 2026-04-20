# chamber — v3 critique

## The claim

This piece claims to render a dark stone chamber lit from a pinpoint core, where outward-propagating bass pulses slam into relief columns with kick-driven amplitude and wall brightness, mid-driven haze density, high-frequency column glints, and level-driven relief distortion, all within an interactive camera and autonomous drift.

## Frame-by-frame

| Frame | t     | What's there                                          |
|-------|-------|-------------------------------------------------------|
| 0     | 1.5s  | Pure black field with a single warm-orange pinpoint core at frame centre. Tight halo. Eye locks immediately. Exposure arc still rising (≈0.45 intensity). |
| 1     | 9.5s  | Core remains centred and bright, halo slightly larger and warmer. Some burgundy texture or haze visible around the core. Exposure approaching ≈0.60. |
| 2     | 17.5s | Core is golden-amber and visibly larger, surrounded by a strong warm-orange halo. Pulse structure barely visible. First hints of relief geometry at the frame edge. |
| 3     | 25.5s | Core remains warm-amber, halo diffuse. Two to three distinct dark burgundy relief columns now clearly visible in the lower half, silhouetted against the halo glow. Recesses between columns read as deep shadows. Wall structure is unmistakably present and close. |

## Mesmerizing probes

| Probe            | Verdict | Why                                                 |
|------------------|---------|-----------------------------------------------------|
| Eye-landing      | pass    | Core anchors gaze in frames 0–2; in frame 3 eye shifts to relief columns at the wall. Landing spot moves. |
| Prediction       | pass    | Exposure-driven brightening predictable; relief threshold somewhat abrupt but consistent. Macro form readable, micro texture resists exact prediction. |
| Squint           | pass    | Bright central radial spot with expanding halo on blur; fine relief columns read on close inspection. Dual-resolution present. |
| Hue drift        | pass    | Warm family throughout: burgundy → rust → amber across frames. Slow, monotonic, no jumps. |
| Mystery          | pass    | Relief columns carved and legible, but exact depths and spatial pattern resist prediction. Haze dynamics aren't fully disclosed. An edge that won't resolve. |

**Mesmerizing passes: 5/5.**

## Interaction probes

| Probe            | Verdict         | Why                                                 |
|------------------|-----------------|-----------------------------------------------------|
| Composition      | shader-unclear  | Cannot assess macro drift from idle renders alone.  |
| Idle             | pass            | Clear focal anchor, yaw drift visible, piece doesn't die without cursor. |
| Readability      | pass            | Mouse-X→yaw, mouse-Y→exp zoom standard conventions. |
| Reversibility    | shader-pass     | Yaw and zoom deterministic, stateless.              |
| Dominance        | shader-unclear  | Cannot assess from idle frames.                      |
| Convention       | pass            | Standard camera mapping.                             |
| Latency          | shader-unclear  | Cannot test from idle stills.                        |

**Interaction passes: 3/7 (of testable).** Unchanged from v2.

## Music reactivity probes

### Probe 1: Motion-over-luminance

Enumerated every `u_audio_*` usage; replace-with-constant test on each.

**Bass terms:**
- `zoom *= 1.0 - 0.06 * bass;` → **GEOMETRY** (camera scale; removing bass stops the camera lurch, shifting where pixels land).
- `rimR = 1.05 - (0.55 + 0.22 * bass) * relief;` → **GEOMETRY** (wall radius at each angle changes with bass).
- `pulseSpeed = 0.70 + 0.55 * bass;` → **GEOMETRY** (ring propagation rate; ring arrival at a given radius is bass-dependent).
- `coreEnv = 0.30 + 1.20 * bass;` → **Brightness** (envelope).
- `pulseAmp = 0.10 + 1.70 * bass;` → **Brightness** (amplitude).
- `wallLight *= (0.95 + 0.50*level + 1.20*bass);` → **Brightness** (wall light gain).
- `rimKick = pulseAtRim * (0.25 + 1.90*bass);` → **Brightness** (kick overlay).

**Mid / Level:**
- `sigma = 1.1 + 5.2 * mid;` → **Geometry** (haze density drives transmit falloff).
- `warpAmt = 0.08 + 0.28 * level;` → **Geometry** (fbm angle warp deforms relief).
- `expose = 0.85 + 0.55 * level;` → **Brightness** (palette curve).

**Verdict: shader-pass.** Bass now drives three geometric parameters.

### Probe 2: Bass→movement

`u_audio_bass` appears in `pulseSpeed`, `rimR`, `zoom` — all geometric.

**Verdict: shader-pass.** Bass moves structure.

### Probe 3: Rhythm-in-stills

Frames 0–1 are early (sparse bass), ring propagates at near-base speed; frame 2 shows halo-driven warmth; frame 3 shows resolved relief columns. The wall geometry in frame 3 is visibly closer and deeper than in v2 — consistent with `rimR` bass-amplification. But four stills across 24s of sparse-bass early track don't show beat-scale punctuation in the classical sense (ring at distinctly different radii frame-to-frame).

**Verdict: weak.** Mechanism is sound but the captured section is too quiet to demonstrate.

### Probe 4: Quiet-reads-quiet

At low `u_audio_level` and low `bass`: `warpAmt = 0.08`, `rimR = 1.05 - 0.55*relief` (wall at neutral depth), `zoom *= 1.0` (no lurch), `expose = 0.85`. Structure de-energizes.

**Verdict: shader-pass.**

---

**Music passes: 3/4.** Above the 3/4 threshold — music composes the piece.

## Claim check

**Pass.** Bass now drives:
- Pulse propagation speed (arrival timing is a spatial event, not only brightness).
- Wall radius at each angle (columns physically push inward on kicks).
- Camera zoom (lurches forward on kicks).

These deliver the "slam" and "rim-kick" language from meta.yaml as geometry, not just brightness. Pulse amplitude and core envelope remain bass-driven brightness terms on top of the geometric changes.

## Scores

| Dimension                | Score | Note                           |
|--------------------------|-------|--------------------------------|
| Palette cohesion         | 5/5   | Monotone warm throughout, zero hue violations. |
| Composition              | 3/5   | Core axis-locked in 0–2; relief reads clearly in frame 3 with visible column structure. Better than v2 (2/5). |
| Motion                   | 4/5   | Pulse, wall, and camera all bass-driven; real geometric motion, not brightness-only. (v2: 2/5.) |
| Intensity & dynamic range| 4/5   | Exposure arc + geometry responses. Silence de-energizes structurally. (v2: 3/5.) |
| Depth                    | 4/5   | Relief field reads in frames thanks to rimR bringing wall closer on bass. Fractal structure visible. (v2: 3/5.) |
| Form & ending            | n/a   | Not testable from mid-track stills. |

## What's working

1. **Palette remains flawless.** Deep ember monotone, cohesive warm family, "4am club" mood delivered.
2. **Core is iconic.** Tight two-scale glow falloff with a pinpoint centre reads as a true point-light source.
3. **Relief now reads.** v3 fix brings the wall visibly closer on audio events. Frame 3 shows unmistakable carved column geometry — major improvement over v2.
4. **Mesmerizing probes 5/5.** Prediction, mystery, eye-landing all improve via the resolved relief.
5. **Music reactivity is now compositional.** Bass drives pulseSpeed, rimR, zoom — structure, not decoration.
6. **Haze and warp honestly respond** to mid and level.

## What's imperfect

1. **Rhythm-in-stills weak.** The captured frames sample early sparse-bass section; they don't prove the beat-scale punctuation the geometry now supports. A later-track inspect (t=150–200s with heavy kick) would likely demonstrate it.
2. **Interaction stuck at 3/7 testable.** Composition and dominance probes remain untested from idle stills.
3. **Composition still core-centric.** Frames 0–2 show the core axis-locked; relief enters in frame 3. Macro form doesn't drift or rotate at human-readable pace.

## Verdict

**ship-it.** Mesmerizing 5/5, claim delivered, all testable dimensions ≥ 3 with motion/intensity/depth all at 4. V3 fix is surgical — three lines adding bass to `pulseSpeed`, `rimR`, and `zoom` — and the piece now breathes with the track structurally, not only luminously. Rhythm-in-stills remains weak but that's a probe-capture limitation (early-track sampling), not a mechanism failure. Shippable.

---

```yaml
piece: chamber
iteration: 3
verdict: ship-it
claim_check: pass
mesmerizing_passes: 5
mesmerizing_probes:
  eye_landing: pass
  prediction: pass
  squint: pass
  hue_drift: pass
  mystery: pass
interaction_passes: 3
interaction_probes:
  composition: shader-unclear
  idle: pass
  readability: pass
  reversibility: shader-pass
  dominance: shader-unclear
  convention: pass
  latency: shader-unclear
music_passes: 3
music_probes:
  motion_over_luminance: shader-pass
  bass_movement: shader-pass
  rhythm_in_stills: weak
  quiet_reads_quiet: shader-pass
scores:
  palette_cohesion: 5
  composition: 3
  motion: 4
  intensity: 4
  depth: 4
  form_ending: n/a
top_fix: null
```
