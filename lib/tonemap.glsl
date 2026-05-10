// ABOUTME: Tone-mapping operators. Reinhard for warm work (rolls peaks to near-white),
// ABOUTME: ACES filmic for pieces that need stronger highlight compression.
#ifndef VJ_TONEMAP_GLSL
#define VJ_TONEMAP_GLSL

// Reinhard — simple division, peaks asymptote to 1.0. The house default: preserves
// warm hue through highlights, never clips to cyan/magenta. VISION.md tone policy.
vec3 reinhard(vec3 c) {
    return c / (1.0 + c);
}

// Partial Reinhard with a whitepoint — lets peaks exceed the soft-knee before
// compression takes full effect. whitepoint=4.0 is a reasonable default for
// high-dynamic-range scenes (fluid pieces with bright cursor bumps, lightning).
vec3 reinhardPartial(vec3 c, float whitepoint) {
    vec3 num = c * (1.0 + c / (whitepoint * whitepoint));
    return num / (1.0 + c);
}

// Narkowicz 2015 ACES approximation — filmic toe + shoulder. Slightly desaturates
// brights, which is the opposite of what VISION.md's warm policy usually wants;
// reach for this only when a piece genuinely needs filmic highlight behaviour.
vec3 aces(vec3 c) {
    const float a = 2.51, b = 0.03, cc = 2.43, d = 0.59, e = 0.14;
    return clamp((c * (a * c + b)) / (c * (cc * c + d) + e), 0.0, 1.0);
}

#endif
