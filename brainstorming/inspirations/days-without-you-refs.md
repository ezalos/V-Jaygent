# Days Without You — Quantum Double-Well Refs

## 1. Visscher staggered-leapfrog (THE scheme — load-bearing)

Source: P. B. Visscher, *"A fast explicit algorithm for the time-dependent Schrödinger
equation,"* Computers in Physics 5, 596 (1991). Discrete form confirmed against the
SciPy Cookbook FDTD page.

Split ψ = R + iI. Store R and I at **staggered half-time-steps** (R at integer steps,
I at half-steps). Discrete Hamiltonian on the grid:
`H·f[x] = -(ħ²/2m)·∇²f + V·f`

Update (I from R's spatial term, then R from the just-advanced I — that staggering is
what makes it explicit AND stable, unlike FTCS which blows up):

```
I_new = I_old + dt·( 0.5·lap(R_old) - V·R_old )
R_new = R_old - dt·( 0.5·lap(I_new) - V·I_new )
```

(ħ=m=1, dx=1 grid units; lap = discrete Laplacian. In this piece V is V_eff = V_pot +
g·|ψ|² for the Gross–Pitaevskii nonlinearity.)

**Stability:** `dt ≤ ħ / ( 2ħ²/(m·dx²) + Vmax )`. With a 9-pt Laplacian the kinetic
term contributes ~2.7 to H_max; keep `dt·(2.7 + Vmax + g·ρmax) ≲ 2`. dt≈0.15 is safe
for Vmax≈3.

**Probability current** (render flow): `j = (ħ/m)·Im(ψ*∇ψ) = R·∇I − I·∇R`. |j| → ember
brightness, direction → warm hue shift.
Refs: https://pubs.aip.org/aip/cip/article/5/6/596/279764 ·
https://scipy-cookbook.readthedocs.io/items/SchrodingerFDTD.html

## 2. GPU / Shadertoy implementations
- **davidar, "Shaders of Schrödinger"** https://davidar.io/post/quantum-glsl — full
  fragment-shader TDSE. Steal: complex-as-vec2, 5-point Laplacian by direct neighbor
  texel reads, phase coloring via `atan(I,R)`. (Uses RK4 — swap in Visscher, keep the
  buffer plumbing.)
- **Wave Equation Sim (Shadertoy DsKBRw)** — cleanest ping-pong buffer + finite-
  difference stencil + edge handling reference. (Shadertoy blocks automated fetch;
  creator names verify-later.)

## 3. Absorbing boundary (stop edge pile-up)
**Complex absorbing potential (CAP):** in a ring ~10–20 cells wide around the edge,
multiply ψ by `exp(-λ(r)·dt)` (λ ramps smoothly, quadratic, to a small max at the very
edge). Bleeds outgoing packets before they reflect. Gentle ramp — a sharp wall reflects.
Ref: https://www.sciencedirect.com/science/article/abs/pii/S0009261498006277

## 4. Double-well tunneling physics (the "beating" = the thesis)
A packet in one well = superposition of symmetric (ground) + antisymmetric (1st excited)
eigenstates, split by the **tunnel splitting ΔE**.
- **Beat period `T = h/ΔE`** — probability sloshes fully across and back in T. This IS
  the visual rhythm; tune ΔE so T matches phrasing.
- **Barrier ↑** → ΔE shrinks exponentially → T grows (slow, ghostly tunneling = absence).
  **Barrier ↓** → fast obvious sloshing (reunion). Very low barrier → merged well, packet
  just rings.
- **Momentum kick** (`ψ → ψ·exp(ikx)`) on a bound packet → excites higher eigenstates →
  the clean beat breaks into messier asymmetric Josephson oscillation + **self-trapping**
  (with the nonlinearity g it locks on one side — "days without you" made literal). Great
  for drops.
Refs: https://arxiv.org/pdf/0803.3113 ·
https://journals.aps.org/pra/abstract/10.1103/PhysRevA.85.013410

## 5. Warm-palette steal (avoid clinical blue-on-black)
- Map |ψ|² to **luminance only**, drive hue through a fixed warm ramp
  (near-black → wine → ember → amber → cream). Phase (`atan`) only rotates hue *within*
  the warm band — never picks a cool hue.
- Additive bloom on hot probability cores (blackbody-style emission); film grain +
  vignette so the grid never reads as a physics demo.
