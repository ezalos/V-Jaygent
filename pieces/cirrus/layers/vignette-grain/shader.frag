#version 300 es
// ABOUTME: Top post — warm vignette + film grain modulated by highs.
// ABOUTME: Runs over the entire composited stack.
precision highp float;

#include "noise.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_high;
uniform sampler2D u_below;

out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 c  = (gl_FragCoord.xy - 0.5 * u_resolution)
            / min(u_resolution.x, u_resolution.y);

    vec3 below = texture(u_below, uv).rgb;
    if (dot(below, vec3(1.0)) < 0.01) below = vec3(0.04, 0.02, 0.0);

    float vignette = smoothstep(0.95, 0.30, length(c));
    vec3  warmTint = mix(vec3(0.85, 0.55, 0.40), vec3(1.0, 1.0, 1.0), vignette);
    vec3 col = below * mix(0.55, 1.0, vignette) * warmTint;

    float g = (hash21(gl_FragCoord.xy + u_time * 60.0) - 0.5);
    float grainAmt = 0.018 + 0.030 * u_audio_high;
    col += vec3(g * grainAmt);

    col = pow(max(col, 0.0), vec3(0.92));
    fragColor = vec4(col, 1.0);
}
