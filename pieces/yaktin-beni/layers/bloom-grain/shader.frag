#version 300 es
// ABOUTME: yaktin-beni grade — HDR bloom of the bright antinodes/filament, kick
// ABOUTME: shockwave ring, snare ember sparks, Reinhard tonemap + warm grain + vignette.
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "palette.glsl"
#include "tonemap.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_playing;
uniform float u_audio_kick;
uniform float u_audio_snare;
uniform float u_audio_cymbal;
uniform float u_audio_drums_stem;
uniform float u_audio_level;
uniform float u_beat_phase;
uniform float u_downbeat;
uniform float u_section_id;
uniform float u_audio_bass_stem;
uniform sampler2D u_below;

out vec4 fragColor;

// luminance of the warm residual to bloom.
float luma(vec3 c) { return dot(c, vec3(0.30, 0.59, 0.11)); }

void main() {
    vec2 res = u_resolution;
    vec2 uv  = gl_FragCoord.xy / res;
    vec2 p   = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y) * 2.0;

    float playing = 1.0;   // force REAL uniforms: stems+section are frozen-VALID when paused, so paused==playing. (u_audio_playing=0 on pause flipped to synthetic = the bug). Idle falls back to the section floor + wallclock u_time.
    float kick   = mix(0.5 * pow(max(0.0, sin(u_time * 3.1416)), 8.0), u_audio_kick, playing);
    float snare  = mix(0.0, u_audio_snare, playing);
    float cymbal = mix(0.0, u_audio_cymbal, playing);
    float beatPh = mix(fract(u_time * 1.02), u_beat_phase, playing);

    vec3 below = texture(u_below, uv).rgb;

    // --- HDR bloom: golden-angle spiral of taps → ISOTROPIC (round) kernel.
    // (Louis redline: the lights had weird corners — an 8-tap ring blooms
    // octagonal. Golden-angle + aspect-correction makes the bloom a round halo.)
    vec3 bloom = vec3(0.0);
    float thr = 0.5;
    float wsum = 0.0;
    vec2 agg = vec2(res.y / res.x, 1.0);          // round on screen, not elliptical
    for (int i = 0; i < 24; i++) {
        float fi = float(i);
        float a  = fi * 2.39996323;               // golden angle — no axis bias
        float rr = 0.004 + 0.0012 * fi;           // spiral outward
        float w  = 1.0 - fi / 30.0;               // gaussian-ish falloff
        bloom += max(texture(u_below, uv + vec2(cos(a), sin(a)) * rr * agg).rgb - thr, 0.0) * w;
        wsum += w;
    }
    bloom /= wsum;
    vec3 col = below + bloom * 2.4;

    // --- kick shockwave: a ring expanding once per beat, lit by the kick ---
    float r = length(p);
    float ringR = beatPh * 1.25;
    float ring = exp(-pow((r - ringR) / 0.055, 2.0)) * (1.0 - beatPh);
    col += warmCycle(0.02) * ring * (0.25 + 1.3 * kick);
    col += warmCycle(0.10) * exp(-r * r * 8.0) * u_downbeat * 0.4;   // downbeat core flash

    // --- ember sparks on snare / cymbal transients ------------------------
    // 3x3 neighbourhood so sparks near a cell edge are NOT clipped into squares
    // (the single-cell version made cornered sparks — Louis's "weird corners").
    float spark = max(snare, 0.7 * cymbal);
    if (spark > 0.02) {
        vec2 g = p * 7.0;
        vec2 cell = floor(g);
        float tb = floor(u_time * 6.0);
        float acc = 0.0;
        for (int oy = -1; oy <= 1; oy++)
        for (int ox = -1; ox <= 1; ox++) {
            vec2 cc = cell + vec2(float(ox), float(oy));
            vec2 h = hash22(cc + tb * 1.7);
            float d = length(g - (cc + h));
            float tw = step(0.82, h.x) * (0.5 + 0.5 * sin(u_time * 22.0 + h.y * 40.0));
            acc = max(acc, exp(-d * d * 11.0) * tw);
        }
        col += vec3(1.0, 0.85, 0.6) * acc * spark * 1.4;
    }

    // --- grade: Reinhard tonemap, warm grain, vignette --------------------
    col = reinhard(col);   // no u_audio_level boost (live FFT, zeroes when paused)
    float grain = (hash21(uv * res + fract(u_time) * 311.0) - 0.5) * 0.04;
    col += grain;
    col *= 0.55 + 0.45 * pow(1.0 - r * 0.5, 1.5);   // vignette to near-black edges
    col = pow(max(col, 0.0), vec3(0.92));           // mild lift

    fragColor = vec4(col, 1.0);
}
