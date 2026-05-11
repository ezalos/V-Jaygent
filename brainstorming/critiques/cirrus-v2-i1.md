# cirrus v2 — iteration 1 critique

Anchor: Louis's explicit feedback — "too static, not chaos enough"

## The claim

This piece claims a *zoetrope of coprime-tooth wheels* — five concentric rings
at coprime tooth counts (5, 7, 11, 13, 17), each ring on its own clock,
rotating at five independent rates that create pairwise alignment moments
across a 65-second peak section. The piece promises **polyrhythmic liveness**
as its core thesis.

## Frame-by-frame

| Frame | t       | Section          | What's there                                                                   |
|-------|---------|------------------|--------------------------------------------------------------------------------|
| 0     | 2.0 s   | intro            | Five rings clearly visible, cream/amber teeth, fine tooth texture, soft bloom centre. Static. |
| 1     | 92.5 s  | verse            | Rings persist; palette shifted to dusty rose/mauve; composition identical to frame 0. |
| 2     | 112.0 s | pre-peak         | Wine-mauve teeth; tooth positions shifted from frame 1. Composition still locked centre. |
| 3     | 135.0 s | PEAK (mid)       | Brightest frame; full teeth on all rings; amber/cream palette; tooth positions again shifted. |
| 4     | 186.6 s | outro fade       | Teeth dimmer, palette shifted toward amber; same ring structure, same centre composition. |
| 5     | 198.5 s | outro final      | Lowest luminance frame; teeth faint but readable; composition unchanged. |

## Mesmerizing probes

| Probe          | Verdict | Notes                                                      |
|----------------|---------|------------------------------------------------------------|
| Eye-landing    | pass    | Eye lands on whichever ring's teeth happen to be brightest — wanders between rings frame-to-frame. 2-4 candidate regions easily. |
| Prediction     | pass    | Macro composition (concentric rings, central bloom) is predictable. Micro tooth positions are not — five different rotation rates across rings. |
| Squint         | pass    | Macro: a concentric target / mandala. Fine tooth texture survives stepping close. Dual resolution. |
| Hue drift      | pass    | Cream → rose → mauve → wine-pink → amber across six frames. Slow, within the warm family. |
| Mystery        | pass    | The relationship between tooth counts and the music doesn't fully resolve — viewer senses independent ring drift but can't predict next alignment. |

**5/5 probes pass. The piece mesmerizes.**

## Claim check

**PASS.** Five concentric wheels with visibly distinct tooth counts read on
screen in every frame. The 17-tooth outer ring is unambiguously denser than the
5-tooth inner. Structure-honesty recovered from v1.

However: **partial claim failure on the arc dimension.** The claim states "each
ring on its own clock" and "pairwise tooth alignments per bar are the visual
hooks" with a 65-second peak that is "where pairwise alignments brighten the
radial axes most often." The captured frames show tooth *rotation* across the
piece, but do NOT show visible *alignment moments* — the radial-axis brightening
that the text describes. More critically: **the piece visually shows zero
differentiation across the 65-second peak.** Frame 3 (t=135s, middle of the
peak) is brighter than frame 2 (pre-peak at t=112s), but frame 4 (t=186.6s, late
in the outro) is *nearly as bright* and shows no structural dimming or
de-energization. The arc claim fails. The piece does not use its available
musical structure to compose section-to-section shape.

## Scores

| Dimension                   | Score | Note                                                       |
|-----------------------------|-------|----|
| Palette cohesion            | 5     | Warm-only throughout, gentle gamma, no cold leak. Solid. |
| Composition                 | 4     | Five concentric rings with eye-landing zones. Macro geometry locked to centre — no spatial migration across the song arc. |
| Motion                      | 2     | Ring rotation is per-frame present but **per-section invisible**. Five clocks fire (bar phase, section progress, beat phase, mid-driven, high-driven) but their *effect on the piece's overall energy* is flatlined. The outer ring rotates imperceptibly frame-to-frame at low BPM multiples; middle rings faster; inner rings even faster — but the **piece as a whole** shows zero acceleration, zero climax, zero post-climax collapse. One-scale motion (tooth rotation) locked to audio clocks without macro composition layered on top. |
| Intensity & dynamic range   | 2     | Peak frame (t=135s) is brighter than intro, but only ~20-30% brighter. No real quiet section (frame 5 is dimmed but still legible). No real peak (frame 3 doesn't feel like 65 seconds of accumulated energy). The dynamic range is compressed into a narrow band. The piece doesn't use its music's 65-second climax. |
| Depth                       | 4     | Multiple scales: rings + teeth + alignment-axis glow + haze + grain. Could be 5 if the scales fractally embedded; here they're discrete. |
| Form & ending               | 3     | Outro exists (frame 5) and is visibly dimmer. But the ending is a slow fade to black rather than a *composed* moment — no flash, no collapse, no earned resolution. |

## What's working

- **Five rings read clearly, with distinct tooth counts.** The geometry claim is delivered. The palette is warm throughout.
- **Ring rotation is audible per-ring.** Five clocks fire independently; tooth positions shift frame-to-frame.
- **Mesmerizing quality intact.** All five probes pass. The piece holds the eye without exhausting it.
- **Hub-bloom and haze-drift provide supporting layers.** The composition is clean and uncluttered.

## What's imperfect (ranked)

1. **THE MAIN FAILURE: Zero per-section shape.** Louis called it directly:
   "too static, not chaos enough". The piece has *intra-frame micro-motion*
   (tooth rotation) but ZERO *inter-frame macro-motion*. From frame 0 (intro)
   to frame 3 (peak) to frame 4 (outro), the visual does not *change shape* or
   *intensify* — it just rotates its teeth in place and shifts palette. The
   17-second intro looks nearly as energised as the 65-second peak. The piece
   claims to use `u_section_progress` to drift the haze phase, `u_downbeat` to
   pulse the hub-bloom, and five independent rotation clocks — yet visually
   there is **no section-level dynamics**. The five ring clocks are
   *independent of each other* but also **independent of the music's arc**.
   
   Diagnosis: The rings rotate, but ring *radius*, ring *position*, ring *width*,
   tooth *amplitude*, ring *opacity* are all static per-section. Only rotation
   angle changes. Only the hub-bloom (a 0.035-radius centre glow) responds to
   section markers with pre-tension and post-flash — but it's too small to carry
   the piece. The wheels themselves are locked into one visual *state* and
   merely spin within it.

2. **No visible alignment glows.** The shader computes `align_axis` (the sum of
   tooth indicators where multiple rings have a tooth at the same angle) and
   adds a glow term at line 149 (`col += vec3(0.22, 0.13, 0.06) * ax`). In the
   captured frames, this glow is invisible or extremely dim. The "pairwise
   tooth alignments brighten the radial axes most often" text in the claim
   doesn't visually manifest. Either the glow is undersaturated, or the
   alignments are too rare in the chosen time offsets, or both.

3. **Hub-bloom is decorative, not compositional.** It pulses slightly on
   downbeats and dimples on section changes, but at radius 0.035 it reads as a
   pixel, not a structural element. It should either shrink to nothing during
   pre-tension and *balloon* on the post-flash (visual punctuation of section
   boundaries) OR be removed entirely in favour of a section-driven waveform on
   the wheels themselves.

4. **Haze-drift is supporting, not lead.** The haze warms/cools and drifts phase
   slightly across sections, but it's a visual texture, not a compositional move.
   This is fine — it's meant to be supporting. But it means the entire
   section-level arc rests on the wheels layer, which delivers zero section
   motion.

5. **Quiet frame (frame 5) doesn't read as quiet.** Frame 5 is dimmer than frame
   3, but only slightly. It should read as a genuine collapse: sparse activity,
   low luminance, sparse tooth illumination. Instead it's "slightly darker
   wheels at the same composition."

## Song-level composition probes (from taste.md)

Run these four probes on pieces with `meta.yaml` declaring section-aware
composition:

1. **Section-readability probe.** Frames at song_progress ∈ {0.05, 0.25, 0.45,
   0.65, 0.85} — can a viewer guess which section each frame is from?
   
   Frame mapping (from meta.yaml: intro 17s, build 81s, drop 113s, peak 178s,
   outro 195s, end 202s):
   - 0.05 ⇒ t ≈ 10s (intro)
   - 0.25 ⇒ t ≈ 50s (melody build)
   - 0.45 ⇒ t ≈ 91s (late build, edge of drop)
   - 0.65 ⇒ t ≈ 131s (mid-peak)
   - 0.85 ⇒ t ≈ 172s (late peak, edge of outro)
   
   Our captured frames are {0.01, 0.45, 0.55, 0.67, 0.92, 0.98}. Remapped to
   section centres: 0.01 ≈ intro, 0.45 ≈ late build, 0.55 ≈ early drop,
   0.67 ≈ mid-peak, 0.92 ≈ outro, 0.98 ≈ outro final.
   
   **FAIL.** Frames 0, 1, 2, 3 (intro through mid-peak) are visually
   near-identical: same ring structure, same composition, same eye-landing
   zones, only tooth position shifted and palette drifted. A blind viewer
   looking at {frame-0, frame-1, frame-2, frame-3} would not be able to rank
   them by section. Frame 4 is brighter (✓), frame 5 is dimmer (✓), but the
   intro and peak are visually interchangeable.

2. **Downbeat-anchored probe.** Are structural events keyed to `u_downbeat` /
   `u_section_id` (composition) or to `u_audio_bass` (reaction)?
   
   Shader audit:
   - `hub-bloom`: reads `u_downbeat` → kickR impulse (✓) and `u_to_section_change`
     → pre-tension squeeze (✓). Two structural events wired to composition uniforms.
   - `haze-drift`: reads `u_section_progress` → phase drift (✓). One structural
     event.
   - `coprime-wheels`: reads five ring clocks (bar phase, section progress, beat
     phase, mid-driven rate, high-driven jitter) but **none of these parameters
     alter ring radius, opacity, or width**. Ring rotation is the only
     section-aware parameter. Rotation is motion, but it's not *compositional
     change* — it's just spinning in place.
   
   **PASS on hub-bloom, but WEAK on coprime-wheels.** The wheels have five
   clocks, but the clocks drive rotation only. To pass this probe fully,
   coprime-wheels should also modulate (ring radius, tooth amplitude, ring
   opacity, or any parameter that changes the *shape* of the piece) keyed to
   section markers.

3. **Pre-tension probe.** Does the shader reference `u_to_section_change` or
   `u_section_progress`? Do frames 30s and 8s before a drop look visibly
   different (squeeze, desaturation, withholding)?
   
   Shader: `hub-bloom` withholds (radius scales 0.55×) and dims (bodyGain 0.6×)
   over the last 12s before a section change.
   
   Frames: We don't have a frame captured 8s before a drop boundary, so we can't
   frame-verify. But hub-bloom is 0.035 radius — too small to see a 0.55×
   squeeze. 
   
   **PASS on shader, but WEAK on frame.** The withholding is coded correctly but
   optically invisible.

4. **Long-arc probe.** Render 12 frames at evenly spaced `u_song_progress`. Is
   there a visible peak/trough structure?
   
   Our 6 frames show a weak peak (frame 3, t=135s) and a weak trough (frame 5,
   t=198.5s), but the dynamic range is compressed. Intro (frame 0) is almost as
   bright as mid-peak (frame 3).
   
   **WEAK.** A density/contrast curve would have a maximum, but it's not tall
   enough to read as "climax" — more like "slightly brighter in the middle."

## Verdict

**needs-tweak** — not **structural-rethink**. The piece is mesmerizing
(5/5 probes, claim check pass), but it fails the song-level composition probes.
One concrete structural change can raise Motion and Intensity from 2→4 and
Form from 3→5, moving the overall package from "shippable but flat" to
"shippable and alive."

The top fix MUST raise **per-section macro dynamics** on the wheels layer. Louis
was explicit: "too static, not chaos enough". Parameter tweaks (brighter teeth,
wider tooth peak, higher alpha) are NOT the answer — the piece is already
bright enough. The wheels need to **change shape across the song**, not just
rotate in place.

## Top fix recommendation

**What:**

In `pieces/cirrus/layers/coprime-wheels/shader.frag`, add section-driven ring
destabilisation:

At line 74 (after `omega[4] = u_time * 0.9 + hi * 4.0;`), add:

```glsl
// Section-driven ring centre drift — pre-peak build shifts ring centres away
// from the origin, destabilising geometry. Rings snap back at downbeat after
// the section boundary. This breaks the locked-centre state machine.
float buildIntensity = smoothstep(0.65, 1.0, sp); // ramp from 65% of section to end
float driftPhase = u_bar_phase * TAU;
vec2 driftCentre = vec2(cos(driftPhase), sin(driftPhase)) * 0.025 * buildIntensity;
```

Then at line 91 (where `Ri_eff = Ri + radialDelta;`), replace with:

```glsl
float Ri_eff = Ri + radialDelta + length(driftCentre);
```

And replace line 48 (the centre coordinate calculation) from:

```glsl
vec2 c  = (gl_FragCoord.xy - 0.5 * u_resolution)
        / min(u_resolution.x, u_resolution.y);
```

to:

```glsl
vec2 c  = (gl_FragCoord.xy - 0.5 * u_resolution)
        / min(u_resolution.x, u_resolution.y);
c -= driftCentre * 2.0;  // Shift all ring centres by this vector
```

**Why:**

- **Visible per-section chaos.** As `u_section_progress` rises from 0.65 to 1.0
  (the final ~35% of each section heading into the next), ring centres orbit
  away from the origin. This breaks the "locked mandala" visual state. Rings no
  longer sit concentric; they scatter. The piece visually accelerates.
  
- **Downbeat-anchored recovery.** At `u_downbeat` (section flip), the rings snap
  back to the origin. Visible punctuation of structural boundaries.
  
- **Geometry-driven, not brightness-driven.** The change is *where pixels are*,
  not *how bright* they are. Satisfies the motion-over-luminance probe.

- **Matches VISION.md commitment to intensity.** "Err toward more...
  Intensity is a virtue." The piece was holding back on compositional risk by
  keeping the rings perfectly concentric. This fix introduces *visible chaos*.

**Caution:**

- The drift amount (0.025) is a subtle offset. If it reads as imperceptible,
  increase to 0.040. If it reads as overcooked (rings fragmenting into
  unreadable scatter), reduce to 0.012.
  
- The `buildIntensity` ramp is tuned to trigger in the final ~35% of each
  section. If the intended "peak build" is earlier or later in the structure,
  adjust the `smoothstep(0.65, 1.0, sp)` thresholds.

- The shift amount in the c adjustment (`c -= driftCentre * 2.0;`) amplifies the
  centre movement so it's visible. If rings distort too much on the edges, drop
  to `1.5` or `1.0`.

---

```yaml
piece: cirrus
iteration: 1
verdict: needs-tweak
claim_check: pass
mesmerizing_passes: 5
mesmerizing_probes:
  eye_landing: pass
  prediction: pass
  squint: pass
  hue_drift: pass
  mystery: pass
music_passes: n/a
song_level_composition_passes: 2  # pre-tension (weak), downbeat (weak)
scores:
  palette_cohesion: 5
  composition: 4
  motion: 2
  intensity: 2
  depth: 4
  form_ending: 3
top_fix:
  dimension: motion & intensity (song-level composition)
  what: |
    In coprime-wheels/shader.frag, add section-driven ring-centre drift:
    
    After line 74, add:
      float buildIntensity = smoothstep(0.65, 1.0, sp);
      float driftPhase = u_bar_phase * TAU;
      vec2 driftCentre = vec2(cos(driftPhase), sin(driftPhase)) * 0.025 * buildIntensity;
    
    After line 48, add:
      c -= driftCentre * 2.0;
    
    At line 91, replace:
      float Ri_eff = Ri + radialDir;
    with:
      float Ri_eff = Ri + radialDir + length(driftCentre);
    
    This causes ring centres to orbit away from origin during the final ~35%
    of each section (the pre-peak build), then snap back at downbeat. Visible
    section-driven geometry change — the piece destabilises and recovers.
  why: |
    Frames 0–3 are nearly identical visually. The piece rotates its teeth but
    doesn't change its *shape* across the 65-second peak. Louis: "too static,
    not chaos enough." This fix introduces per-section macro motion (ring centres
    drifting) that is invisible in idle/intro but visibly accumulates as
    u_section_progress climbs. It answers the "chaos" and "liveness" feedback
    directly by destabilising the geometry itself, not just brightening it.
  caution: |
    Drift amount 0.025 is tuned for subtle offset; if imperceptible, increase to
    0.040. The ramp `smoothstep(0.65, 1.0, sp)` targets the final section third;
    adjust thresholds if the piece's pre-peak build is earlier/later. If rings
    distort at edges, reduce the c-shift multiplier from 2.0 to 1.5 or 1.0.
```
