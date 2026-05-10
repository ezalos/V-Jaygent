#version 300 es
// ABOUTME: Fallback shader — runs only if the layer engine fails to load.
// ABOUTME: The real piece is the layer stack declared in meta.yaml.
precision highp float;
uniform vec2  u_resolution;
uniform float u_time;
out vec4 fragColor;
void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec3 col = vec3(0.20, 0.10, 0.30) + 0.05 * sin(u_time + uv.x * 8.0);
    fragColor = vec4(col, 1.0);
}
