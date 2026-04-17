# Cymatic — live-audio Chladni piece

**Status:** design approved, ready for implementation plan
**Date:** 2026-04-18
**Piece slug:** `cymatic`

## Thesis

A new V-Jaygent piece driven by **live audio input** (default: microphone;
intended to work off any `audioinput` device — line-in, loopback, virtual
cable) so the piece can evolve from "hum at your laptop" into a party-ready
visualiser that reacts to the DJ's signal.

The visual thesis is a **Chladni nodal field**: a radially-symmetric
standing-wave pattern where sound excites geometric modes. Silence → slow
autonomous drift. Hum/music → the pattern crystallises. Pitch picks mode
orders; overall level controls sharpness; transients punch radial
shockwaves from the cursor. Cursor pins the antinode — where you point is
where the plate is clamped.

Direct ancestors in the repo:

- `in-seven` / `throb` / `chamber` — audio-reactive but bound to
  pre-recorded tracks with known timelines (`time_source: audio`).
- `breath` / `plume` / `ferment` — already cover fluid/particle idioms,
  which is why this piece goes geometric rather than liquid.

## Non-goals

- Not a waveform/bars visualiser. Karaoke UI is not art.
- Not tied to voice specifically. The same piece should work for spoken
  voice, whistling, party music, and hand claps.
- No click / scroll / gesture channels — single `u_mouse` interaction as
  per the runtime contract.
- No replacement of the existing file-audio path. File pieces keep working
  byte-for-byte unchanged.

## User-facing behaviour

1. Open the piece. Idle autonomous drift plays immediately — no
   permission prompt yet.
2. First user gesture (click / keypress / touch) prompts for microphone
   permission via `getUserMedia`. This reuses the existing
   `armFirstGestureAutoplay` hook so boot feels identical to file pieces.
3. Granted: the piece goes live. Pattern responds to sound.
4. Denied or no device: idle drift keeps playing. A small hint overlay
   reads "🎤 click to enable audio input". The piece never hard-fails.
5. Multiple input devices: a dropdown appears in the existing audio UI
   area (replacing the scrub bar, which is meaningless for live capture)
   listing available `audioinput` devices. Selection persists in
   `localStorage`.

## Meta contract

Extend the existing `audio:` field rather than adding a second field.
Runtime branches on the string:

```yaml
# pieces/cymatic/meta.yaml
title: Cymatic
slug: cymatic
created: 2026-04-18T00:00:00.000Z
audio: live                 # sentinel — live capture instead of a file
# time_source omitted — runtime only branches on the literal "audio"
# value, so absence (or anything else) correctly falls through to the
# wall-clock path. Documented here for clarity.
render_scale: 1.0
uniforms: []
notes: |
  Chladni standing-wave field driven by live audio input (default mic,
  any audioinput device via the picker). Cursor pins the antinode.
  ...
```

Rules:

- `audio: <filename>` (any string ending in an audio extension) → current
  file-loading path, unchanged.
- `audio: live` → new live-capture path.
- No other sentinel values are defined. Future sentinels (e.g. `system`,
  `test-tone`) can be added but are out of scope for this spec.

## Runtime changes — `studio/runtime.mjs`

### Branching in `attachAudio(slug, meta)`

Today:

```js
function attachAudio(slug, meta) {
  const filename = meta?.audio;
  if (!filename) { detachAudio(); return; }
  // ... create Audio element, src=file, AnalyserNode, etc.
}
```

New:

```js
function attachAudio(slug, meta) {
  const spec = meta?.audio;
  if (!spec) { detachAudio(); return; }
  if (spec === 'live') { attachLiveAudio(slug, meta); return; }
  // ... existing file path, untouched ...
}
```

### `attachLiveAudio(slug, meta)`

Mirrors `attachAudio` structurally but uses a `MediaStreamSource` rather
than a `MediaElementSource`. Shape:

1. Set `audioKey = "${slug}:live"` so piece switches still trigger a
   re-attach.
2. Hide the scrub progress bar (it's meaningless); show the device picker
   UI (new).
3. Call `ensureLiveAudioContext()` which:
   - Ensures `audioCtx` exists (reused from the file path).
   - Calls `navigator.mediaDevices.getUserMedia({ audio: constraints })`
     with the saved `deviceId` or `default`.
   - Creates `MediaStreamSource(stream) → analyser`. **Does NOT connect
     to `audioCtx.destination`.** Feedback prevention is non-negotiable;
     users listen to the party signal through their own monitoring.
4. Set `audioPlaying = true`, `liveStartTime = performance.now()`.
5. On `getUserMedia` reject: log warning, show the hint overlay, leave
   `u_audio_*` uniforms at zero.

Constraints object:

```js
{
  audio: {
    deviceId: savedDeviceId ? { exact: savedDeviceId } : undefined,
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  }
}
```

All three Chrome "voice call" heuristics are disabled so kick drums,
consonants, and quiet ambients all preserve their dynamics.

### Sample path

`sampleAudio()` is unchanged. It already reads `audioAnalyser` and
produces `audioBands` + `audioOnsets`. The same `setStandardUniforms()`
pushes `u_audio_bass/mid/high/level/kick/snare/cymbal` etc. to the
shader. The only uniform that behaves differently is:

- `u_audio_time`: for live, equal to `u_time` (wall clock since piece
  load). The concept of track-time doesn't apply; the shader uses
  `u_time` for animation anyway.
- `u_audio_playing`: `1.0` whenever a live stream is attached.

### Device picker UI

- New small element in the audio UI area, visible only when `audio ===
  'live'` is active.
- Populated from `navigator.mediaDevices.enumerateDevices()` filtered to
  `kind === 'audioinput'`. Labels only appear once permission is granted
  (browser privacy quirk) — before permission, show "grant access to
  list devices".
- Selection writes to `localStorage['vjay_audio_input_device_id']`
  and calls `rebuildLiveSource(deviceId)` which tears down the current
  `MediaStreamSource` and re-runs `getUserMedia` with the new id.
- On reload, if the saved deviceId isn't found in the enumerated list,
  silently fall back to default.

### Cleanup

`detachAudio()` already handles file audio. Extend it to:

- Stop all tracks on the live `MediaStream` (`stream.getTracks().forEach(t
  => t.stop())`) — otherwise Chrome shows the red recording dot forever.
- Null out the `MediaStreamSource` reference.

## Shader — `pieces/cymatic/shader.frag`

Single pass, full-screen quad. Includes `lib/chladni.glsl`,
`lib/noise.glsl`, `lib/tonemap.glsl`.

### Core math

Chladni's square-plate nodal function for mode `(m,n)`:

```glsl
float chladni(vec2 p, float m, float n) {
  return cos(m*PI*p.x) * cos(n*PI*p.y)
       - cos(n*PI*p.x) * cos(m*PI*p.y);
}
```

Node lines are where `|chladni| → 0`. We draw brightness as
`1 - smoothstep(0, edge, abs(field))` where `edge` inversely tracks
sharpness (i.e. `edge = mix(0.3, 0.02, sharpness)`).

### Mode mixing

Three fixed pairs selected for visual distinctness, weighted by bands:

- `(2, 3)`  × `u_audio_bass`  — low-order cross.
- `(5, 7)`  × `u_audio_mid`   — mid-order lattice.
- `(11,13)` × `u_audio_high`  — fine filigree.

```glsl
float field =
    u_audio_bass * chladni(p, 2.0, 3.0)
  + u_audio_mid  * chladni(p, 5.0, 7.0)
  + u_audio_high * chladni(p, 11.0, 13.0);
```

`p` is screen-space normalised to `[-1,1]`, recentred on
`uMouse01 * 2 - 1` (cursor pins plate). Aspect-ratio corrected.

### Sharpness

```glsl
float sharpness = smoothstep(0.02, 0.5, u_audio_level);
float edge = mix(0.25, 0.015, sharpness);
```

Silent → blurry rings. Shout → razor-thin nodes.

### Transients

Each onset emits a radial shockwave from the cursor that distorts plate
coords for ~0.3s:

```glsl
float kickWave  = u_audio_kick  * exp(-r * 4.0) * sin(r * 20.0 - u_time * 8.0);
// similar for snare (different frequency) and cymbal
p += normalize(d) * kickWave * 0.1;
```

`u_audio_flash = max(kick, snare, cymbal)` drives a multiplicative
bloom term (`col *= 1 + flash * 0.5`), following the
multiplicative-not-additive rule from `music-to-shader.md`.

### Idle branch

```glsl
if (u_audio_level < 0.02) {
  // FBM-driven slow sweep of (m,n) — piece self-plays when silent or
  // permission denied. Sweep period ~20s so it feels contemplative, not
  // twitchy.
  float t = u_time * 0.05;
  float mBass = 2.0 + 2.0 * fbm(vec2(t, 0.0));
  // ... same for mid, high pairs
  // use these as soft weights with a small constant audio-like floor
}
```

### Palette

Warm luminance-only — single hue ramp through orange/amber/red, structure
does all the visual work. `tonemap.glsl::reinhard` on the final colour.

## Lib additions — `lib/chladni.glsl`

```glsl
// ABOUTME: Chladni nodal-line primitives — standing-wave geometry for
// ABOUTME: sound-driven and autonomously-driven pieces.

#ifndef CHLADNI_GLSL
#define CHLADNI_GLSL

float chladni(vec2 p, float m, float n);
float chladniField(vec2 p, vec2 pair0, vec2 pair1, vec2 pair2,
                   float w0, float w1, float w2);

#endif
```

Plus implementations. Reusable by future pieces (e.g. a "resonate" piece
that uses the same primitive with a different driver).

## Scaffolding — `bin/new-piece.mjs`

Already scaffolds `pieces/<slug>/{meta.yaml, shader.frag}`. Need to
either:

- Extend with `--audio live` flag that writes `audio: live` and
  `time_source: wall` into the generated meta, OR
- Manually hand-edit the generated files (acceptable for v1).

Lean: **add the flag**. Cheap, keeps scaffolding honest, benefits future
live pieces.

## Testing

### Unit / server tests — `tests/server.test.mjs`

Add one case: piece with `audio: live` validates and round-trips through
`/api/pieces/:slug/meta` — the runtime must see `"live"` verbatim, not
coerced or stripped.

### Smoke — `bin/smoke-shaders.mjs`

Already present in the working tree. Verify the new piece compiles
headlessly (no getUserMedia needed — it's a shader compile test).

### Manual verification

1. Open piece locally. Deny mic permission → confirm idle drift renders
   and hint overlay shows.
2. Grant mic permission → hum at laptop → confirm pattern crystallises
   and shifts with pitch.
3. Clap sharply → confirm radial shockwave + flash.
4. Open device picker, switch to a second input (if available) → confirm
   stream rebuilds without reloading the page.
5. Reload page → confirm device choice persists.
6. Run alongside audio output from laptop speakers → **confirm no
   feedback howl** (the `destination` connection must stay absent).

### Deploy verification

Microphone requires HTTPS except on `localhost`. `vjaygent.develle.fr`
is HTTPS via Cloudflare, so the deployed version works. LAN-by-IP access
(`http://10.x.x.x:7777`) will silently fail the `getUserMedia` call —
acceptable, matches browser policy, noted in the piece's `notes:` so
future-me isn't confused.

## Interactivity-study probes (`brainstorming/techniques/interactivity.md`)

Expected pass rate:

1. **Composition test** — different cursor positions shift the antinode,
   whole image re-composes around it. **Pass.**
2. **Idle test** — autonomous FBM mode sweep when silent. **Pass.**
3. **Readability test** — make sound → pattern appears; cursor moves →
   pattern re-centres. Discoverable in 3s. **Pass.**
4. **Reversibility test** — moving cursor back restores the image
   (assuming same audio state). **Pass.**
5. **Dominance test** — cursor only pins the centre; audio does the
   structural work. Cursor contribution ≤ 30%. **Pass.**
6. **Convention test** — no inverted priors; cursor-as-centre is
   intuitive. **Pass.**
7. **Latency test** — pattern re-centres in 1 frame (no smoothing on
   cursor). **Pass.**

Target: 7/7. "Cursor as instrument" claim holds.

## Out of scope (follow-up ideas)

- System-audio / loopback capture sentinel (`audio: system`) once we
  pick a cross-platform loopback story.
- Per-piece audio-input constraints in meta (some pieces may want
  `autoGainControl: true` for speech intelligibility).
- Test-tone generator (`audio: test`) for CI smoke.
- Multi-plate composition (Chladni plates at multiple centres).

## Build sequence

Proposed order (refined by the writing-plans step):

1. Library: `lib/chladni.glsl` + a tiny test piece that renders one
   static `(3,5)` pattern to prove the primitive.
2. Runtime: `attachLiveAudio()`, `ensureLiveAudioContext()`, cleanup in
   `detachAudio()`, `audio: live` branch in `attachAudio()`.
3. Device picker UI (HTML + CSS + JS) in the existing audio UI block.
4. Scaffolding flag in `bin/new-piece.mjs`.
5. Piece: `pieces/cymatic/{meta.yaml, shader.frag}`.
6. Server test for `audio: live` round-trip.
7. Manual smoke pass + the 7 interactivity probes.
