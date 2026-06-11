// ABOUTME: Bloom pyramid downsample for "luminous-verse" — 9-tap tent filter,
// ABOUTME: reused for every level (each pass binds the level above as u_src).
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform sampler2D u_src;

out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 px = 1.0 / vec2(textureSize(u_src, 0));

    // 9-tap tent: stable, no shimmer, cheap. Soft-clamp the centre so a
    // single hot texel can't firefly the whole pyramid.
    vec3 c = texture(u_src, uv).rgb;
    c = min(c, vec3(24.0));
    vec3 sum = c * 4.0;
    sum += texture(u_src, uv + vec2( px.x, 0.0)).rgb * 2.0;
    sum += texture(u_src, uv + vec2(-px.x, 0.0)).rgb * 2.0;
    sum += texture(u_src, uv + vec2(0.0,  px.y)).rgb * 2.0;
    sum += texture(u_src, uv + vec2(0.0, -px.y)).rgb * 2.0;
    sum += texture(u_src, uv + px).rgb;
    sum += texture(u_src, uv - px).rgb;
    sum += texture(u_src, uv + vec2(px.x, -px.y)).rgb;
    sum += texture(u_src, uv + vec2(-px.x, px.y)).rgb;

    fragColor = vec4(sum / 16.0, 1.0);
}
