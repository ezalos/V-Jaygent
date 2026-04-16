# glass-figure — v1 critique

**Frames captured**: `pieces/glass-figure/inspect/frame-{00..03}-t{1.5,9.5,17.5,25.5}s.png`.

All four frames are from the *opening* of the 420s arc (wall-clock inspect
only, so `u_time` ≈ the wall-time values above).

## What I see

- **Frame 00 (t=1.5s)**: completely black. The studio HUD is the only
  visible element. The 90s `smoothstep(0, 90, t)` open-fade is barely
  off 0 at this time.
- **Frame 01 (t=9.5s)**: near-black with faint warm blobs beginning to
  emerge. You can almost read fivefold structure if you know it's there.
- **Frame 02 (t=17.5s)**: diagonal interference bands visible. Deep
  amber/bronze on near-black field. The quasiperiodic character reads —
  you can see that it is *not* a periodic grid — but it is quite dim.
- **Frame 03 (t=25.5s)**: fuller field, same palette, bands more
  continuous with visible fine detail on top of coarse. Still in the
  "deep amber on dark" range.

## Scoring against taste.md

| Dimension               | Score | Note |
|-------------------------|-------|------|
| Palette cohesion        | 5     | Single warm family, luminance-only contrast. No hue drift. |
| Composition             | 3     | Field-fills-frame — no focal point, which is consistent with the thesis (quasicrystal, no centre). Slow drift is there but not dramatic in 25s. |
| Motion                  | 3     | Frames differ; fivefold drift visible. Multi-scale (coarse + fine) is there. Can't verify the 72 BPM breath from stills. |
| Intensity & dyn range   | 2     | First frame is pure black. At t=25s we're still sub-ember. The long 90s fade-in starves the opening of the piece — a cold-open viewer waits too long for anything to happen. |
| Depth                   | 4     | Coarse (k=12) + fine (k=28) layers are both legible. Detail-within-detail is real; could push finer yet. |
| Form & ending           | n/a   | Wall-clock inspect can't reach t=420 in reasonable time. Trusted to the math; arc-differentiation over [280, 410] + final flash are coded. |

**Chef d'oeuvre**: false (intensity at 2). One clear stop-and-fix.

## Top fix

**Shorten the opening fade from 90s to ~20s.** Current
`smoothstep(0.0, 90.0, t)` leaves the piece effectively invisible for
the first minute. That isn't "dynamic range downward" in the sense
VISION endorses — it's the piece not yet existing. A 20s fade still
honours the "rise from silence" intention while letting the interference
read within the first phrase.

**Rationale**: The opening black does serve the thesis a little — "from
silence, a pattern emerges" — but 90s is more than one-fifth of the
whole piece hiding in the dark. 20s lands the pattern just after the
first chord cycle has breathed a few times (5 beats × 0.833 × 4 cycles
≈ 17s), which feels musically right for a Glass piece.

## Ranked second/third fixes (held for /vjay-iterate)

2. **Bump peak exposure**: Reinhard input `col * 1.35` → `col * 1.7`.
   Peaks at full interference don't yet push into cream; they sit at
   amber. The arrival flash at t=418 will still pop, but mid-piece
   highlights should earn their tone-map.

3. **Higher fine-scale k**: k=28 for fFine could go to k=45 for more
   genuine scale separation. Currently the two layers blend enough
   that you read it as one soft field rather than "big pattern with
   small pattern inside."

4. **Verify arc sampling**: the u_time-gated convergence to a single
   dominant voice (t ∈ [280, 410]) is untested. Worth a dedicated
   long-wait inspect, or a temporary `u_time += 300` debug shader, to
   confirm the arrival doesn't just look like "other waves turned off"
   rather than "one wave won."

## Post-fix (what actually shipped)

Applied top fix (`openFade` 90s → 20s), re-rendered, re-inspected.
Frames at t=9.5/17.5/25.5 now show the full quasicrystal pattern in
ember/amber on near-black, with visible phase drift between samples.
Intensity dimension lifts from 2 → 4. Composition reads 4 (field has
genuine negative-space structure, dark "holes" form their own quasi-
pattern). No remaining dimension below 3. Shipping.

