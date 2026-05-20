# We Owe No One — Forge & Fracture References

Research for the HIRAES "We Owe No One" piece. URLs gathered by an
Explore agent; verify before relying on any single one.

## Shadertoy Pieces & Moves

- **Voronoi Fracture** (https://www.shadertoy.com/view/llXXz4) —
  cellular tessellation with hard edges; steal the distance-field
  evaluation loop for cracking plate boundaries.
- **Lava Pool** (https://www.shadertoy.com/view/XdBBDG) —
  noise-driven luminance hotspots with glow; how it layers
  brightness into a dark base for an ember effect.
- **Repeatable 3D Worley Noise** (https://www.shadertoy.com/view/3d3fWN) —
  cell-based space subdivision with multi-neighbour distance queries.
- **Smooth Voronoi — Inigo Quilez**
  (https://iquilezles.org/articles/smoothvoronoi/) — foundational
  soft-edged fracture; the cell-space coordinate trick saves
  precision for fine crack networks. Also his F1/F2 edge-distance
  trick for crisp seams.

## Physics & Math

- **Lloyd Relaxation** (https://www.jasondavies.com/lloyd/) —
  iterative point redistribution converges to natural "tempered"
  cell layouts; molten-iron cooling where cracks follow
  minimum-energy paths.
- **Random Voronoi Tessellation for Fracture Simulation**
  (https://www.atlantis-press.com/article/25867858.pdf) — Voronoi
  cells model stress-relief boundaries; cracks propagate along cell
  borders under thermal strain.

## Heat & Colour Physics

- **Blackbody Radiation Colour Ramps**
  (https://blog.mmacklin.com/2010/12/29/blackbody-rendering/) —
  kelvin → RGB: 2000K deep orange, 3000K amber-white, 4500K+ pale
  yellow. This IS the V-Jaygent warm cycle, physically honest: the
  forge palette is literally a blackbody curve. Cold iron =
  near-black/wine; molten = ember→amber→white-hot.
- **BlackBodyRadiation (HLSL)**
  (https://github.com/zubetto/BlackBodyRadiation) — drop-in
  temperature→RGB conversion.

## Steal-this (the three moves)

1. **Cell-edge glow** — Voronoi F1/F2 edge distance → threshold near
   borders → multiply by heat ramp → bloom. The white-hot seams.
2. **Thermal relaxation** — animate cell-point migration to suggest
   cooling/settling between hammer-strikes.
3. **Crackle on beat** — percussive strikes pulse a per-cell
   "fracture age"; age drives edge thickness + a hash displacement
   of the cell centre that decays over the bar.
