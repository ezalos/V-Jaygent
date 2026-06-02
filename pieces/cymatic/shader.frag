// ABOUTME: Chladni standing-wave field driven by live audio. Three (m,n)
// ABOUTME: mode pairs weighted by bass/mid/high; cursor pins the antinode.
#version 300 es
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform int   u_frame;

uniform float u_audio_level;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;
uniform float u_audio_kick;
uniform float u_audio_snare;
uniform float u_audio_cymbal;
uniform float u_audio_flash;
uniform float u_audio_playing;

#include "chladni.glsl"
#include "noise.glsl"
#include "tonemap.glsl"

out vec4 fragColor;

void main() {
    vec2 frag   = gl_FragCoord.xy;
    vec2 res    = u_resolution.xy;
    float aspect = res.x / max(res.y, 1.0);

    // Screen-space in [-aspect, aspect] x [-1, 1].
    vec2 uv = (frag - 0.5 * res) / min(res.x, res.y);

    // Mouse → plate antinode. Runtime convention: u_mouse == (0, 0) is idle
    // (cursor off-screen). In that branch, synthesise a slow drifting
    // antinode so the piece self-plays.
    bool mouseActive = (u_mouse.x > 0.5 || u_mouse.y > 0.5);
    vec2 mPx = u_mouse / res;                // [0, 1]
    vec2 mC  = (mPx - 0.5) * 2.0;            // [-1, 1]
    mC.x *= aspect;
    vec2 antinode = mouseActive
        ? mC
        : vec2(sin(u_time * 0.20), cos(u_time * 0.17)) * 0.35;

    vec2 p = (uv - antinode) * 1.6;

    // --- Band weights ---
    float bass  = u_audio_bass;
    float mid   = u_audio_mid;
    float high  = u_audio_high;
    float level = u_audio_level;

    // Idle branch: FBM-driven mode weights. Gives the piece a life when
    // mic is denied / room is silent / before first gesture. Pace is
    // deliberately brisk — 0.25× u_time means the FBM argument moves a
    // full noise unit every 4s, so silence never reads as a frozen frame.
    if (level < 0.02) {
        float t = u_time * 0.25;
        bass  = 0.14 + 0.22 * fbmGrid(vec2(t,        0.0));
        mid   = 0.12 + 0.18 * fbmGrid(vec2(0.0,      t + 2.1));
        high  = 0.08 + 0.14 * fbmGrid(vec2(t + 4.3,  t + 4.3));
        level = 0.22;
    }

    // --- Shockwaves from transient onsets, centred on the antinode ---
    vec2 d = p;
    float r = length(d);
    vec2 dir = (r > 1e-3) ? d / r : vec2(0.0);
    float wave = u_audio_kick   * exp(-r * r * 0.5) * sin(r *  8.0 - u_time *  6.0)
               + u_audio_snare  * exp(-r * r * 1.2) * sin(r * 16.0 - u_time *  9.0) * 0.5
               + u_audio_cymbal * exp(-r * r * 2.0) * sin(r * 32.0 - u_time * 12.0) * 0.25;
    p += dir * wave * 0.15;

    // --- Chladni sum ---
    float f = chladniField(p,
                           vec2(2.0,  3.0),
                           vec2(5.0,  7.0),
                           vec2(11.0, 13.0),
                           bass, mid, high);

    // Sharpness tracks overall level — whisper = blurry rings, shout = razor.
    float sharpness = smoothstep(0.02, 0.5, level);
    float edge      = mix(0.25, 0.015, sharpness);
    float lit       = 1.0 - smoothstep(0.0, edge, abs(f));

    // Warm palette — structure does the visual work, hue stays in the
    // amber/orange band. Flash term is multiplicative to preserve hue.
    vec3 col = mix(vec3(0.04, 0.015, 0.005),
                   vec3(1.00, 0.55,  0.18), lit);
    col *= 1.0 + u_audio_flash * 0.5;

    col = reinhard(col);
    col = pow(max(col, 0.0), vec3(0.9));

    fragColor = vec4(col, 1.0);
}
