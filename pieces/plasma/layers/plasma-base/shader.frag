// ABOUTME: Canonical 4-term sin plasma (Yusuke Endoh / 80s demoscene), mapped
// ABOUTME: through an iqCosine palette with slow autonomous hue drift. Self-plays.
#version 300 es
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;

out vec4 fragColor;

// iqCosine — copied from brainstorming/snippets/iqCosine. Phase tweaked to
// 0.00 / 0.20 / 0.55 so the palette runs magenta → amber → cyan instead of
// the canonical 0/120/240 rainbow; reads warmer + less rainbow-cliché.
vec3 iqCosine(float t) {
    vec3 a = vec3(0.52, 0.46, 0.50);
    vec3 b = vec3(0.45, 0.45, 0.45);
    vec3 c = vec3(1.00, 1.00, 1.00);
    vec3 d = vec3(0.00, 0.20, 0.55);
    return a + b * cos(6.28318 * (c * t + d));
}

void main() {
    // Centred coords, normalised on the short axis. Scale ×2 so the
    // plasma sin frequencies (×8) match a few full cycles across the
    // shorter dimension — readable on a phone, not a sea of microstripes.
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
           / min(u_resolution.x, u_resolution.y);
    p *= 2.0;

    float t = u_time;

    // Four canonical plasma terms.
    // 1) cartesian X  2) cartesian Y at slightly different rate
    // 3) diagonal     4) radial-from-orbiting-source
    vec2  cen = vec2(0.55 * sin(t * 0.31), 0.45 * cos(t * 0.27));
    float v   = sin(p.x * 8.0 + t);
    v        += sin(p.y * 8.0 + t * 1.13);
    v        += sin((p.x + p.y) * 6.0 + t * 0.71);
    v        += sin(length(p - cen) * 12.0 + t * 1.4);
    v        *= 0.25;             // normalise to ~[-1, 1]

    // Map to palette parameter in [0, 1] with slow autonomous hue drift
    // so the field is alive even with a frozen plasma value.
    float pal = 0.5 + 0.5 * v + 0.05 * t;

    vec3 col = iqCosine(pal);

    // Vignette + house gamma (VISION.md: pow 0.85..0.92).
    vec2 pv = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
            / min(u_resolution.x, u_resolution.y);
    col *= 1.0 - 0.25 * dot(pv, pv);

    fragColor = vec4(pow(max(col, 0.0), vec3(0.90)), 1.0);
}
