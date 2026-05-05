#version 300 es
// ABOUTME: Force-source layer — publishes a 2D force field (encoded in rg) AND
// ABOUTME: a faint visual glow showing where the force points. Centred field
// ABOUTME: spinning slowly; bass amplifies magnitude.
precision highp float;
uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_bass;
out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 c = uv - 0.5;

    float angle = u_time * 0.4;
    mat2 R = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    vec2 d = R * c;
    float r = length(d) + 0.04;
    vec2 force = -d / r * (0.3 + 0.5 * u_audio_bass);

    // Encode signed force into rg via 0.5 + 0.5*x (consumer reverses).
    // Visual: soft warm bloom at field magnitude — readable evidence the
    // layer is working without being the lead figure.
    float mag = length(force);
    vec3 glow = vec3(0.45, 0.18, 0.04) * smoothstep(0.0, 0.6, mag);

    fragColor = vec4(0.5 + 0.5 * force, glow.r * 0.4, 1.0);
}
