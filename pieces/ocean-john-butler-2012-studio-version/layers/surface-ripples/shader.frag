#version 300 es
// ABOUTME: Surface-ripples layer for ocean piece — sum-of-sources 2D height
// ABOUTME: field. Sources: cursor vortex (continuous), 15 keys (white=soft cyan,
// ABOUTME: black=hard with shockwave tint), and a centre ripple keyed to bar
// ABOUTME: phase. Renders thin bright wavefronts.
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_keys[15];
uniform float u_key_event[15];
uniform float u_audio_high;
uniform float u_audio_playing;
uniform float u_bar_phase;
uniform float u_downbeat;
uniform int   u_section_id;
uniform float u_section_progress;
out vec4 fragColor;

const float PI = 3.14159265358979;

float diveDepth(int sid, float prog) {
    float curve[8] = float[8](0.10, 0.30, 0.50, 0.60, 0.70, 1.00, 0.40, 0.00);
    int   nid = clamp(sid + 1, 0, 7);
    int   cid = clamp(sid, 0, 7);
    return mix(curve[cid], curve[nid], clamp(prog, 0.0, 1.0));
}

vec2 keyPos(int i, float aspect) {
    bool isBlack = (i >= 9);
    float halfPositions[6] = float[6](0.5, 1.5, 3.5, 4.5, 5.5, 7.5);
    float pos = isBlack ? halfPositions[i - 9] : float(i);
    float x = (-0.45 + (pos / 8.0) * 0.90) * aspect;
    float y = isBlack ? -0.30 : -0.40;
    return vec2(x, y);
}

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p  = (uv - 0.5) * vec2(aspect, 1.0);

    bool mouseIdle = u_mouse.x < 1.0 && u_mouse.y < 1.0;
    vec2 mp = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);

    float h = 0.0;
    vec3  tint = vec3(0.0);

    // --- Cursor vortex: a tighter ring of waves and a gaussian halo around
    // the mouse. Strongly visible. Only fires when cursor is engaged.
    if (!mouseIdle) {
        float r  = length(p - mp);
        float g  = exp(-r * r * 14.0);
        float vortex = sin(r * 36.0 - u_time * 5.5) * exp(-r * 4.0);
        h       += vortex * 0.40 + g * 0.18;
        tint    += vec3(0.55, 0.92, 1.00) * (g + abs(vortex) * 0.35) * 0.30;
    }

    // --- Downbeat centre ripple: a single leading wavefront. Gated to be
    // inert in the first 5% of a bar so a paused-audio start doesn't park a
    // static dot at screen centre.
    if (u_bar_phase > 0.05) {
        float bp = u_bar_phase;
        float radius = bp * 1.1;
        float r      = length(p);
        float front  = 1.0 - smoothstep(0.0, 0.025, abs(r - radius));
        float amp    = exp(-bp * 2.0) * 0.16;
        h    += front * amp;
        tint += vec3(0.80, 0.95, 1.00) * front * amp * 0.35;
    }

    // --- Key sources: each key has a fixed spawn point at the bottom ---
    for (int i = 0; i < 15; i++) {
        float env = u_keys[i];
        if (env < 0.001) continue;

        bool isBlack = (i >= 9);
        vec2 kp = keyPos(i, aspect);
        float r = length(p - kp);
        float age   = 1.0 - env;
        float radius= age * (isBlack ? 1.00 : 0.85);
        float amp   = env * env * (isBlack ? 0.65 : 0.45);

        // Single leading wavefront per key (no infinite cosine rings).
        float front = 1.0 - smoothstep(0.0, 0.025, abs(r - radius));
        h    += front * amp;

        vec3 cw = vec3(0.55, 0.95, 1.00);
        vec3 cb = vec3(0.10, 0.35, 0.85);
        tint += (isBlack ? cb : cw) * front * amp * 0.40;
    }

    // Visible wavefronts where |h| crosses a threshold band.
    float wave = smoothstep(0.06, 0.14, abs(h));
    float crest = smoothstep(0.18, 0.26, abs(h));
    float visible = wave + crest * 0.6;

    // Self-play idle: when mouse + keys + audio are all silent, faint synthetic
    // stir keeps the layer alive but never centred.
    float keyAny = 0.0;
    for (int i = 0; i < 15; i++) keyAny = max(keyAny, u_keys[i]);
    if (mouseIdle && keyAny < 0.001 && u_audio_playing < 0.5) {
        float idle = 0.12 * sin(p.x * 11.0 + u_time * 0.7) * cos(p.y * 9.0 - u_time * 0.5);
        visible += smoothstep(0.05, 0.10, abs(idle)) * 0.35;
        tint    += vec3(0.40, 0.70, 0.95) * 0.18;
    }

    float depth = diveDepth(u_section_id, u_section_progress);
    float surfaceVis = mix(1.0, 0.25, depth);

    float foam = (u_section_id == 5) ? smoothstep(0.0, 0.4, u_section_progress) * 0.6 : 0.0;
    vec3 col = mix(vec3(0.55, 0.85, 1.00), vec3(1.0), foam) + tint;

    float shimmer = 0.4 * u_audio_high * crest;

    float intensity = (visible + shimmer) * surfaceVis;
    fragColor = vec4(col * intensity, intensity);
}
