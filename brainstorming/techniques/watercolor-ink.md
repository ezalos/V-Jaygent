# Watercolor / ink — the look without the solver

Seeded by Zach Lieberman's "ink watercolor simulation" (see
`inspirations/x-finds-2026-06-10.md`). Sister doc to
`fluid-dynamics.md` — that one is about *motion*; this one is about the
*paint look* you bolt on top of motion.

## The key insight

A full fluid sim reads as **dye / smoke in water**, not **paint on
paper**. What separates "watercolour" from "generic fluid" is a small,
specific set of optical cues — none of which need a Navier-Stokes solve:

1. **Edge-darkening** (the dark rim where a wash ends — *the single most
   identity-defining cue*). Water evaporates at the pinned edge and
   carries pigment there.
2. **Granulation** (grainy speckle — pigment pools in the paper's
   valleys, bare on its peaks).
3. **Subtractive colour mixing** (overlapping glazes go *darker + hue
   shift*: yellow over blue → green, never additive grey).
4. **Wobbly, noisy wash boundaries** (never a clean SDF edge).
5. **Backruns / blooms / cauliflowers** (optional; branching blotches
   with darkened rims — only if blooms are the thesis).

Canonical physics is Curtis et al., *Computer-Generated Watercolor*
(SIGGRAPH 1997): three-layer shallow-water sim + Kubelka-Munk
compositing. **Drop almost all of it** for the look.

## The Lieberman route (recommended core)

His own statement: *"displacement after displacement in shader code."*
Not a solver — iterated UV displacement by a flow field, fed back.
Reuse `fluid-dynamics.md`'s curl-noise field as the displacement, run it
ping-pong (`passes:` or `u_history`), drop pigment at the cursor / on the
beat, advect, decay slightly. That's the living milk-in-coffee bleed.

## Implementable cues (lift one at a time)

**Edge-darkening (blur-difference) — the flip from dye to paint:**
```glsl
vec3 blurred = gaussianSmall(colorTex, uv);   // ~σ=3, tiny kernel
float edge   = max(max(abs(color.r-blurred.r),
                       abs(color.g-blurred.g)),
                       abs(color.b-blurred.b));
color = pow(color, vec3(1.0 + edge * k));      // clamp k; over-darkens thin features
```
The difference term is only large at boundaries → only rims darken.
Needs one blur, so a 2nd buffer (or reuse `u_history`).

**Granulation — the per-pixel paper texture (static, not fed back):**
```glsl
float paper = vnoise(p*0.06)*0.5 + vnoise(p*0.12)*0.3 + hash(p*0.3)*0.2;
float density = 1.0 - smoothstep(0.25, 0.65, paper);   // valleys catch pigment
wash = mix(paperColor, pigment, density * 0.7);
```
Nice touch: granulating pigments split warm/cool as they settle —
`mix(warm, cool, vnoise(p))` inside the density term.

**Subtractive mixing — multiply, don't `mix`/`add`:**
- `mix` = muddy average (wrong). `+` = blows to white (that's light).
- Cheap-correct = **multiply in reflectance space**: `result = base *
  glaze` (or `min`) — each glaze can only absorb/darken. 80% of
  Kubelka-Munk for one op. Full KM only if overlap hue-shift is a thesis.

**Wobble edges — offset the boundary by fbm:**
```glsl
float paint = step(edgePx + fbm(coord*0.008)*roughPx, distToBorder);
```

## Gotchas (from my memory notes)

- **Float textures mandatory** for any fed-back diffusion buffer — 8-bit
  quantizes into banding (same class as the `u_history` noise-artefact
  lesson). Keep **granulation static** (a fresh sample each frame), never
  baked into a decaying buffer, or the grain aliases.
- **Diagonal-flow shimmer** (anemone): give the warp field different time
  multipliers per axis or the whole field slides diagonally.
- Prefer **fbmRot** for the curl potential — grid-aligned fbm patches
  show through high-decay feedback.

## Architecture verdict

Layer stack, not a monolith: (1) ping-pong bleed layer (curl-displacement
feedback, cursor/beat seeds pigment) → (2) static granulation multiply →
(3) edge-darkening post → (4) subtractive composite between pigment
layers. → `pieces/ink-bloom.md`.

## References

- Curtis et al. 1997 — <https://grail.cs.washington.edu/projects/watercolor/>
- JRMeyer ghostty-watercolors (pure-frag fakes, one effect per file) —
  <https://github.com/JRMeyer/ghostty-watercolors>
- gracelgilbert/watercolor-stylization (blur-diff edge-darkening + fbm
  granulation) — <https://github.com/gracelgilbert/watercolor-stylization>
- Lieberman, "Daily Sketching in 2025" —
  <https://zachlieberman.medium.com/daily-sketching-in-2025-60189ffd6b60>
