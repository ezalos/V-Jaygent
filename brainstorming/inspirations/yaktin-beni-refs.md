# Yaktın Beni (Beard2Beard Remix) — Visual References

Thesis: the **TB-303 acid line = a resonant standing wave swept through
resonance**, rendered as a glowing ember filament that "burns" (Yaktın Beni
= "you burned me") inside an oriental rotational-symmetry frame. Warm only:
near-black / wine / ember / amber / cream.

## The TB-303, physically (the load-bearing fact)
One VCO (sawtooth or square) → **18 dB/oct resonant low-pass filter** → VCA.
The "squelch" is the *envelope sweeping the cutoff* while **resonance**
self-emphasizes a narrow band; **accent** spikes envelope+resonance on some
steps; **slide/glide** glues notes into a vocal portamento. Visual mapping:
cutoff = a sweep parameter; resonance = how sharply energy concentrates into
one ringing band; accent = a bloom/overdrive flash; slide = eased
interpolation of the primitive's phase.
Ref: vintagesynth.com/roland/tb-303, en.wikipedia.org/wiki/Roland_TB-303.

## (a) Acid-303 as writhing resonant filament — STEAL
- **Quadratic Bézier / capsule SDF + glow**, inspirnathan — distance to a
  curve, `glow = k/dist`, accumulate warm bloom. Steal: render the bassline
  as a single time-warped segment/Bézier spine; map cutoff→curvature,
  resonance→glow tightness. inspirnathan.com/posts/65-glow-shader-in-shadertoy
  · shadertoy 3flfRX (Simple glowing SDF).

## (b) Oriental geometry / kaleidoscope frame — STEAL
- **iq "Rotational symmetry – no trig" (sljGDy)** — fold the plane into k
  angular sectors cheaply. Steal: wrap the filament in 8/10/12-fold girih
  symmetry so one serpent reads as a mandala. shadertoy.com/view/sljGDy.
- **Stampfli, "How to program fast kaleidoscopes"** — polar fold
  `φ → mod(φ, 2π/k)` + mirror; the canonical recipe.
  geometricolor.wordpress.com/2018/01/03/how-to-program-fast-kaleidoscopes/.
- **Girih tiles** (decagon/pentagon/bowtie/rhombus/hexagon, 36°-multiple
  angles) — for authentic 10-fold strapwork rather than generic kaleidoscope.
  en.wikipedia.org/wiki/Girih_tile · shadertoy 3sKSDD (Geometric Tiles #1).
- **Quasicrystal as sum of N plane waves** — `Σ cos(f·(x·cosθ_j+y·sinθ_j)+φ)`
  over N evenly-spaced angles; N=5 → 10-fold decagonal Islamic star field.
  THE girih construction in one line; freq sweep ≡ 303 cutoff re-tiling.

## (c) Fire / ember / heat-shimmer (warm) — STEAL
- **FBM fire + domain warp**, greentec — fbm intensity faded by Y, multiplied
  for bloom; octaves = crackle. Steal: `warp = fbm(p + fbm(p))` for the
  heat-shimmer carrier; palette near-black→wine→ember→amber→cream.
  greentec.github.io/shadertoy-fire-shader-en · shadertoy 3lcfWN (FBM Fire).

## Canonical phenomenon — resonance made visible
- **Chladni nodal patterns** map the 303 cutoff to nodal (n,m) so the filter
  sweep re-tiles the field through resonance. NOTE: Chladni is already
  shipped (`cymatic` + `lib/chladni.glsl`) — do NOT reuse it. We take the
  *quasicrystal/girih* construction instead (distinct visual language, same
  "resonant sweep re-tiles the field" idea).

## Sufi "I burned" motif (abstract, not literal)
Rumi's burning = the soul consumed by longing, and the **Mevlevi whirl**
turns annihilation into rotation. Translate as: continuous **rotational
symmetry that never resolves**, the ember filament orbiting a dark center —
burning *as spin*, not as flames. Pair the kaleidoscope fold (b) with slow
global rotation so the whole girih field whirls like a sema.
