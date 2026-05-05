#version 300 es
// ABOUTME: Follow-force layer — consumes a published `force` vec2 (rg-encoded)
// ABOUTME: and uses it to displace a high-frequency warm grid. Verifies that
// ABOUTME: shared-state publish/consume actually delivers fresh upstream data
// ABOUTME: per frame.
precision highp float;
uniform vec2  u_resolution;
uniform float u_time;
uniform sampler2D u_force;     // bound by piece's `consumes: { u_force: <published-name> }`
out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 force = texture(u_force, uv).rg * 2.0 - 1.0;  // decode signed
    vec2 disp = force * 0.08;

    vec2 q = uv + disp;
    float grid = step(0.85, sin(q.x * 60.0) * sin(q.y * 60.0) + 0.4);
    vec3 col = vec3(1.0, 0.55, 0.18) * grid;

    fragColor = vec4(col, grid);
}
