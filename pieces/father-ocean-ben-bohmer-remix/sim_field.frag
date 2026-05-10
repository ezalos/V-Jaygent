// ABOUTME: Magnetic potential field — scalar phi ping-pong with Laplacian diffusion + decay.
// ABOUTME: Sources: 3 ferrofluid planet centers (positive), cursor (negative), kick/downbeat/keys.
#version 300 es
precision highp float;

#include "math.glsl"
#include "diffusion.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform int   u_frame;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;
uniform float u_audio_kick;
uniform float u_audio_playing;
uniform float u_downbeat;
uniform int   u_beat_index;
uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_keys[15];
uniform float u_key_event[15];
uniform sampler2D u_state;

out vec4 fragColor;

// Closed-form orbits — must be IDENTICAL to the function in shader.frag.
// Inner pair: 31s period (16 bars at 123 BPM). Wide moon: 73s.
void planets(float t, float audioMid,
             out vec2 p0, out vec2 p1, out vec2 p2) {
    vec2 pairC = vec2(0.18 * cos(t * 0.063), 0.13 * sin(t * 0.087));
    float ang0 = TAU * t / 31.0 + audioMid * 0.18;
    // Eccentric pair so periapsis triggers the tidal-bridge smin every 16 bars.
    float r0   = 0.20 + 0.16 * sin(ang0);
    vec2 off   = r0 * vec2(cos(ang0), sin(ang0));
    p0 = pairC + off;
    p1 = pairC - off;
    float ang2 = TAU * t / 73.0 + 0.4 + audioMid * 0.10;
    float r2   = 0.78 + 0.10 * sin(ang2 * 0.5);
    // Vertical squash 0.42 keeps c2 within the 16:9 safe area at apoapsis.
    p2 = vec2(r2 * cos(ang2), r2 * 0.42 * sin(ang2));
}

// Section magnetism level — narrative arc.
// 0 dormant → 1 baseline → ~1.6 peak → 0 still.
float sectionMag(int sec, float prog) {
    if (sec == 0) return 0.05 + 0.20 * prog;
    if (sec == 1) return 0.45 + 0.30 * prog;
    if (sec == 2) return 0.70;
    if (sec == 3) return max(0.0, 0.70 - 1.30 * prog);
    if (sec == 4) return 0.30 + 1.30 * prog;
    if (sec == 5) return 1.55 - 0.05 * sin(prog * TAU);
    if (sec == 6) return 1.10 - 0.85 * prog;
    return 0.04;
}

void main() {
    vec2 uv    = gl_FragCoord.xy / u_resolution.xy;
    vec2 texel = 1.0 / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    if (u_frame == 0) {
        fragColor = vec4(0.0, 0.0, 0.0, 0.0);
        return;
    }

    // Read previous-frame field.
    float phi = texture(u_state, uv).r;

    // Diffusion (5-point Laplacian times h² absorbed into rate).
    float lap = laplacian(u_state, uv, texel, 0);
    float D   = 0.20;       // diffusion rate per frame — keep < 0.25 for stability
    float dt  = 1.0;

    // Decay — keeps the field from accumulating to runaway. Half-life ≈ 1.4s
    // (.99^60 ≈ 0.55) so the 5s breakdown reads as a clear decay.
    phi *= 0.985;
    phi += D * lap * dt;

    // === Section + audio level the magnetism ===
    float magLevel = sectionMag(u_section_id, u_section_progress);
    float bassG    = 0.15 + 0.85 * u_audio_bass;          // bass ≥ 0.15 even silent
    float fieldGain = magLevel * bassG;

    // === Planet sources — positive monopoles ===
    float t = u_time;
    vec2 p0, p1, p2;
    planets(t, u_audio_mid, p0, p1, p2);

    // Per-frame source amplitude (small — equilibrium emerges from
    // (source / (1 - decay - D*Δ)) ≈ 0.025 / 0.015 ≈ 1.7 saturation at peak).
    float srcA = 0.026 * fieldGain;
    {
        vec2 d0 = p - p0; vec2 d1 = p - p1; vec2 d2 = p - p2;
        // Strength biased: paired planets a touch stronger than the wide moon.
        phi += srcA * 1.10 * exp(-dot(d0, d0) * 320.0);
        phi += srcA * 1.10 * exp(-dot(d1, d1) * 320.0);
        phi += srcA * 0.85 * exp(-dot(d2, d2) * 200.0);
    }

    // === Cursor — negative monopole. Drag spikes toward your finger. ===
    bool mouseIdle = (u_mouse.x == 0.0 && u_mouse.y == 0.0);
    if (!mouseIdle) {
        vec2 mN = u_mouse / u_resolution.xy;
        vec2 mP = (mN - 0.5) * vec2(aspect, 1.0);
        vec2 d  = p - mP;
        phi -= 0.030 * exp(-dot(d, d) * 110.0);
    }

    // === Kick — flux impulse at one of the planets. Cycle by beat index. ===
    if (u_audio_kick > 0.01) {
        int sel = int(mod(float(u_beat_index), 3.0));
        vec2 kp = (sel == 0) ? p0 : (sel == 1) ? p1 : p2;
        vec2 d = p - kp;
        phi += 0.085 * u_audio_kick * exp(-dot(d, d) * 700.0);
    }

    // === Downbeat — radial pulse from the centre, big tell ===
    if (u_downbeat > 0.001) {
        float r = length(p);
        // Expanding ring: max amplitude where r ≈ ringR
        float ringR = 0.04 + (1.0 - u_downbeat) * 0.55;
        float dr = abs(r - ringR);
        phi += 0.060 * u_downbeat * exp(-dr * dr * 200.0);
    }

    // === Keyboard — each key cycles to a planet (i mod 3). ===
    // White (i<9) positive, black (i>=9) negative. Press is impulse, hold is
    // a slow drip so chords accumulate field without re-strikes.
    for (int i = 0; i < 15; i++) {
        int sel = int(mod(float(i), 3.0));
        vec2 kp = (sel == 0) ? p0 : (sel == 1) ? p1 : p2;
        vec2 d  = p - kp;
        bool isBlack = (i >= 9);
        float sign = isBlack ? -1.0 : 1.0;
        float amt = 0.045 * u_key_event[i] + 0.010 * u_keys[i];
        phi += sign * amt * exp(-dot(d, d) * 500.0);
    }

    // Idle synthetic — when nothing's playing the field still breathes so
    // inspect / preview shows the piece working. Slow wandering dipole.
    if (u_audio_playing < 0.5) {
        vec2 idleP = vec2(0.36 * cos(u_time * 0.31), 0.27 * sin(u_time * 0.43));
        vec2 d = p - idleP;
        phi += 0.012 * exp(-dot(d, d) * 130.0);
    }

    // Soft clamp keeps the field bounded even if many sources stack.
    phi = clamp(phi, -2.4, 2.4);

    fragColor = vec4(phi, 0.0, 0.0, 1.0);
}
