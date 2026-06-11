// ABOUTME: Dark-warm palette — near-black → burgundy → rust → ember → amber.
// ABOUTME: Copy into shader.frag; do not #include. See ember.md for lineage.
vec3 ember(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.012, 0.005, 0.010);    // near-black warm
    vec3 c1 = vec3(0.120, 0.030, 0.030);    // deep burgundy
    vec3 c2 = vec3(0.420, 0.110, 0.045);    // rust
    vec3 c3 = vec3(0.880, 0.330, 0.110);    // ember orange
    vec3 c4 = vec3(1.000, 0.720, 0.320);    // warm amber, peaks only
    if (t < 0.25) return mix(c0, c1,  t          * 4.0);
    if (t < 0.55) return mix(c1, c2, (t - 0.25)  * 3.3333);
    if (t < 0.85) return mix(c2, c3, (t - 0.55)  * 3.3333);
    return                mix(c3, c4, (t - 0.85) * 6.6666);
}
