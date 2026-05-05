#version 300 es
// ABOUTME: Godrays layer for ocean piece — vertical light cones piercing down
// ABOUTME: from above, refracted by a locally-recomputed copy of the surface
// ABOUTME: ripple field (so cursor stirs visibly bend the rays). Rays dim with
// ABOUTME: dive depth and double/stutter at the climax (section 5).
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_keys[15];
uniform float u_audio_high;
uniform float u_audio_playing;
uniform float u_bar_phase;
uniform float u_downbeat;
uniform int   u_section_id;
uniform float u_section_progress;
uniform sampler2D u_below;
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

float ring(vec2 p, vec2 c, float radius, float amp, float freq, float bandWidth) {
    float r = length(p - c);
    float w = abs(r - radius);
    return amp * exp(-w * bandWidth) * cos((r - radius) * freq);
}

// Locally-recomputed ripple-field height — duplicated from surface-ripples
// because #include resolution is unreliable across 3+ stacked layers (per
// the ember-spark comment). Used only to perturb ray x-positions.
float rippleHeight(vec2 p, vec2 mp, bool mouseIdle, float aspect) {
    float h = 0.0;
    if (!mouseIdle) {
        float r = length(p - mp);
        float g = exp(-r * r * 18.0);
        float w = sin(r * 30.0 - u_time * 4.0);
        h += g * w * 0.35;
    }
    {
        float bp = u_bar_phase;
        float radius = bp * 1.3;
        float amp    = exp(-bp * 3.2) * 0.55;
        h += ring(p, vec2(0.0), radius, amp, 28.0, 18.0);
    }
    for (int i = 0; i < 15; i++) {
        float env = u_keys[i];
        if (env < 0.001) continue;
        bool isBlack = (i >= 9);
        vec2 kp = keyPos(i, aspect);
        float age   = 1.0 - env;
        float radius= age * (isBlack ? 1.00 : 0.85);
        float amp   = env * env * (isBlack ? 0.65 : 0.45);
        float freq  = isBlack ? 36.0 : 26.0;
        float band  = isBlack ? 14.0 : 18.0;
        h += ring(p, kp, radius, amp, freq, band);
    }
    return h;
}

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p  = (uv - 0.5) * vec2(aspect, 1.0);

    bool mouseIdle = u_mouse.x < 1.0 && u_mouse.y < 1.0;
    vec2 mp = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);

    // Compute local ripple height + a numerical x-derivative for refraction.
    float eps = 0.005;
    float h0 = rippleHeight(p,                   mp, mouseIdle, aspect);
    float hx = rippleHeight(p + vec2(eps, 0.0),  mp, mouseIdle, aspect);
    float dhdx = (hx - h0) / eps;

    // Self-play synthetic high-driver when no audio.
    float highDrive = mix(0.25 + 0.20 * sin(u_time * 1.7 + 1.3), u_audio_high, u_audio_playing);

    float depth = diveDepth(u_section_id, u_section_progress);

    // 7 vertical bands at fixed x-positions, plus a "doubled stutter" at the
    // climax that spawns 7 additional offset rays.
    bool climax = (u_section_id == 5);

    vec3 col = vec3(0.0);
    int N = climax ? 14 : 7;

    for (int i = 0; i < 14; i++) {
        if (i >= N) break;
        float fi    = float(i);
        // Base x — staggered across (-0.7, 0.7) * aspect
        float baseX = (-0.7 + (fi + 0.5) / float(N) * 1.4) * aspect;
        // Slight time-drift so each ray sways gently
        float sway  = 0.04 * sin(u_time * (0.20 + 0.05 * fi) + fi);
        // Refraction by ripple-field x-gradient — visible cursor influence
        float refr  = 0.18 * dhdx;
        // Climax stutter: every other ray jitters with a quick snap on downbeats
        float jitter = (climax && (i % 2 == 1)) ? 0.05 * u_downbeat : 0.0;

        float xCenter = baseX + sway + refr + jitter;
        float xd = abs(p.x - xCenter);

        // Cone: wider band that narrows only modestly toward the bottom so
        // the rays read as visible columns of light, not pencils.
        // p.y range is roughly [-0.5, 0.5]; top is bright/wide.
        float topness  = smoothstep(-0.50, 0.50, p.y);              // 0 at bottom, 1 at top
        float yWeight  = 0.25 + 0.75 * topness;                     // never fully dark at bottom
        float coneWid  = mix(0.045, 0.13, topness);                 // wider top, still visible at bottom
        float band     = smoothstep(coneWid, 0.0, xd);

        // Per-ray brightness modulated by audio_high (the harmonic plinks)
        // and a slight offset hash so rays don't all flicker in unison.
        float pulseOff = fract(sin(fi * 12.9898) * 43758.5453);
        float pulse    = 0.7 + 0.3 * sin(u_time * 3.0 + pulseOff * 6.28);
        float bright   = (0.55 + 0.95 * highDrive) * pulse;

        col += vec3(1.000, 0.945, 0.760) * band * yWeight * bright;
    }

    // Warm-shift toward peak at climax
    if (climax) col *= mix(vec3(1.0), vec3(1.10, 0.95, 0.55), u_section_progress);

    // Dim with depth — at the bottom of the dive, rays are far above. Floor
    // at 0.40 so deep sections still see a hint of light from the surface.
    col *= mix(1.0, 0.40, depth);

    // Frame-0 / dead-u_below detection (per layer-engine smoke test contract).
    vec3 below = texture(u_below, uv).rgb;
    if (dot(below, vec3(1.0)) < 0.01) below = vec3(0.0);

    // Layer's contribution is purely additive (the engine handles blend mode);
    // emit RGB with alpha = perceived brightness so `add` plays cleanly.
    float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
    fragColor = vec4(col, a);
}
