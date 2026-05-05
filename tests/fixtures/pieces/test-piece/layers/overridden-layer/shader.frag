#version 300 es
// overridden-layer PIECE-LOCAL — fixture; should win over global
precision highp float;
out vec4 fragColor;
void main() { fragColor = vec4(0.0, 0.0, 1.0, 1.0); }
