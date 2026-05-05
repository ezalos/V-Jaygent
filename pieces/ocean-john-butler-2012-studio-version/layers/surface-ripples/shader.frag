#version 300 es
// ABOUTME: Surface-ripples layer for ocean piece — sum-of-sources 2D height
// ABOUTME: field. Sources: cursor stir (continuous), 15 keys (white=soft cyan,
// ABOUTME: black=hard with shockwave tint), and a centre ripple keyed to bar
// ABOUTME: phase so every downbeat is visible. Renders thin bright wavefronts.
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

// Single-source ring contribution. radius is the ring's current outer
// radius; amp is the source's current amplitude; freq is the spatial
// wavelength (high = tight ripples).
float ring(vec2 p, vec2 c, float radius, float amp, float freq, float bandWidth) {
    float r = length(p - c);
    float w = abs(r - radius);
    return amp * exp(-w * bandWidth) * cos((r - radius) * freq);
}

float diveDepth(int sid, float prog) {
    float curve[8] = float[8](0.10, 0.30, 0.50, 0.60, 0.70, 1.00, 0.40, 0.00);
    int   nid = clamp(sid + 1, 0, 7);
    int   cid = clamp(sid, 0, 7);
    return mix(curve[cid], curve[nid], clamp(prog, 0.0, 1.0));
}

// Key positions distributed along the bottom 25% of the screen.
// 9 white keys at y=0.10..0.18, 6 black keys slightly above at y=0.20..0.24.
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

    // Mouse in centred coords (matches p). u_mouse=(0,0) means idle.
    bool mouseIdle = u_mouse.x < 1.0 && u_mouse.y < 1.0;
    vec2 mp = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);

    float h = 0.0;          // accumulated height
    vec3  tint = vec3(0.0); // accumulated colour bias from sources

    // --- Cursor stir: continuous gaussian × sin centred at mouse ---
    if (!mouseIdle) {
        float r  = length(p - mp);
        float g  = exp(-r * r * 18.0);
        float w  = sin(r * 30.0 - u_time * 4.0);
        h       += g * w * 0.35;
        tint    += vec3(0.50, 0.85, 1.00) * g * 0.15;
    }

    // --- Downbeat centre ripple: a SINGLE leading wavefront, not concentric
    // rings. Keyed by u_bar_phase so the wave expands from centre across each
    // bar. Subtle — should read as a pulse, not the focal element.
    {
        float bp = u_bar_phase;
        float radius = bp * 1.1;
        float r      = length(p);
        float front  = smoothstep(0.030, 0.0, abs(r - radius));   // thin band only
        float amp    = exp(-bp * 2.4) * 0.18;                     // 3x quieter
        h    += front * amp;
        tint += vec3(0.80, 0.95, 1.00) * front * amp * 0.35;
    }

    // --- Key sources: each key has a fixed spawn point at the bottom ---
    for (int i = 0; i < 15; i++) {
        float env = u_keys[i];
        if (env < 0.001) continue;

        bool isBlack = (i >= 9);
        vec2 kp = keyPos(i, aspect);

        // Ripple radius grows as envelope decays. New press → small radius.
        float age      = 1.0 - env;
        float radius   = age * (isBlack ? 1.00 : 0.85);
        float amp      = env * env * (isBlack ? 0.65 : 0.45);
        float freq     = isBlack ? 36.0 : 26.0;
        float bandWid  = isBlack ? 14.0 : 18.0;

        h    += ring(p, kp, radius, amp, freq, bandWid);

        // White keys: cyan splash. Black keys: deep ultramarine kick.
        vec3 cw = vec3(0.55, 0.95, 1.00);
        vec3 cb = vec3(0.10, 0.35, 0.85);
        tint += (isBlack ? cb : cw) * amp * 0.30;
    }

    // --- Render: thin bright wavefronts where |h| crosses a threshold band ---
    float wave = smoothstep(0.10, 0.18, abs(h));    // outer band
    float crest = smoothstep(0.22, 0.30, abs(h));   // sharper crest within band
    float visible = wave + crest * 0.6;

    // Self-play idle: with no audio AND no mouse AND no keys, mix in a faint
    // synthetic stirring so the layer is never blank.
    float keyAny = 0.0;
    for (int i = 0; i < 15; i++) keyAny = max(keyAny, u_keys[i]);
    if (mouseIdle && keyAny < 0.001 && u_audio_playing < 0.5) {
        float idle = 0.15 * sin(p.x * 11.0 + u_time * 0.7) * cos(p.y * 9.0 - u_time * 0.5);
        visible += smoothstep(0.05, 0.10, abs(idle)) * 0.4;
        tint    += vec3(0.40, 0.70, 0.95) * 0.20;
    }

    // Surface (depth low) shows ripples brightly; deep (depth high) suppresses
    // them — at the bottom of the dive the surface is far above us.
    float depth = diveDepth(u_section_id, u_section_progress);
    float surfaceVis = mix(1.0, 0.25, depth);

    // Foam at climax: section 5 wave-break tints crest white.
    float foam = (u_section_id == 5) ? smoothstep(0.0, 0.4, u_section_progress) * 0.6 : 0.0;
    vec3 col = mix(vec3(0.55, 0.85, 1.00), vec3(1.0), foam) + tint;

    // Audio_high adds shimmer to crests — harmonic plinks sparkle the surface.
    float shimmer = 0.4 * u_audio_high * crest;

    float intensity = (visible + shimmer) * surfaceVis;
    fragColor = vec4(col * intensity, intensity);
}
