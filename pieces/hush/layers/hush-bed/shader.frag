#version 300 es
// ABOUTME: hush-bed — near-black warm radial ground for the breathing eye.
// ABOUTME: A faint central ember halo whose radius+brightness breathe with
// ABOUTME: u_energy_smooth; carries the dark negative space (warm-soup guard).
precision highp float;

#include "math.glsl"
#include "noise.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_playing;
uniform float u_energy_smooth;
uniform int   u_section_id;
uniform float u_song_progress;
out vec4 fragColor;

void main() {
    vec2  uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2  p = (uv - 0.5) * vec2(aspect, 1.0);

    // Breath: idle self-plays a slow sine so the bed never freezes.
    float playing  = u_audio_playing;
    float E        = mix(0.36 + 0.20 * sin(u_time * 0.17), u_energy_smooth, playing);
    float openE    = smoothstep(0.12, 0.50, E);
    float deepHush = (playing > 0.5 && u_section_id == 2) ? 1.0 : 0.0;
    float open     = openE * mix(1.0, 0.35, deepHush);

    // Eye centre wanders slowly (so the composition isn't dead-centre static).
    vec2  eye = 0.06 * vec2(sin(u_time * 0.07), cos(u_time * 0.053));
    float r   = length(p - eye);

    // Deep warm ground — near-black, a touch warmer toward the centre.
    vec3 col = vec3(0.018, 0.010, 0.008);

    // Central ember halo — wider + brighter as the eye opens.
    float halo = exp(-r * r / (0.10 + 0.30 * open));
    vec3  emberC = mix(vec3(0.16, 0.05, 0.03), vec3(0.55, 0.22, 0.07),
                       saturate(0.3 + 0.7 * open + 0.3 * u_song_progress));
    col += emberC * halo * (0.22 + 0.55 * open);

    // Faint dusty floor grain so the ground isn't a flat gradient.
    float g = fbmRot(p * 7.0 + 13.0);
    col += vec3(0.03, 0.014, 0.008) * g * halo;

    // Vignette carries the dark edges (negative space).
    float vig = smoothstep(1.15, 0.20, length(p));
    col *= mix(0.45, 1.0, vig);

    fragColor = vec4(col, 1.0);
}
