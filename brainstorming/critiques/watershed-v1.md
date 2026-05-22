# watershed — critique v1

Independent critic grade (2026-05-22), v9 of the build — the first
version handed to the critic after the gravity→Newton pivot.

## The claim

This piece claims a basin-of-attraction field where every pixel
iterates Newton's method on a polynomial whose roots are moving
wells; its colour is the root it converges to (hue) and how fast
(luminance). The boundary between basins is an intrinsic, crisp,
infinitely-detailed Wada fractal that writhes as the roots move.

## Frame-by-frame

| Frame | t (s) | What's there |
|-------|-------|------|
| 0 | 1.5 | 6 orbiting roots active; warm basins (gold, amber, wine) with cream cursor root (centre-left); crisp Wada boundaries with fine filigree. Deep substrate void fills gaps. Glow cores at each root. Downbeat ring warping the field. |
| 1 | 15.5 | Roots have orbited substantially. Basins reorganized but same topology. Boundaries still crisp. Composition drifts — eye can land on different basins across frames. |
| 2 | 29.5 | Further orbital rotation. Basins now more asymmetric (large amber lakes opposite the wine region). Filigree density varies — fractal self-similarity holds across scale. |
| 3 | 43.5 | ~30s in: roots continue their ~95s breathing cycle. Basins occupy different regions (red-wine dominant now). Wada filigree persists. No jump or collapse. |

## Mesmerizing probes

| Probe | Verdict | Justification |
|-------|---------|---|
| Eye-landing | pass | Eye lands on the cream basin core then the surrounding wine/gold lakes; distinct focal points across all frames, gaze can wander. |
| Prediction | pass | Macro drift predictable (roots orbit smoothly), micro filigree not — the "almost, not quite" zone. |
| Squint | pass | Blurred: clear macro light/dark — bright lakes vs dark Wada network. Fine texture survives up close. Dual-resolution. |
| Hue drift | pass | Warm family throughout (wine → gold → amber). No cool jump. Luminance carries contrast. |
| Mystery | pass | The fractal boundary refuses full disclosure — invites infinite zoom that never resolves. Kaplan's mystery. |

Mesmerizing passes: 5/5 — the piece mesmerizes.

## Claim check

pass. Newton basins coloured by root; luminance = convergence speed;
crisp self-similar Wada boundary; basins reorganize structurally as
roots orbit; ≥6 roots visible. No claimed feature missing.

## Scores

| Dimension | Score | Note |
|-----------|-------|------|
| Palette cohesion | 5 | Pure warm ramp, zero cool intrusion, contrast by luminance. |
| Composition | 5 | ~95s orbital drift; intrinsic empty zones; eye has shifting landing spots. |
| Motion | 5 | Three independent clocks — orbit (~95s), downbeat ring (~0.5s), shimmer (sub-beat). Never frozen. |
| Intensity | 5 | Near-black void to bright-warm; Reinhard prevents clip; silence is form. |
| Depth | 5 | Fractal self-similarity at every rendered scale; zoom-invariant filigree. |
| Form & ending | n/a | 90s self-playing; no end-of-track capture. |

## What's working

1. Fractal boundary honesty — the Wada filigree is present and crisp
   in every frame; no smooth gradient masquerading as a fractal.
2. Multi-scale motion independence — three desynchronised clocks, the
   eye can never pre-compute the next frame.
3. Palette purity — no cold intrusion; contrast is honest luminance.
4. Interaction agency — cursor carries a root (compositional),
   keyboard places 3 pitch-hued roots, audio breathes the orbit +
   shimmer (geometry, not brightness).
5. Idle self-plays — 6 roots orbit on an internal clock; no
   load-bearing audio.
6. Architecture honesty — single-pass; Newton is cheap enough to
   recompute crisp every frame.

## What's imperfect

All at the 1–2% nuisance level — none blocks mesmerization:

1. Glow-core brightness — the cream cursor core nearly bleaches its
   immediate neighbourhood, costing a little boundary detail at the
   roots. Low severity (justified — wells glow).
2. Downbeat ring visibility — the ring warps the field geometrically
   but reads soft on screen; undersells its once-per-bar event.
3. Keyboard root placement — a fixed elliptical ring; functional and
   per-key distinct, but a formulaic placement.
4. Pixel aliasing at near-vertical boundaries — inherent to per-pixel
   classification at one sample/pixel; acceptable at render_scale 0.66.
5. Shimmer is capped at half-amplitude when idle (audio-modulation is
   a multiplier, not a floor) — a minor lost opportunity.

## Verdict

chef-doeuvre — mesmerizing 5/5, claim delivered, all five testable
dimensions at 5. The imperfections are craft-level iteration-2 tweaks;
the piece as it stands is complete and cohesive.

```yaml
piece: watershed
iteration: 1
verdict: chef-doeuvre
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
  motion: 5
  intensity: 5
  depth: 5
  form_ending: n/a
top_fix: null
```
