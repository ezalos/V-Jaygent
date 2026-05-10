// ABOUTME: 2D magnetic dipole field math for V-Jaygent. Used by ferrofluid
// ABOUTME: and any piece where the cursor or audio acts as a magnetic source.
#ifndef VJ_DIPOLE_GLSL
#define VJ_DIPOLE_GLSL

// 2D magnetic dipole field at point p, from a dipole at center m with unit
// moment vector n and strength q. Returns the field B as a vec2.
//
// Formula:  B(p) = q * (2*(n·r̂)*r̂ - n) / |r|²,    r = p - m
//
// The 2D analogue of the 3D dipole — net divergence zero (closed loops
// integrate to zero net flux), 1/r² fall-off in magnitude, anisotropic
// in direction so rotating the moment vector n sweeps the field's
// anisotropy across the field. Rotating n is what gives ferrofluid
// pieces their non-radial spike pattern.
vec2 dipoleField(vec2 p, vec2 m, vec2 n, float q) {
    vec2  d    = p - m;
    // 0.006 softening keeps the field bounded near the dipole core (1/r²
    // peaks at ~167 with this floor); pieces that integrate the field
    // into a height simulation rely on this to avoid blowing up at the
    // singular point. Smaller values give sharper but less stable cores.
    float r2   = dot(d, d) + 0.006;
    vec2  rhat = d * inversesqrt(r2);
    float ndotr = dot(n, rhat);
    return q * (2.0 * ndotr * rhat - n) / r2;
}

// Field-energy density |B|² for a single dipole. The driver of ferrofluid
// surface forcing — fluid rises where energy is high. Strictly cheaper
// than computing the field vector then squaring, by one inverse-sqrt.
// Inline-expanded so the optimiser can fold the constant 2.0 / r² factor.
float dipoleEnergy(vec2 p, vec2 m, vec2 n, float q) {
    vec2 B = dipoleField(p, m, n, q);
    return dot(B, B);
}

#endif
