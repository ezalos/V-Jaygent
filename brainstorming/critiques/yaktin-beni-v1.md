# yaktin-beni — v1 critique

Piece: Acid Arab feat. Edis — "Yaktın Beni (Beard2Beard Remix)"
Thesis: TB-303 ember serpent in a whirling girih (Islamic-star) mandala;
"you burned me" as a Sufi sema. Architecture E, 5 piece-local layers.

## Render method
`bin/inspect-music.mjs yaktin-beni --times 5,35,68,99,138,200,259
--clip-times 95,138,200` — one still per section midpoint + clips at peak-1,
breakdown, long-peak. render_scale 0.7, time_source audio, all 4 stems.

## v1.0 (first render) — observations
- Per-section vocabulary DIFFERS across the 7 sections: 4-fold dot grid
  (intro) -> radiating star (build/rise) -> bright spoked core (peak-1) ->
  asymmetric fracture web (breakdown) -> 12-fold rosette (long-peak/outro).
  The breakdown FRACTURE reads as a genuinely different mode. Unpredictability
  gate's "three windows, different event vocabularies" → looks satisfied.
- Eye-landing: the central whirling star/serpent core lands immediately.
- Three faults found:
  1. PALETTE VIOLATION — filament arms read olive-green at medium glow. Root
     cause: `max(hist - below, 0)` channel subtraction (warm below has low
     G/B → green residual trail). Fix: recolour trail by luminance, warm.
  2. ARC INVERTED — the outro (t=259) was the brightest, most-bloomed frame;
     it must cool to near-black. Fix: outro fade in mandala + filament.
  3. GIRIH IDENTITY WEAK — background read as a square dot-grid (pure 4-fold
     quasicrystal = egg-carton). Fix: min 6-fold, sharper antinodes, stronger
     thin strapwork lines, harder edge fade (focal mandala not wall grid).
  Plus: a double-screen bug (manual blend_screen + blend:screen) over-
  brightened the mandala — fixed (output own light, let engine screen).

## v1.1 (post-fix render) — verdict: SHIP v1, hand to Louis for redlines
All three faults + the double-screen resolved:
- Palette: filament arms now ember-red -> amber (was olive). Fully warm:
  ember-red serpent, gold/cream antinode cores, wine ground, near-black edges.
- Arc: outro cools (mandala + filament fade past song_progress 0.93).
- Girih identity: min 6-fold + animated vnoise twinkle breaks the uniform
  antinode lattice into scattered embers + a girih ring-network. Reads as a
  whirling sema mandala at full clip res (the inspect thumbnails under-sell it).

Probe read (from stills + 3 clips + 2 cursor frames):
- mesmerizing / eye-landing: central serpent-star lands instantly. PASS.
- prediction (hard gate): 7 sections show different event vocabularies
  (6-fold birth -> radiating star -> spoked core -> asymmetric FRACTURE web ->
  12-fold rosette -> cooling); breakdown is a distinct mode. PASS.
- motion/liveness: long-peak clip writhes + rotates dramatically over 2.5s
  (faint 12-arm spiral -> bold cream pinwheel). Stills under-grade it. PASS.
- cursor: TL vs BR cursor frames differ clearly — pans/tilts the fold + drags
  the serpent anchor + heat. PASS.
- music phase-lock: downbeat snap-notch + per-beat shockwave ring + per-section
  symmetry order. Wired; verify the snap legibility on a full watch.
- palette/warm: PASS.

## Lint gate (run post-fix)
- lint-palette: PASS — 0.00% cool-zone (warm-only confirmed; green fix held).
- lint-idle: PASS — mean lum 0.154 (floor 0.03), motion 0.076 (floor 0.025).
- lint-composition: PASS — quadrants 24/25/26/25% (radial mandala, no Y-split).
- lint-seams: FAIL (1 frame, music-01-t35, col 845, dim zone lum 0.19).
  OVERRIDE: the piece has NO bounding-box early-out (the class lint-seams is
  built for — code-reviewed all 5 layers; only conditionals are a temporal
  spark gate + the u_below empty-fallback). The flagged column is the
  shockwave ring's near-vertical tangent / the quasiperiodic antinode
  lattice read as a straight step — a metric misfire on radial geometry,
  same family as the documented zoom-tunnel / kuramoto overrides. Not a real
  seam. Re-confirm on Louis's watch; revisit the spark-cell floor() grid if a
  real vertical edge shows up live.

## Known soft spots for Louis's watchthrough redlines:
1. Background antinodes: better as twinkling embers but still slightly grid-ish
   at some instants; could promote the strapwork star-polygon network so it
   reads unambiguously "Islamic girih" rather than "dot field".
2. Long-peak (the 95s climax) intensity tracks instantaneous stem RMS; consider
   a section-level brightness floor so the climax is reliably the hottest.
3. Keyboard synth wired (mandala petal-flash + serpent energise) but unverified
   headless — needs a live key test.
4. Outro could cool harder / earlier for a clearer "embers die" ending.

