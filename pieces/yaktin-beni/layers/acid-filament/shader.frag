#version 300 es
// ABOUTME: yaktin-beni acid-filament — the TB-303 as a glowing ember serpent folded
// ABOUTME: into k-fold symmetry, writhing on the bass with comet light-trails; unravels in the breakdown.
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "palette.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_frame;
uniform vec2  u_mouse;
uniform float u_audio_playing;
uniform float u_audio_bass_stem;
uniform float u_audio_high;
uniform float u_audio_level;
uniform float u_section_id;
uniform float u_song_progress;
uniform float u_bar_phase;
uniform sampler2D u_below;
uniform sampler2D u_history;
uniform float u_keys[15];
uniform float u_key_event[15];

out vec4 fragColor;

float luma(vec3 c) { return dot(c, vec3(0.30, 0.59, 0.11)); }

void main() {
    vec2 res = u_resolution;
    vec2 uv  = gl_FragCoord.xy / res;
    vec2 p   = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y) * 2.0;

    float playing = u_audio_playing;
    float bass = mix(0.30 + 0.45 * pow(0.5 + 0.5 * sin(u_time * 3.1), 2.0), u_audio_bass_stem, playing);
    float high = mix(0.20 + 0.20 * sin(u_time * 5.0), u_audio_high, playing);
    float prog = mix(fract(u_time * 0.01), u_song_progress, playing);
    float barPh = mix(fract(u_time * 0.5), u_bar_phase, playing);
    float sidF = mix(floor(mod(u_time * 0.066, 7.0)), u_section_id, playing);
    int sid = int(sidF + 0.5);

    // fold order matches the mandala (pattern symmetry = 2N); unravels to 1
    // in the breakdown so the serpent writhes free (different vocabulary).
    float kfold = 4.0;
    if (sid == 1) kfold = 8.0;
    else if (sid == 2 || sid == 3) kfold = 10.0;
    else if (sid == 4) kfold = 1.0;          // FRACTURE: unravel
    else if (sid == 5 || sid == 6) kfold = 12.0;

    // cursor conducts the serpent's anchor (floor-and-ceiling).
    vec2 panMw = vjMouseWorldOrZero(u_mouse, res);
    float whirl = u_time * 0.06;
    vec2 pc = rot2d(-whirl) * (p - 0.28 * panMw);

    float ang = atan(pc.y, pc.x);
    float rad = length(pc);
    float sector = TAU / kfold;
    float fa = mod(ang, sector);
    fa = abs(fa - sector * 0.5);             // dihedral fold → mirrored petals

    // --- DROP: peak-1 and the long-peak become a chaotic flythrough tunnel --
    // (Louis redline: the tentacles must get CRAZY at the drop — a highway you
    // are projected into, more than lightning, unpredictable, NOT beat-locked.)
    float drop = 0.0;
    if (sid == 3) drop = 1.0;                 // peak-1
    else if (sid == 5) drop = 1.0;            // the big 95s long-peak
    else if (sid == 2) drop = 0.55;           // rise — building toward it
    drop = saturate(drop * (0.45 + 0.9 * bass));

    // tunnel depth: 1/r vanishing point streaming outward — you fly INTO it.
    float tz = 1.0 / (rad + 0.07) + u_time * (0.8 + 3.4 * drop);

    // 303 writhe (calm sections): folded radial ridge on the bass.
    float amp = (0.10 + 0.42 * bass) * (sid == 4 ? 2.2 : 1.0);
    float waveF = 5.0 + 4.0 * prog;
    float writhe = amp * sin(rad * waveF - u_time * 2.2
                             + 3.0 * fbmRot(vec2(rad * 1.6, u_time * 0.35)));

    // chaotic tunnel writhe (drop): multi-octave turbulence in (depth, angle),
    // driven by fbm of depth+time — NOT the beat — so it is unpredictable.
    float turb = fbmRot(vec2(tz * 0.7, fa * 4.0))
               + 0.6 * fbmRot(vec2(tz * 1.9 - u_time * 0.6, fa * 2.0 + 3.0));
    float chaos = (turb - 0.8) * (2.6 * drop);
    float aSerp = sector * 0.25 + writhe + chaos;

    float resonance01 = saturate(bass * 1.3 + 0.2 * high);
    float width = mix(0.085, 0.020, resonance01);

    // radial envelope: calm = focal; drop = reach the frame edges (the highway
    // rushing past, over the edge).
    float renv = mix(smoothstep(0.04, 0.22, rad) * exp(-rad * rad * 0.55),
                     smoothstep(0.015, 0.10, rad),
                     drop);

    float dSpace = abs(fa - aSerp) * (rad + 0.15);
    float glow = exp(-(dSpace * dSpace) / (width * width)) * renv;

    // branching fork tentacle (drop) — lightning-like splits off the spine.
    float fork = fbmRot(vec2(tz * 3.3 + 4.0, fa * 6.0 - u_time * 0.8));
    float aFork = sector * 0.5 + (fork - 0.5) * 2.6 * drop;
    float dFork = abs(fa - aFork) * (rad + 0.15);
    glow = max(glow, exp(-(dFork * dFork) / (width * width)) * renv * drop * 0.9);

    // --- HYPERSPACE TUNNEL (drop): thin radial streaks rushing outward from
    // the central vanishing point, chaotically bent — you are projected INTO a
    // highway. Uses the UNFOLDED angle (full-circle streaks), bent by fbm of
    // depth+time (not the beat → unpredictable), brightness rushing along tz.
    float lineCount = floor(kfold) * 1.5 + 7.0;
    float wob = ang + (0.7 + 1.4 * drop)
              * (fbmRot(vec2(tz * 0.6, ang * 2.0 + u_time * 0.25)) - 0.5);
    float spokes = pow(0.5 + 0.5 * sin(wob * lineCount), 9.0);     // many thin radial lines
    float rush = 0.45 + 0.55 * sin(tz * 7.0 - u_time * (6.0 + 11.0 * drop)); // streaming out
    float tunnel = spokes * rush * smoothstep(0.02, 0.14, rad) * drop;
    glow = max(glow, tunnel * 1.3);

    // tunnel streaking on the spine too: bright bands rushing outward.
    float streak = 0.55 + 0.45 * sin(tz * 5.0 - u_time * (3.0 + 7.0 * drop));
    glow *= mix(1.0, streak, drop * 0.7);

    // travelling accent "head" along the serpent (the 303 accent step).
    float headRad = 0.25 + 0.6 * fract(barPh);
    float head = exp(-pow((rad - headRad) * 6.0, 2.0)) * exp(-(dSpace * dSpace) / (width * width));
    glow += head * (0.6 + 0.8 * bass) * (1.0 - 0.5 * drop);

    // keyboard pluck: held keys energise the serpent, events flash a ring.
    float keyHold = 0.0, keyEv = 0.0;
    for (int k = 0; k < 15; k++) { keyHold += u_keys[k]; keyEv += u_key_event[k]; }
    glow *= 1.0 + 0.5 * saturate(keyHold);
    glow += keyEv * 0.5 * exp(-pow((rad - 0.4) * 5.0, 2.0));

    glow *= (0.55 + 1.5 * bass) * (1.0 + 0.8 * drop);   // crank brightness at the drop

    // colour: ember-red body climbing toward amber over the song (it is fire,
    // not tan — a yellow-tan body reads olive at low glow over the wine ground),
    // cream-hot core where the glow saturates.
    vec3 col = warmCycle(0.42 - 0.08 * prog) * glow;
    col += vec3(1.0, 0.88, 0.66) * pow(saturate(glow), 2.0) * (0.7 + 0.5 * resonance01);

    // comet light-trails: take only the LUMINANCE of the residual the upper
    // layers left last frame and repaint it warm — a channel-wise hist-below
    // subtraction leaks green/blue (warm below has low G/B), so recolour it.
    vec3 below = texture(u_below, uv).rgb;
    vec3 hist  = texture(u_history, uv).rgb;
    float trailLum = luma(max(hist - below, vec3(0.0)));
    vec3 trail = warmCycle(0.95) * trailLum * 0.85;
    vec3 outc  = max(col, trail);
    outc = mix(col, outc, smoothstep(0.0, 1.0, u_frame / 30.0));

    // cool the outro to near-black (the embers die at the cierre).
    outc *= 1.0 - 0.75 * smoothstep(0.93, 1.0, prog);

    fragColor = vec4(max(outc, 0.0), 1.0);
}
