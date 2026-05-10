# 15 — Sachiko Kodama (Protrude/Flow + Morpho Tower)

## summary
Kodama is the canonical ferrofluid sculptor and her aesthetic discipline
is the single biggest lesson for V-Jaygent's blob: **black-on-black
silhouette, warm spec only at the tips, camera holds wide, surface
texture does the work**. Not chrome. Not blue. Not zoomed-in spectacle.

## why_mesmerizing
Kodama's pieces are mesmerising because the *silhouette* is the
performance. A wide static frame on a near-monochrome body forces the
eye to read fine surface change — moss, then teeth, then iron — as the
magnetic field modulates. The audio-reactive mapping (sound → coil
current → spike pattern) is *barely* mediated; the viewer feels the
sound become geometry. Our piece will fail the same test if we light
the blob like a chrome ball or zoom in for "epic" close-ups.

## concrete_steal
**Palette discipline (mandatory, hard rule for the piece):**
- Body: near-black with a faint warm undertone (RGB ~ `vec3(0.04, 0.025, 0.02)`).
  Never blue. Never neutral grey.
- Specular: sodium-orange / amber only at spike tips and
  highest-curvature ridges (`vec3(1.0, 0.55, 0.18)`). Tight Fresnel
  power ≥ 32; spec stays a thin rim, never fills.
- Background: black. NOT a gradient. NOT a vignette. A single warm
  practical light off-frame is the only tonal cue.

**Camera composition:**
- Hold wide. The blob occupies 35–55% of the frame, never more.
- No camera moves on the blob itself. All motion is internal. (This is
  the move that separates Kodama's work from generic "satisfying"
  ferrofluid clips.)
- Symmetry around vertical axis is a feature; gravity points down and
  the eye knows it.

**Surface texture progression (the Morpho Tower vocabulary):**
Kodama's own description names four states the same body cycles
through: *soft fluid → minute moss → spiky shark's teeth → hard iron*.
Map these to audio sections:
- `soft_fluid`: low energy, smooth body, no spikes — drumhead wobble
  only (item 13).
- `moss`: many tiny spikes (`h ~ 0.02`, density `> 200/m²`), high-freq
  amplitude.
- `shark_teeth`: classic Rosensweig spikes (`h ~ 0.15`, count 8–24),
  beat-driven.
- `iron`: rare climax — a single large spike or "tower" form on the
  vertical axis, locked to a downbeat.
A section-driven state machine on `u_section` chooses gain/threshold.

**Sound-reactivity mapping:** Kodama drives coil current from audio
amplitude; we do the equivalent on `magnetism_strength`. Critically,
*spike count* and *spike sharpness* should respond to different
audio bands (lows → count, highs → sharpness) so the body reads as a
two-parameter instrument, not a one-knob VU meter.

## glsl_path
Lighting pass only. Pre-multiply body albedo at material lookup
(constant). Spec uses a Schlick Fresnel + Blinn-Phong on a soft normal
derived from height field gradient. Cost: ~15 ops per pixel inside
silhouette, free outside.

## caveats
- Don't add cyan/teal "sci-fi" rim lights. Every concept render of
  ferrofluid online has them; they kill Kodama's discipline instantly.
- Bloom is fine on tip spec, *not* on body. A bloomed body becomes a
  glowing sphere and loses the silhouette.
- The "wide static" rule is in tension with V-Jaygent's typical
  hyperactive cursor reactivity — the cursor must perturb the *blob*,
  not the camera. Resist post-process zoom even on big drops.
- "Iron" state is a climax; if used every section it reads as
  brittle/spiky default and we're back to the failed procedural-spike
  piece.

## references
- [Sachiko Kodama — Wikipedia](https://en.wikipedia.org/wiki/Sachiko_Kodama)
- [Sachiko Kodama — Morpho Tower (artist site)](https://www.sachikokodama.com/en/works/morpho-tower/)
- [Morpho Towers — Two Standing Spirals (Kodama lab page)](http://www.kodama.hc.uec.ac.jp/spiral/)
- [Morpho Tower video on YouTube](https://www.youtube.com/watch?v=6eIcynuzg2M) — frame-dissect target #1
- [Morpho Towers / Two Standing Spirals on Vimeo](https://vimeo.com/78180852) — frame-dissect target #2
- [Dynamic Ferrofluid Sculpture — CACM](https://cacm.acm.org/research/dynamic-ferrofluid-sculpture/) (Kodama & Takeno's own technical write-up; 403 from WebFetch but accessible in browser — best primary source for coil layout & texture-name vocabulary)
- [Convergence of science and art — UEC e-Bulletin (Kodama's lab)](http://www.ru.uec.ac.jp/e-bulletin/topics/2017/three-dimensional-dynamics-of-ferrofluid-sculptures.html)
- [Sachiko Kodama — New Media Scotland](https://www.mediascot.org/lefttomyowndevices/sachikokodama)
- Neatorama / Interactive Architecture writeups corroborate the four-texture vocabulary (soft fluid → moss → shark's teeth → iron).
