#version 300 es
// ABOUTME: Vocoder-streaks layer — vertical filaments stretched along the bar
// ABOUTME: phase, gated by section state. Reads u_below for the underlying
// ABOUTME: warm field, u_history for streak persistence. Designed for
// ABOUTME: 4-on-the-floor electronic music with clear sections (HBFS-style).
precision highp float;

#include "noise.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;
uniform float u_beat_phase;
uniform float u_bar_phase;
uniform float u_downbeat;
uniform float u_section_progress;
uniform int   u_section_id;
uniform float u_to_section_change;
uniform float u_song_progress;
uniform float u_bpm;
uniform sampler2D u_below;
uniform sampler2D u_history;
out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    // Section-aware density — early sections are sparse; later sections
    // accumulate. u_song_progress is 0..1 across the whole track.
    float density = mix(0.35, 1.10, smoothstep(0.10, 0.85, u_song_progress));

    // Pre-tension: in the last 8 bars before a section boundary, squeeze
    // the streaks vertically (they grow tall and narrow). Released on
    // downbeat into the new section.
    float toBars = u_to_section_change * u_bpm / 60.0;
    float squeeze = 1.0 - smoothstep(0.0, 8.0, toBars);
    float vstretch = 1.0 + 1.4 * squeeze;

    // Vertical streaks — tall narrow filaments at hash-driven x positions,
    // each with its own random brightness and offset. Looks vocoder-like.
    // Two octaves of filaments at different scales.
    float streaks = 0.0;
    {
        // Coarse: ~14 streaks across the screen
        vec2 cell = vec2(floor(p.x * 14.0 + u_time * 0.3), 0.0);
        float h = hash21(cell);
        float xCell = (cell.x + 0.5) / 14.0;
        float dist = abs(p.x - xCell + (h - 0.5) * 0.04);
        float vMod = 0.5 + 0.5 * sin(p.y * (6.0 / vstretch) + h * 6.28 + u_time * 1.2);
        streaks += smoothstep(0.018, 0.0, dist) * vMod * (0.4 + 0.6 * h);
    }
    {
        // Fine: ~36 streaks, faster phase
        vec2 cell = vec2(floor(p.x * 36.0 - u_time * 0.6), 0.0);
        float h = hash21(cell + 13.7);
        float xCell = (cell.x + 0.5) / 36.0;
        float dist = abs(p.x - xCell + (h - 0.5) * 0.025);
        float vMod = 0.5 + 0.5 * sin(p.y * (18.0 / vstretch) + h * 6.28 + u_time * 2.4);
        streaks += smoothstep(0.005, 0.0, dist) * vMod * 0.45;
    }
    streaks *= density;

    // Bar-phase scan — a soft bright sweep that crosses the screen once per
    // bar, anchoring the four-on-the-floor pulse without being a flash.
    float scanX = (u_bar_phase * 2.0 - 1.0) * aspect * 1.1;
    float scan  = smoothstep(0.10, 0.0, abs(p.x - scanX)) * 0.30;

    // Downbeat hit — quick brightness lift on the bar-1 downbeat, decays
    // with u_downbeat. Geometry-shaped (radial pulse) not just brightness:
    // a wide soft ring expanding from centre.
    float dPulse = u_downbeat;
    float ringR  = 0.10 + 0.7 * (1.0 - dPulse);
    float ring   = smoothstep(0.06, 0.0, abs(length(p) - ringR)) * dPulse * 0.7;

    // Per-stem flavour (when stems are loaded). Bass for low-frequency
    // breathing on the streaks; mid/high for accent flickers. Falls back
    // gracefully when no analysis JSON.
    float bassBreath = 1.0 + 0.35 * u_audio_bass;
    float highSpark  = u_audio_high * 0.6 * (0.3 + 0.7 * u_beat_phase);

    // Warm tint — section_id selects within the warm family without leaving it.
    int sid = u_section_id;
    vec3 warmEarly = vec3(1.10, 0.55, 0.20);   // amber
    vec3 warmMid   = vec3(1.20, 0.45, 0.10);   // ember
    vec3 warmLate  = vec3(0.95, 0.30, 0.06);   // wine
    float sw = float(sid) / 6.0;
    vec3 tint = mix(mix(warmEarly, warmMid, smoothstep(0.0, 0.5, sw)),
                     warmLate,                  smoothstep(0.5, 1.0, sw));

    vec3 col = tint * (streaks * bassBreath + scan + ring) + vec3(highSpark) * 0.8;

    // Composite: u_below provides the warm gradient base; we overlay streaks.
    vec3 below = texture(u_below, uv).rgb;
    vec3 mixed = below * (1.0 - 0.35 * streaks) + col;

    // History feedback — vertical streaks persist briefly so the eye reads
    // them as continuous filaments, not flickering pixels. Sample shifted
    // slightly downward so the trail feels like the streak descending.
    vec3 hist = texture(u_history, uv + vec2(0.0, 0.003)).rgb * 0.86;
    mixed = max(mixed, hist);

    fragColor = vec4(mixed, 1.0);
}
