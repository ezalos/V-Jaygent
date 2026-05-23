# shoal

**Thesis.** Each pixel is the initial state (θ1, θ2) of a double
pendulum, released from rest. Integrate it and a twin perturbed by
1e-4 in θ1 for ~30 RK4 steps; pixel brightness is
`log(separation / 1e-4)`. Stable regions (KAM islands) read as soft
solid colour; chaotic regions saturate bright. The viewer sees the
phase-space architecture — islands of regularity in a chaotic sea.

Recipe 4 of `brainstorming/techniques/basins-of-attraction.md`;
the V-Jaygent expression of 2swap's *Double Pendulums are
Chaoticn't*. A shoal is literally an island arc in a shallow sea —
the visual is the namesake.

## Decision

Build it. Monolithic single-pass per-pixel shader (architecture A),
twin-trajectory Lyapunov cheap-out, render_scale 0.5. No
substrate / glow / ring ornaments — the chaos map is the thesis.
Cursor + keyboard + audio all drive dynamics parameters.

**Watershed lessons applied:** A not C (no amortization → gradeable
from headless stills); pick the realtime-appropriate algorithm at
the brief stage; aim ship by v2; no decorative layers competing
with the lead.

## Brief gates (vjay-new-piece §1b + §1c)

```
canonical_ref: "Lyapunov chaos map of the double pendulum — Recipe 4
  of basins-of-attraction.md, twin-trajectory cheap-out.
  Hamiltonian canonical with m=l=1, gravity g.
  Sibling in canonical-pieces.md: closest is Julia / escape-time
  fractal (also per-pixel iterated dynamics)."
eye_landing_candidates:
  - bright chaotic regions (where divergence saturates)
  - the dim solid-colour KAM islands of stability
  - symmetric structure around equilibria (θ1=θ2=0, ±π)
  - the seam where stability meets chaos (the literal shoal edge)
warm_cycle: [near-black, wine, ember, amber, gold, cream]
idle_behaviour: "released-from-rest double pendulums at default
  gravity 9.8; the chaos map is shown; audio.bass slowly pumps
  gravity so the map breathes; no cursor / keys required. A slow
  composition envelope keeps it from being literally static."
architecture: A
arch_rationale: "A — single-pass per-pixel. Each pixel computes its
  own fixed-horizon Lyapunov via twin-trajectory RK4 (30 steps),
  output every frame. Not C (passes): amortization made watershed
  ungradeable from headless inspect; here we want stills to grade
  the same as live. The piece is heavy (~30 steps × 4 RK4 evals ×
  2 trajectories per pixel) but tractable at render_scale 0.5."
```

## Canonical-name check

**Lyapunov exponent.** For a smooth dynamical system, the (largest)
Lyapunov exponent is the asymptotic rate at which infinitesimally
nearby trajectories diverge: `λ = lim (1/t) log |δ(t) / δ(0)|`.
Positive λ → chaos. Computed by integrating a reference trajectory
plus a perturbation (or its linearised tangent vector); λ in 1/time.
For the double pendulum, λ varies smoothly across phase space —
zero on KAM tori (regular regions), positive in the chaotic sea.
Plotting λ over the (θ1, θ2) plane *is* the chaos map.

The twin-trajectory cheap-out (without re-normalisation) saturates
when separation reaches ~2π (the angle wrap), but for a short
integration horizon (here 30 steps × dt=0.065 ≈ 2 s of system time
with initial perturbation 1e-4) the divergence stays measurable
across the whole [no-chaos, deep-chaos] spectrum without saturating.

## Inputs

- **Cursor.x** → initial momentum kick on the first pendulum
  (range ~±1). Drag and the chaos map flexes as the released state
  changes — stability islands shift across phase space.
- **Cursor.y** → gravity multiplier (~0.6–1.4). Stronger gravity
  enlarges the chaotic sea; weaker gravity grows the islands.
- **Keyboard** (15-key synth) → each key adds a unique signed
  initial-momentum impulse. Per-key distinct: pressing different
  keys produces different chaos maps (you play the parameter space).
- **Audio.bass** → additive gravity pulse, so the map breathes on
  the kick. **Audio.high** → sub-beat shimmer amplitude.

No track — theme-only, self-playing. A slow `sin(u_time)` envelope
keeps the brightness drifting so it's never literally static.

## Composition

Phase space (θ1, θ2) ∈ [-π, π]² mapped to the frame: θ1 to width
(wrapping ~1.78× across 16:9 — `θ1 = (uv.x − 0.5) · 2π · 1.78`),
θ2 to height (one period — `θ2 = (uv.y − 0.5) · 2π`). The horizontal
wrap fills 16:9 naturally and the trig in the dynamics handles it.

Colour: `hue = atan2(sin θ2, sin θ1)` mapped into the mid-bright
warm range (avoids near-black for hue); `L = 0.30 + 0.80 * chaos`
so stable islands read as ~30% mid-warm and chaotic regions burn
bright. Macro envelope: a slow `u_time` drift × `sin(uv.x)` shape
keeps the field breathing.

## What I don't want

- A soft-textured field with no structure. KAM islands MUST read
  on the squint as distinct calmer regions — that's the thesis.
- The whole frame chaotic-bright (warm soup). At default gravity
  ~9.8, large central regions should be CALM stability islands;
  if the entire frame is hot, increase the perturbation, decrease
  the integration horizon, or recheck the Lyapunov mapping.
- Decorative cores / rings / substrate layers competing with the
  chaos field. The field is the lead.

## Open questions

- 30 steps enough to resolve the island edges, or 50? Tune at
  inspect.
- Will the slow composition envelope (`0.85 + 0.15*sin(t*0.08 + ...)`)
  read as liveness, or as flicker? Watch hue-drift probe.
- Cursor mapping — is "x → momentum kick, y → gravity" intuitive
  within 3 s + 2 moves (readability probe)?
