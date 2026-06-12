// ABOUTME: Canonical V-Jaygent warm cycle palette. gold → orange → red →
// ABOUTME: wine → mauve → gold (loops). Every new piece should reach for
// ABOUTME: colour through this function rather than ad-hoc vec3 literals.

// warmCycle(t) — t looped via fract(); 5 stops blended via cosine-smooth mix.
// Reference: aperture/shader.frag, eclipse/shader.frag, and the round-2
// catalogue regrade — every chef-d'oeuvre uses a variant of this cycle.
vec3 warmCycle(float t) {
    t = fract(t);
    vec3 c0 = vec3(1.00, 0.80, 0.50);  // gold
    vec3 c1 = vec3(1.00, 0.55, 0.30);  // amber
    vec3 c2 = vec3(0.85, 0.25, 0.25);  // ember
    vec3 c3 = vec3(0.55, 0.15, 0.30);  // wine
    vec3 c4 = vec3(0.40, 0.20, 0.45);  // mauve
    // 5 segments of width 0.2; cosine ease for smooth blend without
    // visible boundary bands.
    float s = t * 5.0;
    int   i = int(floor(s));
    float f = fract(s);
    f = 0.5 - 0.5 * cos(f * 3.14159265);
    if (i == 0) return mix(c0, c1, f);
    if (i == 1) return mix(c1, c2, f);
    if (i == 2) return mix(c2, c3, f);
    if (i == 3) return mix(c3, c4, f);
    return mix(c4, c0, f);  // i == 4: wrap mauve→gold
}

// warmCool darkens toward near-black at low luminance — useful as a
// substrate / vignette colour without going cold.
vec3 warmShadow(float t) {
    return warmCycle(t) * 0.18 + vec3(0.02, 0.012, 0.018);
}
