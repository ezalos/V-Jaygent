#version 300 es
// ABOUTME: Fallback shader — runs ONLY if the layer engine fails to load.
// ABOUTME: Solid red broken-tell so the failure is unmissable on screen.
precision highp float;
uniform vec2  u_resolution;
uniform float u_time;
out vec4 fragColor;
void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float pulse = 0.5 + 0.5 * sin(u_time * 4.0);
    fragColor = vec4(0.85 + 0.15 * pulse, 0.05, 0.05, 1.0);
}
