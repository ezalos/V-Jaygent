#version 300 es
// ABOUTME: Solid-warm layer — vertical warm gradient (deep wine bottom →
// ABOUTME: cream top). Engine-test base layer; a piece's ground floor.
precision highp float;
uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_bass;
out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    // Slow vertical drift on the gradient stop, modulated by bass for
    // engine-level reactivity verification.
    float t = uv.y + 0.05 * sin(u_time * 0.3) + 0.10 * u_audio_bass;
    vec3 lo = vec3(0.05, 0.02, 0.00);
    vec3 hi = vec3(1.00, 0.70, 0.35);
    fragColor = vec4(mix(lo, hi, clamp(t, 0.0, 1.0)), 1.0);
}
