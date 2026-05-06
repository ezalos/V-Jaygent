// ABOUTME: Gray-Scott reaction-diffusion (chaos zone f=0.034 k=0.057), advected
// ABOUTME: by curl-noise + wave-field gradient. Cursor/keys/audio inject perturbations.
#version 300 es
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "diffusion.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform int   u_frame;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;
uniform float u_audio_kick;
uniform float u_audio_snare;
uniform float u_audio_playing;
uniform float u_downbeat;
uniform float u_song_progress;
uniform int   u_section_id;
uniform float u_keys[15];
uniform float u_key_event[15];
uniform sampler2D u_state;        // self ping-pong (rd species)
uniform sampler2D u_wave_state;   // wave equation output (height in .r)

out vec4 fragColor;

// Diffusion + chaos-zone parameters. F is feed (replenishes substrate),
// K is kill (drains activator). The F-K plane has Pearson's pattern map;
// (0.034, 0.057) lives in the labyrinth/chaos crescent — structures
// barely cohere, spots split, spirals form briefly, annihilations are
// frequent. Worth it.
const float D_U = 0.16;
const float D_V = 0.08;
const float F_BASE = 0.034;
const float K_BASE = 0.057;

vec2 keyPos(int i) {
    float halfPositions[6] = float[6](0.5, 1.5, 3.5, 4.5, 5.5, 7.5);
    bool isBlack = (i >= 9);
    float pos = isBlack ? halfPositions[i - 9] : float(i);
    float kx = (pos / 8.0 - 0.5) * 1.2;
    float ky = isBlack ? 0.18 : -0.18;
    return vec2(kx, ky);
}

// Curl-noise velocity at p — divergence-free 2D flow. ψ = fbm; v = ∇⊥ψ.
// Time-evolved so the flow is non-stationary. Slow drift so RD has time
// to organise locally before being stirred.
vec2 curlNoise(vec2 p, float t) {
    float e = 0.06;
    float n1 = fbm(p + vec2(0.0,  e) + vec2(0.0,  t * 0.10));
    float n2 = fbm(p + vec2(0.0, -e) + vec2(0.0,  t * 0.10));
    float n3 = fbm(p + vec2( e, 0.0) + vec2(0.0,  t * 0.10));
    float n4 = fbm(p + vec2(-e, 0.0) + vec2(0.0,  t * 0.10));
    float dpsiDy = (n1 - n2) / (2.0 * e);
    float dpsiDx = (n3 - n4) / (2.0 * e);
    return vec2(dpsiDy, -dpsiDx);
}

void main() {
    vec2 uv    = gl_FragCoord.xy / u_resolution.xy;
    vec2 texel = 1.0 / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    if (u_frame == 0) {
        // Multi-scale seed so spots and larger blobs both nucleate.
        float seed = vnoise(p * 5.0) + 0.55 * vnoise(p * 16.0);
        float v0 = smoothstep(0.86, 1.10, seed);
        fragColor = vec4(1.0 - 0.5 * v0, 0.25 * v0, 0.0, 1.0);
        return;
    }

    // === ADVECTION VELOCITY ===
    // Three contributions:
    //   1. Curl-noise turbulence at audio-coupled scale (mid-band drives it).
    //   2. Wave-field gradient — the third physics literally pushes RD around.
    //   3. Cursor radial flow — drags species toward cursor when held.
    float curlMag = 0.0040 + 0.0090 * u_audio_mid;
    vec2 vel = curlNoise(p * 2.6, u_time) * curlMag;

    // Wave gradient — finite differences on .r (height).
    float hN = texture(u_wave_state, uv + vec2(0.0,  texel.y)).r;
    float hS = texture(u_wave_state, uv + vec2(0.0, -texel.y)).r;
    float hE = texture(u_wave_state, uv + vec2( texel.x, 0.0)).r;
    float hW = texture(u_wave_state, uv + vec2(-texel.x, 0.0)).r;
    vec2 waveGrad = vec2(hE - hW, hN - hS);
    vel += waveGrad * 0.030;

    // === SEMI-LAGRANGIAN ADVECTION ===
    // Sample state at back-traced position. The Laplacian is computed at the
    // back-traced position too so diffusion follows the flow.
    vec2 advUv = clamp(uv - vel, vec2(0.001), vec2(0.999));
    vec4 state = texture(u_state, advUv);
    float u = state.r;
    float v = state.g;

    vec4 lap = laplacian4(u_state, advUv, texel);
    float Lu = lap.r;
    float Lv = lap.g;

    // Audio-modulated parameters. Bass replenishes substrate; high freq nudges
    // toward chaos by lowering K. Downbeat momentarily spikes feed everywhere.
    float F = F_BASE + 0.005 * u_audio_bass + 0.008 * u_downbeat;
    float K = K_BASE - 0.0035 * u_audio_high;

    float uvv = u * v * v;
    float du = D_U * Lu - uvv + F * (1.0 - u);
    float dv = D_V * Lv + uvv - (F + K) * v;

    u += du;
    v += dv;

    // === SOURCES ===

    // Cursor — drips activator (v) and locally depletes substrate (u). The
    // user can see spirals form where they hover.
    bool mouseIdle = (u_mouse.x == 0.0 && u_mouse.y == 0.0);
    if (!mouseIdle) {
        vec2 mN = u_mouse / u_resolution.xy;
        vec2 mP = (mN - 0.5) * vec2(aspect, 1.0);
        float d  = length(p - mP);
        float feed = exp(-d * d * 540.0) * 0.10;
        v += feed;
        u -= feed * 0.4;
    }

    // Downbeat — centred activator pulse + small ring around it (the "break
    // through" beat: every bar, the field gets shocked at the centre).
    {
        float d = length(p);
        float feed = exp(-d * d * 70.0) * 0.045 * u_downbeat;
        v += feed;
        u -= feed * 0.4;
    }

    // Snare — burst of activator at the wave-impulse location too, so the
    // RD field flares where the wave just dropped.
    {
        vec2 sp = (hash22(vec2(float(u_section_id) + 1.7, 9.1)) - 0.5) * 1.4;
        // Quick estimation: just at center for now; the wave field's gradient
        // (advected here) will carry the energy outward visibly.
        float d = length(p);
        float feed = exp(-d * d * 50.0) * 0.030 * u_audio_snare;
        v += feed;
    }

    // Keys — white keys drip activator (v) at key.x; black keys replenish
    // substrate (u) at key.x. Playing chords creates visible balance/imbalance
    // across the field. Press impulse much stronger than held envelope.
    for (int i = 0; i < 15; i++) {
        bool isBlack = (i >= 9);
        vec2 kp = keyPos(i);
        float d = length(p - kp);
        float intensity = exp(-d * d * 240.0);
        float drive = 0.07 * u_key_event[i] + 0.014 * u_keys[i];
        if (isBlack) {
            u = min(u + intensity * drive * 0.6, 1.0);
            v = max(v - intensity * drive * 0.3, 0.0);
        } else {
            v += intensity * drive;
            u -= intensity * drive * 0.4;
        }
    }

    // Idle synthetic source — slow wander so the piece self-plays.
    if (u_audio_playing < 0.5) {
        vec2 idleP = vec2(0.42 * cos(u_time * 0.40), 0.30 * sin(u_time * 0.71));
        float d = length(p - idleP);
        float feed = exp(-d * d * 360.0) * 0.020;
        v += feed;
    }

    u = clamp(u, 0.0, 1.0);
    v = clamp(v, 0.0, 1.0);

    fragColor = vec4(u, v, 0.0, 1.0);
}
