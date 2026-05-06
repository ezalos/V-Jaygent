#version 300 es
// ABOUTME: Motes layer for ocean piece — 96 bioluminescent specks drift slowly
// ABOUTME: through the water on a noise + low-freq audio swell. Cursor acts as
// ABOUTME: a vortex attractor (motes curl toward it); each held key emits a
// ABOUTME: radial burst of motes from its spawn point. Trails via u_history.
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_keys[15];
uniform float u_key_event[15];
uniform float u_audio_low;
uniform float u_audio_high;
uniform float u_audio_playing;
uniform float u_bar_phase;
uniform float u_downbeat;
uniform int   u_section_id;
uniform float u_section_progress;
uniform sampler2D u_history;
uniform int   u_frame;
out vec4 fragColor;

// hash21 inlined (per the ember-spark precedent — #include resolution
// is unreliable in 5+ layer stacks).
float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}
float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

vec2 keyPos(int i, float aspect) {
    bool isBlack = (i >= 9);
    float halfPositions[6] = float[6](0.5, 1.5, 3.5, 4.5, 5.5, 7.5);
    float pos = isBlack ? halfPositions[i - 9] : float(i);
    float x = (-0.45 + (pos / 8.0) * 0.90) * aspect;
    float y = isBlack ? -0.30 : -0.40;
    return vec2(x, y);
}

float diveDepth(int sid, float prog) {
    float curve[8] = float[8](0.10, 0.30, 0.50, 0.60, 0.70, 1.00, 0.40, 0.00);
    int   nid = clamp(sid + 1, 0, 7);
    int   cid = clamp(sid, 0, 7);
    return mix(curve[cid], curve[nid], clamp(prog, 0.0, 1.0));
}

// Compute a single mote's centred position at time t.
vec2 motePos(int i, float t, float aspect, vec2 mp, bool mouseEngaged,
             float lowDrive)
{
    float fi = float(i);
    // Base: random starting position + a slow lissajous orbit so motes wander.
    float seedX = hash11(fi * 1.31);
    float seedY = hash11(fi * 2.71 + 17.0);
    float orbitRate = 0.18 + 0.22 * hash11(fi * 5.7);
    float ph        = fi * 1.873;
    vec2 base = vec2(
        (seedX - 0.5) * 1.50 * aspect + 0.18 * sin(t * orbitRate + ph),
        (seedY - 0.5) * 0.92            + 0.16 * cos(t * (orbitRate * 0.83) + ph * 1.7)
    );
    // Slow upward drift (rising bubbles) modulated by low-freq audio swell.
    float rise = 0.06 + 0.18 * lowDrive;
    base.y += mod(t * rise + seedY, 1.10) - 0.55;

    // Cursor vortex attraction — motes spiral inward toward the cursor with
    // a gentle tangential bias (clockwise) so the field swirls.
    if (mouseEngaged) {
        vec2 d  = mp - base;
        float r2 = dot(d, d) + 0.04;
        float pull = 0.55 * exp(-r2 * 1.4) / r2;
        // Radial pull
        base += d * pull * 0.20;
        // Tangential bias for swirl
        vec2 tang = vec2(-d.y, d.x);
        base += tang * pull * 0.12;
    }

    // Keyboard bursts — held keys eject motes radially from their spawn point.
    // Each mote samples its assigned key (i % 15) so all keys participate.
    int ki = i - 15 * (i / 15);   // i mod 15 (GLSL ES doesn't have %)
    float env = u_keys[ki];
    if (env > 0.001) {
        vec2 kp = keyPos(ki, aspect);
        float age   = 1.0 - env;
        // Direction = a hash-derived angle so each mote ejects on its own ray.
        float ang   = hash11(fi * 0.617) * 6.28318;
        vec2 dir    = vec2(cos(ang), sin(ang));
        float reach = age * (ki >= 9 ? 1.10 : 0.85);
        base = mix(base, kp + dir * reach, env);
    }

    return base;
}

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p  = (uv - 0.5) * vec2(aspect, 1.0);

    bool mouseIdle = u_mouse.x < 1.0 && u_mouse.y < 1.0;
    bool mouseEngaged = !mouseIdle;
    vec2 mp = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);

    float lowDrive = mix(0.30 + 0.20 * sin(u_time * 0.5), u_audio_low,  u_audio_playing);
    float highDrv  = mix(0.20 + 0.15 * sin(u_time * 1.7), u_audio_high, u_audio_playing);

    // Accumulate point-spread contributions from all motes.
    vec3 accum = vec3(0.0);
    const int N = 96;
    for (int i = 0; i < N; i++) {
        float fi = float(i);
        vec2 q = motePos(i, u_time, aspect, mp, mouseEngaged, lowDrive);

        // Per-mote brightness pulse so the field twinkles even at silence.
        float twinkleRate = 0.6 + 1.6 * hash11(fi * 9.13);
        float twinkleOff  = hash11(fi * 11.17) * 6.28318;
        float twinkle     = 0.55 + 0.45 * sin(u_time * twinkleRate + twinkleOff);

        float r = length(p - q);
        // Sharp core + soft halo. Halo widens with audio_high.
        float core = exp(-r * 280.0);
        float halo = exp(-r * (38.0 - 14.0 * highDrv));

        // Cool blue→cyan tint by per-mote hue offset; black-key motes get a
        // warm gold tint so keyboard bursts read distinct from drifting motes.
        int ki = i - 15 * (i / 15);
        bool isBlack = (ki >= 9);
        float keyEnv = u_keys[ki];
        vec3 cool = vec3(0.55, 0.95, 1.20);
        vec3 warm = vec3(1.30, 0.95, 0.55);
        vec3 tint = mix(cool, warm, isBlack ? keyEnv * 0.85 : 0.0);

        float intensity = (core + halo * 0.18) * twinkle;
        accum += tint * intensity;
    }

    // Section gating: motes thin out in deep sections (we're far below them)
    // and bloom at the surfacing breach.
    float depth = diveDepth(u_section_id, u_section_progress);
    float density = mix(1.0, 0.45, depth);
    accum *= density;

    // Wave-break flash at section 5 — brief mote bloom on the climax peak.
    if (u_section_id == 5) {
        float bloom = exp(-u_section_progress * 8.0) * 0.6;
        accum += vec3(0.40, 0.85, 1.10) * bloom * 0.4;
    }

    // Trails via u_history. Frame-0 protection: ramp the feedback in over
    // the first 30 frames so the clear-colour buffer doesn't ghost.
    vec3 hist = vec3(0.0);
    if (u_frame > 0) {
        // Slight upward drift on the trail so motes leave rising tails.
        vec2 driftUv = uv + vec2(0.0, -0.0006);
        hist = texture(u_history, driftUv).rgb * 0.90;
        float fadeIn = smoothstep(0.0, 30.0, float(u_frame));
        hist *= fadeIn;
    }

    vec3 col = max(accum, hist);

    // Soft tonemap so very-bright additive overlap doesn't blow out.
    col = col / (1.0 + col * 0.55);

    float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
    fragColor = vec4(col, a);
}
