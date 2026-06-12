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
uniform float u_to_section_change;// implosion timer — soft-focus the gather
uniform float u_audio_playing;

#include "math.glsl"
#include "tonemap.glsl"

out vec4 fragColor;

// Radial gaussian blur of the trail buffer. Three rings with gaussian radial
// weights so it stays smooth even at a LARGE radius — that's what lets it
// double as the out-of-focus state, not just a tight halo. Drive `radius`
// small for a crisp accent, large for dreamy defocus.
vec3 glow(vec2 uv, float radius) {
    vec3  sum  = vec3(0.0);
    float wsum = 0.0;
    const int N = 10;
    for (int i = 0; i < N; i++) {
        float a   = float(i) / float(N) * TAU + 0.3;
        vec2  dir = vec2(cos(a), sin(a));
        for (int k = 1; k <= 3; k++) {
            float fk = float(k);
            float w  = exp(-fk * fk * 0.4);      // gaussian radial falloff
            sum  += texture(u_trails, uv + dir * radius * fk).rgb * w;
            wsum += w;
        }
    }
    return sum / wsum;
}

void main() {
    vec2  uv     = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;

    vec3 base = texture(u_trails, uv).rgb;

    // --- AUDIO-DRIVEN FOCUS PULL ---------------------------------------------
    // focus = 1 -> crisp sharp sparks; focus = 0 -> dreamy out-of-focus haze.
    // Tension-release mapping: quiet sections + the wind-up before each beat
    // soften the image (anticipation), the downbeat SNAPS it into focus (the
    // payoff). energy sets the macro level, beat_phase the micro softening,
    // downbeat the snap. A soft floor keeps it from ever going to pure mush.
    // The implosion gather pulls focus soft (a dreamy converging knot); the
    // boundary detonation snaps it razor-sharp as the sparks explode — the
    // focus and the physics breathe together through the drop.
    float gather   = smoothstep(4.0, 0.4, u_to_section_change);
    float detonate = smoothstep(0.07, 0.0, u_section_progress);
    float focus = clamp(0.30 + 0.72 * u_energy_smooth
                              - 0.40 * u_beat_phase
                              + 0.85 * u_downbeat
                              - 0.55 * gather
                              + 0.90 * detonate, 0.05, 1.0);
    float defocus = 1.0 - focus;

    // Glow radius swells wide when defocused (dreamy bloom) and tightens to a
    // crisp halo in focus. Cursor adds a local focus-softening so you can smear
    // the field by hand — a second interactive channel.
    float glowR = mix(0.0030, 0.020, defocus * defocus);
    if (dot(u_mouse, u_mouse) > 1.0) {
        vec2  mp = u_mouse / u_resolution;
        float md = length((uv - mp) * vec2(aspect, 1.0));
        glowR += 0.012 * smoothstep(0.28, 0.0, md);
    }
    vec3 bloom = glow(uv, glowR);

    // In focus: sharp streak cores carry the image, thin glow accent. Defocused:
    // the cores fade and the wide bloom takes over -> the sparks melt into
    // glowing clouds. This is the visible breathing in and out of focus.
    // Brightest cores are EXEMPT from the defocus fade (v4 multi_octave fix):
    // a thread of sharp filament survives the calm, so the quiet image keeps
    // fine-scale structure under the dreamy bloom.
    float coreKeep = smoothstep(0.25, 0.70, max(base.r, max(base.g, base.b)));
    vec3 col = base * mix(mix(1.0, 0.45, defocus), 1.0, coreKeep)
             + bloom * mix(0.22, 1.7, defocus);

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

    // Intro ember seed (v4 eye_lands fix — frame 0 was a black rectangle in
    // four straight critiques): during the near-silent opening, the blast
    // centre carries a faint breathing ember so the eye has somewhere to land
    // before the first particles ignite. Fades out as the song wakes up.
    float intro = 1.0 - smoothstep(0.0, 0.05, u_song_progress);
    if (intro > 0.001) {
        vec2 bc = 0.5 + 0.34 * vec2(sin(u_time * 0.21), cos(u_time * 0.17));
        vec2 bp = (uv - bc) * vec2(aspect, 1.0);
        float breathe = 0.12 + 0.05 * sin(u_time * 0.8);
        col += vec3(0.55, 0.18, 0.045) * intro * breathe * exp(-dot(bp, bp) / 0.012);
    }

    // Each section builds internally — a gentle ramp across its own span so the
    // energy swells toward each boundary rather than sitting flat.
    col *= mix(0.92, 1.06, u_section_progress);

    // Tonemap: push hot cores toward white, keep the ground near-black.
    // Exposure raised 0.9+0.5 -> 1.7+0.9 per critique v1 top_fix: the peak
    // still measured mean L 0.0065 with 0.02% of pixels above half-brightness
    // (squint probe fail) — the structure was there, the display pass hid it.
    col = aces(col * (1.7 + 0.9 * u_energy_smooth));

    // Chiaroscuro vignette.
    float vig = smoothstep(1.15, 0.25, length((uv - 0.5) * vec2(aspect, 1.0)));
    col *= mix(0.55, 1.0, vig);

    // Near-black warm floor so the darks aren't dead grey (kept tiny so the
    // ground reads black, not warm fog).
    col = max(col, vec3(0.005, 0.0035, 0.0025));

    fragColor = vec4(pow(col, vec3(0.92)), 1.0);
}
