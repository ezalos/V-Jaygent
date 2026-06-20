#version 300 es
// ABOUTME: eye-vortex — the SUBJECT. A Lamb-Oseen vortex of embered dust:
// ABOUTME: tangential velocity v_th=(G/2pi r)(1-exp(-r^2/rc^2)) winds a log-spiral
// ABOUTME: dust field; density via 6-step backward semi-Lagrangian pathline (no
// ABOUTME: u_history → no banding). Circulation G + core rc breathe with the song;
// ABOUTME: G->0,rc->0 shuts the eye in the hush. Cursor stirs a 2nd vortex; keys fire motes.
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_playing;
uniform float u_energy_smooth;
uniform float u_bar_phase;
uniform float u_downbeat;
uniform int   u_section_id;
uniform float u_section_progress;
uniform int   u_key_mode;
uniform float u_song_progress;
uniform float u_keys[15];
uniform float u_key_event[15];
out vec4 fragColor;

// ---- breathing globals (set in main, read by helpers via params) ----

// Lamb-Oseen tangential field around `c` + a small value-noise wobble (the
// curl TEXTURE on the spiral, sampled analytically so it doesn't grid-band).
vec2 velAt(vec2 q, vec2 eye, float G, float rc, vec2 mp, float mAmt,
           float t, float open) {
    vec2  d = q - eye;
    float r = max(length(d), 1e-3);
    float vth = (G / (TAU * r)) * (1.0 - exp(-(r * r) / (rc * rc)));
    vec2  v = vec2(-d.y, d.x) / r * vth;

    // Cursor's secondary vortex — the viewer stirs the dust.
    if (mAmt > 0.0) {
        vec2  dm = q - mp;
        float rm = max(length(dm), 1e-3);
        float vm = (mAmt * 0.42 / (TAU * rm)) * (1.0 - exp(-(rm * rm) / 0.05));
        v += vec2(-dm.y, dm.x) / rm * vm;
    }

    // Texture wobble (cheap value noise, not FBM → no finite-difference curl).
    float n1 = vnoise(q * 3.0 + vec2(0.0, t * 0.06));
    float n2 = vnoise(q * 3.0 + vec2(7.3, t * 0.06));
    v += (vec2(n1, n2) - 0.5) * 0.10 * (0.4 + 0.6 * open);
    return v;
}

// Log-spiral arms × rotating filament texture (in log-polar so it swirls).
float dustAt(vec2 q, vec2 eye, float rotation, float twist, float armN) {
    vec2  d = q - eye;
    float r = max(length(d), 1e-4);
    float a = atan(d.y, d.x);
    float sp   = a * armN + log(r) * twist - rotation;
    float arms = pow(0.5 + 0.5 * cos(sp), 1.7);
    float fil  = fbmRot(vec2(a * 1.5, log(r) * 2.2) * 1.3
                      + vec2(rotation * 0.20, -r * 1.5));
    fil = smoothstep(0.32, 0.92, fil);
    return arms * fil;
}

void main() {
    vec2  uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2  p = (uv - 0.5) * vec2(aspect, 1.0);

    float playing  = u_audio_playing;
    float E        = mix(0.36 + 0.20 * sin(u_time * 0.17), u_energy_smooth, playing);
    float openE    = smoothstep(0.10, 0.52, E);
    float deepHush = (playing > 0.5 && u_section_id == 2) ? 1.0 : 0.0;
    float open     = openE * mix(1.0, 0.35, deepHush);

    // Eye centre + cursor nudge (matches the other layers).
    vec2 eye = 0.06 * vec2(sin(u_time * 0.07), cos(u_time * 0.053));
    vec2 mp = vec2(1e4);
    float mAmt = 0.0;
    if (!vjMouseIdle(u_mouse)) {
        mp = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);
        mAmt = 1.0;
        eye += (mp - eye) * 0.08;   // the eye gently looks toward the viewer
    }

    // Vortex breath parameters.
    // Act II rebloom swells in over the section start (u_section_progress) so
    // the return blooms rather than snaps to full.
    float actII = (playing > 0.5 && u_section_id >= 3)
                ? smoothstep(0.0, 0.30, u_section_progress) : 0.0;
    float G     = mix(0.06, 1.15, open) + 0.25 * u_downbeat;     // circulation
    float rc    = mix(0.035, 0.20, open);                        // core radius
    float spin  = mix(0.12, 0.55, open);
    float rot   = u_time * spin + 0.15 * sin(u_bar_phase * TAU); // smooth per-bar nudge
    float twist = mix(2.5, 5.5, open) + 2.0 * u_song_progress    // Act II winds tighter
                + 0.8 * actII;
    float armN  = (playing > 0.5 && u_section_id >= 3) ? 3.0 : 2.0;  // integer: no atan seam

    // 6-step backward semi-Lagrangian pathline — the streak IS the motion blur,
    // recomputed each frame (no feedback state).
    vec2  q = p;
    float stepLen = 0.018 * (0.4 + 1.3 * open);
    float dens = 0.0, w = 0.0;
    for (int s = 0; s < 6; s++) {
        vec2 v = velAt(q, eye, G, rc, mp, mAmt, u_time, open);
        q -= v * stepLen;
        float wt = exp(-float(s) * 0.42);
        dens += wt * dustAt(q, eye, rot, twist, armN);
        w += wt;
    }
    dens /= w;

    // Radial envelope: 0 inside the pupil, fade at the outer edge.
    float r      = length(p - eye);
    float rPup   = mix(0.020, 0.165, open);
    float inner  = smoothstep(rPup * 0.7, rPup * 1.9, r);
    float outerR = mix(0.30, 0.64, open);
    float outer  = smoothstep(outerR, outerR * 0.5, r);
    dens *= inner * outer;

    // Brightness breathes with the SMOOTH energy envelope only. Driving it off
    // FFT bass made the dust flicker frame-to-frame (a "hush" should move
    // smoothly); bass registers rhythmically through the discrete downbeat
    // geometry (ring + circulation kick) instead, not as luminance strobe.
    float bright  = dens * (0.20 + 1.5 * openE) * (1.0 + 0.22 * actII);

    // Cursor heat — a local glow where the viewer stirs the dust.
    if (mAmt > 0.0) bright += 0.32 * vjCursorHeat(p, mp, 0.16) * (0.5 + 0.5 * open);

    // Keyboard motes — each held/pressed key throws a bright ember outward,
    // caught in the circulation.
    for (int i = 0; i < 15; i++) {
        float ke = u_keys[i], ev = u_key_event[i];
        if (ke < 0.01 && ev < 0.01) continue;
        float ang = float(i) / 15.0 * TAU + rot * 0.4;
        float rad = mix(rPup * 1.4, outerR * 0.95, 1.0 - ev);
        vec2  mc  = eye + vec2(cos(ang), sin(ang)) * rad;
        bright += smoothstep(0.022, 0.0, length(p - mc)) * (0.6 * ke + 0.95 * ev);
    }

    // Warm ramp: wine → rust → amber → cream; warmer with density, brightness,
    // and song progress (Act II creamier than Act I).
    float warmT = saturate(0.18 + 0.55 * dens + 0.30 * u_song_progress
                         + 0.20 * openE + 0.12 * actII);
    vec3 c0 = vec3(0.30, 0.05, 0.04);   // wine
    vec3 c1 = vec3(0.80, 0.26, 0.07);   // rust
    vec3 c2 = vec3(1.15, 0.60, 0.20);   // amber
    vec3 c3 = vec3(1.30, 1.02, 0.66);   // cream
    vec3 ramp = mix(mix(c0, c1, smoothstep(0.0, 0.4, warmT)),
                    mix(c2, c3, smoothstep(0.6, 1.0, warmT)),
                    smoothstep(0.35, 0.7, warmT));

    vec3 col = ramp * bright;

    fragColor = vec4(col, 1.0);
}
