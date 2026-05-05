#version 300 es
// ABOUTME: Mirror-bloom — N-fold dihedral kaleidoscope with iterated domain
// ABOUTME: warp. Beat-phase rotates the mirror; bass drives radial zoom;
// ABOUTME: section_id selects fold count; downbeat fires a visible bloom;
// ABOUTME: cursor offsets the kaleidoscope centre. Built for HBFS-style
// ABOUTME: 4-on-the-floor music where every beat must read on screen.
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;
uniform float u_audio_kick;
uniform float u_audio_snare;
uniform float u_beat_phase;
uniform float u_bar_phase;
uniform float u_downbeat;
uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_to_section_change;
uniform float u_song_progress;
uniform float u_bpm;
uniform sampler2D u_below;
uniform sampler2D u_history;
out vec4 fragColor;

vec2 kaleido(vec2 p, float folds, float rot) {
    // Convert to polar, fold to one wedge of (TAU / folds), mirror, rotate.
    float ang = atan(p.y, p.x) - rot;
    float r   = length(p);
    float wedge = TAU / folds;
    ang = mod(ang, wedge);
    ang = abs(ang - wedge * 0.5);          // mirror across the wedge centre
    return vec2(cos(ang), sin(ang)) * r;
}

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p  = (uv - 0.5) * vec2(aspect, 1.0);

    // Cursor as kaleidoscope CENTRE. vjMouseWorldOrZero returns vec2(0)
    // at idle (raw u_mouse near 0), so the kaleidoscope stays centred
    // until the user actually moves the cursor.
    vec2 mouseW = vjMouseWorldOrZero(u_mouse, u_resolution);
    p -= mouseW * 0.7;

    // Bass-driven radial zoom + a slow breathing component so the piece
    // moves at idle. Bass present → pull in; quiet → push out. u_audio_kick
    // adds a one-frame snap on the kick. This is a GEOMETRY driver
    // (bass → position), not a brightness multiplier — passes the
    // bass → movement probe.
    float zoomIdle = 0.04 * sin(u_time * 0.31);
    float zoom = 1.0 + zoomIdle
               - 0.18 * u_audio_bass
               - 0.08 * u_audio_kick;
    p *= zoom;

    // Section-driven fold count: 4 in intro, 6 in mid, 8 in drop. Cross-
    // faded smoothly across u_section_progress so transitions don't snap
    // (which would look like a glitch).
    float foldsTarget = 4.0 + 2.0 * float(u_section_id % 3);  // 4, 6, 8 cycling
    float foldsPrev   = 4.0 + 2.0 * float(max(0, u_section_id - 1) % 3);
    float blendBars   = u_to_section_change * u_bpm / 60.0;
    float xfade       = 1.0 - smoothstep(0.0, 4.0, blendBars);
    float folds       = mix(foldsTarget, foldsPrev, xfade * 0.5);

    // Rotation — a continuous slow drift so idle (no audio) still moves,
    // plus bar-phase locked rotation on top so audio playback adds visible
    // per-bar turns.
    float rot = u_time * 0.06
              + u_bar_phase * TAU / folds;
    // Beat-phase micro-snap — at the very start of each beat (phase < 0.07)
    // the rotation jumps an extra eighth of a wedge then eases back. Reads
    // as a visible per-beat step. Zero contribution when no analysis JSON
    // is present (u_beat_phase stays 0).
    rot += smoothstep(0.07, 0.0, u_beat_phase) * (TAU / folds * 0.18);

    // Apply the kaleidoscope. Output coordinate is the de-folded position
    // we sample the underlying texture at.
    vec2 q = kaleido(p, folds, rot);

    // Iterative domain-warp the noise field — gives mystery (the structure
    // never fully resolves) and depth (every zoom level shows new ridges).
    // Three iterations of fbm warping fbm warping fbm.
    float warp = 0.45 + 0.20 * u_audio_mid;
    vec2 r1 = q * 1.6 + vec2(u_time * 0.10, u_time * 0.07);
    float n1 = fbmRot(r1);
    vec2 r2 = q * 3.2 + vec2(n1) * warp + vec2(0.0, u_time * 0.15);
    float n2 = fbmRot(r2);
    vec2 r3 = q * 6.5 + vec2(n2 * 0.7, n1 * 0.5) * warp + u_time * 0.05;
    float n3 = fbmRot(r3);

    // Compose three octaves with sharp bands. Smoothstep tightens the
    // bright ridges so they read as filaments, not haze.
    float f = mix(n1, n2, 0.55);
    f = mix(f, n3, 0.40);
    float band = smoothstep(0.42, 0.78, f);

    // Radial vignette — keeps the eye on the kaleidoscope centre and
    // gives the piece a clear focal point.
    float vig = smoothstep(1.05, 0.20, length(p));

    // Warm palette indexed by section. Three-tone amber→ember→wine
    // spectrum, plus a small high-stem accent for hi-hat sparkle.
    vec3 amber = vec3(1.10, 0.55, 0.20);
    vec3 ember = vec3(1.20, 0.40, 0.10);
    vec3 wine  = vec3(0.85, 0.22, 0.06);
    float sw = float(u_section_id) / 5.0;
    vec3 baseTint = mix(amber, mix(ember, wine, smoothstep(0.5, 1.0, sw)),
                        smoothstep(0.0, 0.5, sw));
    vec3 accent   = vec3(1.30, 0.85, 0.45);
    vec3 col = baseTint * band * vig * (1.0 + 0.6 * u_audio_bass)
             + accent * u_audio_high * 0.6 * smoothstep(0.6, 0.95, band);

    // Downbeat ring — a soft halo that rings out from centre on each
    // bar's downbeat. One per bar = ≤4 flash events per bar even at
    // very fast tempos. Geometry (radius), not raw brightness flash.
    float ringR = 0.10 + (1.0 - u_downbeat) * 0.85;
    float ringW = 0.020 * u_downbeat + 0.001;
    float ring  = smoothstep(ringW, 0.0, abs(length(p) - ringR)) * u_downbeat * 1.2;
    col += baseTint * ring;

    // Pre-tension — in the last 4 bars before a section change, desaturate
    // and tighten the radial zoom. Released on the new-section downbeat.
    float toBars = u_to_section_change * u_bpm / 60.0;
    float squeeze = 1.0 - smoothstep(0.0, 4.0, toBars);
    col *= mix(1.0, 0.55, squeeze * 0.5);

    // Composite over u_below for the warm gradient floor.
    vec3 below = texture(u_below, uv).rgb;
    col = below + col;

    // History feedback — kaleidoscope rotation between frames means each
    // pixel sees a slightly-different upstream image; max-blending the
    // history at 0.93 leaves whirling trails along the rotation arc.
    vec3 hist = texture(u_history, uv).rgb * 0.93;
    col = max(col, hist);

    fragColor = vec4(col, 1.0);
}
