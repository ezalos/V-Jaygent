# Music → shader

How audio lands in a GLSL piece. The studio runtime exposes:

```
uniform float u_audio_level;    // overall RMS, 0..1
uniform float u_audio_bass;     // 40-200 Hz mean, 0..1
uniform float u_audio_mid;      // 200-2000 Hz mean, 0..1
uniform float u_audio_high;     // 2000-8000 Hz mean, 0..1
uniform float u_audio_playing;  // 0 or 1
uniform float u_audio_time;     // seconds into the track (authoritative clock)
```

When `meta.time_source: audio`, `u_time` tracks audio.currentTime. Visual
becomes **reproducible** against the track — the same second always
looks the same. That's essential for composition.

## Rules learned from In Seven

1. **Don't bind visuals to `u_audio_*` naively.** If brightness = bass
   directly, the piece is a heart-monitor. Instead: use bands to *modulate*
   parameters of the underlying structure. Bass → glow radius, not
   overall brightness. Mid → palette phase, not colour itself. High →
   sparkle density, not direct pixels.

2. **Section state machines matter more than FFT.** `u_audio_time` is
   gold. Precompute section weights (intro / verse / sax / guitar /
   return / outro) from the track's known structure, and let those
   weights gate *which* audio reactivity applies. A piece that reacts
   the same way in every section isn't composed.

3. **Beat snap > beat follow.** Rotation that snaps to beats feels
   rhythmic; rotation that smoothly tracks `u_audio_bass` feels mushy.
   Use `floor(u_audio_time / beatDur)` for rhythmic moves and
   `smoothstep` interpolation for transitions.

4. **Flashes multiplicative, not additive.** Additive saturation on
   peaks blows out the palette. Multiplicative (`col *= 1 + flash`)
   preserves hue. Louis's "flashes a bit harsh" feedback was specifically
   about additive over-drive.

## Open question (RESOLVED 2026-04 — `u_audio_kick`/`_snare`/`_cymbal`)

Onset detection — the original pipeline only had FFT-band RMS,
smoothed in the JS `AnalyserNode`. Now: per-band onset pulses fire
when fast-window envelope exceeds slow-window baseline by a delta
threshold, decaying over a few frames. Pieces consume them as
`u_audio_kick`, `u_audio_snare`, `u_audio_cymbal`, and the composite
`u_audio_flash`. Resolved during the music-reactivity audit (commit
`8cda18c`, 2026-04).

## Beat-grid uniforms — when to use them

The 2026-05 offline analysis pipeline gives us two clocks where there
was one. `u_audio_time` is the authoritative wall clock;
`u_beat_phase` is a 0..1 sawtooth that wraps once per beat;
`u_bar_phase` does the same per bar; `u_beat_index` and `u_bar_index`
are integer counters; `u_downbeat` is a one-frame impulse on bar
boundaries. These are *clocks*. They are not the same as
`u_audio_bass` / `u_audio_kick`, which are *amplitudes*. A clock is
periodic and predictable; an amplitude is fluctuating and
energy-driven. Bind them to different things.

```glsl
// Good: bass (amplitude) modulates a continuous quantity
float pulseSpeed = 1.0 + 0.3 * u_audio_bass;

// Good: beat phase (clock) gates a discrete event
if (u_beat_phase < 0.05) doSnapFlash();   // ~25 ms at 120 BPM

// Good: beat phase animates a continuous breathing motion
vec3 col = mix(palA, palB, 0.5 + 0.5 * cos(u_beat_phase * 6.2831));

// Anti-pattern: beat phase wired straight to brightness
brightness = u_beat_phase;   // sawtooth waveform — ugly, mechanical
```

The substitution test: if you replaced the audio with silence, would
the clock-driven move still look right? It should — clocks are the
song's skeleton. Amplitudes are the song's flesh; without audio they
go to zero, and bound moves stop entirely. Use clocks for moves the
piece *needs* to keep doing; amplitudes for moves that should *die*
when the music does.

## Flash budget

A flash is any luminance event that crosses ~30% relative brightness
in <100 ms. The cap: **≤4 flashes per bar across the whole
composition, including all layers.**

The reasoning is two-tier:

- **Medical floor.** WCAG 2.3.1 and the Harding test put the
  photosensitive-epilepsy threshold at 3 flashes/second, with the
  danger band at 5-30 Hz luminance change. Four flashes per bar at
  120 BPM = 2 Hz, comfortably below medical guideline. At 80 BPM it's
  1.3 Hz; at 180 BPM (drum & bass) it's 3 Hz, right at the line —
  consider dropping to 2/bar for fast tracks.
  <https://www.w3.org/TR/UNDERSTANDING-WCAG20/seizure-does-not-violate.html>
- **Aesthetic ceiling.** Flashes overpower geometry. They're the
  loudest tool in the kit. *Spice not entree.* If every layer
  contributes its own flash on the kick, the budget is gone in one
  beat and the piece reads as strobe-with-content. Existing rule
  (above): flashes are *multiplicative*, never additive
  (`col *= 1 + flash`, not `col += flash`). The budget rule is the
  layer-count corollary.

Engine enforcement (proposed): smoke tests count visible luminance
jumps per bar across a smoke-shader pass; warn (not fail) when a
piece exceeds 4/bar. The fail shape is recognisable: every layer
"owns" the kick, screen blinks once per beat, audio band reactivity
bleeds into visual rhythm. One *named* layer owns flashes per
section; everyone else modulates.

## Per-stem binding etiquette

The 2026-05 pipeline includes `u_audio_drums_stem`,
`u_audio_bass_stem`, `u_audio_other_stem`, `u_audio_vocals_stem` —
Demucs writes these per-frame from the offline pass.
<https://github.com/facebookresearch/demucs>

**Rule: pick two stems max.** Four stems × four parameters = no
clarity. Recommended pairings:

| Pair             | Reads as                    | Best for                        |
|------------------|-----------------------------|---------------------------------|
| bass + vocals    | ground breath + focal mask  | song-form, vocal-led tracks    |
| drums + other    | kinetic accents + atmosphere| beat-driven instrumentals      |
| bass + drums     | doubled rhythm              | usually bad — both hit on kick |
| vocals + other   | focus + haze                | minimal / ambient pieces       |

**Voice roles** (lifted from Holly Herndon's PROTO staging where
vocalists get visible stage geometry distinct from the rhythm bed —
<https://www.barbican.org.uk/holly-herndon-proto>):

- **Bass stem** → ground motion. Camera scale, horizon breath,
  structural displacement. The thing the *room* does.
- **Drums stem** → kinetic accents. Snares snap a state (one-frame
  layer pop); hats glint a particle field. *Not* a bass surrogate.
  Drums punctuate; bass sustains.
- **Other stem** → atmosphere. Palette warmth nudge, haze scale, fog
  density. Often near-silent in many tracks — bind cautiously.
- **Vocals stem** → focal element. A mask shape that brightens when
  the singer enters; a glyph that appears and dissolves with the
  phrase. Never bound to global brightness — that's karaoke
  literalism.

**Anti-pattern checklist:**

- All four stems bound: stem-clutter, no voice.
- Vocals → brightness: karaoke.
- Bass + drums both → motion: redundant; both spike on the kick.
- Stems bound but ignored when silent: the parameter dies between
  vocal phrases. Pair stem RMS with a fallback (`max(stem, 0.1)`)
  or let the parameter return to a designed resting value.

## See also

- `brainstorming/techniques/music-composition.md` — song-level rules
  (sections, downbeat anchoring, pre-tension, long arcs,
  recapitulation). The composition layer above this binding layer.
- `brainstorming/techniques/layered-composition.md` — the layered-
  composition probes for multi-layer audio binding (polyrhythm of
  clocks, brightness-strobe across layers).
- `taste.md` §"VJ lenses / Interaction agency / Music probes" — the
  per-frame and song-level music probes the critic runs.

## References

- WCAG 2.0 Success Criterion 2.3.1 — Three Flashes —
  <https://www.w3.org/TR/UNDERSTANDING-WCAG20/seizure-does-not-violate.html>
- Harding test (Wikipedia) — <https://en.wikipedia.org/wiki/Harding_test>
- International Guidelines for Photosensitive Epilepsy (PMC) —
  <https://pmc.ncbi.nlm.nih.gov/articles/PMC11872230/>
- Demucs (facebookresearch) —
  <https://github.com/facebookresearch/demucs>
- Holly Herndon — PROTO at Barbican —
  <https://www.barbican.org.uk/holly-herndon-proto>
- GNU Rocket sync-tracker — <https://github.com/rocket/rocket>
- Robert Henke — Lumière interview (Ableton) —
  <https://www.ableton.com/en/blog/robert-henke-lumiere-lasers-interview/>
