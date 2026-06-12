# "No Son Of Mine" — reference study

Track: Genesis, 1991 (We Can't Dance). 400s, 103.4 BPM, E minor.
Theme: estrangement — a son flees an abusive home, returns, is
rejected. Sonic signatures: the distorted "growl" motif, drum-machine
dread vamp, restrained verses vs huge choruses, late peak, sudden
quiet collapse.

## Physics phenomena (the structural-truth candidates)

**Spinodal decomposition (Cahn-Hilliard)** — a mixed phase
spontaneously splits in two without nucleation; no energy barrier,
only instability. Bicontinuous labyrinth coarsens over time; domain
walls move by curvature. The "two things that cannot stay mixed"
equation. Refs: Wikipedia "Spinodal decomposition"; Nature Sci Rep
srep20806 (anisotropic spinodal patterns).

**Magnetic domain walls (Ising)** — two-state frustration, sharp
boundaries that move under field/thermal stress. Sibling metaphor;
CH is the richer visual (conserved mass → labyrinths, not just
coarsening blobs).

## Shader techniques

- **Gray-Scott RD** (amandaghassaei/ReactionDiffusionShader, WebGL) —
  the in-repo sibling is `pieces/ferment`. CH differs: conserved
  order parameter, 4th-order operator, 13-point stencil in one pass.
- **Voronoi fracture / glass-break** (Lord0Sanz Godot glass-break) —
  optical rupture on impact; steal the *refraction shock ring*, not
  the literal cracks.
- **fBm + |x| sharpening** (Book of Shaders ch. 13) — crisp network
  ridge lines from `1-|fbm|`; useful for wall-glow shaping.

## Artists — one steal each

- **Dave Whyte (@beesandbombs)** — subdivides space into cells that
  phase-shift; perfect loop discipline. Steal: cell-level phase
  offsets so the field never moves as one block.
- **Keijiro Takahashi** — post-process field warping passes. Steal:
  displacement-as-percussion (a beat is a *warp*, not a flash).

(URLs from web search 2026-06-12; verify on use.)
