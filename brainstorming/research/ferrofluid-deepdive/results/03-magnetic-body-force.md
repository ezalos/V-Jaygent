# 03 — Magnetic body force on ferrofluid surface (Kelvin + Maxwell stress)

## summary
The force per unit volume on a magnetizable fluid is the *Kelvin body
force* `f = mu_0 * (M · ∇) H`, equivalently expressible via the
Maxwell stress tensor `T_ij = mu_0 * (H_i*H_j − ½ * H² * delta_ij)`
whose divergence gives the same body force in the bulk plus a normal
stress jump at the surface. The headline scalar consequence: in a
collinear `M ∥ H` regime, `f = mu_0 * M * ∇H` — fluid is pulled toward
**stronger field**, which is why spikes always point at the magnet.

## why_mesmerizing
Body force ∝ ∇H is what makes ferrofluid *reach for the magnet*. The
visual signature isn't the magnet pulling fluid sideways — it's fluid
*standing up* toward the field source, with each spike a tiny
self-organized field concentrator. That self-amplification (more
fluid → stronger local field → more force → more fluid) is the
positive-feedback loop the eye reads as "alive." Maxwell-stress
formulation buys you the surface jump for free, which is the moment
the membrane *snaps* into spikes — physics gives you the choreography
of attraction, surrender, equilibrium.

## concrete_steal
Treat the magnet as a 2D scalar field over the canvas:
`H(p) = H0 / (1 + |p − magnet_pos|^2 / r0^2)`
with `r0 = 0.20` (magnet "size") and `H0 = music_bass_env`.

Compute force as gradient (analytic, two derivatives):
```
dH = -2*H0*(p - magnet_pos) / (r0^2 * (1 + |p-magnet_pos|^2/r0^2)^2);
f  = chi * H * dH;        // Kelvin force, scalar M = chi*H
```
Inject `f` into the height-field momentum equation (item 02) as a
horizontal advection toward `magnet_pos` and an upward bulge
proportional to `H`:
```
vel  += dt * f * advect_gain;
h    += dt * H * lift_gain * mass_at_pixel;   // local lift toward magnet
```
For 3+ magnets (a song-section move) sum H-fields linearly and the
gradient too. Spikes at the *saddle points* between two magnets give
the iconic "trembling bridge" look.

Coupling map for the piece:
- `H0` (overall pull) → bass / sub envelope
- `magnet_pos` orbit speed → tempo (one revolution per N bars)
- multiple magnets at section change → snare hit ⇒ second magnet
  blooms in, fluid splits

## glsl_path
Display + sim. In sim pass (rgba16f), evaluate `H, dH` analytically
per pixel (cheap, ~8 ops). Add to velocity and height buffers from
item 02. **No need to solve Poisson** if you treat `H` as externally
imposed — that's the cheap-and-correct quasi-static approximation
when the fluid's induced field is small compared to the applied
field. For self-consistency (spike-tip field concentration) you'd need
a multigrid Poisson solve — skip for now, fake the concentration with
a `pow(H, 1.4)` nonlinearity in the lift term.

Cost: trivial unless you go full Poisson. ~30 ALU ops/pixel.

## caveats
- `f = mu_0 * M * ∇H` is the **collinear** form. If your H-field
  rotates (e.g., a moving magnet), the full `(M·∇)H` matters and the
  cross-terms create vorticity — that's the swirl you want. Don't
  drop them for a moving magnet.
- Maxwell stress tensor in vacuum vs in matter is a notorious sign-
  convention swamp (Minkowski vs Abraham). For our visual purposes
  the Kelvin-force formulation is unambiguous and sufficient; ignore
  the controversy.
- Without a saturation term in `M(H)`, force grows quadratically in
  `H` and the buffer explodes on bass drops. Use Langevin saturation:
  `M = M_sat * L(H/H_sat)` with `L(x) = coth(x) - 1/x`. Cheap
  approx: `M ≈ M_sat * tanh(H / H_sat)`.
- "Fluid follows the cursor" is the natural cursor binding (cursor =
  magnet). Resist the urge to *also* make the cursor warp space — let
  the magnetism narrative carry it.
- Common bug: forgetting that gradient of a *radial* field points
  *toward* the source (sign error). If your fluid runs away from the
  magnet, flip the sign on `dH` once and stop second-guessing.

## references
- Rosensweig, R. E. (1985) *Ferrohydrodynamics*. Cambridge University
  Press. (Canonical text; Ch. 4 has the body-force derivation.)
- Engel & Friedrichs (2002) "Maxwell's stress tensor and the forces
  in magnetic liquids" Am. J. Phys. 70, 428. DOI: 10.1119/1.1432971
  https://www.researchgate.net/publication/264608441
- Javanbakht et al. (2023) "Updated formulation of magnetic body
  force in ferrofluids".
  https://www.researchgate.net/profile/Zia-Javanbakht/publication/372531717
- Odenbach (ed.) *Colloidal Magnetic Fluids* (2009), Lect. Notes Phys.
  763. https://link.springer.com/book/10.1007/978-3-540-85387-9
- Kemp et al. (2022) "Force generation in electro-fluidic linear
  actuators with ferrofluid" Sci. Rep. 12, 22336.
  https://www.nature.com/articles/s41598-022-26190-2
- Sachiko Kodama "Protrude, Flow" (2001) — artistic reference for the
  *narrative* of magnetic body force as seduction.
  https://digitalartarchive.siggraph.org/artwork/sachiko-kodama-protrude-flow/
