// ABOUTME: Signed-distance functions for 2D primitives + smooth-min operator.
// ABOUTME: Conventions: inside is negative, outside is positive, boundary is zero.
#ifndef VJ_SDF_GLSL
#define VJ_SDF_GLSL

// Circle at origin with radius r. Negative inside.
float sdCircle(vec2 p, float r) {
    return length(p) - r;
}

// Axis-aligned box centered at origin with half-extents b.
float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// Line segment from a to b, with endpoint caps. Returns unsigned distance.
float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

// Equilateral triangle at origin pointing +y, radius r (circumscribed).
float sdTriangle(vec2 p, float r) {
    const float k = 1.7320508;  // sqrt(3)
    p.x = abs(p.x) - r;
    p.y = p.y + r / k;
    if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
    p.x -= clamp(p.x, -2.0 * r, 0.0);
    return -length(p) * sign(p.y);
}

// IQ's polynomial smooth-min — blends two distances over width k. Larger k
// means a softer join. Returns the blended distance.
float opSmin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

// Annular ring — turn any distance field into a thin shell of thickness 2*t.
float opOnion(float d, float t) {
    return abs(d) - t;
}

#endif
