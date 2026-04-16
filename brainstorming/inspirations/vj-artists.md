# VJ artists — specific techniques to steal

Curated list with the **single move** I'd steal from each. Not a history
lesson; a tactical reference for when I'm stuck.

## Ryoji Ikeda — 1-bit data rendering
Hard `step()` thresholds, no antialiasing, barcode patterns synced across
screens. Each pixel is a function of audio bin or a hash, quantized to
{0, 1}. Breaks my warm-only rule brutally — pure black and white — but
that's the point for him; for me, I'd try 1-bit black + amber.
- <https://www.ryojiikeda.com/project/testpattern/>
- Steal: clean 1-bit quantization on one layer of a composition.

## Carsten Nicolai / Alva Noto — pulse-grid synaesthesia
Whole grids of analytic rectangles pulsing at one synchronized frequency.
Almost no variation — the composition is the rhythm.
- <https://futurium.de/en/blog/a-alpha-pulse-futurium-berlin>
- Steal: a very sparse grid with global `sin(t · rate)` pulse.

## Robert Hodgin (Flight404) — sound-reactive curl-noise flow
iTunes Visualizer. Magnetosphere. Curl-noise particle fields with trails.
Requires ping-pong trails for the authentic look.
- <https://roberthodgin.com/>
- Steal: a domain-warped fbm layer with velocity = curl of the field.

## Memo Akten — silhouette-gated generative foreground
Body-tracked layers: the silhouette of a dancer becomes the mask for a
generative field that fills only the dancer. No body-tracking here — but
an analytic moving SDF shape can play the same role.
- <https://www.memo.tv/>
- Steal: layer C's mask moves, and the generative content inside the mask
  is more volatile than what's around it.

## Casey Reas — "Process" (rule-based overlap)
Each element follows a simple behaviour; their accumulation IS the piece.
- <https://reas.com/process>
- Steal: resist authoring composition; write a few rules that interact.

## Joshua Davis — stochastic geometric collage
9,825-line Processing pieces built from infinite non-repeating seeded
shapes at random transforms. "Print Paradox" and V01D.
- <https://joshuadavis.com/>
- Steal: N analytic shapes, each with a hash-driven transform per frame.

## Raven Kwok — literal recursion
Hexagons split into scaled self-copies, fixed-depth.
- <http://ravenkwok.com/about/>
- Steal: one layer is a 4-deep recursion of a single SDF — affine transform
  each level.

## UVA & 1024 Architecture — architectural projection
Imply a substrate geometry; every layer respects it.
- <https://www.uva.co.uk>
- Steal: a thin constant "grid-of-the-building" layer at 5% opacity so
  everything else has a latent architecture to sit on.

## Rosa Menkman — datamoshing / DCT block glitch
Deliberately corrupt video: keyframe-delete so motion vectors bleed.
- <http://rosa-menkman.blogspot.com/2009/02/how-to-datamoshing-create-compression.html>
- Steal: an 8×8 block quantize of UV, each block offset by a
  pseudo-motion-vector — an entire layer of "broken video".

## Beeple — cadence over trick
Daily render discipline since 2007. Not a technique, a practice.
- <https://www.beeple-crap.com/everydays>
- Steal: commit to a piece per N days regardless of whether each is good.

## Scott Draves — fractal flames
IFS with nonlinear "variations", log-density display. True version needs
histogram accumulation (multi-pass).
- <https://flam3.com/flame_draves.pdf>
- Steal (later, when I have multi-pass): the variation library.
