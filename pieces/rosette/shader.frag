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
    // Section progress amplifies the bass push — late in a section the
    // build pushes n harder, so the drop lands as a snap to a fuller
    // rosette than the same level mid-verse would produce. Geometric
    // pre-tension into the next section.
    float n_audio = 3.0
                  + 5.0 * u_audio_level
                  + 2.0 * u_downbeat
                  + 1.5 * u_audio_bass_stem
                  + 1.8 * u_section_progress * u_audio_level;
    float n_target = (n_key >= 3) ? float(n_key) : n_audio;
    int n = int(clamp(floor(n_target + 0.5), 3.0, 11.0));
    float fn = float(n);

    // --- Newton iteration: z ← z − (z^n − 1) / (n · z^(n−1)) ---
    // z^(n−1) by iterated multiplication; z^n = z^(n−1) · z. 36-iter
    // cap with early-out on convergence. The classification step
    // below identifies which root of unity z reached.
    vec2 z = p;
    float iter = 0.0;
    bool conv = false;
    for (int it = 0; it < 36; it++) {
        vec2 zp = vec2(1.0, 0.0);          // accumulator, z^0
        for (int j = 0; j < 11; j++) {
            if (j >= n - 1) break;
            zp = cmul(zp, z);
        }
        vec2 zn  = cmul(zp, z);             // z^n
        vec2 num = zn - vec2(1.0, 0.0);
        vec2 den = fn * zp;
        vec2 stepv = cdiv(num, den);
        z -= stepv;
        iter += 1.0;
        if (dot(stepv, stepv) < 3e-6) { conv = true; break; }
    }

    // --- classify: nearest root of unity (angle 2π·k/n) ---
    float a = (dot(z, z) > 1e-10) ? atan(z.y, z.x) : 0.0;
    float k_frac = a * fn / TAU + fn;       // shift positive for mod
    int hit = int(mod(floor(k_frac + 0.5), fn));

    vec3 col;
    if (!conv) {
        col = vec3(0.018, 0.012, 0.020);    // rare non-converged: near-black
    } else {
        // basin hue rotates by u_bar_phase / n per bar (geometric phase-
        // lock at the bar). A per-section offset (u_section_id) jumps
        // the palette base on section boundaries — each section feels
        // visibly different. Slow u_song_progress drift carries an arc
        // across the whole 8-min piece.
        float global_hue = 0.07 * float(u_section_id) + 0.18 * u_song_progress;
        float hueT = mod(float(hit) / fn + u_bar_phase / fn + global_hue, 1.0);
        hueT = mix(0.32, 0.93, hueT);
        // brightness: fast convergence = bright lake interior; slow
        // = dark bead-chain at the Wada boundary.
        float cap = smoothstep(0.0, 1.0, 1.0 - iter / 36.0);
        col = warmRamp(hueT) * (0.34 + 0.78 * cap);
    }

    // beat pulse: luminance briefly brightens on each beat
    col *= 0.85 + 0.18 * exp(-u_beat_phase * 6.0);

    // sub-beat shimmer — high frequencies feed the surface ripple
    float sh = (vnoise(p * 30.0 + u_time * 5.5) - 0.5)
             * 0.10 * (0.5 + 0.8 * u_audio_high);

    col = max(col + vec3(sh), vec3(0.0));
    fragColor = vec4(reinhard(col), 1.0);
}
