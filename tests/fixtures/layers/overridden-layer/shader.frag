#version 300 es
// overridden-layer GLOBAL — fixture; should be hidden by piece-local override
precision highp float;
out vec4 fragColor;
void main() { fragColor = vec4(0.0, 1.0, 0.0, 1.0); }
