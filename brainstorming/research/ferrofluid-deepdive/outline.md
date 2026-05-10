# Ferrofluid deep-dive — research outline

**Topic:** Making a ferrofluid effect crazy-beautiful and mesmerizing in
a WebGL2 fragment shader. V-Jaygent context: 2D top-down, full-screen
quad, GLSL ES 3.0, real-time, dark-warm palette per VISION.md, multi-
pass `rgba16f` ping-pong available for state-bearing physics.

**Constraint:** the piece is being redesigned around ONE crazy-
beautiful ferrofluid blob (or small cluster). Music drives the
magnetism. Orbits / gravity de-prioritized.

## Field schema (per item)

| field              | what it answers                                                    | detail level |
|--------------------|--------------------------------------------------------------------|--------------|
| **summary**        | 1-2 sentences on what this is                                      | brief        |
| **why_mesmerizing**| why it makes the piece more hypnotic, not just accurate            | moderate     |
| **concrete_steal** | specific implementable move — equation, palette, GLSL pattern      | detailed     |
| **glsl_path**      | how to translate to V-Jaygent's render pipeline (which pass, cost) | detailed     |
| **caveats**        | failure modes, common bugs, things that read wrong                 | moderate     |
| **references**     | URLs, papers, Shadertoy IDs, artist links — verify & cite          | moderate     |

## Items (14)

### Physics — what makes the spikes form

#### 1. Rosensweig instability — onset, critical wavelength, hex lattice
Why peaks erupt above a critical magnetic field. Surface tension vs.
magnetic body force vs. gravity balance. Marangoni number / magnetic
Bond number. Critical wavelength λ_c = 2π√(σ/(ρg)) for thin pools.
Why hex packing wins (closest-packing of points-of-equal-energy on a
plane).

#### 2. Surface tension + viscosity → capillary wave dispersion
Capillary wave speed `c² = (σ/ρ) · k` for short waves; viscous damping
`γ ≈ 2νk²`. The reason ferrofluid wobbles slowly rather than ringing.
Why the surface-skin tension *resists* the spike — and what happens
when magnetism wins.

#### 3. Magnetic body force on the ferrofluid surface
Kelvin force `f = μ₀(M·∇)H` on magnetized fluid; Maxwell stress
contribution `T_ij = μ₀(H_i H_j − ½H²δ_ij)`. The body force is
proportional to `H · ∇H` — peaks where field gradient is sharpest.
This is the "why spikes point at the magnet" moment.

#### 4. Hex-spike lattice formation + transitions to disorder
The 2-3-4 spike-competition paper (Cambridge JFM). Rolls → hexagons →
defects → labyrinth as field strength varies. The critical magic
moment when the lattice IS regular, then defects appear, then
reorganises. This is what mesmerizes.

### Optical / material — what makes it READ as ferrofluid

#### 5. Real ferrofluid optical properties — Fe₃O₄ in oil
Magnetite colloid, light-absorbing carrier oil. Bulk: opaque black.
Surface: high specular off the oil meniscus; tips show very narrow
fresnel highlight only at near-grazing angles. NO subsurface scatter.
NO bulk glow. The dark interior is the load-bearing visual contract.

#### 6. Specular highlight character on ferrofluid spike tips
Anisotropic — peaks act as cylindrical micro-mirrors so specular
forms a *line* along the spike axis, not a dot. Tip catches light
disproportionately because curvature is highest there; the rest of
the body is matte-dark. Sodium-orange tint comes from the lit
environment, not the fluid.

#### 7. Iridescence + thin-film interference at peaks
Some ferrofluid videos show oil-slick iridescence — that's a thin oil
film on the surface, ~150-700nm thick, producing thin-film
interference. The classic ferrofluid look is NOT iridescent (pure
black + spec); the cosmetic-toy look IS. Decide which.

### Rendering — 2D shader paths

#### 8. Height-field PDE on rgba16f ping-pong
Treat the surface as a height field h(x, y, t). Update via
`∂²h/∂t² = c²∇²h - γ ∂h/∂t + body_force(magnetism)`. Wave-equation
+ damping + magnetic forcing. State-bearing — gives the slow viscous
response that no procedural noise can fake. `pieces/breath` and
`break-on-through` precedent on multi-pass wave eq.

#### 9. Normal-from-gradient → 2.5D shading
With h(x,y), surface normal is `n = normalize(-∂h/∂x, -∂h/∂y, 1)`.
Compute via 4-tap finite difference on h-texture. Then dot(n, L) for
diffuse, pow(dot(reflect(L,n), V), k) for specular. Cheap, gives true
3D-ish lighting on a 2D shader.

#### 10. Screen-space refraction + depth-of-field
The "wet" reading: a thin slab of the height field refracts whatever
is behind. `uv_refracted = uv + (n.xy) * thickness * (1/IOR - 1)`.
Sample the background at the refracted UV. With a dark room behind,
refraction reads as glossy meniscus. Cheap.

#### 11. SDF / blob composition with smin'd seed sources
For ONE blob: a single SDF ball with displacement-from-height. For
small cluster: opSmin'd primitives. `pieces/lodestone-pull` precedent
for blob composition.

### Aesthetic / mesmerism — beyond accuracy

#### 12. Polyrhythmic timescales of the surface
What separates "spiky thing" from "ferrofluid": multiple coexisting
timescales — slow capillary breathing (~2 Hz), fast spike erupt
(~10 Hz), slow defect drift (~0.3 Hz), micro-jitter from agitation
(~30 Hz). Make the surface alive at every glance length.

#### 13. Pinch-off, satellites, drumhead wobble — secondary motions
Real ferrofluid shows secondary effects: a spike that grows past
threshold pinches off a satellite droplet that floats free; the body
"skin" wobbles after a perturbation like a drumhead; capillary
ripples emanate from spike base. None of these need to be realistic —
just fast cheap GLSL nods that read as "alive".

#### 14. Mesmerism aesthetic moves — pacing, breathe, attention anchor
Hypnotic pieces share: slow attention-anchor (one persistent feature
the eye returns to), frequency separation (foreground speed ≠
background speed), unhurried decay (let things finish), 1/f-noise
modulation (not metronomic). Apply to ferrofluid: the central blob
breathes slowly while spikes flicker fast; defects drift on a third
timescale.

### Artistic precedent

#### 15. Sachiko Kodama — Protrude/Flow + Morpho Tower
The canonical ferrofluid sculptor. Black-on-black silhouette,
sodium-orange spec at tips, sound-reactive. Lift: the palette
discipline (NO chrome, NO blue), the way her camera holds wide and
lets the surface texture do the work, NOT zoomed-in spectacle.
Specific videos worth dissecting frame-by-frame.

#### 16. Scientific footage + slow-mo videos
"NightHawkInLight" / "Concerning Reality" / Cambridge fluid lab —
real ferrofluid under controlled magnets. Catalog the visual moves
that read as "real": the silent erupt, the post-eruption skin
recoil, the way defects flow through the lattice when the magnet
moves.

#### 17. Marie-Pier Pruvost / Andrew Huang / DT Suzuki etc.
Generative artists who've done liquid-metal-style work in shaders or
3D. What they got right, what they got wrong. (Verify these names —
research-deep should disambiguate; Pruvost may be misremembered.)

### Music coupling

#### 18. Audio mapping beyond bass=strength
Bass→field strength is the obvious move and was already done in v1-v3.
What's left: phase-locked spike eruption (downbeat snaps the lattice
into perfect hex, then defects invade across the bar); FFT-driven
standing-wave patterns from beat envelope (Chladni-like nodal lines
on the surface); high frequencies as micro-capillary chop; section
state as global field topology shift (not just amplitude).

## Execution config

- **batch_size**: 6 parallel agents (3 items per agent)
- **items_per_agent**: 3
- **output_dir**: `brainstorming/research/ferrofluid-deepdive/results/`
- **batches**: 6 batches × 3 items = 18 items total

## Follow-up

- `/research-add-items` — add items if a dimension is missing
- `/research-add-fields` — add field definitions
- `/research-deep` — launch parallel agents to fill in fields per item
- `/research-report` — synthesize the results into a single design
  brief Claude can implement against
