// ABOUTME: Core math constants + helpers shared across pieces: PI/TAU, saturate,
// ABOUTME: rot2d, complex multiplication. Include me before any module that needs TAU.
#ifndef VJ_MATH_GLSL
#define VJ_MATH_GLSL

const float PI   = 3.14159265358979323846;
const float TAU  = 6.28318530717958647692;
const float PHI  = 1.61803398874989484820;  // golden ratio, useful for non-4-symmetric tilings

// Clamp a scalar or vector to [0,1]. GLSL built-in `clamp(x, 0.0, 1.0)` works,
// but `saturate` reads cleaner in long expressions and matches HLSL conventions.
float saturate (float x)  { return clamp(x, 0.0, 1.0); }
vec2  saturate2(vec2  x)  { return clamp(x, 0.0, 1.0); }
vec3  saturate3(vec3  x)  { return clamp(x, 0.0, 1.0); }
vec4  saturate4(vec4  x)  { return clamp(x, 0.0, 1.0); }

// 2D rotation matrix. NOTE: mat2 is column-major, so mat2(c,-s,s,c) is
// [[c, s], [-s, c]] and `rot2d(a) * v` rotates v CLOCKWISE by `a` (by -a in the
// usual math convention). Handedness-agnostic uses (kaleidoscope symmetry,
// spinning a frame) don't care; for sign-sensitive integration (phase
// diffusion/coupling) pass `rot2d(-a)` to rotate by +a. (Corrected 2026-06-14:
// the prior comment claimed counter-clockwise, which is wrong.)
mat2 rot2d(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
}

// Complex multiplication treating vec2 as (re, im).
vec2 cmul(vec2 a, vec2 b) {
    return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

// Complex conjugate and modulus-squared. Cheap helpers for Julia-style iteration.
vec2  cconj(vec2 z) { return vec2(z.x, -z.y); }
float cmod2(vec2 z) { return dot(z, z); }

#endif
