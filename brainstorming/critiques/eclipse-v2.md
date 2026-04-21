# eclipse — v2 critique

## The claim

Two colliding Julia sets inside ballistic bodies — one small and bright with warm ember palette, one large and black with shadow palette. Collision physics drives the encounter. Set to DJ Huntsman's "Neuroknobs 1." The piece claims music composes the geometry: bass kicks recompose the Julia interior (amplitude 0.18), mids deform the landscape on a slower orthogonal clock (0.09), highs breathe the interior zoom at ~11 Hz, level drives background exposure.

## Frame-by-frame

| Frame | t    | What's there |
|-------|------|------|
| 0 | 1.5s | Small bright Julia ball (warm amber with deep interior fractal banding) upper-centre; large black void (faint ember at deep orbit-trap points) below-left. Deep wine-red field. Both disks crisp; rim structure visible. Interior detail at multiple scales. |
| 1 | 13.5s | Large black void drifted left; small warm ball now upper-right. Warm palette maintained. Black ball rim faint; interior shows visible orbit-trap bandwork. Warm ball glows brighter. |
| 2 | 25.5s | Positions swapped further — black large left-centre, warm small upper-right. Warm rim + fractal interior read clearly. Black interior shows carved structure, not random static. |
| 3 | 37.5s | Black ball centre-left dominating; warm shrunk lower-right with visible rim and interior coherence. Collision-aftermath rim tints. Fractal interiors show distinct multi-scale detail. |

## Mesmerizing probes

| Probe | Verdict | Why |
|-------|---------|-----|
| Eye-landing | pass | Small bright ball anchors frame 0; frames 1–3 gaze shifts between moving bodies. |
| Prediction | pass | Macro motion ballistic/readable; fractal interior banding shifts non-trivially (slow u_time + bass kick + mid deform + high shimmer). Almost-but-not-quite zone. |
| Squint | pass | On blur: two-body composition with black mass dominant, warm point-source from small ball. Fine orbit-trap banding survives close inspection. |
| Hue drift | pass | Burgundy/wine base + amber highlights throughout. No hue jumps. |
| Mystery | fail | Two-body collision is fully legible after one pass. No depth flip, no figure/ground ambiguity. Unchanged from v1 — v2 fix targeted music, not Mystery per priority order. |

**Mesmerizing passes: 4/5.**

## Interaction probes

Not applicable — piece is not cursor-reactive.

## Music reactivity probes

### Probe 1: Motion-over-luminance

**Bass:**
- Line 116: `cDrift += 0.18 * bass * vec2(cos(u_time*0.70), sin(u_time*0.90));` → **GEOMETRY** (Julia c-parameter displacement; removing bass eliminates the kick-shudder, leaving only slow u_time drift). Amplitude 0.18 — boosted from v1's anemic 0.05.

**Mid (new in v2):**
- Line 119: `cDrift += 0.09 * mid * vec2(sin(u_time*0.43), cos(u_time*0.31));` → **GEOMETRY** (c-drift on orthogonal slower clock; mid-range energy deforms Julia landscape independently of kick). No longer a ghost uniform.

**High (new in v2):**
- Line 110: `vec2 z = (q/r) * 1.8 * (1.0 + 0.025 * high * sin(u_time*11.0));` → **GEOMETRY** (local zoom scale; removing high stops the 11 Hz orbit-trap band shimmer). No longer a ghost uniform.

**Level:**
- Line 179: `col = ember(0.25 + 0.35*bg) * (0.28 + 0.55*level);` → **Brightness** (background envelope).

**Verdict: shader-pass.** All three bands (bass, mid, high) now feed geometric parameters. Level remains brightness-only (acceptable — exposure is not usually a geometric driver).

### Probe 2: Bass→movement

Bass in line 116 is geometric, amplitude 0.18 (vs 0.05 in v1). A peak kick ~0.8 produces delta-c ≈ 0.144 on top of the 0.08 slow drift — perceptible, not subliminal.

**Verdict: shader-pass.** Bass movement is now healthy.

### Probe 3: Rhythm-in-stills

Captured 1.5–37.5s (early track). Frame-to-frame the ball positions show ballistic drift + interior banding pattern shifts that reflect bass/mid modulation. However, no single frame captures a peak bass impact moment; the mechanism is robust but the capture window is still early.

**Verdict: weak.** Mechanism sound; capture-timing gap (later-track frames would likely pass).

### Probe 4: Quiet-reads-quiet

At silence: cDrift baseline slow drift only (no bass/mid kicks), z-scale ≈ 1.0 (no high shimmer), background envelope 0.46. Geometry partially de-energizes: c-drift amplitude drops, zoom tightens. Billiards continue independent of audio (acceptable design).

**Verdict: shader-pass.**

**Music passes: 3/4** (probes 1, 2, 4 pass; probe 3 weak). Meets the 3/4 threshold — music composes the piece.

## Claim check

**Pass.** All three bands route to geometry in shader and frames; meta.yaml updated to reflect the new Audio→Julia geometry block. No ghost uniforms remain.

## Scores

| Dimension | Score | Note |
|-----------|-------|------|
| Palette cohesion | 5/5 | Warm family throughout, unchanged from v1. |
| Composition | 3/5 | Two-body ballistic physics drives macro; no section arcs. Interior fractal compensates but doesn't elevate macro form. |
| Motion | 4/5 | Multiple desynchronised clocks: slow u_time drift + bass kick (0.18) + mid orthogonal (0.09) + high 11 Hz zoom. v1 was 3/5. |
| Intensity & dynamic range | 3/5 | Background envelope responds to level; balls/billiards audio-independent. Partial de-energization on silence. |
| Depth | 4/5 | Orbit-trap banding inside/outside Julia boundary at multiple scales; rewards zooming. Flat background field. |
| Form & ending | n/a | Not testable from early-track stills. |

## What's working

1. Palette flawless — unchanged, still textbook warm monotone.
2. Fractal interiors with orbit-trap banding render multi-scale detail.
3. Bass amplitude perceptible (0.05 → 0.18); kicks visibly recompose Julia.
4. **Mid now geometric** — 0.09 amp on orthogonal clock; formerly ghost uniform, now composes.
5. **High now geometric** — 11 Hz zoom shimmer breathes orbit-trap bands; formerly ghost uniform.
6. Two-body physics clear with mass differentiation.
7. Music passes 2 → 3/4.

## What's imperfect

1. Mystery still fails — collision logic fully legible. Addressable in a later iteration; lower priority than music per SKILL.md order.
2. Composition physics-reactive, not composed — no section state machine.
3. Intensity partial — billiards run at silence independent of audio.
4. Field depth absent — balls on flat plane, no layering/lensing.
5. Rhythm-in-stills weak — capture timing, not mechanism.

## Verdict

**ship-it.** Mesmerizing 4/5 (above 3/5 threshold), claim delivered, music 3/4 (threshold met), motion 3→4, all other dimensions ≥ 3. The v2 fix was surgical: (1) boost bass amplitude, (2) route mid to c-drift on orthogonal clock, (3) route high to interior zoom breath. Eliminated both ghost uniforms. Mystery gap remains but per priority order it was the right call to fix music first. A future iteration can address Mystery with a dedicated top_fix.

---

```yaml
piece: eclipse
iteration: 2
verdict: ship-it
claim_check: pass
mesmerizing_passes: 4
mesmerizing_probes:
  eye_landing: pass
  prediction: pass
  squint: pass
  hue_drift: pass
  mystery: fail
interaction_passes: n/a
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
  intensity: 3
  depth: 4
  form_ending: n/a
top_fix: null
```
