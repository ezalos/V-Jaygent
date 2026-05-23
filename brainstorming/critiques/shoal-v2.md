# shoal — critique v2

Independent critic, v4 of the build — first version after the
structural fix (phase-space pan + zoom + strong gravity oscillation)
applied in response to the v1 structural-rethink verdict.

## The claim

A Lyapunov chaos map of the double pendulum: each pixel is initial
state (θ1, θ2), integrated for 30 RK4 steps with a perturbed twin;
brightness = log(separation / 1e-4). Stable KAM islands appear dim;
chaotic regions saturate bright. The viewer sees phase-space
architecture reorganising via pan + zoom drift and gravity
oscillation.

## Frame-by-frame

| Frame | t (s) | What's there |
|-------|-------|------|
| 0 | 1.5 | Two spiral vortex regions (upper-left and lower-right), warm brown-gold. Fine filigree at vortex edges. Central calmer zone. |
| 1 | 15.5 | Vortex positions noticeably shifted — upper spiral more central, lower one repositioned. Hue warmer. Macro composition changed. |
| 2 | 29.5 | Vortices migrated further. Upper region occupies more area; bright core asymmetrically placed. Wine-amber blend. |
| 3 | 43.5 | Field has inverted: bright regions dominate left and bottom; calm zone compressed upper-right. Composition unrecognisable from frame 0. |
| 4 | 57.5 | Vortices repositioned again, scattered (left-central, right-edge). Hue continues into amber-gold. |
| 5 | 71.5 | Vortices migrated back toward upper-left + lower-left (asymmetric from frame 0). Hue returning toward wine-brown. |

Fine structure clearly non-repetitive across all six frames.

## Mesmerizing probes

| Probe | Verdict | Justification |
|-------|---------|---|
| Eye-landing | pass | Distinct focal points across frames; composition not locked. |
| Prediction | pass | Macro drift felt; direction not obvious; frame 3 inverts the field. |
| Squint | pass | Sharp distinction bright cores vs calm interior; filigree survives zoom. |
| Hue drift | pass | Warm family throughout, perceptible breathing (wine → gold → wine). |
| Mystery | pass | Vortex positions / filigree refuse full disclosure across 71s. |

Passes: 5/5 — the piece mesmerizes.

## Claim check

pass. The shader computes a canonical Lyapunov chaos map. Frame-to-
frame analysis confirms the basin boundaries are being reorganised
by pan + zoom (frame 0→3 vortex shift ~180°) and gravity oscillation
(period ~70s, range 4–16; KAM islands shrink under high-g, expand
under low-g; frames 0/5 lower-g = smaller bright cores, frame 3 mid-
high g = expanded chaos regions). Honest fractal filigree at basin
boundaries, not procedural noise.

## Scores

| Dimension | Score | Note |
|-----------|-------|------|
| Palette cohesion | 5 | Pure warm ramp, zero cool intrusion, contrast by luminance. |
| Composition | 5 | Field drifts on ~100-150s pan/zoom cycle; eye has shifting landing spots; no macro shape repeats within 70s. |
| Motion | 4 | Three independent clocks (pan ~100s, zoom ~150s, gravity ~70s) but all smooth sinusoidal drift; no beat-scale micro-churn. Stately, not restless. |
| Intensity | 4 | Luminance 0.15–0.95 well-utilised; no inverse dynamic range (quiet sections dim but don't structurally de-energise). |
| Depth | 4 | Fractal filigree strong at basin boundaries; interior chaos regions lack sub-texture. Depth is boundary-heavy. |
| Form & ending | n/a | 90s self-playing; no end-of-track material. |

## What's working

1. Claim delivery — Lyapunov map mathematically sound and visibly
   reorganising. Pan + zoom + gravity oscillation unfroze the v1
   static-field failure.
2. Mesmerizing motion — phase-space window drift is the right fix;
   the eye cannot pre-compute next frame because the pixel-to-state
   mapping itself evolves. Compositional modulation, not parameter
   pilots.
3. Basin honesty — sharp Wada-like filigree at chaos/stability
   boundaries.
4. Palette purity flawless.
5. Idle self-play: requires no cursor / audio.
6. Keyboard + audio plumbing functional (per-key distinct, bass →
   gravity, high → shimmer).

## What's imperfect

All craft-level tweaks, none structural blockers:

1. **Motion lacks beat-scale micro-churn.** Three clocks are smooth
   sinusoids; no sub-second texture churn. Shimmer is sub-perceptual
   at macro scale. Stately drift, not restless. (–1 Motion → 4/5.)
2. **Interior chaos regions lack sub-texture.** Fractal detail at
   boundaries, smooth interiors. Depth is boundary-heavy. (–1 Depth.)
3. **No structural silence.** Dim regions just dim; quiet doesn't
   structurally de-energise. (–1 Intensity.)
4. Gravity period (~70s) may be slightly slow; 45–50s could increase
   the breathing palpability. Minor.
5. No cursor reactivity visible in inspect frames (cursor parked).
   Expected for static inspect; the cursor plumbing is in place but
   not verifiable from idle stills.

## Verdict

**ship-it** — mesmerizing 5/5, claim delivered, scores 4+ on all
testable dimensions. v1's structural rethink (pan + zoom + strong
gravity oscillation) succeeded. The 4/5 dims are real imperfections
but craft-level, not blockers. Future iterations could add
beat-scale shimmer or tighten the oscillation periods, but no
blocker remains.

*Reconciliation note:* per `feedback_critic_verdict_vs_data`, the
YAML data (5/5 probes + claim pass + all testable dims ≥ 4)
technically meets the chef-doeuvre bar. Recorded as ship-it because
the critic's own "what's imperfect" callouts flag three real
craft-level gaps. Either label proceeds to commit.

```yaml
piece: shoal
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
music_passes: n/a
scores:
  palette_cohesion: 5
  composition: 5
  motion: 4
  intensity: 4
  depth: 4
  form_ending: n/a
top_fix: null
```
