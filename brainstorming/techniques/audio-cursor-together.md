# Audio + cursor together — two hands on the instrument

Research note. The two channels are mature in isolation:
`brainstorming/techniques/interactivity.md` catalogues 12 cursor
patterns (direct manipulation, field source, parameter pilot,
camera, velocity, momentum, trail, time-scrub, dwell, hybrid…) plus
the 7 cursor-side critic probes;
`brainstorming/techniques/music-to-shader.md` and
`brainstorming/techniques/music-composition.md` lock in band
binding, beat-grid clocks, flash budget, section-state machines,
pre-tension, per-stem voice assignment. This doc is the
*combination* layer — every concept that belongs to one channel
alone is a cross-reference, not a re-explanation.

## Why now

VISION.md flagged the missing piece: *"a piece where the music
drives the structure and the cursor drives a detail — two hands on
the instrument."* The 2026-05 audio pipeline (`u_bpm`,
`u_beat_phase`, `u_bar_phase`, `u_section_id`, `u_section_progress`,
`u_audio_*_stem`, `u_key_*`) finally gives the music side enough
vocabulary to be the conductor without micromanaging visuals. Now
the cursor can sit on top instead of fighting for the same
registers.

## Artists / works worth stealing from

- **Robert Henke — *Lumière I/II/III*.** A predefined palette of
  shapes and sounds, with real-time order/selection by the
  performer. The score is the autonomous system; the gesture is the
  editorial decision over it. Exactly the music-as-floor / cursor-
  as-ceiling pattern.
  <https://roberthenke.com/concerts/lumiere.html> ·
  <https://www.ableton.com/en/blog/robert-henke-lumiere-lasers-interview/>
- **Tarik Barri — *Versum*.** A 3D virtual world where sounds live
  at fixed locations; the *flight path* (joystick) determines what
  is heard and seen. Music is the geography, gesture is the camera.
  The cleanest "music drives WHAT, cursor drives WHERE attention
  goes" exemplar. <http://tarikbarri.nl/projects/versum> ·
  <https://www.icad.org/Proceedings/2009/Barri2009.pdf>
- **Joshue Ott — *superDraw*.** Hand-drawn forms manipulated to
  live music; visuals are an instrument played *over* a track, not
  synced to it. The cursor's job is to be expressive *against* a
  fixed musical ground. <https://superdraw.intervalstudios.com/>
- **Memo Akten — *Webcam Piano* / *Harmonic Motion*.** Gestural
  input scored against an autonomous musical system; the input
  *selects within* a generative grammar rather than overriding it.
  <https://www.memo.tv/works/webcam-piano/> ·
  <https://cdm.link/harmonic-motion-creates-musical-patterns-in-new-abstract-work-by-memo-akten/>
- **Casey Reas — *Process* series + *Social Codes* curation.** Reas
  explicitly toggles cursor visibility based on whether a piece is
  interactive or autonomous — agency is a deliberate compositional
  choice, not a default. Dual agency (human seed + algorithmic
  evolution) is the framework V-Jaygent should adopt.
  <https://reas.com/> ·
  <https://www.artnews.com/art-in-america/features/social-codes-casey-reas-community-generative-art-1234589396/>
- **Yannick Jacquet (AntiVJ) — *St Gervais*.** Live AV with
  traditional organ + electronic music; visuals don't attempt to
  *match* the score, they punctuate it. Great example of cursor-
  style gestural authorship layered onto strong musical structure.
  <https://www.antivj.com/label/yannick.htm> ·
  <https://vimeo.com/11186594>
- **Ryoichi Kurokawa — *octfalls*.** "Sound and image as a unit,
  not separately." Tight structural coupling, but the *gesture*
  (here, the viewer's spatial position around 8 panels) chooses the
  read. Music-as-geometry, body-as-selection.
  <https://www.ryoichikurokawa.com/project/octfalls.html>
- **Bret Victor — *Inventing on Principle*.** Direct-manipulation
  creed: "creators need an immediate connection to what they are
  creating." Translates to: the cursor must alter something *now*,
  even when the music is also driving things. No latency, no veto.
  <https://worrydream.com/> ·
  <https://jamesclear.com/great-speeches/inventing-on-principle-by-bret-victor>
- **Daniel Rozin — *Wooden Mirror*.** Viewer's body is the input,
  the system's pixel grid is the autonomous structure. The mirror
  doesn't *replace* the viewer with the system or vice versa — both
  coexist. Reference for never-cancel-the-viewer.
  <https://www.smoothware.com/danny/>

## Role assignment — music structures, cursor modulates

Default: **music conducts, cursor edits.** Music owns sections
(`u_section_id`), the beat grid, the palette base, the dominant
geometry, the dramatic arc — anything that has to be true for the
track to be readable. Cursor owns the focal point, perturbation
strength, parameter pilot within a small range, and detail-layer
seeding. Tarik Barri's *Versum* is the model: the universe (music)
is fixed; the camera (cursor) chooses the read.

Exceptions are deliberate, not accidents:

- **Cursor-as-macro** is reserved for `cursor-only` pieces (no
  audio playing) or for sections where the music intentionally
  backs off. If a piece spends most of its runtime in cursor-as-
  macro mode while the music plays, you wrote a cursor piece with a
  soundtrack — that's fine, but `meta.yaml` should declare it
  (`primary_instrument: cursor`).
- **Music-as-detail** (audio garnishes a cursor-driven structure)
  is rare and usually wrong; it's what *Substrate*-style generative
  pieces do, and the Tarbell warning in `interactivity.md` applies
  — the audio ends up "having nothing honest to do."

## Conflict resolution — who wins on a shared parameter

Two patterns. Pick one per parameter, never both.

**Pattern A — Music as floor, cursor as ceiling.** Music sets a
baseline; cursor scales above it. Composes; never cancels.

```glsl
float zoomBase = 1.0 + 0.30 * u_audio_bass;       // music floor
float cursorE  = length(u_mouse / u_resolution - 0.5) * 2.0;
float zoom     = zoomBase * (1.0 + 0.50 * cursorE); // cursor ceiling
```

The reverse (cursor as floor, music as ceiling) is also valid when
the cursor establishes baseline interest and the music modulates
it. The rule: **one channel sets the magnitude scale; the other
multiplies in [1, 1+k].** Never additive on the same parameter —
that's the arms race anti-pattern.

**Pattern B — Music in geometry, cursor in selection.** Disjoint
parameter sets. Music drives WHAT exists (SDF shapes, advection
field, palette, motion); cursor drives a focal-mask radius or
vignette centre that says WHERE to look.

```glsl
vec3 scene = renderMusicScene(uv, u_audio_*, u_section_id);
vec2 focus = u_mouse / u_resolution;                 // cursor = camera
float spot = smoothstep(0.45, 0.05, distance(uv, focus));
vec3 col   = mix(scene * 0.55, scene * 1.20, spot);  // cursor edits attention
```

This is the *Versum* split. It's the safer default when the
parameter is a high-energy one (zoom, brightness, hue rotation) —
collisions there are expensive to undo perceptually.

## Coupling patterns

Five recipes that are *combination* moves, not "add cursor to an
audio piece."

**1. Cursor-modulated section transitions.** Cursor velocity
accelerates the transition window — your gesture *insists* on a
change the music is already cuing.

```glsl
float vMouse  = length(u_mouse_velocity);          // px/sec
float urgency = clamp(vMouse / 800.0, 0.0, 1.0);
float t       = u_section_progress;                // 0..1 within section
float tEff    = pow(t, mix(1.0, 0.45, urgency));   // cursor pulls the curve early
```

The music still owns whether a transition happens
(`u_to_section_change`); the cursor only bends the easing. Pre-
tension as defined in `music-composition.md` becomes player-
controllable.

**2. Music-gated cursor strength.** Cursor's authority waxes and
wanes with section progress. During a build, the cursor's pull
weakens (the music is taking the wheel); on the drop it releases.

```glsl
float build  = 1.0 - smoothstep(0.7, 1.0, u_section_progress);
float drop   = u_downbeat;                         // 1-frame impulse
float gain   = mix(0.4, 1.2, build) + 0.8 * drop;
vec2 pull    = (u_mouse / u_resolution - 0.5) * gain;
```

Inverse of the obvious mapping; feels right because it matches
musical narrative: the build *is* the moment to deauthorise the
viewer briefly so the drop reads. See the music-overrides-cursor
anti-pattern below for the version that goes wrong.

**3. Cursor as a 5th stem.** Treat cursor energy as an additional
`u_audio_*_stem`, mixed into the per-stem voice-assignment grammar
from `music-composition.md`. The cursor gets a voice — usually a
sparkle/perturbation layer — that the score doesn't have.

```glsl
float cursorStem = smoothstep(0.0, 1.0,
                              length(u_mouse_velocity) / 600.0);
float voiceMix   = u_audio_drums_stem + u_audio_vocals_stem
                 + 0.6 * cursorStem;
```

The cursor stem must obey the flash budget — it counts toward the
same total brightness ceiling, otherwise it overrides the score
during quiet passages.

**4. Cursor focus + music ground.** Pattern B above, applied as a
compositional default for any piece dense enough that the eye needs
help. Music renders the whole field; cursor picks where to look,
with a soft fall-off so the off-focus regions are still alive
(don't black them out — music is still playing there).

**5. Hybrid silence — synthesised drivers.** When `u_audio_playing
== 0` AND cursor has been idle for >2s, the piece self-plays. Use a
slow lissajous for the cursor and a sin-driven amplitude bank for
the bands (see the existing idle pattern in `interactivity.md`).

```glsl
float idle = step(2.0, u_idle_seconds) * (1.0 - u_audio_playing);
vec2 mSyn  = 0.5 + 0.35 * vec2(sin(u_time * 0.31),
                               sin(u_time * 0.47));
float bSyn = 0.4 + 0.3 * sin(u_time * 1.2);
vec2 m     = mix(u_mouse / u_resolution, mSyn, idle);
float bass = mix(u_audio_bass, bSyn, idle);
```

## Idle behaviour matrix

| State | `u_audio_playing` | cursor active | Behaviour |
|-------|-------------------|---------------|-----------|
| Both | 1 | yes | Full coupling. Music structures, cursor modulates per chosen pattern. |
| Music-only | 1 | no (idle ≥2s) | Cursor channel goes silent (no pull, no focal mask). Piece falls back to a music-only render that already passes the music-without-cursor probe. |
| Cursor-only | 0 | yes | Audio uniforms read 0; piece falls back to cursor-driven motion that already passes the cursor-without-music probe. The piece must not look broken just because audio is off. |
| Neither | 0 | no | Synthesised drivers (recipe 5). Piece self-plays — never freezes, never goes black. |

Implementation rule: write a piece such that it can be viewed in any
of the four cells without conditional logic at the top of
`mainImage`. Both channels are summed in via the patterns above;
setting one to its idle value (`u_mouse == 0`, audio uniforms == 0)
gracefully degrades the contribution.

## Anti-patterns

- **Decorative dual-input.** One channel does all the composing;
  the other shifts a tint by 5%. Vacuously passes channel-non-
  overlap. Fix: each channel must own at least one parameter that
  visibly fails the piece if you remove it.
- **Channel collision (arms race).** Both add into the same
  parameter (`zoom += bass; zoom += cursorY`). The piece zooms to
  infinity on a loud section with the cursor up, and zoom-out is
  impossible. Fix: floor-and-ceiling (Pattern A) or disjoint
  parameters (Pattern B). Never additive.
- **Music-overrides-cursor.** During loud sections, cursor input is
  masked to 0 "to let the music speak." The viewer feels
  deauthorised — moving the mouse does nothing. Fix: reduce cursor
  authority during a build (recipe 2), don't kill it. Even at
  minimum gain, motion of the cursor must produce a visible
  response within ~100 ms.
- **Cursor-only states during quiet music.** The piece flips to
  "cursor takes over" during a sparse passage, but the cursor
  decorates rather than composes. Fix: design quiet sections so the
  music still owns the structure (a held drone, a slow palette
  evolution); the cursor adds, never substitutes.
- **Cursor-as-5th-stem with no flash budget.** The cursor stem
  ignores the brightness ceiling and blows out the piece during a
  quiet passage where the user is moving energetically. Fix: cursor
  stem participates in the same `clamp(totalFlash, 0, 1.0)`
  bookkeeping as the audio stems.

## Pass/fail probes (critic agent)

These are *new* and run *in addition* to the cursor probes in
`interactivity.md` and the music probes in `music-to-shader.md` /
`music-composition.md`. A piece that declares both channels (shader
references both `u_mouse` AND `u_audio_*`) must pass 5/7 of these
to claim "two hands on the instrument."

1. **Dual-channel readability probe.** Within 5 seconds of moving
   the cursor while the music plays, can a viewer perceive that
   BOTH channels are driving the piece? Frame-comparison (cursor
   still vs. cursor moving, with audio on) + interaction.

2. **Channel-non-overlap probe.** Read the shader. List parameters
   driven by `u_audio_*` and parameters driven by `u_mouse` (and
   `u_mouse_velocity`). Are they DISJOINT, or does at least one
   parameter receive *additive* contributions from both? Disjoint
   passes; additive fails; floor-and-ceiling (Pattern A,
   multiplicative) passes with a note. Shader-verdict.

3. **Music-without-cursor probe.** With `u_mouse == (0,0)` for
   30 s, does the piece still pass *all* music-side probes (per-
   frame + song-level) from `music-to-shader.md` /
   `music-composition.md`? Shader-verdict + 30 s capture.

4. **Cursor-without-music probe.** With `u_audio_playing == 0` and
   audio uniforms forced to 0, does the piece still pass the
   cursor-side probes from `interactivity.md`? Shader-verdict +
   30 s cursor capture.

5. **Conflict-resolution probe.** For each parameter touched by
   both channels, is the relationship *floor-and-ceiling*,
   *disjoint with a mediator* (focal mask blends two scenes), or
   *additive*? Additive fails. Shader-verdict.

6. **Authority-during-build probe.** During a build
   (`u_section_progress > 0.7` heading into
   `u_to_section_change`), moving the cursor must still produce a
   visible response within ~100 ms — reduced amplitude is fine,
   zero is not. The viewer must never feel deauthorised. Frame +
   interaction.

7. **Idle-cell probe.** Run the piece in each of the four idle-
   matrix cells for 30 s. None should freeze, go black, or look
   broken; the synthesised-drivers cell must self-play with both a
   motion source and an amplitude source. 4× capture verdict.

## How to apply in V-Jaygent

**What the critic checks (added to `/vjay-iterate`):**

- Reading order #11 — `brainstorming/techniques/audio-cursor-
  together.md` (this file), conditional on the piece's shader
  referencing BOTH `u_mouse` AND any `u_audio_*` uniform.
- New "Audio+cursor probes" section in the critique Markdown
  output, mirroring the cursor probes (5/7), the per-frame music
  probes (3/4), and the song-level music probes (4/6). Threshold:
  5/7 to claim "two hands on the instrument."
- New `taste.md` lens addition: extended Music probes / Interaction
  agency lenses with a cross-reference to this doc; or a new lens
  "Two-hands on the instrument" if the topic deserves its own.

**Lib helpers deferred (extract once first dual-channel piece
ships):**

- `lib/dual_input.glsl` — helpers like
  `floorCeiling(audioFloor, cursorCeil)`,
  `cursorStemEnergy(velocity)`,
  `idleCellSelect(audioPlaying, idleSeconds, audioVal, cursorVal,
                   syntheticVal)`. Wait for first piece.

**Pieces that would benefit from retro-fit:**

- `aperture` — already cursor-driven (`u_mouse` = Julia `c`); add a
  music layer that drives an iteration-depth or palette-cycle
  parameter to make it dual-input.
- `lodestone` — cursor as magnetic pole; pair with audio-driven
  field strength via Pattern A (audio sets baseline pole strength,
  cursor scales).
- `well` — cursor as gravitational mass; pair with audio bass-stem
  driving the warped fbm density.

**Cross-references:**

- `brainstorming/techniques/interactivity.md` — cursor patterns +
  cursor-side probes.
- `brainstorming/techniques/music-to-shader.md` — per-frame audio
  binding rules.
- `brainstorming/techniques/music-composition.md` — song-level
  structure, sections, stems, flash budget, pre-tension.
- VISION.md — the open question this doc answers (now resolved).

## References

- Robert Henke, *Lumière* —
  <https://roberthenke.com/concerts/lumiere.html>
- Robert Henke, Lumière interview (Ableton) —
  <https://www.ableton.com/en/blog/robert-henke-lumiere-lasers-interview/>
- Tarik Barri, *Versum* — <http://tarikbarri.nl/projects/versum>
- Tarik Barri, *Versum: Audiovisual Composing in 3D* (ICAD 2009) —
  <https://www.icad.org/Proceedings/2009/Barri2009.pdf>
- Joshue Ott, *superDraw* — <https://superdraw.intervalstudios.com/>
- Joshue Ott & Kenneth Kirschner, Eyebeam —
  <https://eyebeam.org/artists/joshue-ott-kenneth-kirschner/>
- Memo Akten, *Webcam Piano* —
  <https://www.memo.tv/works/webcam-piano/>
- Memo Akten, *Harmonic Motion* (CDM) —
  <https://cdm.link/harmonic-motion-creates-musical-patterns-in-new-abstract-work-by-memo-akten/>
- Casey Reas, reas.com — <https://reas.com/>
- Casey Reas, Social Codes (ARTnews) —
  <https://www.artnews.com/art-in-america/features/social-codes-casey-reas-community-generative-art-1234589396/>
- AntiVJ, Yannick Jacquet — <https://www.antivj.com/label/yannick.htm>
- AntiVJ, St Gervais teaser — <https://vimeo.com/11186594>
- Ryoichi Kurokawa, *octfalls* —
  <https://www.ryoichikurokawa.com/project/octfalls.html>
- Bret Victor, worrydream.com — <https://worrydream.com/>
- Bret Victor, *Inventing on Principle* (transcript) —
  <https://jamesclear.com/great-speeches/inventing-on-principle-by-bret-victor>
- Daniel Rozin, smoothware.com — <https://www.smoothware.com/danny/>
- Tilen Sepič, *Live video circuit bending* —
  <https://sepic.cc/Live-video-circuit-bending>
