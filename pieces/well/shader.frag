// ABOUTME: Well — your cursor is a mass that warps space. A warm fractal nebula
// ABOUTME: in the background bends around it like light through a gravitational lens.
#version 300 es
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;

out vec4 fragColor;

// ---------- palette ----------

vec3 warmCycle(float t) {
    t = fract(t);
    vec3 c0 = vec3(1.00, 0.80, 0.50);
    vec3 c1 = vec3(1.00, 0.55, 0.30);
    vec3 c2 = vec3(0.85, 0.25, 0.25);
    vec3 c3 = vec3(0.55, 0.18, 0.40);
    vec3 c4 = vec3(0.42, 0.22, 0.48);
    if (t < 0.20) return mix(c0, c1,  t          * 5.0);
    if (t < 0.40) return mix(c1, c2, (t - 0.20)  * 5.0);
    if (t < 0.60) return mix(c2, c3, (t - 0.40)  * 5.0);
    if (t < 0.80) return mix(c3, c4, (t - 0.60)  * 5.0);
    return                mix(c4, c0, (t - 0.80) * 5.0);
}

// ---------- fractal noise (FBM) ----------

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbmGrid(vec2 p) {
    float v = 0.0, a = 0.55;
    mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);  // rotate between octaves
    for (int i = 0; i < 5; i++) {
        v += a * vnoise(p);
        p = rot * p * 2.0 + vec2(1.7, 9.2);
        a *= 0.55;
    }
    return v;
}

// ---------- nebula ----------

// Returns a warm nebula color at world point q.
vec3 nebula(vec2 q) {
    // Domain-warp the lookup so clouds fold on themselves.
    vec2 w1 = vec2(fbmGrid(q + vec2(0.00, u_time * 0.05)),
                   fbmGrid(q + vec2(5.20, 1.30)));
    vec2 w2 = vec2(fbmGrid(q + 4.0 * w1 + vec2(1.70, 9.20)),
                   fbmGrid(q + 4.0 * w1 + vec2(8.30, 2.80) - u_time * 0.03));

    float density = fbmGrid(q + 3.2 * w2);
    float hue     = density * 0.70 + 0.08 * u_time * 0.1 + 0.05 * w2.x;
    vec3  col     = warmCycle(hue);

    // Darken low-density regions — gives the nebula depth.
    col *= smoothstep(0.25, 0.95, density) * 1.15 + 0.05;

    // Sparse star highlights where density peaks very high.
    float starry  = smoothstep(0.82, 0.96, density);
    col          += warmCycle(hue + 0.12) * starry * 0.55;

    return col;
}

void main() {
    // World space — origin at canvas center, roughly ±1 on the short axis.
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
           / min(u_resolution.x, u_resolution.y) * 2.0;

    // Mass position — mouse in world space, or a slow orbit if idle.
    bool mouseIdle = (u_mouse.x == 0.0 && u_mouse.y == 0.0);
    vec2 mWorld = (u_mouse - 0.5 * u_resolution.xy)
                / min(u_resolution.x, u_resolution.y) * 2.0;
    vec2 mass = mouseIdle
              ? vec2(0.45 * cos(u_time * 0.12), 0.35 * sin(u_time * 0.09))
              : mWorld;

    // Vector from mass to pixel.
    vec2  r  = p - mass;
    float d  = length(r) + 1e-4;
    float d2 = d * d;

    // Gravitational-lens deflection: θ ∝ 1/b. The "source" the ray came from
    // is offset inward along r — so we look up the nebula at p shifted toward
    // the mass. Strength G tuned for a visible but not overwhelming bend.
    float G = 0.28;
    vec2  deflection = G * r / d2;
    vec2  look       = p - deflection;

    vec3 col = nebula(look * 1.8);

    // Accretion-ring glow at the Einstein radius (where the bend is steepest
    // but the source still visible). Two thin rings stacked for richness.
    float ringA = exp(-180.0 * pow(d - sqrt(G) * 0.78, 2.0));
    float ringB = exp(-550.0 * pow(d - sqrt(G) * 0.55, 2.0));
    col        += warmCycle(0.08 + u_time * 0.02) * ringA * 0.75;
    col        += warmCycle(0.18)                 * ringB * 1.10;

    // Event horizon — darken sharply as we approach the mass.
    float horizon = smoothstep(0.18, 0.07, d);
    col *= 1.0 - horizon;

    // Deep far-field tint so undeflected regions stay composed.
    col = mix(col, vec3(0.015, 0.010, 0.025), smoothstep(1.3, 2.4, length(p)) * 0.55);

    // Gentle vignette + gamma.
    col *= 1.0 - 0.20 * dot(p, p) * 0.25;
    fragColor = vec4(pow(max(col, 0.0), vec3(0.90)), 1.0);
}
