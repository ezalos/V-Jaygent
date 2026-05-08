#version 300 es
// ABOUTME: Fire-eyes — N drifting wells that warm-lens u_below. Each well
// ABOUTME: sucks pillars and sky into a vortex; bright fire core at each
// ABOUTME: well's centre. Cursor adds a 5th, stronger well so the user can
// ABOUTME: drag the firestorm. Downbeat pulse-expands all wells.
precision highp float;

#define PI  3.14159265
#define TAU 6.2831853

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform sampler2D u_below;
uniform sampler2D u_history;

uniform float u_audio_playing;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;
uniform float u_audio_kick;

uniform float u_bar_phase;
uniform float u_beat_phase;
uniform float u_downbeat;

uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_song_progress;
uniform float u_energy_smooth;

out vec4 fragColor;

const int N_HOLES = 4;

vec2 holePull(vec2 p, vec2 c, float s) {
    vec2  d  = p - c;
    float r2 = dot(d, d) + 0.012;
    return -d * s / r2;
}

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2  uv     = gl_FragCoord.xy / u_resolution;
    vec2  p      = (uv - 0.5) * vec2(aspect, 1.0);

    bool  mIdle  = u_mouse.x < 1.0 && u_mouse.y < 1.0;
    vec2  mp     = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);

    float playing = u_audio_playing;
    float bass    = mix(0.30 + 0.18 * sin(u_time * 0.61), u_audio_bass, playing);
    float mid     = mix(0.20, u_audio_mid, playing);
    float high    = mix(0.0, u_audio_high, playing);

    // Per-section well strength + count: calm sections have 0–1 wells,
    // peaks have all 4. The single largest factor in making sections look
    // visually different.
    float secStr[8]   = float[8](0.20, 0.55, 0.95, 0.40, 1.40, 0.85, 0.30, 0.0);
    float secCount[8] = float[8](1.0,  2.0,  3.0,  1.5,  4.0,  3.0,  1.0,  0.0);
    int   sid         = clamp(u_section_id, 0, 7);
    int   nid         = clamp(sid + 1, 0, 7);
    float spS         = smoothstep(0.0, 1.0, u_section_progress);
    float secMul      = mix(secStr[sid],   secStr[nid],   spS);
    float wellCountF  = mix(secCount[sid], secCount[nid], spS);

    // Early-out for outro/calm sections — pass through u_below + history fade
    if (secMul < 0.05) {
        vec3 below = texture(u_below, uv).rgb;
        vec3 hist  = texture(u_history, uv).rgb * 0.84;
        fragColor = vec4(max(below, hist), 1.0);
        return;
    }

    // Four wells on coprime slow orbits
    float t = u_time * 0.45;
    vec2 holes[5];
    holes[0] = 0.42 * vec2(cos(t * 0.21      ), sin(t * 0.13       ));
    holes[1] = 0.36 * vec2(cos(t * 0.31 + 1.7), sin(t * 0.21 + 0.9));
    holes[2] = 0.28 * vec2(cos(t * 0.13 + 3.1), sin(t * 0.31 + 2.2));
    holes[3] = 0.50 * vec2(cos(t * 0.07 + 5.0), sin(t * 0.11 + 1.4));
    for (int i = 0; i < N_HOLES; i++) holes[i].y += 0.08;
    holes[4] = mp;

    // Per-well activation: well i is active if its index < wellCountF, with
    // fade-in for the fractional part. So as wellCountF crosses 2 → 3,
    // the third well fades in.
    float wellActive[N_HOLES];
    for (int i = 0; i < N_HOLES; i++) {
        wellActive[i] = clamp(wellCountF - float(i), 0.0, 1.0);
    }

    // Aggregate UV displacement
    float strength = (0.020 + 0.022 * bass) * secMul;
    vec2 disp = vec2(0.0);
    for (int i = 0; i < N_HOLES; i++) {
        disp += holePull(p, holes[i], strength * wellActive[i]);
    }
    if (!mIdle) disp += holePull(p, holes[4], strength * 1.6);

    // Downbeat: lensing strength briefly DOUBLES
    disp *= 1.0 + u_downbeat * 1.2;

    // Sample u_below at lensed UV
    vec3 col = texture(u_below, uv + disp).rgb;

    // Bright fire core at each ACTIVE well — warm, not dark.
    float coreAcc = 0.0;
    for (int i = 0; i < N_HOLES; i++) {
        float r = length(p - holes[i]);
        coreAcc = max(coreAcc, smoothstep(0.06, 0.0, r) * wellActive[i]);
    }
    if (!mIdle) {
        float r = length(p - holes[4]);
        coreAcc = max(coreAcc, smoothstep(0.05, 0.0, r) * 1.2);
    }
    col += vec3(1.40, 0.85, 0.45) * coreAcc * (0.55 + 0.55 * bass) * secMul;

    // Bright accretion-disc rim around each ACTIVE well
    for (int i = 0; i < N_HOLES; i++) {
        float r = length(p - holes[i]);
        float rim = 1.0 - smoothstep(0.0, 0.012, abs(r - 0.075));
        col += vec3(1.10, 0.45, 0.10) * rim * 0.55 * (0.4 + 0.55 * mid)
             * secMul * wellActive[i];
    }
    if (!mIdle) {
        float r = length(p - holes[4]);
        float rim = 1.0 - smoothstep(0.0, 0.014, abs(r - 0.080));
        col += vec3(1.30, 0.65, 0.20) * rim * 0.85;
    }

    // Pulse on each downbeat — only on ACTIVE wells
    if (u_downbeat > 0.05) {
        for (int i = 0; i < N_HOLES; i++) {
            float r = length(p - holes[i]);
            float pulse = u_downbeat * smoothstep(0.20, 0.05, r) * wellActive[i];
            col += vec3(0.85, 0.35, 0.10) * pulse * 0.55;
        }
    }

    // History feedback — lensed pattern smears into a swirling tail as
    // wells drift, making the eye read "rotating firestorm".
    vec3 hist = texture(u_history, uv - disp * 0.5).rgb * 0.84;
    col = max(col, hist);

    // Cap so we don't blow out
    col = min(col, vec3(1.40));

    fragColor = vec4(col, 1.0);
}
