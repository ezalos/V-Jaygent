#version 300 es
// ABOUTME: Fire-columns — vertical flame columns climbing up at each pillar
// ABOUTME: position. Bass drives height, mid drives width, cursor blows them
// ABOUTME: laterally. Vertical-flow vocabulary, NOT radial — distinct from
// ABOUTME: stronger's mirror-bloom. Per-section flame count tracks pillars.
precision highp float;

#define PI 3.14159265

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
float fbmGrid(vec2 p) {
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

uniform float u_keys[15];
uniform float u_key_event[15];

out vec4 fragColor;

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
    float bass    = mix(0.30 + 0.18 * sin(u_time * 0.61), u_audio_bass, playing);
    float mid     = mix(0.20 + 0.15 * sin(u_time * 1.27), u_audio_mid,  playing);
    float high    = mix(0.0, u_audio_high, playing);
    float kick    = mix(0.0, u_audio_kick, playing);

    int   N        = towerCountForSection(u_section_id);
    float Nf       = float(N);
    float spacing  = aspect / Nf;

    // Find nearest column (matching babylon's layout exactly so flames climb
    // the right pillars).
    float xLocal = p.x + aspect * 0.5;
    float pIdxF  = xLocal / spacing - 0.5;
    int   ti     = clamp(int(floor(pIdxF + 0.5)), 0, N - 1);
    float xCenter = -aspect * 0.5 + (float(ti) + 0.5) * spacing;
    float towerSeed = hash21(vec2(float(ti) * 1.731, 0.421));

    // Sway matching babylon (shared with bar phase + beat phase)
    float swayMul = mix(0.4, 2.3, u_energy_smooth);
    float sway    = 0.020 * swayMul * sin(u_bar_phase * 2.0 * PI + float(ti) * 1.7)
                  + 0.012 * swayMul * sin(u_beat_phase * 2.0 * PI * 2.0 + float(ti) * 0.9)
                    * (0.4 + 0.7 * kick);
    xCenter += sway;

    // Cursor blows flames laterally — closer cursor pushes harder
    float cursorPush = 0.0;
    if (!mIdle) {
        // Cursor x relative to column center, scaled by inverse distance
        float cdx = mp.x - xCenter;
        float cdy = abs(mp.y);
        cursorPush = cdx * 0.35 * exp(-cdy * 2.0);
    }

    float dx = p.x - xCenter;

    // ----- Per-section flame height -----
    // Sections 0/7 = small base flames only. Sections 2/4/5 = climbing high.
    float secHeight[8]   = float[8](0.20, 0.35, 0.65, 0.30, 0.95, 0.65, 0.30, 0.15);
    float secIntensity[8] = float[8](0.30, 0.45, 0.85, 0.40, 1.30, 0.90, 0.40, 0.20);
    int   sid = clamp(u_section_id, 0, 7);
    int   nid = clamp(sid + 1, 0, 7);
    float spS = smoothstep(0.70, 0.95, u_section_progress);
    float flameHeight    = mix(secHeight[sid],    secHeight[nid],    spS);
    float flameIntensity = mix(secIntensity[sid], secIntensity[nid], spS);

    // Per-key envelope: each pillar owns a key, key boost adds flame height
    int   kbi    = int(mod(float(ti) * 17.0 + 3.0, 15.0));
    float keyEnv = u_keys[kbi];

    // Flame anchor at pillar base (matches babylon's baseY = -0.46)
    float baseY = -0.46;

    // Vertical flame profile: tall thin column with flickering edges.
    // y normalized along flame: 0 at base, 1 at flame top
    float maxFlameTopY = mix(-0.20, 0.45, flameHeight + 0.55 * bass + 0.40 * keyEnv);
    float yt = (p.y - baseY) / max(maxFlameTopY - baseY, 1e-3);

    if (yt < 0.0 || yt > 1.0) { fragColor = vec4(0.0); return; }

    // Width tapers from base to top — wider at base
    float width = mix(0.045, 0.012, yt) * (0.85 + 0.30 * bass);

    // Lateral cursor push grows with height (top blows over more)
    float pushAtY = cursorPush * pow(yt, 1.5);
    float dxAdj   = dx - pushAtY;

    // Flame body shape: smoothstep on |dxAdj| against width with vertical-noise
    // jitter — gives the flickering flame edge.
    float jit  = vnoise(vec2(dxAdj * 12.0 + float(ti),
                             p.y * 16.0 - u_time * 6.0 + float(ti) * 3.7));
    float jit2 = vnoise(vec2(dxAdj * 4.0,
                             p.y * 6.0 - u_time * 2.5 + float(ti) * 1.3));
    float widJittered = width * mix(0.55, 1.10, jit) * mix(0.85, 1.10, jit2);

    float bodyMask = 1.0 - smoothstep(widJittered * 0.55, widJittered, abs(dxAdj));
    bodyMask *= smoothstep(0.0, 0.10, yt);  // fade in from base
    bodyMask *= 1.0 - smoothstep(0.85, 1.0, yt);  // fade out near top

    // Flame "tongues" — high-frequency upward-streaming noise that creates
    // licking-tongue motion
    float tongue = fbmGrid(vec2(dxAdj * 5.0 + float(ti) * 2.7,
                            p.y * 8.0 - u_time * 4.0 + float(ti)));
    float tongueMask = smoothstep(0.55, 0.78, tongue);
    tongueMask *= bodyMask;

    // Color: hot at base (white-yellow), orange middle, deep red top
    vec3 cBase = vec3(1.50, 1.10, 0.65);    // white-hot
    vec3 cMid  = vec3(1.30, 0.55, 0.15);    // ember orange
    vec3 cTop  = vec3(0.85, 0.20, 0.05);    // deep red
    vec3 col;
    if (yt < 0.4) {
        col = mix(cBase, cMid, smoothstep(0.0, 0.4, yt));
    } else {
        col = mix(cMid, cTop, smoothstep(0.4, 1.0, yt));
    }

    // Compose: body + tongue
    vec3 flame = col * bodyMask * (0.65 + 0.55 * bass + 0.50 * keyEnv);
    flame    += col * tongueMask * 0.60;
    flame    *= flameIntensity * (0.85 + 0.50 * u_energy_smooth);

    // Bass swell: base of flame brightens on every kick
    float baseFlash = exp(-yt * 6.0) * u_downbeat * 0.85;
    flame += vec3(1.50, 0.90, 0.40) * baseFlash * bodyMask;

    // History feedback so the flame leaves a brief upward smoke trail
    vec3 hist = texture(u_history, uv + vec2(0.0, 0.0)).rgb * 0.78;
    flame = max(flame, hist - 0.18);

    fragColor = vec4(flame, clamp(max(flame.r, max(flame.g, flame.b)), 0.0, 1.0));
}
