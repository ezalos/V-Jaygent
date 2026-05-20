#version 300 es
// ABOUTME: Fallback shader — runs ONLY if the layer engine fails to load.
// ABOUTME: A flat dark-ember field with no detail: an obvious "broken" tell.
precision highp float;
uniform vec2  u_resolution;
uniform float u_time;
out vec4 fragColor;
void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    // deliberately featureless: if you see this, the layer stack didn't load
    vec3 col = vec3(0.20, 0.06, 0.02) * (0.6 + 0.4 * sin(u_time));
    fragColor = vec4(col, 1.0);
}
