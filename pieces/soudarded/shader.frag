// ABOUTME: soudarded display — renders the Kuramoto phase field as warm spiral
// ABOUTME: waves: phase→cyclic palette, coherence-gated glow, communal-sync bloom.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec2      u_mouse;
uniform sampler2D u_state;

uniform float u_energy_smooth;
uniform float u_audio_level;
uniform float u_downbeat;
uniform float u_to_section_change;
uniform int   u_section_id;

#include "math.glsl"
#include "tonemap.glsl"

out vec4 fragColor;

// NaN guard for audio uniforms (paused/absent audio in idle cells).
float sane(float x) { return (x == x) ? x : 0.0; }

// Red-dominant warm cycle — "the soldiers are dressed in red". Cyclic so the
// phase wrap (θ: 2π→0) never blinks. near-black → wine → blood → ember →
// amber → cream → (wrap).
vec3 warmCycle(float t) {
    t = fract(t);
    vec3 c[6];
    c[0] = vec3(0.030, 0.010, 0.020);
    c[1] = vec3(0.340, 0.040, 0.070);
    c[2] = vec3(0.720, 0.090, 0.070);
    c[3] = vec3(0.970, 0.330, 0.090);
    c[4] = vec3(1.000, 0.620, 0.220);
    c[5] = vec3(0.990, 0.840, 0.560);   // warm amber-cream, not white (avoids wash)
    float seg = t * 6.0;
    int   i   = int(floor(seg));
    float f   = smoothstep(0.0, 1.0, fract(seg));
    vec3  a   = c[i];
    vec3  b   = c[i == 5 ? 0 : i + 1];
    return mix(a, b, f);
}

void main() {
    vec2  uv     = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    vec2  worldP = (uv - 0.5) * vec2(aspect, 1.0) * 2.0;

    vec4  st    = texture(u_state, uv);
    vec2  v     = st.xy;                      // (cosθ, sinθ)
    float theta = atan(v.y, v.x);            // [-π, π]
    float p01   = theta / TAU + 0.5;         // [0, 1]

    float E      = sane(u_energy_smooth);
    float lvl    = sane(u_audio_level);
    float downb  = sane(u_downbeat);

    // ---- local coherence: how aligned the neighbourhood is -----------------
    // Offset ~1 sim-texel (sim runs at ~0.20 canvas) so we sample real phase
    // variation, not the same upsampled oscillator.
    vec2  o   = 5.0 / u_resolution.xy;
    vec2  acc = v;
    acc += texture(u_state, uv + vec2( o.x, 0.0)).xy;
    acc += texture(u_state, uv + vec2(-o.x, 0.0)).xy;
    acc += texture(u_state, uv + vec2(0.0,  o.y)).xy;
    acc += texture(u_state, uv + vec2(0.0, -o.y)).xy;
    acc += texture(u_state, uv + vec2( o.x,  o.y)).xy;
    acc += texture(u_state, uv + vec2(-o.x,  o.y)).xy;
    acc += texture(u_state, uv + vec2( o.x, -o.y)).xy;
    acc += texture(u_state, uv + vec2(-o.x, -o.y)).xy;
    float coh = length(acc) / 9.0;           // 0 = defect core, 1 = locked

    // ---- palette: phase → warm cycle, faint per-section tint ---------------
    float hueOff = float(u_section_id) * 0.06;
    vec3  col    = warmCycle(p01 + hueOff);

    // coherent domains glow; turbulent regions dim; defect cores → near-black
    // points (the eye-landing anchors).
    col *= 0.35 + 0.65 * coh;
    col *= 0.14 + 0.86 * smoothstep(0.0, 0.18, coh);

    // wavefront filigree — bright cream crest where sinθ peaks, sharpest where
    // the medium is coherent (the main travelling-wave highlight; the wavefronts
    // also supply the higher spatial-frequency octaves as the waves propagate).
    float crest = pow(0.5 + 0.5 * v.y, 5.0);
    col += vec3(1.0, 0.90, 0.64) * crest * (0.18 + 0.42 * coh) * 0.70;

    // domain walls — the thin seams of mid-low coherence between phase domains.
    // They form a fine network (higher spatial-frequency octave) that drifts
    // WITH the field at wave speed, so it adds depth without temporal flicker.
    float wall = smoothstep(0.62, 0.40, coh) * smoothstep(0.08, 0.26, coh);
    col += vec3(0.95, 0.46, 0.16) * wall * 0.34;

    // ---- global order parameter r → communal-sync bloom -------------------
    vec2 g = vec2(0.0);
    for (int yy = 0; yy < 4; yy++) {
        for (int xx = 0; xx < 4; xx++) {
            vec2 suv = (vec2(float(xx), float(yy)) + 0.5) / 4.0;
            g += texture(u_state, suv).xy;
        }
    }
    float r = length(g) / 16.0;              // 0 = chaos, 1 = whole field locked

    // Bloom is the communal LOCK-IN — gated to high energy AND high coherence
    // so it blazes only at the peak (centre-dominance there is the thesis), and
    // stays out of the way in verse/quiet so the composition isn't centre-locked.
    float cd    = length(worldP);
    float lockIn = smoothstep(0.32, 0.78, E) * smoothstep(0.25, 0.6, r);
    float glow  = pow(r, 1.4) * lockIn;
    vec3  bcol  = mix(vec3(1.0, 0.50, 0.14), vec3(1.0, 0.95, 0.82), r);
    col += bcol * glow * exp(-cd * cd * 1.5);
    col += bcol * 0.45 * downb * lockIn * exp(-cd * cd * 0.9);   // bar surge
    col += vec3(0.20, 0.05, 0.02) * pow(r, 3.0) * lockIn;            // crowd lift

    // ---- drifting macro hot-zones (squint macro; migrate per section) ------
    float sid = float(u_section_id);
    vec2  h1  = vec2(0.95 * sin(u_time * 0.050 + sid * 1.7),
                     0.60 * cos(u_time * 0.037 + sid * 2.3));
    vec2  h2  = vec2(1.00 * cos(u_time * 0.041 + sid * 0.9 + 2.0),
                     0.55 * sin(u_time * 0.061 + sid * 3.1));
    float env = 0.52 + 0.48 * (exp(-dot(worldP - h1, worldP - h1) * 0.70)
                             + 0.8 * exp(-dot(worldP - h2, worldP - h2) * 0.90));
    col *= env;

    // ---- master dynamics + circular vignette (an-dro ring nod) ------------
    // Floor keeps the piece (and the cursor pacemaker) visible with NO audio —
    // before playback and in the cursor-only idle cell. Energy still drives a
    // clear build/peak arc on top.
    float master = 0.34 + 1.00 * E + 0.18 * lvl;
    col *= master;
    float vig = smoothstep(2.1, 0.30, cd);
    col *= 0.62 + 0.38 * vig;

    // pre-tension: a held breath before a section change.
    float tension = smoothstep(3.0, 0.3, sane(u_to_section_change));
    float gl      = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, vec3(gl) * vec3(1.0, 0.72, 0.60), tension * 0.45);
    col *= 1.0 - 0.18 * tension;

    // roll off only the brightest so peaks compress to warm-white, not clip.
    col = reinhardPartial(col, 1.7);
    col = pow(max(col, 0.0), vec3(0.88));

    fragColor = vec4(col, 1.0);
}
