#version 300 es
// ABOUTME: Fallback only — engine uses this if the layer stack fails to load.
// ABOUTME: Solid red so a broken state is obviously broken.
precision highp float;
uniform vec2 u_resolution;
out vec4 fragColor;
void main() {
    fragColor = vec4(0.6, 0.05, 0.05, 1.0);
}
