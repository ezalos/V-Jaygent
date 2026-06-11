// ABOUTME: Pigment-state simulation for "ink-bloom" — rgba16f ping-pong field.
// ABOUTME: rgb = sienna/carmine/indigo densities, a = wetness; semi-Lagrangian bleed.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform int       u_frame;
uniform sampler2D u_state;        // self ping-pong (previous frame's pigment field)

uniform vec2  u_mouse;            // cursor in target pixels; (0,0) when idle
uniform vec4  u_touches[8];
uniform int   u_touch_count;
uniform float u_keys_visual[15];  // keyboard-synth visual envelopes
uniform float u_key_event[15];    // attack spike per key

uniform float u_audio_playing;
uniform float u_audio_kick;
uniform float u_audio_high;
uniform float u_beat_phase;       // [0,1) sawtooth per beat — the stir wind-up
uniform int   u_beat_index;
uniform float u_downbeat;         // decaying impulse at each bar start
uniform int   u_bar_index;
uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_energy_smooth;
uniform float u_song_progress;

#include "math.glsl"
#include "noise.glsl"

out vec4 fragColor;

const float DT       = 0.016666;
const float MAX_DENS = 2.5;       // Beer-Lambert cap; pow(T, 2.5) is already near-black
const float GOLDEN   = 2.3999632; // golden angle — bar-snap brush positions never repeat

// Divergence-free curl of an fbmRot potential (fbmRot, NOT fbmGrid: grid patches
// bake into feedback). Per-axis time multipliers kill the diagonal-slide shimmer.
vec2 curlFlow(vec2 p, float t, float freq) {
    const float e = 0.004;
    vec2 tw = vec2(t * 0.057, t * 0.041);
    float n1 = fbmRot((p + vec2(e, 0.0)) * freq + tw)
             - fbmRot((p - vec2(e, 0.0)) * freq + tw);
    float n2 = fbmRot((p + vec2(0.0, e)) * freq + tw)
             - fbmRot((p - vec2(0.0, e)) * freq + tw);
    return vec2(-n2, n1) / (2.0 * e);
}

float splat(vec2 p, vec2 c, float r) {
    vec2 d = p - c;
    return exp(-dot(d, d) / (r * r));
}

void main() {
    vec2 uv  = gl_FragCoord.xy / u_resolution;
    vec2 asp = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 p   = uv * asp;                       // aspect-true coords for distances

    if (u_frame == 0) { fragColor = vec4(0.0); return; }

    vec4  self  = texture(u_state, uv);
    float wet   = self.a;
    float play  = u_audio_playing;
    float live  = mix(0.55, 1.0, play);        // idle keeps a slower living baseline
    float energy = mix(0.30, u_energy_smooth, play);

    // --- Section arc (defensive: all-zero uniforms behave like a mid section).
    // s0 intro: lone indigo tendril. s1 long build: indigo/sienna alternate per
    // bar. s2: carmine enters. s3: second mirrored brush. s4: downbeat backruns
    // begin. s5 climax: everything + heavy water. s6 outro: the painting dries.
    int  sec      = u_section_id;
    bool playing  = play > 0.5;
    int  families = playing ? clamp(sec + 1, 1, 3) : 2;
    bool twoBrush = playing ? (sec >= 3) : false;
    bool backruns = playing ? (sec >= 4) : false;
    bool drying   = playing && (sec >= 6);

    // --- Flow field: curl noise, frequency breathes slowly + per-section nudge,
    // amplitude rides the song's energy. Wetness gates motion: dry paint is
    // pinned to the paper (that IS the drying mechanic, not a freeze bug).
    float freq = 2.3 + 0.35 * sin(u_time * 0.013 + float(sec) * 1.7);
    float amp  = live * (0.020 + 0.135 * energy) * (drying ? 0.25 : 1.0);
    vec2  vel  = curlFlow(p, u_time, freq) * amp;

    // --- Beat stir: a vortex at the lead brush, chirality flips per beat, decays
    // across the beat (exp ramp-down from each beat onset). Geometry, not flash.
    // Idle metronome: with no audio, a phantom beat (~91 bpm) and bar clock keep
    // the stir + bar-snap vocabulary alive — self-playing first (lint-idle).
    float beatPh  = mix(fract(u_time / 0.66), u_beat_phase, play);
    int   barIdx  = playing ? u_bar_index  : int(u_time / 2.64);
    int   beatIdx = playing ? u_beat_index : int(u_time / 0.66);
    float beatHit = exp(-beatPh * 5.0) * mix(0.55, 1.0, play);

    // Lead brush: slow lissajous wander + a bar-snapped golden-angle offset, so
    // each bar visibly seeds a NEW bloom in a place the last bar didn't.
    vec2 wander = vec2(0.5 * asp.x, 0.5)
                + 0.26 * vec2(sin(u_time * 0.043 + 1.3), sin(u_time * 0.061));
    float barA  = GOLDEN * float(barIdx);
    vec2 brush  = wander + 0.16 * vec2(cos(barA), sin(barA));
    // sub-beat shimmer: the hand is never perfectly still
    brush += 0.006 * (0.4 + u_audio_high)
           * vec2(sin(u_time * 9.7), sin(u_time * 12.3 + 2.0));

    {   // stir vortex around the lead brush
        vec2  d = p - brush;
        float r = length(d) + 1e-4;
        float chir = ((beatIdx & 1) == 0) ? 1.0 : -1.0;
        float fall = exp(-r * r / 0.018);
        vel += chir * vec2(-d.y, d.x) / r * fall * beatHit
             * (0.22 + 0.30 * u_audio_kick);
    }

    // --- Downbeat ring (s4+): an expanding radial push from the bar's backrun
    // splat — the visible "the bar started HERE" event.
    vec2 splatC = vec2(0.5 * asp.x, 0.5)
                + 0.30 * vec2(cos(barA * 1.61803), sin(barA * 1.61803));
    if (backruns) {
        vec2  d = p - splatC;
        float r = length(d) + 1e-4;
        float ringR = 0.42 * (1.0 - u_downbeat);
        float band  = exp(-pow((r - ringR) / 0.05, 2.0));
        vel += (d / r) * band * u_downbeat * 0.45;
    }

    // --- Cursor: a brush in the viewer's hand — stirs and injects below.
    vec2 mp = u_mouse / u_resolution * asp;
    bool mouseOn = dot(u_mouse, u_mouse) > 1.0;
    if (mouseOn) {
        vec2  d = p - mp;
        float r = length(d) + 1e-4;
        float fall = exp(-r * r / 0.012);
        // swirl + slight pull: stirring wet paint toward the bristles
        vel += (vec2(-d.y, d.x) * 0.30 - d * 0.18) / r * fall;
    }
    for (int i = 0; i < 8; i++) {
        if (i >= u_touch_count) break;
        if (u_touches[i].w < 0.5) continue;
        vec2  fp = u_touches[i].xy / u_resolution * asp;
        vec2  d  = p - fp;
        float r  = length(d) + 1e-4;
        float fall = exp(-r * r / 0.012);
        vel += (vec2(-d.y, d.x) * 0.30 - d * 0.18) / r * fall;
    }

    // Wetness gates the flow: pigment only travels where the paper is wet.
    float mobility = 0.02 + 0.98 * smoothstep(0.03, 0.30, wet);
    vel *= mobility;

    // --- Semi-Lagrangian advection (gather) + wet diffusion. vel is uv/s;
    // one frame's displacement is vel*DT (NOT vel*DT*60 — that smears all
    // state across the canvas in a frame and reads as "nothing persists").
    vec2 src = uv - (vel / asp) * DT;
    vec4 adv = texture(u_state, src);
    vec2 px  = 1.0 / u_resolution;
    vec4 nb  = texture(u_state, src + vec2(px.x, 0.0))
             + texture(u_state, src - vec2(px.x, 0.0))
             + texture(u_state, src + vec2(0.0, px.y))
             + texture(u_state, src - vec2(0.0, px.y));
    float diff = (0.012 + 0.12 * smoothstep(0.05, 0.5, wet));
    vec4 state = mix(adv, nb * 0.25, diff);

    vec3  dens = state.rgb;
    wet = state.a;

    // --- Drying: wetness evaporates; pigment does NOT fade — the painting
    // accumulates across the whole song (that is the thesis). Idle bleaches
    // very slowly so an unattended canvas doesn't end up black by lunchtime.
    wet *= drying ? 0.988 : 0.9965;
    wet += 0.0008 * energy;                    // ambient humidity, idle included
    if (!playing) dens *= 0.99995;

    // --- Injection. Wet-on-wet uptake guard: saturated paper refuses pigment.
    // Calibration on paper: one bar's dwell (~96 frames at 60fps) deposits
    // ~96 * 0.012 * 0.7 ~= 0.8 density — a clearly visible glaze; the energy
    // term pushes a climax bar toward the uptake ceiling, never past it.
    float uptake = 1.0 - smoothstep(1.0, 2.4, dot(dens, vec3(1.0)));
    vec3  inj    = vec3(0.0);
    float wetInj = 0.0;

    // pigment family of the current bar — rotates through the active families
    // in entry order: indigo opens the piece, sienna joins, carmine arrives
    // last. map: 0=sienna(r) 1=carmine(g) 2=indigo(b).
    int cyc  = barIdx % families;
    int lead = (cyc == 0) ? 2 : (cyc == 1) ? 0 : 1;
    vec3 leadW = vec3(lead == 0 ? 1.0 : 0.0, lead == 1 ? 1.0 : 0.0,
                      lead == 2 ? 1.0 : 0.0);

    float brushRate = (drying ? 0.0005 : 0.012 + 0.045 * energy + 0.015 * beatHit)
                    * live
                    * ((sec == 0 && playing) ? 0.3 : 1.0);  // intro: a lone thin tendril
    float brushR    = 0.030 + 0.025 * energy;

    float s0 = splat(p, brush, brushR);
    inj    += leadW * brushRate * s0;
    wetInj += s0 * brushRate * 10.0;

    if (twoBrush) {                            // mirrored second hand
        vec2 brush2 = vec2(asp.x, 1.0) - brush;
        vec3 w2 = leadW.brg;                   // offset family
        float s1 = splat(p, brush2, brushR * 0.85);
        inj    += w2 * brushRate * 0.8 * s1;
        wetInj += s1 * brushRate * 8.0;
    }

    if (backruns) {                            // downbeat water bomb -> cauliflower
        float s2 = splat(p, splatC, 0.060);
        wetInj += s2 * u_downbeat * u_downbeat * 0.10;
        inj    += leadW.gbr * s2 * u_downbeat * 0.004;
    }

    if (mouseOn) {                             // the viewer paints the lead family
        float s3 = splat(p, mp, 0.034);
        inj    += leadW * 0.030 * s3;
        wetInj += s3 * 0.16;
    }
    for (int i = 0; i < 8; i++) {
        if (i >= u_touch_count) break;
        if (u_touches[i].w < 0.5) continue;
        float s4 = splat(p, u_touches[i].xy / u_resolution * asp, 0.034);
        inj    += leadW * 0.030 * s4;
        wetInj += s4 * 0.16;
    }

    // keys are brush dabs: whites drop the lead family across the paper width,
    // blacks always drop indigo; the attack spike splashes extra water.
    for (int i = 0; i < 15; i++) {
        float env = u_keys_visual[i];
        float ev  = u_key_event[i];
        if (env < 0.004 && ev < 0.004) continue;
        vec2 kpos = vec2((float(i) + 0.5) / 15.0 * asp.x,
                         0.30 + 0.40 * hash21(vec2(float(i) * 7.31, 11.7)));
        float sk = splat(p, kpos, 0.026);
        vec3  kw = (i >= 9) ? vec3(0.0, 0.0, 1.0) : leadW;
        inj    += kw * sk * env * 0.030;
        wetInj += sk * (env * 0.05 + ev * 0.30);
    }

    // deckle margin: the paper's edge stays bare
    vec2  eb   = min(p, asp - p);
    float edge = smoothstep(0.004, 0.030, min(eb.x, eb.y));
    inj *= uptake * edge;

    dens = min(dens + inj, vec3(MAX_DENS));
    wet  = clamp(wet + wetInj * edge, 0.0, 1.0);

    fragColor = vec4(dens, wet);
}
