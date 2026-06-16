#version 300 es
// ABOUTME: Invisible data layer — sums all circular wave sources once and
// ABOUTME: publishes encoded (gradient-dir, height-level, slope) as `wave`.
precision highp float;

#include "math.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_level;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_playing;
uniform float u_bpm;
uniform float u_downbeat;
uniform float u_energy_smooth;
uniform float u_section_id;
uniform float u_section_progress;
uniform float u_to_section_change;
uniform float u_song_progress;
uniform float u_keys[15];
uniform float u_key_event[15];

out vec4 fragColor;

// black-key spatial half-positions (between adjacent whites)
const float HALFPOS[6] = float[6](0.5, 1.5, 3.5, 4.5, 5.5, 7.5);

// Accumulate one circular source into height h and gradient g.
// term = A * sin(kk*r - om*t + ph) / (1 + FALL*r)
void addSource(vec2 p, vec2 s, float A, float kk, float om, float ph,
               float t, inout float h, inout vec2 g) {
    vec2  d = p - s;
    float r = max(length(d), 1e-3);
    float fall = 1.0 / (1.0 + 1.1 * r);
    float arg = kk * r - om * t + ph;
    h += A * sin(arg) * fall;
    // dominant crest-normal term: A*kk*cos(arg)*dir*fall
    g += A * kk * cos(arg) * (d / r) * fall;
}

// Accumulate a plane wave (linear traveling BANDS — a categorically
// different vocabulary from the circular net). dir is a unit direction.
void addPlane(vec2 p, vec2 dir, float A, float kk, float om, float ph,
              float t, inout float h, inout vec2 g) {
    float arg = kk * dot(dir, p) - om * t + ph;
    h += A * sin(arg);
    g += A * kk * cos(arg) * dir;
}

void main() {
    vec2 res = u_resolution;
    // world coords matching lib/interaction.glsl (origin centre, short-axis aspect)
    vec2 p = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y) * 2.0;

    float t = u_time;
    float playing = u_audio_playing;
    // idle drivers so the field never freezes when audio == 0
    float lvl  = mix(0.32 + 0.18 * sin(t * 0.6), u_audio_level, playing);
    float bass = mix(0.30 + 0.20 * sin(t * 0.43 + 1.0), u_audio_bass, playing);
    float mid  = mix(0.30 + 0.20 * sin(t * 0.91 + 2.0), u_audio_mid, playing);

    // global wavelength: calm -> broad swells, peak -> dense chop
    float dense = clamp(bass + 0.45 * u_energy_smooth, 0.0, 1.0);
    // body sub-phasing: a slow swing of the density vocabulary over the song
    // (net <-> chop) so the long body isn't one texture re-shaded -> long arc
    dense = clamp(dense + 0.24 * sin(u_song_progress * TAU * 2.0), 0.0, 1.0);
    // pre-tension: in the ~2.5s before a section cut, tighten the wavelength
    // and swell amplitude so a BUILD is felt, then the filmgrain bloom releases
    float preT = smoothstep(2.5, 0.0, u_to_section_change) * step(0.001, u_to_section_change);
    dense = clamp(dense + 0.40 * preT, 0.0, 1.0);
    // ending arc: the last ~18% broadens to glassy calm swells (recap of the
    // calm intro) and the whole field fades -> a designed ending, not a cut
    float arc = smoothstep(0.82, 1.0, u_song_progress);
    float lambda = mix(mix(0.55, 0.22, dense), 0.72, arc);
    float k = TAU / lambda;
    float c = 0.80;          // wave speed
    float om = k * c;
    // tremolo / spring-reverb shimmer ~10 Hz, always on (sub-beat liveness)
    float trem = 0.78 + 0.22 * sin(t * 62.0);

    float bpm = u_bpm > 1.0 ? u_bpm : 172.0;
    float barClock = t * (bpm / 60.0) / 4.0;         // rings per second = bars per second

    // --- vocabulary mode: rotate the DOMINANT event grammar over the song
    //     (net <-> bands <-> rings) so a 20s window shows a categorically
    //     different kind of motion, not the same interference rule re-scaled.
    //     u_section_id offsets the phase so each section cut hands off to a
    //     new vocabulary; the cosine lobes overlap so transitions cross-fade.
    float modePh = u_song_progress * TAU + u_section_id * 1.25;
    float netLobe  = 0.5 + 0.5 * cos(modePh);
    float bandLobe = 0.5 + 0.5 * cos(modePh - TAU / 3.0);
    float ringLobe = 0.5 + 0.5 * cos(modePh - 2.0 * TAU / 3.0);
    // Sharp pulses, not overlapping cosines: each grammar DISSOLVES back to the
    // calm net substrate before the next EMERGES (a ~lull between modes), so
    // transitions read as dissolution+emergence rather than two grammars
    // colliding at the crossover. Net keeps a floor so no frame goes dead.
    float netW  = 0.30 + 0.70 * pow(smoothstep(0.42, 1.0, netLobe),  1.5);
    float bandW =        pow(smoothstep(0.50, 1.0, bandLobe), 1.5);
    float ringW =        pow(smoothstep(0.50, 1.0, ringLobe), 1.5);

    float h = 0.0;
    vec2  g = vec2(0.0);

    // --- 6 ambient sources spread across the whole frame (always alive) ---
    // Spread (not a tight arc) so the interference NET of hyperbolic fringes
    // fills the frame instead of reading as one concentric pond.
    vec2 SRC[6] = vec2[6](
        vec2(-1.30,  0.62), vec2( 1.30,  0.48),
        vec2(-1.05, -0.58), vec2( 1.00, -0.70),
        vec2( 0.00,  0.92), vec2(-0.20, -0.95));
    for (int i = 0; i < 6; i++) {
        float fi = float(i);
        float A  = 0.36 * (0.55 + 0.45 * mid) * trem * netW;
        float kk = k * (0.88 + 0.06 * fi);          // detune -> no exact repeat
        addSource(p, SRC[i], A, kk, om * (1.0 + 0.05 * fi), fi * 1.7, t, h, g);
    }

    // --- BANDS mode: two detuned parallel plane waves -> traveling stripes
    //     (a categorically different vocabulary from the circular net) ---
    if (bandW > 0.01) {
        float ang = 0.6 + 0.35 * sin(u_song_progress * 3.1);   // band heading drifts
        vec2  bd  = vec2(cos(ang), sin(ang));
        float bA  = 0.40 * bandW * (0.6 + 0.4 * mid) * trem;
        addPlane(p, bd, bA,        k * 0.80, om * 0.85, 0.0, t, h, g);
        addPlane(p, bd, bA * 0.70, k * 1.15, om * 1.10, 1.3, t, h, g);
    }

    // --- coarse octave: low broad swells under the fine net (depth / near-far) ---
    vec2 CRS[3] = vec2[3](vec2(-0.85, 0.30), vec2(0.90, -0.20), vec2(0.05, -0.60));
    for (int i = 0; i < 3; i++) {
        addSource(p, CRS[i], 0.24 * (0.6 + 0.4 * lvl), k * 0.32, om * 0.32,
                  float(i) * 2.1, t, h, g);
    }

    // --- RINGS mode: central + a tight ring of in-phase sources emit
    //     concentric expanding rings each bar (om->TAU, t->barClock advances
    //     one cycle per bar). Driven by the downbeat AND the ringW mode. ---
    float Ac = 0.62 * u_downbeat + 0.06 + 0.55 * ringW;
    addSource(p, vec2(0.0, 0.05), Ac, k * 1.15, TAU, -TAU * barClock, t, h, g);
    if (ringW > 0.01) {
        for (int i = 0; i < 5; i++) {
            float a = TAU * float(i) / 5.0;
            vec2  rs = 0.34 * vec2(cos(a), sin(a));
            addSource(p, rs, 0.30 * ringW * (0.6 + 0.4 * lvl), k * 1.05,
                      TAU, -TAU * barClock, t, h, g);
        }
    }

    // --- cursor source: a finger dragged through the water ---
    vec2 mw = vjMouseWorld(u_mouse, res);            // vec2(1e4) when idle -> ~0 contribution
    addSource(p, mw, 0.62, k * 1.35, om * 1.2, 0.0, t, h, g);

    // --- 15 keyboard sources: x by key, wavelength by pitch (right = shorter) ---
    for (int i = 0; i < 15; i++) {
        float env = u_keys[i];
        if (env < 0.003) continue;
        bool isBlack = (i >= 9);
        float pos = isBlack ? HALFPOS[i - 9] : float(i);
        vec2  s = vec2(mix(-1.40, 1.40, pos / 8.0), 0.58);
        float pitch = pos / 8.0;                      // 0 (low,left) .. 1 (high,right)
        float kk = mix(k * 0.9, k * 2.2, pitch);      // higher pitch -> shorter wavelength
        float A  = 0.70 * env * trem;
        addSource(p, s, A, kk, kk * c, 0.0, t, h, g);
    }

    // ending arc fades the field; pre-tension swells it just before a cut
    float ampFade = mix(1.0, 0.42, arc) * (1.0 + 0.30 * preT);
    h *= ampFade;
    g *= ampFade;

    // --- encode ---
    float slope = length(g);
    vec2  dir   = slope > 1e-4 ? g / slope : vec2(0.0);
    float level = tanh(h * 0.50);                     // [-1,1], a touch less compression
    fragColor = vec4(0.5 + 0.5 * dir, 0.5 + 0.5 * level, slope / (1.0 + slope));
}
