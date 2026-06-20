#version 300 es
// ABOUTME: iris-core — the focal eye. SDF-clean dark pupil + bright warm rim
// ABOUTME: at the vortex centre; openness (u_energy_smooth) shrinks+dims it to
// ABOUTME: a near-black point during the hush. Alpha mask occludes the dust to
// ABOUTME: a real pupil hole. Lead-band: rim = max(silhouette*0.30, accent).
precision highp float;

#include "math.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_playing;
uniform float u_audio_high;
uniform float u_audio_mid;
uniform float u_energy_smooth;
uniform float u_beat_phase;
uniform float u_downbeat;
uniform int   u_section_id;
uniform int   u_key_mode;
uniform float u_song_progress;
uniform float u_keys[15];
uniform float u_key_event[15];
out vec4 fragColor;

void main() {
    vec2  uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2  p = (uv - 0.5) * vec2(aspect, 1.0);

    float playing  = u_audio_playing;
    float E        = mix(0.36 + 0.20 * sin(u_time * 0.17), u_energy_smooth, playing);
    float openE    = smoothstep(0.12, 0.50, E);
    float deepHush = (playing > 0.5 && u_section_id == 2) ? 1.0 : 0.0;
    float open     = openE * mix(1.0, 0.35, deepHush);

    // Eye centre matches the other layers; gently looks toward the viewer.
    vec2 eye = 0.06 * vec2(sin(u_time * 0.07), cos(u_time * 0.053));
    if (!vjMouseIdle(u_mouse)) {
        vec2 mp = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);
        eye += (mp - eye) * 0.08;
    }
    float r = length(p - eye);

    // Iris geometry — radius + rim width breathe; shut to a point in the hush.
    float rIris = mix(0.018, 0.165, open);
    float rimW  = mix(0.004, 0.020, open);

    // Rim ring (SDF-clean). Lead-band: always-on 0.30 floor, accents brighten.
    float dRim  = abs(r - rIris) - rimW;
    float rim   = smoothstep(0.013, 0.0, dRim);
    float accent = 0.55 * u_audio_high + 0.7 * u_downbeat
                 + 0.30 * (0.5 + 0.5 * sin(u_beat_phase * TAU));
    float rimE  = max(0.30, accent);

    // Palette: amber in Act I, creamier later / when open (Act II glow).
    float warmT = saturate(0.35 + 0.45 * u_song_progress + 0.30 * open);
    vec3  rimCol = mix(vec3(1.05, 0.46, 0.13), vec3(1.30, 1.02, 0.70), warmT);

    // Keyboard tints the rim: white keys → amber, black keys → wine.
    // Chromatic 15-key layout: blacks at semitones {1,3,6,8,10,13}.
    vec3 keyTint = vec3(0.0);
    float keyAmt = 0.0;
    for (int i = 0; i < 15; i++) {
        float a = max(u_keys[i], u_key_event[i]);
        bool isBlack = (i == 1 || i == 3 || i == 6 || i == 8 || i == 10 || i == 13);
        vec3 t = isBlack ? vec3(0.85, 0.18, 0.10) : vec3(1.25, 0.80, 0.35);
        keyTint += t * a; keyAmt += a;
    }
    if (keyAmt > 0.0) rimCol = mix(rimCol, keyTint / keyAmt, saturate(keyAmt * 0.6));

    vec3 col = rimCol * rim * rimE;

    // Pupil interior: deep warm, near-black centre (the eye of the storm).
    float pupil = smoothstep(rIris, rIris * 0.45, r);  // 1 inside
    col += vec3(0.10, 0.035, 0.02) * pupil * (1.0 - rim) * (0.4 + 0.6 * open);

    // Coverage / alpha — occludes the dust within the iris disc (real hole),
    // transparent outside so the spiral shows right up to the rim.
    float coverage = smoothstep(rIris + rimW + 0.010, rIris + rimW, r);

    fragColor = vec4(col, coverage);
}
