# cirrus — nested zoetrope of coprime-tooth wheels

## Decision

**Form:** layer-stack, multi-input. Concentric rings, each ring is a
wheel of N teeth where N runs through coprime primes (5, 7, 11, 13,
17). Each ring rotates at a different rate tied to a different clock
in Bonobo's *Cirrus*; the moments where teeth from adjacent rings
align with the radial axis are the visual hooks. Audio drives the
rotation rates and palette; cursor acts as a "wind" that bends the
wheels off-axis (radial perturbation that ripples inward); keyboard
keys momentarily insert glowing teeth into specific rings —
asymmetries that take a few seconds to grind back to symmetry.

## Thesis

Polyrhythm made visible. Bonobo's *Cirrus* is built from short
hocketed loops at slightly different periods that drift into and
out of phase; the piece renders the same phenomenon as wheels at
coprime tooth counts. The whole thesis is in the *almost-but-not-
quite alignment*: the eye keeps predicting the next click and never
fully gets there.

## Track

Bonobo — *Cirrus* (The North Borders, 2013). ~5:09. Sections: lone
intro pulse, melody figures enter, drop with bass and snare, climb,
peak with all stems hocketed together, decompose / outro. The drop
is around 1:00, peak around 3:30, fade-out around 4:40.

## Canonical-name check

The thesis is geometric, not algorithmic. There is no Wikipedia
"Reynolds boids"-style canonical algorithm I'm reinterpreting. The
nearest reference is the **zoetrope / praxinoscope** (Reynaud,
1877): a cylinder of cyclic images viewed through a slit; only at
the moments where the slit aligns with a frame edge does a coherent
image appear. The math is **periodic alignment of coprime
rotations**: N wheels with tooth counts P_i rotating at speeds
ω_i; alignment to a fixed radial axis happens at periods 2π/(P_i ω_i),
and *all* wheels align simultaneously at LCM(2π/(P_i ω_i)). With
coprime primes the LCM is huge — practically the whole song's
duration — so genuine total-alignment is the once-per-piece climax,
and partial pairwise alignments are the per-bar hooks.

This is not a "closed brief" in the canonical-algorithm-brief sense
(brief was "song of your choice"), so the multi-layer + multi-input
default applies.

## Form candidates considered (rejected)

1. **Single shader with all rings drawn together.** Rejected. The
   layered-default memory is explicit; single-shader monolithic
   pieces read as boring next to multi-layer ones, and rings + wind
   + glowing teeth + base want to live on independent clocks at
   independent grain.

2. **Multi-pass ping-pong (`passes:`) with state-bearing rings.**
   Rejected. Rings are pure geometry — sin/cos of bar phase + tooth
   phase, no integration, no diffusion. Stateful pass would be
   invented complexity. Layer-stack is enough.

3. **Hyperbolic / non-Euclidean ring layout.** Tempting (hyperbolic
   tilings is on VISION's open-questions list), but the piece's
   thesis is *temporal* alignment, not spatial curvature. Save the
   hyperbolic piece for a track that asks for it.

## Layer DAG (chosen)

Bottom → top:

1. **`solid-warm`** — global. Gradient base. No inputs. Sets the
   warm palette floor (gold → wine vertical).

2. **piece-local `haze-drift`** — slow domain-warped fbm haze
   above the base, drifting on `u_section_progress`. Mid-frequency
   grain. Audio: `u_audio_mid_stem` warps the field sparsely (≤5%
   distortion). Publishes nothing; reads `u_below`. Strata role:
   bass / ground.

3. **piece-local `coprime-wheels`** — the heart of the piece. Five
   concentric rings at radii r_i, each with P_i teeth rotating at
   ω_i. Tooth counts: 5, 7, 11, 13, 17 (all coprime). Rotation
   sources (one clock per ring):
   - r_0 (P=5):  `u_bar_phase` — slowest, advances one tooth per
     bar.
   - r_1 (P=7):  `u_section_progress` × constant — meta-slow drift
     across the section.
   - r_2 (P=11): `u_beat_phase` × 2 — beat-locked; visibly snaps
     each beat.
   - r_3 (P=13): `u_audio_mid_stem` integrated — bass-stem-driven
     speed, geometric (PASS shape: rotation rate, not brightness).
   - r_4 (P=17): `u_time` × constant + `u_audio_high_stem` jitter —
     fastest, transient-perturbed.

   Audio: rotation rates only (PASS shapes from music-probe 1,
   geometric not brightness). Reads `u_below` for refractive
   sampling — wheels distort the haze beneath where their teeth
   intersect. Cursor: a radial wind — `u_mouse` sets a perturbation
   azimuth; teeth near that azimuth bow outward briefly. Keyboard:
   pressing key i adds a momentary glowing tooth at angle i × 24°
   on ring (i % 5); the tooth decays over ~2 s. Strata role: lead.

4. **piece-local `hub-bloom`** — central pulsing bloom at origin.
   Pulses on `u_downbeat` and inflates on `u_to_section_change`.
   Mask-driven reveal of the wheels behind via screen-blend.
   Reads `u_below`. Strata role: focus / fill.

5. **`key-rays`** (global, reuse) — 15 radial beams from origin,
   sustained on held keys, fired on press. Provides the keyboard's
   visible signature beyond the per-tooth glow on the wheels.
   Strata role: high-frequency accent / fill.

6. **piece-local `vignette-grain`** — top post-process: warm
   vignette + 1/f film-grain noise modulated faintly by
   `u_audio_high`. Reads `u_below`. Strata role: post.

Coupling DAG edges (each `u_below` read = 1, `consume` = 1,
`u_history` = 0.5):

- `haze-drift` → `u_below` from `solid-warm`: 1
- `coprime-wheels` → `u_below` from haze: 1
- `hub-bloom` → `u_below` from wheels: 1
- `vignette-grain` → `u_below` from everything: 1
- (no shared `publish/consume` channels — coupling is via `u_below`
  cascade, not a force field. The piece is geometry, not physics.)

Total: 4 edges across 6 layers = 0.67 edges/N. That's at the low
end of the 1.0–1.5 sweet spot per layered-composition probe 7
(coupling-cost). Acceptable: this is a geometry piece, not a
physics piece. If the v1 critique flags coupling as too sparse,
the fix is to publish a `tooth-alignment` mask from `coprime-wheels`
and have `hub-bloom` consume it (so the central bloom brightens
*only* when N≥2 rings align radially — which is exactly the
piece's thesis). Hold this as the iteration-1 lever if needed.

## Polyrhythm of clocks (probe 2)

Distinct clocks across the 6 layers:

1. `solid-warm` — `u_song_progress` (palette ramp, slow).
2. `haze-drift` — `u_section_progress` + `u_audio_mid_stem`.
3. `coprime-wheels` — `u_bar_phase`, `u_section_progress`,
   `u_beat_phase`, `u_audio_mid_stem`, `u_audio_high_stem`,
   `u_time`, `u_mouse`, `u_keys[]` — *seven* distinct clock sources
   on this single layer (one per ring + cursor + keys). The probe's
   threshold is ≥3 across ≤4 layers; we have ≥5 across 6 layers,
   easy pass.
4. `hub-bloom` — `u_downbeat`, `u_to_section_change`.
5. `key-rays` — `u_keys[]`, `u_key_event[]`.
6. `vignette-grain` — `u_audio_high`, hash on `gl_FragCoord`.

## Multi-input coupling (probe 10)

Three input channels, each with a load-bearing role:

- **Cursor** — wind that perturbs ring 4 (fastest) most strongly,
  ring 0 (slowest) least; viewer sees the wind ripple inward.
- **Keyboard** — momentary glowing teeth on per-key rings; key-rays
  beams; hub-bloom inflation on any held key.
- **Audio** — rotation rates (geometry, not brightness), section
  transitions (palette + hub bloom), bass kick (downbeat ring
  pulses).

## What I don't want

- **Wheels-on-flat-disc.** No literal "watch face" or "clock"
  illustration. Rings should be implied by the tooth array, not by
  drawn rim circles. The eye finds the rings from the tooth pattern,
  not from explicit circular outlines.
- **Audio-on-brightness.** Every audio binding stays geometric
  (rotation, scale, position). The brightness-strobe probe must
  pass: ≤1 layer with audio-on-brightness, and even then the
  brightness mod is ≤30% of the layer's static brightness.
- **Synchronised clocks.** The whole point is that the rings drift.
  Default-Cartesian-iTime on every ring would invalidate the
  thesis.
- **Cream soup.** Six warm layers — must use `screen` / `max` /
  `multiply` (not `add`) above the base, and the per-layer alpha
  budget needs auditing if blend-saturation probe fails.
- **Loop with no end.** The outro should *resolve* — most rings
  slowing to a stop or fading, with one ring continuing for a final
  half-cycle, then fade to warm black on `u_song_progress > 0.97`.

## Open questions (resolve at v1 inspect)

- Do five rings read as five distinct clocks, or do they merge
  visually into a soup of teeth? Probe via inspect frames at peak.
  Mitigation if mushy: drop ring count to 4 (5/7/11/13) and widen
  ring spacing.
- Is the cursor wind perceptible at the v1 sanity render? `inspect.mjs`
  parks `u_mouse` near canvas centre (per memory entry
  `inspect_cursor_sentinel`), so frames will *include* cursor effects
  — the wind should be visible in the inspect output, not hidden.
- Does the hub-bloom compete with the wheels for the eye's centre, or
  does it *centre* the composition? If competing, demote to fill
  (lower brightness, slower bloom rate).
- Track length is ~309s. inspect.mjs interval should be `frames=5
  intervalSec=60` so 5×60=300s ≥ 0.7×309=216s — comfortable
  coverage.

## Render scale

The wheels do per-pixel iteration over 5 rings × ~17 teeth = ~85
sin/cos lookups per pixel, plus haze fbm and hub bloom. Conservative
target: `render_scale: 0.65`. Tighten to 0.55 if FPS is low at
v1 inspect.
