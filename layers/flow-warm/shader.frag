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
    float strength = 0.05 + 0.03 * u_audio_bass;
    vec2 q = uv - force * strength;

    // Advect u_below — pixels of the layer beneath get carried by the field.
    vec3 below = texture(u_below, q).rgb;

    // Two-scale internal noise — fine churn (high octaves) layered on coarse
    // structure. fbmRot rotates per-octave to hide the lattice grid that
    // plain fbm leaks at low scale. The two scales (3.6 and 11.0) drift on
    // independent rates so the texture never repeats.
    float n_coarse = fbmRot(q * 3.6 + vec2(u_time * 0.18, 0.0));
    float n_fine   = fbmRot(q * 11.0 - vec2(0.0, u_time * 0.27));
    float n = mix(n_coarse, n_fine, 0.45);
    // Sharpen the bright bands so flow reads as filaments, not haze
    float swirl = smoothstep(0.42, 0.78, n);
    vec3 warm = vec3(1.05, 0.62, 0.22) * swirl * 0.65;

    // Curl-noise perturbation that shifts the apparent advection direction
    // pixel-by-pixel — breaks the uniform-sliding feel by giving each region
    // its own micro-velocity bias on top of the lodestone field.
    float h_eps = 0.005;
    float dphi_dx = fbmRot(q * 8.0 + vec2(h_eps, 0.0)) - fbmRot(q * 8.0 - vec2(h_eps, 0.0));
    float dphi_dy = fbmRot(q * 8.0 + vec2(0.0, h_eps)) - fbmRot(q * 8.0 - vec2(0.0, h_eps));
    vec2 curl = vec2(-dphi_dy, dphi_dx) / (2.0 * h_eps);
    vec2 q2 = q - curl * 0.012;
    vec3 below2 = texture(u_below, q2).rgb;
    below = mix(below, below2, 0.5);

    // History feedback advected by the same field — flow lines persist a few
    // frames before fading. Sample at slightly different offset so trails
    // bend rather than slide rigidly.
    vec3 hist = texture(u_history, uv - force * (strength * 0.7) - curl * 0.006).rgb * 0.62;

    vec3 col = max(below + warm, hist);
    fragColor = vec4(col, 1.0);
}
