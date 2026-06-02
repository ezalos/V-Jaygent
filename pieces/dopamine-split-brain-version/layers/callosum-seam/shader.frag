#version 300 es
// ABOUTME: Corpus-callosum seam layer — vertical dark band at x=0.5, horizontal
// ABOUTME: lightning bolt fires on every downbeat, full-frame fusion bloom during
// ABOUTME: section 4 (the climax, when both hemispheres phase-lock into one).
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform sampler2D u_below;
uniform float u_audio_level;
uniform float u_audio_playing;
uniform float u_downbeat;
uniform float u_beat_phase;
uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_to_section_change;

uniform float seam_dark;
uniform float flash;

out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;

    // Section-gated fusion strength — only active in section 4 (the climax).
    float fusion_strength = (u_section_id == 4) ? smoothstep(0.0, 0.55, u_section_progress) : 0.0;

    // Sample the composited below — the two hemispheres are already painted.
    vec3 below = texture(u_below, uv).rgb;

    // Empty u_below fallback — if the layer engine renders this layer first
    // for any reason, treat below as near-black warm.
    if (dot(below, vec3(1.0)) < 0.01) below = vec3(0.04, 0.02, 0.01);

    // === Vertical seam ===
    // A narrow vertical dark band at x=0.5. As fusion_strength rises, the
    // band first widens (the gap of incomprehension grows), then suddenly
    // collapses to zero at fusion = 1.0 (the moment of integration).
    float seamW = mix(0.012, 0.04, smoothstep(0.0, 0.65, fusion_strength));
    float seamMask = smoothstep(seamW, 0.0, abs(uv.x - 0.5));
    // Collapse the seam at high fusion.
    seamMask *= 1.0 - smoothstep(0.65, 0.95, fusion_strength);
    // Seam breath rides its own slow clock, independent of beat — avoids the
    // per-layer brightness-strobe failure where seam darkness blinked on bass.
    float seamBreath = 0.5 + 0.35 * sin(u_time * 0.6);
    vec3 seamCol = below * (1.0 - seamMask * seam_dark * seamBreath);

    // === Downbeat lightning bolt ===
    // On every downbeat, a horizontal bolt fires across the screen at a
    // pseudo-random y. The bolt is jagged via vnoise; brightness decays fast.
    // Headless fallback so the lightning still fires in inspect: synthesize a
    // 2.27 Hz downbeat envelope. Note we use u_audio_playing as the gate.
    float synthDb = pow(0.5 + 0.5 * sin(u_time * (2.27 * TAU)), 18.0);  // sharp bumps on beats
    float dbAct = mix(synthDb, u_downbeat, u_audio_playing);

    // Pick a y for this bolt — seeded by floor of beat number so y jumps
    // each downbeat. (Use u_time as a proxy beat-counter for consistency
    // between headless and live; the visual is the same.)
    float beatBucket = floor(u_time * 2.27);
    float boltY = 0.20 + 0.60 * hash21(vec2(beatBucket, 0.13));
    float jag = vnoise(vec2(uv.x * 18.0 + beatBucket, beatBucket * 7.3));
    float boltDy = (uv.y - boltY) + (jag - 0.5) * 0.06;
    float bolt = exp(-pow(boltDy * 60.0, 2.0)) * dbAct;

    // The bolt is brighter near the seam — that's where the corpus callosum
    // actually fires from. Falls off toward the screen edges.
    float boltSeamProx = exp(-pow((uv.x - 0.5) * 1.6, 2.0));
    bolt *= 0.6 + 1.4 * boltSeamProx;

    vec3 boltCol = vec3(1.0, 0.92, 0.78) * bolt * 1.2;

    // === Fusion bloom (section 4) ===
    // A full-frame brightening that creates a moiré where the two
    // hemispheres' patterns overlap. The lighter pixels of below get
    // boosted; dark pixels stay dark. Effectively a soft screen with itself.
    vec3 fusionCol = vec3(0.0);
    if (fusion_strength > 0.001) {
        vec3 moire = below * below;          // square brightens the bright
        moire *= 2.4;
        // Slow-rotating moire offset — sample below shifted slightly so the
        // two hemispheres' grids interfere visibly.
        vec2 offs = vec2(cos(u_time * 0.21), sin(u_time * 0.17)) * 0.008;
        vec3 below2 = texture(u_below, uv + offs).rgb;
        moire = mix(moire, moire * below2 * 4.0, 0.5);
        fusionCol = moire * smoothstep(0.0, 0.6, fusion_strength);
    }

    // === Section-transition flash ===
    // Brief bright wash at the start of each new section — driven by the
    // flash uniform if the piece supplies it, else by section_progress < 4%.
    float trans = (1.0 - smoothstep(0.0, 0.04, u_section_progress)) * 0.65;
    vec3 transCol = vec3(1.0, 0.92, 0.78) * max(trans, flash);

    // === Cursor sparkle on the seam ===
    // When the cursor crosses near the seam, fire a small local bright
    // cluster — the viewer "touching" the corpus callosum.
    vec3 cursorCol = vec3(0.0);
    if (!vjMouseIdle(u_mouse)) {
        vec2 mouseUv = u_mouse / u_resolution;
        float seamProx = exp(-pow((mouseUv.x - 0.5) * 7.0, 2.0));
        float cursorDist = length((uv - mouseUv) * vec2(aspect, 1.0));
        float glow = exp(-cursorDist * 12.0) * seamProx;
        cursorCol = vec3(1.0, 0.85, 0.55) * glow * 0.8;
    }

    // Final composition: seam-darkened below + additive bolt + fusion bloom
    // + transition flash + cursor.
    vec3 col = seamCol + boltCol + fusionCol + transCol + cursorCol;

    // Soft tonemap so peaks don't clip to white.
    col = col / (1.0 + col * 0.65);

    // Alpha gates the screen blend — fully opaque where this layer contributes
    // brightness, near-zero elsewhere so the layers beneath show through cleanly.
    float a = clamp(seamMask * 0.5 + bolt * 1.5 + length(fusionCol) * 0.7
                    + length(transCol) + length(cursorCol), 0.0, 1.0);
    fragColor = vec4(col, max(a, 0.05));
}
