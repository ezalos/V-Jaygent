#version 300 es
// ABOUTME: Mirror-bloom — segmented rotating gear + concentric pulse rings.
// ABOUTME: SDF-clean edges, no fbm haze. Bar-phase rotates the gear; each
// ABOUTME: downbeat fires a concentric ring that expands outward; bass
// ABOUTME: drives radial breath; cursor offsets the centre.
precision highp float;

#include "math.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;
uniform float u_audio_kick;
uniform float u_beat_phase;
uniform float u_bar_phase;
uniform float u_downbeat;
uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_song_progress;
uniform float u_bpm;
uniform float u_keys[9];
uniform float u_key_event[9];
uniform sampler2D u_below;
uniform sampler2D u_history;
out vec4 fragColor;

// Polar SDF for a segmented disc: N teeth, each spans angle (TAU/N)/2
// of the wheel. Inside-positive convention.
float gearSDF(vec2 p, float r, float teethR, float toothSpan, int teeth, float rot) {
    float ang = atan(p.y, p.x) + rot;
    float wedge = TAU / float(teeth);
    float a = mod(ang, wedge) - wedge * 0.5;
    float dRadial = length(p) - r;
    float teethBand = abs(dRadial) - teethR;
    // Tooth gate: 1 inside the spike, 0 in the gap
    float tooth = step(abs(a), wedge * toothSpan * 0.5);
    return mix(abs(dRadial) - 0.005,            // baseline ring stroke
               teethBand,                          // teeth band
               tooth);
}

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p  = (uv - 0.5) * vec2(aspect, 1.0);

    // Cursor as gear centre.
    vec2 mouseW = vjMouseWorldOrZero(u_mouse, u_resolution);
    p -= mouseW * 0.55;

    // Bass + idle-breath radial scale. Bass pulls in (gear grows); idle
    // breath gives slow continuous motion when audio isn't playing.
    float scale = 1.0 + 0.05 * sin(u_time * 0.41)
                      - 0.20 * u_audio_bass
                      - 0.10 * u_audio_kick;
    p /= scale;

    float r = length(p);
    vec3 col = vec3(0.0);

    // Section-based gear teeth count: 8 / 12 / 16 cycling.
    int teethCount = 8 + 4 * (u_section_id % 3);
    float gearRot = u_time * 0.07 + u_bar_phase * TAU * 0.25;
    // Beat-snap: jump an extra tooth-fraction on every beat.
    gearRot += smoothstep(0.08, 0.0, u_beat_phase) * (TAU / float(teethCount) * 0.5);

    // Inner gear (mid radius, fine teeth).
    {
        float sdf = gearSDF(p, 0.18, 0.012, 0.55, teethCount, gearRot);
        float edge = smoothstep(0.006, 0.0, abs(sdf));
        col += vec3(1.20, 0.65, 0.20) * edge * (0.9 + 0.5 * u_audio_bass);
    }
    // Outer gear (counter-rotating, larger teeth).
    {
        float sdf = gearSDF(p, 0.36, 0.024, 0.45, teethCount * 2, -gearRot * 0.6);
        float edge = smoothstep(0.008, 0.0, abs(sdf));
        col += vec3(1.10, 0.45, 0.10) * edge * 0.85;
    }
    // Outermost ring (slow, thin).
    {
        float sdf = abs(r - 0.55) - 0.004;
        float edge = smoothstep(0.005, 0.0, sdf);
        col += vec3(1.00, 0.35, 0.08) * edge * 0.7;
    }

    // Concentric pulse rings — fired on every downbeat, expanding outward.
    // u_downbeat decays from 1.0 to 0; ring radius grows as it fades.
    {
        float pulse = u_downbeat;
        float ringR = 0.10 + (1.0 - pulse) * 0.95;
        float ringSdf = abs(r - ringR) - 0.014 * pulse;
        float edge = smoothstep(0.012, 0.0, ringSdf) * pulse;
        col += vec3(1.30, 0.80, 0.40) * edge * 1.2;
    }

    // Central core — bright disc that pulses on bass AND on keyboard input
    // so a held chord visibly inflates the centre.
    {
        float anyKey = 0.0;
        for (int i = 0; i < 9; i++) anyKey = max(anyKey, u_keys[i]);
        float core = smoothstep(0.06 + 0.04 * u_audio_bass + 0.05 * anyKey, 0.0, r);
        col += vec3(1.30, 0.85, 0.50) * core
               * (0.45 + 0.55 * u_audio_bass + 0.6 * anyKey);
    }

    // Per-key spikes on the gear's outer edge — every held key adds a small
    // bright tooth at its angular position, making the gear visibly grow
    // teeth when chords play.
    {
        for (int i = 0; i < 9; i++) {
            float fi = float(i);
            float keyAng = -PI + 0.35 + (fi / 8.0) * (TAU - 0.7);
            float ang = atan(p.y, p.x);
            float aD = abs(atan(sin(keyAng - ang), cos(keyAng - ang)));
            float spike = smoothstep(0.06, 0.0, aD)
                        * smoothstep(0.018, 0.005, abs(r - 0.36))
                        * u_keys[i] * 1.4;
            col += vec3(1.30, 0.80, 0.40) * spike;
        }
    }

    // Hi-hat sparkle — small dots at 16 fixed angles, gated on high band.
    {
        float ang = atan(p.y, p.x);
        float dotMod = fract(ang * 16.0 / TAU);
        float dotGate = step(0.92, abs(dotMod - 0.5) * 2.0);
        float ringMask = smoothstep(0.014, 0.0, abs(r - 0.46));
        col += vec3(1.30, 0.95, 0.55) * dotGate * ringMask * u_audio_high * 1.6;
    }

    // Section palette tint — multiplies into col so the gear changes hue
    // across the song without leaving the warm family.
    vec3 amber = vec3(1.00, 0.95, 0.85);
    vec3 ember = vec3(1.05, 0.85, 0.65);
    vec3 wine  = vec3(1.00, 0.70, 0.45);
    float sw = u_song_progress;
    vec3 tint = mix(amber, mix(ember, wine, smoothstep(0.5, 1.0, sw)),
                    smoothstep(0.0, 0.5, sw));
    col *= tint;

    // Composite over u_below (warm gradient floor).
    vec3 below = texture(u_below, uv).rgb;
    col = below * 0.6 + col;

    // History feedback — the gear leaves a slight rotational ghost so the
    // motion reads as continuous turn, not flicker.
    vec3 hist = texture(u_history, uv).rgb * 0.82;
    col = max(col, hist);

    fragColor = vec4(col, 1.0);
}
