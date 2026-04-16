# breath — v1 critique

Captured: 5 frames at t ≈ 1.5, 16.5, 31.5, 46.5, 61.5 s against the first
minute of `aisatsana [102]`.

## What I see

**Frame 00 (t ≈ 1.5s).** Near-pure black. A soft ember bloom rises from
just below centre, bottom-weighted. No hard edge; the schlieren rim is
visible as a faint rust ring. This frame earns the thesis — silence is
the field, and a single note's worth of energy is exactly what's showing.

**Frame 01 (t ≈ 16.5s).** Disaster. The field has saturated into a giant
rounded-rectangle plateau of cream-amber covering ~60% of the screen,
bordered by a thin ember rim. Reinhard rolls the inside to near-white
warm, and the resulting plateau is flat — no internal structure, no
readable motion within it. The studio HUD (track bar, hint text) is
visible against the cream because the bright field exposes otherwise
invisible low-contrast overlays.

**Frames 02-04 (t ≈ 31.5, 46.5, 61.5s).** Substantially identical to
frame 01. The blob's outline migrates slightly — the border wobbles
left/right with the stereo drift — but the interior is a static cream
plateau. By frame 04 the blob has drifted slightly left, confirming the
pan works, but also confirming that the DIFFERENCE between frames 01-04
is purely kinematic (position) rather than dynamic (energy). The piece
has lost its pulse.

## Diagnosis

The seed amplitude is far too large for the decay rate. With
`SEED_AMP = 0.030` per sub-step × 8 sub-steps/frame × 60 fps, a single
frame with any audio activity deposits ~0.014 per pixel at source centres,
and with `DECAY = 0.9983` (half-life 0.9s), steady-state at source
centre is seed × band / (1 − decay) ≈ 0.030 × 0.3 / 0.0017 ≈ 5.3 per
pixel — roughly 10× what the palette expects. The field saturates within
~5 seconds of continuous sound and never recovers.

This is a unit-scaling bug dressed up as an aesthetic one. The thesis is
intact; the numbers betray it.

## Scores (vs. `taste.md`)

```yaml
piece: breath
version: v1
scores:
  palette_cohesion: 5  # warm-only family, no drift, schlieren rim stays in palette
  composition:     2   # saturated plateau dominates; eye pinned, no elsewhere
  motion:          2   # interior is frozen cream; only the border drifts
  intensity:       2   # no dynamic range DOWNWARD — the whole pitch of the piece fails
  depth:           2   # no fine structure; diffusion smooths away detail before it lands
  form_ending:     n/a # only 60s of 322s captured
chef_doeuvre: false
top_fix: >
  Reduce SEED_AMP in pieces/breath/sim.frag from 0.030 to 0.004 (7.5×
  drop). This keeps source-centre field values under ~0.7 during loud
  passages, letting the palette's full toe-to-shoulder range be in play
  and letting silence actually register as a drop in the field rather
  than a drop in a clipped-high plateau. The thesis ("silence is part of
  the piece's pulse") requires that the field BE able to go quiet, not
  just the audio.
rationale: >
  Frames 01-04 show a saturated cream plateau whose interior has no
  dynamics; only the border moves. The math for equilibrium at source
  centre (seed × band / (1 − decay)) gives ~5.3 for the current values,
  versus a palette input range of [0, ~0.9]. 7.5× reduction brings
  equilibrium into the palette's readable range, restoring dynamic
  range on the field itself.
```

## Ranked fallback fixes (held for later)

1. If the SEED_AMP reduction over-corrects and the piece reads as
   perpetually near-black even in loud passages, also lower the palette
   toe from `smoothstep(0.01, 0.55, v)` to `smoothstep(0.005, 0.35, v)`
   so modest field values still read as rust/ember rather than staying
   in burgundy.
2. The schlieren rim threshold (`smoothstep(0.010, 0.060, grad)`) is
   tuned for a saturated field. Post-fix, the gradient magnitudes will
   be smaller; may need `smoothstep(0.003, 0.025, grad)` to preserve the
   rim's legibility.
3. The spatial jitter amplitude (0.03) is inaudible once sources are
   reduced — could be raised to 0.05 for more visible wander during
   quiet passages.

Per the skill: only top_fix is applied for v1 → v2. The rest go to
`/vjay-iterate`.
