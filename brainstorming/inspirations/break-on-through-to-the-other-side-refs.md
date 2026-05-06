# Break On Through to the Other Side — Psychedelic Physics References

## 1. Coupled Physics on Shadertoy

**[Reaction-Diffusion Simulation](https://www.shadertoy.com/view/3styzM)** —
Direct RD with diffusion-driven instability. Steal: 9×9 Gaussian blur
pipeline for diffusion; chain this output into advection forces to
stir patterns.

**[Interactive Fluid Simulation](https://www.shadertoy.com/view/XtGcDK)**
— Navier-Stokes advecting velocity fields. Steal: multi-buffer
feedback loop (A → B → C). Use fluid velocity to advect RD species,
creating organic morphing.

*Coupling strategy:* Gray-Scott RD generates activator/inhibitor
fields; pipe their gradient back into a force field that perturbs an
incompressible curl-noise advector; let the flow stir the RD patterns
back. Not parallel — true bidirectional coupling.

## 2. Historical Psychedelic Optics

**Joshua Light Show (Fillmore East, 1967–1971)** — oil-and-water in a
clock face, projected with overhead lights.
[Liquid Loops (1969)](https://www.moma.org/collection/works/200467)
is canonical. Steal: **the asymmetry**. Oil doesn't dissolve; bubbles
form fractal boundaries. Colors separate by immiscibility, not
gradient. Compose boundaries *topologically* (colors meet at
interfaces, not diffuse through).

**Mark Boyle / Boyle Family** — projected chemical reactions in real
time (oils, dyes, washing-up liquid). Met Soft Machine at UFO 1967.
Steal: **synaesthetic desynchrony**. Boyle didn't sync to the beat;
he set reactions going and the musician + audience found their own
sync. In shader: let coupled physics run at its own rhythm. Don't
gate it to BPM markers. At 184 BPM, half-time feels like 92; the RD
cycle time should float independently of the beat phase.

*Visual anchor:* Boyle's work emphasised **organic birth/death of
structure** — spots nucleate, spiral, annihilate. Not smooth
morphing.

## 3. Mathematical Substrate — Gray-Scott in the Chaos Crescent

[Pearson's parameter map](http://www.mrob.com/pub/comp/xmorphia/index.html).
Canonical: *f* ≈ 0.035–0.055, *k* ≈ 0.06–0.0625. Higher *f* → spots.
Lower *k* → spirals. The chaos crescent (around *f* ≈ 0.046,
*k* ≈ 0.063) lives at the boundary where structures barely hold
coherence — spots form, shrink, merge unpredictably. That's the
zone.

**Why Gray-Scott over FitzHugh-Nagumo?** F-N is strictly excitable
(fire-then-refractory). Gray-Scott lives in the chaotic boundary
between stable and oscillating regimes. We want unpredictable.

## 4. "Break On Through" — Non-cliché Literalisations

**Phase Boundary as Membrane (chosen).** Not a wall you smash; a
*permeable interface*. The RD field sits at the separatrix between
two stable states. Fluid turbulence *almost* pushes activator/
inhibitor across the threshold. The "break through" is the moment
chaotic stirring carries a region past the saddle point — it
suddenly ignites a new spiral or annihilation zone. No portal. Just
instability made visible. Perfect for a 3-physics coupling: the
membrane only ruptures because RD is being stirred AND shocked.

**Alternative — topological defect collision.** Detect spiral cores
in the activator field; when two oppositely-charged spirals collide,
flash + colour invert + rebirth. Saved for /vjay-iterate if v1 is
too smooth.

## References for deeper dive
- [Gray-Scott Model (CSAIL)](https://groups.csail.mit.edu/mac/projects/amorphous/GrayScott/)
- [Coupled Turing patterns (VisualPDE)](https://visualpde.com/nonlinear-physics/gray-scott.html)
- [FitzHugh-Nagumo excitable media (Scholarpedia)](http://www.scholarpedia.org/article/FitzHugh-Nagumo_model)

*Verify URLs later — pulled live 2026-05-06.*
