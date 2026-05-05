#version 300 es
// ABOUTME: Fallback shader for the layer-engine-test piece. The runtime uses
// ABOUTME: meta.yaml's `layers:` array; this shader renders only if the
// ABOUTME: layer engine fails to load (red field — clear "something broke" tell).
precision highp float;
uniform vec2 u_resolution;
out vec4 fragColor;

void main() {
    fragColor = vec4(0.5, 0.0, 0.0, 1.0);
}
