#version 300 es
// ABOUTME: Fallback shader for keyboard — engine-load failure tell only. The
// ABOUTME: real piece lives in meta.yaml's `layers:` array.
precision highp float;
uniform vec2 u_resolution;
out vec4 fragColor;
void main() { fragColor = vec4(0.5, 0.0, 0.0, 1.0); }
