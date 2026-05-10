# 14 — Mesmerism aesthetic moves: pacing, breathe, attention anchor

## summary
Hypnotic pieces aren't accurate, they're *paced*. A ferrofluid blob that
breathes slowly while spikes flicker fast and defects drift on a third
timescale gives the eye a place to land, an embroidery to read, and a
slow drift that says "this isn't a loop". This is the difference between
a screensaver and a sculpture you cannot leave.

## why_mesmerizing
Three forces, in order of importance:

1. **Attention anchor.** One persistent feature the eye comes back to
   between spikes. A central pulsing core, a mole on the body that
   precesses, a single bright tip — without it, attention scatters and
   the piece reads as "noise".
2. **Frequency separation.** Foreground motion (spikes, ripples) at
   2–8 Hz; midground (body breathe) at 0.1–0.3 Hz; background (palette
   drift, defect rotation) at 0.01–0.05 Hz. Eye samples each
   independently; brain reads "depth" rather than "busy".
3. **Unhurried decay.** When a spike pulls in, let it *finish* — don't
   reset to zero on the next downbeat. Decay constants > beat period.

Metronomic = boring. 1/f modulation on every parameter (envelope
amplitude, defect drift speed, even spike count threshold) is what
nature does and what the brain reads as "alive".

## concrete_steal
- **Anchor:** mandatory. Pick ONE: glowing core radius `r_core(t) =
  0.18 + 0.02*sin(0.3*t)`, lit even when no spikes are active. The eye
  uses it as visual home base. Never let it disappear.
- **Three timescales, hard rule:**
  - body_breathe: `0.5 + 0.5*sin(2*pi*t/10.0)` — 10s period, drives
    overall radius gain
  - spike_envelope: audio-driven, ~100–500ms decay
  - palette_drift / defect_rotation: 60–120s cycle, never aligned with
    music
- **1/f modulation on `magnetism_strength`:** sum 4–6 octaves of
  low-frequency sine with amplitudes `1/f_n`. Cheap: precompute as a
  256-tap LUT in `data/`, sample by `t * 0.05`. This breaks the
  audio→spike map from feeling like a VU meter.
- **Decay > beat:** if BPM=120 (beat=500ms), set spike decay ~600ms.
  Spikes overlap. Body never settles to flat.
- **Hold on a held note:** when audio energy is sustained > 1s, freeze
  the cursor-driven defect and let only breathe + 1/f noise remain.
  Forces the eye onto the anchor.

## glsl_path
All shaping in CPU-side uniform setup, not shader. The shader takes
`u_breathe`, `u_anchor_radius`, `u_palette_phase`, `u_lf_noise` as
floats and uses them. 1/f LUT is a `texture2D` (256×1, float), zero
per-pixel cost beyond one tap.

## caveats
- Attention anchor must not be too bright or it kills the silhouette
  reading (item 15). Warm dim core, not white hot.
- 1/f noise tuning is by ear, not formula — Louis should iterate. Too
  much = drifty / aimless; too little = metronomic.
- Frequency separation falls apart if any layer's audio reactivity
  dominates: cap audio gain on the body breathe at 10–20% of its
  natural amplitude.
- "Hold on a held note" is a section-detector behaviour, not
  per-frame. Needs the song-level analysis from `audio.analysis.json`.

## references
- [Pink noise — Wikipedia](https://en.wikipedia.org/wiki/Pink_noise) (1/f spectral density basis)
- [Eye Movement Synthesis with 1/f Pink Noise — Duchowski et al.](https://people.computing.clemson.edu/~sjoerg/docs/Duchowski15_PinkNoise.pdf) (empirical case for 1/f as natural pacing)
- [Memo Akten — Deep Meditations / artist profile (AIArtists)](https://aiartists.org/memo-akten) (custom-trajectory pacing in latent-space narrative pieces)
- [Casey Reas — Process series](https://reas.com/process) (rule-systems with deliberate slow emergence; instructions over composition)
- [Robert Hodgin (flight404) — portfolio](https://roberthodgin.com/) and [Le Random profile](https://www.lerandom.art/artists/robert-hodgin) — quote: "organic mesmerizing behavior emerging from the simplest of equations"; "designing with time, care, and uncertainty"
- [How to make generative art feel natural — Generative Hut](https://www.generativehut.com/post/how-to-make-generative-art-feel-natural) (pacing & noise tips)
- Bret Victor — "Stop Drawing Dead Fish" / "The Future of Programming" talks (attention to liveness in interactive media; widely available on vimeo.com/115154289 — verify URL before citing in slides)
