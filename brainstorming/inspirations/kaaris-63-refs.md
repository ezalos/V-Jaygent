# Kaaris "63" — Obsidian Fracture Network: Reference Collection

Track: dark, hard French trap. Heavy 808 sub-bass, machine-gun hi-hat
rolls, menacing/industrial mood. 123 BPM, A# minor, ~4:17.

Thesis: a near-black volcanic-glass surface cracked into a Voronoi cell
network, where the 808/bass sends shockwaves of molten light TRAVELING
ALONG the fault lines (anisotropic, gated by the crack distance field —
not plain radial bloom), hi-hat rolls skitter as fine sparks along
edges, a central molten core pulses with the vocal flow, downbeats snap
the shard lattice. Palette strictly warm: near-black → blood-ember →
wine → amber → cream. No cool intrusions.

### Core Shader Techniques

**1. Voronoi Fracture Network — Edge Distance Trick**
- [Faster Voronoi Edge Distance](https://www.shadertoy.com/view/llG3zy) /
  [voronoi fracture](https://www.shadertoy.com/view/llXXz4) (IQ / Gustavson)
- Steal: F1/F2 distance field — distance to closest (F1) and
  second-closest (F2) feature point; edge visibility is `F2 - F1`,
  giving parametric crack thickness. The difference map *directly*
  renders the fault-line network.

**2. Canonical Worley/Cellular F1/F2**
- [glsl-worley](https://github.com/Erkaman/glsl-worley) /
  [Red Blob cellular demo](https://www.redblobgames.com/x/2107-webgl-noise/webdemo/cellular.html)
- Steal: tile-space subdivision (check own tile + 8 neighbours, not a
  global scan) for O(1) Voronoi. Jitter parameter → volcanic chaos.

**3. Lava Crack + Glow Interior**
- [Molten Shapes](https://www.shadertoy.com/view/WXyfzw) /
  [MAGMA ELEMENTAL](https://www.shadertoy.com/view/sdBGWh) /
  [Lava Pool](https://www.shadertoy.com/view/XdBBDG) (nimitz + community)
- Steal: per-octave rotated flow-noise → directional flow; a *separate
  emission map* beneath the dark surface, glow rendered additively;
  blackbody amber→cream colour shift by intensity.

**4. Shockwave Ring Emission (808 propagation)**
- [Iso Explosion Shockwave](https://www.shadertoy.com/view/ldtBzr) /
  [JujuAdams/Shockwave](https://github.com/JujuAdams/Shockwave)
- Steal: ring = `abs(distance(uv, origin) - time*speed)`; smoothstep for
  width. Gate the ring along crack-line low-distance regions for the
  anisotropic "light runs through the cracks" read.

**5. Physical grounding — basalt columnar jointing**
- [Nature: microwave-heated basalt crack networks](https://www.nature.com/articles/s41598-019-49049-5)
- Cooling lava cracks inward from boundaries following the
  solidification front (self-similar branching); heat escapes along
  fractures *before* they seal. Validates the look: cracks as primary
  light *conductors*, not just visual breaks.

### Implementation road
1. Voronoi F1/F2 difference map = base obsidian geometry.
2. Gate emission through the crack network (`F2-F1 < threshold`).
3. Flow-noise displacement on the molten interior (nimitz).
4. 808 → shockwave ring; hi-hat content → ring-edge skitter width.
5. Anisotropic warm colour bleed along crack normals (no cool).

(URLs from training knowledge + web; verify before citing externally.)
