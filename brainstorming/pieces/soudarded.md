# soudarded — brainstorm

Track: **"Ar soudarded zo gwisket e ruz"** ("The soldiers are dressed in
red"), traditional Breton chain-dance song, 161.5 BPM, C minor, 202.8s,
kan-ha-diskan vocals. Stems analyzed (drums/bass/other/vocals).

## Thesis

A field of coupled phase oscillators (Kuramoto–Sakaguchi) that
self-organizes into spiral waves and synchronization domains — the
**communal lock-in of a Breton circle dance / kan-ha-diskan** rendered
as the literal mathematics of synchronization: many voices becoming one.
The song's arc drives the coupling regime: turbulent desync in the quiet,
chimera-like spiral domains in the verse, a blazing global lock-in at the
peak, then breakup at the outro.

Respond to the *structural truth* (communal synchronization, call-and-
response, the rising arc), NOT the lyric (no soldiers, no literal red
uniforms — but "dressed in red" earns a red-dominant warm palette).

## Brief gates (vjay-new-piece §1b + §1c)

```
canonical_ref: ferment   # architecture sibling (ping-pong rgba16f);
                         # algorithm: Kuramoto–Sakaguchi phase oscillators
                         # on a 2D lattice (local 8-neighbour coupling +
                         # phase lag α → spiral waves / chimera turbulence)
eye_landing_candidates:
  - spiral cores (phase defects — dark singular points)
  - synchronization domains (large coherent plateaus that glow)
  - traveling wavefronts (bright isophase filigree ridges)
  - central communal-sync bloom (global order parameter r)
warm_cycle: [near-black, ox-blood-wine, blood-red, ember-orange, amber, cream]
idle_behaviour: "autonomous spiral-wave turbulence runs forever on the
  oscillators' natural frequencies + local coupling; spirals nucleate,
  drift, and annihilate; field reconfigures visibly over ~15-20s. Fully
  alive at u_mouse==(0,0) and u_audio_*==0."
architecture: C   # ping-pong feedback — phase must persist between frames
arch_rationale: "Oscillator phase is state-bearing: θ integrates over
  time and spiral waves ONLY exist with cross-frame persistence.
  A (per-pixel functional) would lose phase every frame → no waves.
  B (CPU-sim ≤200 agents) is wrong — this is a continuous ~500k-oscillator
  field, not discrete entities. C with passes: [simulate, display] is the
  match; sibling ferment proves the rgba16f ping-pong skeleton."
```

## Canonical-name check

**Kuramoto model** (Yoshiki Kuramoto, 1975): N phase oscillators,
`dθ_i/dt = ω_i + (K/N)Σ_j sin(θ_j − θ_i)`. **Kuramoto–Sakaguchi**:
add phase lag α inside the sine. On a 2D lattice with *local* coupling
this is the canonical model of oscillatory media → spiral waves, target
waves, defect turbulence, chimera states. Order parameter
`r·e^{iψ}=(1/N)Σe^{iθ}`. I implement the canonical lattice form, not a
reinterpretation. PDE-length-scale note: spiral wavelength is set by the
local coupling stencil + α, so the length scale is intrinsic (no
flat-mesa risk — this isn't a reduced amplitude PDE, it's the phase
dynamics directly).

## Form (decided — no menu)

Two-pass ping-pong, architecture C:

- **simulate** (rgba16f, scale ~0.5, 2 substeps): R=phase θ, G=natural
  frequency ω (smooth fbm-seeded landscape, frame 0). 8-neighbour
  toroidal Kuramoto–Sakaguchi update. Forcing: cursor pacemaker (high-ω
  site emits target waves), 15 keyboard pacemakers around a circle,
  downbeat global phase-kick, stem-driven K/α.
- **display** (screen): θ→cyclic warm palette (red-dominant, 6-waypoint,
  cyclic so no wrap blink); local coherence gates brightness (defect
  cores dark = eye-landing, coherent domains glow); phase-gradient
  filigree at wavefronts (fine texture); central communal bloom from a
  ~48-tap global-r estimate; slow wandering macro hot-zones seeded by
  section_id (squint macro + regions_migrate); soft circular vignette
  (an-dro ring nod).

Lib leans: noise.glsl (hash21, vnoise, fbm for ω seed), math.glsl (rot2d,
TAU), interaction.glsl (vjMouseWorldOrZero), tonemap.glsl (reinhard).

### Coupling DAG / drivers
- K (coupling): K0 + bass_stem (low-end pulse → sync) + vocals_stem
  (the lead voice pulls the chain together — kan-ha-diskan).
- α (phase lag): high in quiet/verse (turbulent spirals), driven DOWN by
  energy + toward peak (sync lock-in); briefly up on pre-tension
  (u_to_section_change small → held breath).
- ω gain (medium speed): other_stem (melody) speeds the rotation.
- downbeat kick: drums_stem + u_downbeat → global smooth phase advance
  (the communal step → visible phase-lock, moves geometry not brightness).
- cursor: pacemaker site (composition changes globally, not a local halo).
- keys: 15 distinct pacemaker positions (per-key distinctness).

## What I don't want

- A literal ring of beads in the middle (single locked subject; fails
  eye_distribution). Keep it a full-frame field with a circular *nod*.
- Brightness-only audio coupling (bass→glow). Bass moves K → moves the
  geometry of synchronization. Downbeat moves phase, not just luminance.
- Full uniform color at peak sync (uniform soup). Floor α≈0.3 and keep ω
  spread so persistent waves + a few spirals always survive.
- Rainbow. Phase→hue stays inside the red-dominant warm arc.
- Per-beat brightness strobe (continuity killer). Beat events are smooth
  propagating phase advances.

## Open questions (resolve after first render)

- Wave speed vs continuity: DT × (ω + K) must keep per-frame phase
  advance smooth (~<0.4 rad). Tune DT/iterations after inspect.
- Does peak sync read as "blazing domains" not "flat color"? May need to
  floor α higher or keep a stronger ω spread.
- Is the central bloom legible without dominating (cursor/dominance)?
- Half-float precision over 202s — wrap θ to [0,TAU) each step.
