#version 300 es
// ABOUTME: heat-field — invisible (alpha:0) data layer; computes the wandering
// ABOUTME: fever hot-zone and publishes it as `heat` (r) for the visible layers.
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_playing;
uniform float u_audio_bass;
uniform float u_audio_bass_stem;
uniform int   u_section_id;
uniform float u_energy_smooth;

out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    float playing = step(0.5, u_audio_playing);
    float bass = mix(0.30 + 0.22 * sin(u_time * 0.7), u_audio_bass_stem + 0.4 * u_audio_bass, playing);
    bass = clamp(bass, 0.0, 1.2);

    // hot-zone wanders on a slow Lissajous, migrates per section, drags toward
    // the cursor. Breath = SCALE of the pool radius (geometry, not brightness).
    float secf = float(u_section_id);
    vec2 secOff = 0.30 * vec2(sin(secf * 1.7 + 0.5), cos(secf * 2.3 + 1.1));
    vec2 hot = vec2(0.34 * sin(u_time * 0.061), 0.26 * sin(u_time * 0.043 + 1.3)) + secOff;

    vec2 m = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);
    float hasMouse = step(0.5, length(u_mouse));
    hot = mix(hot, m, 0.33 * hasMouse);

    float r0 = 0.20 * (1.0 + 0.35 * bass);
    float d = length(p - hot);
    float core = exp(-(d * d) / (r0 * r0));

    vec2 hotB = vec2(0.30 * sin(u_time * 0.037 + 2.1), 0.34 * sin(u_time * 0.029 + 0.4)) - 0.7 * secOff;
    float r1 = 0.16 * (1.0 + 0.3 * bass);
    float core2 = 0.55 * exp(-pow(length(p - hotB) / r1, 2.0));

    float energy = mix(0.30 + 0.15 * sin(u_time * 0.2), u_energy_smooth, playing);
    float heat = (core + core2) * (0.8 + 0.5 * energy);
    heat = clamp(heat, 0.0, 1.3);

    // alpha:0 in the piece declaration keeps this invisible; consumers read .r.
    fragColor = vec4(heat, heat, heat, 1.0);
}
