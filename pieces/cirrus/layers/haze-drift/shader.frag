#version 300 es
// ABOUTME: Slow domain-warped warm haze. Mid-band warps the field, section
// ABOUTME: progress drifts the phase. Mid-frequency strata above solid-warm.
precision highp float;

#include "math.glsl"
#include "noise.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_mid;
uniform float u_audio_playing;
uniform float u_section_progress;
uniform float u_song_progress;

out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 c  = (gl_FragCoord.xy - 0.5 * u_resolution)
            / min(u_resolution.x, u_resolution.y);

    float playing = u_audio_playing;
    float mid     = mix(0.4 + 0.3 * sin(u_time * 0.7), u_audio_mid, playing);
    float sp      = mix(fract(u_time * 0.05), u_section_progress, playing);
    float gprog   = mix(fract(u_time * 0.01), u_song_progress, playing);

    float warpAmt = 0.10 + 0.18 * mid;
    vec2 q = c * 1.7 + vec2(0.05 * u_time, 0.03 * u_time);
    vec2 w = vec2(fbmRot(q + 1.7), fbmRot(q + 5.2)) - 0.5;
    float h = fbmRot(q * 1.4 + w * warpAmt + sp * 2.0);

    // Warm haze ramp shifts deeper into wine across the song
    vec3 hazeLo = mix(vec3(0.10, 0.04, 0.02), vec3(0.18, 0.04, 0.06), gprog);
    vec3 hazeHi = mix(vec3(0.95, 0.55, 0.20), vec3(0.85, 0.30, 0.25), gprog);
    vec3 col = mix(hazeLo, hazeHi, smoothstep(0.30, 0.90, h));

    // Slight vignette so haze is densest at edges, not centre — keeps
    // the centre clean for the wheels to read.
    float radial = smoothstep(0.10, 0.60, length(c));
    float alpha = mix(0.18, 0.32, radial);

    fragColor = vec4(col, alpha);
}
