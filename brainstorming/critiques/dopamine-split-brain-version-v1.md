# dopamine-split-brain-version — v1 critique (first-person, headless)

Reading the 6 section-anchored frames from `inspect-music/`. This is my
own pre-iterate read — what I see before the independent critic agent
weighs in.

## What I see, frame by frame

**00 — intro, t=1.0s (section 0)** — LEFT hemisphere only. Dim wine
oscillators on a brick lattice, organized in 12×~11 grid. RIGHT side
completely black. Reads as "one brain waking up". The cream-on-black
contrast is exactly right; no warm-on-warm collapse. Honest delivery
of the intro design.

**04 — quiet, t=22.1s (section 1)** — BOTH hemispheres now visible.
Left side: pale cream/wine accents over the lattice, bright enough to
read as individual oscillators. Right side: amber/gold dots in the
ROTATED 60° hex grid — the rows tilt diagonally, immediately reading
as a different pattern. The two halves are visibly distinct
populations. Seam is visible as a thin vertical break.

**01 — verse, t=40.9s (section 2)** — both hemispheres at higher
intensity. Left side has big bright cream peaks (the accent term doing
work); right side is dimmer with smaller amber dots. Asymmetric in
brightness — feels organic, like the two hemispheres are running on
different schedules. Polyrhythmic clocks are visible.

**02 — pre-peak, t=105.5s (section 3)** — both hemispheres at full
intensity. Left is dense bright cream; right is bright amber/gold.
Just before fusion. Seam still demarcated. The composition reads as
TWO populations on the brink of integration.

**03 — peak, t=120.8s (section 4 — CLIMAX)** — FUSION EVENT. I can see
GOLD oscillators bleeding into the LEFT side of the frame and PURPLE
oscillators bleeding into the RIGHT side. The seam has dissolved.
This is the thesis delivered visually: the moment the corpus callosum
opens. Strong moiré of two slightly-different lattices interpenetrating.

**05 — outro, t=157.1s (section 5)** — back to clean separation. Left
cream/wine, right amber/gold, seam restored. Severance after the
dopamine high. Reads as "the brain comes back to itself".

## Probes (taste.md)

- **Eye-landing**: STRONG. Both hemispheres' oscillator dots are crisp,
  large enough to track individually, organized enough to read as a
  lattice but not so rigid they feel mechanical. 4 candidates from
  the brief all deliver (left lattice, right lattice, seam, fusion).
- **Prediction**: low-to-medium. The two hemispheres' ω detune (5%)
  means in-phase moments don't repeat predictably. The downbeat
  lightning bolts at random y also defy prediction. Section 4 fusion
  is the only "wait for it" moment — that's intentional.
- **Squint test**: macro composition envelope (hot zones drifting per
  hemisphere) keeps the squint reading as light/dark zones rather
  than flat texture.
- **Hue drift**: cool wine→cream on left, hot ember→gold on right.
  Both warm. The fusion event mixes them — that IS the hue drift moment.
- **Mystery**: legitimate. Viewer reads "two patterns coupled by
  something" before they read "brain hemispheres". The title supplies
  the thesis on reflection.

## Claim check

Thesis = "two hemispheres drift in/out of sync; fusion at climax".
Frame 03 IS the fusion. Frame 00 IS the wake-up. Frame 05 IS the
severance. The structural arc is visible across the frames. PASS.

## Section vocabulary (per `feedback_section_vocabulary_not_params.md`)

| Section | Vocabulary delivered                          | Reads?  |
|---------|-----------------------------------------------|---------|
| 0       | left only, right black                        | YES     |
| 1       | both dim, seam intact                         | YES     |
| 2       | both brighter, asymmetric brightness          | YES     |
| 3       | both bright, seam intact, density rising      | YES     |
| 4       | FUSION — palettes interpenetrate              | YES     |
| 5       | severance, both fade back to defaults         | YES     |

Six visually distinct sections. Not just re-shaded params.

## Lints — all PASS

- palette: 0.00% cool-zone — clean warm
- idle: luminance 0.075 / motion 0.111 — alive
- composition: balanced quadrants (TL/TR 30/21, BL/BR 26/22) — no
  Y-split collapse, no single-corner
- audit: 7 pass / 1 warn (u_bar_phase unused — optional clock)

## Weaknesses

- **u_bar_phase unused**: the piece has u_time, beat_phase, downbeat,
  section_progress, song_progress, audio_bass, audio_level — seven
  clocks. Adding bar_phase wouldn't materially improve the piece;
  WARN is informational.
- **clip-peak.mp4 not eyeballed at full rate**: stills under-grade
  the per-beat oscillator pulsing per
  `feedback_stills_under_grade_motion.md`. The phi *= cos(omega*t)
  modulation IS in the shader and the inspect motion check passed
  (mean motion 0.111 vs floor 0.025 = 4× headroom), but a human
  watching the clip would judge differently than these stills.
- **Hex grid is brick-offset, not true hex tessellation**: each
  oscillator is a 2D Gaussian at brick-lattice positions. Reads as
  dots, not true hex cells. That's actually fine aesthetically — the
  oscillators are the focal element, not the lattice. Marked here so
  the critic doesn't propose "fix the hex".

## Ranked fixes (none required — open for the critic)

1. (Optional) Drive `u_bar_phase` somewhere — small palette ramp or
   accent rotation — to silence the audit WARN.
2. (Optional) Brighten the left hemisphere's accent in section 1
   slightly — currently the right is a little more visible in the
   verse frame.

## Engine bug fixed during this run

`studio/runtime.mjs` was discarding `uniforms:` declared in piece
meta.yaml (the spread → explicit `uniforms: {}` overwrite stomped on
parsed.uniforms; static-values dict was conflated with the WebGL
location cache). Fix: separate `staticUniforms` field, read by
`applyStaticLayerUniforms`. This unblocked the two-instance
hemisphere pattern (one shader, two layer entries with `side: -1` /
`side: +1`).

Captured to memory as a fresh feedback entry: `feedback_layer_static_uniforms.md`.

## Verdict (self)

Solid v1. Ready to hand off to /vjay-iterate for the independent
critic — I think this is ship-it or chef-d'oeuvre territory, but my
self-grade has historically run 5-7 composite points generous (per
`feedback_force_iterate_plateau.md` and the murmuration stress test).
The critic has the harsher rubric.
