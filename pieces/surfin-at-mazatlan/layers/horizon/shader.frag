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

    // Near-flat warm bed. Interest = local contrast = bed-brightness x
    // trough-depth, so a bright-top/dark-bottom bed would force a Y-split
    // (the trough deltas would be biggest up top). Keep the bed even and
    // let the wave troughs carve the dark uniformly across every quadrant.
    // The sunset reading rides on the warm palette + the drifting sun
    // (which is a smooth glow -> excluded from the composition interest map).
    float y = uv.y;
    vec3 deepGold = vec3(0.40, 0.185, 0.085);                // dark warm "deep gold water"
    vec3 col = mix(deepGold * 0.92, deepGold * 1.12, smoothstep(0.10, 0.95, y));  // near-uniform
    col = mix(col, wine, smoothstep(0.13, 0.0, y) * 0.30);   // faint wine sink at the very bottom edge

    // song warms over time (later sections sit hotter)
    col = mix(col, mix(col, amber, 0.35), clamp(u_song_progress, 0.0, 1.0));

    // drifting sun hot-zone — the wandering macro light the squint follows
    float arc = smoothstep(0.82, 1.0, u_song_progress);   // the song's final settle
    float sx = 0.5 + 0.32 * sin(u_time * 0.045);
    float sy = 0.58 + 0.22 * sin(u_time * 0.031 + 1.3) - 0.30 * arc;  // sun sets at the end
    vec2  d  = (uv - vec2(sx, sy)) * vec2(aspect, 1.0);
    float r  = length(d);
    float halo = exp(-r * r / 0.060);
    float core = exp(-r * r / 0.0045);
    float sunPulse = 0.85 + 0.5 * lvl + 0.6 * u_downbeat;
    col += (amber * halo * 0.45 + cream * core * 0.9) * sunPulse;

    // faint sun-glint column reflected down onto the water (warm, not cool)
    float colMask = exp(-pow((uv.x - sx) * aspect, 2.0) / 0.020);
    col += ember * colMask * smoothstep(0.50, 0.0, y) * 0.12 * (0.7 + 0.3 * u_energy_smooth);

    col *= mix(1.0, 0.78, arc);                  // dusk: dim toward the settle
    fragColor = vec4(col, 1.0);
}
