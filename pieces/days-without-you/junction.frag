// ABOUTME: Bosonic Josephson junction ODE — population imbalance z and relative phase phi.
// ABOUTME: Two-mode BEC (Smerzi/Raghavan). State .r=z, .g=phi, .b=K, .a=internal clock tau.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec2      u_mouse;
uniform int       u_frame;
uniform sampler2D u_state;

uniform float u_key_event[15];
uniform float u_audio_vocals_stem;
uniform float u_audio_bass_stem;
uniform float u_audio_drums_stem;
uniform float u_audio_other_stem;
uniform float u_audio_kick;
uniform float u_audio_playing;
uniform int   u_section_id;
uniform float u_downbeat;
uniform int   u_bar_index;

out vec4 fragColor;

const int   SUB = 6;
const float DTJ = 0.008;                   // per-substep
const float TAU_STEP = float(SUB) * DTJ;  // internal clock advance / frame

// Per-section nonlinearity baseline (when audio plays). High Lambda -> macroscopic
// self-trapping (stuck on one side = the days without you); low -> coherent tunneling.
float secLambda(int s) {
    if (s <= 0) return 1.8;
    if (s == 1) return 1.1;
    if (s == 2) return 2.5;
    if (s == 3) return 0.35;
    if (s == 4) return 0.8;
    if (s == 5) return 1.6;
    if (s == 6) return 1.9;
    return 2.2;
}

void main() {
    if (u_frame == 0) {
        fragColor = vec4(0.85, 0.0, 0.55, 0.0);   // z=0.85, phi=0, K=0.55, tau=0
        return;
    }

    vec4  st  = texture(u_state, vec2(0.5));
    float z   = clamp(st.r, -0.999, 0.999);
    float phi = st.g;
    float tau = st.a + TAU_STEP;              // internal clock — always advances

    // Idle baseline: slow INCOMMENSURATE drives so the trajectory never repeats and
    // Lambda crosses the self-trapping threshold both ways (tunneling <-> trapped).
    float Ki   = 0.55 + 0.20 * sin(tau * 0.48);
    float Li   = 1.10 + 0.85 * sin(tau * 0.091) + 0.30 * sin(tau * 0.043);
    float bi   = 0.40 * sin(tau * 0.187) + 0.30 * sin(tau * 0.331);

    // Audio drive (when playing).
    float dir  = (mod(float(u_bar_index), 2.0) < 0.5) ? 1.0 : -1.0;
    float Ka   = 0.55 + 0.75 * u_audio_vocals_stem + 0.40 * u_audio_bass_stem;  // bass couples too
    float La   = secLambda(u_section_id) + 1.8 * u_audio_other_stem;
    float ba   = 2.2 * u_audio_kick * dir + 0.25 * sin(tau * 0.21);

    float p    = clamp(u_audio_playing, 0.0, 1.0);
    float K    = mix(Ki, Ka, p);
    float Lam  = mix(Li, La, p);
    float bias = mix(bi, ba, p);

    // Cursor as instrument: drag horizontally to push the condensate between wells
    // (bias); raise the cursor to strengthen the coupling (faster tunneling).
    if (!(u_mouse.x == 0.0 && u_mouse.y == 0.0)) {
        vec2 mq = (u_mouse - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
        bias += 3.0 * mq.x;
        K    += 0.7 * clamp(0.5 - mq.y, 0.0, 1.0);
    }

    // Keyboard synth: each key plucks the junction — a bias + phase impulse, low
    // keys shove left, high keys shove right.
    for (int kk = 0; kk < 15; kk++) {
        float ev = u_key_event[kk];
        bias += ev * (float(kk) / 14.0 - 0.5) * 7.0;
    }

    // Integrate the two-mode equations with sub-stepped RK2.
    // z'   = -2K sqrt(1-z^2) sin(phi)
    // phi' =  2K Lam z + 2K z cos(phi)/sqrt(1-z^2) + bias
    for (int i = 0; i < SUB; i++) {
        float s2 = sqrt(max(1.0 - z * z, 1e-4));
        float dz1 = -2.0 * K * s2 * sin(phi);
        float dp1 =  2.0 * K * Lam * z + 2.0 * K * z * cos(phi) / s2 + bias;
        float zm = clamp(z + 0.5 * DTJ * dz1, -0.999, 0.999);
        float pm = phi + 0.5 * DTJ * dp1;
        float s2m = sqrt(max(1.0 - zm * zm, 1e-4));
        float dz2 = -2.0 * K * s2m * sin(pm);
        float dp2 =  2.0 * K * Lam * zm + 2.0 * K * zm * cos(pm) / s2m + bias;
        z   = clamp(z + DTJ * dz2, -0.999, 0.999);
        phi = phi + DTJ * dp2;
    }

    phi = mod(phi + 3.14159265, 6.2831853) - 3.14159265;   // wrap to [-pi,pi]
    fragColor = vec4(z, phi, K, tau);
}
