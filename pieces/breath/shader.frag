// ABOUTME: breath — display pass. Ember palette over heat-diffusion state with
// ABOUTME: schlieren-style gradient rim that makes radiation edges legible without clutter.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform sampler2D u_state;

#include "tonemap.glsl"

out vec4 fragColor;

// Ember palette — warm-only per VISION. Near-black → burgundy → rust → ember → cream-amber.
vec3 ember(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.006, 0.003, 0.006);
    vec3 c1 = vec3(0.090, 0.025, 0.028);
    vec3 c2 = vec3(0.380, 0.110, 0.055);
    vec3 c3 = vec3(0.890, 0.360, 0.140);
    vec3 c4 = vec3(1.000, 0.760, 0.380);
    if (t < 0.28) return mix(c0, c1,  t          / 0.28);
    if (t < 0.58) return mix(c1, c2, (t - 0.28)  / 0.30);
    if (t < 0.85) return mix(c2, c3, (t - 0.58)  / 0.27);
    return                mix(c3, c4, (t - 0.85) / 0.15);
}

void main() {
    vec2 uv       = gl_FragCoord.xy / u_resolution.xy;
    // Sample gradient at sim's native texel — display-texel steps smear.
    vec2 simTexel = 1.0 / vec2(textureSize(u_state, 0));

    float v = texture(u_state, uv).r;

    // Toe + shoulder so empty field sits at c0 and peaks land deep in c4.
    float t   = smoothstep(0.01, 0.55, v);
    vec3  col = ember(t);

    // Schlieren rim — gradient magnitude catches an extra palette band, making
    // radiation fronts legible without adding geometric structure.
    float gx = texture(u_state, uv + vec2(simTexel.x, 0.0)).r
             - texture(u_state, uv - vec2(simTexel.x, 0.0)).r;
    float gy = texture(u_state, uv + vec2(0.0, simTexel.y)).r
             - texture(u_state, uv - vec2(0.0, simTexel.y)).r;
    float grad = length(vec2(gx, gy));
    col += ember(t + 0.15) * smoothstep(0.010, 0.060, grad) * 0.35;

    // Reinhard rolls peaks asymptotically toward warm-cream, no clipping.
    col = reinhard(col);

    // Gentle vignette.
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    col *= 1.0 - 0.25 * dot(p, p);

    // House gamma per VISION.
    fragColor = vec4(pow(max(col, 0.0), vec3(0.90)), 1.0);
}
