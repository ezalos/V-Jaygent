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

## Open question

Onset detection — the current pipeline only has FFT-band RMS, smoothed
in the JS `AnalyserNode`. True kick-detection (transient energy > moving
average) would let shaders react to *attacks* rather than sustained
levels. Would unlock: propagating waves triggered on each kick without
false positives from loud sustains.

Approach: on JS side, compute `u_audio_onset` by comparing the recent
level to a slower average. When instantaneous > 1.4 × average AND
`audio_time_since_last_onset > 0.15s`, emit a short (1-frame) impulse.

Nice-to-have; not urgent.
