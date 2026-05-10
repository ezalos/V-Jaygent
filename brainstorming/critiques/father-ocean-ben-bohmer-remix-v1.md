# father-ocean-ben-bohmer-remix — v1 critique

5 inspect frames @ 75s spacing across the song's 8 sections.

## What I see, frame by frame

**frame 00 — t=1.5s, section 0 (dormant intro):** three planets visible.
Lower-left = c1 with a slight cog-tooth rim; upper-right = c0 + c2 in
close screen-proximity, smooth-min-bridged (looks like one peanut blob).
Specular wedge is sharp, slightly cartoon-clock-hand. Background is
near-pure black. Rim glow is the dominant visual; the spike pattern is
barely-there but the narrow rim halo amplifies micro-perturbations into
visible 14-tooth modulation. Reads as "metallic but already a bit
spiky" rather than "smooth liquid-metal blob".

**frame 01 — t=76.5s, section 1 (build):** two planets at top + lower-
center. Spikes have grown — pronounced flame-tongue look. Specular
center is reading. Background is mostly black, faint warm haze visible.
One planet partially cut at frame edge.

**frame 02 — t=151.5s, section 2 (groove plateau):** clear DOWNBEAT
RING firing in the centre. Two planets visible (one cut at top edge).
Background has visible warm streamer texture. Composition reads as
intentional — eye lands on the ring + nearest planet.

**frame 03 — t=226.5s, end of section 2:** all three planets dramatic
with full flame-tongue spikes. Upper-left pair appears bridged (c0+c2
near in screen). Strong, visceral image.

**frame 04 — t=301.5s, section 5 PEAK:** three planets, peak intensity
spikes, visible field streamers in space behind them. Reads as the
climax. One planet again cropped at edge.

## Scores against taste.md

| Dimension       | Score | Note                                                  |
|-----------------|-------|-------------------------------------------------------|
| Palette         | 3.5   | warm-bias ✓; reads "fire" not "ferrofluid metal"      |
| Composition     | 4     | dynamic 3-planet, downbeat ring, but edge crops       |
| Motion          | 3.5   | orbits ✓, ring ✓, spike wobble ✓; tidal bridge unseen |
| Intensity       | 4.5   | the peak frames are visceral                          |
| Depth           | 3     | rim glow gives some volume; specular wedge 2D-ish     |
| Form & ending   | 3     | sec 0 → sec 5 dynamic range compressed; ending unseen |

Mesmerizing probes — eye-landing ✓, squint ✓, hue-drift OK, mystery 3,
prediction 3. Coupling probes: spatial ✓, polyrhythm ✓, multi-input
declared but inspect can't see cursor/keyboard.

## Top weaknesses

1. **Fire-sun reading rather than ferrofluid metal.** The rim glow halo
   is wide enough that planets look luminous from edge to centre instead
   of dark-with-hot-rim-only. Sachiko Kodama's whole move is silhouette
   + sodium-orange ONLY at spike tips. Currently the orange floods the
   interior.

2. **Dormant section isn't dormant.** Frame 00 already shows visible
   14-tooth modulation. The narrow rim-glow width (0.012–0.032)
   amplifies even sub-millimetre radius perturbations into stark
   bright/dark teeth. Section 3's 5s breakdown will read less as "the
   field died" because the dormant baseline is already textured.

3. **Tidal bridge never fires.** r0 = 0.34 ± 0.06 puts pair separation
   in [0.56, 0.80]. Smin-k tidal threshold is sep < 0.30. The brief's
   "ferrofluid stretches between bodies" money shot never plays.

4. **Edge-crop on c2.** c2's y-squashed ellipse (0.55 vertical scaling
   on r2=0.78) puts it at y ≈ ±0.43 — outside the [−0.5, 0.5] safe
   zone for 16:9. Periodically cut.

## Top fix (one bundled change, "make the physics legible")

The fire-sun reading and the not-dormant-dormant section are the same
underlying problem: the visual response curve compresses dynamic range
between the magnetism extremes. The tidal-bridge absence is the brief's
biggest unfulfilled promise. Bundle:

- **Replicate `sectionMag(sec, prog)` in display and gate the spike
  amp by it.** Dormant sections have sectionMag ≈ 0.05; multiplying
  this into spike amp brings dormant displacements down to the noise
  floor. Peak sections multiply by 1.55 — full Rosensweig.
- **Narrow + height-scale the rim glow.** Reduce base rimWidth from
  0.012 → 0.008 and tie its EXPANSION (not its base) to ownPhi. Reduce
  the rim glow MULTIPLIER (`0.55 + 0.85 * |ownPhi|`) so the rim no
  longer floods the interior at high field.
- **Eccentricize the inner pair.** r0 from `0.34 + 0.06*sin(ang0)` to
  `0.20 + 0.16*sin(ang0)` — periapsis = 0.04, apoapsis = 0.36. Pair
  sep range becomes [0.08, 0.72]. Tidal smin fires multiple times per
  song (every 16 bars).
- **Pull c2 in-frame.** Vertical scaling 0.55 → 0.42 keeps it within
  safe area on 16:9 even at apoapsis y_max = 0.78×0.42 = 0.33.

These four edits are 5 lines of GLSL across two files. Re-render and
inspect; if the dormant frame still shows visible 14-tooth modulation,
the rim-width tightening was insufficient and a follow-up
`/vjay-iterate` will widen rimWidth's coupling further.

## What v1 already gets right

- Three orbiting planets clearly visible in every active frame.
- Sodium-orange palette holds (warm-bias).
- Downbeat ring fires and reads cleanly.
- Field streamers visible in peak section's background.
- Spike pattern follows local field magnitude (you see it grow and
  contract across sections).
- Composition reads at squint distance; eye lands on planets.

The piece IS the brief. The fix tightens visual identity, doesn't
rebuild it.
