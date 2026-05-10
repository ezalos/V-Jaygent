# ferrohands — interactive fingers, true ferrofluid

## Decision

Multi-pass `passes:` piece. rgba16f ping-pong height field driven by
**up to 8 simultaneous magnetic dipoles, one per finger**. Closed brief
— no audio, no keyboard, no extra layers. The canonical phenomenon is
the **Rosensweig (normal-field) instability** of a ferrofluid; the
canonical interaction is "the audience's hand IS the magnet."

Slug: `ferrohands` — distinguishes from the existing single-cursor
`ferrofluid` piece, evokes the multi-touch grip.

## Thesis

A real ferrofluid puddle responds to a hand-held magnet by erupting
into a hexagonal forest of upward spikes wherever the field is
strong enough; relaxes back to mirror-flat where it isn't. With a
phone, the hand IS the magnet — and a phone has 8+ simultaneous
fingers. Each finger pulls the fluid up into spikes at its tip,
spike anisotropy interferes between adjacent fingers, the surface
between them sags into the sum-of-fields. A two-finger pinch is a
magnetic bar; a five-finger spread is a corona of spikes. The piece
reads as a ferrofluid that the viewer is physically *holding*.

## Canonical-name check (MANDATORY for closed briefs)

**Rosensweig instability** (Cowley & Rosensweig, 1967) — ferromagnetic
fluid in a vertical magnetic field forms a regular pattern of
peaks/cones above a critical field strength `H_c`. Linear stability
analysis gives:

- Critical wavenumber `k_c = √(ρg/σ)` (capillary length scale)
- Critical field `H_c² = (2/μ₀) (1+1/μ_r) √(ρgσ)`
- Above threshold: hexagonal lattice of cones (subcritical pitchfork
  bifurcation)
- Spike amplitude grows ~ √(H² − H_c²) near threshold

**Driving force.** Magnetic body force on the fluid is `f = μ₀ M·∇H`
— fluid is pulled UP the field-strength gradient. Surface deforms
where field-energy density `(1/2) μ₀ H²` competes with surface
tension `σ ∇²h` and gravity `ρg h`.

**Canonical implementation in shader** (per the existing `pieces/ferrofluid`):

  ∂h/∂t = D ∇²h − G h + α ‖B‖² − β h³

Where:
  - D ∇²h     — surface tension (Laplacian smoothing)
  - −G h      — gravity (linear restoring force)
  - α ‖B‖²    — magnetic forcing (field-energy density)
  - −β h³     — cubic damping (caps spike amplitude, gives
                supercritical-pitchfork-flavour saturation)
  - B(p)      — sum of dipole fields from all active fingers

This IS the canonical reduced model — Cowley-Rosensweig with
field-energy as the proxy for `M·∇H` (since for paramagnetic
linearisation `M ∝ H`, `M·∇H ∝ ∇H² = ∇‖B‖²`, integrate to
get `‖B‖²` as effective potential).

## What's different from the existing `pieces/ferrofluid`

| Existing `ferrofluid` | New `ferrohands` |
|---|---|
| Single cursor dipole + 3 procedural idle dipoles | Up to 8 finger dipoles via `u_touches[8]`; 3 procedural idle dipoles only when `u_touch_count == 0` |
| Dipole moment vector rotates on `u_time` | Each finger's moment vector rotates on (u_time + finger_index_phase) so adjacent fingers don't lock in phase |
| Strength scaled by `u_audio_bass` | No audio. Strength scales by finger age (u_touches[i].z) — fresh touches punch harder, settles to baseline |
| 30s loop | 60s loop (gives the headless inspect more variety) |

Same lib (`dipole.glsl`, `diffusion.glsl`, `tonemap.glsl`).
Same palette family (ember → wine → mauve → near-black).
Same two-pass architecture (sim + display).

## Form candidates considered

1. **Multi-pole dipole sum** (chosen) — physical, scales to 8 fingers
   cleanly, each finger has both attraction (low-field bowl) and
   spike formation (high-field crest), reads as "magnetic field of
   moving poles." Reuses existing lib, low risk.

2. **Per-finger monopole + spike-as-noise** — simpler field math
   (radial fall-off), spikes via noise modulated by field strength.
   Cheaper but misses the dipole anisotropy that makes ferrofluid
   spikes look like *spikes* and not *dimples*. Rejected.

3. **Per-finger heat source on a Stam-fluid velocity field** — would
   give convection rolls between fingers, very pretty but stops
   being ferrofluid (becomes lava-lamp). Off-brief. Rejected.

## What I don't want

- Spike-amplitude visibly dropping to zero away from the cursor when
  a finger is active. The substrate must always be alive — the
  Cowley-Rosensweig threshold means even ambient field gives some
  surface texture.
- All 8 fingers reading as identical poles. Stagger phase + rotation
  speed by finger index so a five-finger chord shows visible rhythm
  variation.
- The "swarm" / "boids" failure mode: shipping at 2fps because the
  inner loop is naive O(N) per pixel. With N=8 and one per-finger
  `dipoleEnergy()` call inside the sim shader, the cost is bounded
  — verify in inspect FPS.
- Bleeding-out palette at peaks (the `fire = u_below*gain` failure).
  Reinhard tonemap + `pow(0.90)` gamma per house style.

## Open questions

- Will 8 simultaneous fingers cause numerical blowup? The existing
  `E_CAP = 6.0` clamp and `BETA*h³` damping should handle it, but
  worth checking with a 5-finger inspect frame.
- Should freshly-pressed fingers (`u_touches[i].z < 0.3s`) get a
  boosted strength so taps register as discrete events? Try yes first
  — adds rhythm to a multi-tap.
- Headless inspect: 0 touches → fall back to 3 Lissajous orbiters
  (same as existing `ferrofluid`). Confirm orbits don't visually
  collide with active-finger frames in the critique.

## Architecture

`passes:` (mutually exclusive with `layers:`).

  Pass 1 — `simulate`  : sim.frag, rgba16f ping-pong @ scale 0.5,
                         8 sub-iterations per frame, holds h in .r,
                         slow-tension echo in .g, |B|² in .b for
                         display use.
  Pass 2 — `display`   : shader.frag, samples sim, gradient-to-normal,
                         Lambertian + specular + rim, ember palette.

Touch input flows through `u_touches[8]` + `u_touch_count` directly
into the sim pass. No publish/consume between passes (single field).

## Critic probes that gate this piece

Cursor (touch) probes — must pass 5/7 to claim "cursor as instrument":
  1. Composition differs across touch positions ✓ (field re-shapes)
  2. Idle: still mesmerizing with no touches ✓ (3 Lissajous orbiters)
  3. Readability: touch a spike, see a spike grow ✓ (direct map)
  4. Reversibility: lift finger → spike relaxes (yes, with trail decay)
  5. Dominance: touches don't drown the field ✓ (idle field always on)
  6. Convention: touch = pull toward you, intuitive ✓
  7. Latency: spike visible within ~3 frames ✓ (sub-stepped sim)

Mesmerizing probes — must pass 3/5 to ship:
  - Eye-landing: spike crests catch specular, eye lands on them
  - Prediction: spikes form predictably under fingers, but
    inter-finger interference is unpredictable
  - Squint: bright crests + dark troughs survive squint
  - Hue-drift: ember palette ramps over height — implicit drift
  - Mystery: where exactly does a spike form between two fingers?
    Linear field theory says "at the field-energy maximum" but
    visually it's not obvious — that's the mystery

Structure honesty: claim is "Rosensweig spikes". Must show
hexagonal-ish crest pattern under a single finger. Verify in v1.
