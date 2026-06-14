#version 300 es
// ABOUTME: flares — cream-hot sparks racing up the throat toward the camera
// ABOUTME: (hi-hat / drums-stem driven) + full radial streaks when keys are played. max blend.
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_playing;
uniform float u_audio_drums_stem;
uniform float u_audio_cymbal;
uniform float u_downbeat;
uniform float u_beat_phase;
uniform float u_keys_visual[15];
uniform float u_key_event[15];
uniform sampler2D u_below;

out vec4 fragColor;

float angDist(float x){ return atan(sin(x), cos(x)); }

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec3 below = texture(u_below, uv).rgb;
    float playing = u_audio_playing;

    // hi-hat roll energy; synthetic skitter when idle
    float hat = mix(0.10 + 0.12 * pow(0.5 + 0.5*sin(u_time*7.3), 4.0), u_audio_drums_stem, playing);
    float cym = mix(0.06, u_audio_cymbal, playing);

    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
    vec2 mw = vjMouseWorldOrZero(u_mouse, u_resolution);
    p -= clamp(mw, vec2(-0.45), vec2(0.45)) * 0.32;

    float r = length(p);
    float rot = u_time * 0.040 + 0.20 * u_downbeat + 0.018 * sin(u_beat_phase * TAU);
    float a = atan(p.y, p.x) + rot;

    float spark = 0.0;

    // 8 spark lanes racing outward (center=far -> edge=near, foreshortened accel).
    // hi-hat drives how many lanes are ACTIVE (geometric density) — quiet shows few
    // sparks, rolls light most of them — not the brightness of existing sparks.
    for (int k = 0; k < 8; k++){
        float fk = float(k);
        float a_k   = hash21(vec2(fk, 1.0)) * TAU;
        float speed = 0.38 + 0.55 * hash21(vec2(fk, 2.0));
        float phase = fract(u_time * speed + hash21(vec2(fk, 3.0)));
        float r_k   = phase * phase * 0.62;            // slow near centre, fast near edge
        float gain  = smoothstep(0.0, 1.0, phase);     // brighter as it approaches
        float lit = step(hash21(vec2(fk, 5.0)), 0.18 + 0.85 * clamp(hat, 0.0, 1.0));
        float dA    = angDist(a - a_k);
        float blob  = exp(-(dA*dA) / (2.0*0.060*0.060))
                    * exp(-((r - r_k)*(r - r_k)) / (2.0*0.038*0.038));
        spark += blob * gain * lit;
    }
    // per-spark brightness ~constant; cymbal ONSET is a transient flash (one event)
    spark *= 0.95 + 1.1 * cym;

    // keyboard: each played key lights a full radial ember streak down the throat
    float streak = 0.0;
    for (int i = 0; i < 15; i++){
        float a_i = (float(i) + 0.5) / 15.0 * TAU + rot;
        float dA  = angDist(a - a_i);
        float env = u_keys_visual[i] + 0.6 * u_key_event[i];
        streak += exp(-(dA*dA) / (2.0*0.055*0.055)) * env;
    }
    streak *= smoothstep(0.02, 0.5, r);                // fade in from the core outward

    float lum = spark + 1.1 * streak;

    // cream-amber sparks
    vec3 amber = vec3(0.98, 0.52, 0.18);
    vec3 cream = vec3(1.00, 0.92, 0.70);
    vec3 col = mix(amber, cream, smoothstep(0.3, 1.2, lum)) * lum;

    fragColor = vec4(col, 1.0);
}
