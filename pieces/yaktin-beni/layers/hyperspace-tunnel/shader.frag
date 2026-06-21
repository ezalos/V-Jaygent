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

    float playing = 1.0;   // force REAL uniforms: stems+section are frozen-VALID when paused, so paused==playing. (u_audio_playing=0 on pause flipped to synthetic = the bug). Idle falls back to the section floor + wallclock u_time.
    float sidF  = mix(floor(mod(u_time * 0.066, 7.0)), u_section_id, playing);
    int   sid   = int(sidF + 0.5);
    float prog  = mix(fract(u_time * 0.01), u_song_progress, playing);

    // section-scaled lively FLOOR so the tunnel never dies on a stem dropout
    // (the bass-out at t=195 deadened the old bass-gated drop). Real audio adds.
    float sectE = (sid == 0) ? 0.18 : (sid == 1) ? 0.35 : (sid == 2) ? 0.45
                : (sid == 3) ? 0.60 : (sid == 4) ? 0.25 : (sid == 5) ? 0.60 : 0.30;
    float live  = sectE * (0.60 + 0.50 * (0.5 + 0.5 * sin(u_time * 1.6)));
    // STEM + time floor only (NOT u_audio_level — a live FFT uniform that zeroes
    // when paused and made paused != playing).
    float bass  = max(u_audio_bass_stem * playing, live);

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
    // SLOW scroll so the concentric rings READ as a flythrough while PLAYING.
    // (The harness showed the fast scroll only looked good FROZEN: crisp rings
    // paused, smeared mush playing. Slow rings translate and the eye tracks
    // them.)
    float speed = 0.32 + 0.8 * drop + 0.25 * bass;
    float depth = log(rad) * 2.3 - u_time * speed;

    // concentric rings rushing outward = the dominant beautiful feature (this
    // IS Louis's gorgeous paused screenshot, made to read per-frame).
    float rings = pow(0.5 + 0.5 * sin(depth * TAU), 2.5);

    // radial streaks add fine detail; stable in angle, slow low-freq bend.
    float spokeCount = 14.0 + 24.0 * drop;
    float wob = ang + 0.18 * sin(depth + ang * 3.0);
    float streaks = pow(0.5 + 0.5 * sin(wob * spokeCount), 5.0);

    // rings LEAD; bright warm CORE (Louis's paused frame has a GLOWING centre,
    // not a dark vanishing point), softening toward the edges.
    float fall = 0.35 + 0.9 * exp(-rad * rad * 0.9);
    float tunnel = max(rings, streaks * 0.8) * fall;
    tunnel *= (0.7 + 1.3 * drop);
    tunnel += (0.45 + 0.8 * drop) * exp(-rad * rad * 4.0);       // bright tunnel core
    tunnel += 0.4 * u_downbeat * rings * drop;

    vec3 col = warmCycle(0.34 - 0.06 * sin(depth)) * tunnel * 1.4;
    col += vec3(1.0, 0.90, 0.70) * pow(saturate(tunnel), 2.0) * (0.4 + 0.6 * drop) * 0.5;

    col *= smoothstep(0.0, 1.0, u_frame / 20.0);                 // ramp from frame 0
    col *= 1.0 - 0.7 * smoothstep(0.93, 1.0, prog);              // outro fade

    fragColor = vec4(max(col, 0.0), 1.0);
}
