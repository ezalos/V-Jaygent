// ABOUTME: Discrete Laplacian kernels for diffusion on a regular grid — the core
// ABOUTME: of reaction-diffusion and the first step of a Poisson solve. Normalized so d²/dx² is unit-step.
#ifndef VJ_DIFFUSION_GLSL
#define VJ_DIFFUSION_GLSL

// 5-point stencil: Δf ≈ (f_N + f_S + f_E + f_W - 4 f_C) / h².
// Input: sampler2D of the scalar field packed in `channel` (0..3 → rgba).
// `uv` is the sample location in [0,1]; `texel` is 1/textureSize.
// Returns the discretely-computed Laplacian times h² (i.e. without the 1/h²
// factor — most RD/Stam pipelines fold grid scale into the timestep constant).
float laplacian(sampler2D field, vec2 uv, vec2 texel, int channel) {
    vec4 c = texture(field, uv);
    vec4 n = texture(field, uv + vec2(0.0,  texel.y));
    vec4 s = texture(field, uv + vec2(0.0, -texel.y));
    vec4 e = texture(field, uv + vec2( texel.x, 0.0));
    vec4 w = texture(field, uv + vec2(-texel.x, 0.0));
    float sum = n[channel] + s[channel] + e[channel] + w[channel] - 4.0 * c[channel];
    return sum;
}

// Vector form — compute Laplacian of all four channels at once. Used when you
// have coupled fields (e.g. Gray-Scott packs u, v in .rg and needs both).
vec4 laplacian4(sampler2D field, vec2 uv, vec2 texel) {
    vec4 c = texture(field, uv);
    vec4 n = texture(field, uv + vec2(0.0,  texel.y));
    vec4 s = texture(field, uv + vec2(0.0, -texel.y));
    vec4 e = texture(field, uv + vec2( texel.x, 0.0));
    vec4 w = texture(field, uv + vec2(-texel.x, 0.0));
    return n + s + e + w - 4.0 * c;
}

// 9-point stencil including diagonals — smoother but more isotropic. The center
// coefficient is -20/6, diagonals weighted 1/6, axials 4/6. Use this when a
// pure 5-point stencil produces visible grid-aligned pattern axes.
float laplacian9(sampler2D field, vec2 uv, vec2 texel, int channel) {
    vec4 c  = texture(field, uv);
    vec4 n  = texture(field, uv + vec2( 0.0,       texel.y));
    vec4 s  = texture(field, uv + vec2( 0.0,      -texel.y));
    vec4 e  = texture(field, uv + vec2( texel.x,   0.0));
    vec4 w  = texture(field, uv + vec2(-texel.x,   0.0));
    vec4 ne = texture(field, uv + vec2( texel.x,   texel.y));
    vec4 nw = texture(field, uv + vec2(-texel.x,   texel.y));
    vec4 se = texture(field, uv + vec2( texel.x,  -texel.y));
    vec4 sw = texture(field, uv + vec2(-texel.x,  -texel.y));
    float axial = n[channel] + s[channel] + e[channel] + w[channel];
    float diag  = ne[channel] + nw[channel] + se[channel] + sw[channel];
    return (4.0 * axial + diag - 20.0 * c[channel]) / 6.0;
}

#endif
