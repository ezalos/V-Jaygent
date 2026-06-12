// ABOUTME: Particle simulation for "kinetic-energy" — 1024 particles in a 32x32
// ABOUTME: rgba16f ping-pong texture; xy = position (torus uv), zw = velocity.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform int       u_frame;
uniform sampler2D u_state;    // self ping-pong

uniform vec2  u_mouse;        // cursor in target pixels; (0,0) when idle
uniform vec4  u_touches[8];
uniform int   u_touch_count;

// Song-level audio (zeroed when no analysis / silent).
uniform float u_beat_phase;     // [0,1) sawtooth, resets each beat — the wind-up ramp
uniform float u_downbeat;       // decaying impulse at each bar start — the burst
uniform float u_bar_phase;      // [0,1) sawtooth per bar
uniform int   u_section_id;     // section index; flips the flow at boundaries
uniform float u_section_progress;
uniform float u_to_section_change;  // seconds until next boundary — drives the implosion
uniform float u_song_progress;
uniform float u_energy_smooth;
uniform float u_audio_drums_stem;
uniform float u_audio_bass_stem;
uniform float u_audio_playing;

#include "math.glsl"
#include "noise.glsl"

out vec4 fragColor;

const int   GRID      = 32;        // 32 x 32 = 1024 particles (sparse — sparks, not a fog)
const int   NUM       = 1024;
const float DT        = 0.016;
const float MAX_SPEED = 0.78;
const float MIN_SPEED = 0.012;
const float DAMPING   = 0.90;      // snappier drag so particles punch outward on a hit
                                   // and SETTLE between beats — staccato, not a swirl

// Divergence-free curl of an fbmRot potential. fbmRot (NOT fbmGrid) per the
// grid-artefact lesson; per-axis time multipliers so the field doesn't slide
// diagonally. `sgn` lets a section boundary reverse the whole circulation.
vec2 curlVel(vec2 p, float t, float sgn) {
    const float e = 0.0035;
    vec2 tw = vec2(t * 0.11, t * 0.073);   // coprime-ish per-axis drift
    float n1 = fbmRot((p + vec2(e, 0.0)) * 2.4 + tw)
             - fbmRot((p - vec2(e, 0.0)) * 2.4 + tw);
    float n2 = fbmRot((p + vec2(0.0, e)) * 2.4 + tw)
             - fbmRot((p - vec2(0.0, e)) * 2.4 + tw);
    // (-dphi/dy, dphi/dx) — analytic 2D curl, divergence-free.
    return sgn * vec2(-n2, n1) / (2.0 * e);
}

void main() {
    ivec2 c  = ivec2(gl_FragCoord.xy);
    int   id = c.y * GRID + c.x;
    if (c.x >= GRID || c.y >= GRID || id >= NUM) { fragColor = vec4(0.0); return; }

    float fi = float(id);

    if (u_frame == 0) {
        vec2 hp = hash22(vec2(fi * 0.137 + 1.7, fi * 0.273 + 5.3));
        vec2 hv = (hash22(vec2(fi * 0.711 + 9.1, fi * 0.493 + 3.7)) - 0.5);
        fragColor = vec4(hp, normalize(hv + 1e-3) * MIN_SPEED);
        return;
    }

    vec4 self = texelFetch(u_state, c, 0);
    vec2 pos  = self.xy;
    vec2 vel  = self.zw;

    // --- Section identity: alternate sections reverse the circulation, so a
    // boundary visibly re-vocabularises the flow instead of re-shading it.
    float sgn = (u_section_id >= 0 && (u_section_id & 1) == 1) ? -1.0 : 1.0;

    // --- Global flow gain. Bass stem + smoothed energy push the whole field
    // harder; idle (no audio) keeps a living baseline so the piece survives
    // u_audio=0. The beat_phase term is the WIND-UP: tension ramps 0->1 across
    // the beat, then the downbeat impulse RELEASES it as a radial burst.
    float live    = mix(0.5, 1.0, u_audio_playing);          // baseline when silent
    // Wide dynamic range: most of the drive comes from bass + energy — quiet
    // MUSIC stays calm (slow particles -> dark), the drop drives them hard
    // (fast -> white-hot). The constant term is larger when SILENT (no track)
    // so the idle cell keeps visibly glowing embers instead of dying — the v4
    // critique measured the old effective 0.08 silent drive as a dead screen.
    float floorTerm = mix(0.42, 0.16, u_audio_playing);
    float drive   = live * (floorTerm + 1.8 * u_audio_bass_stem + 1.1 * u_energy_smooth);
    float windup  = 1.0 + 1.6 * u_beat_phase * u_beat_phase;  // eased anticipation

    // Blast centre — slowly wandering. The implosion gathers TO it and the
    // explosion detonates FROM it, so the two are spatially coherent.
    vec2  blast = 0.5 + 0.34 * vec2(sin(u_time * 0.21), cos(u_time * 0.17));
    vec2  bd    = pos - blast; bd -= floor(bd + 0.5);   // blast -> particle (outward)
    float br    = length(bd) + 1e-4;

    // ---- IMPLOSION: in the last ~4s before a section boundary, a gravity well
    // at the blast centre pulls every particle inward — a held-breath gather
    // that tightens as the drop approaches. The curl flow is suppressed during
    // the gather so the convergence into a knot reads cleanly.
    float gather = smoothstep(4.0, 0.4, u_to_section_change);
    drive *= (1.0 - 0.6 * gather);                          // keep some flow alive
    vel  += (-bd / br) * gather * 2.4 * DT;                 // strong inward pull —
                                                           // particles streak inward, bright

    vel += curlVel(pos, u_time, sgn) * drive * windup * DT;

    // ---- EXPLOSION + staccato bursts. Sharp impulses fire on every beat
    // (beatHit) with a downbeat/drums accent — radial flares that settle before
    // the next hit; muted during the gather so the implosion isn't fought. At a
    // section boundary (section_progress -> 0) a big outward DETONATION fires
    // immediately, scaled by energy: the DROP explodes, a wind-down only puffs.
    float beatHit  = exp(-u_beat_phase * 6.0);
    float burst    = (1.5 * u_downbeat + 0.8 * beatHit + 0.7 * u_audio_drums_stem)
                   * (0.45 + 1.0 * smoothstep(0.5, 0.0, br)) * (1.0 - gather);
    // Punchy and not throttled by the (lagging) energy at the boundary — a high
    // floor so the DROP detonates hard the instant the section flips; the wider
    // window carries the blast through the energy ramp-up.
    float detonate = smoothstep(0.07, 0.0, u_section_progress)
                   * (0.7 + 0.6 * u_energy_smooth);
    vel += (bd / br) * (burst * 2.7 + detonate * 7.5) * DT;

    // --- Cursor as an instrument with REAL local authority (v4 fix, path A).
    // The old pull (0.55) lost to the gather (2.4) and detonation (7.5) — the
    // cursor whispered into a storm. Now it WINS inside its radius: a 2.6 pull
    // plus a 1.1 tangential swirl, audio-independent, so dragging visibly
    // gathers AND orbits sparks even in silence and through a build. Bounded
    // by the smoothstep falloff so global dominance stays ≤ ~30%.
    // Toroidal delta so it wraps at the edges. Idle (u_mouse=0,0) → no pull.
    if (dot(u_mouse, u_mouse) > 1.0) {
        vec2 mp = u_mouse / u_resolution;
        vec2 md = mp - pos; md -= floor(md + 0.5);
        float mr = length(md) + 1e-4;
        float fall = smoothstep(0.30, 0.0, mr);
        vec2 dir  = md / mr;
        vec2 tang = vec2(-dir.y, dir.x);
        vel += (dir * 2.6 + tang * 1.1) * fall * fall * DT;
    }
    // Multi-touch: same pull per active finger.
    for (int i = 0; i < 8; i++) {
        if (i >= u_touch_count) break;
        vec4 t = u_touches[i];
        if (t.w < 0.5) continue;
        vec2 fp = t.xy / u_resolution;
        vec2 fd = fp - pos; fd -= floor(fd + 0.5);
        float fr = length(fd) + 1e-4;
        float fall = smoothstep(0.24, 0.0, fr);
        vel += (fd / fr) * fall * fall * 0.6 * DT;
    }

    // --- Always-on sub-beat jitter: high-freq per-particle velocity noise so
    // the field shimmers between beats (stills under-grade this; it's for the
    // running piece). Cheap hash, decorrelated per particle and per frame.
    vec2 j = hash22(vec2(fi + float(u_frame) * 0.013, fi * 0.37)) - 0.5;
    vel += j * 0.06 * DT;

    vel *= DAMPING;

    // Soft speed clamp (tanh saturation), gentle floor so nothing fully dies.
    float speed = length(vel);
    if (speed > 1e-5) {
        float softMax = MAX_SPEED * tanh(speed / MAX_SPEED);
        vel *= softMax / speed;
    }
    if (speed < MIN_SPEED) {
        vec2 k = hash22(vec2(fi, u_time * 1.3 + 0.1)) - 0.5;
        vel += normalize(k + 1e-3) * (MIN_SPEED - speed);
    }

    pos = fract(pos + vel * DT);   // torus wrap
    fragColor = vec4(pos, vel);
}
