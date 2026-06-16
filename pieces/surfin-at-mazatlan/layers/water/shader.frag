#version 300 es
// ABOUTME: Water-surface layer — relights & refracts u_below from the
// ABOUTME: published wave field; troughs darken to wine, crests warm to amber.
precision highp float;

#include "math.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform sampler2D u_below;
uniform sampler2D u_wave;       // consumed: rg=grad dir, b=height level, a=slope
uniform float u_audio_high;
uniform float u_audio_playing;
uniform float u_keys[15];

out vec4 fragColor;

const float HALFPOS[6] = float[6](0.5, 1.5, 3.5, 4.5, 5.5, 7.5);

void main() {
    vec2 res = u_resolution;
    vec2 uv  = gl_FragCoord.xy / res;
    float aspect = res.x / res.y;

    vec4 w = texture(u_wave, uv);
    vec2  dir   = w.rg * 2.0 - 1.0;
    float level = w.b  * 2.0 - 1.0;       // [-1,1]
    float slope = w.a;                    // [0,1)

    // refract the sunset bed along the surface gradient
    vec2 uvR = uv - dir * slope * 0.055;
    vec3 below = texture(u_below, clamp(uvR, 0.0, 1.0)).rgb;
    if (dot(below, vec3(1.0)) < 0.01) below = vec3(0.21, 0.055, 0.075); // u_below-empty fallback

    vec3 col = below;
    vec3 amber = vec3(0.930, 0.560, 0.215);
    vec3 cream = vec3(1.000, 0.930, 0.780);

    float lc = clamp(level * 1.55, -1.0, 1.0);        // expand height contrast
    // troughs sink toward near-black; crests lift to amber then cream
    col *= mix(1.0, 0.16, smoothstep(0.0, -0.55, lc));
    col = mix(col, amber, smoothstep(0.0, 0.60, lc) * 0.60);
    col += cream * smoothstep(0.45, 0.92, lc) * 0.35;
    // bright lip on the steepest crest faces (body of the glint; sparkle is glint layer)
    col += amber * smoothstep(0.30, 0.75, slope) * smoothstep(0.05, 0.60, lc) * (0.4 + 0.6 * u_audio_high);

    // world coords for cursor + key columns
    vec2 worldP = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y) * 2.0;
    vec2 mw = vjMouseWorld(u_mouse, res);
    float heat = vjCursorHeat(worldP, mw, 0.45);
    col += vec3(1.0, 0.72, 0.40) * heat * 0.30;   // warm cursor wake

    // held keys warm their column (aligns with the key ripple sources)
    for (int i = 0; i < 15; i++) {
        float env = u_keys[i];
        if (env < 0.01) continue;
        bool isBlack = (i >= 9);
        float pos = isBlack ? HALFPOS[i - 9] : float(i);
        float keyX = 0.5 + mix(-1.40, 1.40, pos / 8.0) / (2.0 * aspect);
        float colMask = exp(-pow((uv.x - keyX) * aspect, 2.0) / 0.010);
        col += vec3(1.0, 0.66, 0.34) * colMask * env * 0.22;
    }

    fragColor = vec4(col, 1.0);
}
