#version 300 es
// ABOUTME: vignette-grain layer — warm vignette, 4-tap bloom roll-off, 1/f grain
// ABOUTME: on high-freq energy, partial-Reinhard tonemap. The forge finish.
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_playing;
uniform float u_audio_high;
uniform sampler2D u_below;
out vec4 fragColor;

float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

// partial Reinhard — rolls peaks off toward white without crushing mids
vec3 reinhardPartial(vec3 x, float wp){
    return x * (1.0 + x / (wp * wp)) / (1.0 + x);
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float playing = u_audio_playing;
    vec3 col = texture(u_below, uv).rgb;

    // 4-tap bloom — bright seams bleed a warm halo
    vec2 d1 = vec2(2.5, 1.5) / u_resolution;
    vec2 d2 = vec2(-1.5, 2.5) / u_resolution;
    vec3 bl = (texture(u_below, uv + d1).rgb + texture(u_below, uv - d1).rgb
             + texture(u_below, uv + d2).rgb + texture(u_below, uv - d2).rgb) * 0.25;
    col += 0.22 * max(bl - 0.40, 0.0);

    // gentle warm vignette — a finish, not the composition
    float vig = smoothstep(1.35, 0.35, length((uv - 0.5) * vec2(1.1, 1.0)));
    col *= mix(0.72, 1.04, vig);

    // 1/f film grain — modulated by high-frequency energy, multiplicative so
    // it never lifts the near-black floor into a cool/grey haze
    float high = mix(0.16, u_audio_high, playing);
    float g = (hash21(uv * u_resolution + fract(u_time) * 311.0) - 0.5);
    col *= 1.0 + g * (0.05 + 0.10 * high);

    col = reinhardPartial(max(col, 0.0), 1.7);
    col = pow(col, vec3(0.88));            // gentle gamma

    fragColor = vec4(col, 1.0);
}
