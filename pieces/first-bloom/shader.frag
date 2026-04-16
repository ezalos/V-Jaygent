// ABOUTME: First Bloom — a slow breathing radial structure, two counter-rotating
// ABOUTME: petal fields interfering, warm core tapering to a cool rim.
#version 300 es
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;

out vec4 fragColor;

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
              / min(u_resolution.x, u_resolution.y) * 2.0;
    float r     = length(uv);
    float theta = atan(uv.y, uv.x);

    float breath = 0.55 + 0.10 * sin(u_time * 0.5);

    // Quantize petal count to adjacent integers and lerp — non-integer n in
    // cos(n*theta) breaks continuity across the atan2 seam on the -x axis.
    float t1   = 5.0 + 1.5 * sin(u_time * 0.13);
    float nLo  = floor(t1);
    float nHi  = nLo + 1.0;
    float f    = t1 - nLo;

    float a1Lo = 0.5 + 0.5 * cos(nLo         * theta + u_time * 0.7);
    float a1Hi = 0.5 + 0.5 * cos(nHi         * theta + u_time * 0.7);
    float arm1 = mix(a1Lo, a1Hi, f);

    float a2Lo = 0.5 + 0.5 * cos((nLo - 1.0) * theta - u_time * 0.5 + 0.7854);
    float a2Hi = 0.5 + 0.5 * cos((nHi - 1.0) * theta - u_time * 0.5 + 0.7854);
    float arm2 = mix(a2Lo, a2Hi, f);

    float field1 = exp(-pow((r - breath * arm1)       / 0.35, 2.0));
    float field2 = 0.6 *
                   exp(-pow((r - breath * arm2 * 1.2) / 0.50, 2.0));

    float total  = clamp(field1 + field2, 0.0, 1.4);

    vec3 warm = vec3(1.00, 0.55, 0.25);
    vec3 mid  = vec3(0.95, 0.75, 0.40);
    vec3 cool = vec3(0.15, 0.25, 0.50);

    vec3 col  = mix(cool, mid,  clamp(total, 0.0, 1.0));
         col  = mix(col,  warm, clamp(total * total, 0.0, 1.0));

    col *= 1.0 - 0.45 * smoothstep(0.6, 1.4, r);

    fragColor = vec4(col, 1.0);
}
