# Music composition — song-level rules

Research note. The existing `music-to-shader.md` covers per-frame
binding (FFT band → modulator). This document covers the *song-level*
layer above it: sections, downbeats, pre-tension, per-stem voicing,
long-arc shape. Short version: the runtime can finally *compose* with
the music; pieces that don't are leaving the new uniforms on the
floor.

## Why now

The audio pipeline is graduating. The runtime has, since the project
started, only seen three FFT bands and one RMS — the visual could
*react* to the song but never *know about* it. On 2026-05-05 we
accepted `bin/analyze-audio.mjs`: an offline pass that writes
`audio.analysis.json` next to each track containing BPM, beat and
downbeat grids, sections (intro/verse/build/drop/outro), per-stem
RMS via Demucs (drums/bass/other/vocals — Meta's hybrid transformer
source separator), and a key/chord track. The runtime exposes new
uniforms when the JSON is present: `u_bpm`, `u_beat_phase`,
`u_bar_phase`, `u_downbeat`, `u_section_id`, `u_section_label`,
`u_section_progress`, `u_to_section_change`, `u_song_progress`,
`u_audio_*_stem`, `u_key_tonic`, `u_key_mode`.
<https://github.com/facebookresearch/demucs>

This document is the rule-book for what to do with that information.

## Artists / works worth stealing from

Each entry: the single move to lift.

- **Ryoji Ikeda — *Test Pattern* (2008–).** Eight monitors, sixteen
  loudspeakers, data converted to barcode imagery synchronised at
  hundreds of frames per second. The move: structural minimalism —
  one rule, executed mercilessly across a whole work, lets *change
  of rule* carry all the drama. Don't add layers; change the section.
  <https://www.ryojiikeda.com/project/testpattern/>
- **Carsten Nicolai / Alva Noto — *Unitxt / Univrs / Unieqav*
  (2008–18).** Microscopic clicks aligned to a visible grid; visuals
  respond to sound in real time but the grid itself is the
  composition, not the accompaniment. The move: make the grid (bar /
  beat / section) the primary visible element, and let stem
  amplitude only colour it.
  <https://en.wikipedia.org/wiki/Carsten_Nicolai>
- **Robert Henke — *Lumière I/II/III* (2013–).** Vector laser
  graphics driven from Ableton Live's Session view; control voltages
  are routed *back* into the audio path so glitch sound and laser
  geometry are literally the same signal. The move: precompute
  structure with the music tool, then let the visual *be* a
  projection of that score, not a reactive layer over it.
  <https://roberthenke.com/concerts/lumiere.html>
- **Memo Akten — *Simple Harmonic Motion* (2011–).** The same rule
  (sinusoidal motion of one parameter) restaged across many pieces
  and many sections within each piece, with *complexity emerging
  from interaction* of those parts. The move: section transitions
  are composition events; design the *transitions*, not the
  sections.
  <https://www.memo.tv/works/>
- **Caterina Barbieri — *Spirit Exit* live (2022–).** Long arpeggios
  that withhold release across multiple bars, then collapse. Visuals
  by Iacopo Carapelli operate on the same arc. The move:
  *withholding* — make the visual climb in the build, refuse to
  flash on every kick, and pay it off on the downbeat of the drop.
  <https://caterinabarbieri.com/Spirit-Exit>
- **Holly Herndon — *PROTO* live (2019).** Eight-vocalist ensemble
  plus Spawn (the trained model) on stage; visuals respond to vocal
  stems separately from rhythm. The move: vocals are a *foreground /
  focal* voice. They deserve their own visual lane (a mask, a glyph,
  a focal bloom) rather than being stirred into the FFT.
  <https://www.barbican.org.uk/holly-herndon-proto>
- **Brian Eno — *Oblique Strategies* and the generative music essays
  (1975–).** One card reads literally "Are there sections?" Eno
  frames composing as gardening, not architecture: set conditions
  per section, let them grow. The move: write a different *rule* per
  section — not different parameters of the same rule.
  <https://en.wikipedia.org/wiki/Oblique_Strategies>
- **Steve Reich — *Music for 18 Musicians* (1976) and the *Phase*
  pieces.** ABCDCBA arch form. Sections cued by the metallophone
  (pulses played once to mark transitions, like a Balinese gamelan).
  Phasing is *exact tempo divergence* — the visual analogue is layer
  drift. The move: structural recapitulation (return to theme at the
  end), and use a single visible *cue glyph* on the downbeat of
  every section change so the architecture is legible.
  <https://en.wikipedia.org/wiki/Music_for_18_Musicians>
- **Squarepusher / Aphex Twin — Warp / Rephlex breakbeat (1995–).**
  Compositional surprise inside a strict grid. The move: variation
  *within* the bar (drum fill, pattern flip on bar 7 of 8) keeps
  per-frame reactivity honest without breaking the section state.
  <https://en.wikipedia.org/wiki/Squarepusher>
- **Ash Koosha — *I AKA I* / *GUUD* VR album (2015–17).** Sound
  objects rendered as visual objects in VR; "no division between the
  two." The move: when a stem has a clear timbral identity (vocoded
  vocal, sub-bass slide), give it a *dedicated visual object*, not a
  global modulator.
  <https://archive.ica.art/bulletin/seeing-sound-interview-ash-koosha/>
- **Demoscene 64k intros + GNU Rocket sync-tracker (2007–).** Thirty
  years of tradition for synchronising visuals to a pre-known score:
  Rocket is a music-tracker UI where each *track* is a float ramp
  driving a visual variable. The move: precomputed key-frame curves
  per section beat the per-frame chase every time the music is
  fixed. <https://github.com/rocket/rocket>
- **Spotify Audio Analysis API + librosa / MSAF.** The public
  reference for what the audio-analysis field considers good: tatums
  (lowest perceived pulse), beats, bars, sections (defined by large
  variation in rhythm or timbre). MIREX evaluates boundary detection
  at 0.5 s and 3 s tolerance windows; current SOTA F-measure at 3 s
  tolerance is ~70% on SALAMI. Don't expect frame-perfect section
  boundaries — design transitions that work even if the boundary is
  half a bar off.
  <https://developer.spotify.com/documentation/web-api/reference/get-audio-analysis>
- **Roger Deakins / *Sicario* editor Joe Walker.** Editing rhythm is
  pace, not metronome. Cuts on the downbeat are felt, not analysed.
  The move: only the *biggest* changes (full palette swap, layer
  reveal) land on `u_downbeat`; smaller motion floats freely.
  <https://www.studiobinder.com/blog/roger-deakins-cinematography/>

## Core principles for song-level composition

**1. The downbeat is the architecture beat.** Only structural changes
happen on `u_downbeat` or `u_bar_index` boundaries: palette flips,
layer reveals, mode toggles. Per-beat events (`u_beat_phase < 0.05`)
are for small accents. Per-frame audio (`u_audio_bass`) is for
continuous modulation. Three layers, three time-scales. Mixing them —
flashing on every kick — collapses the song to a strobe.

**2. Sections are categories, transitions are the action.** A section
isn't a different piece; it's the same piece in a different mood.
Design the *transition* between section N and N+1 as a 4-8 bar
window, not as a step at `u_section_id` change. The viewer reads
transitions; nobody notices a static section.

**3. Pre-tension is knowing-the-future.** `u_to_section_change` is
the single most powerful new uniform. Only the visual knows the drop
is coming in 8 bars. Use that to *withhold*: squeeze a parameter
(zoom in, desaturate, slow motion) over the last 4-8 bars of a build,
then snap release on the downbeat of the drop. Without anticipation,
the drop is just another beat.

**4. Per-stem reactivity is voice assignment.** Stems are not 4 extra
input channels; they're *roles*. Bass = ground motion (camera scale,
horizon breath). Drums = kinetic accents (snare snaps a state, hat
glints a particle). Other = atmosphere/palette/haze. Vocals = focal
element (mask, glyph, bloom). Bind two, name them, and ignore the
others.

**5. Long arcs require return-to-theme.** A 5-minute piece can hold
on density curve alone. A 20-minute piece can't — it needs
recapitulation. Reich's ABCDCBA and Eno's gardening are the same
move: the closing section *returns to the opening rule*, with one
visible difference (a new chord, a colder palette). Use
`u_song_progress` to schedule the return: at 0.85 the piece must
visibly remember its opening.

**6. Key/chord modulates palette warmth subtly.** `u_key_mode == 1`
(minor) cools the highlight curve by ~5-10% saturation. A modulation
event (key change mid-song) is a transition cue — treat it like a
section boundary. The warm-palette rule from `taste.md` is still
primary: cooler ≠ blue, just *less amber*.

**7. The flash budget is shared across the bar.** ≤4 flash events
per bar across the whole composition. If layers each have their own
flash, the budget is exhausted in one beat. One layer "owns" flashes
per section; others modulate. (See `music-to-shader.md` §"Flash
budget" for the per-frame rule and the medical-floor reasoning.)

**8. Reactivity is the floor, composition is the ceiling.** Every
existing taste.md probe (motion-over-luminance, bass→movement, etc.)
must still pass on a 4-bar slice. The new probes ride on top: they
ask whether the piece also has *song-scale* shape.

## Section-state machine patterns

The canonical state machine: `intro → verse → build → drop → verse →
breakdown → drop → outro`. In the shader, evaluate state weights per
section, not as an `if`-tree:

```glsl
// section_id is an integer; use weights for cross-fade safety
float wIntro = float(u_section_id == 0);
float wVerse = float(u_section_id == 1 || u_section_id == 4);
float wBuild = float(u_section_id == 2);
float wDrop  = float(u_section_id == 3 || u_section_id == 6);
float wBreak = float(u_section_id == 5);
float wOutro = float(u_section_id == 7);

// transition window: blend last 4 bars of section N
// with first 4 of N+1
float xfade = smoothstep(0.0, 4.0 * 60.0 / u_bpm,
                         u_to_section_change);
// xfade == 1 mid-section, → 0 at boundary;
// mirror on the other side
```

**State carryover vs reset.**

- *Persists* across boundaries: cursor-driven field state, the slow
  drift clock, palette base hue. The viewer's anchor doesn't reset.
- *Resets* on boundary: per-section parameter ramps
  (`u_section_progress` is zero at start). The build's tension
  counter must zero; otherwise the second build feels limp.
- *Decays*: layer-specific opacity. The verse's haze fades over the
  first bar of the drop. Hard cuts are for cinema; we have continuous
  fields.

**Transition window recipe.** Instead of branching on `u_section_id`,
compute a 4-bar overlap region:

```glsl
float boundaryNear  = 1.0 - smoothstep(0.0, 4.0,
    u_to_section_change * u_bpm / 60.0);  // last 4 bars of current
float boundaryAfter = 1.0 - smoothstep(0.0, 4.0,
    u_section_progress * sectionBars);    // first 4 bars of new
```

These two ramps overlap across the section boundary; cross-fade
section-A's rule with section-B's rule using their union. Boundaries
detected by audio analysis are not frame-perfect (~70% F-measure at
3 s tolerance per MIREX); a 4-bar overlap absorbs the slop.

## Pre-tension recipes

`u_to_section_change` is the future-aware uniform. Three concrete
moves:

**Squeeze before drop.**

```glsl
float toDropBars = u_to_section_change * u_bpm / 60.0;
float squeeze   = 1.0 - smoothstep(0.0, 8.0, toDropBars);
// 0→1 over last 8 bars
zoom    *= 1.0 + 0.4 * squeeze
                * float(u_section_id == /*build*/ 2);
satMul   = mix(1.0, 0.6, squeeze
                * float(u_section_id == 2));
// release at drop: another curve resets satMul to 1.2 then decays
```

**Anticipatory accumulation.** During a build, accumulate a counter
keyed to `u_section_progress`; release it on the drop's first
downbeat:

```glsl
float buildCharge = u_section_progress
                  * float(u_section_id == /*build*/ 2);
// at drop entry:
//   layerOpacity = mix(layerOpacity, max, buildCharge);
```

**Whitespace before payoff.** Counter-intuitive but effective: in
the last 2 bars of the build, *remove* a layer. The drop reintroduces
it at full strength. The fail mode of "build = pile more on" is what
makes drops feel like overflow rather than release.

## Per-stem patterns — voice assignment

Pick at most two stems. Recommended pairings: **bass + vocals**
(ground breathing + focal element) or **drums + other** (kinetic
accents + atmospheric base). Avoid bass + drums (they overlap
rhythmically — the piece reads as 1-D loud-quiet).

```glsl
// good: ground + focus
float groundBreath = 1.0 + 0.5 * u_audio_bass_stem;  // camera scale
float focalGlow    = pow(u_audio_vocals_stem, 1.5);  // bloom mask
// other / drums unbound — they exist in the FFT mix but don't have
// their own visual lane.

// bad: all four bound
brightness *= 1.0 + u_audio_drums_stem;
hueShift   += u_audio_other_stem;
zoom       *= 1.0 + u_audio_bass_stem;
maskPower  += u_audio_vocals_stem;
// every change is "the music is loud", every motion is correlated,
// no clarity.
```

When NOT to use a stem: when it's near-silent for most of the song
(many tracks have minimal "other"), binding to it produces dead
parameters. When two stems are highly correlated (kick on every
downbeat with a sub-bass pad), binding both is redundant — pick one.

## Key/chord as palette modulator

Subtle. `u_key_mode == 0` (major) keeps the warm palette default;
`u_key_mode == 1` (minor) cools highlights by 5-10%:

```glsl
float minorTilt = float(u_key_mode);          // 0 or 1
vec3 highlight  = mix(vec3(1.0, 0.9, 0.7),    // warm major
                       vec3(0.85, 0.85, 0.95) * 0.95,  // cool minor
                       minorTilt * 0.4);      // partial — never full cool
```

A modulation event (mid-song key change) is a transition cue: treat
it like a section boundary, cross-fade over 4 bars. `u_key_tonic`
(0..11) is rarely worth binding directly — it tempts you toward
12-color roulette, which fights the warm-palette rule. Use it only
if the song modulates by a perfect fifth or relative minor and you
want a single *consonant* palette nudge.

## Anti-patterns

- **Every-kick blink.** Brightness multiplied by `u_audio_bass`
  produces a heart monitor. The new pipeline allows worse: brightness
  bound to `u_audio_drums_stem * u_audio_kick * u_downbeat` — a
  triple flash on every kick. Cap flashes at 4 per bar. Anything
  else is spice budget overrun.
- **Section-blind reaction.** A piece that looks the same in the
  verse as in the drop has no composition; it's a reactive demo. The
  section-readability probe catches this.
- **Stem-clutter.** All four stems bound to four global modulators.
  No clarity, no voice. Pick two.
- **Lyrical literalism.** `brightness = u_audio_vocals_stem`. Reads
  as karaoke — the visual flickers on every syllable. Vocals deserve
  a *focal* lane (mask shape, glyph appearance), not a brightness
  ramp.
- **Flat arc.** A 6-minute piece with constant density. Use
  `u_song_progress` to schedule a peak (~0.65) and a trough (~0.85,
  before recap). The long-arc probe catches this.
- **Premature drop.** Visual goes to "drop state" early because
  `u_audio_bass` happened to spike at bar 7. Anchor drops to
  `u_section_id` / `u_downbeat`, not to amplitude.
- **No carryover.** Hard cuts at every section boundary; the
  cursor-driven field resets to zero each time. Viewer's anchor
  vanishes. Persist the things the viewer has been touching.

## Pass/fail probes (critic agent)

Parallel form to existing music probes; these are *song-scale*.

1. **Section-readability probe (frame-verdict).** Render 5+ frames
   at `u_song_progress` ∈ {0.05, 0.25, 0.45, 0.65, 0.85} — one per
   section centre. Without seeing the timeline, can a viewer guess
   which section each frame is from? **Pass** if 3/5 are
   unambiguously distinct. **Fail** if all five look interchangeable.

2. **Downbeat-anchored probe (shader-verdict).** Read the shader.
   List the structural events (palette flip, layer reveal, mode
   toggle). Are they keyed to `u_downbeat` / `u_bar_index` /
   `u_section_id` (composition) or to `u_audio_bass` / `u_audio_kick`
   (reaction)? **Pass** if ≥2 structural events use composition
   uniforms. **Fail** if every "big change" is amplitude-triggered.

3. **Pre-tension probe (shader + frame).** Shader: does the piece
   reference `u_to_section_change` or `u_section_progress`? Frame:
   render at 30s and 8s before a known drop. Are the frames visibly
   different (squeeze, desaturation, withholding)? **Pass** if both.
   **Fail** if `u_to_section_change` is unused.

4. **Per-stem-discrimination probe (shader-verdict).** Read the
   audio bindings. Are at least two distinct `u_audio_*_stem`
   uniforms used, and bound to *visually different roles* (not both
   modulating brightness)? **Pass** if yes. **Fail** if all four
   bound, or if all bound to the same parameter family.

5. **Long-arc probe (frame-verdict).** Render 12 frames at evenly
   spaced `u_song_progress`. Is there a visible peak/trough
   structure? **Pass** if the density/contrast curve has a clear
   maximum and a clear quiet moment. **Fail** if the curve is flat.

6. **Recapitulation probe (frame-verdict).** Compare the frame at
   `u_song_progress = 0.05` (intro) with `u_song_progress = 0.95`
   (outro). Are they recognisably related, with one visible delta
   (palette shift, layer added/removed)? **Pass** if related-with-
   delta. **Fail** if completely unrelated, or identical.

A piece should pass 4/6 to claim "song-aware composition". 2/6 or
fewer and the piece is reactive only — not yet using the new
pipeline.

## How to apply in V-Jaygent

**What the critic checks (added to `/vjay-iterate`):**

- Reading order #10 — `brainstorming/techniques/music-composition.md`
  (this file), conditional on `audio.analysis.json` being present in
  the piece dir AND the shader referencing any of the song-level
  uniforms (`u_section_*`, `u_downbeat`, `u_to_section_change`,
  `u_song_progress`, `u_audio_*_stem`, `u_key_*`).
- New "Song-level composition probes" section in the critique
  Markdown output, mirroring the existing music probes (per-frame)
  and the layered-composition probes. Threshold: 4/6 passes to claim
  song-aware composition.
- New `taste.md` lens addition: extended Music probes section to
  include the song-level probes, with a sub-header distinguishing
  per-frame from song-level.

**Lib helpers deferred (extract once first audio-aware piece ships):**

- `lib/audio.glsl` — `beatPulse(phase, sharpness)`,
  `downbeatPulse(...)`, `sectionMask(currentId, queriedId)`,
  `flashBudget(...)`, `crossfadeWindow(progress, toChange, bars)`.
  Wait until the first piece using these crystallizes; until then,
  recipes inline in piece shaders.

**Pieces that would benefit from retro-fit:**

- `in-seven` — already has a manual section-state machine; refactor
  to use the new `u_section_*` uniforms once an `audio.analysis.json`
  is generated for "Money".
- `chamber` — currently response-driven (no section state machine
  because the track has no song-structure). After analysis, the
  techno arrangement reveals build/drop boundaries; could
  selectively pre-tension on those.
- `breath` — Aphex Twin track; long arc currently does nothing
  about it. Recap probe would currently fail; intro-to-outro
  recapitulation would land naturally.

**Cross-references:**

- `brainstorming/techniques/music-to-shader.md` — extended in this
  same study with per-frame binding rules (clocks vs amplitudes,
  flash budget, per-stem etiquette). Read it first; this doc lives
  on top of it.
- `brainstorming/techniques/layered-composition.md` — the polyrhythm-
  of-clocks probe applies song-level too; e.g. one layer on
  `u_section_progress`, another on `u_beat_phase`, another on
  `u_audio_bass_stem`.
- `taste.md` §"Music probes" — extended.

## References

- Ryoji Ikeda, *Test Pattern* —
  <https://www.ryojiikeda.com/project/testpattern/>
- Carsten Nicolai (Wikipedia) —
  <https://en.wikipedia.org/wiki/Carsten_Nicolai>
- Robert Henke, *Lumière* —
  <https://roberthenke.com/concerts/lumiere.html>
- Robert Henke, Lumière interview (Ableton) —
  <https://www.ableton.com/en/blog/robert-henke-lumiere-lasers-interview/>
- Memo Akten, works — <https://www.memo.tv/works/>
- Caterina Barbieri, *Spirit Exit* —
  <https://caterinabarbieri.com/Spirit-Exit>
- Holly Herndon, *PROTO* at Barbican —
  <https://www.barbican.org.uk/holly-herndon-proto>
- Brian Eno, *Oblique Strategies* (Wikipedia) —
  <https://en.wikipedia.org/wiki/Oblique_Strategies>
- Steve Reich, *Music for 18 Musicians* (Wikipedia) —
  <https://en.wikipedia.org/wiki/Music_for_18_Musicians>
- Squarepusher (Wikipedia) —
  <https://en.wikipedia.org/wiki/Squarepusher>
- Ash Koosha, ICA interview —
  <https://archive.ica.art/bulletin/seeing-sound-interview-ash-koosha/>
- GNU Rocket sync-tracker — <https://github.com/rocket/rocket>
- Spotify Audio Analysis API (verify — endpoint deprecated 2026 but
  documentation persists) —
  <https://developer.spotify.com/documentation/web-api/reference/get-audio-analysis>
- Nieto & Bello, MSAF (ISMIR 2015) —
  <https://ccrma.stanford.edu/~urinieto/MARL/publications/NietoBello-ISMIR2015.pdf>
- MIREX 2025 Music Structure Analysis —
  <https://music-ir.org/mirex/wiki/2025:Music_Structure_Analysis>
- Demucs (facebookresearch) —
  <https://github.com/facebookresearch/demucs>
- Studiobinder, Roger Deakins cinematography —
  <https://www.studiobinder.com/blog/roger-deakins-cinematography/>
- PNAS, Music-color associations are mediated by emotion —
  <https://www.pnas.org/doi/10.1073/pnas.1212562110>
- Companion in this repo:
  `brainstorming/techniques/music-to-shader.md`,
  `brainstorming/techniques/layered-composition.md`,
  `brainstorming/techniques/polyrhythmic-motion.md`.
