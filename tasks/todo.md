# rosette — Newton fractal on z^n − 1, n audio-driven

**Context.** Continuing the basin/fractal series after watershed +
shoal. Louis: "Newton on z^n − 1 with audio-driven [n]. You are free
to chose the music." Picked Jon Hopkins — *Open Eye Signal* (8 min
iconic build-and-drop, percussive enough for clean basin-count snaps).

Previous todo (shoal) in git history.

## Thesis (committed)

`p(z) = z^n − 1` has n roots: the n-th roots of unity, equally spaced
on the unit circle. Newton's method on this is the canonical n-fold
symmetric Wada fractal. Drive integer `n` from audio (level pumps it,
each downbeat snaps it up briefly) and the fractal's basin *count*
changes with the music — the rosette unfolds petals through the
build and collapses on the drop. Keyboard overrides n: each of 15
keys plays a specific n value (a fractal-shape sequencer).

## Plan

- [x] 1. Brief + start run + download audio (Jon Hopkins, yt-dlp).
- [ ] 2. ffprobe + analyze (`bin/analyze-audio.mjs --stems`).
- [ ] 3. Write meta.yaml + shader.frag (monolithic A, song-level
      uniforms wired since we have analysis JSON).
- [ ] 4. Brainstorm stub + refs.
- [ ] 5. Sanity render + inspect (audio-paced).
- [ ] 6. Inspect section-anchored frames (`bin/inspect-music`).
- [ ] 7. Lints + audit + critic.
- [ ] 8. Commit + `current.txt` + `/wrap-up`.

## Lessons applied

- **watershed:** Newton (crisp Wada by construction) — not integrated
  dynamics. ✓ committed at the brief stage.
- **shoal:** animate the landscape — `n` changing IS the landscape
  animation; per-section structural events; bar/beat geometric phase-
  lock from the analysis JSON.
- **three timescales of liveness:** macro (song structure → n drift),
  meso (per-bar / per-downbeat snaps), micro (sub-beat shimmer).

## Non-goals

- Smooth interpolation between integer n's (would double per-pixel
  cost via two-fractal blend; the discrete snaps ARE the audio-locked
  geometric event per `feedback_visual_phase_lock`).
- A separate decorative layer. Monolithic, like watershed v9 and
  shoal v4.

## Open questions

- Does the n-snap on each downbeat read as a clean geometric event,
  or as flicker? Watch after first inspect.
- Will n=11 (max) render fast enough? 11 cmuls × ~30 iter × all
  pixels at render_scale 0.66. Tune after first FPS read.

## Review

**Shipped — critic chef-doeuvre on iteration 1 (build v2).** Two
renders: v1 compiled clean and looked great in inspect-music frames
across all 6 sections (intro/verse/pre-peak/peak/quiet/outro), but
the audit flagged 3/6 song-level uniforms unused (`u_section_id`,
`u_section_progress`, `u_song_progress`). v2 wired them in: section
id jumps the palette base, section progress amplifies the bass push
(pre-tension), song progress carries a global hue arc.

Critic v1 verdict: **chef-doeuvre — full marks across the board.**
5/5 mesmerizing, 4/4 music probes, 6/6 song-level composition
probes, 7/7 dual-input probes, visible-phase-lock pass, all 6
dimensions 5/5 (including Form & Ending, scorable for the first
time in this series because of the audio-bound arc).

**Lessons applied** (no new lesson surfaced — existing memory held):
- watershed: Newton fractal, not integrated dynamics. ✓
- shoal: animate the landscape — `n` changing IS the animation. ✓
- three-timescales-of-liveness: section-progress (slow), per-downbeat
  (meso), beat-pulse + shimmer (micro). ✓
- visible-phase-lock: bar/beat/downbeat/section all drive geometry. ✓

**Total renders: 2** — well inside discipline budget. Watershed's
9-render saga taught the lesson; shoal at 5 reinforced it; rosette
at 2 confirms the pattern: when the algorithm fits the medium AND
the landscape is genuinely animated (here by audio), the piece
converges fast.

**Series progress** (2swap basin/fractal series):
1. watershed — Newton, moving roots via cursor/keyboard. chef-doeuvre.
2. shoal — Lyapunov chaos map of the double pendulum. ship-it.
3. rosette — Newton on z^n − 1, n music-driven. chef-doeuvre.
