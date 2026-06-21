#version 300 es
// ABOUTME: Near-black warm substrate for yaktin-beni — a drifting ember hot-zone
// ABOUTME: (macro brightness envelope) that breathes with the bass and warms over the song.
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "palette.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_playing;
uniform float u_audio_bass_stem;
uniform float u_audio_level;
uniform float u_song_progress;

out vec4 fragColor;

void main() {
    vec2 res = u_resolution;
    vec2 p   = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y) * 2.0;

    // Drivers — synthesise when no audio so the bed still breathes.
    float playing = 1.0;   // force REAL uniforms: stems+section are frozen-VALID when paused, so paused==playing. (u_audio_playing=0 on pause flipped to synthetic = the bug). Idle falls back to the section floor + wallclock u_time.
    float bass = mix(0.35 + 0.30 * sin(u_time * 1.7), u_audio_bass_stem, playing);
    float prog = mix(fract(u_time * 0.01), u_song_progress, playing);

    // Wandering hot-zone — slow Lissajous drift; this is the macro envelope
    // the squint reads as light vs dark.
    vec2 hot = 0.42 * vec2(sin(u_time * 0.071 + 1.3), cos(u_time * 0.053));
    float rd = length(p - hot);
    float pool = exp(-rd * rd * (2.3 - 0.9 * bass));   // breathes wider on bass

    // A second, deeper-wine far pool so the field is never flat.
    vec2 hot2 = 0.55 * vec2(cos(u_time * 0.037 - 2.0), sin(u_time * 0.045 + 0.7));
    float pool2 = 0.5 * exp(-dot(p - hot2, p - hot2) * 1.4);

    // Cursor adds local heat (floor-and-ceiling; never owns the field).
    vec2 mw = vjMouseWorld(u_mouse, res);
    float heat = 0.35 * vjCursorHeat(p, mw, 0.45);

    float e = pool + pool2 + heat;

    // Warm ramp — deep wine in the cool troughs, ember toward the hot core,
    // climbing slightly warmer across the song. Luminance carries contrast:
    // near-black background, ember pool.
    vec3 base = warmShadow(0.62 + 0.05 * prog);                 // near-black wine substrate
    vec3 glow = warmCycle(0.86 + 0.10 * e + 0.06 * prog);       // wine→ember toward gold
    vec3 col  = base + glow * smoothstep(0.0, 1.4, e) * (0.55 + 0.45 * bass);

    // gentle radial fall-off so the frame edges sit in near-black.
    col *= 0.6 + 0.4 * exp(-dot(p, p) * 0.35);
    // (no u_audio_level lift — live FFT zeroes when paused, made paused != playing)

    fragColor = vec4(max(col, 0.0), 1.0);
}
