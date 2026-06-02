// ABOUTME: Fragment shader for piece "silk".
// ABOUTME: Replace this starter with actual art — keep the warm cycle +
// ABOUTME: multi-scale + idleDrift bones, replace the math.
#version 300 es
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "palette.glsl"
#include "tonemap.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform int   u_frame;

out vec4 fragColor;

// Idle drift — slow composition motion that survives u_mouse=(0,0).
// Two coprime periods so the eye never quite predicts the next moment.
// Replace the constants for taste, but keep SOMETHING here — bare u_time
// loops fail the prediction probe and the lint-idle motion threshold.
vec2 idleDrift(float t) {
    return 0.18 * vec2(
        sin(t * 0.13) + 0.5 * cos(t * 0.071),
        cos(t * 0.11) + 0.5 * sin(t * 0.063)
    );
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);

    // Multi-scale field: macro structure (fbm at 1.5x) mixed with fine
    // churn (vnoise at 8x on a different clock). Minimum two octaves —
    // single-FBM-octave pieces fail the depth probe.
    vec2 drift = idleDrift(u_time);
    float macro = fbm(uv * 1.5 + drift);
    float micro = vnoise(uv * 8.0 - drift * 0.7 + vec2(u_time * 0.03, 0.0));
    float field = mix(macro, micro, 0.35);

    // Warm cycle through the canonical palette helper. DO NOT replace
    // with ad-hoc vec3 colour literals — cool intrusions break VISION
    // and trip bin/lint-palette.mjs.
    float hue = 0.05 * u_time + 0.6 * field;
    vec3 col = warmCycle(hue);

    // Luminance envelope — dark zones + bright zones (intensity dim,
    // quiet-reads-quiet probe).
    col *= 0.25 + 0.85 * smoothstep(0.20, 0.85, field);

    fragColor = vec4(reinhard(col), 1.0);
}
