// ABOUTME: Fallback for cirrus — solid red broken-tell. Real visuals
// ABOUTME: live in pieces/cirrus/layers/* + reused global layers.
#version 300 es
precision highp float;
uniform vec2 u_resolution;
out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    fragColor = vec4(0.85, 0.05, 0.05, 1.0);
    if (uv.y > 0.97 || uv.y < 0.03) fragColor.rgb = vec3(0.0);
}
