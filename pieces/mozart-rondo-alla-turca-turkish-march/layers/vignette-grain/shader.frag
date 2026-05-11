#version 300 es
// ABOUTME: Final pass — warm vignette darkens the corners and 1/f grain adds
// ABOUTME: subtle texture (high-band modulated). Reads u_below directly.
precision highp float;

#include "math.glsl"
#include "noise.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform int   u_frame;
uniform float u_audio_high;
uniform float u_audio_playing;
uniform sampler2D u_below;

uniform float vignette_strength;
uniform float grain_strength;

out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 c  = (gl_FragCoord.xy - 0.5 * u_resolution)
            / min(u_resolution.x, u_resolution.y);

    vec3 below = texture(u_below, uv).rgb;
    if (dot(below, vec3(1.0)) < 0.01) below = vec3(0.04, 0.02, 0.0);

    // Warm vignette — corners dim toward near-black.
    float r = length(c);
    float vig = 1.0 - vignette_strength * smoothstep(0.55, 1.10, r);
    below *= vig;

    // 1/f-ish grain via fbm.
    float playing = u_audio_playing;
    float hi = mix(0.2, u_audio_high, playing);
    float g = fbm(uv * 280.0 + vec2(float(u_frame) * 0.13, 0.0));
    g = (g - 0.5) * grain_strength * (0.7 + 0.6 * hi);
    below += vec3(g * 1.0, g * 0.85, g * 0.6);

    // Gentle gamma so the warm cycle reads as lit, not printed.
    below = pow(max(below, 0.0), vec3(0.88));

    fragColor = vec4(below, 1.0);
}
