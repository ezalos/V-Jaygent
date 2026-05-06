# break-on-through-to-the-other-side — v1 self-critique

Inspect run: `node bin/inspect.mjs break-on-through-to-the-other-side 4 12`
Frames at t=1.5s / 13.5s / 25.5s / 37.5s. Audio playing throughout (inspect
auto-clicks to unlock autoplay). Cursor near canvas centre per the inspect
sentinel caveat.

## What I see

**F00 (1.5s, section 1 — verse intro).** Warm gold/ember substrate fills
the frame. Mid-magenta veins curve through it (RD activator). Centre
shows a bright cream/cyan blob — that's the cursor halo + downbeat
ring superimposed. Sparse motes scatter. RICH coverage. Detail visible.
This is the strongest "physics" frame.

**F01 (13.5s, section 2 — chorus, kaleido ramping in).** Lavender/cream
wash dominates. Centre: pink-magenta bloom with a small dark ring
(RD spot starting to spiral around the cursor drip). Detail has
softened — the chromatic dispersion's 3-sample average is blurring
the spots into pastel mush. Kaleido strength still small at this
section_progress.

**F02 (25.5s, section 2 — chorus, deeper into).** Pink-violet wash
dominates everything. A diagonal warm streak at upper-right (an
advected RD vein). Bottom-left has gold/ember traces. Centre:
broad violet bloom from the cursor sustained drip. LOW CONTRAST.
The palette has gone milky — cream + magenta blend is averaging to
salmon-grey.

**F03 (37.5s, section 4 — long body, 12-fold kaleido).** The mandala
lands. 12-fold radial symmetry around centre, lacy outer ring of
RD-pattern detail mirrored 12 times. Bright bullseye centre
(cursor + downbeat ring). Magenta-cream wash dominates the inner
plane. STRONGEST frame compositionally — clear focal centre, clear
strata.

## Scoring (taste.md, /5)

### Mesmerizing
- eye-landing:    **4** — every frame has a clear focal centre. Bullseye
  is unavoidable in inspect (cursor sentinel) but it ALSO lands.
- prediction:     **3** — motion is there but the wash dominates so it
  doesn't surprise.
- squint:         **2** — squinted, F01/F02 read as a single pink wash
  with no structure. Only F00 and F03 hold.
- hue-drift:      **3** — palette does shift across sections but mostly
  within the magenta-cream range. Cyan never punches.
- mystery:        **3** — the cursor bullseye is too explicit; there's
  no "what is this" moment.

### Claim check
"Three coupled physics push a chaotic activator field past its saddle
point" — partially delivered. RD is visible (F00 spots, F03 lacy ring),
curl-noise advection visibly stirs it (F02 diagonal streak). Wave-field
contribution is INVISIBLE — I can't pick out any wave fronts or
prismatic dispersion from any frame. The third physics is silent
on screen.

### Cursor probes (7)
Cursor is NOT testable from inspect stills (sentinel issue). Bullseye
present in every frame but that's the cursor, working as designed. The
warm halo + RD drip path read as expected when imagined.

### Per-frame music probes
- bass:        not visibly distinguishable from stills
- mid:         not visibly distinguishable
- high:        motes are sparse — should be denser at section 4
- downbeat:    centre ring tells visible in F00, F03

### Song-level music probes (6, threshold 4)
- section-readability:    **4** — F03 is clearly different from F00
- downbeat-anchored:      **4** — centre ring lands
- pre-tension:            **2** — no visible build-up
- per-stem-discrimination: not measurable here (no stems in analysis)
- long-arc:               **3** — section 4 mandala is the obvious peak
- recapitulation:         not yet visible (no late-section frames)

### Layered coupling probes (11)
- spatial-coupling:        **4** — cursor → kaleido axis works
- polyrhythm-of-clocks:    **3** — sections + curl + RD evolve at
  different speeds; visible in F03 (mandala stable, motes drift)
- eye-distribution:        **2** — centre dominates, frame edges feel
  empty in F01/F02
- quiet-survives:          **4** — F00 (low energy) reads distinct
- order-meaningfulness:    **4** — kaleido transitions land on sections
- blend-saturation:        **2** — TOO MUCH cream lift; the u-pole's
  cream anchor (1.02, 0.94, 0.78) is making everything pastel
- coupling-cost:           not measurable, no FPS data
- brightness-strobe:       **4** — no strobe; reinhard tames flashes
- layer-distinctness:      **3** — kaleido + palette + motes visible;
  wave NOT visible
- multi-input coupling:    **4** — cursor + audio + section all show in
  the frames (couldn't test keyboard from stills)
- visible phase-lock:      **3** — section change visible in F03;
  downbeat ring visible. Bar/beat-phase rotation not reading.

### Six dimensions (/5)
- palette:        **2** — milky pastel; cyan never reaches; cream
  anchor too bright
- composition:    **4** — F03 mandala lands; F00 has good full-frame
- motion:         **? 3?** — can't tell from stills, by design
- intensity:      **2** — low contrast; reinhard squashing peaks
- depth:          **3** — strata are present but second/third tier
  blends into a wash
- form & ending:  **?** — no late-section frames in this batch

## Top fix

**Palette punch + activator visibility.** The single biggest weakness
is that the v-pole (activator → magenta/violet/cyan) only sweeps the
magenta region because v_sp * 1.6 caps around 0.48 (mod 1.0 stays in
the first half of the palette). The activator never reaches cyan,
the "other side" colour. Combined with the cream-bright u-pole
anchor and the chromatic-dispersion 3-sample average blurring RD
detail, the piece reads as one creamy wash.

Single coherent fix in `shader.frag`:

1. Boost activator scaling so cyan is reachable: `vPole(v_sp * 3.2, shift)`.
2. Lower the punch threshold so even small activator shows cyan
   bias: `w = smoothstep(0.012, 0.25, v_sp)` and bump v-pole mix
   weight from `1.4` to `1.9`, u-pole multiplier from `0.7` to `0.85`
   suppression.
3. Darker u-pole anchors: gold/ember/amber instead of gold/ember/
   cream — kill the white lift that makes everything pastel.
4. Stop re-sampling species 3× for chromatic dispersion (it averages
   detail away). Sample once for shape; offset only the output
   r/b channels by re-evaluating the palette on offset species
   samples taken under a `gradMag > threshold` gate, so dispersion
   only fires at wave fronts.
5. Pre-tonemap exposure +15%, post-gamma 0.86 instead of 0.92.

Single edit, one shader, one named weakness.

## v2 result (after applying the palette-punch fix)

Re-inspected at the same 4 timestamps. Helped, ship it.

- F00 (1.5s) — saturated warm gold/amber substrate; cyan-magenta
  arabesque RD veins with crisp contrast against the warm field.
  Activator now reaches cyan as designed.
- F01 (13.5s) — pink-violet plane with cyan-rimmed RD spirals;
  detail is back; no more pastel mush.
- F02 (25.5s) — cyan-violet RD swirl on a violet/amber complement;
  high-contrast and structurally rich.
- F03 (37.5s) — 12-fold cyan-petal mandala around a magenta core
  on a violet field. Showstopper frame.

Updated dimension scores:
- palette:     2 → **4**
- intensity:   2 → **4**
- depth:       3 → **4**
- squint:      2 → **4**
- composition: 4 → **5**

No regressions observed. Wave-field invisibility persists — defer
to /vjay-iterate.

## What I'm NOT fixing in v1

- Wave-field invisibility. Suspect the activator-modulated damping
  is too aggressive; the wave fronts hit RD spots and dissolve.
  Defer to /vjay-iterate after seeing the palette fix.
- Cursor halo dominance in inspect frames. This is the inspect
  sentinel — real users won't park cursor at canvas centre.
- 3-sample dispersion blur. Folded into the top-fix above.
