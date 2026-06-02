# dopamine-split-brain-version

Madelline — *Dopamine (Split Brain Version)* — 165s, 136 BPM, D# minor.
6 sections, climax at 107–148s, energy peak 0.568.

## Decision

Two coupled Kuramoto-style phase fields, one per cerebral hemisphere.
The track's "Split Brain Version" subtitle is the thesis: two hemispheres
that drift in and out of synchrony — desynced in the verses, briefly
phase-locked on every downbeat, fused into one continuous field at the
climax (section 4), severed again at the outro.

The piece IS about the brain on dopamine: the song is the reward signal
that progressively forces hemispheric integration, and the fusion event
at the drop is the visible moment of unified consciousness.

## Brief gates (vjay-new-piece §1b + §1c)

```
canonical_ref: Kuramoto coupled-oscillator network
  (Y. Kuramoto, 1975 — phases φ_i evolving as
   dφ_i/dt = ω_i + Σ K·sin(φ_j - φ_i). Closed-form approximation per
   pixel: each hemisphere has a hex lattice of oscillators with its own
   natural frequency ω_side; cross-hemisphere coupling K(t) is gated by
   audio energy + downbeats + section state.)
eye_landing_candidates:
  - hex lattice of pulsing oscillators on the LEFT half (wine→mauve→cream)
  - hex lattice of pulsing oscillators on the RIGHT half (ember→amber→gold)
  - vertical SEAM at x=0.5 with horizontal lightning fires on downbeats
  - SECTION-4 FUSION EVENT (107-148s): seam dissolves, two grids interpenetrate
    into a moiré of mixed warm hues
warm_cycle: [near-black, ember, wine, mauve, amber, gold, cream]
  (cream-on-near-black contrast, NOT all-mid-warm — per
   feedback_warm_on_warm_collapse.md)
idle_behaviour: "Both hemispheres pulse on synthetic BPM clock (ω_L=2π·2.27Hz
  ≈ BPM, ω_R = 1.05·ω_L so the two sides slow-drift in/out of beat-aligned
  phase). With cursor: cursor is the corpus callosum — local coupling at
  cursor position bridges the two sides briefly. No frame is empty."
architecture: E
arch_rationale: "Multi-input coupling (audio + cursor + section state),
  multi-region composition (two distinct hemispheres + seam + post-fusion
  flash), layer-stack with at least 4 layers each with a distinct role.
  No persistent physics state needed — Kuramoto closed-form per pixel,
  hemispheres are pure functions of (uv, t, audio, section). Architecture
  C (passes) would be overkill; A (monolithic) would compress two
  hemispheres + seam into one shader and lose per-side palette isolation."
```

## Canonical-name check — Kuramoto oscillators

Textbook definition (Kuramoto 1975, *Lecture Notes in Physics* 39):
N phase oscillators with natural frequencies ω_i drawn from a unimodal
symmetric distribution, coupled by

    dφ_i/dt = ω_i + (K/N) Σ_j sin(φ_j − φ_i)

Below critical coupling K_c, the population is incoherent (random
phases). Above K_c, a macroscopic fraction phase-locks to a common
mean. The order parameter r = |⟨e^{iφ}⟩| jumps from ~0 to ~1 across K_c.

In this piece I model two POPULATIONS (left + right hemispheres) each
internally coherent (K_internal > K_c so each side is phase-locked
within itself) but with cross-population coupling K_LR(t) that varies:

- Verses (sections 0-2): K_LR ≈ 0 — populations incoherent across the seam
- Build (section 3): K_LR pulses on each downbeat — brief lock, then release
- Drop (section 4): K_LR > K_c sustained — full bilateral phase-lock (fusion)
- Outro (section 5): K_LR collapses back to 0 — severance

The closed-form approximation: I don't simulate Kuramoto's ODE; I prescribe
the phase field directly:

    φ(x, y, t) = ω_side(x) · t
               + noise_offset(x, y)
               + K_LR(t) · phase_other_side(mirror(x), y) * smoothstep

The phase-locking signature (brightness peaks aligning across the seam)
is the visible content. This is true to Kuramoto's *visible behaviour*
without simulating the ODE.

## Form decision — layer stack with 4 layers

1. **solid-warm** (global) — near-black warm vertical gradient base
2. **hemisphere-left** (piece-local) — hex lattice of oscillators on x<0.5,
   feathered into x>0.5 only during fusion. Palette wine/mauve/cream.
   ω_L = 2π · (BPM/60) · 0.5 = 7.13 rad/s (half-beat oscillation).
3. **hemisphere-right** (piece-local) — same hex lattice on x>0.5,
   ω_R = 1.05 · ω_L (5% detuned so they slow-drift in/out of sync).
   Palette ember/amber/gold. Rotated 60° relative to left so the two
   hemispheres are visibly different patterns even when phase-locked.
4. **callosum-seam** (piece-local) — vertical channel at x=0.5,
   horizontal lightning bolts on downbeats (corpus callosum firing),
   full-frame fusion bloom during section 4. Reads u_below for both
   hemispheres. Cursor near x=0.5 boosts local seam intensity.

## Library leverage

- `lib/math.glsl` — TAU, rot2d, PI for hex lattice rotations
- `lib/noise.glsl` — vnoise + fbm for the phase-offset field
- `lib/interaction.glsl` — vjMouseWorld for the corpus-callosum cursor
- `lib/tonemap.glsl` — reinhardPartial for the cream highlights

Palette stays inline per-piece (per VISION.md — phrasebook duplication).

## What I don't want

- Generic FFT bars on the seam. Not what this piece is about.
- A literal brain illustration (two anatomical lobes). The brain
  is the THESIS, not the IMAGERY. Hex lattices are abstract enough
  that the viewer reads "pattern" first, "brain" on reflection.
- Symmetric mirror image (left = exact mirror of right). The two
  hemispheres are DIFFERENT (different ω, different palette, different
  rotation) — that's the whole point.
- Cool teal "neural" colours. The piece stays warm — dopamine is
  amber/gold, not blue.
- Continuous-coupling sync that's always on. The desync → sync arc
  IS the piece. If both sides are always in sync, there's nothing to
  watch.

## Three timescales of liveness

(per `feedback_three_timescales_of_liveness.md`)

- **Sub-beat jitter** — phase noise at ~4 Hz so each oscillator
  jiggles even between beats; never frozen.
- **Beat motion** — each beat (136 BPM = 2.27 Hz) advances the global
  phase by ~π; oscillator brightness peaks pulse on the beat grid.
- **Section-boundary chaos** — at each section transition, K_LR
  briefly spikes (1.5×) for 0.5s, creating a "seizure" of coupling
  that releases into the next section's steady state.

## Macro composition envelope

(per `feedback_macro_composition_envelope.md`)

Each hemisphere has a slow-drifting macro brightness hotzone (period
~25s) so the squint reads a wandering light/dark composition, not a
flat hex texture. The two hotzones drift at slightly different rates
so the composition never repeats.

## Section vocabulary (not just re-shaded params)

(per `feedback_section_vocabulary_not_params.md`)

| Section | Range (s)    | Energy | Visual vocabulary                                  |
|---------|--------------|--------|----------------------------------------------------|
| 0       | 0.0 – 8.4    | 0.113  | Only LEFT hemisphere visible; right is dark.       |
| 1       | 8.4 – 35.8   | 0.222  | Both hemispheres dim; seam dark; K_LR = 0.         |
| 2       | 35.8 – 50.5  | 0.430  | Both hemispheres brighter; seam visible; K_LR=0.1. |
| 3       | 50.5 – 107   | 0.456  | Independent chaos; K_LR pulses on downbeats (0→0.4)|
| 4       | 107 – 148.7  | 0.568  | FUSION — K_LR > K_c sustained; seam dissolved.     |
| 5       | 148.7 – 165.5| 0.353  | SEVERANCE — fusion collapses; both fade to black.  |

## Open questions

- Will the hex-lattice silhouette read as a brain or just as "pattern"?
  Probably the latter from a cold open. That's fine — the title carries
  the thesis. The visual just has to be honest geometry.
- 60° rotational offset between hemispheres might create unintended
  axis alignment at certain angles. Verify in v1.
- Section-4 fusion: how complete should the bilateral merge be?
  Probably ~80% — leave a faint residual seam so the viewer can still
  read "this WAS two".

## Coupling DAG

```
solid-warm ─────────┐
                    │  u_below
hemisphere-left ────┤
                    │
hemisphere-right ───┤
                    │
                    ▼
              callosum-seam (reads u_below for both sides + cursor)
```

No publish/consume — the hemispheres don't share state, that's the
THESIS. The callosum-seam reads the composited u_below which already
has both hemispheres rendered side-by-side.
