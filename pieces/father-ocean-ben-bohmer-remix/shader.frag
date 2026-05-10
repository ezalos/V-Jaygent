// ABOUTME: Display — three ferrofluid planets orbiting under gravity, surfaces erupt with
// ABOUTME: Rosensweig spikes scaled by sim_field's magnetic potential. Sachiko-Kodama palette.
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
uniform float u_beat_phase;
uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_song_progress;
uniform float u_keys[15];
uniform float u_keys_visual[15];
uniform float u_key_event[15];
uniform sampler2D u_field_state;

out vec4 fragColor;

// Closed-form orbits — IDENTICAL to sim_field.frag. Keep these in lockstep.
void planets(float t, float audioMid,
             out vec2 p0, out vec2 p1, out vec2 p2) {
    vec2 pairC = vec2(0.18 * cos(t * 0.063), 0.13 * sin(t * 0.087));
    float ang0 = TAU * t / 31.0 + audioMid * 0.18;
    float r0   = 0.20 + 0.16 * sin(ang0);
    vec2 off   = r0 * vec2(cos(ang0), sin(ang0));
    p0 = pairC + off;
    p1 = pairC - off;
    float ang2 = TAU * t / 73.0 + 0.4 + audioMid * 0.10;
    float r2   = 0.78 + 0.10 * sin(ang2 * 0.5);
    p2 = vec2(r2 * cos(ang2), r2 * 0.42 * sin(ang2));
}

// Section magnetism — must match sim_field.frag::sectionMag exactly.
// Used to gate the spike amp so dormant sections truly read as smooth.
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

// === Field sampling helpers ===
// The field texture is the previous-pass output at half-res of the canvas.
float fieldPhi(vec2 uvF) {
    return texture(u_field_state, clamp(uvF, vec2(0.001), vec2(0.999))).r;
}

vec3 fieldSample(vec2 uvF, vec2 fTexel) {
    float c  = fieldPhi(uvF);
    float xN = fieldPhi(uvF + vec2(0.0,  fTexel.y));
    float xS = fieldPhi(uvF + vec2(0.0, -fTexel.y));
    float xE = fieldPhi(uvF + vec2( fTexel.x, 0.0));
    float xW = fieldPhi(uvF + vec2(-fTexel.x, 0.0));
    return vec3(c, (xE - xW) * 0.5, (xN - xS) * 0.5);
}

// === Per-planet spike profile ===
// θ-space sin lattice with domain warp + dipole-axis bias toward neighbour.
// Returns [0, 1] amp envelope around the planet rim at angle theta.
float spikeProfile(float theta, float planetPhase, vec2 dipoleAxis,
                   vec2 worldP, float warpAmt) {
    float warp = warpAmt * (fbm(worldP * 3.7 + vec2(u_time * 0.21, 0.0)) - 0.5);
    float lattice = sin(theta * 14.0 + planetPhase + warp * 2.4);
    lattice = max(0.0, lattice);
    lattice = pow(lattice, 1.7);
    vec2 dirOnRim = vec2(cos(theta), sin(theta));
    float bias = 0.55 + 0.65 * pow(max(0.0, dot(dirOnRim, dipoleAxis)), 2.0);
    return lattice * bias;
}

// Per-planet local SDF including spike displacement at this pixel.
float planetSDF(vec2 p, vec2 center, float baseR,
                float planetPhase, vec2 dipoleAxis,
                float fieldAtCenter, float spikeAmpScale) {
    vec2 d = p - center;
    float r = length(d);
    float th = atan(d.y, d.x);
    float amp = saturate(abs(fieldAtCenter) * 1.4 - 0.04) * spikeAmpScale;
    float profile = spikeProfile(th, planetPhase, dipoleAxis, p, amp * 8.0);
    float Reff = baseR + profile * amp * 0.085;
    return r - Reff;
}

vec2 worldToFieldUV(vec2 wp, float aspect) {
    return wp / vec2(aspect, 1.0) + 0.5;
}

vec2 keyXY(int i) {
    float halfPositions[6] = float[6](0.5, 1.5, 3.5, 4.5, 5.5, 7.5);
    bool isBlack = (i >= 9);
    float pos = isBlack ? halfPositions[i - 9] : float(i);
    float kx = (pos / 8.0 - 0.5) * 1.55;
    float ky = isBlack ? -0.78 : -0.92;
    return vec2(kx, ky);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
    float t = u_time;

    // === Orbits ===
    vec2 c0, c1, c2;
    planets(t, u_audio_mid, c0, c1, c2);
    float pairSep = length(c0 - c1);

    // === Field sample at this pixel ===
    vec2 fTexel = 1.0 / (u_resolution * 0.5);
    vec2 fUV    = worldToFieldUV(p, aspect);
    vec3 fS     = fieldSample(fUV, fTexel);
    float phi   = fS.x;
    vec2  grad  = fS.yz;
    float gMag  = length(grad);

    // Field at each planet center for spike amp.
    float phi0 = fieldPhi(worldToFieldUV(c0, aspect));
    float phi1 = fieldPhi(worldToFieldUV(c1, aspect));
    float phi2 = fieldPhi(worldToFieldUV(c2, aspect));

    // Per-planet phase (slow rotation, distinct per body).
    float ph0 = u_time * 0.45;
    float ph1 = u_time * 0.51 + 1.3;
    float ph2 = u_time * 0.39 + 2.7;

    // Dipole axes — each planet biases its spike density toward its strongest
    // neighbour. p0 ↔ p1 attract each other; p2 biases inward.
    vec2 axis01 = normalize(c1 - c0 + vec2(1e-6));
    vec2 axis10 = -axis01;
    vec2 axis2c = normalize((0.5 * (c0 + c1) - c2) + vec2(1e-6));

    // Gate spike amp by sectionMag — dormant sections collapse to smooth blobs;
    // peak section punches through to full-Rosensweig.
    float magNarr  = sectionMag(u_section_id, u_section_progress);
    float ampScale = magNarr * (1.0 + 0.25 * u_downbeat + 0.15 * u_audio_high);

    // Per-planet SDFs.
    float baseR = 0.105 + 0.014 * u_audio_high;
    float d0 = planetSDF(p, c0, baseR,        ph0, axis01, phi0, ampScale);
    float d1 = planetSDF(p, c1, baseR,        ph1, axis10, phi1, ampScale);
    float d2 = planetSDF(p, c2, baseR * 0.78, ph2, axis2c, phi2, ampScale);

    // === Smooth-min — tidal bridge between p0/p1 at periapsis ===
    float kInner = 0.018 + 0.090 * smoothstep(0.30, 0.12, pairSep)
                          + 0.040 * u_audio_bass;
    float kOuter = 0.020;
    float dPair = opSmin(d0, d1, kInner);
    float d     = opSmin(dPair, d2, kOuter);

    // Identify which planet "owns" this pixel (for warm interior tint).
    float dn0 = length(p - c0);
    float dn1 = length(p - c1);
    float dn2 = length(p - c2);
    int   own = 0;
    if (dn1 < dn0 && dn1 < dn2) own = 1;
    else if (dn2 < dn0 && dn2 < dn1) own = 2;
    float ownPhi = (own == 0) ? phi0 : (own == 1) ? phi1 : phi2;
    vec2  ownC   = (own == 0) ? c0   : (own == 1) ? c1   : c2;

    // === COLOR ===
    vec3 sub      = vec3(0.022, 0.018, 0.014);
    vec3 ffDark   = vec3(0.040, 0.034, 0.028);
    vec3 ffWarm   = vec3(0.42, 0.20, 0.07);
    vec3 rimHot   = vec3(1.55, 0.78, 0.22);
    vec3 streamGd = vec3(0.95, 0.55, 0.18);
    vec3 col      = sub;

    // === Background — field streamers + warm field bloom ===
    {
        float gAng   = atan(grad.y, grad.x + 1e-6);
        vec2  pAlong = rot2d(-gAng) * (p * 4.0);
        float fil    = fbm(pAlong + vec2(u_time * 0.18, 0.0));
        fil = pow(saturate(fil * 1.4 - 0.40), 1.4);
        float fldStrength = pow(saturate(gMag * 18.0), 1.5);
        col += streamGd * fil * fldStrength * 0.55;
        col += streamGd * 0.18 * pow(saturate(abs(phi) * 0.7), 1.4);
    }

    // === Ferrofluid SDF rendering ===
    // Tighter rim — base width small (0.008) so smooth blobs stay smooth;
    // expansion gated by spike-amp scale, not raw |ownPhi|, so the rim only
    // spreads when the planet is genuinely erupting.
    float rimWidth = 0.008 + 0.016 * saturate(magNarr * abs(ownPhi) * 1.5);
    float rimGlow  = exp(-pow(d / rimWidth, 2.0));
    float tilt     = 0.5 + 0.5 * grad.y / (gMag + 1e-3);
    vec3  rimCol   = mix(rimHot, vec3(1.20, 0.42, 0.10), tilt);

    if (d > 0.0) {
        col += rimCol * rimGlow * (0.32 + 0.55 * saturate(magNarr * abs(ownPhi)));
    } else {
        float depth = saturate(-d / (baseR * 1.3));
        float hPlanet = (own == 0) ? 0.0 : (own == 1 ? 0.04 : -0.06);
        vec3 inner = mix(ffDark, ffWarm, pow(depth, 0.7) * (0.65 + hPlanet));
        vec2 dn2v = p - ownC;
        float specL = saturate(dot(normalize(dn2v + vec2(1e-6)),
                                   normalize(vec2(-0.6, 0.85))));
        inner += vec3(0.78, 0.36, 0.10) * pow(specL, 5.5) * 0.65;
        float erupt = exp(-pow(d / 0.018, 2.0)) * saturate(abs(ownPhi));
        inner += rimCol * 0.42 * erupt;
        col = inner;
        col += rimCol * exp(-pow((d + 0.004) / 0.006, 2.0)) * 0.30;
    }

    // === Tidal bridge — when planets fuse, segment glows ember ===
    {
        float bridge = 1.0 - smoothstep(0.0, 0.22, pairSep);
        float dSeg = sdSegment(p, c0, c1);
        col += rimHot * bridge * exp(-dSeg * dSeg * 220.0) * 0.50
                       * (0.6 + u_audio_bass);
    }

    // === Downbeat ring ===
    {
        float burstR = 0.06 + (1.0 - u_downbeat) * 0.55;
        float dr = abs(length(p) - burstR);
        col += vec3(1.10, 0.55, 0.18) * smoothstep(0.014, 0.0, dr) * u_downbeat * 0.78;
    }

    // === Cursor halo (always-on warm tell) ===
    bool mouseIdle = (u_mouse.x == 0.0 && u_mouse.y == 0.0);
    if (!mouseIdle) {
        vec2 mP = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);
        vec2 dM = p - mP;
        float halo = exp(-dot(dM, dM) * 36.0);
        col += vec3(1.15, 0.62, 0.30) * halo * 0.45;
    }

    // === Keyboard glow rays — line from key x to its planet ===
    for (int i = 0; i < 15; i++) {
        int sel = int(mod(float(i), 3.0));
        vec2 cTarget = (sel == 0) ? c0 : (sel == 1) ? c1 : c2;
        vec2 kp = keyXY(i);
        float dSeg = sdSegment(p, kp, cTarget);
        bool isBlack = (i >= 9);
        vec3 kColor = isBlack
            ? vec3(0.55, 0.32, 0.18)
            : vec3(1.05, 0.62, 0.24);
        float intensity = 0.65 * u_key_event[i] + 0.18 * u_keys_visual[i];
        col += kColor * smoothstep(0.012, 0.0, dSeg) * intensity;
    }

    // === Section-3 hush tell — desaturate during the breakdown ===
    if (u_section_id == 3) {
        float lum = dot(col, vec3(0.30, 0.59, 0.11));
        col = mix(col, vec3(lum), 0.30 * (0.7 - 0.5 * abs(u_section_progress - 0.5)));
    }

    // === Tone + finish ===
    col *= 1.05;
    col = reinhardPartial(col, 4.5);
    float vig = smoothstep(1.55, 0.40, length(p));
    col *= mix(0.62, 1.0, vig);
    col = pow(col, vec3(0.92));
    col.r *= mix(0.96, 1.06, u_song_progress);
    col.b *= mix(1.04, 0.94, u_song_progress);

    fragColor = vec4(col, 1.0);
}
