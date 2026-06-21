// ABOUTME: Days Without You display — renders the Lenia ecosystem state A as warm life.
// ABOUTME: Luminance from A, ember rims from |grad A| (creature edges = depth), beat + cursor accents.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec2      u_mouse;
uniform sampler2D u_state;     // A in .r

uniform float u_audio_bass_stem;
uniform float u_audio_other_stem;
uniform float u_audio_level;
uniform float u_audio_playing;
uniform float u_downbeat;
uniform float u_bar_phase;
uniform float u_beat_phase;
uniform int   u_section_id;
uniform float u_key_event[15];

#include "math.glsl"
#include "noise.glsl"
#include "tonemap.glsl"

out vec4 fragColor;

vec2 worldQ(vec2 fc) { return (fc - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y); }

// near-black -> wine -> ember -> amber -> cream. Luminance carries the signal.
vec3 warm(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.015, 0.008, 0.012);
    vec3 c1 = vec3(0.30,  0.05,  0.12);
    vec3 c2 = vec3(0.72,  0.18,  0.06);
    vec3 c3 = vec3(0.98,  0.58,  0.20);
    vec3 c4 = vec3(1.00,  0.94,  0.80);
    if (t < 0.25) return mix(c0, c1,  t / 0.25);
    if (t < 0.50) return mix(c1, c2, (t - 0.25) / 0.25);
    if (t < 0.75) return mix(c2, c3, (t - 0.50) / 0.25);
    return                mix(c3, c4, (t - 0.75) / 0.25);
}

void main() {
    vec2 uv    = gl_FragCoord.xy / u_resolution.xy;
    vec2 texel = 1.0 / u_resolution.xy;
    vec2 q     = worldQ(gl_FragCoord.xy);

    float A = texture(u_state, uv).r;

    // Gradient of A -> creature rims (native fine texture + a sense of depth).
    float ax = texture(u_state, uv + vec2(texel.x, 0.0)).r - texture(u_state, uv - vec2(texel.x, 0.0)).r;
    float ay = texture(u_state, uv + vec2(0.0, texel.y)).r - texture(u_state, uv - vec2(0.0, texel.y)).r;
    float edge = length(vec2(ax, ay));

    // ---- background: warm near-black with a faint central vignette glow ----
    vec3 col = vec3(0.020, 0.012, 0.015) * (1.0 - 0.5 * length(q));

    // ---- the living field ----
    float l   = pow(clamp(A, 0.0, 1.0), 0.75);
    float hue = l + 0.05 * sin(A * 9.0 + u_time * 0.05);   // subtle within-warm drift on creature interiors
    col = max(col, warm(hue) * l);

    // Hot colony cores glow (bloom-ish).
    col += warm(0.9) * smoothstep(0.7, 1.0, A) * 0.5;

    // Ember rims on creature edges — the fine structure.
    col += vec3(0.95, 0.45, 0.14) * smoothstep(0.04, 0.30, edge) * (0.5 + 0.5 * A) * 0.6;

    // ---- visible phase-lock: a ring breathes out from centre on the downbeat ----
    float ring = u_downbeat * smoothstep(0.02, 0.0, abs(length(q) - u_bar_phase * 0.6));
    col += vec3(0.9, 0.45, 0.16) * ring * 0.25;

    // Cursor halo (the fertile zone).
    if (!(u_mouse.x == 0.0 && u_mouse.y == 0.0)) {
        vec2 mq = worldQ(u_mouse);
        col += vec3(0.9, 0.5, 0.2) * exp(-dot(q - mq, q - mq) / 0.012) * 0.16;
    }

    // Keyboard flares (direct feedback at the planting site).
    for (int kk = 0; kk < 15; kk++) {
        vec2 kc = vec2((float(kk) / 14.0 - 0.5) * 1.4, 0.0);
        col += vec3(0.95, 0.55, 0.22) * u_key_event[kk] * exp(-dot(q - kc, q - kc) / 0.02) * 0.6;
    }

    // ---- finish ----
    float exposure = 1.35 + 0.30 * u_audio_level;
    col = reinhard(col * exposure);
    col += (hash21(gl_FragCoord.xy + u_time) - 0.5) * 0.03;   // grain
    col *= 1.0 - 0.24 * dot(q, q);                            // vignette
    col = pow(max(col, 0.0), vec3(0.88));                     // gamma
    fragColor = vec4(col, 1.0);
}
