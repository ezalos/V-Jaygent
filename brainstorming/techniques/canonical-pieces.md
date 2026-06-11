# canonical-pieces.md — the 8 reference pieces

The pieces that survive a blind regrade with section-anchored frames.
This file is the **reference catalog** that briefs for new pieces
should anchor against. When in doubt: pick the nearest sibling here
and adapt.

Built 2026-05-11 from the round-2 catalogue regrade.

## What this catalog is for

When you brief a new piece, name a sibling from this list. The system
inherits the success structure rather than starting from a blank
shader. "A Gray-Scott piece for tide pools" or "an Apollonian recipe
for a glass cathedral" gives the scaffold what it needs.

If a brief can't reference one of these patterns, it almost certainly
fails the build-time gates — that's a signal to brainstorm more, not
push forward.

## The six shared properties

Every piece below has all six. Missing any is a system smell.

1. **Named canonical algorithm.** Apollonian SDF, gravitational
   lensing, coprime tooth-wheels, Julia set, Gray-Scott RD,
   percussion-driven geometry, Chladni nodal patterns, brick crack.
2. **Multi-scale by construction.** Recursive folds, fractal sampling,
   polyrhythmic clocks, or RD interfaces — not "base + texture".
3. **2–4 eye-landing candidates.** Never "one big subject in the
   middle".
4. **Single warm cosine palette.** Through {amber, ember, wine, mauve,
   cream}. No cool intrusions, period.
5. **Survives idle.** Renders meaningfully with `u_mouse == (0,0)`
   and `u_audio_* == 0`.
6. **Concrete claim** that can be checked from 4 stills.

---

## 1. apollonian-foam — recursive SDF fold

- **Algorithm**: Iñigo Quílez Apollonian gasket as SDF. Iterative
  folding `p = -1 + 2·fract(p/2 + 1/2)` + inversion through origin
  `p *= t / |p|²`, tracking accumulated scale for honest distance.
- **Multi-scale source**: recursive folds — every iteration adds an
  octave. Fractal cores reward arbitrary zoom.
- **Eye-landing**: tightest recursion cores at multiple radii;
  orbit-trap glow finds 3-4 bright cells per frame.
- **Palette**: cosine palette through warm cycle (cream → wine).
- **Idle**: slow camera orbit (no input needed).
- **Use when**: you want depth-on-zoom, "math reaching into hidden
  structure" feel, no audio needed.

## 2. braid — multi-mass gravitational lensing

- **Algorithm**: N billiard masses each shifting sample-position
  toward themselves with `1/|p-m|` falloff. Substrate is a domain-
  warped FBM viewed through a D_5 fold. Audio (optional) scales the
  lens strength.
- **Multi-scale source**: warp + fold + multi-mass deformation
  composite over an FBM substrate.
- **Eye-landing**: 4 ball cores + the central fold cross + shockwave
  rings on collision.
- **Palette**: warm ember kaleidoscope.
- **Idle**: balls bounce autonomously (billiards.mjs).
- **Use when**: you want multiple landing points, "weights moving a
  sheet of warm light", optional audio.

## 3. cirrus — coprime polyrhythm wheels

- **Algorithm**: N concentric rings at coprime tooth counts (5/7/11/
  13/17). Each ring on its own clock (bar phase / section progress /
  beat phase / mid-driven / time+high). Audio-keyed alignment glow.
- **Multi-scale source**: coprime polyrhythm. Pairwise alignments are
  the visual hooks; total alignment is the never-arrived destination
  (LCM ≈ 85k bars).
- **Eye-landing**: each ring is a band; alignments shift the bright
  zone per frame.
- **Palette**: warm gradient with subtle pink drift in verse.
- **Idle**: rings spin on time-driven clocks even silent.
- **Use when**: you have audio with clear meter, want visible phase-
  lock, want sections to read distinctly.

## 4. eclipse — multi-body fractal interiors

- **Algorithm**: 2 billiard balls each window onto a different Julia
  set, 80 iterations deep with smooth-escape + orbit-trap. Mass
  asymmetric (m=1 / m=6) so collisions are unequal. Bass → c-drift,
  mid/high → orthogonal c modulation.
- **Multi-scale source**: Julia fractals inside each ball give native
  multi-scale; per-ball masses give per-event-scale dynamics.
- **Eye-landing**: 2 fractal interiors + the collision events.
- **Palette**: bright warm ember + black void (warm-only + dark, not
  cool).
- **Idle**: balls drift autonomously.
- **Use when**: you want 2-body composition, audio→c-parameter
  coupling, dramatic asymmetric collisions.

## 5. ferment — Gray-Scott reaction-diffusion

- **Algorithm**: classical Gray-Scott RD with ping-pong rgba16f
  textures. 8 sub-steps per frame at half resolution. Cursor feeds
  v-concentration where you hover.
- **Multi-scale source**: RD interfaces grow recursively — spots
  split into mazes, mazes refine into filigree, arbitrary close-up
  reward.
- **Eye-landing**: 2-3 blob clusters migrating; new spots emerging.
- **Palette**: dark-warm ember on near-black.
- **Idle**: pattern evolves autonomously without cursor.
- **Use when**: you want emergent pattern formation, fractal-feeling
  detail, optional cursor input that *enriches* not requires.

## 6. throb — percussion-driven geometry

- **Algorithm**: per-band onset detection on the CPU. Each transient
  fires a distinct geometric vocabulary: kick → expanding ring,
  snare → rotating cross, cymbal → angular rim sparks. Decays in
  ~0.3s before next hit overpaints. Bass into ringRadius, not glow.
- **Multi-scale source**: 3 geometric primitives at different scales
  + decay envelopes layered over near-black.
- **Eye-landing**: each transient creates a fresh landing zone
  somewhere.
- **Palette**: pure warm amber/cream on dark.
- **Idle**: silent between hits — silence IS form.
- **Use when**: you have percussive audio with clear transients, want
  honest dynamic range, want bass → geometry not bass → glow.

## 7. cymatic — Chladni nodal patterns

- **Algorithm**: Chladni plate equation with selectable mode pair
  driven by mic / FFT. Autonomous FBM mode-sweep when no audio.
- **Multi-scale source**: nodal grid has standing-wave interference
  at multiple scales by construction.
- **Eye-landing**: multiple nodes across the plate; interference
  bands shift as modes change.
- **Palette**: warm amber lattice.
- **Idle**: FBM mode-sweep keeps it alive without mic.
- **Use when**: you want lattice / interference aesthetics, optional
  live-audio reactivity, robust idle behaviour.

## 8. brick — material + idle hand

- **Algorithm**: oxblood-red brick texture (Worley + ridge noise).
  Cursor "fist" gouges craters; ghost faces lurk in the wall as
  faint regions of the noise. Idle drift on the hand position.
- **Multi-scale source**: brick texture is multi-octave noise; ghost
  faces are sub-resolution structure.
- **Eye-landing**: each gouge crater is a landing zone; ghost faces
  in the unbroken regions.
- **Palette**: oxblood red + cream highlights (warm-only).
- **Idle**: cursor has an idle drift, so the wall keeps getting
  punched even without a player.
- **Use when**: you want material + interaction, "this thing has
  history" feel, optional cursor input.

---

## Architecture decision matrix

Naming a canonical algorithm in the brief isn't enough — the brief
must also pick the **rendering architecture** that matches what the
algorithm actually does. The murmuration stress test (2026-05-11)
shipped at structural-rethink because the brief said "boids" but the
scaffold used architecture A (per-pixel functional shader), which
can't represent a starling murmuration even after 10 forced
iterations. The architecture choice is upstream of every other
decision; pick wrong and no iteration heals it.

Five architectures the catalogue supports:

### A — Per-pixel functional shader (monolithic single-pass)

Every pixel evaluates the math from scratch. No state, no inter-pixel
communication. `bin/new-piece.mjs <slug>` (no flag).

- Suitable when: math is pixel-parallel; N agents (if any) ≤ ~10;
  field at any pixel is a closed-form function of (uv, t).
- Reference pieces: apollonian-foam (recursive SDF), eclipse (Julia
  per ball), aperture (cubic Julia), trine (3-body trails), well
  (gravitational lens).
- Wrong when: you need per-agent neighbour reads (boids), state
  persistence between frames (RD, fluid), or thousands of agents.

### B — CPU-sim driver + per-pixel sprite render

A Node-side simulation in `studio/` updates per-agent state (positions,
velocities, collision events); the fragment shader receives them as
uniforms and renders sprites or SDF marks. Reference: `studio/billiards.mjs`.

- Suitable when: ≤ ~200 agents, sequential per-agent state (collisions,
  neighbour reads, mass-asymmetric integration), each agent rendered
  as a bright sprite + halo + optional collision event.
- Reference pieces: braid (4 lensing balls), eclipse (2 Julia balls),
  lodestone (2 orbiting dipoles).
- Wrong when: agents are sub-pixel (use D), state is a continuous
  field rather than discrete agents (use C), or N >> 200.

### C — Ping-pong feedback (state-bearing field, multi-pass)

A simulate pass updates a state texture each frame; a display pass
reads the stabilised state and renders. `bin/new-piece.mjs <slug>
--sim`. Uses `passes:` in meta.yaml.

- Suitable when: pattern emerges from a state field that needs
  persistence — reaction-diffusion, ferrofluid surface, fluid sim,
  Faraday waves, wave-equation solvers.
- Reference pieces: ferment (Gray-Scott RD), ferrofluid (PDE surface),
  cymatic (Chladni with autonomous mode sweep).
- Wrong when: math is closed-form per pixel (use A), or particles
  need explicit collision logic (use B).

### D — Density volume / raymarched aggregate

The subject is millions of sub-pixel particles whose collective
density forms the macro shape. Implemented as a sampled volume +
raymarched accumulation, OR as a feedback texture (variant of C)
that accumulates particle splats over time.

- Suitable when: claim is "murmuration", "smoke", "galaxy",
  "nebula", "fog", "plume" — anything where individual particles
  must NOT read as discrete sprites.
- Reference pieces: plume (curl-noise smoke, ember substrate;
  approximated via per-pixel field rather than true raymarch — works
  because the substrate IS the field).
- Wrong when: the brief actually wants ≤ N=200 discrete agents
  (use B), or wants a state field with explicit chemistry (use C).
- **The murmuration brief belongs here.** It was placed in A and
  could not be iterated into convergence. Don't repeat this.

### E — Layer stack with multi-input coupling

Multiple shaders composited via blend modes, each on its own clock,
each consuming different inputs (cursor / keys / audio uniforms).
Uses `layers:` in meta.yaml. Reference: `layers/` + per-piece
`layers/` subdirs.

- Suitable when: multiple modalities matter (cursor + keys + audio),
  polyrhythmic clocks across layers, lead+texture+grain separation,
  audio-reactive pieces with section state machines.
- Reference pieces: cirrus (5 coprime tooth-wheels + haze + hub +
  rays + vignette), stronger (7 layers with black holes + glitch),
  in-seven (kaleidoscopic lattice with section state), so-hollow
  (apocalyptic arc with key-rays + fire columns).
- Wrong when: the piece is closed-brief monolithic (use A), or the
  emergent field is continuous and needs feedback (use C).

### Decision tree

Walk this in order. First match wins:

1. **Does the claim involve thousands of sub-pixel particles?** (smoke,
   murmuration, galaxy, nebula, plume, fog) → **D — density volume.**
2. **Does the canonical algorithm need per-agent neighbour reads or
   sequential collision logic, with N ≤ 200 discrete entities?** (boids
   small flock, billiards, dipole orbits, lensing weights) → **B — CPU-
   sim + sprite.**
3. **Does the canonical algorithm need state persistence between
   frames?** (Gray-Scott, ferrofluid PDE, Stam fluid, wave equation,
   Faraday) → **C — ping-pong feedback.**
4. **Does the piece have audio + cursor + keys all driving different
   visual contributions, OR a section state machine over an audio
   timeline?** → **E — layer stack.**
5. **Otherwise, math is closed-form per pixel:** → **A — per-pixel
   functional shader.**

### Common mistake: "boids in a fragment shader"

Hashing N agent positions inside a single fragment shader and reading
their density at each pixel sounds clever but produces NOT-boids:
without sequential per-agent updates (alignment / cohesion /
separation depending on this frame's neighbour reads), each "bird"
drifts independently on curl noise. The result is *scattered particles
on a flow field*, not *coherent flocking*. The canonical Reynolds
algorithm requires architecture B (CPU sim) or D (density-field
abstraction that doesn't pretend the birds are discrete). Naming
"boids" without picking the right architecture is the lie the
murmuration stress test caught.

## Anti-patterns drawn from the bottom-tier failures

When briefing a new piece, refuse to ship a brief that does any of
these:

1. **Names no canonical algorithm.** "A song about water" is not a
   brief; "a Chladni piece for John Butler's Ocean" is.
2. **Single locked subject.** "A pulsing sphere in the centre" fails
   eye-landing by construction.
3. **Cool-palette claim.** "Deep teal pool caustics" is a VISION
   violation at the brief level. Don't paint over it later.
4. **PDE without length scale.** If you're doing ping-pong with a
   reduced PDE, the brief must name the modulation that gives the
   field a length scale (Rosensweig hex, ember decay > injection).
5. **Requires keys / cursor to be alive.** If `u_mouse == (0,0)`
   means empty frame, the piece fails the idle probe at every grader
   and many viewers.
6. **Brightness-only audio coupling.** "Bass brightens the glow"
   fails the motion-over-luminance probe. Bass must move geometry —
   radii, angles, velocities, sample positions.

## How to reference this in a brief

```
brief: "A Gray-Scott piece (ref: ferment) for the wet-stone aesthetic
of a stream bed. Idle: pattern evolves slowly. Cursor: feeds
nutrients where it hovers. Audio: optional — mid drives diffusion
rate."

canonical_ref: ferment
warm_cycle: [near-black, ember, wine, cream]
eye_landing_candidates: ["pattern blobs", "blob splits", "filigree zones"]
idle_behaviour: "spots evolve autonomously over ~10s"
```

If you can't fill all four fields, the brief isn't ready.
