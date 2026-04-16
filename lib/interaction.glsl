// ABOUTME: Canonical cursor-input helpers. Aspect-corrected world-space mouse,
// ABOUTME: idle detection, and a few composition primitives (radial zoom, gaussian heat).
#ifndef VJ_INTERACTION_GLSL
#define VJ_INTERACTION_GLSL

#include "math.glsl"

// Idle convention: the V-Jaygent runtime sends u_mouse == (0,0) when the
// viewer hasn't interacted. That's both the actual (0,0) pixel and the
// "no cursor" state — we treat them as equivalent because the bottom-
// left-pixel sentinel is ambiguous in any meaningful piece.
bool vjMouseIdle(vec2 uMousePx) {
    return uMousePx.x == 0.0 && uMousePx.y == 0.0;
}

// Mouse in world coords: origin at screen centre, aspect-corrected by the
// short axis so horizontal and vertical cursor moves feel equal. Range is
// roughly [-aspect, aspect] on x and [-1, 1] on y at the default
// resolution. When idle, returns a synthesised "off-screen" point
// (vec2(1e4)) so gaussian heat terms naturally fall to zero — prefer this
// to a bool guard in every piece.
vec2 vjMouseWorld(vec2 uMousePx, vec2 uResolution) {
    if (vjMouseIdle(uMousePx)) return vec2(1e4);
    return (uMousePx - 0.5 * uResolution) / min(uResolution.x, uResolution.y) * 2.0;
}

// Same as vjMouseWorld but returns vec2(0.0) when idle — for uses where
// the cursor is a pan offset and "idle" should mean "no pan" rather than
// "off-screen". Pick the variant that matches your semantics.
vec2 vjMouseWorldOrZero(vec2 uMousePx, vec2 uResolution) {
    if (vjMouseIdle(uMousePx)) return vec2(0.0);
    return (uMousePx - 0.5 * uResolution) / min(uResolution.x, uResolution.y) * 2.0;
}

// Radial zoom: distance-from-centre drives zoom, preserving both pan
// axes. Per brainstorming/techniques/interactivity.md §"mouse-Y → zoom"
// — the preferred alternative to axis-bound zoom in single-channel
// cursor systems. Centre of screen = 1.0 (no zoom); edge = 1 + k.
// Apply to world-space coords as `p / zoom` to zoom in as the cursor
// moves outward.
float vjRadialZoom(vec2 mouseWorld, float k) {
    return 1.0 + k * length(mouseWorld);
}

// Gaussian cursor heat: 1.0 at the cursor, falls off as exp(-r²/σ²).
// The standard "cursor-as-field-source" kernel. Dominance-probe friendly:
// limit caller-side strength ≤ ~0.3 of total structural energy.
float vjCursorHeat(vec2 worldP, vec2 mouseWorld, float sigma) {
    vec2  d = worldP - mouseWorld;
    return exp(-dot(d, d) / (sigma * sigma));
}

#endif
