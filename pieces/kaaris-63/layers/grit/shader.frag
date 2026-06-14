#version 300 es
// ABOUTME: grit — fine fast-scrolling dust shimmer on the throat walls, hi-hat driven.
// ABOUTME: the always-on sub-beat motion. sparse warm specks, screen blend.
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_playing;
uniform float u_audio_drums_stem;
uniform float u_audio_high;
uniform sampler2D u_below;

out vec4 fragColor;

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec3 below = texture(u_below, uv).rgb;
    float playing = u_audio_playing;

    float hat  = mix(0.12 + 0.12 * pow(0.5 + 0.5*sin(u_time*7.3), 4.0), u_audio_drums_stem, playing);
    float high = mix(0.14, u_audio_high, playing);

    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
    vec2 mw = vjMouseWorldOrZero(u_mouse, u_resolution);
    p -= clamp(mw, vec2(-0.45), vec2(0.45)) * 0.32;

    float r = length(p);
    float a = atan(p.y, p.x);
    float rr = max(r, 0.0025);
    float depthRing = 0.50 / rr;
    float fall = u_time * 0.52;

    // dust flowing DOWN the walls with the descent (coherent with the ring scroll,
    // not a fast independent twinkle — keeps the motion trackable)
    vec2 g = vec2(a / TAU * 18.0, depthRing * 2.0 - fall * 1.0);
    float n = vnoise(g);
    // hi-hat drives DENSITY (geometric), not brightness — more dust appears during
    // rolls, near-none in quiet; the speck brightness itself stays ~constant
    float thr = mix(7.0, 3.0, clamp(hat, 0.0, 1.0));
    float specks = pow(clamp(n, 0.0, 1.0), thr);
    specks += 0.4 * pow(clamp(vnoise(g * 1.7 + 17.0), 0.0, 1.0), thr + 2.0);

    float fog = smoothstep(0.0, 0.46, r);                 // none at the far centre
    float lum = specks * fog * (0.35 + 0.20 * high);      // brightness ~constant

    // spatial coupling: a subtle radial heat-shimmer that REFRACTS u_below — the
    // dust field displaces the sampled wall outward, bending what is beneath
    vec2 disp = (r > 1e-4 ? p / r : vec2(0.0)) * (0.0045 * specks + 0.0030 * hat) * fog;
    vec3 refr = texture(u_below, uv + disp).rgb;
    vec3 shimmer = max(refr - below, 0.0) * (0.45 + 0.6 * hat);

    vec3 dust = vec3(0.95, 0.58, 0.26);                   // warm amber grit
    fragColor = vec4(dust * lum + shimmer, 1.0);
}
