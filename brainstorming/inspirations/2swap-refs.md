# 2swap — artist study

Study commissioned 2026-05-22 (Louis: "his YouTube videos are so
mesmerizing — gravity basins, chaotic systems"). Feeds the technique
note `brainstorming/techniques/basins-of-attraction.md` and a
gravity-basin piece.

## Who

2swap (channel [@twoswap](https://www.youtube.com/@twoswap)) makes
videos about **emergent systems in mathematics** — chaos, dynamical
systems, fractals, combinatorial game theory. In the 3Blue1Brown
lineage but tilted toward *emergence*: the recurring beat is "a simple
rule was secretly hiding all of this." 3Blue1Brown publicly praised
his double-pendulum video.

Everything is rendered with his own open-source C++/CUDA engine
**[swaptube](https://github.com/2swap/swaptube)** — no Manim, no
graphics libraries. Time is organised into **Macroblocks** (one per
spoken sentence, audio-atomic) and **Microblocks** (visual-transition
atoms). Every visual transition is locked to the narration. That
audio-locked timing is the single most VJ-relevant idea in his
pipeline — for us the analogue is locking transitions to bar/beat/
section, not to a narrator.

## Catalog

Newest first (channel RSS exposes ~15):

- **I Solved Connect 4** (2026-04) — world-first *visualizable*
  solution, rendered as a navigable game-state graph.
- **Mystery of the Quintic** (2025-11) — Abel–Ruffini; interactive
  polynomial roots. Pairs with the
  [Littlewood Polynomial Fractal Explorer](https://2swap.github.io/LittlewoodFractal/)
  — roots of ±1-coefficient polynomials forming a dragon-curve cloud.
- **How does 2swap animate his fractal videos? [TUTORIAL]**
  ([paqBduieRks](https://www.youtube.com/watch?v=paqBduieRks)) — the
  swaptube walkthrough.
- **I Solved Klotski** (2025-08) — sliding-block puzzle solved by
  rendering its entire state graph; the puzzle's *shape* is the graph.
- **Double Pendulums are Chaoticn't**
  ([dtjb2OhEQcU](https://www.youtube.com/watch?v=dtjb2OhEQcU),
  2025-07) — flagship chaos video, scored by 6884.
- **What is PLUS times PLUS?** (2025-03) — lambda calculus, animated
  beta-reductions of visual lambda diagrams.
- **Mandelbrot's Evil Twin** (2024-11) — generalized Mandelbrot sets
  with complex exponents; unfamiliar "abyss" fractal geometry.
- **GRAVITY BASINS**
  ([LavXSS5Xtbg](https://www.youtube.com/watch?v=LavXSS5Xtbg),
  2024-08) — basins of attraction for an n-body gravity field, scored
  by 6884. The video Louis named.
- 2023–24 **Connect 4** series (brute force, Claimeven, threat
  analysis, parity) — emergent combinatorial structure.

## The chaos vein — what we steal

The signature technique is **basin-of-attraction coloring**: every
pixel is an *initial condition*, you run a deterministic simulation
from it, and you color the pixel by the **outcome** — which gravity
well captures the particle, how long until escape, which root the
iteration converges to. The image is not a picture of an object; it
is a **map of fate over phase space**.

In *Gravity Basins*, each pixel is a particle's start position in an
n-body field; integrate Newtonian gravity, color by which body
captured it. Adjacent pixels with near-identical starts fall into
different basins → the signature output: **smooth lakes of solid
color (regular regions) shredding into infinitely fine fractal
filigree at the boundaries (chaotic regions)**. The mesmerizing part
is that you wrote a 1/r² law and *fractal coastlines appeared* —
structure you never authored.

*Double Pendulums* does the same over a grid: color encodes
sensitivity — calm where two near-identical pendulums stay together,
hot where they diverge exponentially (a Lyapunov map). The thesis,
"chaotic*n't*", is that chaos is **not uniform** — there are real
islands of stability, and the visual makes them legible.

**The reveal arc.** His videos start with *one* legible trajectory
(a single pendulum, one particle) then *fan out* to the whole
phase-space grid — the audience watches the fractal assemble. A
fractal *zoom* is the same beat stretched in scale. The emotional
payoff is always deferred, then delivered on screen.

**Sonification.** He maps chaotic state to sound so you can *hear* a
trajectory tip from periodic into chaos (6884 scores the chaos
pieces). For V-Jaygent the coupling runs the other way — audio drives
visuals — but the spirit transfers: the field must feel *coupled* to
the music, not merely accompanied.

## Aesthetic

- **Color is data.** Hue = which-outcome; brightness = how-fast /
  how-chaotic. Never decorative. swaptube works in **OKLAB** for
  perceptually-even lightness ramps.
- **Palette.** Deep blue-black voids, luminous accent ramps, high
  luminance contrast. *V-Jaygent is warm* — a faithful translation
  keeps cream-on-near-black contrast but warms the accent ramp.
  Warm-on-warm collapse stays the trap (see `tasks/lessons.md`).
- **Composition.** One dominant field per frame, generous negative
  space, a real macro brightness envelope (bright basins vs dark
  escape regions).
- **Motion.** Smooth, deterministic, *physically integrated* — it has
  the inevitability of a real ODE, never keyframed or `rand()`-jittered.

## Anti-patterns for V-Jaygent

- **Narration pacing.** swaptube times visuals to spoken sentences;
  we have no narrator. Replace sentence-cadence with beat/bar/section
  cadence. Don't inherit "hold a still for 8 seconds."
- **Single-focus monoscene.** His one-thing-per-frame clarity is for
  teaching. Borrow basin-coloring as *one layer* of a 2–6 layer
  stack, not the whole piece.
- **Cold palette.** Blue-black-on-void fights our identity; warm it,
  but watch the contrast floor.
- **Non-interactive determinism.** A basin map from fixed initial
  conditions is identical every run — a video, not a VJ piece. The
  attractor positions / coupling / zoom centre **must** be driven by
  cursor + audio + keyboard.
- **Explanatory typography.** LaTeX overlays are educational
  furniture — drop entirely.

## What I'm cultivating from this

The thing to internalise is not the cool palette or the slow
narration. It is: **the image is a map of fate over phase space, and
the mesmerizing structure was emergent, never authored.** That is a
new generator for V-Jaygent — distinct from noise, distinct from
plotting a strange attractor directly (`strange-attractors.md`).
Recipes live in `basins-of-attraction.md`; the first piece is a
gravity-basin field.

## References

- [2swap channel](https://www.youtube.com/@twoswap) /
  [uploads playlist](https://www.youtube.com/playlist?list=UUiNLr9wX35KksK77mrQgxiw)
- [GRAVITY BASINS](https://www.youtube.com/watch?v=LavXSS5Xtbg)
- [Double Pendulums are Chaoticn't](https://www.youtube.com/watch?v=dtjb2OhEQcU)
- [swaptube tutorial](https://www.youtube.com/watch?v=paqBduieRks)
- [github.com/2swap/swaptube](https://github.com/2swap/swaptube) — renderer source
- [MetaFilter: visualization & sonification of chaos](https://www.metafilter.com/209563/)
- [Littlewood Fractal Explorer](https://2swap.github.io/LittlewoodFractal/)
