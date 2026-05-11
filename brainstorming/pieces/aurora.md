# aurora — warm aurora ribbons advected through a velocity field

## Brief gates (vjay-new-piece §1b + §1c)

```
canonical_ref: ferment   # closest sibling — both are state-bearing ping-pong fields with cursor injection
eye_landing_candidates:
  - 2-4 dominant ribbon curls (the bright dye filaments at any moment)
  - cursor swirl vortex (visible spiral when the cursor is dragged)
  - ribbon merge/split events (filaments folding into each other)
warm_cycle: [near-black, wine, ember, amber, cream]
idle_behaviour: "curl-noise velocity field keeps advecting density; dye continuously
  re-injected from soft sources at the top of the frame; ribbons drift, fold,
  and dissipate without any input"
architecture: C
arch_rationale: |
  This is a Stam-style advected scalar field. The brief asks for:
    (a) "ribbons keep flowing even with no input" — requires state across frames
    (b) "cursor adds a localized swirl that disrupts the ribbons" — disruption only
        makes sense if ribbon density persists between frames; otherwise the swirl
        would deform a freshly-recomputed pattern (the disruption would be invisible
        on the next frame).
    (c) "ribbons wave, bend, and merge" — coherent dye filaments emerging from
        velocity-field advection are exactly what Stam fluid dynamics produces.

  Wrong architectures:
    - A (per-pixel functional): cursor "disruption" cannot persist. Would yield
      "FBM warped by some sin-wave", not flowing ribbons.
    - B (CPU-sim + sprites): ribbons aren't ≤200 discrete agents. Continuous filaments
      need a continuous density field, not N rendered sprites.
    - D (density-volume / raymarched): would fit "smoke" or "nebula", but the brief
      asks for ribbons (coherent curves), not a hazy aggregate. Volume rendering
      blurs the ribbon identity.
    - E (layer-stack): doesn't address state persistence. Cannot recover the
      advection requirement; u_history is rgba8 polluted by upper layers, not a
      clean state field.

  C with passes:
    - sim pass: advect a density field through curl-noise velocity. Cursor
      injects extra rotational velocity (a swirl kernel). Density slowly
      re-injected at top of frame from soft sources. Decay so the field doesn't
      accumulate forever.
    - display pass: read density, threshold-shade into ribbon-shaped warm
      contours through the warmCycle palette, with brighter edges from density
      gradient.
```

## Thesis

A continuous dye field flowing through a curl-noise velocity field paints aurora-
ribbon shapes across a dusk sky. The cursor drops a localized swirl that twists
existing ribbons into a spiral; without input, the ribbons keep curling on the
ambient velocity field's own clock.

## Canonical-name check

**Stam advection** (Stable Fluids, Jos Stam, SIGGRAPH 1999). Reduced form:
maintain a scalar density field `ρ(x, t)`, advect by backward-trace lookup of a
velocity field `v(x, t)`, add sources, subtract decay:

```
ρ_new(x) = decay · ρ(sample at x − v(x)·dt) + source(x)
```

The velocity field here is **kinematic** (not solved with pressure projection) —
it's a curl-noise field, divergence-free by construction:

```
v(x, t) = curl( ψ_fbm(x, t) )         ≡ ( ∂ψ/∂y, -∂ψ/∂x )
```

where `ψ_fbm` is a scalar streamfunction made from fbm. Curl-noise gives
divergence-free advection without needing the pressure solve — canonical
shortcut from Bridson 2007. Cursor adds a rotational velocity kernel:

```
v_cursor(x) = ω · perpendicular(x − x_mouse) · gaussian(|x − x_mouse|, σ)
```

This is **architecture C** because density must persist across frames; the
sim pass is one Stam advection step + cursor swirl injection; display pass
threshold-shades density into ribbon contours.

**Length-scale check.** Stam advection is not a pattern-forming reduced PDE
— it doesn't need a Swift-Hohenberg term. The length scale of ribbons is set
by (a) the noise scale of the streamfunction `ψ_fbm`, and (b) the source
injection bandwidth. Pick fbm at ~3 octaves on a unit-radius spatial scale
so ribbons read at ~10% of canvas width.

## Form

ONE form. Architecture C. Multi-pass:

- **simulate** pass — rgba16f ping-pong, scale 0.5 of display. Reads `u_state.r`
  as density, writes new density. Velocity computed inline from curl-noise +
  cursor swirl injection. Slow decay (×0.992/frame). Source injection at the
  top quarter of the frame via a soft band gated by a low-freq noise.
- **display** pass — reads density, applies ribbon contour shaping
  (`smoothstep(low, high, ρ)` with a soft ramp so density renders as flowing
  filaments not flat regions). Brightness modulated by density gradient
  (Sobel) so ribbon edges sparkle warm-amber. Palette is `warmCycle` keyed
  on a slow-drift time + density.

## Lib reuse

- `lib/noise.glsl` — `vnoise`, `fbm` for streamfunction.
- `lib/palette.glsl` — `warmCycle`.
- `lib/tonemap.glsl` — `reinhard` for the highlights.
- `lib/interaction.glsl` — `vjMouseIdle`, `vjMouseWorld` for cursor handling.

## Layer DAG / coupling

N/A — passes architecture, not layers. Two passes (simulate → display).

## What I don't want

- Sine-wave bands masquerading as "aurora" (that would be architecture A; would
  fail the brief gate on persistence).
- Cool teal/green palette (aurora borealis is canonically green-purple but
  VISION is warm-only — paint it as a warm sunset aurora; dusk sky is the
  warm reading).
- Cursor-as-glow-only (cursor must MOVE geometry — inject a rotational
  velocity, not a brightness halo).
- Frozen idle (the curl-noise velocity field has its own clock — `vfbm(p, t)`
  where t advances continuously).

## Open questions (resolve at runtime)

- Decay rate vs. source rate — too much decay and ribbons evaporate; too
  little and the field saturates white. Tune to ~0.992/frame with source
  amplitude ~0.015 per frame.
- Cursor swirl strength — should disrupt visibly within ~1s of dragging
  but not fully break the ambient flow. Try ω=2.0, σ=0.15.
- Streamfunction frequency — too high gives chaotic noise (not "ribbons");
  too low gives lazy single-direction flow (not "curling"). Start at 1.5
  with 3 fbm octaves.

## Decision

Architecture C, Stam advection of a scalar density field through curl-noise
velocity. Cursor injects rotational velocity. Source-and-decay loop keeps
the field alive at idle. Display pass shapes density into ribbon contours
through warmCycle. One bundled implementation; no theme-only fallback needed
(piece is autonomous self-play).
