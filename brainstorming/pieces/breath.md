# breath

## Thesis

A piece that answers VISION's open question: *Dynamic range downward. Pieces
that respond to silence as forcefully as they respond to peaks.* Set to Aphex
Twin's `aisatsana [102]` — the solo-piano closer of Syro — the field stays
genuinely dark between notes and blooms softly on attack, then cools back to
near-black. The piano's own envelope (attack-sustain-decay) is the animation
curve. Silence is not the absence of the piece; it's part of its pulse.

## Form candidates

1. **Heat diffusion on a ping-pong rgba16f.** Audio bands deposit radiant
   energy at band-specific positions on a 2D field. The Laplacian kernel from
   `lib/diffusion.glsl` does the only physics. A global decay term pulls the
   field toward zero each step, so silence = genuine black, not a held static
   image. `ferment`'s runtime proves this shape already works.
2. **Multi-octave fBm of time + space with per-octave time decay.** No
   multipass. Cheaper. But it can't actually *cool* — the field can only scale
   down, never localise energy. Fails the "response to silence" ask the moment
   you hit pause and the field stays populated.
3. **N recent impulses with closed-form Gaussian bloom.** Maintain a ring
   buffer of the last ~16 attack events on CPU, upload as a uniform, each
   fragment sums `amplitude * exp(-r²/(σ(t−tᵢ))²) * exp(−(t−tᵢ)/τ)`. Elegant,
   stateless on GPU. Cost: CPU-side attack detection (peak-finder on the
   audio-band stream) and a uniform array. Feasible but I'd be writing the
   peak detector myself.

Form 1 wins. The physics is real, the silence is earned (global decay, not
cosmetic fade), and ferment proves the pipeline. Form 3 is genuinely elegant
but spends complexity on CPU-side attack detection that doesn't pay off —
the visual is indistinguishable from Form 1 to a viewer, and Form 1's
physics is honest to the "radiation through a medium" metaphor the piano
keeps inviting.

## What I don't want

- **Note-to-shape literalism.** No visible keys, no expanding circles that
  map 1:1 to pitches. The piano is the *cause*, not the *subject*.
- **Perfect symmetry.** `aisatsana` is not a rigid piece — it breathes in the
  performance. No D_n kaleidoscope, no radial `atan` tricks. Field geometry,
  not stamped geometry.
- **Spectrum bars.** FFT bars are explicitly banned by VISION and would
  be the lazy answer to an audio piano piece. Never.
- **Loop with no end.** The track has an end. The field should flash once at
  the last note and die to black — a composed ending, not a cut.
- **Color rescue when the image goes dark.** The first half of this piece
  (and many quiet sections) must tolerate being 80%+ near-black. That's the
  piece working, not a bug to patch.

## Form I'm committing to (lib leaning)

Multipass with `laplacian4` from `lib/diffusion.glsl`, `reinhard` from
`lib/tonemap.glsl`, and a bespoke ember palette inline in `shader.frag`.
`noise.glsl` on the sim side to give the decay a touch of spatial jitter so
it doesn't diffuse into boring Gaussian blobs. No billiards, no SDF.

## Bindings sketch (to be tuned against actual audio)

- `u_audio_bass` → energy source in lower third of screen (left-hand chord
  region). Larger spatial footprint, slower decay constant.
- `u_audio_mid` → energy source in middle band. Medium footprint.
- `u_audio_high` → energy source in upper third (right-hand figures).
  Smaller footprint, shorter decay so high notes twinkle and fade fast.
- `u_audio_time` drives a very slow left-right pan of source x-position so
  the piece doesn't accumulate all energy in a single column.
- `u_audio_playing == 0` → pure decay (no new sources). The ending handles
  itself.

## Arc (track-time gated)

- **0-40s**: sparse single notes — field barely accumulates, mostly black,
  occasional slow blooms at low y.
- **40-180s**: core — more frequent notes, field holds more warmth but
  still recedes between phrases. This is where the piece sells the
  dynamic-range-downward thesis.
- **180-280s**: denser section — field saturates more, but Reinhard keeps
  peaks warm, not clipped.
- **280-322s**: sparse again, last notes, natural fade to black on `u_audio_playing == 0`.

No section state machine needed — just trust the music. If the track goes
quiet, the field goes quiet. That's the whole point.

## Open questions (will know after rendering)

- Does 8 iterations per frame at `scale: 0.5` give enough diffusion for notes
  to *visibly* bloom within a frame, or do the sources accumulate into
  spots that refuse to die?
- Does the bass source at low-y actually register given that
  `aisatsana [102]` is mostly middle-register piano with sparse left-hand?
  Might need to re-bias which band deposits where based on the first
  rendered pass.
- How much spatial jitter on the source position is too much? Zero is
  boring; a lot would turn the piece into a starfield.
- Global decay rate: too fast and the piece reads as strobes; too slow and
  silence never actually arrives. Start at ~0.02 per sim-step, tune from
  v1 critique.
