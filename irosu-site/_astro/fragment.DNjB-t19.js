var e=`#version 300 es

precision highp float;

uniform vec2 uResolution; 
uniform sampler2D uTrail; 
uniform float uCellSize; 
uniform float uScroll;
uniform float uThickness; 
uniform float uThicknessBoost; 
uniform vec3 uColor; 
uniform vec3 uColorHot; 
uniform float uBaseAlpha; 
uniform float uHotAlpha; 

uniform float uClipLeft;
uniform float uClipRight;
uniform float uClipTop;
uniform float uClipBottom;

uniform float uRevealOn;
uniform float uRevealT;
uniform float uRevealDur;
uniform float uRevealSpread;
uniform float uRevealOut;
uniform float uRevealStyle; 
uniform float uRevealEase;
uniform vec2 uRevealOrigin;
uniform float uRevealSoft;
uniform float uRevealMax;

in vec2 vUv;

out vec4 fragColor;

float maskAt(vec2 px)
{
    vec2 lo = vec2(uClipLeft, uClipBottom);
    vec2 hi = uResolution - vec2(uClipRight, uClipTop);
    vec2 inside = step(lo, px) * step(px, hi);

    return inside.x * inside.y;
}

float ease(float t)
{
    t = clamp(t, 0.0, 1.0);
    int e = int(uRevealEase + 0.5);

    if (e == 1) return t < 0.5 ? 2.0 * t * t : 1.0 - pow(-2.0 * t + 2.0, 2.0) / 2.0;
    if (e == 2) return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
    if (e == 3) return t < 0.5 ? 8.0 * pow(t, 4.0) : 1.0 - pow(-2.0 * t + 2.0, 4.0) / 2.0;
    if (e == 4)
    {
        if (t <= 0.0 || t >= 1.0) return t;
        return t < 0.5 ? pow(2.0, 20.0 * t - 10.0) / 2.0 : (2.0 - pow(2.0, -20.0 * t + 10.0)) / 2.0;
    }
    if (e == 5) return 1.0 - pow(1.0 - t, 3.0);
    if (e == 6) return t >= 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * t);
    if (e == 7) return -(cos(3.14159265 * t) - 1.0) / 2.0;
    return t;
}

float hash(float n)
{
    return fract(sin(n * 127.1 + 311.7) * 43758.5453);
}

float order(int kind, float n, float id)
{
    if (kind == 1) return abs(n - 0.5) * 2.0;
    if (kind == 2) return 1.0 - abs(n - 0.5) * 2.0;
    if (kind == 3) return hash(id);
    return n;
}

float along(int origin, float a)
{
    if (origin == 1) return 1.0 - a;
    if (origin == 2) return abs(a - 0.5) * 2.0;
    return a;
}

float lineReveal(float n, float id, float a, float len, bool vertical)
{
    int style = int(uRevealStyle + 0.5);
    bool hiding = uRevealOut > 0.5;
    bool odd = mod(id, 2.0) > 0.5;

    int kind = 0;
    int origin = hiding ? 1 : 0;
    float at = 0.0;

    if (style == 1)
    {
        kind = hiding ? 2 : 1;
        origin = 2;
    }
    else if (style == 2)
    {
        kind = 1;
        origin = (!odd != hiding) ? 0 : 1;
    }
    else if (style == 3)
    {
        kind = vertical ? 1 : 0;
        at = uRevealSpread * (vertical == hiding ? 0.5 : 0.0);
    }
    else if (style == 4)
    {
        kind = 3;
        origin = odd ? 1 : 0;
    }

    float delay = at + uRevealSpread * order(kind, clamp(n, 0.0, 1.0), id + (vertical ? 0.0 : 5000.0));
    float p = ease((uRevealT - delay) / max(uRevealDur, 1e-4));
    float s = hiding ? 1.0 - p : p;

    return clamp((s - along(origin, a)) * len, 0.0, 1.0);
}

void main()
{
    vec2 px = vUv * uResolution;

    vec2 cell = vec2(px.x, px.y - uScroll) / uCellSize;
    vec2 deriv = fwidth(cell);

    float m = maskAt(px);
    if (m < 0.001) discard;

    float spot = clamp(texture(uTrail, vUv).r, 0.0, 1.0);

    vec2 gridDist = abs(fract(cell - 0.5) - 0.5) / max(deriv, vec2(1e-5));
    float thickness = uThickness + spot * uThicknessBoost;
    float coverV = 1.0 - smoothstep(0.0, 1.0, gridDist.x - (thickness - 1.0));
    float coverH = 1.0 - smoothstep(0.0, 1.0, gridDist.y - (thickness - 1.0));

    if (uRevealOn > 0.5)
    {
        if (int(uRevealStyle + 0.5) == 5)
        {
            float d = length(vec2(px.x, uResolution.y - px.y) - uRevealOrigin);
            float r = ease(uRevealT / max(uRevealDur + uRevealSpread, 1e-4)) * uRevealMax;
            float inside = 1.0 - smoothstep(r - uRevealSoft, r, d);
            float keep = uRevealOut > 0.5 ? 1.0 - inside : inside;
            coverV *= keep;
            coverH *= keep;
        }
        else
        {
            float idV = floor(cell.x + 0.5);
            float idH = floor(cell.y + 0.5);
            float nV = idV * uCellSize / uResolution.x;
            float nH = 1.0 - (idH * uCellSize + uScroll) / uResolution.y;
            coverV *= lineReveal(nV, idV, 1.0 - vUv.y, uResolution.y, true);
            coverH *= lineReveal(nH, idH, vUv.x, uResolution.x, false);
        }
    }

    float coverage = max(coverV, coverH);

    float alpha = mix(uBaseAlpha, uHotAlpha, spot) * coverage * m;
    if (alpha < 0.001) discard;

    vec3 color = mix(uColor, uColorHot, spot);
    fragColor = vec4(color * alpha, alpha);
}`;export{e as t};