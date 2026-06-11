// ABOUTME: Default warm cyclic palette — 5 keyframes, wraps at t=1.
// ABOUTME: Copy into shader.frag; do not #include. See warmCycle.md for lineage.
vec3 warmCycle(float t) {
    t = fract(t);
    vec3 c0 = vec3(1.00, 0.80, 0.50);   // cream / gold
    vec3 c1 = vec3(1.00, 0.55, 0.30);   // amber
    vec3 c2 = vec3(0.85, 0.25, 0.25);   // rust / red
    vec3 c3 = vec3(0.55, 0.18, 0.40);   // wine
    vec3 c4 = vec3(0.42, 0.22, 0.48);   // mauve / violet
    if (t < 0.20) return mix(c0, c1,  t          * 5.0);
    if (t < 0.40) return mix(c1, c2, (t - 0.20)  * 5.0);
    if (t < 0.60) return mix(c2, c3, (t - 0.40)  * 5.0);
    if (t < 0.80) return mix(c3, c4, (t - 0.60)  * 5.0);
    return                mix(c4, c0, (t - 0.80) * 5.0);
}
