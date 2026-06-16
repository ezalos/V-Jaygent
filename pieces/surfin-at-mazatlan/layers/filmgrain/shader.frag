#version 300 es
// ABOUTME: Film-finish layer — tonemap + fine grain + vignette + a warm
// ABOUTME: bloom on each section transition (the wet-reverb splash nod).
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "tonemap.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform int   u_frame;
uniform sampler2D u_below;
uniform float u_section_progress;
uniform float u_song_progress;
uniform float u_audio_level;
uniform float u_audio_playing;

out vec4 fragColor;

void main() {
    vec2 res = u_resolution;
    vec2 uv  = gl_FragCoord.xy / res;
    float aspect = res.x / res.y;

    vec3 col = texture(u_below, uv).rgb;

    // warm bloom over the first ~8% of each section (the splash on the cut)
    float cut = smoothstep(0.10, 0.0, u_section_progress);
    float lvl = mix(0.3, u_audio_level, u_audio_playing);
    col += vec3(0.55, 0.30, 0.12) * cut * (0.5 + 0.5 * lvl);

    // tame additive glint blowout
    col = reinhard(col * 1.05);

    // fine film grain (temporal)
    float g = hash21(gl_FragCoord.xy + float(u_frame) * 1.7) - 0.5;
    col += g * 0.045;

    // vignette — deepens into an enclosure as we descend
    float descent = clamp(u_song_progress, 0.0, 1.0);
    float v = length((uv - 0.5) * vec2(aspect, 1.0));
    col *= mix(1.0, mix(0.62, 0.40, descent), smoothstep(mix(0.55, 0.40, descent), 1.15, v));

    fragColor = vec4(max(col, 0.0), 1.0);
}
