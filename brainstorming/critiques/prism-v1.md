# prism — v1 critique

## The claim

A dihedral (D_n) kaleidoscope with nested mirror folds driven by slowly evolving fold counts (5–9 for background, 3–6 for depth layer). Bass drives zoom and axis rotation; mid modulates interior brightness; high drives soft shimmer. Four bouncing sub-kaleidoscopes (billiard balls with their own prime-fold disks: 7, 11, 13, 17) are CPU-simulated with elastic collisions and position-pass via uniforms. Each disk owns a spectrum-hue signature that cycles slowly and nudges on collision impact. Background stays warm-family; disks carry full-spectrum colour under the spectrum-exception rule. No mouse input — autonomous.

## Frame-by-frame

| Frame | t     | What's there                                          |
|-------|-------|-------------------------------------------------------|
| 0     | 1.5s  | Four luminous disks in rough diamond, soft interior kaleidoscope structure. Warm amber-pink background with implied triangular wedges. Low luminance overall, base structure evident. |
| 1     | 13.5s | Five disks visible, spread across frame. Background warms to coral-burgundy with much stronger internal texture. Interior bead structure in each disk reads clearly. Field shows active fbm warp. |
| 2     | 25.5s | Four primary disks, very dense bright interior tessellation. Top disk larger. Background at warmest (deep burnt-orange) with fine fbm shimmer. Beads glow intensely. |
| 3     | 37.5s | Four disks repositioned (lower, more spread). Background shifted to mauve-burgundy. Interior disks active multi-scale structure with visibly different fold counts. Soft collision rings visible on several disks. |

## Mesmerizing probes

| Probe            | Verdict | Why                                                 |
|------------------|---------|-----------------------------------------------------|
| Eye-landing      | pass    | Frame 0 eye lands on central glow + four symmetric disks. Frames 1–3 disks reposition; gaze wanders to track them. Multiple landing spots that shift. |
| Prediction       | weak    | Fold-count cycle is slow (≈600s period); in 36s window fold counts drift almost imperceptibly. Macro arc is readable but the capture window misses the inflection points that would make the fold changes visible. |
| Squint           | pass    | On blur, central bright region with four-five satellite disks against warmer haze; silhouettes distinct; background continuous warm gradient. Dual-resolution: coarse disk composition + fine shimmer. |
| Hue drift        | pass    | Warm amber-pink → coral-burgundy → burnt-orange → mauve-burgundy across frames. Disks cycle hue independently (spectrum allowed), overall temperature drifts within warm family. |
| Mystery          | pass    | Fold counts drift invisibly (sin(t*0.018) offstage). Nested fold recursion promises infinite depth. Collision events (hitPulse decay) occur but you can't predict from stills when. Recoloration on impact suggests agency but mechanism stays hidden. |

**Mesmerizing passes: 4/5.**

## Interaction probes

Not applicable — piece is not cursor-reactive. `u_mouse` declared but never used in shader; meta.yaml confirms autonomy.

## Music reactivity probes

### Probe 1: Motion-over-luminance

**Bass terms (line, verdict):**
- 120 `fluid = fbm(q * 1.7 + 2.4 * w2 + 0.6 * bass);` → **GEOMETRY** (domain-warp offset in source fbm).
- 210 `axis1 = t*0.38 + phaseA*1.7 + bass*0.25 + ...;` → **GEOMETRY** (sub-disk outer-fold axis rotation).
- 221 `hueBase = hueSeed + t*0.018 + 0.08*bass + 0.25*hitPulse;` → **Brightness/Hue**.
- 260 `axisAngle = t*0.08 + bass*0.30;` → **GEOMETRY** (background kaleidoscope axis rotation).
- 263 `zoom = 1.05 + 0.08*sin(t*0.15) + 0.15*bass;` → **GEOMETRY** (camera scale).

**Mid / High / Level terms:** All are brightness-only modulators on beads, shimmer, and interior boost envelopes.

**Verdict: shader-pass.** Bass drives four geometric parameters; mid/high are decorative (brightness-only).

### Probe 2: Bass→movement

Bass appears in `fluid` warp, two axis rotations, and zoom — all geometric.

**Verdict: shader-pass.**

### Probe 3: Rhythm-in-stills

36s window early-track with sparse-percussion "Neuroknobs 1." Disks have moved between frames (ballistic physics + bass-driven axis modulation), but no sharp beat-locked frame-to-frame geometry punctuation. Mechanism sound, capture timing gentle.

**Verdict: weak.**

### Probe 4: Quiet-reads-quiet

At low level + low bass: zoom minimal (1.17), axisAngle slow drift only, interior boost nearly flat, bead glows 0.6–0.8× peak. Structure de-energizes — slower rotation, tighter view, dimmer beads.

**Verdict: shader-pass.**

**Music passes: 3/4** (probes 1, 2, 4 pass; probe 3 weak). Meets 3/4 threshold — music composes the piece, with the asymmetry that only bass does compositional work; mid/high are decorative.

## Claim check

**Pass.** Dihedral folding with drifting fold counts ✓. Bass drives zoom/rotation/source warp ✓. Mid/high/level modulate brightness per claim ✓. Four billiard sub-kaleidos with collision physics ✓. Spectrum-hue per disk ✓. Autonomous, no mouse ✓. Warm background, spectrum disks honoring VISION's spectrum-exception ✓. Every major claim reads on screen.

## Scores

| Dimension                | Score | Note                           |
|--------------------------|-------|--------------------------------|
| Palette cohesion         | 5/5   | Warm family throughout background; disks carry spectrum but respect "no pure saturation at peak" via Reinhard + anchor values keeping R ≥ 0.55. Lit, not printed. |
| Composition              | 4/5   | Disks move and reposition; background fbm evolves. Multiple landing spots. But disks cluster near centre; no full-frame exploration. |
| Motion                   | 5/5   | Three independent clocks: fold-count drift (~600s), axis rotation (~80s + bass), bead orbits (coprime ratios 0.9–1.37, 1.37–1.66). Zoom breathing adds fourth layer. Never all frozen. |
| Intensity & dynamic range| 4/5   | Low point genuine dark; high point warm-lit not bleached. Reinhard + vignette preserves core while preventing edge bloat. |
| Depth                    | 4/5   | Dual background kaleidos at different n create parallax. Interior beads at multiple radii. Two visible scales per disk + shimmer third. Layers + texture, not fully fractal-through. |
| Form & ending            | n/a   | Not testable from 1.5–37.5s stills.            |

## What's working

1. Palette is flawless — spectrum exception deployed without VISION violation; Reinhard + anchor tuning keeps lit-not-printed.
2. Motion has three independent clocks; eye never fully predicts next frame.
3. Bass is geometric on four counts (zoom, two axes, fbm warp).
4. Collision physics add a motion source orthogonal to music.
5. Interior nested dual-fold kaleidos with coprime-rate beads — visually dense without chaos.
6. Mesmerizing 4/5 probes pass cleanly.

## What's imperfect

1. Prediction weak — fold-count cycle too slow for 36s capture to catch inflection. Probe-capture timing issue, not mechanism failure.
2. Composition stays core-centric (symmetry constraint of the genre).
3. Depth doesn't fully reach fractal status — floor to the nested scale.
4. Mid and high are decorative. Piece would move identically if mid/high were muted — they only scale brightness.
5. Rhythm-in-stills weak due to early-track low-energy capture.
6. Hit pulse ring visibility is subtle (narrow exp(-380) ring).

## Verdict

**ship-it.** Mesmerizing 4/5 with one weak probe (structural timing), claim fully delivered, all testable dimensions ≥ 4 (palette 5, composition 4, motion 5, intensity 4, depth 4). The piece is compositionally honest — bass drives real geometry on four counts, CPU physics add a second motion source, palette respects spectrum exception, nested kaleidoscope architecture is exactly as promised. Prediction weakness is a 36s capture artifact over a 600s cycle. Shippable.

---

```yaml
piece: prism
iteration: 1
verdict: ship-it
claim_check: pass
mesmerizing_passes: 4
mesmerizing_probes:
  eye_landing: pass
  prediction: weak
  squint: pass
  hue_drift: pass
  mystery: pass
interaction_passes: n/a
music_passes: 3
music_probes:
  motion_over_luminance: shader-pass
  bass_movement: shader-pass
  rhythm_in_stills: weak
  quiet_reads_quiet: shader-pass
scores:
  palette_cohesion: 5
  composition: 4
  motion: 5
  intensity: 4
  depth: 4
  form_ending: n/a
top_fix: null
```
