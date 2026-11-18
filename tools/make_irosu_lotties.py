"""Irosu logo Lotties, drop-in replacements for the template's four logo animations.

Same canvas sizes and timeline as the originals (ip 17, op 61; the template plays frames 17-38 then holds),
so the loader, hero, intro and price-grid code keep working untouched:
  logo-left.json  445x383  the brush ring paints itself on (loader, left half)
  logo-right.json 445x383  the violet dot drops in       (loader, right half)
  logo-loop.json  300x330  the whole mark                 (hero cell, intro)
  logo.json       445x383  the whole mark                 (price grid centre)

The ring is the real tapered brush shape from brand/logo/violet, revealed by a thick stroke that travels
around it (alpha track matte), like the desktop splash. python make_irosu_lotties.py <out_dir>
"""
import json, math, os, sys

INK = [0.110, 0.110, 0.102, 1]      # #1C1C1A, the template's ink
DOT = [0.431, 0.357, 1.0, 1]        # #6E5BFF, Irosu violet
IP, OP, T0, T1 = 17, 61, 17, 38      # template timeline: draw 17->38, hold after
DOT_T0, DOT_T1 = 31, 40

# The mark, in its 96x96 design box (same path as product/web/js/icons.js).
RING = [('M', 44, 7), ('C', 24, 6, 8, 22, 8, 43), ('C', 8, 64, 24, 80, 44, 80), ('C', 62, 80, 76, 68, 80, 52),
        ('C', 75, 64, 62, 72, 46, 72), ('C', 29, 72, 17, 59, 17, 43), ('C', 17, 27, 29, 15, 45, 15),
        ('C', 52, 15, 58, 17, 63, 21), ('A', 4.5, 4.5, 0, 0, 0, 66, 13), ('C', 59, 9, 52, 7, 44, 7)]
DOT_C, DOT_R = (78, 25), 6.5
TRIM_START = float(os.environ.get('TRIM_START', 230))  # degrees: where the brush stroke begins


def arc_to_cubics(x1, y1, rx, ry, phi, fa, fs, x2, y2):
    """SVG elliptical arc -> list of cubic segments (c1, c2, end). Standard endpoint->centre conversion."""
    phi = math.radians(phi)
    cp, sp = math.cos(phi), math.sin(phi)
    dx, dy = (x1 - x2) / 2, (y1 - y2) / 2
    x1p, y1p = cp * dx + sp * dy, -sp * dx + cp * dy
    lam = (x1p ** 2) / rx ** 2 + (y1p ** 2) / ry ** 2
    if lam > 1:
        rx, ry = rx * math.sqrt(lam), ry * math.sqrt(lam)
    num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p
    den = rx * rx * y1p * y1p + ry * ry * x1p * x1p
    co = math.sqrt(max(0, num / den)) * (-1 if fa == fs else 1)
    cxp, cyp = co * rx * y1p / ry, -co * ry * x1p / rx
    cx, cy = cp * cxp - sp * cyp + (x1 + x2) / 2, sp * cxp + cp * cyp + (y1 + y2) / 2

    def ang(ux, uy, vx, vy):
        a = math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
        return a
    t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
    dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
    if not fs and dt > 0:
        dt -= 2 * math.pi
    elif fs and dt < 0:
        dt += 2 * math.pi
    n = max(1, int(math.ceil(abs(dt) / (math.pi / 2))))
    d = dt / n
    k = 4 / 3 * math.tan(d / 4)
    segs, t = [], t1
    for _ in range(n):
        c1x, c1y = math.cos(t), math.sin(t)
        c2x, c2y = math.cos(t + d), math.sin(t + d)
        p1 = (c1x - k * c1y, c1y + k * c1x)
        p2 = (c2x + k * c2y, c2y - k * c2x)
        p3 = (c2x, c2y)
        tr = lambda p: (cx + rx * p[0] * cp - ry * p[1] * sp, cy + rx * p[0] * sp + ry * p[1] * cp)
        segs.append((tr(p1), tr(p2), tr(p3)))
        t += d
    return segs


def ring_bezier(scale, ox, oy):
    """RING commands -> Lottie closed path {v, i, o} (tangents relative to their vertex)."""
    verts, ins, outs = [], [], []
    cur = None
    for cmd in RING:
        if cmd[0] == 'M':
            cur = (cmd[1], cmd[2]); verts.append(cur); ins.append((0, 0)); outs.append((0, 0))
            continue
        if cmd[0] == 'C':
            segs = [((cmd[1], cmd[2]), (cmd[3], cmd[4]), (cmd[5], cmd[6]))]
        else:
            segs = arc_to_cubics(cur[0], cur[1], *cmd[1:])
        for c1, c2, end in segs:
            outs[-1] = (c1[0] - cur[0], c1[1] - cur[1])
            # closing segment back to the start vertex: write its in-tangent onto vertex 0
            if abs(end[0] - verts[0][0]) < 1e-6 and abs(end[1] - verts[0][1]) < 1e-6:
                ins[0] = (c2[0] - end[0], c2[1] - end[1])
            else:
                verts.append(end); ins.append((c2[0] - end[0], c2[1] - end[1])); outs.append((0, 0))
            cur = end
    f = lambda p: [round(p[0] * scale + ox, 3), round(p[1] * scale + oy, 3)]
    g = lambda p: [round(p[0] * scale, 3), round(p[1] * scale, 3)]
    return {'c': True, 'v': [f(v) for v in verts], 'i': [g(t) for t in ins], 'o': [g(t) for t in outs]}


def static(v):
    return {'a': 0, 'k': v}


def anim(keys):
    """keys: [(t, value_list), ...] eased in-out."""
    out = []
    for t, v in keys[:-1]:
        out.append({'t': t, 's': v, 'i': {'x': [0.3] * len(v), 'y': [1] * len(v)}, 'o': {'x': [0.6] * len(v), 'y': [0] * len(v)}})
    out.append({'t': keys[-1][0], 's': keys[-1][1]})
    return {'a': 1, 'k': out}


def tr(p=(0, 0), a=(0, 0), s=(100, 100), o=100):
    return {'ty': 'tr', 'p': static(list(p)), 'a': static(list(a)), 's': static(list(s)), 'r': static(0),
            'o': static(o), 'sk': static(0), 'sa': static(0), 'nm': 'Transform'}


def layer_ks(o=100, p=(0, 0, 0), a=(0, 0, 0), s=(100, 100, 100)):
    return {'o': static(o) if not isinstance(o, dict) else o, 'r': static(0), 'p': static(list(p)) if not isinstance(p, dict) else p,
            'a': static(list(a)), 's': static(list(s)) if not isinstance(s, dict) else s}


def shape_layer(ind, nm, shapes, ks=None, **extra):
    L = {'ddd': 0, 'ind': ind, 'ty': 4, 'nm': nm, 'sr': 1, 'ks': ks or layer_ks(), 'ao': 0, 'shapes': shapes,
         'ip': 0, 'op': OP, 'st': 0, 'bm': 0}
    L.update(extra)
    return L


def ring_layers(ind, W, H, size, draw=True):
    """Tapered ring fill + (optional) travelling-stroke matte. Returns layers top-first."""
    scale = size / 96.0
    ox, oy = (W - size) / 2, (H - size) / 2
    fill = {'ty': 'gr', 'nm': 'Ring', 'it': [{'ty': 'sh', 'nm': 'Path', 'ks': static(ring_bezier(scale, ox, oy))},
                                             {'ty': 'fl', 'nm': 'Fill', 'c': static(INK), 'o': static(100), 'r': 1}, tr()]}
    if not draw:
        return [shape_layer(ind, 'Ring', [fill])]
    # matte: a fat stroke along a circle through the ring body, starting at the brush tail (top right)
    cx, cy, r = 44 * scale + ox, 43.5 * scale + oy, 32 * scale
    k = 0.5523 * r
    circle = {'c': True, 'v': [[cx + r, cy], [cx, cy + r], [cx - r, cy], [cx, cy - r]],
              'i': [[0, -k], [k, 0], [0, k], [-k, 0]], 'o': [[0, k], [-k, 0], [0, -k], [k, 0]]}
    stroke = {'ty': 'gr', 'nm': 'Reveal', 'it': [
        {'ty': 'sh', 'nm': 'Path', 'ks': static(circle)},
        {'ty': 'st', 'nm': 'Stroke', 'c': static([1, 1, 1, 1]), 'o': static(100), 'w': static(26 * scale), 'lc': 2, 'lj': 2, 'ml': 4},
        tr(p=(cx, cy), a=(cx, cy), s=(-100, 100))]}  # mirrored so it travels counter-clockwise like a brush
    trim = {'ty': 'tm', 'nm': 'Trim', 's': static(0), 'e': anim([(T0, [0]), (T1, [100])]), 'o': static(TRIM_START), 'm': 1}
    matte = shape_layer(ind, 'Reveal matte', [stroke, trim], td=1)
    ring = shape_layer(ind + 1, 'Ring', [fill], tt=1)
    return [matte, ring]


def dot_layer(ind, W, H, size, animated=True):
    scale = size / 96.0
    ox, oy = (W - size) / 2, (H - size) / 2
    cx, cy, r = DOT_C[0] * scale + ox, DOT_C[1] * scale + oy, DOT_R * scale
    el = {'ty': 'gr', 'nm': 'Dot', 'it': [{'ty': 'el', 'nm': 'Ellipse', 'p': static([0, 0]), 's': static([2 * r, 2 * r]), 'd': 1},
                                         {'ty': 'fl', 'nm': 'Fill', 'c': static(DOT), 'o': static(100), 'r': 1}, tr()]}
    if animated:
        ks = layer_ks(o=anim([(DOT_T0, [0]), (DOT_T0 + 3, [100])]),
                      p=anim([(DOT_T0, [cx, cy - 9 * scale, 0]), (DOT_T1, [cx, cy, 0])]),
                      s=anim([(DOT_T0, [0, 0, 100]), (DOT_T0 + 6, [118, 118, 100]), (DOT_T1, [100, 100, 100])]))
    else:
        ks = layer_ks(p=(cx, cy, 0))
    return shape_layer(ind, 'Dot', [el], ks=ks)


def comp(W, H, layers, nm):
    return {'v': '5.7.4', 'fr': 30, 'ip': IP, 'op': OP, 'w': W, 'h': H, 'nm': nm, 'ddd': 0, 'assets': [], 'layers': layers}


def main(out):
    os.makedirs(out, exist_ok=True)
    W, H, S = 445, 383, 300            # loader/price-grid canvas, mark size in it
    files = {
        'logo-left.json': comp(W, H, ring_layers(1, W, H, S), 'Irosu ring'),
        'logo-right.json': comp(W, H, [dot_layer(1, W, H, S)], 'Irosu dot'),
        'logo.json': comp(W, H, [dot_layer(1, W, H, S)] + ring_layers(2, W, H, S), 'Irosu mark'),
        'logo-loop.json': comp(300, 330, [dot_layer(1, 300, 330, 300)] + ring_layers(2, 300, 330, 300), 'Irosu mark'),
    }
    for name, data in files.items():
        with open(os.path.join(out, name), 'w', encoding='utf-8') as f:
            json.dump(data, f, separators=(',', ':'))
        print('wrote', name)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'lotties')
