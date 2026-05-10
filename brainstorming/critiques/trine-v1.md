# trine — v1 critique

Captured: 4 frames at t ≈ 1.5, 9.5, 17.5, 25.5 s in headless render.
Cursor sentinel active in inspect (parked near canvas centre per the
known `inspect.mjs` quirk), so frames show "with cursor" behaviour
rather than the clean 3-body baseline.

## What I see

**Frame 00 (t ≈ 1.5s).** Three short coloured curves emerging from
the initial triangle: a long magenta tail descending toward the
bottom of the frame, a tight gold loop in the upper-middle, and an
ember-orange arc on the right. The bright pinpoints at each body's
current position read clearly. Earliest frame already shows the
chaotic divergence — bodies have visibly accelerated past their
neutral starting velocities.

**Frame 01 (t ≈ 9.5s).** Lacework. Multiple curves crossing each
other, all three colours visible, several toroidal wraps already
happened (curves enter one edge and re-emerge on the opposite).
The cursor's centre-pull is visible — bodies are clearly being
re-routed through the centre and back out.

**Frame 02–03 (t ≈ 17.5, 25.5s).** Dense interlocking traceries.
The trail decay (half-life 0.6s) keeps the canvas from saturating;
each frame has roughly 5–8 visible "recent" arcs while older trails
have already faded. By t=25.5s the field looks like a long-exposure
photograph of three planets playing tag — exactly the thesis.

**FPS overlay**: 56 fps in headless. Above the 30-fps threshold.

## Scores (vs. `taste.md`)

```yaml
piece: trine
version: v1
scores:
  palette_cohesion: 5   # gold/ember/mauve all in warm family; no green/cyan
  composition:      4   # central focal point with arcs radiating; eye stays near middle
  motion:           5   # constant orbital motion; no frozen frames
  intensity:        4   # peaks at body cores roll to warm-white via Reinhard
  depth:            4   # trails behind, bodies in front, dark ground — three readable layers
  form_and_ending:  3   # 60s loop with no end; piece is autonomous so this is intended
  mesmerizing:      5   # 3-body chaos delivers exactly the long-look mesmerism Louis asked for
```

## What worked first time

- Canonical Newton + Plummer softening. Six lines of physics, no
  reinterpretation. The piece is the textbook algorithm.
- Closed-brief discipline. No audio, no keyboard, no multi-finger,
  no palette wedges. Just three bodies and what they paint.
- Spatial bins not needed — N=3 is trivially cheap, even all-pairs.
- FPS check at inspect step caught nothing because there was nothing
  to catch. The architecture was right.

## What changed in the one iteration

v1 first render had discrete-dot trails because the body moved
~0.005 of canvas per frame while splat sigma was 0.0045 — splats
didn't overlap. Fixed in one structural change: 6 sub-splats along
the recent velocity vector per body per frame (TRAIL_LOOKBACK
matched to sim DT × iterations), and DECAY 0.992 → 0.982 so the
older lacework fades before saturating. Frame 00 of v2 shows the
continuous lines we wanted.

## Open questions

- Does the cursor pull feel responsive on phone, or does the
  CURSOR_MASS=5 make bodies snap too eagerly toward the touch?
  Untested in real input — only headless inspect with the
  centre-parked cursor.
- Long-running (10+ minute) sessions: does the trail buffer's
  steady-state coverage settle into a stable density, or does
  the system drift toward saturation? Visual check needed.
- Should there be a way to "reset" initial conditions if the
  bodies lock into a stable orbit? Would lose the chaos. Reset
  on long key-press? Out of scope for v1.
