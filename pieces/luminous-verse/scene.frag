// ABOUTME: HDR scene pass for "luminous-verse" — stroke-SDF lyric glyphs that
// ABOUTME: emit light; vocal stem lights the word, beat resolves/frays the type.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform int       u_frame;

uniform vec2  u_mouse;
uniform vec4  u_touches[8];
uniform int   u_touch_count;
uniform float u_keys_visual[15];
uniform float u_key_event[15];

uniform float u_audio_playing;
uniform float u_audio_bass;
uniform float u_audio_high;
uniform float u_beat_phase;
uniform float u_downbeat;
uniform int   u_bar_index;
uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_song_progress;
uniform float u_energy_smooth;
uniform float u_audio_vocals_stem;
uniform float u_audio_drums_stem;
uniform float u_audio_bass_stem;

#include "math.glsl"
#include "noise.glsl"

out vec4 fragColor;

// ---------------------------------------------------------------- glyphs ---
// Stroke skeletons in a 0..~0.7 x 0..1 em box. Light-writing, not type:
// each letter is a union of capsule segments the bloom will set on fire.
const int NSEG = 60;
const vec4 SEG[NSEG] = vec4[](
    // A (0..2)
    vec4(0.00,0.00,0.35,1.00), vec4(0.35,1.00,0.70,0.00), vec4(0.13,0.35,0.57,0.35),
    // D (3..8)
    vec4(0.00,0.00,0.00,1.00), vec4(0.00,1.00,0.45,1.00), vec4(0.45,1.00,0.65,0.72),
    vec4(0.65,0.72,0.65,0.28), vec4(0.65,0.28,0.45,0.00), vec4(0.45,0.00,0.00,0.00),
    // E (9..12)
    vec4(0.00,0.00,0.00,1.00), vec4(0.00,1.00,0.62,1.00), vec4(0.00,0.52,0.50,0.52),
    vec4(0.00,0.00,0.62,0.00),
    // G (13..17)
    vec4(0.65,1.00,0.00,1.00), vec4(0.00,1.00,0.00,0.00), vec4(0.00,0.00,0.65,0.00),
    vec4(0.65,0.00,0.65,0.48), vec4(0.65,0.48,0.34,0.48),
    // H (18..20)
    vec4(0.00,0.00,0.00,1.00), vec4(0.65,0.00,0.65,1.00), vec4(0.00,0.50,0.65,0.50),
    // I (21..23)
    vec4(0.32,0.00,0.32,1.00), vec4(0.10,1.00,0.54,1.00), vec4(0.10,0.00,0.54,0.00),
    // L (24..25)
    vec4(0.00,1.00,0.00,0.00), vec4(0.00,0.00,0.58,0.00),
    // M (26..29)
    vec4(0.00,0.00,0.00,1.00), vec4(0.00,1.00,0.35,0.42), vec4(0.35,0.42,0.70,1.00),
    vec4(0.70,1.00,0.70,0.00),
    // N (30..32)
    vec4(0.00,0.00,0.00,1.00), vec4(0.00,1.00,0.65,0.00), vec4(0.65,0.00,0.65,1.00),
    // O (33..36)
    vec4(0.00,0.00,0.00,1.00), vec4(0.00,1.00,0.65,1.00), vec4(0.65,1.00,0.65,0.00),
    vec4(0.65,0.00,0.00,0.00),
    // R (37..41)
    vec4(0.00,0.00,0.00,1.00), vec4(0.00,1.00,0.58,1.00), vec4(0.58,1.00,0.58,0.55),
    vec4(0.58,0.55,0.00,0.52), vec4(0.22,0.52,0.65,0.00),
    // S (42..46)
    vec4(0.62,1.00,0.00,1.00), vec4(0.00,1.00,0.00,0.54), vec4(0.00,0.54,0.62,0.50),
    vec4(0.62,0.50,0.62,0.00), vec4(0.62,0.00,0.00,0.00),
    // T (47..48)
    vec4(0.00,1.00,0.70,1.00), vec4(0.35,1.00,0.35,0.00),
    // U (49..51)
    vec4(0.00,1.00,0.00,0.00), vec4(0.00,0.00,0.65,0.00), vec4(0.65,0.00,0.65,1.00),
    // W (52..55)
    vec4(0.00,1.00,0.16,0.00), vec4(0.16,0.00,0.35,0.62), vec4(0.35,0.62,0.54,0.00),
    vec4(0.54,0.00,0.70,1.00),
    // Y (56..58)
    vec4(0.00,1.00,0.35,0.52), vec4(0.70,1.00,0.35,0.52), vec4(0.35,0.52,0.35,0.00),
    // ' (59)
    vec4(0.10,1.00,0.16,0.80)
);
// glyph ids: A0 D1 E2 G3 H4 I5 L6 M7 N8 O9 R10 S11 T12 U13 W14 Y15 '16
const int   GOFF[17] = int[](0,3,9,13,18,21,24,26,30,33,37,42,47,49,52,56,59);
const int   GCNT[17] = int[](3,6,4,5,3,3,2,4,3,4,5,5,2,3,4,3,1);
const float GW[17]   = float[](0.70,0.65,0.62,0.65,0.65,0.64,0.58,0.70,0.65,0.65,
                               0.65,0.62,0.70,0.65,0.70,0.70,0.26);

const int MAXLEN = 10;

// word index -> glyph at position (space = -1, end = -2)
int glyphAt(int w, int i) {
    if (w == 0) {        // ALONE
        int g[5] = int[](0,6,9,8,2); return i < 5 ? g[i] : -2;
    } else if (w == 1) { // RETROGRADE
        int g[10] = int[](10,2,12,10,9,3,10,0,1,2); return i < 10 ? g[i] : -2;
    } else if (w == 2) { // SUDDENLY
        int g[8] = int[](11,13,1,1,2,8,6,15); return i < 8 ? g[i] : -2;
    } else if (w == 3) { // I'M HIT
        int g[7] = int[](5,16,7,-1,4,5,12); return i < 7 ? g[i] : -2;
    } else if (w == 4) { // ALONE NOW
        int g[9] = int[](0,6,9,8,2,-1,8,9,14); return i < 9 ? g[i] : -2;
    }
    return -2;           // w < 0: the hum (no word)
}

float capsule(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

void main() {
    vec2 uv  = gl_FragCoord.xy / u_resolution;
    vec2 asp = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 p   = uv * asp;

    float play = u_audio_playing;

    // Idle metronome: phantom beat/bar so the type keeps breathing unplugged.
    float beatPh = mix(fract(u_time / 0.70), u_beat_phase, play);
    int   barIdx = play > 0.5 ? u_bar_index : int(u_time / 2.8);
    float vocals = mix(0.35 + 0.25 * sin(u_time * 0.5), u_audio_vocals_stem, play);
    float energy = mix(0.35, u_energy_smooth, play);

    // --- which fragment of the lyric is lit (wired to the section map in
    // meta notes; defensive: silence and unknown sections fall to the hum).
    int sec  = u_section_id;
    int word = -1;                              // the hum
    if (play > 0.5) {
        if      (sec == 1) word = 0;            // ALONE      (verse 1)
        else if (sec == 2) word = 1;            // RETROGRADE (build)
        else if (sec == 3) word = 2;            // SUDDENLY   (pre-drop)
        else if (sec == 4) word = 3;            // I'M HIT    (the synth wall)
        else if (sec == 5) word = 4;            // ALONE NOW  (comedown)
        // sec 0 and >= 6: the hum — the voice before and after the words
    } else {
        word = (int(u_time / 9.0) % 6) - 1;     // idle: slow word cycle + hum
    }

    // --- accent hue: ONE family, drifting amber -> rose across the song.
    vec3 cream  = vec3(1.00, 0.96, 0.88);
    vec3 accent = mix(vec3(1.00, 0.62, 0.22),  // amber
                      vec3(1.00, 0.36, 0.38),  // rose
                      0.5 + 0.5 * sin(u_song_progress * 2.6 - 1.2));

    // --- type resolve/fray: crisp on the downbeat and under the voice,
    // fraying as the beat decays and the voice withdraws.
    float crisp = clamp(0.55 * exp(-beatPh * 3.0) + 1.1 * vocals
                  + 0.35 * u_downbeat, 0.0, 1.0);
    float erode = mix(0.030, 0.004, crisp);

    vec3 col = vec3(0.0);

    // faint warm fog so the dark is never void
    col += accent * 0.012
         * (0.6 + 0.4 * fbmRot(p * 1.7 + vec2(u_time * 0.013, -u_time * 0.009)));

    if (word < 0) {
        // ----------------------------------------------------------- hum ---
        // The voice before it becomes words: a horizontal filament whose
        // undulation IS the vocal stem.
        float wob = fbmRot(vec2(p.x * 2.6 + u_time * 0.11, u_time * 0.05)) - 0.5;
        float y0  = 0.5 + wob * (0.06 + 0.30 * vocals);
        float sd  = abs(p.y - y0) - 0.0025;
        sd += (fbmRot(p * 9.0 + u_time * 0.23) - 0.5) * erode * 0.5;
        float edge = exp(-max(sd, 0.0) * 90.0);
        float core = exp(-max(sd, 0.0) * 380.0);
        float drive = 0.35 + 1.3 * vocals + 0.4 * u_audio_bass_stem;
        col += accent * edge * drive * 1.1 + cream * core * drive * 2.6;
    } else {
        // ---------------------------------------------------------- word ---
        // layout: measure, scale to ~64% of width, centre
        float wsum = 0.0;
        int   len  = 0;
        for (int i = 0; i < MAXLEN; i++) {
            int g = glyphAt(word, i);
            if (g == -2) break;
            wsum += (g == -1 ? 0.46 : GW[g]) + 0.34;
            len = i + 1;
        }
        wsum -= 0.34;
        float S  = min(0.64 * asp.x / max(wsum, 1e-3), 0.30);
        float ox = 0.5 * (asp.x - wsum * S);
        float oy = 0.5 - 0.5 * S;

        float beatSweep = fract(beatPh) * float(len);   // glint runs the word

        float ox_i = ox;
        for (int i = 0; i < MAXLEN; i++) {
            int g = glyphAt(word, i);
            if (g == -2) break;
            float adv = (g == -1 ? 0.46 : GW[g]) + 0.34;
            if (g >= 0) {
                vec2 q = (p - vec2(ox_i, oy)) / S;
                if (q.x > -0.45 && q.x < GW[g] + 0.45 && q.y > -0.5 && q.y < 1.5) {
                    float d = 1e3;
                    for (int s = 0; s < 6; s++) {
                        if (s >= GCNT[g]) break;
                        vec4 sg = SEG[GOFF[g] + s];
                        d = min(d, capsule(q, sg.xy, sg.zw));
                    }
                    float sd = d * S - 0.0065;
                    // fray: noise EATS the stroke as the beat decays (biased
                    // positive — burning out, not swelling into the neighbour)
                    sd += (fbmRot(q * 5.0 + vec2(float(i) * 3.7, u_time * 0.31))
                           - 0.32) * erode;

                    // cursor: grow + roughen the letters near the pointer
                    if (dot(u_mouse, u_mouse) > 1.0) {
                        vec2 mp = u_mouse / u_resolution * asp;
                        float mf = exp(-dot(p - mp, p - mp) / 0.014);
                        sd -= 0.011 * mf;
                        sd += (vnoise(p * 40.0 + u_time * 2.0) - 0.5) * 0.02 * mf;
                    }
                    for (int t = 0; t < 8; t++) {
                        if (t >= u_touch_count) break;
                        if (u_touches[t].w < 0.5) continue;
                        vec2 tp = u_touches[t].xy / u_resolution * asp;
                        float tf = exp(-dot(p - tp, p - tp) / 0.014);
                        sd -= 0.011 * tf;
                    }

                    // per-letter drive: vocal lights the word; a glint runs
                    // letter-to-letter each beat; keys flare their letter.
                    float glint = exp(-abs(float(i) - beatSweep) * 1.4);
                    float kdrv  = 0.0;
                    for (int k = 0; k < 15; k++) {
                        if (k % max(len, 1) != i) continue;
                        kdrv += u_keys_visual[k] + u_key_event[k] * 1.5;
                    }
                    float drive = 0.30 + 1.5 * vocals + 0.45 * glint
                                + 0.8 * u_downbeat + 1.2 * kdrv;

                    // plasma flowing through the stroke core
                    float flow = 0.6 + 0.4
                               * fbmRot(q * 2.3 + vec2(u_time * 0.9, float(i) * 1.3
                                        - u_time * 0.35));
                    float edge = exp(-max(sd, 0.0) * (70.0 - 22.0 * u_audio_bass_stem));
                    float core = exp(-max(sd, 0.0) * 340.0);
                    vec3  hue  = mix(accent, cream, 0.35 + 0.45 * kdrv);
                    col += hue   * edge * drive * 0.85
                         + cream * core * drive * flow * 3.2;
                }
            }
            ox_i += adv * S;
        }
    }

    // sub-beat shimmer over everything emissive (high stem) — 2D phase so it
    // reads as air-flicker, not vertical banding in the wide halos
    col *= 1.0 + 0.04 * (0.3 + u_audio_high)
               * sin(u_time * 23.0 + p.x * 31.0 + p.y * 17.0);

    fragColor = vec4(col, 1.0);
}
