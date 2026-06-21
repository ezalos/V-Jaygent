#version 300 es
// ABOUTME: yaktin-beni hyperspace-tunnel — log-polar warp flythrough; concentric rings
// ABOUTME: rush outward past stable radial streaks so you are projected INTO the tunnel.
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "palette.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_frame;
uniform vec2  u_mouse;
uniform float u_audio_playing;
uniform float u_audio_bass_stem;
uniform float u_audio_level;
uniform float u_section_id;
uniform float u_downbeat;
uniform float u_song_progress;

out vec4 fragColor;

void main() {
    vec2 res = u_resolution;
    vec2 p   = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y) * 2.0;

    float playing = u_audio_playing;
    float sidF  = mix(floor(mod(u_time * 0.066, 7.0)), u_section_id, playing);
    int   sid   = int(sidF + 0.5);
    float prog  = mix(fract(u_time * 0.01), u_song_progress, playing);

    // section-scaled lively FLOOR so the tunnel never dies on a stem dropout
    // (the bass-out at t=195 deadened the old bass-gated drop). Real audio adds.
    float sectE = (sid == 0) ? 0.18 : (sid == 1) ? 0.35 : (sid == 2) ? 0.45
                : (sid == 3) ? 0.60 : (sid == 4) ? 0.25 : (sid == 5) ? 0.60 : 0.30;
    float live  = sectE * (0.60 + 0.50 * (0.5 + 0.5 * sin(u_time * 1.6)));
    float bass  = max(max(u_audio_bass_stem, 0.6 * u_audio_level) * playing, live);

    // tunnel always present (depth) but SURGES at the drop sections — a strong
    // baseline so the flythrough is the dominant motion, not a faint extra.
    float drop = (sid == 3 || sid == 5) ? 1.0 : (sid == 2 ? 0.65 : (sid == 4 ? 0.35 : 0.45));
    drop = clamp(drop * (0.75 + 0.45 * bass), 0.0, 1.3);

    // cursor steers the vanishing point — you fly toward where you point.
    vec2 vp  = 0.4 * vjMouseWorldOrZero(u_mouse, res);
    vec2 q   = p - vp;
    float rad = max(length(q), 1e-3);
    float ang = atan(q.y, q.x);

    // log-polar: centre = far (the vanishing point). Scroll depth at a STEADY,
    // TRACKABLE speed so the rings rush outward as a coherent flythrough — NOT
    // a fast flicker. (This is the fix for "only beautiful when paused".)
    float speed = 0.8 + 2.4 * drop + 0.5 * bass;     // FAST forward rush (still coherent)
    float depth = log(rad) * 2.3 - u_time * speed;

    // concentric rings rushing toward you (bands in depth).
    float rings = pow(0.5 + 0.5 * sin(depth * TAU), 3.0);

    // radial streaks — STABLE in angle (star-trails), only a slow low-freq bend
    // so they stay trackable as they stream past; count grows with the drop.
    float spokeCount = 16.0 + 30.0 * drop;
    float wob = ang + 0.22 * sin(depth * 1.2 + ang * 3.0);
    float streaks = pow(0.5 + 0.5 * sin(wob * spokeCount), 5.0);

    // combine; dark vanishing point at centre, brightening toward the edges
    // (features rushing past you), downbeat surge.
    // strong DEPTH gradient: dark vanishing point at centre (far), bright
    // streaks at the edges (features flying PAST you) — reads as forward depth.
    float depthGrad = smoothstep(0.06, 0.30, rad) * (0.35 + 1.05 * smoothstep(0.25, 1.25, rad));
    float tunnel = max(streaks, rings * 0.6) * depthGrad;
    tunnel *= (0.6 + 1.5 * drop);                                // dominant at the drop
    tunnel += 0.4 * u_downbeat * streaks * drop;

    // warm streaks: amber/cream rushing lines on darkness.
    vec3 col = warmCycle(0.30 - 0.05 * sin(depth)) * tunnel * 1.5;
    col += vec3(1.0, 0.90, 0.70) * pow(streaks * smoothstep(0.3, 1.0, rad), 2.0) * (0.5 + 0.9 * drop);

    col *= smoothstep(0.0, 1.0, u_frame / 20.0);                 // ramp from frame 0
    col *= 1.0 - 0.7 * smoothstep(0.93, 1.0, prog);              // outro fade

    fragColor = vec4(max(col, 0.0), 1.0);
}
