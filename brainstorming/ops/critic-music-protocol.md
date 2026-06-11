# critic-music-protocol — grading pieces from a "blind viewer" perspective

A reusable protocol for grading any V-Jaygent piece against `taste.md`
using **music-anchored visual evidence** instead of wall-clock stills.
Built 2026-05-11 after a full-catalogue ranking exposed that long audio
pieces were being graded on the wrong frames (a 322s track sampled at
intervals of 6s only ever showed the intro).

## What the tool does

`bin/inspect-music.mjs <slug>` captures a piece three ways:

1. **Section-anchored stills.** If `audio.analysis.json` is present,
   it picks 6 moments — `intro`, `verse`, `pre-peak`, `peak`, `quiet`,
   `outro` — derived from `sections[].{start,end,energy}`. Stops within
   2.5s of each other are deduped, so short tracks may end up with 4-5
   frames.
2. **Audio-time stills (no analysis).** If the piece has audio but no
   analysis JSON, the script seeks `audioEl.currentTime` to evenly
   spread points across the track duration. This still beats
   wall-clock sampling because the runtime's audio uniforms react in
   real time to where the playback head actually is, not where
   `setTimeout` thinks it should be.
3. **Wall-clock stills (no audio).** Mirrors the legacy `inspect.mjs`
   behaviour for silent pieces.

Plus an optional **10–14s peak clip** (`clip-peak.mp4`) recorded over
the highest-energy section — gives the critic continuous motion to
verify probes that don't survive into stills (phase-lock, beat-snap,
quiet-reads-quiet at the section level).

Output: `pieces/<slug>/inspect-music/`.

## How the seek works

`studio/runtime.mjs` exposes inside `exposeRecordingHooks` (only when
`?record=1`):

- `window.__vj.seekAudio(t)` — sets `audioEl.currentTime = t`, plays
  if paused, returns `{ok, at, duration}`.
- `window.__vj.getAudioTime()` — current playback head in seconds.
- `window.__vj.waitForAudio(timeoutMs)` — resolves true once the audio
  element has `readyState >= 2`.

After each seek the script waits 900ms before the screenshot so the
runtime's onset smoothing buffers + section-state machine catch up.
`audioEl` is held in the runtime's module-scope closure, so these
hooks are the only way an outside script can reach it.

## Usage

```bash
node bin/inspect-music.mjs <slug>                # frames + peak clip
node bin/inspect-music.mjs <slug> --no-video     # frames only (faster)
node bin/inspect-music.mjs <slug> --frames N     # override frame count
node bin/inspect-music.mjs <slug> --cursor       # +2 cursor-active frames
```

Prereqs: studio running on `:7777` (`docker compose up -d`) and the
container must include the `seekAudio` patch in `runtime.mjs` (rebuild
required since `studio/` is not bind-mounted).

## Grading workflow

For each piece:

1. `node bin/inspect-music.mjs <slug>` — captures frames + clip.
2. Read `pieces/<slug>/meta.yaml` `notes:` for the claim.
3. Read the frames in order: `intro → verse → pre-peak → peak → quiet
   → outro`. Look for visible distinction between sections (the
   `section-readability` probe from taste.md song-level probes).
4. Sample 2-3 timestamps from `clip-peak.mp4` if the piece declares
   audio reactivity — verify bass/downbeat actually moves geometry
   between frozen stills.
5. Read the lead shader (`shader.frag` or `layers/*/shader.frag`) for
   the shader-verdict probes (motion-over-luminance, bass-movement,
   channel-non-overlap).
6. Apply `taste.md` rubric: 5 mesmerizing probes, claim check, 6
   dimensions on 1-5, verdict.
7. Write the YAML tail per `taste.md` schema.

## Known gaps

- Cursor + keyboard interactions are stubbed (cursor parked at idle
  sentinel; keyboard not pressed). Keyboard-synth pieces still need
  manual inspection or a future `--keys A,B,C` flag.
- The clip records canvas pixels only — no audio track baked in.
  Useful for geometry inspection, not for verifying audio-visual
  sync from the recorded artefact alone (use the section labels on
  the stills instead).
- Pieces without `audio.analysis.json` get audio-time sampling but no
  peak clip (we don't know where the peak is). Run
  `bin/analyze-audio.mjs <audio-file>` first to enable section
  anchors.
