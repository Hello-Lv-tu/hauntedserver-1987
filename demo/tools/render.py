"""Turn the recorded frames into a 1080p video with camera moves, holds and captions."""
import bisect, json, math, subprocess, sys
from multiprocessing import Pool
from PIL import Image, ImageDraw, ImageFont

FPS = 30
OUT_W, OUT_H = 1920, 1080
SRC_SCALE = 2  # frames are 2560x1440 for a 1280x720 CSS viewport
SRC_END = 138.0
FFMPEG = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else 'out.mp4'
PREVIEW = sys.argv[3] if len(sys.argv) > 3 else None  # "t1,t2,..." output times -> stills

idx = json.load(open('index.json'))
TS = [i[0] for i in idx]

# Freeze the picture for a moment on the key evidence (source time, seconds).
HOLDS = [(51.9, 2.5), (66.0, 2.0), (87.0, 2.0), (104.9, 2.0)]


def O(src, extra=0.0):
    """Source time -> output time."""
    return src + sum(d for s, d in HOLDS if s < src) + extra


def src_of(out):
    """Output time -> source time."""
    shift = 0.0
    for s, d in HOLDS:
        if out - shift < s:
            break
        if out - shift < s + d:  # inside the hold
            return s
        shift += d
    return out - shift


TOTAL = O(SRC_END)

# Camera keyframes: (output time, zoom, centre x, centre y) in CSS pixels.
def K(src, z, cx, cy, extra=0.0):
    return (O(src, extra), z, cx, cy)

KEYS = [
    K(0, 1.0, 640, 360), K(4.5, 1.06, 655, 370), K(6.30, 1.16, 655, 370),
    K(6.32, 1.0, 640, 360), K(10.6, 1.0, 640, 360), K(12.2, 1.2, 620, 440),
    K(22.5, 1.22, 620, 470), K(24.2, 1.3, 600, 500), K(27.2, 1.3, 600, 500),
    K(28.2, 1.0, 640, 360), K(33.0, 1.0, 640, 360), K(35.0, 1.4, 560, 420),
    K(38.6, 1.45, 560, 430), K(39.6, 1.15, 640, 400), K(41.0, 1.0, 640, 360),
    K(44.6, 1.0, 640, 360), K(46.5, 1.3, 560, 470), K(50.6, 1.3, 560, 470),
    K(51.4, 1.45, 540, 430), K(51.9, 1.7, 480, 440), K(51.9, 1.78, 470, 445, 2.5),
    K(53.0, 1.35, 560, 420), K(56.6, 1.35, 520, 380), K(57.6, 1.0, 640, 360),
    K(61.0, 1.0, 640, 360), K(62.5, 1.25, 600, 470), K(65.2, 1.4, 480, 440),
    K(66.0, 1.8, 420, 430), K(66.0, 1.88, 420, 430, 2.0), K(67.0, 1.3, 560, 470),
    K(70.4, 1.3, 560, 470), K(71.4, 1.0, 640, 360), K(74.6, 1.0, 640, 360),
    K(76.4, 1.3, 520, 380), K(77.9, 1.6, 480, 335), K(78.9, 1.6, 480, 335),
    K(79.6, 1.0, 640, 360), K(83.2, 1.0, 640, 360), K(84.6, 1.3, 560, 470),
    K(86.2, 1.3, 540, 300), K(87.0, 1.5, 520, 190), K(87.0, 1.58, 520, 190, 2.0),
    K(88.0, 1.0, 640, 360), K(90.0, 1.0, 640, 360), K(91.6, 1.25, 580, 470),
    K(95.6, 1.25, 580, 470), K(96.3, 1.05, 640, 380), K(98.6, 1.1, 620, 420),
    K(100.8, 1.3, 560, 470), K(104.0, 1.45, 530, 430), K(104.9, 1.5, 530, 420),
    K(104.9, 1.58, 530, 420, 2.0), K(106.0, 1.3, 560, 470), K(108.4, 1.25, 580, 470),
    K(109.4, 1.0, 640, 360), K(113.0, 1.0, 640, 360), K(114.5, 1.25, 580, 480),
    K(119.5, 1.25, 580, 480), K(121.0, 1.3, 560, 500), K(124.0, 1.3, 560, 500),
    K(124.8, 1.0, 640, 360), K(127.0, 1.0, 640, 360), K(129.8, 1.12, 640, 330),
    K(130.2, 1.12, 640, 360), K(132.5, 1.08, 640, 380), K(SRC_END, 1.04, 640, 380),
]
KT = [k[0] for k in KEYS]

# Small camera shakes when Jack strikes (output time).
SHAKES = [O(27.65), O(96.7)]

C = lambda a, b, text, ea=0.0: (O(a, ea), O(b), text)
CAPTIONS = [
    C(0.6, 5.8, 'A haunted machine room. One terminal still glows: a 1987 Unix server.'),
    C(7.2, 20.6, 'A little ghost, Nell, is trapped inside. You talk to her with the real write command.'),
    C(20.8, 24.0, 'Her replies are written by AI, in character. The story itself is scripted.'),
    C(24.2, 27.4, 'Real commands: ls -a finds her hidden note.'),
    C(27.8, 32.8, 'Level 1: Jack-o\'-Daemon, a "modern" AI agent, shows a fake virus popup.'),
    C(33.0, 41.0, "Nell is from 1987 and can't tell it's a scam. You can. ps aux finds the program; kill ends it."),
    C(41.3, 44.6, 'Every level ends with a real-world lesson.'),
    C(44.9, 51.8, 'Level 2: phishing. A mail signed "Nell" asks for your password.'),
    (O(51.9) + 0.05, O(57.0), 'Full headers: it came from a .cloud server. "Sent from my iPhone"... in 1987.'),
    C(60.7, 65.9, 'Level 3: ransomware. "Pay $9.99/month to unlock your files."'),
    (O(66.0) + 0.05, O(70.8), 'ls -l: the sizes never changed. Nothing was encrypted, only locked. chmod opens them.'),
    C(74.4, 77.6, 'Level 4: an "AI assistant" says rm -rf ~ will free Nell.'),
    C(77.8, 83.0, 'The manual says it deletes your whole home directory. So: No thanks.'),
    C(83.2, 90.0, "Level 5: Jack rewrote the system log. diff against yesterday's copy exposes him."),
    C(90.6, 96.2, 'Boss: Jack runs as root. su makes you root too.'),
    C(96.4, 104.8, 'Kill him and he comes back. The cause: cron restarts him every minute.'),
    (O(104.9) + 0.05, O(110.0), 'Remove the program, then kill him. Gone for good.'),
    C(113.4, 120.4, 'Free at last. Come with me, or stay?'),
    C(120.6, 124.7, 'She travels the 1987 way: on tape.'),
    C(125.6, 129.8, 'Nell wakes up in 2026, in your browser tab.'),
    C(130.2, 134.6, 'Real shell commands. Six everyday scams.'),
    C(134.8, SRC_END - 0.2, 'Play free: hauntedserver-1987.vercel.app  ·  Built with Kiro for Kiroween 2026'),
]

FONT_PATH = '/usr/share/fonts/google-noto-vf/NotoSans[wght].ttf'
_font = None
_cap_cache = {}


def font():
    global _font
    if _font is None:
        _font = ImageFont.truetype(FONT_PATH, 36)
        try:
            _font.set_variation_by_name('SemiBold')
        except Exception:
            pass
    return _font


def caption_image(text):
    if text in _cap_cache:
        return _cap_cache[text]
    f = font()
    max_w = 1500
    words, lines, cur = text.split(' '), [], ''
    for w in words:
        trial = (cur + ' ' + w).strip()
        if f.getlength(trial) <= max_w:
            cur = trial
        else:
            lines.append(cur); cur = w
    lines.append(cur)
    line_h = 50
    tw = int(max(f.getlength(l) for l in lines))
    pad_x, pad_y = 30, 16
    w, h = tw + 2 * pad_x, line_h * len(lines) + 2 * pad_y
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=16, fill=(12, 14, 18, 205))
    for i, l in enumerate(lines):
        lw = f.getlength(l)
        d.text(((w - lw) / 2, pad_y + i * line_h + 4), l, font=f, fill=(255, 255, 255, 255))
    _cap_cache[text] = im
    return im


def ease(s):
    return s * s * (3 - 2 * s)


def camera(t):
    i = bisect.bisect_right(KT, t) - 1
    if i < 0:
        return KEYS[0][1:]
    if i >= len(KEYS) - 1:
        return KEYS[-1][1:]
    a, b = KEYS[i], KEYS[i + 1]
    span = b[0] - a[0]
    s = 1.0 if span <= 1e-6 else ease(min(1.0, max(0.0, (t - a[0]) / span)))
    z = math.exp(math.log(a[1]) + (math.log(b[1]) - math.log(a[1])) * s)
    return z, a[2] + (b[2] - a[2]) * s, a[3] + (b[3] - a[3]) * s


_last = [None, None]


def source_frame(src_t):
    i = max(0, bisect.bisect_right(TS, src_t) - 1)
    if _last[0] != i:
        _last[0] = i
        _last[1] = Image.open('frames/' + idx[i][1]).convert('RGB')
    return _last[1]


def render(n):
    t = n / FPS
    src = source_frame(src_of(t))
    z, cx, cy = camera(t)
    for st in SHAKES:
        dt = t - st
        if 0 <= dt < 0.5:
            amp = 5 * (1 - dt / 0.5)
            cx += amp * math.sin(dt * 70)
            cy += amp * math.cos(dt * 55)
    w, h = 1280 / z, 720 / z
    x0 = min(max(cx - w / 2, 0), 1280 - w)
    y0 = min(max(cy - h / 2, 0), 720 - h)
    sx, sy = src.width / 1280, src.height / 720
    box = (x0 * sx, y0 * sy, min(src.width, (x0 + w) * sx), min(src.height, (y0 + h) * sy))
    frame = src.resize((OUT_W, OUT_H), Image.LANCZOS, box=box)
    for a, b, text in CAPTIONS:
        if a <= t < b:
            alpha = min(1.0, (t - a) / 0.25, (b - t) / 0.25)
            cap = caption_image(text)
            if alpha < 1:
                cap = cap.copy(); cap.putalpha(cap.getchannel('A').point(lambda v: int(v * alpha)))
            frame.paste(cap, ((OUT_W - cap.width) // 2, OUT_H - 70 - cap.height), cap)
    fade = min(1.0, t / 0.8, (TOTAL - t) / 1.0)
    if fade < 1:
        frame = Image.blend(Image.new('RGB', frame.size), frame, max(0.0, fade))
    return frame.tobytes()


if __name__ == '__main__':
    if PREVIEW:
        for s in PREVIEW.split(','):
            n = int(float(s) * FPS)
            Image.frombytes('RGB', (OUT_W, OUT_H), render(n)).save(f'p_{s}.jpg', quality=85)
        sys.exit(0)
    frames = int(TOTAL * FPS)
    enc = subprocess.Popen([FFMPEG, '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
                            '-s', f'{OUT_W}x{OUT_H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264',
                            '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT],
                           stdin=subprocess.PIPE)
    with Pool(7) as pool:
        for k, data in enumerate(pool.imap(render, range(frames), chunksize=30)):
            enc.stdin.write(data)
            if k % 600 == 0:
                print(f'{k}/{frames}', flush=True)
    enc.stdin.close()
    enc.wait()
    print('done', TOTAL)
