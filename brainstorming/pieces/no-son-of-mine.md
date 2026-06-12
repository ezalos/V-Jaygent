# no-son-of-mine — Genesis, "No Son Of Mine" (1991)

## Brief gates (vjay-new-piece §1b + §1c)

canonical_ref: ferment (state-bearing PDE sibling) — algorithm is
  **Cahn-Hilliard spinodal decomposition**, the canonical conserved-
  order-parameter phase-separation equation: ∂h/∂t = ∇²μ,
  μ = h³ − h − γ∇²h. Two phases demix spontaneously; domain walls
  coarsen by curvature flow; total mass conserved. Textbook form,
  no reinterpretation.
eye_landing_candidates:
  - the labyrinthine domain-wall network (many ridges, ember glow)
  - triple junctions where three domains meet (hottest points)
  - downbeat rupture rings (refraction shock from a wandering epicenter)
  - cursor stir vortex (live remixing swirl)
  - key droplets (15 pitch-mapped injection sites)
  - final-act cream islands shrinking inside the dark phase
warm_cycle: [near-black, wine, ember, amber, cream]
idle_behaviour: "CH field coarsens autonomously forever; a slow
  wandering remelt blob re-quenches a region every ~10s so fresh
  labyrinth keeps forming. No cursor, no audio needed."
architecture: C  # ping-pong feedback — CH is state-bearing
arch_rationale: "Cahn-Hilliard needs persistent field state between
  frames (domains ARE accumulated history). Architecture C with
  passes: one rgba16f half-res sim pass (13-point stencil, explicit
  Euler substeps) + display pass. Wrong choices: A loses state every
  frame; B is for discrete agents; E (layers) can't hold clean
  rgba16f state (u_history is rgba8 + polluted)."

## PDE length-scale check (mandatory for pattern-forming PDEs)

CH has its intrinsic length scale built in: the γ∇²h term inside μ
sets interface width ~√γ and the fastest-growing spinodal wavelength
λ* = 2π√(2γ) (linear stability around h=0). No external modulation
needed — unlike the reduced ferrohands PDE, the canonical CH operator
IS the pattern former. γ is the per-section "quench depth" knob:
small γ → fine labyrinth (verses), larger γ → coarse continents
(final choruses).

## Thesis

One sentence: **two phases that cannot stay mixed** — the song's
estrangement rendered as the canonical demixing equation; you can
stir father and son together with the cursor, and the physics will
always pull them apart again.

The domain wall is where the song lives: it glows ember, it carries
Phil's voice (vocal stem → wall heat), it ruptures on the downbeat.
Over 400s the quench deepens — fine balanced labyrinth in the verses
coarsens into great irreconcilable continents by the final choruses,
the balance biases dark so the cream phase shrinks to cast-out
islands, and at the end the wall freezes: estrangement as ground
state. The piece ends because the equation reaches it.

## Section map (analysis JSON, 8 sections)

| t (s)     | song            | visual state |
|-----------|-----------------|--------------|
| 0–10      | drum-machine intro + growl | h≈0 gray mix, first spinodal shudder |
| 10–66     | verse 1         | fine balanced labyrinth, dim walls |
| 66–126    | chorus 1 / verse 2 | quench deepens, walls brighten, coarsening visible |
| 126–186   | chorus 2        | hot walls, downbeat ruptures, faster mobility |
| 186–264   | bridge ("I rang the bell") | partial remelt — a band re-mixes, then re-separates |
| 264–380   | final choruses (peak 0.64) | deep quench, dark bias, cream islands shrink, max rupture |
| 380–390   | collapse        | mobility → 0, walls cool |
| 390–400   | outro           | frozen field fades to near-black |

## Multi-input bindings

- **audio (stems)**: vocals → wall heat/glow (the voice lives ON the
  boundary); drums → sub-beat grain jitter + rupture kick strength;
  bass → domain mobility + shear along walls; downbeat → refraction
  shock ring from a wandering epicenter (GEOMETRY, not brightness);
  u_to_section_change → wall tension glow rises before each boundary
  (pre-tension).
- **cursor / touch**: vortex stir (advects the phase field — visibly
  remixes) + local remelt (pushes h toward 0). The claim is playable:
  stir gray, watch it demix. All 8 touch points stir on mobile.
- **keyboard (synth on)**: white keys inject cream droplets at
  pitch-mapped x, black keys inject wine droplets; the field swallows
  or expels them per the local phase. Press = strong impulse, hold =
  sustained feed.

## Form candidates considered

1. **Cahn-Hilliard spinodal labyrinth** (chosen) — lib: diffusion.glsl
   (5-pt laplacian as building block), noise.glsl (init + grain),
   interaction.glsl (cursor), tonemap.glsl. Sim is one 13-point pass.
2. Crack propagation / Voronoi fracture — rejected: discrete events,
   no continuous flow to lock the eye on; brick already owns gouges.
3. Ising domain Monte-Carlo — rejected: stochastic flicker reads as
   TV static at pixel scale (the v3-dopamine failure mode).

## What I don't want

- Literal illustration: no figures, no doors, no house.
- FFT bars or waveform anything.
- Brightness-only audio coupling — beats must move geometry.
- High-frequency pixel noise / discrete glitch tears (two-timescale
  rule): rupture rings are smooth displacement waves, not cuts.
- A frozen final frame that's just "the piece stopped" — the freeze
  must read as composed (cooling glow, fade, done).

## Open questions (answerable only from runs)

- Does explicit CH at dt≈0.08 × 6 substeps coarsen fast enough to
  read across a 400s song? (Mobility knob is the rescue.)
- Does the dark-bias final act read as "islands shrinking" or just
  "screen got darker"? May need island rim boost.
- Headless 17fps runs the sim ~3.5× slower than live — grade
  coarsening from wall-clock clips (feedback_accumulation_pieces_wallclock_eval).

## Decision

Architecture C (`passes:`), canonical Cahn-Hilliard, warm cycle
[near-black, wine, ember, amber, cream], keyboard_synth on, cursor
as stirrer, stems driving wall/grain/shear, downbeat rupture rings,
section-driven quench arc ending in a frozen field. Committed.
