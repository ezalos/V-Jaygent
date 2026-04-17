// ABOUTME: Chladni nodal-line primitives — standing-wave geometry for
// ABOUTME: sound-driven and autonomously-driven pieces.

#ifndef VJAY_CHLADNI_GLSL
#define VJAY_CHLADNI_GLSL

// Chladni plate nodal function for a unit square with mode (m, n).
// The nodal lines are where |chladni(p, m, n)| ~= 0. `p` is expected in
// roughly the [-1, 1] domain; the function is symmetric about (0, 0).
float chladni(vec2 p, float m, float n) {
    const float PI_ = 3.14159265358979;
    return cos(m * PI_ * p.x) * cos(n * PI_ * p.y)
         - cos(n * PI_ * p.x) * cos(m * PI_ * p.y);
}

// Weighted sum of three Chladni modes. Each `pair_k` is a `(m, n)` tuple
// and `w_k` its weight. Returns a signed field — absolute value near zero
// traces node lines.
float chladniField(vec2 p,
                   vec2 pair0, vec2 pair1, vec2 pair2,
                   float w0,   float w1,   float w2) {
    return w0 * chladni(p, pair0.x, pair0.y)
         + w1 * chladni(p, pair1.x, pair1.y)
         + w2 * chladni(p, pair2.x, pair2.y);
}

#endif
