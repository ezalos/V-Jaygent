# Ferrofluid v4 — design brief synthesized from the 18 research items

## The single biggest finding

The current piece (and v3) fails because **it's procedural, not physical**.
A 14-spike sin-lattice in θ-space cannot fake the things that make
real ferrofluid mesmerizing — *response time*, *dispersion*, *defect
drift*, *self-amplification*. Multiple agents converged independently
on this: the visual contract is a **state-bearing height field on
ping-pong rgba16f**, not procedural noise. The spikes must EMERGE
from a numerical instability driven by music; they cannot be drawn.

## The load-bearing visual contract

A near-perfect black silhouette pierced by hard specular slivers.
Specifically:

- **Body**: `vec3(0.012, 0.008, 0.006)` — almost black, hint of warm.
  No emissive, no subsurface, no inner glow, no fire, no chrome.
- **Specular**: warm sodium-orange (`vec3(1.00, 0.55, 0.18)` env key)
  contributed only via Fresnel. Color comes from the *environment*,
  never the fluid. Tight `pow(...,64-80)` exponent.
- **Apex highlight kill** — real spikes are MATTE BLACK at the tip
  because field-aligned nanoparticles scatter rather than mirror.
  Specular peaks 30° off-axis on the spike *flank*, never the apex.
  This is the move people get wrong on every CGI ferrofluid.
- **Camera**: wide static. Blob is 35–55% of frame, never zoomed.
- **No bloom on body**, only on tips. Bloom on body = glowing sphere.

This is the Sachiko Kodama discipline. Every "fire sun" reading in v1-v3
came from violating it.

## Physics

Two coupled ping-pong fields:

### sim_field (`rgba16f`, scale 0.5)
Magnetic potential `phi(p, t)` from sources: cursor (always-active,
cap at 40% of total so music stays in charge), kick impulses,
downbeat radial pulse, audio_bass-driven central source. Diffuses
via 5-point Laplacian, decays at .985 (half-life ~1.4s). Gradient
cached in `.gb`.

The cursor IS the magnet. This is the brief's defining interaction.

### sim_height (`rgba16f`, scale 0.5, **4 sub-steps/frame**)
Verlet wave-PDE on the surface height `h(p, t)`:

```
∂²h/∂t² = G·∇²h + S·∇⁴h − γ·∂h/∂t − M·∇²h + F_body(field)
```

- `G ≈ 0.20` — gravity-like restoring
- `S ≈ 0.04` — capillary biharmonic (**load-bearing for dispersion**;
  without this, all wavelengths travel at the same speed and the
  magic dies)
- `γ ≈ 0.006` per sub-step — viscous decay, half-life ~600ms (~beat
  period at 123 BPM, so spikes overlap and never settle to flat)
- `M = music_bass_envelope` — magnetic destabilizer. When M crosses
  threshold (~`G + 2·sqrt(S·rho·g)` equivalent), small wrinkles
  grow without bound — clamp `h` to ±0.5 with `tanh()` saturation
- `F_body` — Kelvin body force `μ₀ M ∇H` from sim_field's cached
  gradient. Spikes always point at the magnet (cursor). Apply via
  `tanh(H/H_sat)` saturation so bass drops don't blow the buffer.

**Hex-favoured forcing**: at periodic intervals (locked to downbeat),
inject a small impulse aligned with three plane waves at 0°/60°/120°
with wavenumber `k_c = 2π / λ_c`, `λ_c = 0.10 · canvas_height`. The
height-field PDE then naturally selects this wavelength because it's
near the dispersion minimum. The lattice grows — defects form when
energy exceeds.

### display (`screen`)
Reads height `h` and field gradient. Computes:

1. **Normal** via 4-tap central differences:
   `n = normalize(vec3(-dh/dx, -dh/dy, strength))`. Strength tuning:
   `texel.x · 8.0`.
2. **Tangent** for Kajiya-Kay: project `+up` onto tangent plane,
   NOT gradient (gradient gives barber-pole stripes — known bug).
3. **Body**: matte black `(0.012, 0.008, 0.006)`. No diffuse worth
   speaking of.
4. **Kajiya-Kay primary specular**: line highlight along axial tangent.
   `sin(angle_T_L) · sin(angle_T_V) − cos(...)·cos(...)` formulation,
   `pow(...,80)`.
5. **Marschner-tilted secondary**: shifted tangent by 5° normal
   component, exponent ~30, weight 0.5. Sells the wet metallic look.
6. **Apex kill**: `spec *= 1.0 - smoothstep(0.85, 1.0, dot(N, field_dir))`.
7. **Curvature-gated iridescence** (warm-only, 540-650nm cosines —
   gold/amber/copper, NO blue/violet):
   `iri *= smoothstep(0.6, 0.95, |∇h|)`. Amplitude cap 0.15. Adds
   the cosmetic-toy "wet" reading.
8. **Screen-space refraction** (thin-slab single-tap, optional):
   `uv + n.xy · thickness · (1/IOR − 1)`, sample dim warm background.
9. **Tip boost** via `pow(h/h_max, 4.0)`, scales spec on peaks.
10. **Always-on attention anchor**: warm dim core at center, radius
    pulses 0.18 + 0.02·sin(0.3·t). The eye's home base.

## Polyrhythmic timescales (mandatory)

Stack four bands additively into the magnetic forcing:

| band            | freq   | amplitude | binds to               |
|-----------------|--------|-----------|------------------------|
| section_drift   | 0.3 Hz | 0.40      | u_section_id (topology)|
| body_breath     | 2 Hz   | 0.30      | u_audio_bass (RMS)     |
| spike_erupt     | 10 Hz  | 0.40      | u_audio_kick (impulse) |
| capillary_chop  | 30 Hz  | 0.10      | u_audio_high (RMS)     |

Amplitudes inverse to frequency. Wrong audio→band binding is worse than
no binding (hi-hat on slow drift looks broken).

## Section topology (Kodama vocabulary)

Each section has a *qualitatively different* surface state, not just
"more amplitude":

- 0 (0–62s): **soft fluid** — flat puddle, drumhead wobble only
- 1 (62–94s): **moss** — many tiny spikes (h≈0.02, density >50)
- 2 (94–230s): **shark's teeth** — classic Rosensweig hex (h≈0.15)
- 3 (230–235s): **breakdown** — single droplet, hex collapses
- 4 (235–297s): **drop** — full hex-37 bloom, downbeat snap audible
  in geometry
- 5 (297–362s): **iron / tower** — single climactic central spike
  locks to bar, secondary lattice around it
- 6 (362–472s): **cooling** — lattice melts via drumhead recoil
- 7 (472–476s): **glassy** — surface goes still, single ripple per
  beat to fade

State transitions cross-fade the FIELD over ~200ms, not the geometry.
The skin should re-form, not teleport.

## Audio mapping (beyond bass=strength)

In priority order:

1. **Phase-locked snap**: on `u_downbeat == 1`, set `lattice_order`
   to 1.0 (perfect hex). Decay over the bar via
   `lattice_order *= exp(-u_section_progress · k)`. Defects injected
   from low-freq noise scaled by `(1.0 − lattice_order)`. **Bar
   starts crisp, ends melted** — this IS the visible phase-lock.
2. **Section topology** (above table) — discrete, not lerp.
3. **Cursor as roving magnet** — second source added to the
   field, capped at 40% of music total.
4. **Capillary chop on hi-hat** — fine high-freq normal perturbation,
   amplitude tiny. Hi-hat hits = scintillation, not bumps.
5. **Keyboard 15-key**: each key = a pinned secondary magnet at a
   fixed canvas position (15 anchors on a horizontal arc); held =
   static spike, press event = local snap.

## Mesmerism pacing rules

- **Always-on attention anchor** (the warm dim core, never lets the
  eye scatter)
- **Decay constants > beat period** so spikes overlap, never reset to
  flat
- **1/f LUT modulation** on magnetism strength — break the VU-meter
  feel, sample 256-tap LUT by `t · 0.05`
- **Hold on a held note**: when audio energy sustains > 1s, freeze
  the cursor-driven defect, keep only breathe + 1/f noise

## Secondary motions

- **Drumhead wobble** retriggered on downbeat: `0.005 · cos(6r − 8t) ·
  exp(-0.7r) · env(t-t_kick)`, ~400ms half-life. ONE mode, two reads
  as foam.
- **Capillary ripples** from each active spike base — anomalous
  dispersion (short waves faster), additive to height field.
- **Pinch-off satellites** at threshold — ring buffer of 16, advected
  by slow upward drift + tiny noise, render as soft black discs.

## What we drop from v3

- 14-spike θ-space sin-lattice → replaced by emergent spikes from
  height-PDE instability
- 4 orbital Keplerian bodies → ONE central blob (or 2-3 smin'd seeds
  if cluster)
- Closed-form orbits → cursor-driven magnet position
- "Spike profile pow 4" rim glow → Kajiya-Kay anisotropic specular
- Outside-silhouette rim halo → already gone in v3, stays gone
- Procedural background streamers → minimal field-keyed warm bloom OR
  nothing (research split — drop it for now, add only if frame reads
  too dark)
- 14-spike-around-rim aesthetic → real hex lattice from 3 plane waves
  emerging from the sim

## Architecture v4

```
passes:
  - sim_field   (rgba16f, scale 0.5, ping-pong, 1 iter)  → phi + grad
  - sim_height  (rgba16f, scale 0.5, ping-pong, 4 iter)  → h + dh/dt
  - display     (screen, render_scale 0.7)
```

Estimated cost vs v3:
- sim_field: same (cheap)
- sim_height: NEW (~10 taps/sub-step × 4 = 40 taps per output pixel,
  but at half-res that's 1/4 of full-res cost ≈ 10 taps full-res
  equivalent)
- display: cheaper than v3 because we drop the per-planet bodySDF
  loop (4× spike calls), keyboard ray loop (15× sdSegment)

Net should be similar or slightly cheaper than v3 with much better
visual fidelity. If sim_height proves expensive on phone, drop sub-
steps from 4 → 2 first.

## Implementation order

1. New `sim_field.frag` — phi only, single source = cursor + center
   gaussian. Simpler than v3.
2. New `sim_height.frag` — Verlet wave-PDE with biharmonic + magnetic
   body force from sim_field. The new physics core.
3. Rewrite `shader.frag` as height-field display with Kajiya-Kay
   specular, apex kill, curvature-gated iridescence, attention anchor.
4. Update `meta.yaml` for the 3-pass architecture.
5. Sanity render + spot-check at sec 1 / sec 4 / sec 5.
6. Commit.

## What I'm uncertain about / Louis should call

- **Single blob vs small smin'd cluster** — research says singleton
  is the "creature" anchor; 2-3 smin'd seeds reads as a body with
  internal topology shifts. I'll default to **singleton** for v4 and
  consider cluster after seeing it.
- **Refraction pass** — adds the "wet" reading but needs a background
  texture. For v4 I'll skip it (use just Kajiya-Kay + iridescence)
  and add only if it reads too matte.
- **Section topology hard switches** vs smooth ramps — research says
  hard, with a 200ms field cross-fade. I'll go hard.
- **Iridescence on/off** — research is split (real ferrofluid is
  matte, cosmetic-toy is iridescent). Going **subtle iridescence on**
  (warm-only, curvature-gated, low amplitude) because Louis wants
  "crazy beautiful, mesmerizing" not "physics-accurate".
