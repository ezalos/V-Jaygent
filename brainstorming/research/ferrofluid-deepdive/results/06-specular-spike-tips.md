## summary
A Rosensweig spike is a near-cylindrical tapered cone — its surface curvature along the spike axis is far smaller than around it. That asymmetry is exactly the geometry Kajiya–Kay derived for hair: the highlight stretches into a *line* along the tangent, not a Phong dot. Tips concentrate light because curvature peaks there. Use Kajiya–Kay or anisotropic-GGX with `αx ≪ αy`.

## why_mesmerizing
A round Phong dot on each spike makes them read as plastic dripping. A *line* highlight running up the spike axis makes them read as wet metallic mercury under a hard key — that is the look. When music drives spike growth, the highlight elongates with the spike, so "audio loud" visibly translates to "longer specular sliver" — phase-lock that doesn't depend on jitter, just on geometry. Tips catching disproportionate light gives the eye landing zones at every peak crown — the Kajiya–Kay "secondary highlight" shift adds a second, slightly desaturated streak that makes wetness read.

## concrete_steal
Per-fragment, given spike-axis tangent `T` (gradient-of-height, normalized along the up-slope), normal `N`, view `V`, light `L`:

```glsl
// Kajiya–Kay primary specular (line highlight along T)
float TdotL = dot(T, L);
float TdotV = dot(T, V);
float sinTL = sqrt(max(1.0 - TdotL*TdotL, 0.0));
float sinTV = sqrt(max(1.0 - TdotV*TdotV, 0.0));
float spec  = pow(max(sinTL*sinTV - TdotL*TdotV, 0.0), 80.0); // exp 60-120

// tip boost: curvature proxy = |∇²h|, or just height^k
float tipBoost = pow(clamp(h / hMax, 0.0, 1.0), 4.0);

// secondary shifted highlight (Marschner-style cuticle tilt ≈ 5°)
vec3 Tshift = normalize(T + 0.09 * N);
// ... repeat with Tshift and a softer exponent (~30) and 0.5 weight

vec3 keyWarm = vec3(1.00, 0.62, 0.22);  // sodium-orange env key
col += keyWarm * spec * tipBoost * 1.6;
```

Anisotropic-GGX alternative when you already have a microfacet pipeline: `αx = 0.05` (along-spike), `αy = 0.35` (around-spike), tangent = surface gradient of the height field. Use Heitz 2014 form, sample env reflection along the major axis (Chermain 2022). Equivalent visual, more correct under area lights.

## glsl_path
Display pass, ~15 ALU per fragment for Kajiya-Kay primary+secondary; ~30 ALU for full anisotropic-GGX. Tangent is free if you already compute height-field gradient for normals (rotate gradient 90° in tangent plane). Cost is fine even at 1080p.

## caveats
- Tangent direction must be the *axial* direction (up the spike) not the gradient direction (which points across iso-height contours). For a radially-symmetric spike the axial tangent is `normalize(N - vec3(0,1,0)*dot(N, vec3(0,1,0)))` reflected — i.e. the projection of `+up` onto the tangent plane. Get the axis wrong and the line highlight wraps the spike like a barber pole — looks broken.
- Highlight colour is the *environment's* colour (sodium-orange / warm-tungsten rig in our piece), NOT a property of the fluid. Painting the highlight white or cyan breaks the warm-bias palette rule and reads as plastic.
- Tip-boost using height alone fails on flat-top spikes near peak field — switch to a curvature proxy (`length(∇N)` or laplacian of h) once spikes saturate.
- Phong-with-rotated-anisotropy is a common bug: make sure the anisotropy direction varies *per-spike*, not globally — else all highlights point the same way and the surface looks brushed-metal flat.
- Don't double-count: if you use Kajiya-Kay, drop the isotropic Phong term entirely on the spike body. Stack them and the dot reappears.

## references
- Kajiya, J.T. & Kay, T.L. (1989). Rendering fur with three dimensional textures. *SIGGRAPH '89*. https://doi.org/10.1145/74333.74361
- Marschner, S. et al. (2003). Light scattering from human hair fibers. *SIGGRAPH '03*. http://www.graphics.stanford.edu/papers/hair/hair-sg03final.pdf
- Ashikhmin, M. & Shirley, P. (2000). An anisotropic Phong BRDF model. *J. Graphics Tools*. https://collections.lib.utah.edu/dl_files/77/ea/77eac0c124401e935d08fd9208b98c0990cb078c.pdf
- Walter, B. *Notes on the Ward BRDF* (PCG-05-06). https://www.graphics.cornell.edu/~bjw/wardnotes.pdf
- Heitz, E. (2014). Understanding the masking-shadowing function in microfacet-based BRDFs. *JCGT* 3(2), 48–107. https://jcgt.org/published/0003/02/03/
- Chermain, X. (2022). Bringing Linearly Transformed Cosines to Anisotropic GGX. *PACMCGIT*. https://doi.org/10.1145/3522612 — anisotropic env-reflection major-axis sampling.
- Shadertoy "Slope: GGX Anisotropic" (reference impl). https://www.shadertoy.com/view/3tyXRt
