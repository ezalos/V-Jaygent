#version 300 es
// ABOUTME: Flow-warm layer — consumes a 2D force field (rg-encoded) and uses
// ABOUTME: it to advect the sample of u_below + an internal warm fbm. The
// ABOUTME: result reads as a slow viscous flow gathering toward the
// ABOUTME: published mass points.
precision highp float;

#include "noise.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_bass;
uniform sampler2D u_below;
uniform sampler2D u_history;
uniform sampler2D u_force;
out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;

    // Decode the published force (signed) and step backward — semi-Lagrangian
    // advection. Strength modest so the underlying gradient stays readable
    // through the warp.
    vec2 force = texture(u_force, uv).rg * 2.0 - 1.0;
    float strength = 0.045 + 0.025 * u_audio_bass;
    vec2 q = uv - force * strength;

    // Advect u_below — pixels of the layer beneath get carried by the field.
    vec3 below = texture(u_below, q).rgb;

    // Internal warm noise that the field also stirs, layered on top of the
    // advected base for added texture. Slower clock than the field itself
    // (fbm time at ~0.18× the lodestone clock).
    float n = fbm(q * 3.2 + u_time * 0.18);
    float swirl = smoothstep(0.45, 0.95, n);
    vec3 warm = vec3(1.05, 0.62, 0.22) * swirl * 0.55;

    // Light history feedback so flow lines persist a few frames — fades fast
    // so the piece doesn't smear.
    vec3 hist = texture(u_history, uv - force * (strength * 0.5)).rgb * 0.55;

    vec3 col = max(below + warm, hist);
    fragColor = vec4(col, 1.0);
}
