#version 300 es
// ABOUTME: Central 8-pointed Ottoman girih star — union of two squares at 0° and 45°.
// ABOUTME: Rotates one revolution per bar, scale impulse on each downbeat, palette
// ABOUTME: flips per section (rondo recapitulation made visible).
precision highp float;

#include "math.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform int   u_frame;
uniform vec2  u_mouse;
uniform float u_audio_bass;
uniform float u_audio_high;
uniform float u_audio_playing;
uniform float u_bar_phase;
uniform float u_beat_phase;
uniform float u_downbeat;
uniform float u_section_progress;
uniform float u_to_section_change;
uniform int   u_section_id;
uniform float u_song_progress;
uniform float u_keys[15];
uniform float u_key_event[15];
uniform sampler2D u_below;

uniform float base_radius;
uniform float rim_softness;

// Inset-shadow star body (dark warm ember inside the star) so the body reads
// as gilded metal in low candle-light, while a bright cream RIM is the actual
// eye-catcher. The star outlines itself.
const float RIM_W = 0.020;

out vec4 fragColor;

// Two warm families that alternate per section (rondo: refrain returns to A
// minor — ember-red — and episodes ride through gold/amber/cream).
vec3 ember_family(float t) {
    // ember-red core → wine → cream highlight
    t = clamp(t, 0.0, 1.0);
    if (t < 0.5) return mix(vec3(0.55, 0.10, 0.05), vec3(0.95, 0.35, 0.18), t * 2.0);
    return                mix(vec3(0.95, 0.35, 0.18), vec3(1.00, 0.85, 0.55), (t - 0.5) * 2.0);
}

vec3 gold_family(float t) {
    // amber → gold → cream
    t = clamp(t, 0.0, 1.0);
    if (t < 0.5) return mix(vec3(0.45, 0.20, 0.05), vec3(1.00, 0.65, 0.20), t * 2.0);
    return                mix(vec3(1.00, 0.65, 0.20), vec3(1.00, 0.92, 0.70), (t - 0.5) * 2.0);
}

// Signed distance to an 8-pointed star: union of two axis-aligned squares
// rotated 45° from each other. Standard girih construction.
float sd8Star(vec2 p, float s) {
    vec2 q1 = abs(p);
    float d1 = max(q1.x, q1.y) - s;
    float c = cos(PI * 0.25), si = sin(PI * 0.25);
    vec2 p2 = mat2(c, -si, si, c) * p;
    vec2 q2 = abs(p2);
    float d2 = max(q2.x, q2.y) - s;
    return min(d1, d2);
}

// Inner concentric square outline (the star center has a smaller square framing
// the inner courtyard — pure girih convention).
float sdSquareRing(vec2 p, float s, float w) {
    vec2 q = abs(p);
    float d = max(q.x, q.y) - s;
    return abs(d) - w;
}

void main() {
    vec2 c = (gl_FragCoord.xy - 0.5 * u_resolution)
           / min(u_resolution.x, u_resolution.y);

    float playing = u_audio_playing;

    // Synthetic drivers when silent — the layer must self-play.
    float bp   = mix(fract(u_time * 0.5),  u_beat_phase,        playing);
    float ba   = mix(fract(u_time * 0.125), u_bar_phase,        playing);
    float bass = mix(0.30 + 0.20 * sin(u_time * 0.7), u_audio_bass, playing);
    float dbeat= mix(0.0, u_downbeat, playing);
    float sprog= mix(fract(u_time * 0.05), u_section_progress, playing);
    float toSect = (playing > 0.5) ? u_to_section_change : 1e3;
    float gprog= mix(fract(u_time * 0.01), u_song_progress, playing);

    // Bar-phase rotation — one revolution per bar.
    // At every section-flip (sprog near 0 just after the boundary), the rotation
    // snaps back to 0 so the rondo recapitulation reads on screen.
    float snapWindow = 1.0 - smoothstep(0.0, 0.04, sprog);
    float angle = ba * TAU;
    angle = mix(angle, 0.0, snapWindow * 0.85);

    float ca = cos(angle), sa = sin(angle);
    vec2 p = mat2(ca, -sa, sa, ca) * c;

    // Cursor pulls the star toward itself — gentle position offset, only
    // engages when cursor is far enough from center to read as intent.
    // (Dominance probe: kept small — at most ~0.05 world units pull.)
    vec2 mw = vjMouseWorldOrZero(u_mouse, u_resolution);
    float pullMag = clamp(length(mw), 0.0, 1.5);
    p -= mw * 0.04 * smoothstep(0.05, 0.4, pullMag);

    // Held-keys: any held key inflates the star slightly + adds a cream
    // wash to the body (per-key palette nudge). Keys also tilt the
    // rotation by a small per-key phase offset so each key reads visibly.
    float anyKey = 0.0;
    float keyTilt = 0.0;
    for (int k = 0; k < 15; k++) {
        float env = u_keys[k] + u_key_event[k] * 0.5;
        anyKey = max(anyKey, env);
        keyTilt += env * (float(k) - 7.0) * 0.012;  // each key tilts differently
    }

    // Apply per-key rotation tilt (after the cursor pull so the cursor still
    // reads). Small enough not to fight the bar rotation.
    float cb = cos(keyTilt), sb = sin(keyTilt);
    p = mat2(cb, -sb, sb, cb) * p;

    // Star scale: base_radius modulated by bass + downbeat impulse,
    // squeezed by pre-tension as a section change approaches, inflated by
    // any held key.
    float preTension = 1.0 - smoothstep(0.0, 10.0, toSect);
    float scale = base_radius
                * (1.0 + 0.15 * bass + 0.18 * dbeat + 0.12 * anyKey)
                * mix(1.0, 0.72, preTension);

    // Star body (filled).
    float d  = sd8Star(p, scale);
    float starMask = smoothstep(rim_softness, -rim_softness, d);

    // Bright cream RIM at the star edge — the actual eye-catcher. A thin band
    // around d=0 reads as a gilded outline against the dark ground.
    float rimMask = smoothstep(RIM_W, 0.0, abs(d));

    // Inner square ring (the courtyard within the star).
    float innerScale = scale * 0.42;
    float ringW = scale * 0.020;
    float dRing = sdSquareRing(p, innerScale, ringW);
    float ringMask = smoothstep(rim_softness * 1.4, 0.0, abs(dRing));

    // Petal-tip glow at the 8 star points (where the points project past the
    // body). u_audio_high enriches them — these are the petal-bloom hooks.
    float r = length(p);
    float ang8 = atan(p.y, p.x);
    float ang8Sector = mod(ang8, PI * 0.25) - PI * 0.125;
    // tips occur at angles 0, π/4, π/2, ... — distance to nearest tip axis
    float tipDist = abs(ang8Sector);
    float tipBand = smoothstep(0.18, 0.0, tipDist) * smoothstep(scale * 0.8, scale * 1.05, r);
    float tipBoost = tipBand * (0.35 + 0.65 * u_audio_high);

    // Section-driven palette: alternate ember/gold every section_id,
    // gentle song-progress ramp inside each family for the slow drift.
    bool isMinorish = (u_section_id % 2) == 1;
    float tint = 0.30 + 0.45 * fract(gprog * 1.3);  // slow drift through family
    vec3 starCol = isMinorish ? ember_family(tint) : gold_family(tint);

    // Inner ring is always the cream-edge highlight — a single warm constant
    // visible against either family. Frames the courtyard.
    vec3 ringCol = vec3(1.00, 0.85, 0.55);

    // u_below fallback: if there's nothing beneath (bottom-layer test), use
    // near-black so we don't sample garbage.
    vec3 below = texture(u_below, gl_FragCoord.xy / u_resolution).rgb;
    if (dot(below, vec3(1.0)) < 0.01) below = vec3(0.04, 0.02, 0.0);

    // Held-key wash: blend toward cream when any key is held.
    starCol = mix(starCol, vec3(1.00, 0.90, 0.65), anyKey * 0.35);

    // Body is a DIM ember version of starCol (gilded metal in candle-light);
    // the bright RIM is the eye-catcher.
    vec3 bodyCol = starCol * 0.55;

    vec3 col = below;
    col = mix(col, bodyCol, starMask);
    col = mix(col, ringCol, rimMask);                 // bright cream rim
    col = mix(col, ringCol, ringMask * 0.85);         // inner courtyard square
    col += starCol * tipBoost * 0.7;

    // Post-section flash: just after the snap, brighten briefly so the
    // recapitulation is unmissable.
    float postFlash = (1.0 - smoothstep(0.0, 0.08, sprog)) * float(playing > 0.5);
    col += vec3(1.00, 0.78, 0.45) * postFlash * starMask * 0.35;

    // Frame-0 ramp — don't trust u_below until a few frames in.
    float warmup = smoothstep(0.0, 1.0, float(u_frame) / 30.0);
    col = mix(bodyCol * starMask + ringCol * (rimMask + ringMask * 0.85),
              col, warmup);

    // Soft Reinhard to keep peaks honest.
    col = col / (1.0 + col * 0.40);

    fragColor = vec4(col, 1.0);
}
