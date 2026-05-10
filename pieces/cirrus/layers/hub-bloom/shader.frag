#version 300 es
// ABOUTME: Central hub bloom — pulses on downbeat, withholds before section
// ABOUTME: changes (pre-tension), flashes on the section flip; any held key
// ABOUTME: inflates it. The praxinoscope's still centre.
precision highp float;

#include "math.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_downbeat;
uniform float u_to_section_change;
uniform float u_section_progress;
uniform float u_audio_kick;
uniform float u_audio_bass;
uniform float u_audio_playing;
uniform float u_keys[15];

out vec4 fragColor;

void main() {
    vec2 c = (gl_FragCoord.xy - 0.5 * u_resolution)
           / min(u_resolution.x, u_resolution.y);
    float r = length(c);

    float playing = u_audio_playing;
    float kick = mix(0.0, u_audio_kick, playing);
    float bass = mix(0.4 + 0.3 * sin(u_time * 0.8), u_audio_bass, playing);
    float dbeat= mix(0.0, u_downbeat, playing);

    // any-key inflation
    float anyKey = 0.0;
    for (int i = 0; i < 15; i++) anyKey = max(anyKey, u_keys[i]);

    // Pre-tension: u_to_section_change is seconds until next change. As it
    // approaches 0 within the last ~12s of a section, the bloom *withholds*
    // (smaller, dimmer) — Kaplan-style information-gating. Then flashes
    // when u_section_progress is near zero (just after the flip).
    float tsec = (playing > 0.0) ? u_to_section_change : 1e3;
    float preTension = 1.0 - smoothstep(0.0, 12.0, tsec);
    float postFlash  = (playing > 0.0)
        ? (1.0 - smoothstep(0.0, 0.05, u_section_progress))
        : 0.0;

    // Bloom radius — kept small so it reads as the praxinoscope's still
    // centre, not the headlight of the piece.
    float baseR = 0.035 + 0.015 * bass;
    float kickR = 0.030 * kick + 0.040 * dbeat;
    float keyR  = 0.040 * anyKey;
    float R = baseR + kickR + keyR;

    // Pre-tension squeezes the radius; post-flash blooms it
    R *= mix(1.0, 0.55, preTension);
    R *= mix(1.0, 1.7, postFlash);

    float bloom = exp(-pow(r / max(R, 0.01), 2.0));

    // Tonal: warm amber core blossoms toward cream
    vec3 amber = vec3(1.00, 0.50, 0.18);
    vec3 cream = vec3(1.00, 0.92, 0.65);
    vec3 col = mix(amber, cream, smoothstep(0.0, 1.0, bloom));

    // Pre-tension dims the body (withholding); post-flash brightens
    float bodyGain = mix(1.0, 0.6, preTension);
    bodyGain *= mix(1.0, 1.6, postFlash);

    fragColor = vec4(col, bloom * 0.45 * bodyGain);
}
