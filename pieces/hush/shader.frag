#version 300 es
// ABOUTME: hush — FALLBACK shader only. The real piece is the layer stack in
// ABOUTME: meta.yaml (hush-bed / eye-vortex / iris-core / hush-rings / post-haze).
// ABOUTME: This renders only if the layer engine fails to load — a dim warm tell.
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
    float r = length(p);
    // Near-black ground + a dim pulsing ember core: obviously a placeholder,
    // but on-palette so it doesn't strobe if it ever shows.
    vec3 col = vec3(0.02, 0.011, 0.008);
    float core = exp(-r * r / 0.06) * (0.4 + 0.2 * sin(u_time * 1.5));
    col += vec3(0.5, 0.2, 0.06) * core;
    fragColor = vec4(col, 1.0);
}
