#version 300 es
// ABOUTME: Four coprime tooth-wheels (7/11/13/17) at radii 0.28/0.38/0.48/0.58.
// ABOUTME: Each ring on its own clock; cursor wind bows ring radii in cursor
// ABOUTME: azimuth; section-flip snaps rotations back to 0 (rondo recapitulation).
precision highp float;

#include "math.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;
uniform float u_audio_playing;
uniform float u_beat_phase;
uniform float u_bar_phase;
uniform float u_section_progress;
uniform float u_to_section_change;
uniform int   u_section_id;
uniform float u_song_progress;
uniform sampler2D u_below;

uniform float u_keys[15];
uniform float u_key_event[15];

uniform float inner_radius;
uniform float outer_radius;

out vec4 fragColor;

const float TEETH[4] = float[4](7.0, 11.0, 13.0, 17.0);

vec3 warmRamp(float t) {
    t = fract(t) * 4.0;
    int i = int(floor(t));
    float f = t - float(i);
    vec3 c0 = vec3(1.00, 0.85, 0.55);  // cream
    vec3 c1 = vec3(1.00, 0.55, 0.20);  // amber
    vec3 c2 = vec3(0.85, 0.25, 0.20);  // ember
    vec3 c3 = vec3(0.55, 0.18, 0.30);  // wine
    vec3 a = (i == 0) ? c0 : (i == 1) ? c1 : (i == 2) ? c2 : c3;
    vec3 b = (i == 0) ? c1 : (i == 1) ? c2 : (i == 2) ? c3 : c0;
    return mix(a, b, f);
}

void main() {
    vec2 c = (gl_FragCoord.xy - 0.5 * u_resolution)
           / min(u_resolution.x, u_resolution.y);

    float playing = u_audio_playing;
    float bp   = mix(fract(u_time * 1.0),   u_beat_phase,       playing);
    float ba   = mix(fract(u_time * 0.25),  u_bar_phase,        playing);
    float sp   = mix(fract(u_time * 0.05),  u_section_progress, playing);
    float gprog= mix(fract(u_time * 0.01),  u_song_progress,    playing);
    float mid  = mix(0.40 + 0.25 * sin(u_time * 0.9), u_audio_mid,  playing);
    float hi   = mix(0.30 + 0.20 * sin(u_time * 1.7), u_audio_high, playing);
    float bass = mix(0.30 + 0.20 * sin(u_time * 0.7), u_audio_bass, playing);
    float toSect = (playing > 0.5) ? u_to_section_change : 1e3;

    // Cursor wind — azimuth + magnitude. Idle ⇒ no wind.
    vec2 mw = vjMouseWorldOrZero(u_mouse, u_resolution);
    float windMag = clamp(length(mw), 0.0, 1.5);
    float windAng = (windMag > 0.0) ? atan(mw.y, mw.x) : 0.0;

    // Section-flip snap window (rondo recapitulation).
    float snapWindow = 1.0 - smoothstep(0.0, 0.05, sp);
    // Pre-tension squeeze.
    float preTension = 1.0 - smoothstep(0.0, 10.0, toSect);

    float r = length(c);
    float ang = atan(c.y, c.x);

    float radii[4];
    radii[0] = mix(inner_radius, outer_radius, 0.10);
    radii[1] = mix(inner_radius, outer_radius, 0.40);
    radii[2] = mix(inner_radius, outer_radius, 0.70);
    radii[3] = mix(inner_radius, outer_radius, 1.00);

    float widths[4]   = float[4](0.030, 0.026, 0.022, 0.020);

    // Per-ring rotation rates (geometric: audio drives rotation, not glow).
    float omega[4];
    omega[0] = ba * TAU;                                  // ring 0: bar-phase
    omega[1] = sp * TAU;                                  // ring 1: section-progress
    omega[2] = bp * TAU * 2.0;                            // ring 2: beat-phase
    omega[3] = u_time * (0.35 + 1.6 * mid) + hi * 4.0;   // ring 3: mid + high jitter

    // Rondo snap: the first three rings snap to 0 on every section flip.
    omega[0] = mix(omega[0], 0.0, snapWindow * 0.85);
    omega[1] = mix(omega[1], 0.0, snapWindow * 0.85);
    omega[2] = mix(omega[2], 0.0, snapWindow * 0.85);

    // Always-on per-beat angular jitter — keeps rings shimmering between hits
    // (memory note: stills under-grade high-frequency motion).
    float jitter = sin(bp * TAU * 2.0 + sp * 0.5) * 0.020
                 + cos(bp * TAU * 3.0 + ba * 1.7) * 0.010;

    float ring_presence = 0.0;
    float tooth_peak    = 0.0;
    float align_axis    = 0.0;

    for (int i = 0; i < 4; i++) {
        float P  = TEETH[i];
        float Ri = radii[i];
        float Wi = widths[i];

        // Cursor wind bows the ring in wind direction; faster rings bow more.
        float bow = windMag * 0.030 * (float(i) + 1.0) / 4.0;
        float radialDelta = bow * cos(ang - windAng);
        // Bass adds a small pulse to all ring radii (geometric, not glow).
        float bassPulse = 0.012 * bass * sin(float(i) * 1.7);
        // Pre-tension compresses the rings inward.
        float Ri_eff = (Ri + radialDelta + bassPulse) * mix(1.0, 0.85, preTension);

        // Ring annulus mask.
        float dr = abs(r - Ri_eff);
        float ringMask = smoothstep(Wi * 1.6, 0.0, dr);

        // Tooth phase — power-shaped cosine so each tooth is a defined peak.
        float toothPhase = ang * P + omega[i] + jitter;
        float tc = max(cos(toothPhase), 0.0);
        float toothShape = pow(tc, 2.5);

        // Always-on band (prevents the lead-layer-only-visible-on-accents
        // failure mode flagged in the cirrus 2026-05-10 critique).
        // Bumped 2026-05-11 — was 0.30 * (0.55 + 0.06i), too dim against haze.
        float ringBase = 0.80 + 0.10 * float(i);
        ring_presence = max(ring_presence, ringMask * 0.65 * ringBase);

        // Tooth peak — accumulated by max for hard accents.
        tooth_peak = max(tooth_peak, ringMask * toothShape * (1.10 + 0.06 * float(i)));

        // Radial-axis alignment indicator (when teeth from multiple rings line
        // up at the same angle — the cirrus polyrhythm visual hook).
        align_axis += tc * ringMask;
    }

    // Keyboard: each held / pressed key adds a momentary tooth on ring
    // (k % 4) at a fixed angular slot. Per-key distinctness — different
    // keys produce visibly different teeth.
    for (int k = 0; k < 15; k++) {
        float env = u_keys[k] + u_key_event[k] * 0.6;
        if (env < 0.001) continue;
        int ring = int(mod(float(k), 4.0));
        float Ri = radii[ring];
        float Wi = widths[ring] * 1.8;
        float keyAng = -PI + (float(k) + 0.5) / 15.0 * TAU;
        float dAng = atan(sin(ang - keyAng), cos(ang - keyAng));
        float angMask = smoothstep(0.18, 0.0, abs(dAng));
        float dr = abs(r - Ri);
        float radMask = smoothstep(Wi * 2.4, 0.0, dr);
        tooth_peak = max(tooth_peak, env * angMask * radMask * 1.3);
    }

    // Refract u_below toward radial axis at tooth-bright zones (subtle).
    vec2 radialDir = (r > 1e-3) ? c / r : vec2(0.0);
    float total_lum = max(ring_presence, tooth_peak);
    float refrAmt = 0.018 + 0.008 * windMag;
    vec3 below = texture(u_below, gl_FragCoord.xy / u_resolution
                                   - radialDir * refrAmt * total_lum).rgb;
    if (dot(below, vec3(1.0)) < 0.01) below = vec3(0.04, 0.02, 0.0);

    // Per-frame palette tinting per song progress.
    vec3 wheelCol = warmRamp(gprog + 0.55);

    vec3 wheelContrib = wheelCol * total_lum;
    vec3 col = max(below + wheelContrib * 0.9, wheelContrib * 1.5);

    // Alignment-axis glow — when rings align, brighten the radial axes.
    float ax = pow(align_axis * 0.20, 2.0);
    col += vec3(0.22, 0.13, 0.06) * ax;

    // Soft Reinhard so peaks roll off.
    col = col / (1.0 + col * 0.40);

    fragColor = vec4(col, 1.0);
}
