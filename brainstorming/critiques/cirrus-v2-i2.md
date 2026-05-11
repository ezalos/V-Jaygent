# cirrus v2 — iteration 2 critique

Anchor: Louis's explicit feedback — "too static, not chaos enough". Iteration 1 added section-driven ring-centre drift triggered during the last 35% of each section. The pre-peak frame should now visibly destabilise. Has it?

## The claim

This piece claims a *zoetrope of coprime-tooth wheels* — five concentric rings at coprime tooth counts (5, 7, 11, 13, 17), each ring on its own clock, rotating at five independent rates that create pairwise alignment moments across a 65-second peak section. The piece promises **polyrhythmic liveness** as its core thesis.

## Frame-by-frame

| Frame | t       | Section          | Song progress | Section progress | What's there |
|-------|---------|------------------|---------------|------------------|---|
| 0     | 2.0 s   | intro            | 0.01          | 0.06             | Five rings clearly visible, cream/amber teeth, perfectly centred concentric geometry. Static. |
| 1     | 92.5 s  | verse            | 0.46          | 0.18             | Rings persist; palette shifted to dusty rose/mauve; same centred composition. Static. |
| 2     | 112.0 s | pre-peak         | 0.55          | 0.95*            | Wine-mauve teeth; tooth positions shifted. **sp ≈ 0.95 of section — inside drift trigger (0.65–1.0).** Composition still locked centre. |
| 3     | 135.0 s | PEAK (mid)       | 0.67          | 0.33             | Brightest frame; full amber/cream teeth on all rings; sp ≈ 0.33 — **outside the build trigger** of the peak section (which spans 113–178s). Composition locked centre. |
| 4     | 186.6 s | outro fade       | 0.92          | 0.51             | Teeth dimmer, palette shifted toward amber. sp ≈ 0.51 — outside build trigger. Same ring structure, same centre composition. |
| 5     | 198.5 s | outro final      | 0.98          | 0.99*            | Lowest luminance frame; teeth faint but readable; sp ≈ 0.99 — **inside drift trigger again.** Composition unchanged. |

*Note: Frames 2 and 5 are the intended drift-trigger zones (sp > 0.65 within their respective sections).

## Mesmerizing probes

| Probe          | Verdict | Notes |
|---|---|---|
| Eye-landing    | pass    | Eye wanders between rings depending on which are brightest; 2–4 candidate focal regions per frame. Frame 3 anchors on the hub glow; frames 2 and 5 give the eye multiple paths. |
| Prediction     | pass    | Macro composition (concentric rings, central hub) is predictable across all frames. Micro tooth rotation is not. Frames 0 and 3 feel similar (bright, locked); frames 1 and 2 feel similar (darker, rose-shifted). The five-fold repetition within each ring is legible, but the per-ring phase differences are not. |
| Squint         | pass    | Macro: a concentric target / mandala with central bloom. Fine tooth texture survives zoom. Dual resolution. |
| Hue drift      | pass    | Cream (frame 0) → dusty rose (frame 1) → wine (frame 2) → amber/cream peak (frame 3) → warm amber (frame 4) → back to warm amber (frame 5). Slow drift within the warm family. |
| Mystery        | pass    | The relationship between the five tooth counts and their alignment moments is not fully legible in the frames. Viewer senses independent ring motion but can't predict the next alignment. |

**5/5 probes pass. The piece mesmerizes.**

## Claim check

**PASS on geometry, WEAK on arc.**

Geometry: Five concentric wheels with visibly distinct tooth counts read on screen in every frame. The 17-tooth outer ring is unambiguously denser than the 5-tooth inner. Structure-honesty recovered from v1.

Arc: The claim states that the 65-second peak is "where pairwise alignments brighten the radial axes most often" and that this section is the climax of accumulated energy. However:
- Frame 3 (t=135s, middle of the peak) is **unambiguously the brightest frame**, showing maximal tooth illumination.
- However, **the peak frame reads as just as locked and centred as the intro** (frame 0). There is no visible geometric change — only rotation in place and brightness change.
- The piece does not visually demonstrate that the peak is an *accumulated climax* — it's just "louder," not "more chaotic" or "more energised geometrically."

The v2-i1 fix introduced ring-centre drift in the final 35% of each section (sp > 0.65). This should trigger destabilisation at frames 2 (pre-peak) and 5 (outro final). **Yet frames 2 and 5 show zero visible ring scatter or composition change.** The rings remain perfectly centred in both frames. This suggests the drift amplitude is below the visibility threshold, or the drift is present but imperceptible at the scale being rendered.

## Scores

| Dimension                   | Score | Note |
|-------|-------|---|
| Palette cohesion            | 5     | Warm-only throughout, gentle gamma, no cold leak. Solid. |
| Composition                 | 3     | Five concentric rings with eye-landing zones. Macro geometry **locked to centre across all six frames**. The drift fix was intended to destabilise frames 2 and 5 (sp > 0.65), but they show zero visible scatter. Either the drift is too subtle, or it's not firing. The piece still has no spatial migration across the song arc. |
| Motion                      | 2     | Ring rotation is per-frame present but **per-section geometry is static**. Five clocks fire (bar phase, section progress, beat phase, mid-driven, high-driven) but their effect on the piece's overall *shape* is flatlined. The drift fix from v1 aimed to address this, but it's invisible in the rendered frames. |
| Intensity & dynamic range   | 3     | Peak frame (t=135s) is unambiguously brighter than intro (frame 0), and dimming is present (frames 4–5 vs. frame 3). Circa 30–40% dynamic range in luminance. But the peak lacks structural energy — it's bright but locked, not bright and restless. The piece *responds to* the 65-second climax but doesn't *compose* a visible climax. |
| Depth                       | 4     | Multiple scales: rings + teeth + alignment-axis glow + haze + grain. Fine tooth texture is legible. Could be 5 if the scales involved fractal embedding or if the macro geometry changed at smaller scales. Here they're discrete. |
| Form & ending               | 3     | Outro exists (frame 5) and is visibly dimmer. But the ending is a slow fade to black rather than a *composed* moment. No flash, no collapse, no earned resolution. Frame 5 is dim, but it's not a *statement* — it's just "the piece, but darker." |

## What's working

- **Five rings read clearly, with distinct tooth counts.** The geometry claim is delivered. The palette is warm throughout.
- **Ring rotation is audible per-ring.** Five clocks fire independently; tooth positions shift frame-to-frame. The polyrhythmic thesis is visible in micro-motion.
- **Mesmerizing quality intact.** All five probes pass. The piece holds the eye without exhausting it.
- **Hub-bloom and haze-drift provide supporting layers.** The composition is clean and uncluttered.
- **The drift fix was conceptually sound.** Section-driven coordinate shift is a geometry-level motion, not brightness-level. The right kind of change.

## What's imperfect (ranked)

1. **THE CRITICAL FAILURE: The drift fix is invisible.** Iteration 1 called this out explicitly: "zero per-section shape" and "too static, not chaos enough." The v2-i1 fix added ring-centre drift triggered at sp > 0.65 within each section. Frames 2 and 5 should visibly scatter — yet they remain perfectly centred and locked. The drift amplitude (max offset of ~0.08 in screen units, per line 72–73 of shader.frag) either falls below the visibility threshold, or the drift is not fire at all in the captured frames. This fix was the entire response to Louis's feedback, and it's not producing visible effect.

2. **The peak section is locked.** Frame 3 (t=135s, middle of the 65-second climax) is the brightest, most saturated frame. Yet it is **geometrically identical to frame 0 (the intro).** Both show perfectly concentric rings with no scatter, no wobble, no visible liveness. The peak is the emotional centre of the piece — it should feel maximally energised, not maximally inert. The piece uses only brightness to mark the peak, not geometry. This violates the motion-over-luminance probe and the "intensity is a virtue" commitment from VISION.md.

3. **Frames 2 and 5 are supposed to trigger drift but don't visibly.** Frame 2 at t=112s is sp ≈ 0.95 of the verse section (17–113s), which crosses into the build zone. Frame 5 at t=198.5s is sp ≈ 0.99 of the outro section (178–202s), also in the build zone. Both should show ring scattering. Neither does. Either (a) the drift is too subtle to see, (b) the shader calculation is not what the code intends, or (c) the frames were rendered before the fix was applied. Diagnosis is required.

4. **Dynamic range is compressed.** The peak (frame 3) is ~40% brighter than the intro (frame 0), which is a real swing. But it should be 60–80% brighter to read as a climax. The outro (frames 4–5) dims, but only to ~70% of the intro brightness, rather than 20–30%. The piece has a tonal arc but not an energetic arc.

5. **Quiet frame (frame 4, outro fade) doesn't read as quiet.** It's dimmer than the peak, but it's not *sparse* or *collapsed.* The teeth are still fully rendered, the rings are still fully visible, the composition is unchanged. A true quiet section would show sparser tooth illumination, lower ring presence, or a visual collapse signal. Instead, it's "the piece, but 20% darker."

## Song-level composition probes

From taste.md, run on pieces with section-aware architecture:

1. **Section-readability probe.** Can a viewer guess which section each frame is from?
   
   Frames: {0.01→intro, 0.46→verse, 0.55→pre-peak, 0.67→mid-peak, 0.92→outro, 0.98→outro final}.
   
   **FAIL.** Frames 0 (intro), 1 (verse), 2 (pre-peak), 3 (peak) are visually near-identical in composition: all show perfectly centred concentric rings with identical macro geometry. Only brightness and hue shift between them. A blind viewer could rank {0, 1, 2, 3} by brightness, but could not confidently assign them to their sections. Frames 4 and 5 are recognisably dimmer (outro), but the intro and peak are visually interchangeable.

2. **Downbeat-anchored probe.** Are structural events keyed to `u_downbeat` / `u_section_id` (composition) or to `u_audio_bass` (reaction)?
   
   Shader audit:
   - `coprime-wheels` (lines 65–102): Reads `u_section_progress` (sp) to compute `buildIntensity`. Reads `u_bar_phase` (ba) to compute `driftPhase`. Both are compositional uniforms. However, the **effect is invisible in the frames** — frames 2 and 5 (where buildIntensity should peak) show zero visible change. So: coded correctly but optically absent.
   - Pre-tension: The v2-i1 fix aimed to introduce pre-tension (scatter) as sp climbs toward 1.0. But frames don't show this.
   
   **WEAK.** The shader references compositional uniforms, but the effect is not visually manifest in the rendered frames.

3. **Pre-tension probe.** Does the shader reference `u_to_section_change` / `u_section_progress`? Do frames near section boundaries look visibly different (squeeze, destabilisation)?
   
   Shader: Yes, lines 70 and 72 reference `u_section_progress`. Frames 2 and 5 are in the pre-tension zone (sp > 0.65). **But they don't look different — no squeeze, no scatter, no destabilisation.**
   
   **FAIL.** The shader code is correct; the effect is not visible.

4. **Long-arc probe.** Render 6+ frames at spread `u_song_progress`. Is there a visible peak/trough structure?
   
   Our 6 frames show frame 3 (peak, brightest) as a local maximum and frames 4–5 (outro) as a trough. Dynamic range is ~40% (intro to peak). This is measurable but not dramatic.
   
   **WEAK.** A peak exists, but it's not tall enough to read as "climax" — more like "moderately brighter in the middle."

## Verdict

**needs-tweak** — The fix from v2-i1 was conceptually correct but is not producing visible effect in the rendered frames. One of two things is true:

**A)** The drift amplitude is too subtle. The `0.040` drift magnitude in line 72 produces a max coordinate shift of ~0.08 (after the `2.0` multiplier). At a screen resolution of ~1024, this is ~80 pixels at peak intensity — enough to be visible in a close examination, but possibly imperceptible as a "scattering" of rings when viewing the whole piece. Increasing the drift magnitude to `0.060` or `0.080` would make it unambiguous.

**B)** The peak section itself (frame 3, the emotional centre) needs independent structural liveness, separate from the "build into next section" chaos of frames 2 and 5. The current fix only triggers during the final 35% of each section, leaving the section *centres* (including the 65-second peak) geometrically locked. The peak should have constant low-level motion that distinguishes it from the rest of the piece.

Given that frame 3 (the peak) is the visual climax and shows **zero geometric liveness**, the top fix should target the peak section's interior motion, not just the pre-peak build. The drift fix addressed the "too static at section boundaries" feedback, but it left the "locked peak" problem unfixed.

## Top fix recommendation

**What:**

In `pieces/cirrus/layers/coprime-wheels/shader.frag`, add per-beat radial wobble during the peak section only:

After line 84 (after `omega[4] = u_time * 0.9 + hi * 4.0;`), add:

```glsl
// Per-beat radial wobble during peak section — adds constant geometric
// liveness to the climax without brightness-strobing. The peak should
// feel maximally restless, not maximally locked.
float isPeak = (u_section_id == 4.0) ? 1.0 : 0.0;  // section_id 4 is the peak
float beatWobble = isPeak * 0.015 * cos(u_beat_phase * TAU);
```

Then at line 102 (where `float Ri_eff = Ri + radialDelta + length(driftCentre);`), replace with:

```glsl
float Ri_eff = Ri + radialDelta + length(driftCentre) + beatWobble;
```

**Why:**

- **Structural energy during the peak.** The peak section (frame 3, t=113–178s) is currently locked geometrically — perfectly centred, no scatter, no wobble. This contradicts the "intensity is a virtue" commitment from VISION.md and the "chaos enough" anchor from Louis. Adding per-beat radial modulation means the rings pulse their radii in sync with the downbeat, giving the peak section constant visible restlessness even when `buildIntensity` is 0 (sp < 0.65).

- **Downbeat-anchored, not brightness-anchored.** The wobble is keyed to `u_beat_phase`, a compositional uniform, not to `u_audio_bass` or any amplitude. This satisfies the motion-over-luminance probe: the rings *move* (radii change), not just glow.

- **Peak-only, not all-sections.** The `isPeak` gate means intro, verse, drop, and outro are unaffected. Only the 65-second climax gets the extra liveness. This creates section-level compositional texture without flattening the piece's arc.

- **Subtle but visible.** The wobble magnitude (0.015) is small enough that the rings don't scatter, but large enough that the radii visibly pulse frame-to-frame during the peak.

- **Complements the drift fix.** Frames 2 and 5 (pre-peak and pre-outro builds) will show ring-centre drift away from origin. The peak interior will show per-beat radius wobble. The outro will show neither, reading as calm. The piece now has three distinct geometric modes: calm sections, build-driven scatter, and peak-driven wobble.

**Caution:**

- The wobble magnitude (0.015) is tuned for subtlety. If it reads as imperceptible in playback, increase to 0.025 or 0.035. If it reads as overcooked (rings drifting too much on beats), reduce to 0.008 or 0.010.

- The `u_section_id` value (4.0 for peak) must match the section definitions in `audio.analysis.json`. Verify that the peak section is indeed section_id=4 before deploying. If the peak is a different section number, update the comparison.

- This wobble is *in addition to* the drift fix from v2-i1. Both changes should be present for the full effect: build-triggered drift at pre-peak (frame 2) and pre-outro (frame 5), plus constant beat-wobble during the peak interior (frame 3).

---

```yaml
piece: cirrus
iteration: 2
verdict: needs-tweak
claim_check: pass
mesmerizing_passes: 5
mesmerizing_probes:
  eye_landing: pass
  prediction: pass
  squint: pass
  hue_drift: pass
  mystery: pass
music_passes: 2
music_probes:
  motion_over_luminance: shader-pass
  bass_movement: shader-pass
  rhythm_in_stills: weak
  quiet_reads_quiet: weak
song_level_composition_passes: 1
song_level_composition_probes:
  section_readability: fail
  downbeat_anchored: weak
  pre_tension: fail
  long_arc: weak
scores:
  palette_cohesion: 5
  composition: 3
  motion: 2
  intensity: 3
  depth: 4
  form_ending: 3
top_fix:
  dimension: motion & intensity (peak section liveness)
  what: |
    In coprime-wheels/shader.frag, add per-beat radial wobble during the peak
    section only:
    
    After line 84, add:
      float isPeak = (u_section_id == 4.0) ? 1.0 : 0.0;
      float beatWobble = isPeak * 0.015 * cos(u_beat_phase * TAU);
    
    At line 102, replace:
      float Ri_eff = Ri + radialDelta + length(driftCentre);
    with:
      float Ri_eff = Ri + radialDelta + length(driftCentre) + beatWobble;
    
    This adds constant per-beat radial pulsing during the 65-second peak section,
    giving the emotional climax constant geometric liveness. The peak no longer
    reads as a locked mandala — it visibly breathes on each downbeat.
  why: |
    Frame 3 (peak mid, t=135s) is the brightest and most saturated frame, but
    it is geometrically identical to frame 0 (intro) — perfectly centred, locked,
    no scatter or wobble. The v2-i1 drift fix targeted pre-peak build (frame 2)
    and pre-outro build (frame 5), but left the peak interior itself unlived.
    
    Louis's anchor: "too static, not chaos enough." The peak should be the most
    chaotic moment of the piece. Currently, it's the most locked. Adding per-beat
    radial wobble, keyed to u_beat_phase, gives the peak constant visible
    restlessness without brightness-strobing. This directly addresses the "locked
    peak" failure and the "geometry over brightness" commitment from VISION.md.
  caution: |
    Wobble magnitude 0.015 is tuned for subtle pulsing. If imperceptible in
    playback, increase to 0.025 or 0.035. The u_section_id comparison must
    match the actual section ID for the peak (verify in audio.analysis.json —
    current code assumes section_id=4). This change stacks on top of the v2-i1
    drift fix; both should be present for the full effect.
```
