# Polyrhythmic motion

Give each layer its own time rate, and pick the rates as **coprime integers**
so they never land on the same phase. Music calls these *polyrhythms*. The
classic ratios: 3:2 (hemiola), 4:3, 5:4, 3:5:7. The beauty is in the moments
they *almost* line up.

## The formula

For each layer `i`, drive motion by `time * rate[i]` where
`gcd(rate[i], rate[j]) == 1` for all `i ≠ j`.

A layer's rotation:
```glsl
float theta_i = u_time * RATES[i] * BASE_RATE;
```

Or a layer's position on a Lissajous path:
```glsl
vec2 centre_i = AMP * vec2(cos(u_time * RATES[i] * 0.1),
                           sin(u_time * RATES[i] * 0.1 * RATIO));
```

## Good rate sets

- **3 layers:** 3, 5, 7 — period of realignment = 105 base units, feels
  "never-repeating" in practice.
- **4 layers:** 3, 5, 7, 11 — period 1155.
- **5 layers:** 3, 5, 7, 11, 13 — period 15015 (practically infinite).
- **Avoid 1 and 2** — trivial alignment with everything.
- **Avoid pairs that share factors** (2:4, 3:6, 6:9) — they alias.

## With audio

BPM-locked layers should still use coprime ratios, just scaled to the beat:
`rate_i = COPRIME[i] / bar_duration`. The layer "ticks" every `COPRIME[i]`
bars. Example at 120 BPM (0.5s/beat, 4/4 bar = 2s):

- Layer A every 3 bars = 6s
- Layer B every 5 bars = 10s
- Layer C every 7 bars = 14s
- Realignment at lcm(3,5,7) = 105 bars = 210s ≈ 3:30

## When to break the rule

Sometimes you want one layer to be **locked** to the beat (the "anchor") and
the others to drift. The anchor anchors the viewer; the drifters create
tension. The usual anchor is the background.

## References

- Polyrhythm: <https://en.wikipedia.org/wiki/Polyrhythm>
- Polyrhythmic ratios in composition:
  <https://www.samplesoundmusic.com/blogs/news/how-to-create-complex-rhythmic-patterns-with-polyrhythms>
- No named VJ manifesto for this — it's implicit in every Resolume rig
  running multi-deck BPM multipliers.
