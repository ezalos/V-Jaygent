#version 300 es
// ABOUTME: Fallback shader for layer-publish-test. The runtime uses meta.yaml's
// ABOUTME: `layers:` array; this shader renders only if the layer engine fails
// ABOUTME: to load (red field — clear "something broke" tell).
precision highp float;
uniform vec2 u_resolution;
out vec4 fragColor;

void main() {
    fragColor = vec4(0.5, 0.0, 0.0, 1.0);
}
