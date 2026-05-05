#version 300 es
// ABOUTME: Glitch-rgb layer — block-displacement + per-channel offset of
// ABOUTME: u_below, intensity gated by section transitions and downbeats.
// ABOUTME: Reads peak-clean during steady sections, breaks apart visibly on
// ABOUTME: section boundaries (first 8% of each new section).
precision highp float;

#include "noise.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_bass;
uniform float u_audio_high;
uniform float u_audio_kick;
uniform float u_downbeat;
uniform float u_section_progress;
uniform int   u_section_id;
uniform float u_song_progress;
uniform sampler2D u_below;
uniform sampler2D u_history;
out vec4 fragColor;

float hash11(float n) {
    return fract(sin(n * 12.9898) * 43758.5453);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;

    // Section-transition window: first 8% of each new section is the
    // intense break-apart phase. After that the layer goes near-silent
    // until the next section. u_downbeat adds milder per-bar glitches.
    float intro = 1.0 - smoothstep(0.0, 0.08, u_section_progress);
    // Clamp section_progress to ignore the placeholder 0 when no analysis
    // JSON loaded — only fire when sections are actually moving.
    if (u_section_progress < 1e-4 && u_section_id <= 0) intro = 0.0;
    float bar = u_downbeat * 0.45;
    float intensity = max(intro, bar);

    // Block displacement: divide screen into rows of variable height.
    // Each row gets a hash-driven horizontal offset proportional to
    // intensity. Scan-style glitch.
    float blockY = floor(uv.y * 24.0 + u_time * 4.0);
    float blockH = hash11(blockY + float(u_section_id) * 1.3);
    float blockShift = (blockH - 0.5) * 0.20 * intensity;
    vec2 offsetUv = uv + vec2(blockShift, 0.0);

    // Per-channel chromatic shift — r and b sampled at slightly different
    // x coords so we get visible RGB separation during the glitch.
    float chroma = 0.020 * intensity + 0.004 * u_audio_high;
    float rOff = chroma + 0.002 * u_audio_kick;
    float r = texture(u_below, offsetUv + vec2( rOff, 0.0)).r;
    float g = texture(u_below, offsetUv).g;
    float b = texture(u_below, offsetUv - vec2( rOff, 0.0)).b;

    vec3 col = vec3(r, g, b);

    // Scan-line artifact during glitch: every Nth row gets a brightness
    // pulse so the glitch reads as "video tearing".
    float scan = step(0.78, sin(uv.y * u_resolution.y * 1.4 + u_time * 12.0));
    col += vec3(0.18) * scan * intensity * 1.2;

    // Drop-frame artifact: at peak intensity, a few horizontal slices show
    // u_history instead of u_below, simulating compression artifacts.
    if (intensity > 0.35) {
        float hashRow = hash11(blockY * 7.7 + float(u_section_id));
        if (hashRow > 0.84) {
            vec3 hist = texture(u_history, offsetUv).rgb;
            col = mix(col, hist, 0.55);
        }
    }

    // Default mode: pass u_below through unchanged. Cheap fallback when
    // intensity is 0 keeps the layer transparent without adding cost.
    if (intensity < 0.01) {
        col = texture(u_below, uv).rgb;
    }

    fragColor = vec4(col, 1.0);
}
