# surfin-at-mazatlan

Track: "Surfin' at Mazatlan" — Rhythm Rockers. Surf-rock instrumental,
172 BPM, E major, 157s. Reverb-drenched tremolo lead guitar over a
driving surf beat.

## Brief gates (vjay-new-piece §1b + §1c)
canonical_ref: "Superposition of circular traveling waves (Huygens
  point sources / ripple-tank interference). Wave-equation solution
  h = Σ A_i·sin(k·r_i − ω·t + φ_i)/(1+r_i). Sibling in canonical-pieces:
  glass-figure is PLANE-wave quasicrystal; this is CIRCULAR point-source
  interference — distinct visual language (expanding wavefronts +
  hyperbolic nodal fringes, not infinite gratings)."
eye_landing_candidates:
  - hyperbolic nodal fringes between sources (the interference net)
  - expanding rings emitted once per bar from a central source
  - cream specular glint band — sun-on-water sparkle on steep crests
  - drifting macro sun hot-zone (golden glint wanders over the field)
warm_cycle: [near-black, wine, ember, amber, cream]
idle_behaviour: "ambient arc of 6 sources keeps oscillating on u_time;
  traveling fringes + sparkle shimmer never freeze; central source
  emits a slow ring; sun hot-zone drifts. Visible refresh < 2s."
architecture: E   # layer stack — audio + cursor + keys each drive distinct contributions
arch_rationale: "Three input channels (audio bands + cursor source +
  15 keyboard sources) all inject into one analytic wave field that
  two visible layers render. The core math is closed-form per pixel
  (no state), but the multi-input compositing is the E case. NOT C:
  the field is recomputed each frame from analytic sources, no
  ping-pong persistence needed. NOT A: A is single-shader; this is a
  5-layer stack with a publish/consume DAG."

## Thesis
A ripple tank lit at golden hour. Discrete point sources throw expanding
circular wavefronts; where they overlap, the classic interference net of
hyperbolic nodal lines shifts and breathes. Recolored as low sun glinting
off disturbed water — warm only, no teal. The music, the cursor, and the
keyboard all add wave sources to the same field: drums spawn the central
ring, the bass shortens the wavelength (calm swells → dense chop), the
cursor is a finger you drag through the water, each key plants a pitched
source so chords build standing interference.

## Canonical-name check
Superposition / interference of circular traveling waves is textbook wave
physics (Huygens' principle; ripple-tank demonstration). Analytic form
above. Not a fluid sim (no Navier-Stokes), not Gerstner ocean surface,
not Chladni/Faraday standing plate (= the shipped `cymatic`), not
plane-wave quasicrystal (= shipped `glass-figure`). No PDE-length-scale
concern: the wavelength k is an explicit parameter, not an emergent one.

## Architecture / layer DAG (E)
1. **horizon** (base, normal) — warm sunset bed: deep wine/near-black low,
   ember→amber rising, a cream sun-band whose height + glow drift slowly
   (macro brightness envelope). Reacts: audio level pulses the sun;
   section id shifts hue warmth; downbeat puffs the sun glow.
2. **wavefield** (normal, alpha:0 — INVISIBLE data layer) — sums all
   sources ONCE, writes rgba = (encoded ∇h dir, encoded height, encoded
   slope). publishes `wave`. This is where audio + cursor + keys inject:
   - 6 ambient sources on a low arc (always-on, detuned phases/freqs)
   - 1 central source emitting at the bar frequency (bpm/60/4) → one
     expanding ring per bar; amplitude gated by u_downbeat
   - cursor source at vjMouseWorld (drag = ripples)
   - 15 keyboard sources, x by key position, λ by pitch (right=shorter)
   - global λ shortened by u_audio_bass + section energy
3. **water** (consumes wave; replace) — relights/refracts u_below: troughs
   darken toward wine/near-black, crests lift toward amber; u_below
   sampled along ∇h (sunset bends across the surface). Direct extra
   reactivity: held keys warm their column; cursor leaves a bright wake.
4. **glint** (consumes wave; add) — Blinn-Phong sun sparkle from ∇h gated
   on slope+crest; tremolo shimmer (≈10 Hz, always-on sub-beat); cursor
   heat boosts nearby sparkle; u_audio_high → sparkle density. Soloable.
5. **filmgrain** (screen, low alpha) — fine grain + vignette + a brief
   warm bloom on section transitions (the "wet reverb" splash nod).

Reuse from lib/: interaction.glsl (vjMouseWorld, vjCursorHeat),
math.glsl (PI, TAU, rot2d), tonemap.glsl (reinhard), noise.glsl
(hash21 for grain). Palettes inline per piece.

Multi-input coupling: cursor + keys + audio all change `wave`, so BOTH
water and glint visibly react to all three; horizon reacts to audio +
section. Avoids the one-ripple-layer anti-pattern.

## Three time-scales of liveness
- section boundaries → wavelength + source-count + palette warmth swap;
  filmgrain bloom marks the cut. (113s body sub-phased by energy
  envelope + a slow LFO swapping dominant source group.)
- per-bar (downbeat) → central source fires a bright expanding ring.
- per-beat → global amplitude pulse (kick/snare).
- sub-beat (always-on) → tremolo shimmer on glint + ambient phase advance.

## What I don't want
- Teal/cyan water. This is a SUNSET reading; warm only.
- A single dot pulsing in the centre. Sources spread across a low arc.
- FFT bars, literal beach illustration, palm trees.
- All input handling crammed into one layer (per-layer-interactivity).
- A flat field with no macro light — horizon's drifting sun is the squint
  target (macro composition envelope).

## Open questions (resolve after first render)
- Encoding range for ∇h in rg — clamp scale vs store unit-dir+magnitude.
  Plan: store unit direction + tonemapped magnitude separately.
- Source count at peak: too many → mush; too few → readable/predictable.
  Start 6 ambient; tune.
- render_scale: ~25–40 sin/pixel in wavefield only (one sum). Start 0.6.
- Does the central bar-ring read at 172 BPM (1.39s/ring) or strobe? Tune
  k_c so the ring spacing is legible.

## Decision
Build the 5-layer stack above. Architecture E. Commit.
