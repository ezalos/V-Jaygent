#version 300 es
// ABOUTME: Flow-warm — visualises the consumed force field directly via its
// ABOUTME: divergence/curl, domain-warps u_below by it, and uses u_history for
// ABOUTME: persistent flow trails. The field drives the look; fbm is texture
// ABOUTME: only.
precision highp float;

#include "noise.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_bass;
uniform sampler2D u_below;
uniform sampler2D u_history;
uniform sampler2D u_force;
out vec4 fragColor;

vec2 decodeForce(vec2 uv) {
    return texture(u_force, uv).rg * 2.0 - 1.0;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;

    // Sample force at uv + neighbours for divergence + curl. The published
    // field is over [0,1] UV space; sample with a tighter epsilon than
    // the screen so we get sub-pixel gradients.
    vec2 px = 1.0 / u_resolution;
    float h = 2.5 * px.x;
    vec2 f   = decodeForce(uv);
    vec2 fxp = decodeForce(uv + vec2(h, 0.0));
    vec2 fxm = decodeForce(uv - vec2(h, 0.0));
    vec2 fyp = decodeForce(uv + vec2(0.0, h));
    vec2 fym = decodeForce(uv - vec2(0.0, h));
    float divergence = (fxp.x - fxm.x + fyp.y - fym.y) / (2.0 * h);
    float curl       = (fxp.y - fxm.y - (fyp.x - fym.x)) / (2.0 * h);

    // Iterative domain warp: each fbm sample is warped by the current field
    // position. The masses' pull regions bend the fbm coordinates strongly,
    // creating visible vortices and ridges where the field is non-uniform.
    float warpAmt = 0.55 + 0.20 * u_audio_bass;
    vec2 q1 = uv + f * warpAmt;
    float n1 = fbmRot(q1 * 3.5 + vec2(u_time * 0.15, 0.0));
    vec2 q2 = uv + f * warpAmt + vec2(n1) * 0.35;
    float n2 = fbmRot(q2 * 8.5 - vec2(0.0, u_time * 0.22));
    float band = smoothstep(0.40, 0.78, mix(n1, n2, 0.55));

    // Visual contribution from the FIELD itself: convergent zones (divergence
    // < 0, fluid pulling in to a mass) glow warm; divergent zones go dark.
    // Curl creates a hue shift along the band to add depth without leaving
    // the warm family.
    float convergence = clamp(-divergence * 0.18, 0.0, 1.0);
    float spin        = clamp(abs(curl) * 0.05, 0.0, 1.0);
    vec3 fieldGlow = vec3(1.10, 0.50, 0.15) * convergence
                   + vec3(0.85, 0.30, 0.05) * spin * 0.5;

    // Advect u_below STRONGLY by the field — the underlying gradient gets
    // pulled into the masses, contributing the deep wine in convergent areas.
    vec2 advUv = uv - f * (warpAmt * 0.40);
    vec3 below = texture(u_below, advUv).rgb;

    // Deepen the wells: where convergence is high, darken the base. Keeps
    // the eye reading "fluid pulled into something" rather than uniform haze.
    below *= mix(1.0, 0.35, convergence);

    // History feedback advected by the field — flow lines persist a few
    // frames so the eye reads streamlines, not static noise.
    vec3 hist = texture(u_history, uv - f * (warpAmt * 0.55)).rgb * 0.78;

    vec3 col = below + fieldGlow * band;
    col = max(col, hist);
    fragColor = vec4(col, 1.0);
}
