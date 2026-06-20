# fiebre-de-amor

Track: Havana D'Primera — "Fiebre de Amor" (Cuban timba, 4:51, C major, 92 BPM)
Source: https://youtu.be/SiY0Tzj7574

## Thesis

The interlocking cross-rhythms of timba, drawn as glowing **harmonograph
filaments** over a **fever-bed that heats across the song**. Three coprime
pendulum-pens (conga / bass / brass voices) trace damped Lissajous curves
whose beat-frequencies ARE the music's polyrhythm; the **clave conducts**
(a 2-3 rumba-clave clock re-strikes the pens on its onsets); the **gears
switch the figure's vocabulary** per section (timba's "arriba" gear-shifts);
and the **bloque** — the band's whole-frame stop-then-unison-slam — freezes
the figure in the breakdown, then detonates it on the bass re-entry. The
fever is a warm-arc hue climb: golden-hour gold → tangerine → ember-crimson
→ hot-pink, cooling to deep wine at the cierre.

"Fiebre" = the lyric ("Ay, me sube la fiebre" — love as a rising fever) +
the literal heat of the brass-and-sweat live band. Warm throughout; no cyan.

## Canonical-name check

**Harmonograph.** A harmonograph draws a curve by superposing damped
sinusoids on two axes:
`x(t) = Σ A_i·e^(−d_i·t)·sin(f_i·t + φ_i)`, `y(t)` likewise. When the
component frequencies `f_i` sit at coprime ratios (3:2, 5:3, 7:5 …) the
curve becomes a quasi-periodic rose/spirograph that never exactly retraces
— the visual interference of polyrhythms. Damping (`d_i`) makes each strike
decay; re-striking on a beat redraws the figure. This is the textbook
device (Newton's/Tisley's pendulum harmonograph, 1840s–1890s) and it is the
honest geometric form of "interlocking cross-rhythm". Drawn in a fragment
shader by **gather** (per pixel, min/accumulated distance to the curve
sampled over a time window — NOT scatter), so it stays in the layer engine.

Cross-rhythm grounding: the 3:2 (tresillo-vs-2) cross-rhythm is the heart of
Afro-Cuban music; the pens' coprime ratios encode it. The conductor clock
plots the **2-3 rumba clave** (timba's clave, edgier than son) as a Toussaint
circular necklace of 16 pulses with a sweep hand — one revolution per 2-bar
clave cycle (visible phase-lock).

## Distinctness (catalog survey, 51 pieces)

- NO Latin/timba/salsa/brass-warm piece exists — genre lane open.
- Harmonograph / Lissajous figures: **UNCLAIMED** (explicit white-space).
- Clave-grid / step-sequencer geometry: **UNCLAIMED**.
- AVOIDED, because taken: coprime rotating *wheels/gears* (cirrus, stronger),
  beat-locked expanding *rings/annuli* (throb, danzas-percs, mozart-rondo,
  kinetic-energy), Kuramoto phase sync (dopamine, soudarded). My pens are
  traced *curves* with light-trails, not rotating gears or expanding rings.

## Brief gates (vjay-new-piece §1b + §1c)

canonical_ref: "novel: harmonograph (damped-coprime-sinusoid pendulum curve,
  per-pixel gather as additive line-integral with an analytic fading tail)"
eye_landing_candidates:
  - the three pen-heads (conga/bass/brass), each a bright moving lobe
  - the dense interference knot where two pens' curves cross
  - the brass-bloom focal flare on mambo/sonero hits (migrates)
  - the clave-clock sweep hand crossing a lit onset
warm_cycle: [near-black, deep-wine, ember-crimson, tangerine, amber-gold, hot-pink-cream]
  # a warm-ARC drift (gold→crimson→hot-pink) = the rising fever; NO cyan/mint
  # (research suggested Havana-patina teal + Miami neon-cyan — rejected per
  #  VISION warm rule; took only the warm half of the fever palette)
idle_behaviour: "pens self-play on synthetic clocks (analytic damped Lissajous
  on u_time); fever-bed hot-zone drifts on a slow Lissajous; clave clock sweeps
  on u_bpm fallback. Fully alive with no audio and no cursor — the figure draws
  and reshapes on the drift LFO."
architecture: E  # layer stack — audio + cursor (+ keyboard) drive different
  # visual contributions AND a section state machine over the timba arrangement.
arch_rationale: "Multi-input + section vocabulary over an audio timeline = E.
  Light-trail self-feedback rides on u_history (layer-only). Not C: no PDE state
  needed (harmonograph is closed-form per-pen). Not A: closed-form per pixel but
  the piece's identity is the multi-layer coupling + section machine, not one
  field. Pens drawn by gather (line-integral), so no scatter/passes needed."

## Layer stack (bottom → top)

1. `heat-bed` (normal) — near-black fever ground; dim ember hot-zone wanders
   on a slow Lissajous (macro envelope → squint_macro + regions_migrate).
   Bass tumbao = ground breath via SCALE (geometry, not brightness). Hue
   warms with u_song_progress (gold→crimson→hot-pink→wine). Kept dark so it
   doesn't pollute u_history.
2. `clave-clock` (screen) — the 2-3 rumba-clave necklace (16 sites, 5 lit)
   + sweep hand, one rev / 2-bar clave. Publishes `strike` (which voices
   fire this frame, from the clave onsets + downbeat). Faint/structural, not
   the lead. visible_phase_lock anchor.
3. `pens` (add, reads u_history) — THE LEAD. 3 coprime harmonograph pens
   (ratios shift by section), each an analytic damped-Lissajous with a
   fading tail (NS≈128 over ~1.5 clave cycles) + light u_history smear for
   glow continuity. Re-struck on consumed `strike`. drums→conga pen,
   bass→bass-pen radius, other→brass pen. Cursor perturbs pen centre/phase
   (conduct). Section machine: pen count + ratio set + damping + BLOQUE
   freeze in breakdown → slam on bass return.
4. `brass-bloom` (screen) — focal flare on `other` (mambo horn stabs) +
   `vocals` (sonero) onsets, positioned at the hottest pen lobe. Vocals'
   focal lane. ≤ flash budget; positional (moves), not a full-frame strobe
   except the one bloque slam.
5. `grain-tone` (normal) — fine warm film grain (always-on sub-beat
   shimmer), Reinhard tonemap, vignette, gamma 0.88, gentle peak chroma.

Coupling DAG: clave-clock publishes `strike`; pens consume `strike` + read
u_below(+history); brass-bloom reads u_below to find the hot lobe. Clocks:
bass (bed), clave/bar (clock sweep), 3 coprime pen freqs + drift (pens),
other/vocals (bloom), grain time (grain) → polyrhythm_of_clocks ≥3 easily.

## Three timescales of liveness
- section: gear-shift = pen ratio-set + count + palette-warmth swap; the
  bloque freeze→slam. (divergence engine across the song)
- beat/clave: pen re-strike (amplitude reset → radius grows then damps =
  geometry move), clock sweep, brass stabs. (phase-lock)
- sub-beat: warm film grain + the pens' continuous analytic motion + the
  bed hot-zone drift. (always-on floor)

## Prediction hard gate plan
- continuity ≈ 0.3 s (kinetic, 92 BPM / 0.65 s beat): pen-heads move
  smoothly along the curve; re-strike RAMPS amplitude up ~80 ms then damps
  (no teleport); clock sweep is continuous; grain is soft additive (no
  chromatic-separation static).
- divergence ≈ 18 s: continuous coprime-ratio drift (ratio_eff = r +
  0.05·sin(t/17)) reshapes the figure even within a section; 8 sections ×
  distinct vocabularies; 56 clave cycles each precessed; the bloque; cursor.
  Windows 18 s apart are categorically different figures.

## What I don't want
- A rotating gear/wheel (cirrus) or an expanding beat-ring (throb/danzas).
- A circular FFT spectrum dressed up as a clock — the clock is the clave
  geometry (Toussaint), not a spectrum; it stays faint and structural.
- Cyan/teal "Havana patina" or Miami neon-cyan — warm arc only.
- Bed bright enough to wash u_history → keep it near-black.
- A figure that retraces (periodic) → the drift LFO is mandatory.

## Open questions (resolve after first render)
- NS / render_scale balance for the gather cost (start 0.6, read FPS).
- u_history decay that gives trail-glow without static-multi-frame bake
  (start 0.88).
- Does the clave clock read as "clock" not "spectrum ring"? May need to
  shrink it / move it / make it ghostlier.
- Keyboard_synth: include 3-zone play-along (low→bass pen, mid→conga pen,
  high→brass bloom)? Default yes; cut if it over-complicates the grade.
