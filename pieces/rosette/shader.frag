// ABOUTME: rosette — Newton fractal on z^n − 1, integer n quantized from music.
// ABOUTME: n basins on the unit circle; the rosette unfolds petals as the song builds.
#version 300 es
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "interaction.glsl"
#include "tonemap.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_level;
uniform float u_audio_high;
uniform float u_audio_bass_stem;
uniform float u_downbeat;
uniform float u_bar_phase;
uniform float u_beat_phase;
uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_song_progress;
uniform float u_keys[15];
uniform float u_key_event[15];

out vec4 fragColor;

// Warm ramp: near-black → wine → ember → amber → gold → cream.
vec3 warmRamp(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.020, 0.012, 0.022);
    vec3 c1 = vec3(0.34, 0.07, 0.12);
    vec3 c2 = vec3(0.78, 0.21, 0.08);
    vec3 c3 = vec3(0.97, 0.46, 0.13);
    vec3 c4 = vec3(1.00, 0.76, 0.34);
    vec3 c5 = vec3(1.00, 0.96, 0.86);
    float s = t * 5.0;
    if (s < 1.0) return mix(c0, c1, s);
    if (s < 2.0) return mix(c1, c2, s - 1.0);
    if (s < 3.0) return mix(c2, c3, s - 2.0);
    if (s < 4.0) return mix(c3, c4, s - 3.0);
    return mix(c4, c5, s - 4.0);
}

// cmul, cconj, cmod2 come from lib/math.glsl. cdiv is a thin wrapper.
vec2 cdiv(vec2 a, vec2 b) { return cmul(a, cconj(b)) / max(cmod2(b), 1e-12); }

void main() {
    vec2 res = u_resolution;
    vec2 p = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y) * 2.4;

    // cursor pan — view scrolls through the complex plane
    vec2 mw = vjMouseWorldOrZero(u_mouse, res);
    p += mw * 0.7;

    // --- audio-driven n; keyboard override ---
    // Each of 15 keys picks an n in {3..17, clamped to 11}; if any
    // key is the strongest input, it overrides the audio. Disjoint
    // channels per the dual-input recipe.
    int n_key = -1;
    float key_w_max = 0.10;
    for (int k = 0; k < 15; k++) {
        float w = max(u_keys[k], 0.85 * u_key_event[k]);
        if (w > key_w_max) {
            key_w_max = w;
            n_key = k + 3;
        }
    }
    // n changes on the SECTION timescale (slow + structural), not per
    // beat — Louis 2026-05-25 flagged the per-beat snaps as flickering
    // ("too fast and really flickering, the human eye do not have time
    // to see and appreciate them"). Per-section base + smooth ramp
    // through the section + bass-stem contribution + a small (±0.25)
    // beat wobble so the beat is felt as a fine pulse on n, not a cut.
    // u_audio_level (FFT, noisy) no longer drives n — too jittery.
    float n_section_base = 3.0 + 0.75 * float(u_section_id);
    float n_section_ramp = 1.8 * u_section_progress;
    float n_bass         = 1.5 * u_audio_bass_stem;
    float n_beat_wobble  = 0.25 * sin(u_beat_phase * TAU);
    float n_audio = n_section_base + n_section_ramp + n_bass + n_beat_wobble;
    float n_target = (n_key >= 3) ? float(n_key) : n_audio;
    // n is FLOAT — the fractal morphs CONTINUOUSLY between integer-n
    // topologies instead of cutting (Louis 2026-05-25: v2 looked like a
    // slideshow between snaps). Classification still rounds to int for
    // the basin id / hue. The +2 downbeat now reads as a smooth bump
    // not a hard snap; rhythm-locked but morphing.
    float n = clamp(n_target, 3.0, 10.0);
    int   n_int = int(round(n));
    float fn_int = float(n_int);

    // --- continuous motion between events
    // (per feedback_three_timescales_of_liveness) ---
    // Slow u_time drift + per-bar advancement + beat-locked wobble:
    // the rosette ALWAYS rotates, even when n is steady. Three
    // timescales of rotation stacked.
    float rotAng = u_time * 0.18
                 + 0.10 * u_bar_phase * TAU
                 + 0.20 * sin(u_beat_phase * TAU);
    mat2 R = mat2(cos(rotAng), -sin(rotAng), sin(rotAng), cos(rotAng));
    // Beat zoom-pulse: subtle zoom-in on each beat onset, decays.
    // u_audio_level slightly pulls back so loud sections feel wider.
    float zoom = 1.0 + 0.08 * exp(-u_beat_phase * 5.0)
                     - 0.04 * u_audio_level;

    // --- Newton on z^n − 1 with FLOAT n via complex pow.
    // z^n = |z|^n · (cos(n·arg z) + i·sin(n·arg z)). 36-iter cap with
    // early-out on convergence. pow() is cheaper than the n-1 cmul loop
    // for n ≥ 4; trades a small principal-branch cut artifact along the
    // negative real axis for continuous-n morphing across the whole
    // dynamic range.
    vec2 z = R * (p / zoom);
    float iter = 0.0;
    bool conv = false;
    for (int it = 0; it < 36; it++) {
        float r = length(z);
        if (r < 1e-10) { conv = true; break; }   // avoid log(0)
        float a = atan(z.y, z.x);
        float rn   = pow(r, n);
        float rnm1 = pow(r, n - 1.0);
        vec2  zn   = rn   * vec2(cos(n * a),        sin(n * a));
        vec2  znm1 = rnm1 * vec2(cos((n - 1.0) * a), sin((n - 1.0) * a));
        vec2  num  = zn - vec2(1.0, 0.0);
        vec2  den  = n * znm1;
        vec2  stepv = cdiv(num, den);
        z -= stepv;
        iter += 1.0;
        if (dot(stepv, stepv) < 3e-6) { conv = true; break; }
    }

    // --- classify: nearest root of unity (using rounded integer n) ---
    float a_final = (dot(z, z) > 1e-10) ? atan(z.y, z.x) : 0.0;
    float k_frac = a_final * fn_int / TAU + fn_int;
    int hit = int(mod(floor(k_frac + 0.5), fn_int));

    vec3 col;
    if (!conv) {
        col = vec3(0.018, 0.012, 0.020);    // rare non-converged: near-black
    } else {
        // Colours respond to music on multiple scales: u_section_id jumps
        // the base each section, u_song_progress carries a slow arc,
        // u_audio_bass_stem pumps the palette toward the warmer end on
        // bass hits, beat wobble adds a fine hue jitter. (Louis 2026-
        // 05-25: "work on the colors themselves, making the colors
        // change linked to the music would be great".)
        float global_hue = 0.07 * float(u_section_id)
                         + 0.18 * u_song_progress
                         + 0.20 * u_audio_bass_stem
                         + 0.04 * sin(u_beat_phase * TAU);
        float hueT = mod(float(hit) / fn_int + u_bar_phase / fn_int + global_hue, 1.0);
        hueT = mix(0.32, 0.93, hueT);
        // brightness: fast convergence = bright lake interior; slow
        // = dark bead-chain at the Wada boundary.
        float cap = smoothstep(0.0, 1.0, 1.0 - iter / 36.0);
        col = warmRamp(hueT) * (0.34 + 0.78 * cap);
    }

    // beat pulse: luminance briefly brightens on each beat
    col *= 0.85 + 0.18 * exp(-u_beat_phase * 6.0);

    // --- downbeat sonar ring (the "one more layer" Louis flagged) ---
    // A cream ring expands from the rosette's centre once per bar,
    // riding u_bar_phase. Concentric with the rosette's radial
    // structure so it harmonises rather than competes. Provides a
    // clear, rhythmic geometric event between the slower n changes.
    float r_world = length(p / zoom);
    float ringR = u_bar_phase * 2.6;
    float q_ring = (r_world - ringR) * 9.0;
    float ring = exp(-q_ring * q_ring) * (1.0 - u_bar_phase) * 0.55;
    col += warmRamp(0.96) * ring;

    // sub-beat shimmer — high frequencies feed the surface ripple
    float sh = (vnoise(p * 30.0 + u_time * 5.5) - 0.5)
             * 0.10 * (0.5 + 0.8 * u_audio_high);

    col = max(col + vec3(sh), vec3(0.0));
    fragColor = vec4(reinhard(col), 1.0);
}
