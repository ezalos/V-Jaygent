#version 300 es
// ABOUTME: Babylon — N upright pillars (a ruined city skyline), fire bleeding
// ABOUTME: through cracks. Bar-phase sways, keys strike & fracture, section
// ABOUTME: id grows the count, cursor blows heat into the nearest pillar.
precision highp float;

float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
    float v = 0.0, a = 0.55;
    for (int i = 0; i < 5; i++) {
        v += a * vnoise(p);
        p *= 2.0;
        a *= 0.55;
    }
    return v;
}

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform sampler2D u_below;

uniform float u_keys[15];
uniform float u_key_event[15];

uniform float u_audio_playing;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;
uniform float u_audio_kick;
uniform float u_audio_cymbal;

uniform float u_bar_phase;
uniform float u_beat_phase;
uniform float u_downbeat;

uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_to_section_change;
uniform float u_song_progress;
uniform float u_energy_smooth;

out vec4 fragColor;

#define PI 3.14159265

int towerCountForSection(int sid) {
    int n[8] = int[8](6, 8, 10, 8, 12, 10, 8, 7);
    return n[clamp(sid, 0, 7)];
}

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2  uv     = gl_FragCoord.xy / u_resolution;
    vec2  p      = (uv - 0.5) * vec2(aspect, 1.0);

    bool  mIdle  = u_mouse.x < 1.0 && u_mouse.y < 1.0;
    vec2  mp     = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);

    float playing = u_audio_playing;
    float bass    = mix(0.30 + 0.18 * sin(u_time * 0.61),    u_audio_bass, playing);
    float mid     = mix(0.20 + 0.15 * sin(u_time * 1.27 + 1.7), u_audio_mid,  playing);
    float high    = mix(0.0,                                 u_audio_high, playing);
    float kick    = mix(0.0,                                 u_audio_kick, playing);

    int   N       = towerCountForSection(u_section_id);
    float Nf      = float(N);
    float spacing = aspect / Nf;

    // Map x to nearest tower index
    float xLocal  = p.x + aspect * 0.5;             // 0..aspect
    float pIdxF   = xLocal / spacing - 0.5;
    int   ti      = clamp(int(floor(pIdxF + 0.5)), 0, N - 1);
    float xCenter = -aspect * 0.5 + (float(ti) + 0.5) * spacing;

    // Per-tower hash → height variance + width variance
    float towerSeed = hash21(vec2(float(ti) * 1.731, 0.421));

    // Sway: bar phase rocks pillars side-to-side, per-pillar phase offset
    float swayAmt = 0.012 + 0.014 * bass;
    float sway    = swayAmt * sin(u_bar_phase * 2.0 * PI + float(ti) * 1.7)
                  + 0.006   * sin(u_beat_phase * 2.0 * PI * 2.0 + float(ti)) * (0.4 + 0.6 * kick);
    xCenter      += sway;

    float dx = p.x - xCenter;

    // Pillar bounds
    float baseY = -0.46;
    float topY  = 0.42 - 0.16 * towerSeed - 0.04 * sin(float(ti) * 2.3 + u_time * 0.07);

    float yt = (p.y - baseY) / max(topY - baseY, 1e-3);
    yt = clamp(yt, 0.0, 1.0);

    // Width tapers slightly toward top — perspective + wear
    float widBase = 0.040 + 0.012 * bass + 0.010 * (towerSeed - 0.5);
    float widTop  = 0.022 + 0.005 * bass;
    float width   = mix(widBase, widTop, yt);

    // Tower mask — vertical slab between baseY and topY
    float pillarMask = smoothstep(width + 0.004, width - 0.004, abs(dx))
                     * smoothstep(baseY - 0.005, baseY + 0.005, p.y)
                     * smoothstep(topY  + 0.005, topY  - 0.005, p.y);

    // Top erosion — irregular silhouette at the very top edge
    float topEdge = (topY - p.y) / 0.08;
    if (topEdge < 1.5) {
        float erode = vnoise(vec2(float(ti) * 5.0 + p.x * 8.0, u_time * 0.10 + float(ti)));
        pillarMask *= smoothstep(0.0, 0.55, erode + topEdge * 0.6);
    }

    // ---------- Cracks ----------
    // Cracks are horizontal slits — high vertical frequency, slow horizontal
    // jitter — density grows with energy + section progress.
    float dxN       = dx / max(width, 1e-3);
    float seamPhase = float(ti) * 1.7 + u_time * 0.32;
    float crackBase = sin(p.y * 32.0 + seamPhase) * 0.5 + 0.5;
    float crackMod  = vnoise(vec2(p.y * 4.5 + float(ti) * 2.7, float(ti) * 1.31));
    float crackJit  = vnoise(vec2(dxN * 1.2 + float(ti), p.y * 6.0));
    float crackPattern = crackBase * mix(0.55, 1.0, crackMod) * mix(0.85, 1.0, crackJit);
    // Threshold stays tight (cracks don't dominate even at peak); brightness
    // is what scales with energy, not crack count.
    float crackThresh  = 0.82 - 0.06 * u_energy_smooth - 0.04 * mid - 0.03 * u_section_progress;
    float crack        = smoothstep(crackThresh - 0.025, crackThresh + 0.020, crackPattern);

    // Per-key envelope: each tower owns a key (mod 15), keyEvent is fresh press
    int   kbi      = int(mod(float(ti) * 17.0 + 3.0, 15.0));
    float keyEnv   = u_keys[kbi];
    float keyEvent = u_key_event[kbi];

    // Cursor "blows heat" into nearest pillar
    float cursorBoost = 0.0;
    if (!mIdle) {
        float cdx = abs(mp.x - xCenter);
        cursorBoost = exp(-cdx * cdx * 28.0) * (0.30 + 0.55 * smoothstep(0.0, 0.45, abs(mp.y)));
    }

    // ---------- Compose ----------
    // Silhouette: charcoal + faint horizontal striation (brick courses).
    float course = 0.5 + 0.5 * sin(p.y * 90.0 - float(ti) * 1.3);
    vec3  silhouette = vec3(0.022, 0.012, 0.014)
                     + vec3(0.030, 0.012, 0.009) * course * (1.0 - yt * 0.4);

    // Fire palette — independent of u_below, so we never amplify a bright sky
    // into white-out. Audio + key envelopes drive the heat ramp; brightness
    // also grows with energy so peak sections look hotter without widening
    // the cracks themselves.
    vec3 firePalette = vec3(0.95, 0.38, 0.10);
    vec3 fireBright  = vec3(1.35, 0.90, 0.50);
    float fireT      = clamp(0.20 + 0.35 * bass + 0.55 * keyEnv + 0.25 * cursorBoost
                              + 0.30 * u_energy_smooth, 0.0, 1.0);
    vec3 fire        = mix(firePalette, fireBright, fireT);
    fire            *= 0.55 + 0.35 * bass + 0.35 * keyEnv + 0.25 * u_energy_smooth;
    fire            += vec3(0.25, 0.10, 0.03) * cursorBoost;

    float crackBoost = clamp(crack * (0.55 + 0.50 * keyEnv + 0.45 * cursorBoost), 0.0, 1.0);

    // Inside-pillar = silhouette OR fire (depending on crack); outside =
    // pass-through. Single mix into u_below so opacity is correct everywhere.
    vec3 below       = texture(u_below, uv).rgb;
    vec3 pillarBody  = mix(silhouette, fire, crackBoost);
    vec3 col         = mix(below, pillarBody, pillarMask);

    // Fresh key press: bright vertical streak up the spine of the owning pillar
    if (pillarMask > 0.001 && keyEvent > 0.001) {
        float spine = exp(-dx * dx * 900.0);
        float upRamp = smoothstep(baseY, topY, p.y);
        col += vec3(1.45, 0.92, 0.55) * spine * upRamp * keyEvent;
    }

    // Downbeat thump — base of pillars flashes at every downbeat
    if (pillarMask > 0.001) {
        float baseGlow = u_downbeat * smoothstep(-0.30, -0.46, p.y);
        col += vec3(0.40, 0.16, 0.04) * baseGlow * 0.65;
    }

    // High-frequency cymbal sparkle along crack edges (only inside pillars)
    float sparkle = high * smoothstep(0.55, 0.60, crackPattern) * pillarMask;
    col += vec3(0.70, 0.35, 0.10) * sparkle * 0.40;

    fragColor = vec4(col, 1.0);
}
