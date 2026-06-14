#version 300 es
// ABOUTME: throat-base — log-polar descent tunnel. fbm-veined dark rock walls,
// ABOUTME: transverse cartilage rings rushing past (1/r foreshortening), 808 clench,
// ABOUTME: downbeat rotation snap, vocal wall-heat, cursor steer. THE LEAD layer.
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_frame;
uniform vec2  u_mouse;
uniform float u_audio_playing;
uniform float u_audio_kick;
uniform float u_audio_bass_stem;
uniform float u_audio_vocals_stem;
uniform float u_audio_other_stem;
uniform float u_downbeat;
uniform float u_beat_phase;
uniform float u_bar_phase;
uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_to_section_change;
uniform float u_energy_smooth;
uniform float u_keys_visual[15];
uniform float u_key_event[15];
uniform sampler2D u_below;
uniform sampler2D u_history;

out vec4 fragColor;

// --- warm palette: near-black -> wine -> blood-ember -> amber -> cream ---
vec3 warmRamp(float t){
    t = clamp(t, 0.0, 1.0);
    vec3 nearBlack = vec3(0.020, 0.012, 0.010);
    vec3 wine      = vec3(0.230, 0.045, 0.070);
    vec3 ember     = vec3(0.560, 0.120, 0.035);
    vec3 amber     = vec3(0.960, 0.470, 0.130);
    vec3 cream     = vec3(1.000, 0.880, 0.620);
    vec3 c = mix(nearBlack, wine,  smoothstep(0.00, 0.30, t));
    c = mix(c, ember, smoothstep(0.28, 0.58, t));
    c = mix(c, amber, smoothstep(0.55, 0.82, t));
    c = mix(c, cream, smoothstep(0.80, 1.00, t));
    return c;
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float playing = u_audio_playing;

    // --- drivers (synthetic self-play when idle so the throat breathes) ---
    float bass  = mix(0.14 + 0.10 * sin(u_time * 1.30), u_audio_bass_stem, playing);
    float kick  = mix(0.10 + 0.10 * pow(0.5 + 0.5*sin(u_time*2.05), 6.0), u_audio_kick, playing);
    float heat  = mix(0.18 + 0.10 * sin(u_time * 0.55 + 1.0), u_audio_vocals_stem, playing);
    float other = mix(0.20, u_audio_other_stem, playing);
    float energy = mix(0.45, u_energy_smooth, playing);

    // centred, aspect-corrected screen point
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);

    // cursor steers the fall off-axis (lean into the wall)
    vec2 mw = vjMouseWorldOrZero(u_mouse, u_resolution);
    vec2 steer = clamp(mw, vec2(-0.45), vec2(0.45)) * 0.32;
    p -= steer;

    float r = length(p);
    float a = atan(p.y, p.x);

    // 808 clench: throat contracts on the kick; pre-tension squeeze before a drop
    float clench = clamp(0.60 * (0.45*kick + 0.65*bass), 0.0, 0.66);
    // pre-drop squeeze: ramps up over a wider window before a section boundary so
    // the pre-peak frame is visibly tighter/withholding than mid-verse
    float preten = pow(clamp(1.0 - u_to_section_change, 0.0, 1.0), 4.0);
    clench = max(clench, 0.50 * preten);
    // bar-phase breathing of the throat radius (slower clock than the beat)
    float breath = 1.0 + 0.045 * sin(u_bar_phase * TAU);
    float rC = r * (1.0 - clench * 0.74) * breath;
    float rr = max(rC, 0.0025);

    // rotation: slow base + downbeat snap (visible phase-lock) + per-beat micro rock
    float rot = u_time * 0.040 + 0.20 * u_downbeat + 0.018 * sin(u_beat_phase * TAU);
    a += rot;

    // perspective depth (huge near the vanishing point) and the falling scroll
    float fall = u_time * 0.52;
    float depthRing = 0.50 / rr;

    // section state machine: each section gets a distinct tunnel CHARACTER
    // (ring spacing + vein frequency), drifting tighter as the section builds —
    // vocabulary, not just re-shaded params
    float sectF = float(u_section_id);
    float ringDensity = 1.6 + 0.8 * fract(sectF * 0.37) + 0.4 * u_section_progress;
    float veinScale   = 2.10 + 0.6 * fract(sectF * 0.61);

    // seamless circumferential coordinate (no atan seam): walk a circle in noise space
    vec2 circ = vec2(cos(a), sin(a));
    float vein  = fbmRot(circ * veinScale + vec2(0.0, 3.0));   // longitudinal ember veins
    float wineLow = fbmRot(circ * 0.95 + vec2(9.0, 0.0));      // large wine patches

    // transverse cartilage rings rushing past, compressed near centre by 1/r
    float u = depthRing * ringDensity - fall;
    float rings = pow(0.5 + 0.5 * sin(u * TAU), 5.0);

    // wall luminance — always-on band: rock floor never fully dark (lead-layer rule)
    float rockBase = 0.045 + 0.11 * wineLow;
    float crack = smoothstep(0.55 - 0.14 * other, 0.74, vein);
    float ringAccent = rings * (0.22 + 0.65 * crack);
    float wallLum = max(rockBase, 0.62 * crack + 0.55 * ringAccent);

    // atmospheric fog: dark toward the far vanishing point (centre), lit walls at edges
    float fog = smoothstep(0.0, 0.46, r);
    wallLum *= fog;

    // vocals heat the walls; energy lifts overall contrast (kept moderate so the
    // drop reads as structured cracks, not a blown wash)
    wallLum *= 1.0 + 0.70 * heat + 0.22 * energy;

    // cursor heat: a local bright wall patch where the finger drags
    float ch = vjCursorHeat(p, mw, 0.16);
    wallLum += 0.55 * ch * fog;

    // keyboard: each played key heats its angular sector of the throat wall
    float keyHeat = 0.0;
    for (int i = 0; i < 15; i++){
        float a_i = (float(i) + 0.5) / 15.0 * TAU + rot;
        float dA = atan(sin(a - a_i), cos(a - a_i));
        keyHeat += exp(-(dA*dA) / (2.0*0.07*0.07)) * (u_keys_visual[i] + 0.8 * u_key_event[i]);
    }
    wallLum += 0.45 * keyHeat * fog;

    // colour: hotter cracks/rings lean amber->cream, especially under vocal heat
    float tone = clamp(wallLum * (1.0 + 0.45 * heat), 0.0, 1.0);
    vec3 col = warmRamp(tone);
    col *= wallLum;                      // luminance shaping on top of the ramp

    fragColor = vec4(col, 1.0);
}
