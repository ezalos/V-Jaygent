// ABOUTME: Magnetic potential field — scalar phi ping-pong with Laplacian diffusion + decay.
// ABOUTME: Single-blob v4: center source + cursor + impulses; gradient cached in .gb, |grad| in .a.
#version 300 es
precision highp float;

#include "math.glsl"
#include "diffusion.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform int   u_frame;
uniform float u_audio_bass;
uniform float u_audio_kick;
uniform float u_audio_high;
uniform float u_audio_playing;
uniform float u_downbeat;
uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_keys[15];
uniform float u_key_event[15];
uniform sampler2D u_state;

out vec4 fragColor;

// Section magnetism arc — qualitatively different states per section.
// Mapped to Kodama's vocabulary: soft fluid → moss → shark teeth → break →
// drop → iron → cooling → glassy.
float sectionMag(int sec, float prog) {
    if (sec == 0) return 0.06 + 0.18 * prog;          // soft fluid wakening
    if (sec == 1) return 0.45 + 0.20 * prog;          // moss — many tiny
    if (sec == 2) return 0.75;                         // shark teeth — classic
    if (sec == 3) return max(0.0, 0.75 - 1.50 * prog); // breakdown
    if (sec == 4) return 0.30 + 1.40 * prog;          // drop — full bloom
    if (sec == 5) return 1.65 - 0.05 * sin(prog * TAU); // iron / peak
    if (sec == 6) return 1.25 - 1.10 * prog;          // cooling
    return 0.04;                                       // glassy fade
}

// 1/f modulation (4-octave low-freq sum) so magnetism doesn't feel like a
// metronomic VU meter. Mesmerism pacing rule.
float oneOverF(float t) {
    return 0.5 + 0.5 * (
        0.45 * sin(t * 0.21 + 0.7)
      + 0.30 * sin(t * 0.43 + 1.3)
      + 0.18 * sin(t * 0.91 + 2.1)
      + 0.10 * sin(t * 1.83 + 3.7)
    ) * 0.5;
}

void main() {
    vec2 uv    = gl_FragCoord.xy / u_resolution.xy;
    vec2 texel = 1.0 / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    if (u_frame == 0) {
        fragColor = vec4(0.0);
        return;
    }

    float phi = texture(u_state, uv).r;

    // Diffusion + decay (half-life ≈ 1.4s at 60fps).
    float lap = laplacian(u_state, uv, texel, 0);
    phi *= 0.985;
    phi += 0.20 * lap;

    // Section + bass + 1/f modulation. Cap at 2.4 via tanh saturation later.
    float magLevel = sectionMag(u_section_id, u_section_progress);
    float bassG    = 0.20 + 0.80 * u_audio_bass;
    float oneF     = 0.7 + 0.6 * oneOverF(u_time);  // [0.4..1.3]-ish
    float fieldGain = magLevel * bassG * oneF;

    // === Central magnetic source — the music's field ===
    // Always at canvas center. Its strength IS the music. The body sits
    // around it (centered blob).
    {
        vec2 d = p;
        phi += 0.030 * fieldGain * exp(-dot(d, d) * 30.0);
    }

    // === Cursor — second magnet, capped at 40% of music total ===
    // The brief's defining interaction. Cursor LEANS the spike pattern
    // toward your finger.
    bool mouseIdle = (u_mouse.x == 0.0 && u_mouse.y == 0.0);
    if (!mouseIdle) {
        vec2 mN = u_mouse / u_resolution.xy;
        vec2 mP = (mN - 0.5) * vec2(aspect, 1.0);
        vec2 d  = p - mP;
        float cap = 0.40 * fieldGain + 0.04;  // never zero so cursor always reads
        phi += 0.030 * cap * exp(-dot(d, d) * 80.0);
    }

    // === Kick — flux impulse near center (silent erupt) ===
    if (u_audio_kick > 0.01) {
        vec2 d = p;
        phi += 0.090 * u_audio_kick * exp(-dot(d, d) * 90.0);
    }

    // === Downbeat — radial flux pulse / "snap to perfect hex" tell ===
    if (u_downbeat > 0.001) {
        float r = length(p);
        float ringR = 0.10 + (1.0 - u_downbeat) * 0.40;
        float dr = abs(r - ringR);
        phi += 0.050 * u_downbeat * exp(-dr * dr * 250.0);
    }

    // === Keys — 15 anchors on a horizontal arc, white +, black − ===
    for (int i = 0; i < 15; i++) {
        bool isBlack = (i >= 9);
        float halfPos[6] = float[6](0.5, 1.5, 3.5, 4.5, 5.5, 7.5);
        float pos = isBlack ? halfPos[i - 9] : float(i);
        float kx = (pos / 8.0 - 0.5) * 1.40;
        float ky = isBlack ? -0.55 : -0.65;
        vec2 kp = vec2(kx, ky);
        vec2 d  = p - kp;
        float sign = isBlack ? -1.0 : 1.0;
        float amt = 0.040 * u_key_event[i] + 0.012 * u_keys[i];
        phi += sign * amt * exp(-dot(d, d) * 380.0);
    }

    // Idle synthetic — when no audio (headless inspect), keep the field alive.
    if (u_audio_playing < 0.5) {
        vec2 idleP = vec2(0.16 * cos(u_time * 0.31), 0.12 * sin(u_time * 0.43));
        vec2 d = p - idleP;
        phi += 0.014 * exp(-dot(d, d) * 110.0);
    }

    // tanh saturation — Langevin-style. Prevents bass drops blowing the buffer
    // and gives the "spike growth slows at peak field" feel.
    phi = 2.0 * tanh(phi * 0.5);

    // Compute gradient + magnitude from neighbour samples; cache in .gba.
    float pN = texture(u_state, uv + vec2(0.0,  texel.y)).r;
    float pS = texture(u_state, uv + vec2(0.0, -texel.y)).r;
    float pE = texture(u_state, uv + vec2( texel.x, 0.0)).r;
    float pW = texture(u_state, uv + vec2(-texel.x, 0.0)).r;
    vec2 grad = vec2((pE - pW) * 0.5, (pN - pS) * 0.5);

    fragColor = vec4(phi, grad.x, grad.y, length(grad));
}
