#version 300 es
// ABOUTME: Diagnostic base — left third is a checkerboard (high-freq), middle
// ABOUTME: third is a fine line grid (single-pixel detail), right third is a
// ABOUTME: smooth rainbow gradient. Stationary in time so any warp/feedback
// ABOUTME: artefact downstream becomes obvious.
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
out vec4 fragColor;

vec3 hsv2rgb(vec3 c) {
    vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec3 col;

    if (uv.x < 0.33) {
        // Black-white checkerboard — 16 cells across, sharp edges.
        vec2 cell = floor(uv * vec2(16.0, 9.0));
        float check = mod(cell.x + cell.y, 2.0);
        col = vec3(check);
    } else if (uv.x < 0.66) {
        // Fine line grid — 1px-wide lines on a black background. Anything
        // that pulls a line off-axis or smears it gives the warp away.
        vec2 px = gl_FragCoord.xy;
        float gx = step(0.92, fract(px.x / 32.0));
        float gy = step(0.92, fract(px.y / 32.0));
        col = vec3(max(gx, gy));
    } else {
        // Smooth rainbow gradient — hue across, value down. Continuous so
        // local sampling jitter shows as colour banding / non-monotone hue.
        float hue = (uv.x - 0.66) / 0.34;
        float val = 0.25 + 0.75 * uv.y;
        col = hsv2rgb(vec3(hue, 0.85, val));
    }
    fragColor = vec4(col, 1.0);
}
