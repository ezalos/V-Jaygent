# cirrus v1 critique

## The claim

This piece claims a *zoetrope of coprime-tooth wheels* — five
concentric rings at coprime tooth counts (5, 7, 11, 13, 17), each
on its own clock, alignment moments brightening radial axes,
cursor wind bowing the rings, keyboard inserting glowing teeth.

## Frame-by-frame

| Frame | t       | Section          | What's there                                        |
|-------|---------|------------------|-----------------------------------------------------|
| 0     | 1.5 s   | intro pulse      | Warm cream/amber glow centred, soft haze radial; no ring teeth visible |
| 1     | 31.5 s  | melody build     | Same — central glow, brown haze edges               |
| 2     | 61.5 s  | melody build     | Same. Slight upper-left dimming. No teeth.          |
| 3     | 91.5 s  | drop             | Same composition. No structural change visible.    |
| 4     | 121.5 s | PEAK (mid)       | A few faint amber dots clustered low-centre — this is the wheels finally showing, but as scattered specks not rings |
| 5     | 151.5 s | PEAK (late)      | Speckles slightly more visible, still dim, no ring structure resolves |
| 6     | 181.5 s | outro fade       | Speckles shift to wine/red (palette ramp working). Still no ring structure. |

## Mesmerizing probes

| Probe          | Verdict | Notes                                                      |
|----------------|---------|------------------------------------------------------------|
| Eye-landing    | fail    | The eye locks to the central glow in every single frame. No 2-4 candidate regions. The "soft fascination" zone is a single hot spot — boring. |
| Prediction     | fail    | I could draw frame 4 from frame 0; the bloom and haze barely change. Predictable = spell broken. |
| Squint         | fail    | Squinted, every frame is "warm gradient with a glow" — uniform composition. No macro structure beyond a bright centre. |
| Hue drift      | weak    | Very slow drift (gprog) eventually shifts the speckles toward wine in frame 6. Within 30s windows, hue is locked. |
| Mystery        | fail    | Nothing refused. The piece is fully disclosed in 2 seconds — it's a haze and a glow. |

**0/5 probes pass.** The piece does not mesmerize. The thesis
(zoetrope of coprime wheels) does not reach the screen.

## Claim check

**FAIL.** The defining feature of the claim — five concentric
wheels at coprime tooth counts, with radial alignment glows — is
not visible. Frames 4–6 show faint scattered speckles in the
lower frame; that is the wheel layer rendering, but not as
*rings*. A viewer cold to the meta.yaml could not name what this
piece is about. The lead layer is buried under the haze + bloom.

The structural-honesty lens (taste.md): the piece claims five
rings at five tooth counts, and zero rings read on screen. That's
the strongest possible failure of structure-honesty.

## Scores

| Dimension                   | Score | Note                                                       |
|-----------------------------|-------|------------------------------------------------------------|
| Palette cohesion            | 5     | Warm-only throughout, gentle gradient, no cold mid-range. The one dimension that's working. |
| Composition                 | 1     | Static; one focal spot every frame. No wandering, no empty zones differentiated from edge. |
| Motion                      | 2     | Haze drift is single-scale and slow. Hub-bloom pulses but is the only motion. No multi-scale churn. |
| Intensity & dynamic range   | 2     | Always lit — same luminance dynamic across all frames. No real quiet, no real peak. |
| Depth                       | 2     | Two scales (haze + glow) but no fine substructure. Reads as a postcard. |
| Form & ending               | n/a   | Untestable from inspect frames; outro frame at 181.5s is still well before the end. |

## What's working

- Solid-warm + haze-drift + vignette set a clean warm atmosphere.
  The palette cohesion is genuinely on-thesis — no rainbow leak,
  no cool tones, gentle gamma.
- Hub-bloom does respond to its triggers — frame 4 has a slightly
  inflated centre vs. frame 0, suggesting kick / downbeat are
  reaching the layer.
- Outro frame 6 shows the warmRamp shifting into wine — the
  palette ramp on song progress works.

## What's imperfect (ranked)

1. **The wheels are invisible.** This is THE problem. The lead
   layer (coprime-wheels) is rendering — frame 4–6's speckles
   prove it — but the contribution is so dim and so sparse that
   the rings do not read as rings. The whole thesis fails because
   of this.

   Diagnosis (combined causes):
   - `pow(max(cos(x), 0.0), 6.0)` makes teeth tiny in angular
     extent — only the very peak of each cosine lobe lights up,
     leaving most of the ring dark.
   - There's no "ring presence" between teeth — annulus mask is
     multiplied by tooth shape, so between teeth the contribution
     is zero.
   - Maximum tooth_lum ≈ 0.75 (ringMask=1, toothShape=1,
     ringBase=0.75) gives wheelCol values around (0.75, 0.64,
     0.41), which is *barely* brighter than the screen-blended
     haze at the same pixel. Max-blend then loses the wheels.
   - Haze-drift's central alpha is 0.55 — over a warm base
     screen-blended at 0.55 alpha, the haze fills the inner
     region with luminance that competes with the wheels.
   - Hub-bloom at radius ~0.05 with kick + bass gain is the
     brightest thing in every frame — it dominates the eye.

2. **Hub-bloom upstages the wheels.** It was meant to be the
   "still centre" of the praxinoscope reference; instead it's
   the headlight of the piece. Reduce its peak brightness and
   shrink it.

3. **No ring outline.** Even between teeth, the ring should
   read as a thin warm band so the *geometry* of "five
   concentric wheels" is visible from the first frame. Currently
   you only see the wheels exist by inference from teeth that
   never fire.

4. **Composition is single-zone.** Eye-landing fails because
   there is one bright centre and nothing else. With wheels
   present this would auto-resolve — the rings give multiple
   bands the eye can wander between.

## Verdict (v1)

**needs-tweak** with a substantive top_fix. Strictly speaking
0/5 probes might call for `structural-rethink`, but the
structure of the piece is not wrong — the lead layer's rendering
is wrong. One concentrated edit on `coprime-wheels` (plus minor
gain reductions on haze and hub) should bring the piece up.

```yaml
piece: cirrus
iteration: 1
verdict: needs-tweak
claim_check: fail
mesmerizing_passes: 0
mesmerizing_probes:
  eye_landing: fail
  prediction: fail
  squint: fail
  hue_drift: weak
  mystery: fail
music_passes: n/a
scores:
  palette_cohesion: 5
  composition: 1
  motion: 2
  intensity: 2
  depth: 2
  form_ending: n/a
top_fix:
  dimension: composition (and claim check)
  what: |
    Make the wheels READ. In coprime-wheels:
    - Add a thin always-on annulus per ring (warm band visible
      between teeth) at ~0.30 of tooth peak brightness.
    - Soften tooth power from `pow(cos, 6.0)` to `pow(cos, 2.5)`
      — wider, softer teeth that occupy more of each ring.
    - Boost wheel contribution: replace `max(below, wheelCol *
      tooth_lum)` with `max(below + wheelCol * tooth_lum * 1.4,
      wheelCol * tooth_lum * 1.6)` so the wheels actively brighten.
    - Widen ring widths from {0.024, 0.022, 0.020, 0.018, 0.016}
      to {0.034, 0.030, 0.026, 0.024, 0.022}.
    Then reduce competing layers:
    - haze-drift: lower central alpha from 0.55 to 0.32; lower
      edge alpha from 0.30 to 0.18.
    - hub-bloom: reduce final alpha from `bloom * 0.75` to
      `bloom * 0.45`; baseR from 0.05 to 0.035.
  why: |
    The wheels are the entire thesis of the piece. Currently the
    inspect frames show speckles, not rings. Above changes make
    the ring geometry visible from the first frame (always-on
    annulus), let the teeth occupy enough angular space to look
    like teeth (softer power), and stop the haze + bloom from
    burying them.
  caution: |
    Don't push wheel brightness so high that the warm palette
    bleaches. Keep peak luminance ≤ ~0.85 so Reinhard tonemap
    doesn't clip. If after the fix the haze becomes invisible
    (alpha 0.32 reads like nothing on top of solid-warm), nudge
    it back up — but the priority is wheels, not haze.
```

---

## v2 — after the top fix

Re-rendered with the always-on ring presence + softer tooth shape
+ wider rings + lower haze/bloom alpha + Reinhard roll-off in
`coprime-wheels`.

### Frame-by-frame (v2)

| Frame | t       | What's there                                                                 |
|-------|---------|------------------------------------------------------------------------------|
| 0     | 1.5 s   | Five concentric rings clearly readable. Outer ring (17 teeth) bright cream/amber; inner rings progressively wider-spaced teeth. Centre quiet bloom. |
| 1     | 31.5 s  | Wheels persist; palette has drifted toward dusty rose/mauve on the teeth.   |
| 2     | 61.5 s  | Mauve/wine teeth tint; tooth positions visibly shifted from frame 1 (rotation working). |
| 3     | 91.5 s  | Drop section — slightly thicker tooth bloom, wine→pink palette.             |
| 4     | 121.5 s | Peak — brightest frame, bright amber/cream teeth on every ring; the 17-tooth outer ring fully lit. |
| 5     | 151.5 s | Late peak — still bright; teeth at different angular positions; the rotation is felt. |
| 6     | 181.5 s | Outro — teeth dimmer, palette pulled back toward amber. Composition still readable. |

### Mesmerizing probes (v2)

| Probe          | Verdict | Notes                                                      |
|----------------|---------|------------------------------------------------------------|
| Eye-landing    | pass    | The eye lands on whichever ring's teeth happen to be brightest — wanders between rings frame-to-frame. 2-4 candidate regions easily. |
| Prediction     | pass    | Macro composition (concentric rings, central bloom) is predictable. Micro tooth positions are not — five different rotation rates across rings. The "almost-but-not-quite" zone the thesis aimed for. |
| Squint         | pass    | Macro: a target / mandala. Fine tooth texture survives stepping close. Dual resolution — Ikeda zone. |
| Hue drift      | pass    | Cream → dusty rose → mauve → wine-pink → amber across the seven frames. Slow, within the warm family (with the wine/mauve exception). |
| Mystery        | pass    | The relationship between tooth counts and the music doesn't fully resolve — viewer can sense the rings drift independently but can't predict the next alignment. Kaplan's mystery. |

**5/5 probes pass.**

### Claim check (v2)

**PASS.** Five concentric wheels with distinct tooth counts read on
screen in every frame. The 17-tooth outer ring is unambiguously
denser than the 5-tooth inner ring. Structure-honesty: recovered.

### Scores (v2)

| Dimension                   | Score | Note                                                       |
|-----------------------------|-------|------------------------------------------------------------|
| Palette cohesion            | 5     | Warm-only with the wine/mauve excursion staying inside the warm family. No cold leak. |
| Composition                 | 4     | Clear concentric structure, eye has multiple ring zones to wander, but the macro geometry is anchored at centre — no spatial migration. |
| Motion                      | 4     | Five distinct rotation rates visible across frames; rings desynchronised. Single-scale failure mode avoided. |
| Intensity & dynamic range   | 4     | Frame 0 is calm, frame 4 (peak) clearly more energised, frame 6 (outro) dimmed back. Real arc visible. |
| Depth                       | 4     | Multiple scales: rings + teeth + alignment glows + haze + grain. Could be 5 if the scales fractally embedded; here they're discrete. |
| Form & ending               | n/a   | Inspect frames don't reach end of song; can't grade.       |

### Verdict (v2)

```yaml
piece: cirrus
iteration: 2
verdict: ship-it
claim_check: pass
mesmerizing_passes: 5
mesmerizing_probes:
  eye_landing: pass
  prediction: pass
  squint: pass
  hue_drift: pass
  mystery: pass
music_passes: n/a   # full music probe pass would require live-audio frames
scores:
  palette_cohesion: 5
  composition: 4
  motion: 4
  intensity: 4
  depth: 4
  form_ending: n/a
top_fix: null
```

The piece is shippable. Remaining gap is *nuance* (composition
migration, deeper fractal scales) — that's `/vjay-iterate` work,
not blocking. Per the skill, one fix max in `/vjay-new-piece`;
ship.

