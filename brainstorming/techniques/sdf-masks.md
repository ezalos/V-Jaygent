# SDF masks for partial coverage

Fragment shaders make layers that fill the frame by default — every pixel gets
evaluated. The VJ look requires **partial coverage**: each layer has its own
shape, and everywhere outside that shape the layer contributes nothing.

Signed distance functions (SDFs) solve this cheaply. A 2D SDF returns the
signed distance from a pixel to the nearest edge of a shape; negative inside,
positive outside. Masks come from thresholding:

```glsl
float mask = smoothstep(0.01, -0.01, sdf(p));  // 1 inside, 0 outside, soft edge
vec3 layered = blend(background, layer_content * mask);
```

## The primitives

```glsl
// Circle, radius r, centred at origin
float sdCircle(vec2 p, float r) { return length(p) - r; }

// Rectangle, half-extents b
float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// Rounded rectangle — round off corners by r
float sdRoundedBox(vec2 p, vec2 b, float r) {
    return sdBox(p, b - vec2(r)) - r;
}

// Equilateral triangle, side length s
float sdTriangle(vec2 p, float s) {
    const float k = sqrt(3.0);
    p.x = abs(p.x) - s; p.y += s / k;
    if (p.x + k*p.y > 0.0) p = vec2(p.x - k*p.y, -k*p.x - p.y) / 2.0;
    p.x -= clamp(p.x, -2.0 * s, 0.0);
    return -length(p) * sign(p.y);
}

// Regular N-gon, radius r
float sdNgon(vec2 p, float r, int n) {
    float an = 3.14159265/float(n);
    float a = atan(p.y, p.x);
    a = mod(a + an, 2.0*an) - an;
    return length(p) * cos(a) - r * cos(an);
}
```

## Boolean algebra

```glsl
float uni  = min(a, b);                     // union
float ins  = max(a, b);                     // intersection
float sub  = max(a, -b);                    // subtract b from a
float sUni = -k*log(exp(-a/k) + exp(-b/k)); // smooth union (smoothmin)
```

`smoothUnion` with small `k` (0.05) gives organic blobby edges — good for
layers that feel alive rather than cut-out.

## Moving the mask

Each layer's mask has its own centre and rotation:

```glsl
vec2 rotate(vec2 p, float a) { float c=cos(a), s=sin(a); return mat2(c,-s,s,c)*p; }

vec2 localP = rotate(p - centre_i, -rot_i) / scale_i;
float mask = smoothstep(0.01, -0.01, sdRoundedBox(localP, size_i, 0.1));
```

## Reference

- Canonical: <https://iquilezles.org/articles/distfunctions/>
- Live reference toy: <https://www.shadertoy.com/view/Xds3zN>
