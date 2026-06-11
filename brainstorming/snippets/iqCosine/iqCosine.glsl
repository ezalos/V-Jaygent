// ABOUTME: Iñigo Quílez cosine palette — tuned for full-spectrum hues with saturation
// ABOUTME: pulled back so peaks don't clip to cyan/lime. Copy into shader.frag; do not #include.
// Reference: https://iquilezles.org/articles/palettes/
vec3 iqCosine(float t) {
    vec3 a = vec3(0.52, 0.46, 0.50);    // DC offset
    vec3 b = vec3(0.45, 0.45, 0.45);    // amplitude
    vec3 c = vec3(1.00, 1.00, 1.00);    // frequency (1 cycle over t ∈ [0,1])
    vec3 d = vec3(0.00, 0.33, 0.67);    // phase — 120° spread, classic rainbow
    return a + b * cos(6.28318 * (c * t + d));
}
