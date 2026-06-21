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
uniform float u_keys[15];
uniform float u_key_event[15];

out vec4 fragColor;

void main() {
    vec2 res = u_resolution;
    vec2 p   = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y) * 2.0;

    float playing = 1.0;   // force REAL uniforms: stems+section are frozen-VALID when paused, so paused==playing. (u_audio_playing=0 on pause flipped to synthetic = the bug). Idle falls back to the section floor + wallclock u_time.
    float sidF = mix(floor(mod(u_time * 0.066, 7.0)), u_section_id, playing);
    int sid = int(sidF + 0.5);

    // per-section expected energy = a lively FLOOR for the drive. This fixes
    // the "only beautiful when paused" bug: at the long-peak the bass/drum
    // stems DROP OUT (bass=0.001 at t=195 where Louis paused), so a
    // mix(synthetic, real, playing) drive collapsed to a dead floor when
    // PLAYING but used the lively synthetic value when PAUSED. Now real audio
    // ADDS on top of a section-scaled lively floor — playing is never deader
    // than the (beautiful) idle baseline; quiet sections keep a low floor.
    float sectE = (sid == 0) ? 0.18 : (sid == 1) ? 0.35 : (sid == 2) ? 0.45
                : (sid == 3) ? 0.60 : (sid == 4) ? 0.25 : (sid == 5) ? 0.60 : 0.30;
    float live = sectE * (0.60 + 0.50 * (0.5 + 0.5 * sin(u_time * 1.7)));
    // Drive from the STEM (frozen-consistent paused/playing) + the time-based
    // floor — NOT u_audio_level. Live FFT uniforms (level/kick/high) go to ~0
    // when paused (silent analyser) even though u_audio_playing stays 1, which
    // is what made paused look different from playing.
    float bass = max(u_audio_bass_stem * playing, live);
    float high = 0.20 + 0.20 * sin(u_time * 5.0);
    float prog = mix(fract(u_time * 0.01), u_song_progress, playing);
    float barPh = mix(fract(u_time * 0.5), u_bar_phase, playing);

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

    // tunnel depth: 1/r vanishing point, SLOW so the writhe is TRACKABLE, not a
    // 60fps flicker. (The fast flythrough now lives in the dedicated
    // hyperspace-tunnel layer; this was the "only beautiful when paused" bug —
    // the filament's strobe + fast chaos mushed in motion.)
    float tz = 1.0 / (rad + 0.07) + u_time * (0.3 + 1.0 * drop);

    // 303 writhe (calm sections): folded radial ridge on the bass.
    float amp = (0.10 + 0.42 * bass) * (sid == 4 ? 2.2 : 1.0);
    float waveF = 5.0 + 4.0 * prog;
    float writhe = amp * sin(rad * waveF - u_time * 2.2
                             + 3.0 * fbmRot(vec2(rad * 1.6, u_time * 0.35)));

    // chaotic writhe at the drop — SLOW multi-octave turbulence (coherent +
    // trackable), not beat-locked so it stays unpredictable.
    float turb = fbmRot(vec2(tz * 0.5, fa * 4.0))
               + 0.5 * fbmRot(vec2(tz * 0.9 - u_time * 0.25, fa * 2.0 + 3.0));
    float chaos = (turb - 0.75) * (1.9 * drop);
    float aSerp = sector * 0.25 + writhe + chaos;

    float resonance01 = saturate(bass * 1.3 + 0.2 * high);
    float width = mix(0.085, 0.022, resonance01);

    // radial envelope: calm = focal; drop = reach the frame edges (over the edge).
    float renv = mix(smoothstep(0.04, 0.22, rad) * exp(-rad * rad * 0.55),
                     smoothstep(0.015, 0.11, rad),
                     drop);

    float dSpace = abs(fa - aSerp) * (rad + 0.15);
    float glow = exp(-(dSpace * dSpace) / (width * width)) * renv;

    // branching fork tentacle (drop) — slow lightning-like split off the spine.
    float fork = fbmRot(vec2(tz * 1.2 + 4.0, fa * 6.0 - u_time * 0.3));
    float aFork = sector * 0.5 + (fork - 0.5) * 2.4 * drop;
    float dFork = abs(fa - aFork) * (rad + 0.15);
    glow = max(glow, exp(-(dFork * dFork) / (width * width)) * renv * drop * 0.85);

    // travelling accent "head" along the serpent (the 303 accent step).
    float headRad = 0.25 + 0.6 * fract(barPh);
    float head = exp(-pow((rad - headRad) * 6.0, 2.0)) * exp(-(dSpace * dSpace) / (width * width));
    glow += head * (0.6 + 0.8 * bass) * (1.0 - 0.5 * drop);

    // keyboard pluck: held keys energise the serpent, events flash a ring.
    float keyHold = 0.0, keyEv = 0.0;
    for (int k = 0; k < 15; k++) { keyHold += u_keys[k]; keyEv += u_key_event[k]; }
    glow *= 1.0 + 0.5 * saturate(keyHold);
    glow += keyEv * 0.5 * exp(-pow((rad - 0.4) * 5.0, 2.0));

    glow *= (0.55 + 1.5 * bass) * (1.0 + 0.2 * drop);   // tentacles stay; tunnel layer leads the drop

    // colour: ember-red body climbing toward amber over the song (it is fire,
    // not tan — a yellow-tan body reads olive at low glow over the wine ground),
    // cream-hot core where the glow saturates.
    vec3 col = warmCycle(0.42 - 0.08 * prog) * glow;
    col += vec3(1.0, 0.88, 0.66) * pow(saturate(glow), 2.0) * (0.7 + 0.5 * resonance01);

    // NO u_history trail. The comet trail accumulated on a PAUSED frame:
    // frozen u_time re-adds the same glow every render, blooming the paused
    // image far brighter/richer than the playing one — the literal "only
    // beautiful when paused" bug (proven with bin/inspect-pause.mjs: paused at
    // t=195 was crisp rings + bright bloom, playing was a dim tentacle mandala).
    // Dropping the feedback makes paused == playing; the tunnel carries motion.
    vec3 outc = col;
    outc *= 1.0 - 0.75 * smoothstep(0.93, 1.0, prog);   // outro cool

    fragColor = vec4(max(outc, 0.0), 1.0);
}
