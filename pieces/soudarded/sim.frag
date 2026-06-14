// ABOUTME: Kuramoto-Sakaguchi phase oscillators on a 2D toroidal lattice — state
// ABOUTME: is the unit vector (cosθ,sinθ) in .rg, natural frequency ω in .b.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec2      u_mouse;
uniform int       u_frame;
uniform sampler2D u_state;

// song-level / audio drive
uniform float u_energy_smooth;
uniform float u_audio_bass_stem;
uniform float u_audio_drums_stem;
uniform float u_audio_other_stem;
uniform float u_audio_vocals_stem;
uniform float u_downbeat;
uniform float u_bar_phase;
uniform int   u_bar_index;
uniform float u_to_section_change;

// keyboard pacemakers
uniform float u_keys[15];
uniform float u_key_event[15];

#include "math.glsl"
#include "noise.glsl"

out vec4 fragColor;

// NaN guard: a single NaN audio uniform (can occur when audio is paused/absent
// in headless idle cells) would corrupt dθ → the whole ping-pong field goes
// NaN and renders pure black, permanently. Sanitise every audio input.
float sane(float x) { return (x == x) ? x : 0.0; }

// integration — small step keeps wavefronts continuous frame-to-frame.
const float DT = 0.11;

// 8-neighbour coupling: orthogonal weight 1, diagonal 1/2 (9-pt isotropy).
const float SUMW = 6.0;

void main() {
    vec2 uv    = gl_FragCoord.xy / u_resolution.xy;
    vec2 texel = 1.0 / u_resolution.xy;

    // ---- frame 0: smooth phase + planted spiral cores ---------------------
    // Random per-texel phase never coarsens into visible spirals within the
    // song. Instead seed a SMOOTH low-frequency phase field and plant a few
    // phase singularities (atan around a point = a spiral core, ±charge) so
    // big spiral waves exist from the first frame and the dynamics evolve them.
    if (u_frame == 0) {
        float aspect0 = u_resolution.x / u_resolution.y;
        vec2  P       = (uv - 0.5) * vec2(aspect0, 1.0) * 2.0;
        // Keep the base phase NEARLY UNIFORM (<1 rad of variation). A seed with
        // many windings quenches into a dense defect-wall labyrinth that only
        // anneals logarithmically; the only windings we want are the planted
        // spiral cores (each atan = one ±1 topological charge; cos/sin hide its
        // branch cut). Result: a handful of big spirals on a smooth field.
        float base = 0.55 * vnoise(P * 1.0);
        float spir = 0.0;
        spir += atan(P.y - 0.30, P.x + 0.70);   // +
        spir -= atan(P.y + 0.40, P.x - 0.60);   // -
        spir += atan(P.y - 0.60, P.x - 0.10);   // +
        spir -= atan(P.y + 0.60, P.x + 0.40);   // -
        spir += atan(P.y - 0.50, P.x - 0.80);   // +
        float a0    = base + spir;
        // Near-UNIFORM medium with LOW-frequency ω domains: a large/high-freq
        // spread keeps re-spawning defects (frustration → static).
        float omega = 0.94 + 0.08 * fbmRot(P * 0.9);
        fragColor = vec4(cos(a0), sin(a0), omega, 1.0);
        return;
    }

    vec4  st    = texture(u_state, uv);
    vec2  v     = st.xy;            // (cosθ, sinθ) — this oscillator
    float omega = st.z;

    float aspect = u_resolution.x / u_resolution.y;
    vec2  worldP = (uv - 0.5) * vec2(aspect, 1.0) * 2.0;

    // ---- regime: phase lag α and coupling K from the song -----------------
    float bass  = sane(u_audio_bass_stem);
    float drums = sane(u_audio_drums_stem);
    float other = sane(u_audio_other_stem);
    float voc   = sane(u_audio_vocals_stem);
    float E     = sane(u_energy_smooth);
    float downbeat = sane(u_downbeat);
    float barPhase = clamp(sane(u_bar_phase), 0.0, 1.0);

    // PURE Kuramoto (α=0): a ferromagnetic gradient flow where the antiphase
    // checkerboard is UNSTABLE and decays, leaving smooth synchronization
    // domains + rotating spiral defects (the planted topological charges) that
    // attract and annihilate → coarsening with discrete annihilation events.
    // The Sakaguchi lag (α>0) is non-variational and re-stabilises the
    // checkerboard into fine static — so it stays out. A whisper of α adds
    // gentle wave chirality without crossing back into frustration.
    float syncDrive = clamp(0.20 + 1.0 * E + 0.60 * bass + 0.50 * voc, 0.0, 1.0);
    float tension   = smoothstep(3.0, 0.3, sane(u_to_section_change));
    float alpha = 0.20;
    // K (coupling) energy-gated so quiet has slower travelling waves.
    float K     = 0.62 + 0.70 * bass + 0.60 * voc + 0.45 * E;
    // rotation speed: wide range so quiet genuinely slows (motion dynamic
    // range) and the in-place colour cycling stays gentle (trackable).
    float gain  = 0.12 + 1.10 * E + 0.35 * other;

    float cosA = cos(alpha);
    float sinA = sin(alpha);

    // ---- 8-neighbour Kuramoto-Sakaguchi coupling (toroidal) ---------------
    float coupling = 0.0;
    for (int dy = -1; dy <= 1; dy++) {
        for (int dx = -1; dx <= 1; dx++) {
            if (dx == 0 && dy == 0) continue;
            float w   = (dx != 0 && dy != 0) ? 0.5 : 1.0;
            // Clamp (not wrap): a toroidal seam couples mismatched edges and
            // spawns a defect line along the border. Clamp = Neumann boundary.
            vec2  suv = clamp(uv + vec2(float(dx), float(dy)) * texel, vec2(0.0), vec2(1.0));
            vec2  vj  = texture(u_state, suv).xy;
            float s   = v.x * vj.y - v.y * vj.x;   // sin(θj-θi)
            float c   = v.x * vj.x + v.y * vj.y;   // cos(θj-θi)
            coupling += w * (s * cosA - c * sinA); // sin(θj-θi-α)
        }
    }
    coupling /= SUMW;

    // ---- forcing: downbeat ring, cursor + key pacemakers ------------------
    float dist = length(worldP);
    float forcing = 0.0;

    // downbeat: an expanding ring of phase advance — the communal step. Its
    // origin HOPS to a new spot each bar (seeded by bar index) so the events
    // migrate instead of pumping one permanent centred target that would park
    // the whole composition dead-centre and kill divergence.
    float bi      = float(u_bar_index);
    vec2  ringC   = vec2(1.25 * sin(bi * 2.39 + 0.7), 0.78 * cos(bi * 1.73 + 1.9));
    float distR   = length(worldP - ringC);
    float ringR   = barPhase * 1.7;
    float ringEnv = (1.0 - barPhase);
    forcing += (0.45 + 0.70 * drums) * ringEnv
             * exp(-pow((distR - ringR) / 0.12, 2.0));
    forcing += 0.12 * downbeat;                     // small global communal step

    // cursor pacemaker: a faster-rotating site emits target waves.
    bool mouseIdle = (u_mouse.x == 0.0 && u_mouse.y == 0.0);
    if (!mouseIdle) {
        vec2 mN = u_mouse / u_resolution.xy;
        vec2 dC = (uv - mN) * vec2(aspect, 1.0) * 2.0;
        forcing += 1.05 * exp(-dot(dC, dC) * 22.0);
    }

    // 15 keyboard pacemakers around a circle (per-key distinct positions).
    for (int i = 0; i < 15; i++) {
        float ang = (float(i) + 0.5) / 15.0 * TAU;
        vec2  sp  = vec2(cos(ang), sin(ang)) * 0.62;
        vec2  dk  = worldP - sp;
        float amp = u_keys[i] * 0.6 + u_key_event[i] * 1.0;
        forcing += amp * 1.1 * exp(-dot(dk, dk) * 30.0);
    }

    // ---- integrate: rotate the unit vector by dθ --------------------------
    // NB: lib rot2d(a) is column-major mat2(c,-s,s,c) → it rotates CLOCKWISE
    // by a (the header comment is wrong). We need +dθ, so pass -dθ; otherwise
    // the coupling becomes ANTI-diffusion and the field shreds to checkerboard.
    float dtheta = (omega * gain + K * coupling + forcing) * DT;
    v = rot2d(-dtheta) * v;
    // Guard: if the state was ever read as the zero vector (a realloc/reset of
    // the FBO without re-seeding), normalize((0,0))=NaN would blacken the field
    // permanently. Recover to a valid unit phase instead.
    v = (dot(v, v) > 1e-6) ? normalize(v) : vec2(1.0, 0.0);

    fragColor = vec4(v, omega, 1.0);
}
