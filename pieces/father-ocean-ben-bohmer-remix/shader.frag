// ABOUTME: Display — 4 ferrofluid bodies on real Keplerian orbits + 5th = cursor body.
// ABOUTME: Spikes erupt outward only, dark steel + warm specular tip; 1 field tap, no halo leak.
#version 300 es
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "sdf.glsl"
#include "tonemap.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;
uniform float u_audio_kick;
uniform float u_audio_playing;
uniform float u_downbeat;
uniform float u_bar_phase;
uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_song_progress;
uniform float u_keys[15];
uniform float u_keys_visual[15];
uniform float u_key_event[15];
uniform sampler2D u_field_state;

out vec4 fragColor;

// === MUST match sim_field.frag::kepler / bodies / sectionMag exactly ===

vec2 kepler(float t, float a, float e, float T, float phi0,
            float orient, vec2 center) {
    float M = TAU * t / T + phi0;
    float E = M + e * sin(M) + 0.5 * e * e * sin(2.0 * M);
    float b = a * sqrt(max(0.0, 1.0 - e * e));
    vec2 r = vec2(a * (cos(E) - e), b * sin(E));
    return center + rot2d(orient) * r;
}

void bodies(float t, float audioBass, float audioMid, float kickEnv,
            int sec, float secProg,
            out vec2 b0, out vec2 b1, out vec2 b2, out vec2 b3,
            out float pairSep) {
    vec2 pairC = vec2(0.16 * cos(t * 0.071), 0.11 * sin(t * 0.103));
    float eBoost = 0.0;
    if (sec == 4) eBoost = 0.27 * smoothstep(0.0, 0.5, secProg);
    else if (sec == 5) eBoost = 0.27;
    else if (sec == 6) eBoost = 0.27 * (1.0 - smoothstep(0.0, 0.4, secProg));
    float ePair = clamp(0.55 + eBoost, 0.0, 0.85);
    float phaseWobble = 1.2 * audioBass * sin(TAU * t / 4.0);
    float orient0 = 0.5 * sin(t * 0.041) + audioMid * 0.6;
    float kickPhase = kickEnv * 0.6;
    b0 = kepler(t, 0.30, ePair, 31.0,
                phaseWobble + kickPhase, orient0, pairC);
    b1 = kepler(t, 0.30, ePair, 31.0,
                PI + phaseWobble - kickPhase, orient0, pairC);
    float orient2 = -0.3 + 0.2 * sin(t * 0.027);
    b2 = kepler(t, 0.78, 0.42, 73.0,
                0.4 + audioMid * 0.10, orient2, vec2(0.0));
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

// One-octave "warp" hash — way cheaper than fbm. Used for spike-tip jitter.
float jhash(vec2 p) {
    p = floor(p) + 0.5;
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Spike profile in θ-space. pow 4 makes peaks crisp triangular.
float spikeProfile(float theta, float planetPhase, vec2 dipoleAxis,
                   float jitter) {
    float lattice = sin(theta * 14.0 + planetPhase + jitter * 2.4);
    lattice = max(0.0, lattice);
    lattice = pow(lattice, 4.0);
    vec2 dirOnRim = vec2(cos(theta), sin(theta));
    float bias = 0.45 + 0.75 * pow(max(0.0, dot(dirOnRim, dipoleAxis)), 2.0);
    return lattice * bias;
}

// Per-body SDF with outward-only spike displacement at this pixel.
float bodySDF(vec2 p, vec2 center, float baseR,
              float planetPhase, vec2 dipoleAxis,
              float fieldAtCenter, float spikeAmpScale) {
    vec2 d = p - center;
    float r = length(d);
    float th = atan(d.y, d.x);
    // Spikes only erupt when |phi| above threshold AND magnetism active.
    float amp = saturate(abs(fieldAtCenter) * 1.6 - 0.05) * spikeAmpScale;
    // Cheap inline jitter (was fbm-based — too expensive).
    float jit = (jhash(p * 6.0 + vec2(u_time * 0.5, 0.0)) - 0.5) * amp * 4.0;
    float profile = spikeProfile(th, planetPhase, dipoleAxis, jit);
    float Reff = baseR + profile * amp * 0.10;
    return r - Reff;
}

// Cursor world coords; (1e4, 1e4) when idle so its SDF effect vanishes.
vec2 cursorWorld(vec2 mPx, vec2 res, float aspect) {
    if (mPx.x == 0.0 && mPx.y == 0.0) return vec2(1e4);
    return ((mPx / res) - 0.5) * vec2(aspect, 1.0);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
    float t = u_time;

    // === Bodies ===
    float kickEnv = clamp(u_audio_kick * 1.3, 0.0, 1.0);
    vec2 b0, b1, b2, b3;
    float pairSep;
    bodies(t, u_audio_bass, u_audio_mid, kickEnv,
           u_section_id, u_section_progress,
           b0, b1, b2, b3, pairSep);

    vec2 cw = cursorWorld(u_mouse, u_resolution, aspect);
    bool mouseActive = (cw.x < 1e3);

    // === Single field sample — gradient cached in .gb, |grad| in .a ===
    vec4 fS = texture(u_field_state, uv);
    float phi  = fS.x;
    vec2  grad = fS.yz;
    float gMag = fS.w;

    float magNarr = sectionMag(u_section_id, u_section_progress);

    // Field sample at each body center for spike amp.
    float phi0 = texture(u_field_state, b0 / vec2(aspect, 1.0) + 0.5).r;
    float phi1 = texture(u_field_state, b1 / vec2(aspect, 1.0) + 0.5).r;
    float phi2 = texture(u_field_state, b2 / vec2(aspect, 1.0) + 0.5).r;
    float phi3 = texture(u_field_state, b3 / vec2(aspect, 1.0) + 0.5).r;

    // Per-body slow rotation phases (distinct so bodies don't sync).
    float ph0 = u_time * 0.45;
    float ph1 = u_time * 0.51 + 1.3;
    float ph2 = u_time * 0.39 + 2.7;
    float ph3 = u_time * 0.62 + 4.1;

    // Dipole axes — each body biases spike density toward strongest neighbour.
    vec2 axis01 = normalize(b1 - b0 + vec2(1e-6));
    vec2 axis10 = -axis01;
    vec2 axis2  = normalize(0.5 * (b0 + b1) - b2 + vec2(1e-6));
    vec2 axis3  = normalize(0.5 * (b0 + b1) - b3 + vec2(1e-6));

    // Spike amp scaling — gated by sectionMag so dormant truly = no spikes.
    float ampScale = magNarr * (1.0 + 0.30 * u_downbeat + 0.18 * u_audio_high);

    float baseR = 0.092 + 0.012 * u_audio_high;
    float dB0 = bodySDF(p, b0, baseR,         ph0, axis01, phi0, ampScale);
    float dB1 = bodySDF(p, b1, baseR,         ph1, axis10, phi1, ampScale);
    float dB2 = bodySDF(p, b2, baseR * 0.84,  ph2, axis2,  phi2, ampScale);
    float dB3 = bodySDF(p, b3, baseR * 0.74,  ph3, axis3,  phi3, ampScale * 0.85);

    // Tidal smooth-min — k_inner spikes at periapsis (sep < 0.16) so the
    // binary visibly stretches into a peanut.
    float kInner = 0.020 + 0.080 * smoothstep(0.30, 0.10, pairSep)
                          + 0.030 * u_audio_bass;
    float dPair = opSmin(dB0, dB1, kInner);
    float d12   = opSmin(dPair, dB2, 0.020);
    float d     = opSmin(d12, dB3, 0.020);

    // Optional cursor-comet — adds a 5th body when cursor active.
    float dCur = 1e3;
    if (mouseActive) {
        // Soft small blob, no spikes, hot warm tint.
        dCur = length(p - cw) - (0.045 + 0.020 * u_audio_high);
        d = opSmin(d, dCur, 0.030);
    }

    // === COLOR ===
    vec3 sub      = vec3(0.018, 0.014, 0.011);   // very dark warm graphite
    vec3 ffDeep   = vec3(0.030, 0.024, 0.020);   // ferrofluid base
    vec3 ffWarm   = vec3(0.32, 0.14, 0.05);      // ember interior depth
    vec3 specHot  = vec3(1.55, 0.78, 0.22);      // sodium-orange spec tip
    vec3 col      = sub;

    // Identify owning body.
    float dn0 = length(p - b0);
    float dn1 = length(p - b1);
    float dn2 = length(p - b2);
    float dn3 = length(p - b3);
    int   own = 0;
    float dnMin = dn0;
    if (dn1 < dnMin) { own = 1; dnMin = dn1; }
    if (dn2 < dnMin) { own = 2; dnMin = dn2; }
    if (dn3 < dnMin) { own = 3; dnMin = dn3; }
    float ownPhi = (own == 0) ? phi0 : (own == 1) ? phi1
                  : (own == 2) ? phi2 : phi3;
    vec2  ownC   = (own == 0) ? b0 : (own == 1) ? b1
                  : (own == 2) ? b2 : b3;

    // === Background — single warm bloom keyed to phi, no shimmer ===
    // The flow-aligned hash version produced gradient-radial concentric
    // rings around the field source; replaced with a smooth dim warm
    // bloom that only registers when phi is meaningful.
    if (d > 0.0) {
        col += vec3(0.40, 0.20, 0.08) * pow(saturate(abs(phi) * 0.5), 1.6) * 0.35;
    }

    // === Ferrofluid SDF rendering ===
    // ZERO outside-the-silhouette glow. Rim is INSIDE only — no halo leak.
    if (d <= 0.0) {
        float depth = saturate(-d / (baseR * 1.2));
        // Dark steel base graded toward warm ember as we descend in.
        vec3 inner = mix(ffDeep, ffWarm, pow(depth, 0.55));

        // Specular pinpoint at "polished metal" angle (light from upper-left).
        vec2 dn2v = p - ownC;
        float specL = saturate(dot(normalize(dn2v + vec2(1e-6)),
                                   normalize(vec2(-0.55, 0.85))));
        inner += specHot * 0.55 * pow(specL, 8.0);

        // Spike-tip warm specular — appears ONLY where the rim is being
        // pushed outward by a spike, so the highlight tracks the spike peaks.
        float th = atan(dn2v.y, dn2v.x);
        vec2 axisOwn = (own == 0) ? axis01 : (own == 1) ? axis10
                       : (own == 2) ? axis2 : axis3;
        float profile = spikeProfile(th, (own == 0) ? ph0 : (own == 1) ? ph1
                                       : (own == 2) ? ph2 : ph3,
                                     axisOwn, 0.0);
        float spikeRim = exp(-pow((d + 0.004) / 0.005, 2.0));
        inner += specHot * profile * spikeRim
                          * saturate(magNarr * abs(ownPhi) * 1.8) * 1.4;

        // Cursor-comet override — pure warm so it reads "the input".
        if (mouseActive && dCur < 0.0) {
            float depthC = saturate(-dCur / 0.06);
            inner = mix(inner, mix(vec3(0.18, 0.07, 0.02),
                                    specHot * 0.55, pow(depthC, 0.4)),
                        0.85);
        }

        col = inner;
    }

    // === Tidal bridge ember thread — when binary is fused ===
    {
        float bridge = 1.0 - smoothstep(0.0, 0.18, pairSep);
        if (bridge > 0.001) {
            float dSeg = sdSegment(p, b0, b1);
            // Only along the inside-segment band; no halo outside SDF.
            float band = exp(-dSeg * dSeg * 280.0);
            // Clamp to inside-the-blob so it stays "inside the ferrofluid".
            float gate = smoothstep(0.005, -0.010, d);
            col += specHot * bridge * band * gate * (0.5 + u_audio_bass);
        }
    }

    // === Downbeat ring — kept narrow, fast falloff ===
    {
        float burstR = 0.05 + (1.0 - u_downbeat) * 0.55;
        float dr = abs(length(p) - burstR);
        col += vec3(0.95, 0.45, 0.14) * smoothstep(0.010, 0.0, dr)
                                       * u_downbeat * 0.70;
    }

    // === Keyboard glow — single warm gaussian per active key, at owning planet ===
    // Drops the per-pixel 15× sdSegment loop entirely. Each key contribution
    // is one exp() evaluated at the planet center.
    float keyAccum = 0.0;
    for (int i = 0; i < 15; i++) {
        keyAccum += u_key_event[i] * 0.65 + u_keys_visual[i] * 0.18;
    }
    if (keyAccum > 0.001) {
        // Glow at every body — simpler than per-key targeting and reads as
        // a unified pulse. Decays fast in space.
        float halo = exp(-dn0 * dn0 * 80.0)
                   + exp(-dn1 * dn1 * 80.0)
                   + exp(-dn2 * dn2 * 80.0)
                   + exp(-dn3 * dn3 * 80.0);
        col += vec3(1.0, 0.55, 0.22) * halo * keyAccum * 0.35;
    }

    // === Cursor warm halo (always-on tell when cursor is active) ===
    if (mouseActive && d > 0.0) {
        vec2 dM = p - cw;
        float halo = exp(-dot(dM, dM) * 28.0);
        col += vec3(1.05, 0.55, 0.24) * halo * 0.30;
    }

    // === Section-3 hush — desaturate during the 5s breakdown ===
    if (u_section_id == 3) {
        float lum = dot(col, vec3(0.30, 0.59, 0.11));
        col = mix(col, vec3(lum), 0.35 * (0.7 - 0.5 * abs(u_section_progress - 0.5)));
    }

    // === Tone + finish ===
    col = reinhardPartial(col, 4.5);
    float vig = smoothstep(1.55, 0.40, length(p));
    col *= mix(0.62, 1.0, vig);
    col = pow(col, vec3(0.92));
    col.r *= mix(0.96, 1.06, u_song_progress);
    col.b *= mix(1.04, 0.94, u_song_progress);

    fragColor = vec4(col, 1.0);
}
