// ABOUTME: Cahn-Hilliard spinodal decomposition sim for "No Son Of Mine" —
// ABOUTME: two phases demix irreversibly; cursor stirs, keys inject, beats shear.
#version 300 es
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform int   u_frame;
uniform vec2  u_mouse;
uniform vec4  u_touches[8];
uniform int   u_touch_count;
uniform sampler2D u_state;

uniform float u_audio_playing;
uniform float u_audio_bass_stem;
uniform float u_audio_drums_stem;
uniform float u_audio_vocals_stem;
uniform float u_downbeat;
uniform float u_bar_phase;
uniform int   u_bar_index;
uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_song_progress;
uniform float u_to_section_change;
uniform float u_keys[15];
uniform float u_key_event[15];

out vec4 fragColor;

// One explicit Euler substep of ∂h/∂t = M ∇²μ, μ = h³ − h − γ∇²h.
// The γ∇²h term carries the intrinsic length scale (interface width ~√γ,
// spinodal wavelength 2π√(2γ)) — the canonical operator IS the pattern
// former, no external modulation needed.
const float DT = 0.05;

// State: .r = order parameter h ∈ [-1,1] (wine ↔ cream),
//        .g = wall heat (audio-fed, decaying), .b/.a unused.

float f(float h) { return h * h * h - h; }

// Same 15-key pitch-mapped positions as break-on-through (canonical layout):
// whites i=0..8 spread across x, blacks i=9..14 between them, rows offset.
vec2 keyPos(int i) {
    float halfPositions[6] = float[6](0.5, 1.5, 3.5, 4.5, 5.5, 7.5);
    bool isBlack = (i >= 9);
    float pos = isBlack ? halfPositions[i - 9] : float(i);
    float kx = (pos / 8.0 - 0.5) * 1.2;
    float ky = isBlack ? 0.18 : -0.18;
    return vec2(kx, ky);
}

vec2 worldOf(vec2 uv) {
    return (uv * u_resolution - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y) * 2.0;
}

// 5x5 neighborhood of h, filled in main(). Index (i,j) ∈ [-2,2]².
float HH[25];
float hAt(int i, int j) { return HH[(j + 2) * 5 + (i + 2)]; }

// Isotropic 9-point laplacian (Oono-Puri weights: -3 / ½ orth / ¼ diag).
// The 5-point stencil's anisotropy straightens CH walls onto the grid
// axes (seen in v0 inspect frames); 9-point keeps walls at all angles.
float lap9(int i, int j) {
    return -3.0 * hAt(i, j)
         + 0.5  * (hAt(i + 1, j) + hAt(i - 1, j) + hAt(i, j + 1) + hAt(i, j - 1))
         + 0.25 * (hAt(i + 1, j + 1) + hAt(i - 1, j + 1) + hAt(i + 1, j - 1) + hAt(i - 1, j - 1));
}

void main() {
    vec2 uv    = gl_FragCoord.xy / u_resolution;
    vec2 texel = 1.0 / u_resolution;
    vec2 p     = worldOf(uv);

    // --- 5x5 stencil read ---
    for (int j = -2; j <= 2; j++) {
        for (int i = -2; i <= 2; i++) {
            HH[(j + 2) * 5 + (i + 2)] =
                texture(u_state, uv + vec2(float(i), float(j)) * texel).r;
        }
    }
    float c = hAt(0, 0);

    float heat = texture(u_state, uv).g;

    // --- Section state machine: quench depth γ, mobility M, phase bias ---
    // Sections (analysis JSON): 0 intro / 1 verse / 2 ch1+v2 / 3 chorus /
    // 4 bridge (the return) / 5 final choruses (the rejection) / 6 collapse /
    // 7 outro. Idle (no audio) uses mid-song defaults.
    float gamma = 1.1;
    float mob   = 1.0;
    float bias  = 0.0;
    bool playing = u_audio_playing > 0.5;
    if (playing) {
        int sid = u_section_id;
        if      (sid == 0) { gamma = 0.8;  mob = 1.0;  }
        else if (sid == 1) { gamma = 0.9;  mob = 0.85; }
        else if (sid == 2) { gamma = 1.1;  mob = 1.0;  }
        else if (sid == 3) { gamma = 1.3;  mob = 1.2;  }
        else if (sid == 4) { gamma = 1.0;  mob = 1.0;  }   // bridge: remelt era
        // Stability: explicit CH blows up past DT·mob·γ ≈ 0.08 (v0.2 inspect:
        // sections at 0.135 disintegrated into grid-aligned pixel debris,
        // self-healed when the ramp dropped). γ=1.8 caps mob at 0.85.
        else if (sid == 5) { gamma = 1.8;  mob = 0.85; bias = -0.35 * u_section_progress; }
        else if (sid == 6) { gamma = 1.8;  mob = mix(0.85, 0.15, u_section_progress); bias = -0.35; }
        else               { gamma = 1.8;  mob = mix(0.15, 0.0, u_section_progress); bias = -0.35; }
    }

    // --- Cahn-Hilliard: ∇²μ (9-point) via μ at the 9 inner points ---
    float muC  = f(hAt( 0,  0)) - gamma * lap9( 0,  0);
    float muE  = f(hAt( 1,  0)) - gamma * lap9( 1,  0);
    float muW  = f(hAt(-1,  0)) - gamma * lap9(-1,  0);
    float muN  = f(hAt( 0,  1)) - gamma * lap9( 0,  1);
    float muS  = f(hAt( 0, -1)) - gamma * lap9( 0, -1);
    float muNE = f(hAt( 1,  1)) - gamma * lap9( 1,  1);
    float muNW = f(hAt(-1,  1)) - gamma * lap9(-1,  1);
    float muSE = f(hAt( 1, -1)) - gamma * lap9( 1, -1);
    float muSW = f(hAt(-1, -1)) - gamma * lap9(-1, -1);

    float lapMu = -3.0 * muC
                + 0.5  * (muE + muW + muN + muS)
                + 0.25 * (muNE + muNW + muSE + muSW);
    float h = c + DT * mob * lapMu;

    // --- Advection: stir velocity field (texels/substep) ---
    vec2 grad = vec2((hAt(1, 0) - hAt(-1, 0)) * 0.5,
                     (hAt(0, 1) - hAt(0, -1)) * 0.5);   // per-texel
    vec2 vel  = vec2(0.0);

    // Cursor / touches: each active point is a vortex (tangential stir) —
    // the viewer mixing what the equation will unmix.
    {
        vec2 mw = vjMouseWorld(u_mouse, u_resolution);
        int nT = u_touch_count;
        for (int i = 0; i < 8; i++) {
            vec2 tp;
            if (nT > 0) {
                if (i >= nT) break;
                tp = (u_touches[i].xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y) * 2.0;
            } else {
                if (i > 0) break;
                tp = mw;   // hover fallback — desktop cursor is an instrument
            }
            vec2 r = p - tp;
            float g = exp(-dot(r, r) / 0.045);
            vel += vec2(-r.y, r.x) * g * 6.0;          // tangential spin
            // local remelt: stirring also heats — pushes toward mixed gray
            h = mix(h, 0.0, g * 0.09);
        }
    }

    // Downbeat shear: walls slide laterally along their own tangent on the
    // bar grid (geometry moves, not brightness). Bass stem scales it. Sign
    // alternates per bar — a one-way shear ratchets walls straight (v0.1
    // spot-check: PCB stripes); back-and-forth wobbles them instead.
    {
        float gl = length(grad);
        if (gl > 1e-4) {
            vec2 tangent = vec2(-grad.y, grad.x) / gl;
            float sgn = (u_bar_index % 2 == 0) ? 1.0 : -1.0;
            vel += tangent * sgn * u_downbeat * (0.4 + 1.2 * u_audio_bass_stem) * 0.55;
        }
    }

    // Slow global rotation around a wandering pivot. A uniform translation
    // drift smears anisotropically along grid axes (v0.1 spot-check: walls
    // locked to vertical/horizontal); rotation has no preferred axis and
    // keeps re-orienting walls against the stencil grid.
    {
        float a = u_resolution.x / u_resolution.y;
        vec2 pivot = 0.45 * vec2(a * sin(u_time * 0.019), sin(u_time * 0.027 + 1.0));
        vec2 rp = p - pivot;
        vel += 0.035 * vec2(-rp.y, rp.x);
    }

    // Clamp for stability, apply semi-implicit advection term.
    float vl = length(vel);
    if (vl > 0.6) vel *= 0.6 / vl;
    h -= dot(vel, grad);

    // --- Dark bias: cream-phase evaporation (deliberately non-conservative).
    // CH bulk has no restoring force, so a global pull toward a target
    // flattens ALL domains (v0 failure: field washed to tan by t=56s).
    // Instead, when the section biases dark, mass evaporates only from
    // cream bulk (h > 0); CH redistributes and the islands shrink from
    // their edges. Rate on paper: 0.0002/substep ≈ 0.02/s live → cream
    // half-fraction drains across the ~116s final act.
    h -= 0.0002 * saturate(-bias / 0.35) * smoothstep(0.15, 0.70, h);

    // --- Wandering remelt blob: memory revisiting the wound. Re-mixes a
    // region; the equation re-separates it. Bridge (section 4) blows it up —
    // the return home — before section 5 tears it apart for good.
    {
        float a = u_resolution.x / u_resolution.y;
        vec2 q = vec2(0.8 * a * sin(u_time * 0.031 + 1.7), 0.6 * sin(u_time * 0.023));
        float radius = (playing && u_section_id == 4) ? 0.55 : 0.22;
        float g = exp(-dot(p - q, p - q) / (radius * radius));
        h = mix(h, 0.0, g * 0.035);
        // reseed with smooth drifting noise so re-separation finds new domain
        // shapes — spatially smooth (vnoise, not per-pixel hash: that read as
        // TV static inside the blob) and temporally coherent.
        h += g * 0.018 * (vnoise(p * 22.0 + vec2(u_time * 0.9, -u_time * 0.7)) - 0.5);
    }

    // --- Keys: white keys inject cream (+), black keys inject wine (−),
    // pitch-mapped. The field swallows or expels the droplet.
    for (int i = 0; i < 15; i++) {
        bool isBlack = (i >= 9);
        vec2 kp = keyPos(i);
        vec2 d = p - kp;
        float intensity = exp(-dot(d, d) * 160.0);
        float drive = 0.30 * u_key_event[i] + 0.05 * u_keys[i];
        float target = isBlack ? -0.95 : 0.95;
        h = mix(h, target, saturate(intensity * drive));
    }

    // --- Wall heat: the boundary carries the voice ---
    // wallMask: on the interface (|h| small) AND where a real gradient exists.
    float wallMask = smoothstep(0.85, 0.40, abs(h)) * saturate(length(grad) * 8.0);
    float drive;
    if (playing) {
        // pre-tension: walls heat up in the last 6s before a section change
        float tension = smoothstep(6.0, 0.0, max(u_to_section_change, 0.0)) * 0.5;
        drive = 0.30 + 1.40 * u_audio_vocals_stem + 0.90 * u_downbeat + tension;
    } else {
        // idle synthetic: slow breathing
        drive = 0.30 + 0.25 * (0.5 + 0.5 * sin(u_time * 0.7));
    }
    // decay 0.9952/substep ≈ 0.4s half-life at 60fps×6; equilibrium ≈
    // 0.007·drive/0.0048 ≈ 1.46·drive_max — bounded (density-saturation rule).
    heat = heat * 0.9952 + 0.007 * wallMask * drive;

    // --- Init & guards ---
    if (u_frame < 2) {
        h = (vnoise(p * 6.0) - 0.5) * 0.30
          + (hash21(gl_FragCoord.xy) - 0.5) * 0.12;
        heat = 0.0;
    }
    h = clamp(h, -1.15, 1.15);
    heat = clamp(heat, 0.0, 2.5);
    if (!(h == h)) { h = 0.0; }          // NaN reset
    if (!(heat == heat)) { heat = 0.0; }

    fragColor = vec4(h, heat, 0.0, 1.0);
}
