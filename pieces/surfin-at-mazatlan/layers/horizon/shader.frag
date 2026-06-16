#version 300 es
// ABOUTME: Sunset bed layer — warm vertical gradient + a slowly drifting
// ABOUTME: sun hot-zone (the macro brightness envelope), audio + section reactive.
precision highp float;

#include "math.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_level;
uniform float u_audio_playing;
uniform float u_downbeat;
uniform float u_song_progress;
uniform float u_energy_smooth;

out vec4 fragColor;

void main() {
    vec2 res = u_resolution;
    vec2 uv  = gl_FragCoord.xy / res;
    float aspect = res.x / res.y;

    float playing = u_audio_playing;
    float lvl = mix(0.30 + 0.16 * sin(u_time * 0.5), u_audio_level, playing);

    // warm stops, near-black -> cream
    vec3 nearBlk = vec3(0.030, 0.015, 0.022);
    vec3 wine    = vec3(0.210, 0.055, 0.075);
    vec3 ember   = vec3(0.560, 0.190, 0.075);
    vec3 amber   = vec3(0.930, 0.560, 0.215);
    vec3 cream   = vec3(1.000, 0.930, 0.780);

    float descent = clamp(u_song_progress, 0.0, 1.0);   // 0 = sunlit surface, 1 = the deep

    // Bed graduates the golden-hour surface -> dusky twilight VIOLET as we sink
    // (warm anchor kept on the crests/glint, carried by the water + glint
    // layers; the bed itself cools). Near-uniform brightness so the wave
    // troughs carry the composition (no Y-split).
    float y = uv.y;
    vec3 surfBed = vec3(0.400, 0.185, 0.085);    // golden surface water
    vec3 deepBed = vec3(0.105, 0.055, 0.165);    // twilight-violet deep (dusky, not blue)
    vec3 bed = mix(surfBed, deepBed, smoothstep(0.05, 0.95, descent));
    vec3 col = mix(bed * 0.90, bed * 1.12, smoothstep(0.10, 0.95, y));
    col = mix(col, bed * 0.55, smoothstep(0.13, 0.0, y) * 0.30);  // faint sink at the very bottom edge

    // The sun is the warm anchor; it reddens and SETS by mid-song (the
    // dramatic pivot — surface-break), then we are under it.
    float sunSet = smoothstep(0.0, 0.60, descent);
    float sx = 0.5 + 0.32 * sin(u_time * 0.045);
    float sy = mix(0.74, -0.18, sunSet) + 0.05 * sin(u_time * 0.031 + 1.3);
    vec2  dS = (uv - vec2(sx, sy)) * vec2(aspect, 1.0);
    float r  = length(dS);
    float halo = exp(-r * r / 0.060);
    float core = exp(-r * r / 0.0045);
    float sunPulse = 0.85 + 0.5 * lvl + 0.6 * u_downbeat;
    vec3  sunCol = mix(cream, vec3(0.96, 0.34, 0.12), smoothstep(0.10, 0.55, descent)); // whitens -> red as it sets
    float sunVis = 1.0 - smoothstep(0.55, 0.74, descent);   // gone once we are under
    col += (amber * halo * 0.45 + sunCol * core * 0.9) * sunPulse * sunVis;

    // sun-glint column on the water (warm anchor), fades as the sun sets
    float colMask = exp(-pow((uv.x - sx) * aspect, 2.0) / 0.020);
    col += ember * colMask * smoothstep(0.50, 0.0, y) * 0.12 * (0.7 + 0.3 * u_energy_smooth) * sunVis;

    // the deep: faint cold light filtering down from the surface far above
    float aboveGlow = smoothstep(0.52, 1.0, descent) * smoothstep(0.45, 1.0, y);
    col += vec3(0.16, 0.14, 0.30) * aboveGlow * 0.30;

    float arc = smoothstep(0.88, 1.0, descent);
    col *= mix(1.0, 0.82, arc);                  // settle: dim a touch at the very deepest
    fragColor = vec4(col, 1.0);
}
