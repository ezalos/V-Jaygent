# 18 — Audio mapping beyond bass=strength

## summary
Bass→field-strength is the obvious mapping and also the boring one.
Five higher-leverage drivers: phase-locked spike snap on downbeat,
Chladni standing-waves from FFT envelope, high-freq capillary chop,
section-state topology shift, cursor as roving magnet. Each maps to
a concrete uniform V-Jaygent already exposes.

## why_mesmerizing
The 11-probe layered-coupling rubric calls for *visible phase-lock*:
geometry must announce the bar/beat/section, not just brighten with
amplitude. The ferrofluid blob's signature affordance — the silent
erupt — is wasted if it's a continuous bass-follower. Snap it to the
downbeat. Make sections topologically distinct, not just louder.

## concrete_steal
Five drivers, ordered by impact on the hypnosis probes:

1. **Phase-locked spike snap (downbeat → perfect hex → defect drift).**
   Driver: `u_downbeat` (impulse) + `u_section_progress` (0..1 within
   section). On `u_downbeat == 1`, instantly set
   `lattice_order = 1.0` (perfect hex). Then decay over the bar:
   `lattice_order *= exp(-u_section_progress * decay_k)`. Defects
   are injected by sampling a low-freq noise scaled by
   `(1.0 - lattice_order)`. Visual: bar starts crisp, ends melted.
2. **Chladni standing-waves from FFT envelope.** Driver: 8-band
   spectrum `u_audio_fft[8]`. The two strongest bands' indices pick
   `(m, n)` for `cos(m*pi*x) * cos(n*pi*y) - cos(n*pi*x) * cos(m*pi*y)`.
   Add as a height perturbation to the ferrofluid skin (NOT the body
   SDF). Amplitude scaled by mid-band energy. Reads as
   "nodal lines on the surface" — the eye locks on them.
3. **High-freq capillary chop.** Driver: `u_audio_high`. Drives a
   curl-noise normal perturbation (item 17 #4) at `~80px` wavelength.
   Amplitude must stay subtle; this is the texture layer, not the
   shape layer. Hi-hat hits show up as scintillation, not bumps.
4. **Section-state topology shift.** Driver: `u_section_id` (int 0–7).
   This is THE big one. Per-section discrete topology, not amplitude:
   - 0 ambient build: flat puddle, near-zero spike count
   - 1 groove: hex-7 cluster, one bar = one snap
   - 2 groove2: hex-19, two snaps per bar
   - 3 5s breakdown: spikes collapse to single droplet (item 13 pinch-off)
   - 4 drop: full hex-37, downbeat snaps + cursor magnet active
   - 5 peak: lattice + radial-secondary mode, double-snap polyrhythm
   - 6 outro: lattice melts via item 13 drumhead recoil only
   - 7 fade: surface goes glassy, single ripple per beat
   Implement as a switch over `u_section_id` in the field-shaping pass.
5. **Cursor as roving magnet.** Driver: `u_mouse` + cursor velocity
   `(u_mouse - u_mouse_prev) / dt`. The cursor is a *second*
   magnetic source added linearly to the field: spikes lean toward
   it, lattice defects flow as it moves (item 16 #3). Strength
   scaled by `u_audio_bass * 0.4` so cursor feels charged when
   the music is charged.

## glsl_path
- Lattice order + downbeat snap: field-strength driver pass; one new
  uniform `lattice_order` derived per-frame on CPU and passed in.
- Chladni: lib/`chladni.glsl` (new, ~10 lines). Called from the
  skin-displacement pass.
- Capillary chop: lighting pass, normal perturbation.
- Section topology: dispatch in the field-shaping pass. Make `u_section_id`
  a hard switch, not a lerp — sections must announce themselves.
- Cursor magnet: existing field pass; add `u_mouse` as second source.
- Keyboard `u_keys[15]` / `u_key_event[15]`: each key becomes a
  pinned secondary magnet at a fixed canvas position (15 keys =
  15 anchor points on a horizontal arc). Held key = static spike;
  key event = instantaneous local snap. (Bonus driver — covers the
  per-layer interactivity audit lesson.)

## caveats
- `u_downbeat` MUST be an impulse (single-frame edge), not a
  continuous beat-phase. Verify in `audio.analysis.json` schema.
- Chladni `(m, n)` from FFT can flicker between adjacent bands —
  add a 2-frame hysteresis or low-pass.
- Section-topology hard switch is the right call but transitions
  read as cuts unless you drive a 200ms cross-fade *of the field*,
  not the geometry. The skin should re-form, not teleport.
- Cursor magnet at full bass strength fights the music's downbeat
  snap. Cap cursor field at ~40% of total to keep music in charge.

## references
- V-Jaygent uniform conventions:
  `brainstorming/techniques/using-lib.md` (audio analysis JSON schema)
- [Chladni Pattern — Shadertoy](https://www.shadertoy.com/view/WdKXRV)
- [Microphone Audio Chladni Patterns — Observable](https://observablehq.com/@jonhelfman/microphone-audio-chladni-patterns) — FFT-driven (m,n) selection
- [chladni-mobius — GitHub](https://github.com/Santideva/chladni-mobius) — audio→Chladni shader pipeline
- V-Jaygent project memory: `feedback_visual_phase_lock.md`,
  `feedback_per_layer_interactivity.md`,
  `feedback_multi_layer_multi_input_default.md`
- Cross-ref: `brainstorming/techniques/music-to-shader.md`,
  `audio-cursor-together.md`, `keyboard-synth.md`,
  `polyrhythmic-motion.md`
