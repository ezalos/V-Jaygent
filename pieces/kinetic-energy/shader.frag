// ABOUTME: Display pass for kinetic-energy — tonemaps the trail buffer with a cheap
// ABOUTME: glow, a drifting macro brightness envelope, and a chiaroscuro vignette.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform sampler2D u_trails;   // accumulated light from the trail pass

uniform vec2  u_mouse;
uniform float u_energy_smooth;
uniform float u_downbeat;
uniform float u_beat_phase;       // wind-up ramp [0,1)
uniform float u_bar_phase;        // slow per-bar ramp
uniform int   u_section_id;       // recompose the hot-zones per section
uniform float u_song_progress;    // global arc / edge fades
uniform float u_section_progress; // within-section build
uniform float u_audio_playing;

#include "math.glsl"
#include "tonemap.glsl"

out vec4 fragColor;

// Cheap radial glow: a handful of taps of the trail buffer at growing radius.
// Not a true Gaussian pyramid, but enough to make hot cores bleed into light.
// Tight two-ring glow — a small crisp halo around hot cores, NOT a wide haze
// (the blur was softening the whole frame). Fewer taps also pays for the
// higher render_scale.
vec3 glow(vec2 uv, float radius) {
    vec3  sum  = vec3(0.0);
    float wsum = 0.0;
    const int N = 8;
    for (int i = 0; i < N; i++) {
        float a = float(i) / float(N) * TAU + 0.4;
        for (int k = 1; k <= 2; k++) {
            float rr  = radius * float(k);
            vec2  off = vec2(cos(a), sin(a)) * rr;
            float w   = 1.0 / float(k * k);     // sharper falloff — tighter halo
            sum  += texture(u_trails, uv + off).rgb * w;
            wsum += w;
        }
    }
    return sum / wsum;
}

void main() {
    vec2  uv     = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;

    vec3 base = texture(u_trails, uv).rgb;

    // Cursor widens the glow locally — a second channel that reacts to input,
    // so interactivity isn't ghettoised in the sim pass alone.
    float glowR = 0.006 + 0.004 * u_energy_smooth;
    if (dot(u_mouse, u_mouse) > 1.0) {
        vec2  mp = u_mouse / u_resolution;
        float md = length((uv - mp) * vec2(aspect, 1.0));
        glowR += 0.010 * smoothstep(0.25, 0.0, md);
    }
    vec3 bloom = glow(uv, glowR);

    // Bloom is sparse now (the trail buffer is mostly black), so a lighter
    // weight keeps light from hazing into the dark ground.
    vec3 col = base + bloom * 0.35;

    // --- Macro brightness envelope: two slowly-wandering hot-zones so the
    // squint sees light/dark structure across the frame, not flat texture.
    // Each section seeds a different phase, so the composition visibly
    // re-arranges at a boundary instead of just re-shading (section vocabulary).
    float sphase = float(u_section_id) * 1.7;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
    vec2 h1 = 0.30 * vec2(sin(u_time * 0.053 + sphase),       cos(u_time * 0.041 + sphase));
    vec2 h2 = 0.34 * vec2(cos(u_time * 0.037 + 1.7 - sphase), sin(u_time * 0.061 + 0.6 + sphase));
    float env = 0.55
              + 0.65 * exp(-dot(p - h1, p - h1) / 0.10)
              + 0.45 * exp(-dot(p - h2, p - h2) / 0.07);
    col *= env;

    // Beat breath + staccato flash: the frame dims slightly through the wind-up
    // (beat_phase ramp), then snaps bright on every beat (beatHit) with a bigger
    // accent on the downbeat — tension + release you can see, on every hit.
    float beatHit = exp(-u_beat_phase * 7.0);
    col *= 1.0 - 0.12 * u_beat_phase + 0.06 * u_bar_phase;
    col *= 1.0 + 0.85 * u_downbeat + 0.30 * beatHit;

    // Global arc: ease the whole piece up from the near-silent intro and back
    // down into the outro, so the song's shape is legible at the macro scale.
    float arc = smoothstep(0.0, 0.12, u_song_progress)
              * (1.0 - smoothstep(0.90, 1.0, u_song_progress));
    col *= mix(0.7, 1.0, arc);

    // Each section builds internally — a gentle ramp across its own span so the
    // energy swells toward each boundary rather than sitting flat.
    col *= mix(0.92, 1.06, u_section_progress);

    // Tonemap: push hot cores toward white, keep the ground near-black.
    col = aces(col * (0.9 + 0.5 * u_energy_smooth));

    // Chiaroscuro vignette.
    float vig = smoothstep(1.15, 0.25, length((uv - 0.5) * vec2(aspect, 1.0)));
    col *= mix(0.55, 1.0, vig);

    // Near-black warm floor so the darks aren't dead grey (kept tiny so the
    // ground reads black, not warm fog).
    col = max(col, vec3(0.005, 0.0035, 0.0025));

    fragColor = vec4(pow(col, vec3(0.92)), 1.0);
}
