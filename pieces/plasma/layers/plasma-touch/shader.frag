// ABOUTME: Touch attractor — bright noise-warped filament leaps from electrode
// ABOUTME: to each finger touching the "glass". Plus a glass-contact glow halo
// ABOUTME: at the touch point. The signature plasma-lamp interaction.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec4      u_touches[8];
uniform int       u_touch_count;
uniform float     u_keys[15];
uniform sampler2D u_below;

out vec4 fragColor;

#define TAU 6.28318530718

float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

// Distance from fragment p to a noise-warped segment from origin to T.
// Segment is jittered perpendicularly along its length so the filament
// reads as ionised arc rather than straight line. Returns absolute
// perpendicular distance plus a falloff factor for fragments off the
// segment ends.
float arcDistance(vec2 p, vec2 T, float jitterPhase) {
    float L   = length(T);
    if (L < 1e-4) return 1e6;
    vec2  dir = T / L;
    vec2  nrm = vec2(-dir.y, dir.x);

    float along = clamp(dot(p, dir), 0.0, L);
    float perp  = dot(p, nrm);

    // Four-octave noise displacement of the centerline. Pushed ×1.7
    // vs v1 — Louis wanted more chaos. Fast time variance + position-
    // dependent phase makes the arc thrash like a real Tesla discharge.
    float wob = sin(along *  7.0 + jitterPhase * 2.1) * 0.055
              + sin(along * 18.0 + jitterPhase * 3.7) * 0.085
              + sin(along * 41.0 - jitterPhase * 6.1) * 0.040
              + sin(along * 73.0 + jitterPhase * 9.3) * 0.020;

    // Per-segment crackle — high-freq noise so the arc looks granular
    // rather than a smooth ribbon.
    float grain = (hash21(vec2(along * 80.0, floor(jitterPhase * 60.0))) - 0.5) * 0.012;

    float perpW = perp - wob - grain;

    // End-clamp falloff — fragments past T still contribute a small
    // amount but fade fast so the arc has a clean tip.
    float along_full = dot(p, dir);
    float endFade = 1.0;
    if (along_full > L) endFade = exp(-(along_full - L) * 22.0);
    if (along_full < 0.0) endFade = exp( along_full * 22.0);

    return abs(perpW) / max(endFade, 1e-3);
}

void main() {
    vec2  uv     = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;

    // Aspect-corrected world coords matching plasma-base. Origin =
    // electrode at center.
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0) * 2.0;

    // Held keys overdrive the discharge — more current = thicker, brighter
    // arcs to fingers. Soft-clamped sum so chord-bashing doesn't blow out.
    float keyAmp = 0.0;
    for (int k = 0; k < 15; k++) keyAmp += u_keys[k];
    keyAmp = 1.0 + 0.8 * (keyAmp / (1.0 + keyAmp));

    vec3 below = texture(u_below, uv).rgb;
    if (dot(below, vec3(1.0)) < 0.01) {
        below = vec3(0.025, 0.010, 0.055);
    }

    vec3 arcs = vec3(0.0);
    vec3 halo = vec3(0.0);

    // Stepped time — match the base layer's 60Hz Tesla cadence (slightly
    // higher 65Hz so touch arcs feel fractionally more frantic than the
    // ambient field).
    float tStep = floor(u_time * 65.0) / 65.0;

    for (int i = 0; i < 8; i++) {
        if (i >= u_touch_count) break;
        vec4 t = u_touches[i];
        if (t.w < 0.5) continue;

        // Touch position in matching world coords.
        vec2 tUv = t.xy / u_resolution.xy;
        vec2 T   = (tUv - 0.5) * vec2(aspect, 1.0) * 2.0;

        // Fresh touches get the fattest, brightest arc. After release,
        // age (t.z) decays the arc smoothly so a finger lift leaves a
        // brief "afterglow" rather than snapping off.
        float fresh = exp(-t.z * 1.6);

        // Stochastic per-frame phase — different jitterPhase per
        // (touch, time-step) makes the same touch arc look like a
        // sequence of distinct discharge events rather than one
        // continuous wiggle.
        float jp = u_time + 13.0 * float(i) + 7.0 * tStep;

        float d   = arcDistance(p, T, jp);
        float core = exp(-d * 55.0);                     // hot centerline (thicker)
        float wide = exp(-d * 14.0);                     // soft halo (wider)

        // Independent stochastic flicker per touch arc.
        float fl = 0.55 + 0.55 * hash21(vec2(float(i), floor(tStep * 53.0)));

        float intensity = fresh * keyAmp * fl;

        arcs += vec3(0.70, 0.90, 1.00) * core * 1.40 * intensity;
        arcs += vec3(0.95, 0.30, 1.00) * wide * 0.55 * intensity;

        // Glass-contact halo at the touch point itself — the spot
        // where the filament hits the inside of the glass and bursts.
        // Bigger and brighter than the arc body so the eye lands there.
        float r2c = length(p - T);
        float ringInner = smoothstep(0.025, 0.000, r2c);
        float ringOuter = smoothstep(0.110, 0.025, r2c);
        halo += vec3(0.95, 0.55, 1.00) * ringOuter * 0.45 * (0.30 + 0.70 * fresh);
        halo += vec3(1.00, 0.95, 1.00) * ringInner * 1.00 * (0.30 + 0.70 * fresh);
    }

    vec3 col = below + arcs + halo;

    fragColor = vec4(col, 1.0);
}
