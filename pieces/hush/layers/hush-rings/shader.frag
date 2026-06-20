#version 300 es
// ABOUTME: hush-rings — concentric warm rings fired from the eye on each
// ABOUTME: downbeat (u_bar_phase expands them, u_downbeat brightens). Crisp
// ABOUTME: every bar in the grooves; quiet to one slow ring during the hush.
// ABOUTME: Visible phase-lock. Max-blend so ring fronts stay sharp.
precision highp float;

#include "math.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_playing;
uniform float u_energy_smooth;
uniform float u_bar_phase;
uniform float u_downbeat;
uniform int   u_section_id;
uniform float u_song_progress;
out vec4 fragColor;

void main() {
    vec2  uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2  p = (uv - 0.5) * vec2(aspect, 1.0);

    float playing  = u_audio_playing;
    float E        = mix(0.36 + 0.20 * sin(u_time * 0.17), u_energy_smooth, playing);
    float openE    = smoothstep(0.12, 0.50, E);

    // Eye centre (matches the other layers; gently looks toward the viewer).
    vec2 eye = 0.06 * vec2(sin(u_time * 0.07), cos(u_time * 0.053));
    if (!vjMouseIdle(u_mouse)) {
        vec2 mp = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);
        eye += (mp - eye) * 0.08;
    }
    float r = length(p - eye);

    // Bar phase drives the expanding ring; idle self-plays at ~0.4 Hz.
    float bp = mix(fract(u_time * 0.40), u_bar_phase, playing);

    // Two rings half a bar apart so the cadence reads as a pulse train.
    float outerR = mix(0.32, 0.66, openE);
    float ring = 0.0;
    for (int k = 0; k < 2; k++) {
        float ph = fract(bp + float(k) * 0.5);
        float ringR = ph * outerR;
        float d = abs(r - ringR) - 0.004;
        ring = max(ring, smoothstep(0.016, 0.0, d) * (1.0 - ph));
    }
    // Brighten right at the downbeat; quiet down through the hush.
    ring *= (0.35 + 0.65 * u_downbeat);
    ring *= mix(0.08, 1.0, openE);

    vec3 col = mix(vec3(0.85, 0.38, 0.13), vec3(1.25, 0.98, 0.66), u_song_progress)
             * ring * 1.25;

    fragColor = vec4(col, 1.0);
}
