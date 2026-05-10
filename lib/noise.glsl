// ABOUTME: Canonical hash + value noise + FBM. Extracted from the six pieces that
// ABOUTME: copy-pasted identical implementations (plume, prism, strata, in-seven, chamber, well).
#ifndef VJ_NOISE_GLSL
#define VJ_NOISE_GLSL

// Classic 2D hash. fract(sin(·) * 43758.5453) is the Mermelstein/iq hash — cheap,
// decent distribution, well-behaved on modern GPUs. Identical across all pieces
// that ship today; do not change the magic numbers without a cross-piece sweep.
float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// 2D-to-2D variant. Independent sine constants per output component — good enough
// for uncorrelated noise in two channels (e.g. domain-warp offsets).
vec2 hash22(vec2 p) {
    return fract(sin(vec2(
        dot(p, vec2(127.1, 311.7)),
        dot(p, vec2(269.5,  183.3))
    )) * 43758.5453);
}

// 2D value noise — hashed lattice, smoothstep interpolation (quintic would be
// smoother but the cubic Hermite is the house standard). Range ~[0,1].
float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Fractional Brownian motion — 5 octaves, lacunarity 2, persistence 0.55, no
// axis rotation between octaves. Produces slight grid-aligned artefacts in flat
// regions; prefer `fbmRot` for pieces that hold still. Range ~[0, ~1.2].
float fbm(vec2 p) {
    float v = 0.0, a = 0.55;
    for (int i = 0; i < 5; i++) {
        v += a * vnoise(p);
        p *= 2.0;
        a *= 0.55;
    }
    return v;
}

// FBM with a per-octave rotation — hides the grid by twisting each octave. This
// is the variant from `pieces/well/shader.frag`. Strongly preferred for static
// and slow-moving fields.
float fbmRot(vec2 p) {
    float v = 0.0, a = 0.55;
    mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
    for (int i = 0; i < 5; i++) {
        v += a * vnoise(p);
        p = rot * p * 2.0 + vec2(1.7, 9.2);
        a *= 0.55;
    }
    return v;
}

#endif
