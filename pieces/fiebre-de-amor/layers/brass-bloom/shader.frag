#version 300 es
// ABOUTME: brass-bloom — HDR bloom of the pen-heads gated to the brass stem
// ABOUTME: (gold, wide) and vocals (hot-pink, tight focal halo); bloque slam.
precision highp float;

#include "math.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_playing;
uniform float u_audio_high;
uniform float u_audio_other_stem;
uniform float u_audio_vocals_stem;
uniform float u_downbeat;
uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_song_progress;
uniform float u_keys[15];
uniform sampler2D u_below;
uniform sampler2D u_heat;

out vec4 fragColor;

vec3 screenBlend(vec3 a, vec3 b) { return 1.0 - (1.0 - a) * (1.0 - b); }

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec3 below = texture(u_below, uv).rgb;

    float playing = step(0.5, u_audio_playing);
    float brass  = mix(0.25 + 0.25 * abs(sin(u_time * 1.1)), u_audio_other_stem,  playing);
    float voc    = mix(0.10 + 0.15 * max(0.0, sin(u_time * 0.6)), u_audio_vocals_stem, playing);
    // high keys play along with the brass mambo: fire the gold bloom (matches
    // the pens' high-zone -> brass mapping); mid/high vocals lane on key 12-14.
    float kHigh = 0.0, kTop = 0.0;
    for (int i = 10; i < 15; i++) kHigh = max(kHigh, u_keys[i]);
    for (int i = 12; i < 15; i++) kTop  = max(kTop,  u_keys[i]);
    brass = clamp(brass + 0.9 * kHigh, 0.0, 1.3);
    voc   = clamp(voc + 0.7 * kTop, 0.0, 1.3);

    float heat = clamp(texture(u_heat, uv).r * 2.6, 0.0, 1.0);

    // --- wide gold bloom: gather bright excess from u_below over two rings,
    // screen it back. Reads the figure beneath → blooms where the pens burn.
    vec3 wide = vec3(0.0);
    float wsum = 0.0;
    for (int i = 0; i < 12; i++) {
        float a = float(i) / 12.0 * TAU;
        vec2 dir = vec2(cos(a), sin(a));
        // two radii for a soft falloff
        vec3 s1 = texture(u_below, uv + dir * 0.016).rgb;
        vec3 s2 = texture(u_below, uv + dir * 0.034).rgb;
        wide += max(s1 - 0.62, 0.0) * 0.7 + max(s2 - 0.62, 0.0) * 0.3;
        wsum += 1.0;
    }
    wide /= wsum;
    vec3 brassGlow = wide * vec3(1.0, 0.74, 0.34) * (0.3 + 1.3 * brass) * (0.7 + 0.5 * heat);

    // --- tight hot-pink focal halo: vocals get their OWN lane — a small,
    // sharp bloom (different radius, different hue) so the two stems read
    // visibly differently. ---------------------------------------------
    vec3 tight = vec3(0.0);
    for (int i = 0; i < 8; i++) {
        float a = float(i) / 8.0 * TAU + 0.4;
        vec2 dir = vec2(cos(a), sin(a));
        tight += max(texture(u_below, uv + dir * 0.009).rgb - 0.68, 0.0);
    }
    tight /= 8.0;
    vec3 vocGlow = tight * vec3(1.0, 0.40, 0.55) * (1.6 * voc) * (0.6 + 0.6 * heat);

    // --- bloque slam: a single near-full-frame gold flash on the coro-final
    // entry (THE payoff event), keyed to the section + downbeat, decaying fast.
    float slam = (u_section_id == 7) ? exp(-u_section_progress * 4.0) : 0.0;
    slam = max(slam, (u_section_id == 7) ? u_downbeat * exp(-u_section_progress * 2.0) : 0.0);
    vec3 slamFlash = vec3(1.0, 0.72, 0.40) * slam * (0.5 + 0.5 * heat);

    // cymbal sparkle (sub-beat) rides the brass bloom faintly.
    brassGlow *= 1.0 + 0.4 * u_audio_high;

    vec3 add = brassGlow + vocGlow + slamFlash;
    vec3 col = screenBlend(below, clamp(add, 0.0, 0.9));

    fragColor = vec4(col, 1.0);
}
