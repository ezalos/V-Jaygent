# dopamine-split-brain-version — v5 critique (bugfix only)

## Why v5

Louis spotted "blocky/buggy patch with hard square borders" in v4's
running piece. I confirmed by extracting a late frame from the verse
clip — diagonal band-shaped striations crossing the gold field,
dark block-patches between cells.

## Root cause

`lib/noise.glsl`'s `fbm()` function carries an explicit warning in
its own header comment:

> Produces slight grid-aligned artefacts in flat regions; prefer
> `fbmRot` for pieces that hold still.

The chaos-warp called `fbm()` for its curl-noise source. The piece's
heavy `u_history` decay (0.92) holds the field "still" for ~12-frame
half-life — long enough that fbm's grid-aligned high-frequency content
got baked into persistent trails as block-shaped patches. The curl
operation's finite-difference gradient amplifies high-frequency content
further, so the artefact landed at ~3px screen scale (the 5th-octave
cell size at fbm's domain × layer resolution).

## The fix

Replaced `fbm` with a piece-local `smoothNoise` function in
`chaos-warp/shader.frag`:

- 3 octaves (was 5) — fewer high-frequency components to amplify
- Per-octave rotation `mat2(0.80, 0.60, -0.60, 0.80)` + offset
  `(1.7, 9.2)` — hides the grid alignment between octaves
- Curl epsilon raised 0.018 → 0.030 — gradient acts as a wider
  low-pass filter

## Diagnostic harness added

`pieces/chaos-warp-test/` is a non-shipping diagnostic piece that
puts the chaos-warp on top of a known high-contrast base:
- left third: 16×9 checkerboard
- middle third: 1px line-grid
- right third: smooth rainbow gradient

Any artefact in the warp itself becomes obvious because the base is
stationary and known. Comparing pre-fix vs post-fix on the test
harness showed the line-grid bending into a smooth curved mesh
(post-fix) instead of diagonal striations (pre-fix). The harness
stays in the repo as triage tooling — future chaos-warp tweaks
should be validated here first.

## Verification

Post-fix dopamine frames:
- **Verse**: oscillator dots remain clean rounds with gentle smear;
  no striations or block patches in the gold field; trails are
  smooth curves not chopped wings.
- **Peak**: organic flowing vertical comet-trails; cell positions
  legible; no diagonal banding.

Test harness frames:
- **Line grid**: smooth curved mesh deformation, no visible
  discontinuities.
- **Checkerboard**: cell shape preserved (warp magnitude ≪ cell
  size); only the cell boundaries pick up subtle curve.
- **Rainbow**: smooth unbroken gradient — no banding.

## Lessons

- When a piece uses `u_history` feedback with decay ≥ 0.90, the
  field is effectively static-on-the-timescale-of-many-frames.
  Anything that would produce visible artefacts in a *still* image
  WILL be baked into trails. `lib/noise.glsl`'s warning to use
  `fbmRot` for "pieces that hold still" applies double here.
- The diagnostic test pattern (checkerboard + line-grid + gradient)
  is the right way to debug warp layers. The artefact was nearly
  invisible in the dopamine stills (oscillator dots are themselves
  noisy enough to camouflage the warp's striations) but glaring on
  the test harness's line grid.
- Curl-of-fbm amplifies high-frequency components via the gradient.
  Use the smoothest possible scalar field as the source — and a
  larger gradient epsilon to low-pass the result.

## Verdict

Ship as-is. Single-shader bugfix; the v4 self-verdict (chef-d'oeuvre
30/30 + 5/5 mesmerizing including Prediction) still holds, just
without the previously-visible grid artefacts.
