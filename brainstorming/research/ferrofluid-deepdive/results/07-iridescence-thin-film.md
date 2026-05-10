# 07 — Iridescence + thin-film interference at peaks

## summary
Real ferrofluid is engineered black (~5% magnetite + ~10% surfactant + ~85%
hydrocarbon carrier) and reads as matte black with sharp speculars; the
"iridescent ferrofluid" videos circulating online are cosmetic toys with a
thin oil/surfactant film on top producing thin-film interference (constructive
peaks at `2·n·d·cos(θ) = (m + ½)·λ`, classic film thicknesses ~150–700 nm).
For a warm-only V-Jaygent palette we keep the matte-black body but spike a
narrow, low-amplitude warm iridescence band on the highest-curvature ridges —
gold/copper/amber sweep, no cyan/violet excursions.

## why_mesmerizing
Pure black + spec is recognizable as ferrofluid but visually flat. A whisper
of hue-shift on the moving ridge edges adds a "wet" quality the eye can't
predict — small viewing-angle changes produce visible color sweep, which
parses as a 3D surface even though we are 2D, and gives the cursor something
to discover (move slowly along a peak, watch the band slide). Crucially this
sells the *film* over the black body, which is exactly the cosmetic-toy look
people associate with hypnotic ferrofluid clips.

## concrete_steal
Belcour & Barla 2017 is overkill for a fragment shader; use the Khronos
`KHR_materials_iridescence` simplification: parameterize a thickness
`d(x,y) = mix(180.0, 520.0, curvature)` nm (peaks thicker), `n_film = 1.30`,
compute view-cos `c = dot(N, V)`. Approximate the spectral integral with
three cosines tuned to warm wavelengths only:

```glsl
// d in nm, n in [1.3..1.5], c = dot(N,V)
float opd = 2.0 * n_film * d * c;          // optical path diff (nm)
vec3  k   = 6.2831853 / vec3(620.0, 580.0, 540.0); // R/Y/G in nm⁻¹
vec3  iri = 0.5 + 0.5 * cos(k * opd + vec3(0.0, 0.6, 1.2));
iri = pow(iri, vec3(2.0));                 // sharpen bands
iri *= warmMask;                            // gate to amber/copper only
color += spec_strength * iri * fresnel * curvature_mask;
```

Gate via `curvature_mask = smoothstep(0.6, 0.95, |∇h|)` so iridescence shows
*only* on ridges, not flat black body. Drop the green term or remap to copper
(630/600/580 nm) if any cool tint slips through.

## glsl_path
Display pass only. ~6 mul + 2 cos + 1 pow per pixel (~20 ALU). Curvature mask
reads from height-field gradient already computed for normals (item 09); free.
Add as additive term on top of the matte-black + Phong spec result. Keep
amplitude low (`spec_strength * iri ≤ 0.15`) — this is seasoning, not entrée.

## caveats
- Cool excursions (cyan/violet) WILL appear if you sweep the full spectrum;
  warm-bias palette is mandatory per VISION.md so clamp wavelengths to
  540–650 nm and skip purple/blue.
- Iridescence on flat regions reads as cheap holographic-sticker; gate hard
  on curvature.
- Belcour-Barla full model has a Fourier-domain pre-integration that's
  expensive and tuned for spectral renderers — the cosine approximation
  above is what gltf/Filament ship in real-time.
- Thin-film band slides with view angle. We have no camera motion, but
  `n` should depend on the local normal (item 09) so different ridges show
  different bands — gives the "alive" feel.
- Don't double-light: iridescence already implies a direction; keep it on
  the same `dot(N,V)` term as Fresnel.

## references
- [KHR_materials_iridescence (Khronos glTF)](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_iridescence/README.md) — IOR 1.3, 100–400 nm default thickness, ships GLSL reference for Fresnel-iridescence
- [Belcour & Barla 2017 — A Practical Extension to Microfacet Theory for Iridescence](https://belcour.github.io/blog/research/publication/2017/05/01/brdf-thin-film.html) — paper + supplemental code
- [Belcour 2017 SIGGRAPH slides](https://belcour.github.io/blog/slides/2017-brdf-thin-film/slides.html)
- [Wikipedia — Thin-film interference](https://en.wikipedia.org/wiki/Thin-film_interference) — `2·n·d·cos(θ) = (m − ½)·λ` with phase-shift correction
- [Shadertoy — IRIDESCENCE: THIN FILM (view 7sV3Rh)](https://www.shadertoy.com/view/7sV3Rh)
- [Shadertoy — Physically-Based Soap Bubble (view XtKyRK)](https://www.shadertoy.com/view/XtKyRK) — 81-wavelength reference, 150–700 nm range
- [Shadertoy — Simple Iridescence (view 3cjcRy)](https://www.shadertoy.com/view/3cjcRy) — cheap thickness×NdotV approximation
- [Wikipedia — Ferrofluid](https://en.wikipedia.org/wiki/Ferrofluid) — confirms the body is engineered opaque-black, iridescence is on the carrier-oil film
