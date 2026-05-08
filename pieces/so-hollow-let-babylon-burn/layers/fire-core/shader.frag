#version 300 es
// ABOUTME: The burning wheel — counter-rotating fire-petal rings + downbeat
// ABOUTME: pulse rings + per-key fire-spikes + central core. Cursor centres
// ABOUTME: it; bass scales it; section_id cycles petal count (8/12/16); the
// ABOUTME: mesmerizing centrepiece pulled into the colonnade through pillar gaps.
precision highp float;

#define PI  3.14159265
#define TAU 6.2831853

float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
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
uniform float u_audio_cymbal;

uniform float u_bar_phase;
uniform float u_beat_phase;
uniform float u_downbeat;

uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_song_progress;
uniform float u_energy_smooth;
uniform float u_to_section_change;

uniform float u_keys[15];
uniform float u_key_event[15];

out vec4 fragColor;

// Petal gate: smooth N-fold rotational mask
float petalGate(float ang, int teeth, float toothSpan, float rot) {
    float wedge = TAU / float(teeth);
    float a = mod(ang + rot + 100.0 * TAU, wedge) - wedge * 0.5;
    return smoothstep(wedge * toothSpan * 0.55,
                      wedge * toothSpan * 0.40,
                      abs(a));
}

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2  uv     = gl_FragCoord.xy / u_resolution;
    vec2  p      = (uv - 0.5) * vec2(aspect, 1.0);

    bool  mIdle  = u_mouse.x < 1.0 && u_mouse.y < 1.0;
    vec2  mp     = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);
    if (!mIdle) p -= mp * 0.55;

    float playing = u_audio_playing;
    float bass    = mix(0.30 + 0.18 * sin(u_time * 0.61),    u_audio_bass, playing);
    float mid     = mix(0.20 + 0.15 * sin(u_time * 1.27 + 1.7), u_audio_mid,  playing);
    float high    = mix(0.0,                                 u_audio_high, playing);
    float kick    = mix(0.0,                                 u_audio_kick, playing);

    // ----- Per-section transformation -----
    // Scale: wheel is small/distant in calm sections, fills the frame at
    // peak 2, and goes silent in the outro. This is the single largest
    // factor in making each section read as a different stage.
    float secScale[8]  = float[8](0.45, 0.75, 1.05, 0.50, 1.55, 1.05, 0.40, 0.0);
    // Centre offset per section so the wheel is never in the same spot.
    vec2  secCenter[8] = vec2[8](
        vec2( 0.10,  0.02),
        vec2(-0.18,  0.05),
        vec2( 0.05, -0.06),
        vec2( 0.22,  0.10),
        vec2( 0.00,  0.00),     // peak — dead centre
        vec2(-0.12, -0.04),
        vec2( 0.18,  0.08),
        vec2( 0.00,  0.20)
    );
    int   sid       = clamp(u_section_id, 0, 7);
    int   nid       = clamp(sid + 1, 0, 7);
    float spS       = smoothstep(0.0, 1.0, u_section_progress);
    float wheelScl  = mix(secScale[sid],  secScale[nid],  spS);
    vec2  wheelOff  = mix(secCenter[sid], secCenter[nid], spS);

    // Early-out for outro section — no wheel at all in the final fade
    if (wheelScl < 0.05) {
        // Pass-through: keep history-only contribution so trails fade
        vec3 hist = texture(u_history, uv).rgb * 0.78;
        fragColor = vec4(hist, max(hist.r, max(hist.g, hist.b)));
        return;
    }

    // Apply section transform: shift then scale-into-pixel-space.
    p -= wheelOff;
    // Bass + idle-breath radial scale, modulated by per-section size.
    float liveScale = 1.0 + 0.05 * sin(u_time * 0.41) - 0.20 * bass - 0.10 * kick;
    float scale = liveScale / max(wheelScl, 0.05);
    p /= scale;

    float r   = length(p);
    float ang = atan(p.y, p.x);
    vec3  col = vec3(0.0);

    // Section-based petal count (8 / 12 / 16 cycle, like mirror-bloom)
    int innerTeeth = 8 + 4 * (u_section_id % 3);
    int outerTeeth = innerTeeth * 2;

    // Inner ring: bar-phase drives rotation, beat-phase snaps it 1/2 tooth
    float innerRot = u_time * 0.05 + u_bar_phase * TAU * 0.30;
    innerRot      += smoothstep(0.10, 0.0, u_beat_phase) * (TAU / float(innerTeeth) * 0.6);

    // Outer ring counter-rotates more slowly
    float outerRot = -u_bar_phase * TAU * 0.18 - u_time * 0.03;

    // ----- Inner gear-ring (radius 0.18) -----
    {
        float ringR     = 0.18;
        float ringMask  = 1.0 - smoothstep(0.020, 0.030, abs(r - ringR));
        float petals    = petalGate(ang, innerTeeth, 0.55, innerRot);
        float intensity = ringMask * mix(0.30, 1.0, petals) * (0.7 + 0.5 * bass);
        col += vec3(1.30, 0.65, 0.15) * intensity;
    }

    // ----- Outer gear-ring (radius 0.36) -----
    {
        float ringR     = 0.36;
        float ringMask  = 1.0 - smoothstep(0.030, 0.045, abs(r - ringR));
        float petals    = petalGate(ang, outerTeeth, 0.40, outerRot);
        float intensity = ringMask * mix(0.25, 1.0, petals) * (0.6 + 0.4 * mid);
        col += vec3(1.10, 0.45, 0.10) * intensity;
    }

    // ----- Outermost thin ring (radius 0.55) -----
    {
        float thin = 1.0 - smoothstep(0.005, 0.008, abs(r - 0.55));
        col += vec3(1.00, 0.35, 0.08) * thin * 0.7;
    }

    // ----- Downbeat expanding pulse ring -----
    {
        float pulse  = u_downbeat;
        float pulseR = 0.10 + (1.0 - pulse) * 0.95;
        float pulseSdf = abs(r - pulseR) - 0.014 * pulse;
        float ring   = (1.0 - smoothstep(0.0, 0.012, pulseSdf)) * pulse;
        col += vec3(1.40, 0.85, 0.45) * ring * 1.2;
    }

    // ----- Central core (anyKey + bass inflate it) -----
    {
        float anyKey = 0.0;
        for (int i = 0; i < 15; i++) anyKey = max(anyKey, u_keys[i]);
        float coreR = 0.05 + 0.04 * bass + 0.05 * anyKey + 0.03 * u_energy_smooth;
        float core  = 1.0 - smoothstep(0.0, coreR, r);
        col += vec3(1.40, 0.90, 0.50) * core
              * (0.50 + 0.55 * bass + 0.65 * anyKey + 0.40 * u_energy_smooth);
    }

    // ----- Per-key fire-spikes on the rims -----
    {
        float angBase = -PI + 0.35;
        float angSpan = TAU - 0.7;

        // 9 white keys at r ≈ 0.36
        for (int i = 0; i < 9; i++) {
            float fi     = float(i);
            float keyAng = angBase + (fi / 8.0) * angSpan;
            float aD     = abs(atan(sin(keyAng - ang), cos(keyAng - ang)));
            float spike  = smoothstep(0.06, 0.0, aD)
                         * smoothstep(0.020, 0.005, abs(r - 0.36))
                         * u_keys[i] * 1.4;
            // Flame tail extending outward past the rim
            float tail   = smoothstep(0.025, 0.0, aD)
                         * smoothstep(0.36, 0.55, r) * smoothstep(0.55, 0.36, r)
                         * u_keys[i] * 0.9;
            col += vec3(1.30, 0.80, 0.40) * spike;
            col += vec3(1.20, 0.55, 0.15) * tail;
        }

        // 6 black keys at r ≈ 0.42
        float halfPos[6] = float[6](0.5, 1.5, 3.5, 4.5, 5.5, 7.5);
        for (int i = 0; i < 6; i++) {
            float keyAng = angBase + (halfPos[i] / 8.0) * angSpan;
            float aD     = abs(atan(sin(keyAng - ang), cos(keyAng - ang)));
            float spike  = smoothstep(0.05, 0.0, aD)
                         * smoothstep(0.022, 0.005, abs(r - 0.42))
                         * u_keys[9 + i] * 1.6;
            col += vec3(1.10, 0.55, 0.18) * spike;
        }
    }

    // ----- Hi-hat sparkle dots at 16 fixed angles, ring at r=0.46 -----
    {
        float dotMod   = fract(ang * 16.0 / TAU);
        float dotGate  = step(0.92, abs(dotMod - 0.5) * 2.0);
        float ringMask = 1.0 - smoothstep(0.010, 0.018, abs(r - 0.46));
        col += vec3(1.30, 0.95, 0.55) * dotGate * ringMask * high * 1.8;
    }

    // ----- Spiral arms — bar-phase rotating -----
    {
        float spiralPhase = ang * 4.0 + r * 8.0 - u_bar_phase * TAU;
        float spiral      = pow(sin(spiralPhase) * 0.5 + 0.5, 4.0);
        float decay       = exp(-r * 4.5);
        col += vec3(1.10, 0.50, 0.15) * spiral * decay * (0.25 + 0.40 * u_energy_smooth);
    }

    // ----- Section-transition flare -----
    float boundary = max(1.0 - smoothstep(0.0, 0.10, u_section_progress),
                         1.0 - smoothstep(0.0, 1.5, max(u_to_section_change, 0.0)));
    if (boundary > 0.001) {
        col += vec3(1.40, 0.85, 0.45) * exp(-r * r * 12.0) * boundary * 0.50;
    }

    // Per-section intensity envelope (already applied via wheelScl above
    // for spatial; this re-applies on brightness too so the wheel both
    // shrinks AND dims in calm sections.)
    float secInt[8] = float[8](0.40, 0.70, 1.00, 0.50, 1.40, 0.95, 0.40, 0.0);
    float brightMul = mix(secInt[sid], secInt[nid], spS);
    col *= brightMul;

    // History feedback — rotational ghost so the rotation reads continuously
    vec3 hist = texture(u_history, uv).rgb * 0.78;
    col = max(col, hist - 0.18);

    // Cap so screen-blend doesn't blow out
    col = min(col, vec3(1.20));

    fragColor = vec4(col, clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0));
}
