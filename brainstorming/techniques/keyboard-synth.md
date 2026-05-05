# Keyboard-as-MIDI synth — convention for playable pieces

Research note. The studio runtime ships a 5-instrument MIDI synth that
listens for `a..l` (white keys) and `w/e/t/y/u/o` (black keys), routes
each note through ADSR + per-voice filter + per-voice convolver-reverb
send, and exposes the per-key envelope state as shader uniforms. Pieces
opt in by setting `keyboard_synth: true` in their `meta.yaml`. This note
is the reference for HOW the runtime exposes the synth, the shader
uniform contract, and the conventions for building interactive pieces
that compose well with the rest of the layer engine.

## Why now

Trigger: 2026-05-05 build of `pieces/keyboard` (a self-explanatory
"play the row" piece) and `pieces/stronger` (Daft Punk piece with
keyboard coupled into a 7-layer composition). Across the build,
Louis pushed for: black keys, octave shift, multiple instruments,
a looper, and a Shift+H controls overlay. All landed; this note
captures the resulting contract so the next interactive piece doesn't
re-derive it.

## The control surface

Every key is single-press, no modifiers (the runtime's keydown
handler explicitly skips when ctrl/meta/alt/shift is held).

```
      w   e       t   y   u       o          black keys (sharps)
    a   s   d   f   g   h   j   k   l        white keys (naturals)
```

| key | MIDI (octave 0) | role                 |
|-----|-----------------|----------------------|
| `a` | C4 (60)         | white                |
| `s` | D4 (62)         | white                |
| `d` | E4 (64)         | white                |
| `f` | F4 (65)         | white                |
| `g` | G4 (67)         | white                |
| `h` | A4 (69)         | white                |
| `j` | B4 (71)         | white                |
| `k` | C5 (72)         | white                |
| `l` | D5 (74)         | white                |
| `w` | C#4 (61)        | black between a-s    |
| `e` | D#4 (63)        | black between s-d    |
| `t` | F#4 (66)        | black between f-g    |
| `y` | G#4 (68)        | black between g-h    |
| `u` | A#4 (70)        | black between h-j    |
| `o` | C#5 (73)        | black between k-l    |

| meta-key | action                                                |
|----------|-------------------------------------------------------|
| `z`      | octave −12 semitones (clamped to −24)                 |
| `x`      | octave +12 semitones (clamped to +24)                 |
| `1`      | switch to instrument: organ                           |
| `2`      | pluck                                                 |
| `3`      | pad                                                   |
| `4`      | bell                                                  |
| (5)      | chip — the linter-added 5th preset (NES square wave)  |
| `[`      | looper cycle: empty → recording → playing → overdub …|
| `]`      | looper clear                                          |
| `Shift+H`| controls overlay                                      |

The synth implementation is at `studio/keyboard-music.mjs`. Voice
fan-out: each press creates two oscillators (per-instrument types
+ detune) → biquad lowpass → ADSR gain → both dryGain (master) AND a
per-voice wetTap → reverbSend → shared convolver. The per-voice
wetTap means switching instruments mid-chord doesn't retroactively
rewet held notes.

## Shader uniform contract

The runtime feeds two arrays into every layer's program (regardless
of whether the piece sets `keyboard_synth`; non-synth pieces see
zeros).

```glsl
uniform float u_keys[15];        // 0..1 envelope per key
uniform float u_key_event[15];   // 1.0 at press, decays per frame
```

Indices:
- `0..8` are white keys in order `a s d f g h j k l`
- `9..14` are black keys in order `w e t y u o`

Black keys have a half-position table for spatial layout — they
sit between specific adjacent whites:

```glsl
float halfPositions[6] = float[6](0.5, 1.5, 3.5, 4.5, 5.5, 7.5);
// Maps black key i (0..5) to a virtual white-key index between
// pairs (a-s) (s-d) (f-g) (g-h) (h-j) (k-l). Skips E-F and B-C
// (no black key in those slots, real piano).
```

Iterate over all 15 for full coverage:

```glsl
for (int i = 0; i < 15; i++) {
    bool isBlack = (i >= 9);
    float pos = isBlack ? halfPositions[i - 9] : float(i);
    // ... draw / sample at this position ...
}
```

Or `for (int i = 0; i < 9; i++)` for white-only behaviours. The
contract is intentional: black keys are appended after whites so
existing 9-uniform shaders (pre-2026-05-05) keep addressing whites.

## How to write a keyboard-reactive layer

Three patterns demonstrated by existing layers:

### 1. Radial beams (`layers/key-rays/`)

For each key, fan an angular position around the canvas; sustain a
beam at that angle while held, fire an inward "spear" on press
(driven by the `u_key_event[i]` decay).

```glsl
float keyAng = -PI + 0.35 + (pos / 8.0) * (TAU - 0.7);
float aDist  = abs(angDist(ang, keyAng));
float beamMask = smoothstep(beamWidth, 0.0, aDist) * smoothstep(0.45, 0.62, r);
col += tint * beamMask * u_keys[i];

// Press spear — leading edge travels inward as event decays
float spearR = mix(0.55, 1.05, 1.0 - u_key_event[i]);
float spearD = abs(r - spearR);
col += tint * smoothstep(0.05, 0.0, spearD) * u_key_event[i];
```

### 2. Per-key spike on a circular structure (`layers/mirror-bloom/`)

When the layer renders a circle/gear at radius R, add a bright
spike at the matching angular position for each held key. Lets the
piece's main visual element visibly "grow teeth" with chords.

```glsl
for (int i = 0; i < 9; i++) {
    float keyAng = -PI + 0.35 + (float(i) / 8.0) * (TAU - 0.7);
    float aD = abs(angDist(keyAng, ang));
    float spike = smoothstep(0.06, 0.0, aD)
                * smoothstep(0.018, 0.005, abs(r - 0.36))
                * u_keys[i] * 1.4;
    col += vec3(1.30, 0.80, 0.40) * spike;
}
```

### 3. Spawn-density modulation (`layers/flow-particles/`)

For particle / fluid layers, take `max(u_keys[*])` as a "any key
held" signal and use it to modulate spawn density, force strength,
or other field parameters. Lets keyboard input feel like a hand
on the system without competing with the per-key visual.

```glsl
float anyKey = 0.0;
for (int i = 0; i < 15; i++) anyKey = max(anyKey, u_keys[i]);
float spawnGate = 0.97 - 0.06 * anyKey;
```

## Self-explanatory checklist

The original `pieces/keyboard` piece is the convention for "this
piece teaches its own controls":

1. The piece's `notes:` field in `meta.yaml` spells out the key
   mapping in plain words — the studio's meta-overlay surfaces it.
2. Visual elements at each key's position (orbs, beams, spikes)
   give a one-to-one spatial mapping.
3. Idle behaviour invites interaction — `pieces/keyboard` has the
   9 white-key orbs breathe in sequence so the row reads as
   "ready to play".
4. `Shift+H` opens the full controls overlay regardless of piece —
   pieces can rely on it as a fallback.

## Anti-patterns

- **Hard-coding `u_keys[9]`.** Use 15 unless you're sure you don't
  want black keys. Mismatched array sizes are silent compile
  failures or, worse, sample garbage.
- **Single-letter shortcuts that conflict with note keys.** `h`,
  `c`, `r` are studio-level shortcuts. The runtime's keydown
  handler suppresses them when `keyboard_synth: true`, but other
  layer authors should avoid using these letters as note triggers
  on non-synth pieces.
- **Visual-only keyboard reactivity with no audible payoff.**
  Pieces that read `u_keys` but don't set `keyboard_synth: true`
  produce silent visuals — confusing for the user. Either set the
  flag or document the silence.
- **Beat-flash on every key press.** The flash budget (≤4
  flashes/bar from `music-to-shader.md`) applies to keyboard
  events too — a chord that flashes 6 keys at once eats the
  whole bar's budget.
- **Looper without a visible state indicator.** The `Shift+H`
  overlay shows looper state; pieces that visualise the looper
  should also surface it (a recording dot, a phase indicator).

## Probes for the critic (proposed)

To be promoted to `taste.md` once a second keyboard piece ships:

- **Self-explanatory probe:** Can a cold viewer discover the key
  mapping within 10 seconds and 3 presses, without the help
  overlay? Frame + interaction.
- **Per-key visual probe:** Pressing key i produces a visibly
  distinct effect from pressing key j? Or do they all look the
  same? Shader-verdict on the layer's `u_keys[i]` usage.
- **Octave-shift probe:** z/x produces a perceptible audio change
  AND optionally a visual cue? Shader-verdict + audio test.
- **Looper probe:** A 4-bar phrase recorded and played back loops
  cleanly with no gaps, drops, or doubled events?
- **Multi-key probe:** Holding 3 keys simultaneously shows all
  three contributions distinctly, not just the dominant one?

## See also

- `studio/keyboard-music.mjs` — synth implementation + looper +
  octave/instrument state.
- `studio/runtime.mjs` — keydown/keyup wiring, ZERO_KEYS array,
  per-frame `u_keys` / `u_key_event` setUniform1fv calls.
- `pieces/keyboard/` — minimal self-explanatory piece.
- `pieces/stronger/` — keyboard-synth in a 7-layer composition.
- `brainstorming/techniques/audio-cursor-together.md` — same dual-
  input philosophy applied to cursor + audio. Adding keyboard
  makes it a triple-input piece.
- `brainstorming/techniques/music-to-shader.md` §"Flash budget" —
  applies to keyboard flashes too.
