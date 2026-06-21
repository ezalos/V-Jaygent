// ABOUTME: Days Without You display — Lenia ecosystem in teal(life)+amber(rims)+magenta(destruction).
// ABOUTME: A->teal colony, |grad A|->gold rims, damage .g->magenta/white flash with orange ember wake.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec2      u_mouse;
uniform sampler2D u_state;     // .r = A (density), .g = D (damage/destruction)

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

// Teal life ramp: near-black -> deep teal -> teal-green -> pale cyan-cream.
vec3 teal(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.010, 0.020, 0.022);
    vec3 c1 = vec3(0.020, 0.230, 0.250);
    vec3 c2 = vec3(0.090, 0.560, 0.470);
    vec3 c3 = vec3(0.720, 0.970, 0.880);
    if (t < 0.34) return mix(c0, c1, t / 0.34);
    if (t < 0.68) return mix(c1, c2, (t - 0.34) / 0.34);
    return                mix(c2, c3, (t - 0.68) / 0.32);
}

void main() {
    vec2 uv    = gl_FragCoord.xy / u_resolution.xy;
    vec2 texel = 1.0 / u_resolution.xy;
    vec2 q     = worldQ(gl_FragCoord.xy);

    float A = texture(u_state, uv).r;
    float D = texture(u_state, uv).g;   // destruction/damage

    // Gradient of A -> creature rims.
    float ax = texture(u_state, uv + vec2(texel.x, 0.0)).r - texture(u_state, uv - vec2(texel.x, 0.0)).r;
    float ay = texture(u_state, uv + vec2(0.0, texel.y)).r - texture(u_state, uv - vec2(0.0, texel.y)).r;
    float edge = length(vec2(ax, ay));

    // ---- background: deep teal-black with a faint central glow ----
    vec3 col = vec3(0.012, 0.020, 0.024) * (1.0 - 0.5 * length(q));

    // ---- the living colony (TEAL) ----
    float l   = pow(clamp(A, 0.0, 1.0), 0.75);
    vec3  life = teal(l);
    col = max(col, life * smoothstep(0.02, 0.30, A));
    col += vec3(0.55, 0.95, 0.85) * smoothstep(0.72, 1.0, A) * 0.4;   // bright cyan cores

    // ---- AMBER/GOLD membrane rims (the warm structure, always present) ----
    vec3 amber = vec3(0.98, 0.62, 0.16);
    col += amber * smoothstep(0.04, 0.30, edge) * (0.45 + 0.55 * A) * 0.75;

    // ---- DESTRUCTION (MAGENTA flash -> white hot, ORANGE ember wake) ----
    // Damage cools white-hot -> magenta -> ember as D decays, so a blast front
    // reads as a bright magenta/white edge leaving burning orange scars behind.
    vec3 ember   = vec3(0.95, 0.34, 0.07);
    vec3 magenta = vec3(0.95, 0.12, 0.66);
    col = mix(col, ember, smoothstep(0.06, 0.30, D));            // cooled burning wake (orange)
    col = mix(col, magenta, smoothstep(0.28, 0.62, D) * 0.92);   // destruction front (MAGENTA, dominant)
    col += magenta * smoothstep(0.30, 0.70, D) * 0.6;            // magenta bloom
    col += vec3(1.0, 0.92, 0.98) * smoothstep(0.80, 1.0, D);     // white-hot blast core

    // ---- visible phase-lock: a ring breathes out from centre on the downbeat ----
    float ring = u_downbeat * smoothstep(0.02, 0.0, abs(length(q) - u_bar_phase * 0.6));
    col += vec3(0.95, 0.3, 0.5) * ring * 0.25;

    // Cursor halo (the fertile zone — teal).
    if (!(u_mouse.x == 0.0 && u_mouse.y == 0.0)) {
        vec2 mq = worldQ(u_mouse);
        col += vec3(0.3, 0.9, 0.8) * exp(-dot(q - mq, q - mq) / 0.012) * 0.16;
    }

    // Keyboard flares.
    for (int kk = 0; kk < 15; kk++) {
        vec2 kc = vec2((float(kk) / 14.0 - 0.5) * 1.4, 0.0);
        col += vec3(0.5, 0.95, 0.85) * u_key_event[kk] * exp(-dot(q - kc, q - kc) / 0.02) * 0.6;
    }

    // ---- finish ----
    float exposure = 1.35 + 0.30 * u_audio_level;
    col = reinhard(col * exposure);
    col += (hash21(gl_FragCoord.xy + u_time) - 0.5) * 0.03;   // grain
    col *= 1.0 - 0.24 * dot(q, q);                            // vignette
    col = pow(max(col, 0.0), vec3(0.90));                     // gamma
    fragColor = vec4(col, 1.0);
}
