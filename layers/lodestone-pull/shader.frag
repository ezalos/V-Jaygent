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

vec2 normalizedField(vec2 uv, vec2 mass, float strength) {
    vec2 d = uv - mass;
    float r = length(d) + 0.06;
    return -d / r * strength * (0.6 + 0.4 * u_audio_bass);
}

void main() {
    // Aspect-corrected UV so the field is circular regardless of canvas
    // ratio.
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p  = (uv - 0.5) * vec2(aspect, 1.0);

    // Two masses on slow lissajous orbits at golden-ratio rates so they
    // never realign.
    float t = u_time;
    vec2 m1 = 0.32 * vec2(cos(t * 0.13), sin(t * 0.21));
    vec2 m2 = 0.28 * vec2(cos(t * 0.21 + 1.7), sin(t * 0.13 + 0.9));

    vec2 force = normalizedField(p, m1, 0.55) + normalizedField(p, m2, 0.45);

    // Visual: dim warm pools at the masses so the eye reads the source.
    float pull = 1.0 / (length(p - m1) + 0.05) + 1.0 / (length(p - m2) + 0.05);
    vec3 pool = vec3(0.45, 0.20, 0.05) * smoothstep(2.0, 6.0, pull) * 0.35;

    // Encode signed force (rg) for downstream consumers; b/a carry the
    // visible pool intensity so blend modes still composite sensibly.
    fragColor = vec4(0.5 + 0.5 * force, pool.r * 0.6, 1.0);
}
