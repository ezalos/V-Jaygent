# mozart-rondo-alla-turca-turkish-march

## Thesis

Mozart's *Rondo Alla Turca* (3rd mvt, Piano Sonata No. 11, K. 331) rendered as
an **illuminated Ottoman rosette**: a central 8-fold star + a polyrhythm of
outer tooth-wheels that snap into a recognisable pose on every section flip
(rondo refrain) and drift apart through the episodes. The right-hand
ornamental triplet runs spark **petal blooms** at the star's tips; the
left-hand march bass pulses the whole thing on every downbeat. Janissary
percussion as light, not literal.

Rondo form means **recapitulation is the structural truth** — the visuals
must visibly RETURN. That's the claim.

## Brief gates (vjay-new-piece §1b + §1c)

```yaml
canonical_ref: cirrus            # coprime polyrhythm wheels + section state machine
                                  # plus an ottoman-8-fold central star (girih construction:
                                  # two 45°-rotated squares as SDF intersection)
eye_landing_candidates:
  - central 8-pointed Ottoman star — pulses on every downbeat,
    rotates one revolution per bar, palette flips per section
  - outer ring of coprime tooth-wheels (7/11/13/17 teeth) at
    radii 0.20/0.30/0.40/0.50 — each on its own clock
  - petal-tip blooms — short-decay flares at the star's 8 tips,
    triggered by u_audio_high (right-hand ornaments) + held keys
  - section-edge halo — at every section flip the rosette
    visibly snaps and a warm-cream wash brightens the field
warm_cycle: [near-black, ember, wine, amber, cream]
                                  # Ottoman court palette under candlelight;
                                  # NO cobalt-blue Iznik intrusion (warm-only rule)
idle_behaviour: |
  Tooth wheels rotate slowly on time-driven clocks. Central star
  breathes (sin(time*0.5)). Haze drifts. Even with no audio and
  u_mouse=(0,0), the piece reads as alive — frame-0 already shows
  the 8-pointed star + at least 3 of the 4 outer rings.
architecture: E                   # layer-stack with multi-input coupling
arch_rationale: |
  Audio + cursor + keyboard all drive different visual
  contributions, AND a section state machine over the audio
  timeline (8 detected sections, rondo recapitulation). Architecture
  E (layer stack) is exactly the case the decision tree calls for.
  Wrong choices: A (monolithic) couldn't hold the polyrhythm cleanly
  + would lose layer-distinctness on solo; C (ping-pong) — no
  state-bearing physics; D (density volume) — geometry is hard-edged
  star + tooth-wheels, not a sub-pixel particle aggregate; B (CPU
  sim) — no discrete agents, just continuous fields.
```

## The track

- Mozart, *Rondo Alla Turca* (Allegretto, 3rd mvt, K. 331).
- 211.8s, 123 BPM (analyzer), A major (with the famous A minor refrain).
- 8 sections detected by `bin/analyze-audio.mjs`. 94 downbeats. 375 beats.
- Section structure (analyzer):
  - 0–5s: silence / pickup
  - 5–31s: Theme A (the famous staccato refrain)
  - 31–98s: extended development / episode 1
  - 98–113s: brief return
  - 113–143s: episode 2 (more elaborate)
  - 143–188s: climactic central section (A major peak)
  - 188–194s: cadenza-like transition
  - 194–212s: coda + ending

## Layer stack (decision)

Six layers, bottom → top:

1. **`solid-warm`** (global) — warm vertical gradient. No inputs.
   Keeps the field warm-anchored even when other layers go dark.
2. **`haze-drift`** (piece-local) — slow domain-warped FBM, drifts on
   `u_section_progress`; mid-band warps the field. Screen-blended.
   Adds the candlelit-court atmospheric haze.
3. **`ottoman-star`** (piece-local) — THE FOCAL ELEMENT. 8-pointed
   star (intersection of two 45°-rotated squares, per girih
   construction). Bar-phase rotation, downbeat scale impulse,
   palette flips per `u_section_id` (alternates A-major gold ↔
   A-minor ember-red). Reads `u_below` for radial refraction at
   star tips. Replace blend.
4. **`coprime-wheels-turca`** (piece-local) — 4 outer rings at
   coprime tooth counts 7/11/13/17, radii 0.20/0.30/0.40/0.50.
   Each ring on its own clock (bar-phase / section-progress /
   beat-phase / mid-driven). Cursor wind bows ring radii in
   cursor azimuth. Section-flip snaps all rings to angle 0.
   Max blend.
5. **`triplet-bloom`** (piece-local) — fast-decay petal flares
   at the 8 star tips, fired by `u_audio_high` (right-hand
   triplet ornaments). Each held key adds a bloom at its
   key-angle slot. Screen blend.
6. **`vignette-grain`** (piece-local) — warm vignette + 1/f film
   grain modulated by `u_audio_high`. Reads `u_below`. Replace.

Distinct clocks across layers (polyrhythm-of-clocks probe):
`u_time`, `u_bar_phase`, `u_beat_phase`, `u_section_progress`,
`u_section_id`, `u_downbeat`, `u_to_section_change`, `u_audio_high`,
`u_audio_mid`, `u_audio_bass`, `u_mouse`, `u_keys[15]` — twelve
distinct sources across six layers. Pass.

## Audio bindings (PASS-shape only)

| Driver                  | Visual effect                                          |
|-------------------------|--------------------------------------------------------|
| `u_audio_bass`          | star scale impulse (radius), ring-radius pulse        |
| `u_audio_mid`           | tooth-wheel rotation rate (ring 3, 13 teeth)          |
| `u_audio_high`          | petal-bloom intensity at star tips                    |
| `u_downbeat`            | star scale impulse + bar-aligned rotation snap        |
| `u_bar_phase`           | star rotation (one revolution / bar)                  |
| `u_section_id`          | star palette flip (gold ↔ ember-red), star fold count |
| `u_section_progress`    | tooth-wheel ring rotation (ring 1, 11 teeth)          |
| `u_to_section_change`   | pre-tension squeeze on star + ring-radius compression |
| `u_song_progress`       | overall warm palette ramp                             |

All geometric — no `bass→glow` or amplitude-only bindings.

## Cursor (disjoint from audio)

Cursor `u_mouse` drives a **wind azimuth + magnitude** that bows the
outer rings in the cursor's direction (faster rings bow more, so the
wind ripples visibly inward). Cursor does NOT touch the central star
(audio's dominion) — disjoint mapping per `audio-cursor-together.md`
Pattern B. Idle (mouse at 0,0) → no wind. Star + rings still alive
on time-driven clocks.

## Keyboard (15-key piano, optional)

Each key adds a bloom at a fixed angular slot at the star's outer
edge. Per-key-distinctness: key index → angle slot, ring index =
`key % 4`. Held keys sustain a glow at their slot; press fires a
brighter bloom + a momentary tooth on the corresponding ring. The
viewer can play counter-melodies over Mozart.

## What I don't want

- Generic FFT bars or spectral arcs. Mozart deserves better than
  visualiser line art.
- Literal jannisary instruments (drums, cymbals) or Topkapı palace
  imagery. Respond to the *structure* — rondo form, meter, palette
  modulation between major and minor — not the title-cultural
  iconography.
- Pulsing-circle hub bloom. The central element MUST be a hard-edged
  8-pointed star (the cultural signature of the piece's title), not
  a soft glow.
- Cool intrusions. Cobalt-blue is the canonical Iznik-tile colour
  but it violates VISION. Read the period in candlelight: gilded
  brass, ember-red velvet, near-black shadows.
- Bass-on-brightness bindings. Bass moves geometry (radii, rotation
  snap), never just glow.

## Open questions

- Does the 8-fold central star + 4 outer rings + petal blooms
  overlap-saturate into cream soup at the climax? If yes,
  `triplet-bloom` is the candidate to dim — its peak amplitude is
  most contestable.
- The analyzer reports A major (key confidence 0.95) but the famous
  refrain is A minor. The `u_key_*` uniforms expose what the
  analyzer thinks — just gentle palette tinting, not a hard
  major/minor flip in the piece.
- Cursor wind on outer rings: does it conflict with `u_section_id`-
  driven snap? Both touch ring radii. The mediator: snap takes
  ~0.3s, cursor wind is constant — they're floor/ceiling not
  additive.

## Iteration 2 (2026-05-12) — architecture rebuild

V1 layer-stack hit `structural-rethink` (see `mozart-...-march-v2.md`
+ `mozart-...-march-blocked.md`). Six warm-cycle layers compressed
into uniform mid-warm beige with < 0.15 luminance contrast — the
geometry rendered correctly but read as ambient texture, not figure.

Per Louis's call, doing **option 2 + option 3 combined**:
**rebuild as monolithic (architecture A) AND reframe into the throb
family.** Same slug, same audio, same title. Throws away the girih
thesis; delivers the Turkish March as **percussion-as-light**.

### Brief gates (revised)

```yaml
canonical_ref: throb              # percussion-driven geometry — kick→ring,
                                   # cymbal→sparks, snare→rotating cross
eye_landing_candidates:
  - 8-arm rotating cross at center — bar-phase rotation, downbeat
    scale impulse, palette per section
  - cream beat ring expanding from center on every beat
  - cream bar ring on every downbeat (bigger, brighter)
  - 8 cream sparks at angular slots, hash-fired per beat,
    amplitude = right-hand triplet cymbal/high band
warm_cycle: [near-black, deep-ember, ember, amber, cream]
                                   # Caravaggio-tight: ground L<0.05,
                                   # geometry cream L>0.85, no mid-tones
idle_behaviour: |
  Cross still rotates on time-driven clock. Synthetic kick at
  beat_phase fires the beat ring even with no audio. Ground
  ember radial gradient is always there. Frame-0 reads as
  centred cream cross on dim ember ground.
architecture: A                   # monolithic single-shader — full
                                   # control of contrast without
                                   # layer-stack blend compression
arch_rationale: |
  Layer-stack architecture E (v1) was the wrong choice — six
  same-warm-family layers compressed into uniform beige mush
  per the Phase 2 critique. Architecture A gives per-pixel
  control of figure/ground luminance: ground at L<0.05, cream
  geometry at L>0.85, ZERO mid-tones. Closest sibling: throb
  (per-band transient onsets paint distinct geometry on
  near-black ground). Multi-input (cursor + keyboard + audio
  + section state) all live in the one shader; section state
  machine drives the cross palette flip + snap.
```

### What's preserved from v1

- The audio analysis JSON (sections, beats, downbeats, key)
- The thesis of "rondo recapitulation made visible" — section
  flips snap the cross back to angle 0 + post-flash
- Multi-input richness (cursor + keys + audio + section state)
- The polyrhythm of clocks (10+ distinct sources)

### What's thrown away

- The girih star (replaced by 8-arm cross — simpler, brighter,
  reads at distance)
- The four coprime tooth-wheels (replaced by per-beat rings —
  same polyrhythm idea, but expanding outward instead of
  rotating in place)
- The haze layer (gone — was part of the v1 contrast collapse)
- The layer stack itself (gone — single shader replaces it)
- The triplet-bloom petal-tip layer (replaced by hash-fired
  spark slots — cleaner, faster decay, more visible)
