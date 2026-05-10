// ABOUTME: Magnetic potential field — scalar phi ping-pong with Laplacian diffusion + decay.
// ABOUTME: Caches gradient in .gb and |grad| in .a so display only takes 1 texture sample.
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

// True Keplerian orbit (eccentric anomaly approximation, e < 0.6).
// Returns world position for a body with semi-major axis a, eccentricity e,
// period T, phase phi0, all rotated by orient and offset by center.
vec2 kepler(float t, float a, float e, float T, float phi0,
            float orient, vec2 center) {
    float M = TAU * t / T + phi0;
    // 2-term series expansion of Kepler's equation E - e*sin(E) = M.
    float E = M + e * sin(M) + 0.5 * e * e * sin(2.0 * M);
    float b = a * sqrt(max(0.0, 1.0 - e * e));
    vec2 r = vec2(a * (cos(E) - e), b * sin(E));
    return center + rot2d(orient) * r;
}

// Audio + section perturbations applied to nominal orbits.
// e_boost during sections 4-5 (drop / peak) tightens periapsis dramatically.
void bodies(float t, float audioBass, float audioMid, float kickEnv,
            int sec, float secProg,
            out vec2 b0, out vec2 b1, out vec2 b2, out vec2 b3,
            out float pairSep) {
    // Slow drift of the inner pair's barycenter.
    vec2 pairC = vec2(0.16 * cos(t * 0.071), 0.11 * sin(t * 0.103));

    // Eccentricity ramp — sec 4 (235s..297s) drives the pair into a tight
    // periapsis tango. Default e = 0.55, peak e = 0.82.
    float eBoost = 0.0;
    if (sec == 4) eBoost = 0.27 * smoothstep(0.0, 0.5, secProg);
    else if (sec == 5) eBoost = 0.27;
    else if (sec == 6) eBoost = 0.27 * (1.0 - smoothstep(0.0, 0.4, secProg));
    float ePair = clamp(0.55 + eBoost, 0.0, 0.85);

    // Audio-coupled orbital phase wobble — bass drops VISIBLY accelerate
    // the binary. 1.2 rad of wobble at peak bass.
    float phaseWobble = 1.2 * audioBass * sin(TAU * t / 4.0);

    // Inner binary orient slowly wanders so the periapsis axis isn't fixed.
    float orient0 = 0.5 * sin(t * 0.041) + audioMid * 0.6;

    // Slingshot kick — when audio_kick fires we tag a body via beat_index
    // mod 4 and add a brief perpendicular deflection that decays over a
    // few seconds. Without state we approximate as a smooth bump on the
    // angle/eccentricity tied to time-since-recent-kick estimated from
    // beat_phase. Here: kickEnv is a 0..1 "recent kick" proxy passed in.
    float kickPhase = kickEnv * 0.6;

    // Inner binary — primary + companion orbit a common center, opposite phase.
    b0 = kepler(t, 0.30, ePair, 31.0,
                phaseWobble + kickPhase, orient0, pairC);
    b1 = kepler(t, 0.30, ePair, 31.0,
                PI + phaseWobble - kickPhase, orient0, pairC);

    // Wide moon — long period, modest eccentricity, retrograde orient.
    float orient2 = -0.3 + 0.2 * sin(t * 0.027);
    b2 = kepler(t, 0.78, 0.42, 73.0,
                0.4 + audioMid * 0.10, orient2, vec2(0.0));

    // Wanderer — third "comet" on a long, very eccentric orbit. Offsets the
    // composition + visits planets occasionally.
    float orient3 = 0.7 + 0.4 * sin(t * 0.019);
    b3 = kepler(t, 0.68, 0.62, 53.0,
                2.1 + audioMid * 0.08 - kickPhase * 0.5, orient3,
                vec2(0.05 * cos(t * 0.043), -0.04 * sin(t * 0.061)));

    pairSep = length(b0 - b1);
}

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
        fragColor = vec4(0.0);
        return;
    }

    // Read previous-frame field (.r holds phi).
    float phi = texture(u_state, uv).r;

    // Diffusion + decay. Half-life ≈ 1.4s at 60fps.
    float lap = laplacian(u_state, uv, texel, 0);
    phi *= 0.985;
    phi += 0.20 * lap;

    // Bodies + section magnetism.
    float magLevel = sectionMag(u_section_id, u_section_progress);
    float bassG    = 0.15 + 0.85 * u_audio_bass;
    float fieldGain = magLevel * bassG;

    // Approximate "recent-kick envelope" without state — beat_phase rises
    // sharply on each kick frame, decays to zero before next beat. Use
    // u_audio_kick directly as a smoothed proxy.
    float kickEnv = clamp(u_audio_kick * 1.3, 0.0, 1.0);

    vec2 b0, b1, b2, b3;
    float pairSep;
    bodies(u_time, u_audio_bass, u_audio_mid, kickEnv,
           u_section_id, u_section_progress,
           b0, b1, b2, b3, pairSep);

    // Per-frame source amplitude — equilibrium phi at hot spot ~ 1.7 at peak.
    float srcA = 0.026 * fieldGain;
    {
        vec2 d0 = p - b0; vec2 d1 = p - b1;
        vec2 d2 = p - b2; vec2 d3 = p - b3;
        phi += srcA * 1.10 * exp(-dot(d0, d0) * 320.0);
        phi += srcA * 1.10 * exp(-dot(d1, d1) * 320.0);
        phi += srcA * 0.85 * exp(-dot(d2, d2) * 200.0);
        phi += srcA * 0.75 * exp(-dot(d3, d3) * 220.0);
    }

    // Cursor — negative monopole; drags spikes toward your finger AND acts
    // as a 5th body in display.
    bool mouseIdle = (u_mouse.x == 0.0 && u_mouse.y == 0.0);
    if (!mouseIdle) {
        vec2 mN = u_mouse / u_resolution.xy;
        vec2 mP = (mN - 0.5) * vec2(aspect, 1.0);
        vec2 d  = p - mP;
        phi -= 0.040 * exp(-dot(d, d) * 95.0);
    }

    // Kick — flux impulse at one of the 4 bodies, cycling by beat index.
    if (u_audio_kick > 0.01) {
        int sel = int(mod(float(u_beat_index), 4.0));
        vec2 kp = (sel == 0) ? b0 : (sel == 1) ? b1 : (sel == 2) ? b2 : b3;
        vec2 d = p - kp;
        phi += 0.10 * u_audio_kick * exp(-dot(d, d) * 700.0);
    }

    // Downbeat — radial flux pulse from origin. Shows polyrhythm.
    if (u_downbeat > 0.001) {
        float r = length(p);
        float ringR = 0.04 + (1.0 - u_downbeat) * 0.55;
        float dr = abs(r - ringR);
        phi += 0.060 * u_downbeat * exp(-dr * dr * 200.0);
    }

    // Keys — each cycles to a body (i mod 4). White +, black −.
    for (int i = 0; i < 15; i++) {
        int sel = int(mod(float(i), 4.0));
        vec2 kp = (sel == 0) ? b0 : (sel == 1) ? b1 : (sel == 2) ? b2 : b3;
        vec2 d  = p - kp;
        bool isBlack = (i >= 9);
        float sign = isBlack ? -1.0 : 1.0;
        float amt = 0.045 * u_key_event[i] + 0.010 * u_keys[i];
        phi += sign * amt * exp(-dot(d, d) * 500.0);
    }

    // Idle synthetic — when audio doesn't autoplay (headless inspect).
    if (u_audio_playing < 0.5) {
        vec2 idleP = vec2(0.30 * cos(u_time * 0.31), 0.22 * sin(u_time * 0.43));
        vec2 d = p - idleP;
        phi += 0.014 * exp(-dot(d, d) * 130.0);
    }

    phi = clamp(phi, -2.4, 2.4);

    // Compute gradient from neighbour samples and cache in .gb. Display
    // reads .gb directly — saves 4 texture taps per pixel down the line.
    float pN = texture(u_state, uv + vec2(0.0,  texel.y)).r;
    float pS = texture(u_state, uv + vec2(0.0, -texel.y)).r;
    float pE = texture(u_state, uv + vec2( texel.x, 0.0)).r;
    float pW = texture(u_state, uv + vec2(-texel.x, 0.0)).r;
    vec2 grad = vec2((pE - pW) * 0.5, (pN - pS) * 0.5);

    fragColor = vec4(phi, grad.x, grad.y, length(grad));
}
