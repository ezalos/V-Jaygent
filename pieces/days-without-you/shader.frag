// ABOUTME: Days Without You display — analytic two-mode BEC wavefunction in a double well.
// ABOUTME: psi = c_L*gL*e^{ikx} + c_R*gR*e^{-ikx+i*phi}; |psi|^2 in warm, the empty well = absence.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec2      u_mouse;
uniform sampler2D u_state;     // junction: .r=z, .g=phi, .b=K

uniform float u_audio_vocals_stem;
uniform float u_audio_bass_stem;
uniform float u_audio_other_stem;
uniform float u_audio_kick;
uniform float u_audio_level;
uniform float u_audio_playing;
uniform float u_downbeat;
uniform float u_bar_phase;
uniform float u_beat_phase;
uniform float u_section_progress;
uniform int   u_section_id;
uniform float u_key_event[15];

#include "math.glsl"
#include "noise.glsl"
#include "tonemap.glsl"

out vec4 fragColor;

vec2 worldQ(vec2 fc) {
    return (fc - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
}

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
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 q  = worldQ(gl_FragCoord.xy);

    vec4  st  = texture(u_state, vec2(0.5));
    float z   = clamp(st.r, -0.999, 0.999);
    float phi = st.g;
    float tau = st.a;                      // junction internal clock (advances in idle too)

    float cL = sqrt(0.5 * (1.0 + z));     // left amplitude
    float cR = sqrt(0.5 * (1.0 - z));     // right amplitude

    // Well separation: closer when the wells are coupled (tunneling / vocals);
    // they drift APART as the condensate self-traps (|z| -> 1) — the absence widens.
    float D = 0.13 + 0.15 * abs(z) - 0.03 * u_audio_vocals_stem;
    // Slow incommensurate wander of each well (migration -> long-window divergence).
    vec2 wL = vec2(0.035 * sin(tau * 0.61), 0.045 * sin(tau * 0.83 + 1.7));
    vec2 wR = vec2(0.035 * sin(tau * 0.52 + 2.1), 0.045 * sin(tau * 0.73));
    vec2 L  = vec2(-D, 0.0) + wL;
    vec2 R  = vec2( D, 0.0) + wR;

    float sig = 0.145;
    float gL  = exp(-dot(q - L, q - L) / (2.0 * sig * sig));
    float gR  = exp(-dot(q - R, q - R) / (2.0 * sig * sig));

    // Global phase winds steadily (the e^{-i*mu*t} of the condensate) so the
    // interference fringes continuously SCROLL — the always-on flow of the bridge.
    float phiD = phi + tau * 1.2;
    float k = 24.0;                       // de Broglie momentum -> bridge fringes
    float pL = k * q.x;
    float pR = -k * q.x;
    float re = cL * gL * cos(pL) + cR * gR * cos(pR + phiD);
    float im = cL * gL * sin(pL) + cR * gR * sin(pR + phiD);
    float rho = re * re + im * im;        // |psi|^2 incl. the interference bridge

    // ---- background ----
    vec3 col = vec3(0.020, 0.012, 0.015) * (1.0 - 0.55 * length(q));

    // The two wells always present as dim pools — the EMPTY one reads as absence.
    col = max(col, warm(0.19) * (gL + gR) * 0.30);

    // Barrier — faint dark gap between the wells.
    col *= 1.0 - 0.40 * exp(-(q.x * q.x) / 0.018);

    // ---- the condensate ----
    float l    = 1.0 - exp(-rho * 2.5);
    float tcol = pow(l, 0.80);
    float tph  = tcol + 0.045 * sin(phiD + atan(im, re));   // hue-drift in warm band
    col = max(col, warm(tph) * tcol);

    // Hot core glow where probability concentrates.
    col += warm(0.85) * smoothstep(0.55, 1.0, l) * 0.55;

    // Bridge accent — the interference where the wells overlap (their connection).
    // A faint beat shimmer rides the connection so the pulse reads on the bridge.
    float bridge = gL * gR;
    col += vec3(0.95, 0.5, 0.18) * bridge * (0.4 + 0.6 * cL * cR)
         * (0.85 + 0.15 * sin(u_beat_phase * 6.2831853)) * 0.9;

    // Keyboard — each key flares a warm burst at its mapped position (direct
    // visual feedback; the junction also responds by shoving the condensate).
    for (int kk = 0; kk < 15; kk++) {
        float kx = (float(kk) / 14.0 - 0.5) * 1.4;
        vec2  d  = q - vec2(kx, 0.0);
        col += vec3(0.95, 0.55, 0.22) * u_key_event[kk] * exp(-dot(d, d) / 0.02) * 0.7;
    }

    // ---- visible phase-lock: a ring breathes out from centre on the downbeat ----
    float ring = u_downbeat * smoothstep(0.025, 0.0, abs(length(q) - u_bar_phase * 0.62));
    col += vec3(0.9, 0.45, 0.16) * ring * 0.30;

    // Cursor halo.
    if (!(u_mouse.x == 0.0 && u_mouse.y == 0.0)) {
        vec2 mq = worldQ(u_mouse);
        col += vec3(0.9, 0.5, 0.2) * exp(-dot(q - mq, q - mq) / 0.012) * 0.18;
    }

    // Absence reads in HUE, not only luminance: when the condensate self-traps
    // (|z|->1, the wells apart) the whole field redshifts toward wine; when it
    // couples (|z|->0, the bridge bright) it warms back to amber. The dominant
    // hue drifts with the state across the song (stays warm — only reddens).
    float trap = abs(z);
    col.g *= 1.0 - 0.20 * trap;
    col.b *= 1.0 - 0.12 * trap;

    // ---- finish ----
    float exposure = 1.45 + 0.35 * u_audio_level;
    col = reinhard(col * exposure);
    col += (hash21(gl_FragCoord.xy + u_time) - 0.5) * 0.035;   // grain
    col *= 1.0 - 0.25 * dot(q, q);                             // vignette
    col = pow(max(col, 0.0), vec3(0.88));                      // gamma
    fragColor = vec4(col, 1.0);
}
