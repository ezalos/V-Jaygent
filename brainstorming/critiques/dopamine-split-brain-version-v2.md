# dopamine-split-brain-version — v2 critique (independent critic)

## The claim

Two coupled Kuramoto-style phase-oscillator hemispheres that drift
asynchronously through verses, snap briefly into alignment on
downbeats, and fuse into a unified moiré field at the climax
(section 4, 107–148.7s), then sever again in the outro.

## Frame-by-frame

| Frame | t (s) | Section | What's there |
|-------|-------|---------|--------------|
| 00 | 1.0 | Intro (0) | LEFT hemisphere only — dim wine/mauve oscillator dots in brick-lattice rows, ~10×8 visible cells. RIGHT side completely black. Reads as cerebral asymmetry: one side waking. |
| 04 | 22.1 | Quiet (1) | BOTH hemispheres visible. LEFT: pale cream peaks with wine undertone. RIGHT: amber/gold dots on a 60°-rotated lattice, distinctly different texture. Vertical seam visible as thin dark line at x=0.5. |
| 01 | 40.9 | Verse (2) | Both hemispheres at higher intensity. LEFT has dense bright cream peaks. RIGHT dimmer, smaller amber dots. Asymmetric brightness — two independent oscillation envelopes. Seam still demarcated. |
| 02 | 105.5 | Pre-peak (3) | Both hemispheres at full intensity, full density. LEFT dense bright cream, RIGHT bright amber/gold. Composition reads as two populations on the brink of integration. |
| 03 | 120.8 | Climax (4) | FUSION EVENT. Seam dissolved. Cream/mauve dots (left) penetrating the right boundary; gold/amber dots (right) penetrating the left. Strong moiré where grids interfere. ONE field with mixed warm tones. Dopamine peak. |
| 05 | 157.1 | Outro (5) | Severance restored. LEFT cream/wine back to left half; RIGHT amber/gold back to right half. Seam restored. Both dimmer. The brain coming back to itself. |

## Mesmerizing probes

| Probe | Verdict | Why |
|-------|---------|-----|
| Eye-landing | **pass** | Four distinct focal candidates — LEFT lattice, RIGHT lattice, SEAM, FUSION moiré (frame 03). Eye has somewhere to land in every frame. |
| Prediction | **weak** | 5% ω detune (7.13 vs 7.49 rad/s) means in-phase moments never repeat at a fixed cadence. Section-level structure IS predictable. Beat-level isn't. |
| Squint | **pass** | Macro hotzone drift survives the blur — frames 01 and 02 show distinctly different bright-region positions. Not flat texture. |
| Hue drift | **pass** | Cool wine→mauve→cream on LEFT, hot ember→amber→gold on RIGHT, both warm families. Fusion event mixes them visibly. |
| Mystery | **pass** | A cold viewer reads "two coupled patterns" before "brain hemispheres". Title supplies thesis on reflection. Vertical seam is ambiguous — barrier or connection point? |

**Mesmerizing passes: 4/5**

## Claim check

**PASS.** Frame 00 demonstrates asymmetry (split state). Frames 04/01/02 show both hemispheres independent (desynced). Frame 03 IS the fusion (palettes interpenetrate, seam dissolves). Frame 05 IS severance (both hemispheres back to clean separation, dimmer). Arc visible in stills.

## Interaction probes — 7/7

| Probe | Verdict | Why |
|--------|---------|-----|
| Composition | shader-pass | Cursor near seam (x≈0.5) triggers local brightness on both sides — geometric coupling, not just colour. |
| Idle | pass | Synth beat clock + ω detune keeps oscillators alive without input. |
| Readability | pass | Move cursor left/right and oscillators respond — mapping legible within 3s. |
| Reversibility | shader-pass | Stateless cursor — return to position returns to original frame. |
| Dominance | pass | Cursor adds ~5% to frame energy at peak. Within 30% threshold. |
| Convention | pass | "Touch the seam (the corpus callosum) and it glows" — intuitive. |
| Latency | shader-pass | No history buffer, no frame delay. <16.7ms at 60 fps. |

## Per-frame music probes — 4/4

| Probe | Verdict | Why |
|--------|---------|-----|
| Motion-over-luminance | shader-pass | Fusion strength gated by section state, not audio level. Seam width varies with fusion_strength — shape change, not brightness. |
| Bass→movement | shader-pass | Bass modulates brightness (expected); downbeat (composition-driven) modulates lightning bolt geometry. |
| Rhythm-in-stills | pass | Frames show distinct phase-progressions of oscillator brightness distributions. |
| Quiet-reads-quiet | pass | Intro frame is sparse AND dim. Quiet → structural sparsity, not just lower luminance. |

## Song-level composition probes — 5/6

| Probe | Verdict | Why |
|--------|---------|-----|
| Section-readability | pass | Six frames, six distinct visual states. A viewer could ID each section from one frame. |
| Downbeat-anchored | shader-pass | Lightning bolt, intensity flash, section-boundary chaos — all keyed to composition uniforms, not audio. |
| Pre-tension | **shader-fail** | No `u_to_section_change` usage. Section-boundary chaos fires AFTER transitions, not anticipatorily. Compensated by the fusion payoff. |
| Per-stem-discrimination | shader-pass | Section-state in distinct role from audio level/bass. Three roles total (section + level + bass). Close to threshold; accepted. |
| Long-arc | pass | Six-frame density curve: low → low → high → high → super-high → low. Clear peak (frame 03), clear trough (frame 00). |
| Recapitulation | pass | Outro (frame 05) recognisably mirrors intro (frame 00) — both asymmetric, both dim, with the outro at "two hemispheres dimmer" instead of "left only". |

## Layered-composition probes — 7/8 (after v2 fix)

| Probe | Verdict | Why |
|--------|---------|-----|
| Spatial-coupling | shader-pass | Callosum samples `u_below` at shifted UVs for the moiré offset. Geometric, not just colour. |
| Polyrhythm-of-clocks | shader-pass | Six distinct clock sources across two layer types. |
| Eye-distribution | pass | 2-4 regions per frame, dominance map shifts between frames. |
| Quiet-survives | shader-pass | Zero out the callosum-seam layer — hemispheres still compose alone. Callosum is accent, not load-bearing. |
| Order-meaningfulness | shader-pass | Hemispheres above solid-warm via max-blend (commutative within), callosum on top via screen — swapping breaks the piece. |
| Blend-saturation | pass | Per-channel range high, mean luminance ~0.44 at peak. Not cream soup. |
| Coupling-cost | shader-pass | 3 edges across 4 layers = ratio 0.75. Sparse. |
| Brightness-strobe | **pass (was shader-fail; fixed in v2)** | `seamBreath` decoupled from `u_audio_level` — now rides its own 0.6 Hz clock, no per-beat seam blink. `accent *= beatPulse` in hemisphere is the only audio-brightness binding left (≤1 layer threshold). |

## Dual-input probes — 5/7

| Probe | Verdict | Why |
|--------|---------|-----|
| Dual-channel readability | pass | Within 5s, cursor changes seam glow AND music drives oscillator pulse. Both visible. |
| Channel-non-overlap | **shader-fail** | Cursor and music both contribute additively to oscillator brightness via `max(intensity, cursorGlow * 0.9)`. Arms-race pattern. Should be floor-ceiling. |
| Music-without-cursor | pass | All music probes still pass with u_mouse idle. |
| Cursor-without-music | pass | Synth beat keeps hemispheres alive; cursor still fires seam glow. |
| Conflict-resolution | **shader-fail** | Same as channel-non-overlap. Pattern C (arms race) not Pattern A (floor-ceiling). |
| Authority-during-build | pass | Cursor still responds during loud sections. |
| Idle-cell | pass | All four idle-matrix cells alive thanks to synth clock + cursor independence. |

## Scores against taste.md

| Dimension | Score | Note |
|-----------|-------|------|
| Palette cohesion | 5 | Two warm families without cold tones. Luminance contrast, not hue shift. Honest. |
| Composition | 4 | Macro hotzone drift wanders, but architecturally bounded to left/right halves. |
| Motion | 4 | Sub-beat jitter + beat-phase + section-boundary chaos. ω detune. Stills under-represent. |
| Intensity | 4 | Honest dynamic range. Quiet really is quiet. Tonemap soft Reinhard. |
| Depth | 3 | Two scales: oscillators and hotzone. Hex lattice is regular, not fractal. Acceptable for Kuramoto thesis. |
| Form & ending | 4 | Earned outro as return to split state. Arc complete. |

**Composite: 24/30**

## Verdict

**SHIP-IT**

This piece mesmerizes (4/5 probes pass; the failing one — prediction — has legitimate physics reasons). It delivers its claim. All testable dimensions score 3-5. Layered architecture works. The piece succeeds at the things that matter most: eye-landing, hue drift, mystery, section-readability, idle survival, and a thesis-delivering climax.

The remaining two shader-fails (channel-non-overlap and conflict-resolution on cursor brightness) are both about the same code path (cursor max-blend onto oscillator brightness). Both could be addressed by changing `max(intensity, cursorGlow * 0.9)` to `intensity *= (1.0 + cursorGlow * 0.5)` (floor-ceiling instead of arms race). Worth fixing in /vjay-iterate v3 if the piece returns there. Not gate-keeping.

## v2 changes applied

- callosum-seam/shader.frag: removed `u_audio_level` from `seamBreath`; seam now breathes on its own 0.6 Hz clock. Fixes the brightness-strobe shader-fail in layered probes (now 7/8).

## Caution for future iteration

- Preserve section-4 fusion mechanism (u_section_id gating in both hemisphere and callosum). It IS the thesis.
- Preserve downbeat lightning and section-boundary chaos — composition-level events.
- Don't add more layers — coupling-cost is already at 0.75 ratio; more layers means more edges.
- Don't promote `hemisphere` to global yet — the brick-lattice rendering is a piece-local style, not a reusable component.

---

```yaml
slug: dopamine-split-brain-version
version: 2
verdict: ship-it
claim_check: pass
mesmerizing_passes: 4
mesmerizing_probes:
  eye_landing: pass
  prediction: weak
  squint: pass
  hue_drift: pass
  mystery: pass
interaction_passes: 7
music_passes: 4
song_level_passes: 5
layered_passes: 7
dual_input_passes: 5
scores:
  palette_cohesion: 5
  composition: 4
  motion: 4
  intensity: 4
  depth: 3
  form_and_ending: 4
  composite: 24/30
top_fix: ship as-is (v2 fix already applied — seamBreath decoupled from audio)
caution: |
  Preserve section-4 fusion (u_section_id gating).
  Preserve downbeat lightning and section-boundary chaos.
  v3 (if attempted) should address channel-non-overlap by changing
  cursor's max() onto oscillator brightness to a multiplicative
  floor-ceiling (intensity *= 1.0 + cursorGlow * 0.5).
```
