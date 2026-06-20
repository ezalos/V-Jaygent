#version 300 es
// ABOUTME: clave-clock — the 2-3 rumba clave as a 16-site Toussaint necklace
// ABOUTME: with a sweep hand; one revolution per 2-bar clave cycle (phase-lock).
precision highp float;

#include "math.glsl"
#include "sdf.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform int   u_frame;
uniform float u_audio_playing;
uniform float u_audio_high;
uniform float u_bar_phase;
uniform float u_bar_index;
uniform float u_downbeat;
uniform float u_song_progress;
uniform int   u_section_id;
uniform sampler2D u_below;

out vec4 fragColor;

// 2-3 rumba clave onsets on a 16-sixteenth, 2-bar grid (0-indexed): the
// 2-side {2,4} leads, then the 3-side {8,11,15}. (Son clave is 0,3,6,10,12;
// rumba pushes the 3rd stroke; 2-3 swaps the halves.)
const int CLAVE[5] = int[5](2, 4, 8, 11, 15);

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    float playing = step(0.5, u_audio_playing);

    // clave phase in [0,1) over the 2-bar cycle. With analysis: bar parity +
    // bar phase. Idle: synthesize on a 5.22 s cycle from the u_frame wall-clock
    // (u_time freezes with no audio under time_source:audio, which would freeze
    // the sweep — drive idle from u_frame so the clock keeps conducting).
    float CK = (playing > 0.5) ? u_time : float(u_frame) * 0.01667;
    float live = (mod(u_bar_index, 2.0) + u_bar_phase) * 0.5;
    float synth = fract(CK / 5.22);
    float clavePhase = mix(synth, live, playing);

    // The clock is the CONDUCTOR, not the lead — a small metronome parked in
    // the lower-left corner. The harmonograph comets own the frame.
    vec2 clockCtr = vec2(-0.56, -0.30);
    vec2 pc = p - clockCtr;

    float R = 0.16;
    float ring = abs(length(pc) - R);

    // base necklace ring — faint, structural.
    vec3 col = vec3(0.0);
    col += vec3(0.55, 0.34, 0.12) * smoothstep(0.007, 0.0, ring) * 0.40;

    // 16 tick sites; the 5 clave sites brighter. angle measured from top,
    // clockwise, so site k sits at fraction k/16 of the cycle.
    for (int k = 0; k < 16; k++) {
        float frac = float(k) / 16.0;
        float ang = frac * TAU - PI * 0.5;            // top = phase 0
        vec2 site = R * vec2(cos(ang), sin(ang));
        float dd = length(pc - site);

        bool isClave = (k == CLAVE[0] || k == CLAVE[1] || k == CLAVE[2] ||
                        k == CLAVE[3] || k == CLAVE[4]);
        float base = isClave ? 0.60 : 0.16;
        float rad  = isClave ? 0.012 : 0.007;
        vec3 tint  = isClave ? vec3(0.95, 0.58, 0.22) : vec3(0.40, 0.22, 0.10);

        // strike flare: brightens for a short window after the sweep passes a
        // clave site (geometry/position event, locked to the grid).
        float flare = 0.0;
        if (isClave) {
            float dphi = clavePhase - frac;
            dphi -= floor(dphi);                       // 0..1 since this site
            float env = exp(-dphi * 9.0);              // decay over ~0.6 of cycle
            flare = env;
        }
        col += tint * (base + 2.2 * flare) * smoothstep(rad + 0.009, rad, dd);
    }

    // the sweep hand — a line from the hub to the current clave position.
    float ha = clavePhase * TAU - PI * 0.5;
    vec2 handEnd = (R + 0.03) * vec2(cos(ha), sin(ha));
    float hd = sdSegment(pc, vec2(0.0), handEnd);
    float hand = smoothstep(0.008, 0.0, hd);
    col += vec3(1.0, 0.80, 0.52) * hand * (0.5 + 0.5 * u_downbeat);

    // small hub + downbeat pip so the bar grid is legible.
    col += vec3(1.0, 0.85, 0.6) * smoothstep(0.013, 0.0, length(pc)) * (0.3 + 0.7 * u_downbeat);

    // a touch of cymbal shimmer on the ring (sub-beat), warms with the song.
    col *= 1.0 + 0.3 * u_audio_high;
    col = mix(col, col * vec3(1.04, 0.82, 0.92), 0.3 * smoothstep(0.5, 0.85, u_song_progress));

    // structural, not the lead: keep it dim so the comets read as the figure.
    col *= 0.42;

    fragColor = vec4(col, 1.0);
}
