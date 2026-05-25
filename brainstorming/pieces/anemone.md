# anemone

**Thesis.** Newton's method on `p(z) = z^n − 1` is the canonical
n-fold symmetric Wada fractal — n basins arranged on the unit circle,
boundary an infinite bead-chain. Drive **continuous (float) `n`** from
the music (section base + smooth ramp + bass stem + tiny per-beat
wobble): n tendrils unfold and fold over the song's structure on a
~30-60s timescale. The whole fractal continuously **rotates** (slow
drift + per-bar advance + beat wobble), the **palette continuously
rotates** with multi-stem music drivers (no discrete jumps), and a
**water-droplet warp** ripples through the field on each downbeat,
bending the fractal beneath rather than overlaying a stroke. Keyboard
overrides `n` — each of 15 keys plays a specific value, a fractal-
shape sequencer.

**Renamed from `rosette` (2026-05-26)** after Louis flagged the static
slideshow feel of the integer-n version. anemone — sea anemone, n-fold
radiating tendrils undulating in water — captures the current piece:
flowing, continuously morphing, water-rippled.

Third piece in the basin/fractal series — see
`brainstorming/inspirations/anemone-refs.md`.

## Decision

Build it. Single-pass monolithic shader (architecture A). Per pixel:
compute z^n and z^(n−1) by iterated complex multiplication (n − 1
cmuls), Newton-step `z -= (z^n − 1) / (n · z^(n−1))`, classify by
nearest root of unity (`floor(arg(z) · n / 2π + 0.5) mod n`).

**Lessons from watershed + shoal applied at the brief stage:**
- Newton, not integrated dynamics — proven crisp basin medium.
- Animate the landscape — `n` changing IS the landscape animation
  (per `feedback_animate_the_landscape`).
- Bar/beat geometric phase-lock from the analysis JSON (per
  `feedback_visual_phase_lock`).
- Three timescales of liveness: song-section n-drift (macro),
  per-bar hue rotation + per-downbeat n-snap (meso), sub-beat
  shimmer (micro). All present.

## Brief gates (vjay-new-piece §1b + §1c)

```
canonical_ref: "Newton fractal on z^n − 1 — Recipe 2 of
  basins-of-attraction.md; the canonical n-fold-symmetric Wada
  fractal. The 'roots of unity' fractal."
eye_landing_candidates:
  - the n bright basin lakes (one per root of unity)
  - the crisp bead-chain Wada boundary between basins
  - the central region where all basins meet (the n-tipoint)
  - the per-downbeat n-snap event (geometry SNAPS to new topology)
warm_cycle: [near-black, wine, ember, amber, gold, cream]
idle_behaviour: "with no audio, n stays at 3 (the iconic z^3 − 1
  Newton fractal). With cursor and keys also idle, the rosette
  drifts only on the slow bar-phase hue rotation. With the track
  playing, n cycles 3 → 10+ through the build and snaps on each
  downbeat — the fractal counts the music."
architecture: A
arch_rationale: "A — single-pass per-pixel. Each pixel runs Newton
  on z^n − 1 to convergence. Not C (passes): the shoal lesson —
  amortization makes a piece ungradeable from headless stills, and
  Newton is cheap enough to recompute crisp every frame even with
  z^n via n-1 cmuls per iteration."
```

## Canonical-name check

**z^n − 1 has n roots:** `r_k = exp(2πi · k / n)` for k = 0 … n−1.
They sit equally spaced on the unit circle. Newton's method
converges to whichever root is nearest in basin terms; the basin
boundary is a Wada set (with n ≥ 3) — every point on a basin
boundary borders all n basins. This is the iconic "Newton fractal"
in its purest form. With n integer ∈ {3, …, 11} we get distinct,
mathematically-clean fractals; the visual at n = 3 is the most
famous Newton image; at n = 11 it's a delicate 11-fold rosette of
fine bead-chains.

## Audio + interaction bindings

- **`n` (the central parameter)** — quantized from audio:
  `n_target = 3 + 5 · u_audio_level + 2 · u_downbeat + 1.5 ·
   u_audio_bass_stem`, rounded to integer, clamped [3, 11].
  Snaps with energy; downbeat adds a momentary +2 spike.
- **Keyboard override:** if any key is pressed, n = the held key's
  index + 3 (so key 0 → n = 3, key 14 → n = 17, clamped). Disjoint
  from audio (per the dual-input recipes) — keyboard takes priority.
- **Cursor:** pans the view of the complex plane. `view_offset =
   vjMouseWorldOrZero(u_mouse) · 0.7`. Idle = view at (0, 0) with
  the unit circle centred.
- **Bar hue rotation:** the basin hue rotates by `u_bar_phase / n`
  per bar — one segment per bar, snapped at the bar boundary.
  Visible song-level geometric phase-lock per `feedback_visual_phase_lock`.
- **Sub-beat shimmer:** vnoise modulated by `u_audio_high`.
- **Beat pulse:** luminance briefly brightens on each beat
  (`exp(-u_beat_phase · 6)` factor).

## What I don't want

- Smooth interpolation between integer n's. The snap IS the
  geometric event the downbeat probe rewards.
- A cool palette (the typical "Newton fractal" image uses HSV
  rainbow — not for V-Jaygent; map basin index into the warm ramp).
- Per-pixel cost spiraling at n = 11. 11 cmuls × 36 iter × 921k px
  × 0.44 = ~800M ops/frame. Tune render_scale or cap iter if needed.

## Open questions

- The n-snap on each downbeat — clean geometric event, or flicker?
  Watch the inspect-music frames.
- Hue rotation by `u_bar_phase / n` — when n changes (between bars),
  does the rotation re-anchor smoothly?
- At n = 11, basin colors are 11 hues across the warm ramp — do
  adjacent basins read distinct? If not, fewer-but-bigger basins
  may be visually stronger (cap n at 8 or 9).
