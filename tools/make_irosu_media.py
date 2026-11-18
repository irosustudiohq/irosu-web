"""All Irosu media for the website, made from Irosu's own material (no outside images).

Sources: the headphone-character concept cut (test-art/artbook2: lines/, paint/, paint_alpha/) and the 1080p
recording of the real Irosu desktop app (demo_recordings/irosu_demo_recording.mp4).

    python make_irosu_media.py <site_dir>

Writes into <site_dir>:
  video/irosu-app.mp4 + _astro/irosu-app-poster.jpg  app footage for the pinned demo frame (16:9, no audio)
  video/footer-dual.mp4 (2880x1280) and video/footer.mp4 (1440x1280)  pixel-footer sources, same layout as
      the template: [colour | mask] per figure, mask white = figure
  _astro/irosu-cover.webp                     background picture behind "Too many ..." (canvas effect)
  _astro/irosu-photo-1.webp, irosu-photo-2.webp  the two pictures in the phone dashboard
  testimonials/frame-1..5.webp                carousel pictures (frames of the cut)
  og.jpg                                      1800x945 share image
"""
import os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

IROSU = r'C:\Users\edete\Desktop\irosu'
ART = os.path.join(IROSU, 'test-art', 'artbook2')
REC = os.path.join(IROSU, 'demo_recordings', 'irosu_demo_recording.mp4')
FFMPEG = r'C:\Users\edete\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0-full_build\bin\ffmpeg.exe'
LAVENDER = (184, 174, 255)
GREY = (240, 240, 240)
INK = (28, 28, 26)
FRAMES = [f'F{i:02d}' for i in range(1, 11)]


def paint(name):
    return Image.open(os.path.join(ART, 'paint', name + '.png')).convert('RGB')


def lines(name):
    return Image.open(os.path.join(ART, 'lines', name + '.png')).convert('RGB')


def figure_mask(img):
    """White = character. The art sits on white paper, so the figure is everything that is not near-white,
    closed and filled so line gaps and highlights inside the figure do not punch holes."""
    a = np.asarray(img).astype(int)
    fg = (a.min(axis=2) < 232)
    m = Image.fromarray((fg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(5))
    # fill holes: flood the background from the border, everything not reached is figure
    w, h = m.size
    canvas = Image.new('L', (w + 2, h + 2), 0)
    canvas.paste(m, (1, 1))
    ImageDraw.floodfill(canvas, (0, 0), 128)
    bg = np.asarray(canvas)[1:-1, 1:-1] == 128
    return Image.fromarray(((~bg) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))


def run(cmd, data=None):
    subprocess.run(cmd, input=data, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def encode(frames, out, fps, w, h, crf=24):
    cmd = [FFMPEG, '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{w}x{h}', '-r', str(fps), '-i', '-',
           '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', str(crf), '-preset', 'slow', '-movflags', '+faststart', '-an', out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    for f in frames:
        p.stdin.write(f.tobytes())
    p.stdin.close()
    p.wait()
    if p.returncode:
        raise SystemExit(p.stderr.read().decode())


def app_video(site):
    out = os.path.join(site, 'video', 'irosu-app.mp4')
    run([FFMPEG, '-v', 'error', '-y', '-i', REC, '-vf', 'scale=1600:-2:flags=lanczos,fps=30', '-c:v', 'libx264',
         '-pix_fmt', 'yuv420p', '-crf', '26', '-preset', 'slow', '-movflags', '+faststart', '-an', out])
    run([FFMPEG, '-v', 'error', '-y', '-ss', '16', '-i', REC, '-frames:v', '1', '-vf', 'scale=1600:-2:flags=lanczos',
         '-q:v', '3', os.path.join(site, '_astro', 'irosu-app-poster.jpg')])
    print('app video', os.path.getsize(out) // 1024, 'KB')


def figure_panel(name, mirror, pw=720, ph=1280):
    """One [colour | mask] pair for the pixel footer: the character bottom-aligned in a tall panel."""
    img, mask = paint(name), None
    mask = figure_mask(img)
    scale = pw * 1.55 / img.width               # crop in a little: the figure fills the panel like a person
    size = (int(img.width * scale), int(img.height * scale))
    img = img.resize(size, Image.LANCZOS)
    mask = mask.resize(size, Image.LANCZOS)
    if mirror:
        img, mask = ImageOps.mirror(img), ImageOps.mirror(mask)
    x = (pw - size[0]) // 2 + (60 if mirror else -60)
    y = ph - size[1] - 60
    col = Image.new('RGB', (pw, ph), (226, 226, 222))
    col.paste(img, (x, y), mask)
    msk = Image.new('RGB', (pw, ph), (0, 0, 0))
    msk.paste(Image.new('RGB', size, (255, 255, 255)), (x, y), mask)
    return col, msk


def footer_videos(site):
    fps, seconds = 24, 7
    hold = 3                                    # anime "on threes": each drawing held 3 frames
    seqA = [FRAMES[(i // hold) % 10] for i in range(fps * seconds)]
    seqB = [FRAMES[(i // hold + 5) % 10] for i in range(fps * seconds)]
    cache = {}

    def pair(n, mirror):
        k = (n, mirror)
        if k not in cache:
            cache[k] = figure_panel(n, mirror)
        return cache[k]
    dual, single = [], []
    for a, b in zip(seqA, seqB):
        ca, ma = pair(a, False)
        cb, mb = pair(b, True)
        d = Image.new('RGB', (2880, 1280))
        for i, p in enumerate((ca, ma, cb, mb)):
            d.paste(p, (i * 720, 0))
        dual.append(d)
        s = Image.new('RGB', (1440, 1280))
        s.paste(ca, (0, 0)); s.paste(ma, (720, 0))
        single.append(s)
    encode(dual, os.path.join(site, 'video', 'footer-dual.mp4'), fps, 2880, 1280, crf=26)
    encode(single, os.path.join(site, 'video', 'footer.mp4'), fps, 1440, 1280, crf=26)
    print('footer videos done')


def cover(site):
    """Behind 'Too many small fixes': a contact sheet of the cut's raw line frames, the work waiting to be done."""
    w, h = 1280, 734
    sheet = Image.new('RGB', (w, h), (245, 245, 242))
    cw, ch = w // 4, h // 3
    for i in range(12):
        f = lines(FRAMES[i % 10]).resize((cw, int(cw * 278 / 494)), Image.LANCZOS)
        sheet.paste(f, ((i % 4) * cw, (i // 4) * ch + (ch - f.height) // 2))
    sheet.save(os.path.join(site, '_astro', 'irosu-cover.webp'), quality=82)


def square(img, size, focus_x=0.42):
    w, h = img.size
    s = min(w, h)
    x = int((w - s) * focus_x)
    return img.crop((x, 0, x + s, s)).resize((size, size), Image.LANCZOS)


def photos(site):
    square(paint('F03'), 535).save(os.path.join(site, '_astro', 'irosu-photo-1.webp'), quality=86)
    square(lines('F03'), 535).save(os.path.join(site, '_astro', 'irosu-photo-2.webp'), quality=86)
    os.makedirs(os.path.join(site, 'testimonials'), exist_ok=True)
    for i, (n, fx) in enumerate([('F02', .45), ('F04', .40), ('F06', .40), ('F08', .55), ('F10', .45)], 1):
        square(paint(n), 480, fx).save(os.path.join(site, 'testimonials', f'frame-{i}.webp'), quality=86)


def og(site):
    W, H = 1800, 945
    im = Image.new('RGB', (W, H), LAVENDER)
    art = paint('F05').resize((1100, int(1100 * 278 / 494)), Image.LANCZOS)
    lin = lines('F05').resize(art.size, Image.LANCZOS)
    # left half line art, right half painted: what Irosu does, in one picture
    half = art.width // 2
    combo = lin.copy(); combo.paste(art.crop((half, 0, art.width, art.height)), (half, 0))
    d = ImageDraw.Draw(combo); d.line([(half, 0), (half, art.height)], fill=INK, width=3)
    frame = Image.new('RGB', (combo.width + 24, combo.height + 24), 'white')
    frame.paste(combo, (12, 12))
    im.paste(frame, (W - frame.width - 70, (H - frame.height) // 2))
    mark = Image.open(os.path.join(site, '_astro', 'irosu-mark-og.png')).convert('RGBA') if os.path.exists(os.path.join(site, '_astro', 'irosu-mark-og.png')) else None
    if mark:
        im.paste(mark, (80, 90), mark)
    im.save(os.path.join(site, 'og.jpg'), quality=88)


if __name__ == '__main__':
    site = sys.argv[1]
    os.makedirs(os.path.join(site, 'video'), exist_ok=True)
    which = sys.argv[2:] or ['app', 'footer', 'cover', 'photos', 'og']
    if 'app' in which: app_video(site)
    if 'footer' in which: footer_videos(site)
    if 'cover' in which: cover(site)
    if 'photos' in which: photos(site)
    if 'og' in which: og(site)
    print('done', which)
