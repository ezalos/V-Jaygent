// ABOUTME: Canonical Photoshop-family blend modes for layered composition.
// ABOUTME: All take (b: below, a: above, alpha: layer alpha) and return blended rgb.
#ifndef VJ_BLEND_GLSL
#define VJ_BLEND_GLSL

// `Normal` / `over` — workhorse. Respects alpha cleanly. Default for any
// layer with a real mask. `b` is preserved outside the mask; warm palette
// luminance contrast survives.
vec3 blend_normal(vec3 b, vec3 a, float alpha) {
    return mix(b, a, alpha);
}

// `Add` / `linear-dodge`. Saturates white fast on warm-on-warm: three warm
// layers added go cream. Use for ONE lead layer at a time; cap alpha so
// the maximum across-stack sum stays ≤ 1.4. See layered-composition.md
// anti-pattern 1 (cream soup).
vec3 blend_add(vec3 b, vec3 a, float alpha) {
    return b + a * alpha;
}

// `Screen` — inverse multiply. `1 - (1-a)(1-b)`. Brightens but asymptotes
// to 1 instead of overshooting; warm-on-warm overlap stays warm rather
// than going cream. Default for "lights" / glow layers.
vec3 blend_screen(vec3 b, vec3 a, float alpha) {
    vec3 s = b + (1.0 - b) * a;
    return mix(b, s, alpha);
}

// `Multiply`. Darkens. Use only for texture × tint (e.g. wine vignette
// pulling brights into deeper red). Two textured warm layers multiplied
// produces mud — never multiply texture × texture.
vec3 blend_multiply(vec3 b, vec3 a, float alpha) {
    return mix(b, b * a, alpha);
}

// `Max` / `lighten`. Per-channel max. Winner-takes-all; preserves sharp
// edges (sparks, lightning, ring fronts). Best mode for preserving
// luminance contrast across many layers because each pixel is fully one
// layer's, never an average.
vec3 blend_max(vec3 b, vec3 a, float alpha) {
    return mix(b, max(b, a), alpha);
}

// `Replace` — alias of `normal` at alpha=1. Used when a top layer must
// occlude (SDF mass, no see-through) so the eye reads it as "in front",
// not "blending with".
vec3 blend_replace(vec3 b, vec3 a, float alpha) {
    return mix(b, a, alpha);
}

#endif
