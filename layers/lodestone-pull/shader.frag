#version 300 es
// ABOUTME: Lodestone-pull layer — publishes a 2D gravitational-style force
// ABOUTME: field (rg-encoded, signed) toward two slow-orbiting mass points.
// ABOUTME: Visual output is faint dark wells where the masses sit, so the
// ABOUTME: field origins are subtly visible without dominating.
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_bass;
out vec4 fragColor;

// 1/r² pull (real gravity falloff) — produces strong gradients near the
// masses and quiet far field, so different screen regions see distinctly
// different forces. Clamped on the inside so we don't blow up at the
// singularity.
vec2 inverseSquare(vec2 uv, vec2 mass, float strength) {
    vec2 d = uv - mass;
    float r2 = dot(d, d) + 0.025;
    return -d * strength / r2 * (0.7 + 0.4 * u_audio_bass);
}

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p  = (uv - 0.5) * vec2(aspect, 1.0);

    // Three masses on independent rates (irrationally related) so the
    // field never repeats and the gradient is non-uniform across the
    // whole screen. Smaller orbital radii so the masses stay on-screen.
    float t = u_time;
    vec2 m1 = 0.30 * vec2(cos(t * 0.13),       sin(t * 0.21));
    vec2 m2 = 0.26 * vec2(cos(t * 0.21 + 1.7), sin(t * 0.13 + 0.9));
    vec2 m3 = 0.18 * vec2(cos(t * 0.31 + 3.1), sin(t * 0.17 + 2.2));

    vec2 force =
          inverseSquare(p, m1, 0.060)
        + inverseSquare(p, m2, 0.052)
        + inverseSquare(p, m3, 0.040);

    // Clamp the magnitude so encoding stays in [-1, 1] for the rg channels.
    force = clamp(force, -0.95, 0.95);

    fragColor = vec4(0.5 + 0.5 * force, 0.0, 1.0);
}
