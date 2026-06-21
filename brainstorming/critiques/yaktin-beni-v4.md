# yaktin-beni — v4 critique (the "only beautiful when paused" bug — root-caused with a new harness)

Louis, after three failed fix attempts: "The bug is still here... Do you have
the right harness to track this bug? maybe it's time to invest in the right
test architecture." + two phone screenshots (playing = tentacle mandala,
paused = bright concentric-ring bloom).

## The harness (the thing that was missing)
Built `bin/inspect-pause.mjs <slug> <time>...`: loads the piece, captures it
PLAYING at time T, then presses the runtime's real pause (`__vj.pauseAudio()`),
waits, and captures PAUSED at the same T — three PNGs per time
(`NN-tT-play-a/play-b/paused.png`) for a direct visual diff. inspect-music
only ever PLAYS+seeks, so it structurally could not reproduce a playing-vs-
paused difference. This harness reproduced it on the first run (t=195: playing
= tentacles, paused = concentric rings + bloom). (Metric readback is blank for
a WebGL canvas w/o preserveDrawingBuffer; the visual frame diff is the signal.)

## Root cause (found by READING the runtime, after 3 wrong guesses)
On pause mid-track the runtime (studio/runtime.mjs):
- pins `u_time` to the frozen `audioEl.currentTime` (good),
- keeps the **stem + section uniforms frozen-VALID** (sampled at the frozen
  time), BUT
- sets **`u_audio_playing = 0`** (audioPlaying=false on the pause event).

Every layer used `mix(synthetic, real, u_audio_playing)` and `real * playing`.
So on pause, `playing=0` **discarded the valid frozen real uniforms and
rendered the SYNTHETIC idle look** — which happens to be the gorgeous
concentric-ring bloom. Playing rendered the real look (tentacles). Pausing
literally swapped renderers. (My earlier "dropout deadening" and "live-FFT
zeroing" guesses were real sub-effects but NOT the cause.)

## The fix
Force `float playing = 1.0;` in all 6 layers → always use the real uniforms,
which are frozen-VALID when paused. Result (verified with the harness): paused
== playing at t=195 and t=99. True idle (no audio) has real uniforms = 0, so
liveness is carried by the section-scaled floors + wallclock `u_time` (the
runtime uses wallclock when not playing & not paused-mid-track) — lint-idle
PASS (lum 0.157, motion 0.077).

Also folded in this pass:
- Removed the acid-filament `u_history` trail (it accumulated on a frozen frame
  — a second, smaller pause-divergence source).
- Removed `u_audio_level` (a live-FFT uniform that zeroes when paused) from all
  persistent-brightness drives; kept live FFT only for transient sparks/shockwave.
- Slowed the hyperspace-tunnel scroll (the fast version only read frozen) and
  gave it a bright warm core; reverted the wrong "dark tunnel mouth" (Louis's
  beautiful reference frame has a GLOWING centre).

## Status
Pause bug FIXED + verified with a reusable harness. lint palette/idle PASS.
Still open (Louis's separate "more tunnel" ask): the drop reads as a
kaleidoscope mandala more than a hyperspace flythrough — a compositional pivot
(radial streaks dominant) is the next pass, but the BUG is resolved first.

## Harness follow-ups (TODO)
- Fix the luminance metric (preserveDrawingBuffer or a PNG decode) so
  inspect-pause is a numeric pass/fail, not visual-only.
- Wire inspect-pause into /vjay-iterate's gate for every audio piece.
