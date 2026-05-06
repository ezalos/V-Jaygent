// ABOUTME: Wave-equation FDTD ping-pong. State packed (height, velocity, _, _).
// ABOUTME: Sources from kick/snare/cymbal/keys/cursor; damping modulated by RD activator.
#version 300 es
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "diffusion.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform int   u_frame;
uniform float u_audio_kick;
uniform float u_audio_snare;
uniform float u_audio_cymbal;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;
uniform float u_audio_playing;
uniform float u_downbeat;
uniform int   u_beat_index;
uniform float u_keys[15];
uniform float u_key_event[15];
uniform sampler2D u_state;       // self ping-pong
uniform sampler2D u_rd_state;    // RD's prev-frame state (cross-coupling)

out vec4 fragColor;

// Per-key x position in normalized [-0.6, 0.6] world coords (15 piano semis).
// Black keys at half-positions; white keys at integer positions in [0..8].
vec2 keyPos(int i) {
    float halfPositions[6] = float[6](0.5, 1.5, 3.5, 4.5, 5.5, 7.5);
    bool isBlack = (i >= 9);
    float pos = isBlack ? halfPositions[i - 9] : float(i);
    float kx = (pos / 8.0 - 0.5) * 1.2;
    float ky = isBlack ? 0.18 : -0.18;
    return vec2(kx, ky);
}

// Hash-positioned point per beat for "random place" snare/cymbal drops.
vec2 hashPos(int seed) {
    vec2 h = hash22(vec2(float(seed) * 0.7 + 1.3, 11.1));
    return (h - 0.5) * 1.4;
}

void main() {
    vec2 uv    = gl_FragCoord.xy / u_resolution.xy;
    vec2 texel = 1.0 / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    if (u_frame == 0) {
        // Quiet field with a barely-visible warm-up perturbation so the first
        // ripples ease in instead of cracking out of zero.
        float seed = vnoise(p * 4.5) * 0.012;
        fragColor = vec4(seed, 0.0, 0.0, 1.0);
        return;
    }

    // Read previous wave state.
    vec4 s = texture(u_state, uv);
    float h = s.r;
    float v = s.g;

    // 4-tap Laplacian — wave propagation.
    vec4 lap = laplacian4(u_state, uv, texel);
    float lapH = lap.r;

    // Wave speed (CFL-stable: c² < 0.5 in 2D for the 5-point stencil).
    float c2 = 0.21;

    // RD activator modulates damping. Activator-rich regions damp waves —
    // spirals become standing-wave attractors; this is the bidirectional
    // coupling that makes the membrane interesting.
    float activator = texture(u_rd_state, uv).g;
    float damping = 0.030 + 0.22 * activator;

    // Verlet step.
    float dt = 1.0;
    float accel = c2 * lapH - damping * v;

    // === SOURCES ===

    // Cursor — held position drips a low-amplitude continuous source. As the
    // user drags, the source moves and effectively traces a ripple track.
    bool mouseIdle = (u_mouse.x == 0.0 && u_mouse.y == 0.0);
    if (!mouseIdle) {
        vec2 mN = u_mouse / u_resolution.xy;
        vec2 mP = (mN - 0.5) * vec2(aspect, 1.0);
        float d = length(p - mP);
        accel += exp(-d * d * 320.0) * 0.011;
    }

    // Kick / downbeat — centred ring impulse. Kick is the per-frame onset
    // pulse; downbeat is the bar-aligned tick. Both contribute, downbeat
    // bigger so bars announce themselves.
    {
        float d = length(p);
        accel += exp(-d * d * 60.0) * (0.16 * u_audio_kick + 0.32 * u_downbeat);
    }

    // Snare — random-position impulse, hash-positioned per beat.
    {
        vec2 sp = hashPos(u_beat_index * 13 + 5);
        float d = length(p - sp);
        accel += exp(-d * d * 200.0) * 0.20 * u_audio_snare;
    }

    // Cymbal — three small scattered pings on each cymbal pulse.
    for (int k = 0; k < 3; k++) {
        vec2 cp = hashPos(u_beat_index * 7 + k * 31 + 3);
        cp *= 0.85;
        float d = length(p - cp);
        accel += exp(-d * d * 600.0) * 0.06 * u_audio_cymbal;
    }

    // Keys — held key sustains a wave source at key.x; press fires impulse.
    for (int i = 0; i < 15; i++) {
        vec2 kp = keyPos(i);
        float d = length(p - kp);
        accel += exp(-d * d * 280.0) * (0.10 * u_key_event[i] + 0.018 * u_keys[i]);
    }

    // Idle synthetic — when nothing's playing, a slow wandering ping keeps
    // the field alive so the piece self-plays in inspect/preview.
    if (u_audio_playing < 0.5) {
        vec2 idleP = vec2(0.42 * cos(u_time * 0.40), 0.30 * sin(u_time * 0.71));
        float d = length(p - idleP);
        accel += exp(-d * d * 220.0) * 0.012 * (0.55 + 0.45 * sin(u_time * 1.7));
    }

    // Verlet update.
    v += accel * dt;
    h += v * dt;

    // Soft clamp — keeps energy from runaway when many sources stack.
    h = clamp(h, -1.6, 1.6);
    v = clamp(v, -1.6, 1.6);

    fragColor = vec4(h, v, 0.0, 1.0);
}
