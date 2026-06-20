# yaktin-beni — Acid Arab feat. Edis, "Yaktın Beni (Beard2Beard Remix)"

source: https://open.spotify.com/track/2crJtse92ZMD6C78jK5zGX
youtube: https://www.youtube.com/watch?v=nTwKOqJMIAI
bpm: 123 · key: C# major · duration: 266s · 7 sections · stems: drums/bass/other/vocals

## Thesis
The TB-303 acid line drawn as a glowing ember filament — a serpent of fire —
writhing inside a whirling **girih** (Islamic 10-fold star) mandala. *Yaktın
Beni* = "you burned me"; Rumi's burning becomes the Mevlevi **sema** —
rotational symmetry that never resolves. The resonant filter sweep re-tiles
the oriental geometry (the quasicrystal frequency = the 303 cutoff); the
**bass IS the serpent**, the **vocal lights the antinode stars**, the **kick
pulses the symmetry**, and the mandala's symmetry-order + fracture state
changes per section so it never reads as a static kaleidoscope.

## Decision
Girih quasicrystal mandala (sum of N plane waves → k-fold Islamic star
field) + acid ember filament (segment-SDF glow spine, history light-trails)
+ heat-shimmer chaos layer + bloom/shockwave grade. Whirls continuously
(Sufi sema). Section state machine drives symmetry order + a breakdown
FRACTURE (the unpredictability insurance — a symmetric mandala alone fails
the hard gate). Warm fire palette only.

## Brief gates (vjay-new-piece §1b + §1c)
canonical_ref: "novel — girih QUASICRYSTAL interference: sum over N
  evenly-spaced angles of cos(freq·(x·cosθ_j + y·sinθ_j) + phase). N=5 →
  10-fold decagonal Islamic star tiling. Closest catalog sibling is a
  kaleidoscope-fold field, but NOT Chladni (cymatic/lib own that) and NOT
  polyrhythm wheels (cirrus/mozart). The 303 cutoff drives the plane-wave
  frequency, so the resonant sweep literally re-tiles the girih."
eye_landing_candidates:
  - whirling girih star core (the mandala / oriental identity)
  - acid ember filament writhing through it (the lead serpent)
  - kick shockwave rings expanding from centre
  - ember sparks on snare/hat transients
warm_cycle: [near-black, wine, ember, amber, cream]
idle_behaviour: "mandala slowly whirls + breathes on a synthetic clock;
  ember filament writhes on synthetic bass sin; hot-zone drifts;
  ~8s visible refresh. Fully self-plays at u_mouse==0 & audio==0."
architecture: E
arch_rationale: "audio stems + cursor + keyboard each drive different
  visual contributions, over a 7-section state machine on the audio
  timeline → §1c rule 4 → E (layer stack). Core is closed-form per pixel
  (girih fold + segment SDF), so no passes/ping-pong needed; u_history used
  only for the filament's light-trails (layer-only, allowed). Wrong
  choices: A would lose the multi-input layering + section machine that the
  default flips to; C is for state-bearing PDEs which this is not."

## Distinctness check (catalog ~65 pieces)
- Chladni → TAKEN (cymatic + lib/chladni.glsl). Avoided; using quasicrystal.
- Gray-Scott RD → ferment. Ferrofluid PDE → ferrofluid/ferrohands.
- Voronoi fracture → we-owe-no-one. Polyrhythm wheels → cirrus, mozart.
- Harmonograph → fiebre-de-amor (recent). Apollonian → apollonian-foam.
- Turkish theme exists (mozart Rondo Alla Turca) but its language is
  "Rondo recapitulation / polyrhythm wheels" — different white-space from
  Acid Arab's *oriental fusion + acid serpent*.
- girih / quasicrystal star-tiling / Islamic decagonal interference →
  UNTAKEN. That is our white space.

## Layers (bottom → top)
1. ember-ground (normal) — near-black warm substrate + a slow wandering
   hot-zone (macro brightness envelope). bass stem breathes the pool;
   song_progress warms it. cursor adds heat. publishes nothing.
2. girih-mandala (screen) — the whirling quasicrystal star field, folded to
   k-fold symmetry; antinodes glow ember/amber. ALWAYS-ON band (≥0.30) so
   the structure survives audio==0. drivers: section_id → symmetry order
   {born 4 → 8 → 10 → 12 → FRACTURE → 12 → cool}; vocals stem → antinode
   brightness; downbeat → a symmetry-snap notch (visible phase-lock);
   cursor → tilt/pan the fold centre + local brighten; key event → petal
   flash + momentary order bump.
3. heat-shimmer (replace) — domain-warped fbmRot refract of u_below; the
   CHAOS layer that breaks the perfect symmetry (unpredictability
   insurance); re-warps on section change. other stem + energy drive it.
4. acid-filament (max) — the LEAD ember serpent: segment-SDF glow spine
   folded into the mandala symmetry but writhing chaotically; u_history
   light-trails (comet tails). bass stem → writhe amplitude + glow;
   resonance (bass onset) → glow tightness; cutoff (mid/section) → spine
   curvature/phase. cursor conducts the serpent's anchor (floor-and-ceiling);
   key pluck spawns a segment. BREAKDOWN → serpent unravels free/asymmetric.
5. bloom-grain (screen→normal) — focal HDR bloom of bright antinodes +
   filament; kick → central expanding shockwave ring; snare/cymbal → ember
   sparks; Reinhard tonemap + warm grain + vignette + gamma.

## Audio bindings (stems = voice roles, not 4 modulators)
- bass stem    → the serpent's writhe + glow; ground pool breath
- drums stem   → kick shockwave ring + snare ember sparks (bloom layer)
- other stem   → heat-shimmer warp depth + antinode shimmer (oriental synth)
- vocals stem  → girih antinode brightness (Edis lights the stars)
- downbeat/bar → symmetry-snap notch + per-bar mandala swell
- section_id   → symmetry order + breakdown fracture (composition not amplitude)
- song_progress→ palette warmth climb + overall brightness arc

## What I don't want
- A static symmetric kaleidoscope (hard-gate fail). The breakdown FRACTURE
  + chaotic filament writhe + heat-shimmer are mandatory, not decoration.
- FFT bars, literal flames, a centred pulsing sphere.
- Warm-on-warm soup: ground near-black, antinodes cream — luminance carries.

## Open questions
- Does k=10/12 read as "Islamic star" or as generic kaleidoscope at render
  scale? May need to add girih strapwork lines if the interference reads mushy.
- Is the filament legible on top of the busy mandala, or does it drown? (max
  blend + bloom should rescue it; check in inspect.)
