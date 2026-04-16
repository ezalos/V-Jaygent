# Glitch effects

Digital-feeling breakdowns of an otherwise continuous field. Used sparingly,
they punctuate a piece like percussive accents. Used too often, they become
the piece and lose their shock.

## The vocabulary

- **Block displacement.** Horizontal strips of N pixels get offset by a
  random amount in x. Classic "data corruption" look. Trigger sparsely;
  duration 1-3 frames. Triggered well: on percussion peaks that don't
  already drive the core visual.
- **RGB channel split (stronger than normal chromatic aberration).** During
  a glitch frame, separate R/G/B offsets by 10-30 pixels, not 2-3. Much
  more violent than the continuous CA I already use.
- **Scanline interference.** Darken every Nth horizontal row, where N
  cycles fast. CRT / bad-signal feel.
- **Temporal jitter.** Evaluate the shader at `t_jittered = t + randomness`
  for a few frames. The visual "stutters" in time without spatial
  displacement.
- **Freeze + slip.** Hold the current frame for 2-3 render ticks while
  the audio continues, then snap back. Visualises *dropped frames*.

## How to trigger

Good glitches aren't uniform random — they're **gated** by a secondary
signal:

- High-frequency percussion peaks (`u_audio_high > threshold`)
- Audio-time events (a specific moment in the track; e.g., a drop)
- A Poisson process tuned so maybe 5-15 glitches over a 5-minute piece —
  rare enough to feel event-like

## The rule

A glitch works when the viewer can tell the system is *breaking and
recovering*, not just rendering noise. So glitches should:

1. Be visually distinct from the normal state.
2. Clearly interrupt rather than blend.
3. Recover cleanly; return to steady state within ~100-300ms.

## Implementation snippet

```glsl
// Block displacement on sparse hi-peak gate.
float glitchGate = step(0.88, u_audio_high)
                 * step(0.93, hash(vec2(floor(u_audio_time * 10.0), 1.0)));
if (glitchGate > 0.0) {
    float rowId    = floor(gl_FragCoord.y * 0.08);
    float rowShift = (hash(vec2(rowId, floor(u_audio_time * 30.0))) - 0.5) * 120.0;
    p.x += rowShift / u_resolution.x;
}
```

## Planned use

Added to `in-seven` in v2. If it lands well, candidate for the techno
piece where "digital corruption" better matches the medium.
