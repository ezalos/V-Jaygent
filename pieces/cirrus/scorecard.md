# cirrus — scorecard

Last iterated: 2026-05-11 (run R-20260511T050300-cirrus-iter, 3 iterations)
Latest verdict: needs-tweak → shipped (Louis-anchored chaos pass; stills don't fully capture the now-running motion)
Claim check: pass

## Probe counts (latest critique, iter 3)
- Mesmerizing: 5/5
- Interaction: n/a (frame-only audit; cursor + keys load-bearing but not stills-testable)
- Music: 3/4   (motion-over-luminance, bass→movement, quiet-reads-quiet all pass on shader; rhythm-in-stills weak)
- Song-level: 3/6  (downbeat-anchored + pre-tension shader-pass; section-readability + long-arc improved this run)
- Dual-input: n/a (interaction-unclear from stills)
- Layered: 7/8 (one warn from audit: u_section_id was unused — now used by isPeak in v2-i2)

## Dimension scores (latest, iter 3 still snapshot)
| palette | composition | motion | intensity | depth | form |
|---------|-------------|--------|-----------|-------|------|
| 5/5     | 4/5         | 3/5    | 3/5       | 4/5   | 3/5  |

(Stills under-grade motion — the per-beat jitter is a 3.9 Hz oscillation that doesn't read in a single frozen frame even though it produces visible ghosting between frames 0 and 1 of the v2-i3 capture. In motion the piece is meaningfully more alive than v1.)

## Deltas (v2-i1 first critique → v2-i3 last critique)
| metric             | first | last | Δ  |
|--------------------|-------|------|----|
| mesmerizing_passes | 5/5   | 5/5  | 0  |
| claim_check        | pass  | pass | 0  |
| motion             | 2/5   | 3/5  | +1 |
| intensity          | 2/5   | 3/5  | +1 |
| composition        | 4/5   | 4/5  | 0  |
| form_ending        | 3/5   | 3/5  | 0  |

## Fixes applied this run
1. **v2-i1** — Ring-centre drift during final 35% of each section (`smoothstep(0.65, 1.0, sp)` gate, magnitude 0.040 orbiting on `u_bar_phase`). Pre-peak and pre-outro frames now visibly destabilise.
2. **v2-i2** — Peak-section-only per-beat radial wobble (`isPeak * 0.030 * cos(bp * TAU)`). The 65s climax breathes on every beat.
3. **v2-i3** — Always-on per-beat angular jitter (`sin(bp*TAU*2 + sp*0.5) * 0.025 + cos(bp*TAU*3 + ba*1.7) * 0.012`). Calm-section frames now show tooth ghosting between samples — the mandala is alive even at section centres.

## Known gap
Stills at calm-section centres (intro, verse-mid, outro-mid) still read as "mostly locked" in a single frozen frame because the high-frequency jitter doesn't capture in one screenshot. The clip-peak.mp4 (head-on view of section 4) is the right way to evaluate liveness — that's where viewers actually meet the piece.

If a future critic still finds it static after watching motion: the next move is a slower bar-phase rotation sway on the whole c-coordinate (visible in stills as orientation between frames), or per-ring independent centres of orbit (polycentric scatter).

Latest critique: brainstorming/critiques/cirrus-v2-i3.md
