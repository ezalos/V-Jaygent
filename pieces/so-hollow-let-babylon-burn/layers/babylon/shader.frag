#version 300 es
// ABOUTME: Babylon — N upright pillars, hollow & burning. Per-section stage
// ABOUTME: configuration (count, lean, fire, chaos, height-spread); camera
// ABOUTME: tilts on bar-phase; beat snaps cracks shut/open; section
// ABOUTME: transitions fire a horizontal shockwave; downbeat shakes the row.
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

// ----- Per-section stage config -----
// Smoothly interpolated between sections via u_section_progress.
// 0=intro, 1=build, 2=peak1, 3=dip, 4=PEAK2, 5=cool, 6=fade-low, 7=outro
float secCount(int s)  { float v[8] = float[8]( 6.0,  8.0, 10.0,  8.0, 12.0, 10.0,  8.0,  7.0); return v[clamp(s,0,7)]; }
float secLean(int s)   { float v[8] = float[8]( 0.00, 0.05, 0.12, 0.06, 0.20, 0.14, 0.08, 0.04); return v[clamp(s,0,7)]; }
float secFire(int s)   { float v[8] = float[8]( 0.55, 0.70, 0.95, 0.60, 1.30, 0.85, 0.55, 0.40); return v[clamp(s,0,7)]; }
float secChaos(int s)  { float v[8] = float[8]( 0.05, 0.18, 0.40, 0.22, 0.85, 0.55, 0.30, 0.15); return v[clamp(s,0,7)]; }
float secSway(int s)   { float v[8] = float[8]( 0.40, 0.85, 1.50, 0.80, 2.30, 1.60, 1.00, 0.55); return v[clamp(s,0,7)]; }
float secCamY(int s)   { float v[8] = float[8](-0.04, 0.00, 0.04,-0.02, 0.08, 0.02,-0.02,-0.04); return v[clamp(s,0,7)]; }
float secZoom(int s)   { float v[8] = float[8]( 1.05, 1.00, 0.96, 1.02, 0.88, 0.94, 1.00, 1.06); return v[clamp(s,0,7)]; }
float secLeanDir(int s){ float v[8] = float[8]( 1.0, -1.0,  1.0, -1.0,  1.0,  1.0, -1.0,  1.0); return v[clamp(s,0,7)]; }

// Smooth interpolation between section S and S+1 by u_section_progress.
float secF(int s, float p, float v0, float v1) { return mix(v0, v1, smoothstep(0.0, 1.0, p)); }

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2  uv     = gl_FragCoord.xy / u_resolution;
    vec2  p0     = (uv - 0.5) * vec2(aspect, 1.0);

    bool  mIdle  = u_mouse.x < 1.0 && u_mouse.y < 1.0;
    vec2  mp     = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);

    float playing = u_audio_playing;
    float bass    = mix(0.30 + 0.18 * sin(u_time * 0.61),    u_audio_bass, playing);
    float mid     = mix(0.20 + 0.15 * sin(u_time * 1.27 + 1.7), u_audio_mid,  playing);
    float high    = mix(0.0,                                 u_audio_high, playing);
    float kick    = mix(0.0,                                 u_audio_kick, playing);

    int   sid     = u_section_id;
    int   nid     = clamp(sid + 1, 0, 7);
    float sp      = u_section_progress;

    float Nf      = secF(sid, sp, secCount(sid), secCount(nid));
    int   N       = clamp(int(round(Nf)), 4, 16);
    float leanA   = secF(sid, sp, secLean(sid),  secLean(nid));
    float fireMul = secF(sid, sp, secFire(sid),  secFire(nid));
    float chaos   = secF(sid, sp, secChaos(sid), secChaos(nid));
    float swayMul = secF(sid, sp, secSway(sid),  secSway(nid));
    float camY    = secF(sid, sp, secCamY(sid),  secCamY(nid));
    float zoom    = secF(sid, sp, secZoom(sid),  secZoom(nid));
    float leanDir = secF(sid, sp, secLeanDir(sid), secLeanDir(nid));

    // ----- Camera transform -----
    // Bar phase rocks the world; downbeat thumps it; cursor pans horizontally.
    float camTilt = 0.04 * sin(u_bar_phase * 2.0 * PI) * swayMul
                  + 0.06 * u_downbeat * leanDir
                  + 0.04 * (chaos - 0.3);
    float camPanX = mIdle ? 0.0 : -mp.x * 0.18;

    vec2  p = p0;
    p.y    -= camY;
    p     *= zoom;
    p.x   += camPanX;

    // Tilt rotation
    float cs = cos(camTilt), sn = sin(camTilt);
    p = mat2(cs, -sn, sn, cs) * p;

    // ----- Pillar layout -----
    float spacing = aspect / float(N);
    float xLocal  = p.x + aspect * 0.5;
    float pIdxF   = xLocal / spacing - 0.5;
    int   ti      = clamp(int(floor(pIdxF + 0.5)), 0, N - 1);

    float towerSeed = hash21(vec2(float(ti) * 1.731, 0.421));
    float xCenter   = -aspect * 0.5 + (float(ti) + 0.5) * spacing;

    // ----- Lean (shear with y) -----
    // Pillars lean in a direction that flips per section; lean amount grows
    // with chaos. baseY = bottom anchor.
    float baseY     = -0.46;
    float yShearN   = clamp((p.y - baseY) / 0.95, 0.0, 1.4);   // 0 at base
    float pillarLean = leanA * leanDir * (0.5 + 0.5 * (towerSeed - 0.5)) * yShearN;
    xCenter        += pillarLean;

    // ----- Sway (bar/beat phase + per-pillar offset) -----
    float swayBar = 0.020 * swayMul * sin(u_bar_phase  * 2.0 * PI + float(ti) * 1.7);
    float swayBeat = 0.012 * swayMul * sin(u_beat_phase * 2.0 * PI * 2.0 + float(ti) * 0.9)
                   * (0.4 + 0.7 * kick);
    float swayBass = 0.014 * bass * sin(float(ti) * 2.3 + u_time * 0.6);
    xCenter += swayBar + swayBeat + swayBass;

    float dx = p.x - xCenter;

    // ----- Pillar height — varies per pillar AND per section (chaos breaks tops) -----
    float topBase = 0.42 - 0.18 * towerSeed;
    float topJag  = chaos * (0.30 * (towerSeed - 0.5) + 0.18 * sin(float(ti) * 2.7));
    float topY    = topBase + topJag;

    float yt = clamp((p.y - baseY) / max(topY - baseY, 1e-3), 0.0, 1.0);

    float widBase = 0.040 + 0.012 * bass + 0.014 * (towerSeed - 0.5);
    float widTop  = 0.020 + 0.004 * bass;
    float width   = mix(widBase, widTop, yt);

    // Beat snap — pillars contract briefly on every beat (visible phase lock).
    float beatSnap = smoothstep(0.0, 0.12, 1.0 - u_beat_phase);
    width *= 1.0 - 0.08 * beatSnap * swayMul * 0.5;

    float pillarMask = smoothstep(width + 0.004, width - 0.004, abs(dx))
                     * smoothstep(baseY - 0.005, baseY + 0.005, p.y)
                     * smoothstep(topY  + 0.005, topY  - 0.005, p.y);

    // Top erosion grows with chaos: at peak, tops are jagged.
    float topEdge = (topY - p.y) / 0.10;
    if (topEdge < 1.5) {
        float erode = vnoise(vec2(float(ti) * 5.0 + p.x * 8.0, u_time * 0.10 + float(ti)));
        float erodeT = mix(0.30, -0.15, chaos);
        pillarMask *= smoothstep(erodeT, erodeT + 0.55, erode + topEdge * 0.6);
    }

    // ----- Cracks -----
    float dxN       = dx / max(width, 1e-3);
    float seamPhase = float(ti) * 1.7 + u_time * 0.32;
    float crackBase = sin(p.y * 32.0 + seamPhase) * 0.5 + 0.5;
    float crackMod  = vnoise(vec2(p.y * 4.5 + float(ti) * 2.7, float(ti) * 1.31));
    float crackJit  = vnoise(vec2(dxN * 1.2 + float(ti), p.y * 6.0));
    float crackPattern = crackBase * mix(0.55, 1.0, crackMod) * mix(0.85, 1.0, crackJit);
    float crackThresh  = 0.82 - 0.06 * u_energy_smooth - 0.04 * mid - 0.03 * sp - 0.06 * chaos;
    // Beat snaps cracks open briefly on every beat for visible phase lock.
    crackThresh -= 0.05 * beatSnap;
    float crack        = smoothstep(crackThresh - 0.025, crackThresh + 0.020, crackPattern);

    int   kbi      = int(mod(float(ti) * 17.0 + 3.0, 15.0));
    float keyEnv   = u_keys[kbi];
    float keyEvent = u_key_event[kbi];

    float cursorBoost = 0.0;
    if (!mIdle) {
        float cdx = abs(mp.x - xCenter);
        cursorBoost = exp(-cdx * cdx * 28.0) * (0.30 + 0.55 * smoothstep(0.0, 0.45, abs(mp.y)));
    }

    // ----- Compose pillar body -----
    float course = 0.5 + 0.5 * sin(p.y * 90.0 - float(ti) * 1.3);
    vec3  silhouette = vec3(0.022, 0.012, 0.014)
                     + vec3(0.030, 0.012, 0.009) * course * (1.0 - yt * 0.4);

    vec3 firePalette = vec3(0.95, 0.38, 0.10);
    vec3 fireBright  = vec3(1.40, 0.95, 0.55);
    float fireT      = clamp(0.20 + 0.35 * bass + 0.55 * keyEnv + 0.25 * cursorBoost
                              + 0.30 * u_energy_smooth, 0.0, 1.0);
    vec3 fire        = mix(firePalette, fireBright, fireT);
    fire            *= (0.55 + 0.35 * bass + 0.35 * keyEnv + 0.25 * u_energy_smooth) * fireMul;
    fire            += vec3(0.25, 0.10, 0.03) * cursorBoost;

    float crackBoost = clamp(crack * (0.55 + 0.50 * keyEnv + 0.45 * cursorBoost), 0.0, 1.0);

    vec3 below      = texture(u_below, uv).rgb;
    vec3 pillarBody = mix(silhouette, fire, crackBoost);
    vec3 col        = mix(below, pillarBody, pillarMask);

    // ----- Phase-lock receipts -----

    // Bar shockwave: a bright vertical sweep travels across screen each bar.
    float sweepX     = (u_bar_phase * 2.0 - 1.0) * (aspect * 0.55);
    float sweepDist  = abs(p.x - sweepX);
    float sweep      = exp(-sweepDist * sweepDist * 60.0)
                     * smoothstep(0.55, 0.10, abs(p.y - 0.05))
                     * (0.20 + 0.50 * bass) * swayMul * 0.45;
    col += vec3(0.95, 0.45, 0.15) * sweep;

    // Downbeat row-flash: every pillar's BASE briefly glows on downbeat.
    float baseStripe = smoothstep(-0.30, -0.46, p.y) * step(0.001, pillarMask);
    col += vec3(0.45, 0.18, 0.05) * u_downbeat * baseStripe * 0.85;

    // Section-transition fissure — 3.0s before a section change AND just
    // after, a vertical white-hot fissure splits the screen at a per-section
    // x position. ANNOUNCES the section boundary.
    float toChange = u_to_section_change;
    float preFire  = 1.0 - smoothstep(0.0, 2.5, max(toChange, 0.0));
    float postFire = 1.0 - smoothstep(0.0, 0.10, sp);
    float boundary = max(preFire * 0.6, postFire);
    if (boundary > 0.005) {
        float fissureX = (towerSeed * 2.0 - 1.0) * aspect * 0.30
                       + 0.10 * sin(float(sid) * 1.7);
        float fdx = abs(p.x - fissureX);
        float fissure = exp(-fdx * fdx * 240.0) * smoothstep(0.55, -0.40, abs(p.y));
        col += vec3(1.50, 0.95, 0.55) * fissure * boundary;
        // The fissure also brightens cracks in the surrounding area during transition.
        col += fire * 0.25 * exp(-fdx * fdx * 20.0) * boundary * pillarMask;
    }

    // Fresh key press: bright vertical streak up the spine of the owning pillar
    if (pillarMask > 0.001 && keyEvent > 0.001) {
        float spine  = exp(-dx * dx * 900.0);
        float upRamp = smoothstep(baseY, topY, p.y);
        col += vec3(1.45, 0.92, 0.55) * spine * upRamp * keyEvent;
    }

    // Cymbal sparkle along crack edges
    float sparkle = high * smoothstep(0.55, 0.60, crackPattern) * pillarMask;
    col += vec3(0.70, 0.35, 0.10) * sparkle * 0.40;

    fragColor = vec4(col, 1.0);
}
