## summary

What turns "spiky thing" into "ferrofluid" is not better spikes — it's
multiple coexisting timescales on the same surface. A real ferrofluid
breathes slowly, erupts fast, drifts slower than either, and shimmers
faster than any of those. Build the height field as an additive stack
of motions at 0.3 / 2 / 10 / 30 Hz, and bind each band to a different
audio feature.

## why_mesmerizing

The eye samples a moving surface at every glance length — saccades
(~30 Hz), tracking (~10 Hz), attention shifts (~2 Hz), gaze loops
(~0.3 Hz). A surface that's alive at every one of those scales never
"settles" — the eye keeps finding new motion no matter the dwell
length. This is the same principle behind why rain reads as rain
(droplet, ripple, sheet, weather) and lava lamps as alive (bubble,
column, flow, drift). Music coupling makes each band agentic: the
kick owns the eruption, the bass owns the breath, the song-section
owns the drift, the hi-hat owns the shimmer.

## concrete_steal

Stack four bands additively into the height field; bind each to a
distinct audio feature:

```glsl
// All u_* uniforms come from V-Jaygent's audio analyser.
float h_drift   = fbm(p * 0.6  + 0.3 * t) * u_section;     // 0.3 Hz, structure
float h_breath  = sin(2.0 * TAU * t + fbm(p)) * u_bassRMS; // 2 Hz, bass
float h_erupt   = pow(u_kickEnv, 2.0) * spikeBasis(p, 10.0 * t); // 10 Hz, kicks
float h_jitter  = 0.02 * (noise(p * 8.0 + 30.0 * t) * u_hatRMS); // 30 Hz, hats

float h = 0.40 * h_drift
        + 0.30 * h_breath
        + 0.40 * h_erupt
        + 0.10 * h_jitter;
```

Rules: amplitudes go inverse to frequency (slow stuff is biggest),
faster bands ride on top of slower ones (jitter modulates spike tips,
not the whole blob). The mapping audio→band is the work of the piece —
get the bindings right and the surface comes alive even before
shading.

Single-shader cost is ~1 fbm + 1 sin + 1 pow + 1 noise per pixel:
fits in a fragment-shader budget at 1080p.

## glsl_path

Runs in the height-field pass, before normals are computed. Each band
is independent → trivially parallel. fbm at 4 octaves dominates cost
(~16 noise lookups); cache `fbm(p)` if reused for displacement
direction. Drive the audio uniforms from V-Jaygent's audio analyser
JSON (per `using-lib.md`) — kick env, bass RMS, hat RMS, section index
are all already computed.

## caveats

- All bands at full amplitude = mush. Mix them, don't sum them; the
  amplitudes above are tuned for visible band-separation.
- Wrong audio→band mapping is worse than no mapping. Hi-hat on the
  slow drift looks broken; bass on the jitter looks dead. Test by
  muting one band at a time and checking that what disappears is
  what you'd expect.
- "Visible phase-lock" (V-Jaygent feedback) means at least one band
  must move geometry on the downbeat — bind h_breath or h_erupt to a
  beat-quantised feature, not just continuous RMS.
- The 30 Hz jitter aliases on 60 Hz monitors unless you anti-alias in
  amplitude (fade as `min(1, 60/30 * dt)`) or just clamp it small.
- "Too alive" reads as noise; if the silhouette never holds for >0.3 s
  the eye can't anchor. Keep h_drift slow enough to give the eye a
  place to land between events.

## references

- Memo Akten, "Forms" (with Quayola, 2012) — multi-layer extrapolation
  with 2–4 motion layers and 1–3 abstraction layers, Prix Ars Golden
  Nica: https://www.memo.tv/works/forms/
- Memo Akten, "Waves" series — explicit work across temporal scales
  (ocean / sound / quantum / geological): https://www.memo.tv/
- Tyler Hobbs, "Flow Fields" — multi-scale Perlin features and the
  case for layering distortions: https://www.tylerxhobbs.com/words/flow-fields
- Tyler Hobbs, "Fidenza" (flow-field polyrhythm in practice):
  https://tylerxhobbs.com/fidenza
- Wang et al., "Musical Interfaces: Visualization and Reconstruction
  of Music with a Microfluidic Two-Phase Flow", Sci. Rep. 2014 — real
  fluid surface as multi-band music readout:
  https://www.nature.com/articles/srep06675
- V-Jaygent local: `brainstorming/techniques/polyrhythmic-motion.md`,
  `music-to-shader.md`, `audio-cursor-together.md`.
