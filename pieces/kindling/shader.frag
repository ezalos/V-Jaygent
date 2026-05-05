#version 300 es
// ABOUTME: Fallback shader for kindling — runs only if the layer engine fails
// ABOUTME: to load. The piece's actual rendering lives in meta.yaml's layers:.
precision highp float;
uniform vec2 u_resolution;
out vec4 fragColor;

void main() {
    fragColor = vec4(0.5, 0.0, 0.0, 1.0);
}
