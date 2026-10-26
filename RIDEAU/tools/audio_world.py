"""Sons du monde de RIDEAU ! : musiques de la ville, ambiances en boucle, pas,
sons de lieux et d'actions. 100 % synthétisés ici (licence du projet).

Les boucles sont sans couture : bruits filtrés dans le domaine fréquentiel
(filtrage circulaire), modulations dont la période divise la durée, événements
placés « modulo » la longueur, réverbération par convolution circulaire.
Appelé par tools/generate_audio.py.
"""
import numpy as np

SR = 22050


# --- Outils ---------------------------------------------------------------------------

def secs(d):
    return np.arange(int(SR * d)) / SR


@np.errstate(over="ignore")
def band(sig, lo, hi, soft=0.15):
    """Filtre passe-bande circulaire (FFT) avec bords adoucis."""
    spec = np.fft.rfft(sig)
    f = np.fft.rfftfreq(len(sig), 1 / SR)
    g = np.ones_like(f)
    if lo > 0:
        g *= 1 / (1 + np.exp(-(f - lo) / max(1.0, lo * soft)))
    if hi < SR / 2:
        g *= 1 / (1 + np.exp((f - hi) / max(1.0, hi * soft)))
    return np.fft.irfft(spec * g, len(sig))


def norm(sig, peak=0.8):
    m = np.max(np.abs(sig))
    return sig * (peak / m) if m > 0 else sig


def noise(n, rng):
    return rng.normal(0, 1, n)


def place(out, sig, start, wrap=True):
    """Ajoute `sig` à `out` à partir de l'échantillon `start` (en bouclant si demandé)."""
    n = len(out)
    idx = (np.arange(len(sig)) + start)
    if wrap:
        np.add.at(out, idx % n, sig)
    else:
        keep = idx < n
        out[idx[keep]] += sig[keep]


def reverb(sig, length=1.2, mix=0.25, rng=None, damp=4000):
    """Réverbération par convolution circulaire avec une réponse de bruit décroissante."""
    rng = rng or np.random.default_rng(3)
    n = len(sig)
    m = min(n, int(SR * length))
    ir = rng.normal(0, 1, m) * np.exp(-np.arange(m) / (SR * length / 5))
    ir = band(np.pad(ir, (0, n - m)), 0, damp)
    wet = np.fft.irfft(np.fft.rfft(sig) * np.fft.rfft(ir), n)
    wet = wet / (np.max(np.abs(wet)) + 1e-9) * np.max(np.abs(sig))
    return (1 - mix) * sig + mix * wet


def env(n, a=0.01, r=0.1):
    e = np.ones(n)
    ai, ri = max(1, int(SR * a)), max(1, int(SR * r))
    e[:ai] = np.linspace(0, 1, ai)
    if ri < n:
        e[-ri:] *= np.linspace(1, 0, ri)
    return e


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def pluck(freq, dur, bright=0.5, rng=None):
    """Corde pincée (Karplus-Strong)."""
    rng = rng or np.random.default_rng(int(freq))
    n = int(SR * dur)
    p = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, p)
    out = np.zeros(n)
    decay = 0.996
    for i in range(n):
        j = i % p
        out[i] = buf[j]
        buf[j] = decay * (bright * buf[j] + (1 - bright) * buf[(j + 1) % p])
    return out * env(n, 0.002, 0.08)


def keys(freq, dur, vel=0.5):
    x = secs(dur)
    s = np.sin(2 * np.pi * freq * x) + 0.3 * np.sin(4 * np.pi * freq * x) + 0.08 * np.sin(6 * np.pi * freq * x)
    return vel * s * np.exp(-2.6 * x) * env(len(x), 0.004, 0.08)


def reed(freq, dur, vel=0.3, vib=5.5):
    """Anche d'accordéon : deux voix légèrement désaccordées, vibrato, filtrées."""
    x = secs(dur)
    ph = 2 * np.pi * freq * x + 0.004 * np.sin(2 * np.pi * vib * x) * freq / 20
    s = np.zeros_like(x)
    for det in (1.0, 1.004):
        for k, a in ((1, 1.0), (2, 0.5), (3, 0.33), (4, 0.2), (5, 0.12)):
            s += a * np.sin(k * ph * det)
    return vel * s / 3 * env(len(x), 0.03, 0.08)


def bell(freq, dur, vel=0.4):
    """Cloche ou glockenspiel : partiels inharmoniques qui s'éteignent."""
    x = secs(dur)
    s = np.zeros_like(x)
    for ratio, amp, dec in ((1, 1, 2.5), (2.76, 0.5, 4), (5.4, 0.25, 6), (8.93, 0.12, 9)):
        s += amp * np.sin(2 * np.pi * freq * ratio * x) * np.exp(-dec * x)
    return vel * s * env(len(x), 0.001, 0.05)


def pad(freqs, dur, vel=0.1):
    x = secs(dur)
    s = sum(np.sin(2 * np.pi * f * x) + 0.3 * np.sin(2 * np.pi * f * 2.003 * x) for f in freqs)
    return vel * s / len(freqs) * env(len(x), 0.5, 0.6)


def brush(dur, rng):
    n = int(SR * dur)
    return band(noise(n, rng), 3000, 9000) * np.exp(-np.arange(n) / (SR * 0.05))


# --- Musiques -------------------------------------------------------------------------------

def chord_tones(root, kind):
    return {"maj7": [0, 4, 7, 11], "m7": [0, 3, 7, 10], "7": [0, 4, 7, 10], "m9": [0, 3, 7, 10, 14],
            "6": [0, 4, 7, 9], "maj": [0, 4, 7], "m": [0, 3, 7]}[kind]


def music_city_day(festive=False):
    """« Bréval, le jour » : swing musette léger, accordéon, guitare pincée, contrebasse."""
    rng = np.random.default_rng(11)
    bpm = 112
    beat = 60 / bpm
    bar = 4 * beat
    prog = [(60, "6"), (57, "m7"), (62, "m7"), (55, "7"), (60, "6"), (64, "m7"), (65, "maj7"), (55, "7"),
            (65, "maj7"), (64, "m7"), (62, "m7"), (55, "7"), (60, "6"), (57, "m7"), (62, "7"), (55, "7")]
    mel = [76, 0, 79, 76, 74, 0, 72, 0, 72, 74, 76, 79, 81, 79, 76, 0,
           74, 0, 77, 74, 72, 0, 71, 0, 71, 72, 74, 77, 79, 77, 74, 0,
           76, 0, 79, 76, 74, 0, 72, 0, 77, 76, 74, 72, 71, 72, 74, 0,
           76, 74, 72, 74, 76, 79, 81, 0, 79, 77, 76, 74, 72, 0, 0, 0]
    total = len(prog) * bar
    out = np.zeros(int(SR * total))
    for b, (root, kind) in enumerate(prog):
        t0 = b * bar
        tones = chord_tones(root, kind)
        for k, off in enumerate([0, 7, 12, 7]):  # contrebasse en noires
            place(out, 0.5 * pluck(midi(root - 24 + off), beat * 0.95, 0.35, rng), int(SR * (t0 + k * beat)))
        for k in (1, 3):  # guitare sur les temps faibles (pompe manouche)
            for i, iv in enumerate(tones):
                place(out, 0.12 * pluck(midi(root + iv), beat * 0.5, 0.7, rng), int(SR * (t0 + k * beat + i * 0.008)))
        for k in range(4):  # balais
            place(out, 0.05 * brush(0.15, rng), int(SR * (t0 + k * beat)))
            place(out, 0.03 * brush(0.08, rng), int(SR * (t0 + k * beat + beat * 0.66)))
    step = bar / 4
    for i, m in enumerate(mel):
        if m:
            place(out, reed(midi(m), step * 1.7, 0.22), int(SR * i * step))
            if festive and i % 4 == 0:
                place(out, bell(midi(m + 12), 1.2, 0.12), int(SR * i * step))
    if festive:
        for k in range(int(total / (beat / 2))):  # grelots
            n = int(SR * 0.09)
            g = band(noise(n, rng), 5000, 10000) * np.exp(-np.arange(n) / (SR * 0.02))
            place(out, 0.05 * g, int(SR * k * beat / 2))
    out = band(out, 0, 6000 if not festive else 8000)  # adoucit les aigus des cordes et des balais
    return norm(reverb(out, 1.0, 0.18, rng), 0.75)


def music_city_night():
    """« Bréval, la nuit » : piano feutré, accords de neuvième, nappe et balais lents."""
    rng = np.random.default_rng(12)
    bpm = 68
    beat = 60 / bpm
    bar = 4 * beat
    prog = [(62, "m9"), (55, "7"), (60, "maj7"), (57, "m7"), (62, "m9"), (55, "7"), (64, "m7"), (57, "7")]
    total = len(prog) * bar
    out = np.zeros(int(SR * total))
    for b, (root, kind) in enumerate(prog):
        t0 = b * bar
        tones = chord_tones(root, kind)
        place(out, pad([midi(root + i) for i in tones[:4]], bar, 0.06), int(SR * t0))
        place(out, 0.35 * keys(midi(root - 12), bar, 0.5), int(SR * t0))
        for k, i in enumerate([1, 2, 3, 2]):
            nn = root + 12 + tones[min(i, len(tones) - 1)]
            place(out, keys(midi(nn), beat * 2, 0.11 + 0.03 * rng.random()), int(SR * (t0 + k * beat + 0.02 * rng.random())))
        for k in range(4):
            place(out, 0.025 * brush(0.4, rng), int(SR * (t0 + k * beat)))
    out = band(out, 0, 5000)
    return norm(reverb(out, 2.0, 0.35, rng), 0.7)


def music_reserve():
    """« La réserve » : boîte à musique et bourdon grave, mystère doux."""
    rng = np.random.default_rng(13)
    total = 32.0
    out = np.zeros(int(SR * total))
    x = secs(total)
    drone = 0.05 * (np.sin(2 * np.pi * midi(45) * x) + 0.6 * np.sin(2 * np.pi * midi(52) * x))
    drone *= 0.7 + 0.3 * np.sin(2 * np.pi * x / 8)
    out += drone
    notes = [69, 72, 76, 74, 72, 71, 69, 0, 67, 71, 74, 72, 71, 69, 68, 0,
             69, 72, 76, 79, 77, 76, 74, 0, 72, 71, 69, 68, 69, 0, 0, 0]
    step = total / len(notes)
    for i, m in enumerate(notes):
        if m:
            place(out, bell(midi(m + 12), 2.0, 0.16), int(SR * i * step))
    return norm(reverb(out, 2.5, 0.4, rng), 0.6)


def music_fanfare():
    """Fanfare du kiosque (son localisé) : tuba, cuivres, caisse claire."""
    rng = np.random.default_rng(14)
    bpm = 116
    beat = 60 / bpm
    bar = 2 * beat
    prog = [58, 65, 58, 53, 58, 65, 60, 58]
    mel = [70, 74, 77, 74, 72, 74, 70, 0, 69, 72, 75, 72, 70, 69, 65, 0]
    total = len(prog) * bar
    out = np.zeros(int(SR * total))

    def brass(f, d, v):
        x = secs(d)
        s = sum((1 / k) * np.sin(2 * np.pi * f * k * x) for k in range(1, 7))
        return v * band(s, 0, 2500) * env(len(x), 0.04, 0.06)
    for b, root in enumerate(prog):
        t0 = b * bar
        place(out, brass(midi(root - 24), beat * 0.9, 0.5), int(SR * t0))
        place(out, brass(midi(root - 17), beat * 0.9, 0.35), int(SR * (t0 + beat)))
        for iv in (0, 4, 7):
            place(out, brass(midi(root + iv - 12), beat * 0.45, 0.12), int(SR * (t0 + beat * 0.5)))
            place(out, brass(midi(root + iv - 12), beat * 0.45, 0.12), int(SR * (t0 + beat * 1.5)))
        place(out, 0.18 * brush(0.1, rng), int(SR * (t0 + beat)))
    step = total / len(mel)
    for i, m in enumerate(mel):
        if m:
            place(out, brass(midi(m), step * 0.95, 0.3), int(SR * i * step))
    return norm(reverb(out, 0.8, 0.15, rng), 0.7)


# --- Ambiances (boucles de 16 s) ------------------------------------------------------------

AMB = 16.0


def _slow(n, rng, cycles=(1, 2, 3)):
    """Modulation lente qui boucle exactement sur la durée."""
    x = np.arange(n) / n
    m = np.zeros(n)
    for c in cycles:
        m += np.sin(2 * np.pi * c * x + rng.uniform(0, 6.28))
    return (m - m.min()) / (np.ptp(m) + 1e-9)


def amb_birds():
    rng = np.random.default_rng(22)
    n = int(SR * AMB)
    noise(n, rng)  # (ancien souffle de fond, retiré : on garde le même tirage pour les chants)
    out = np.zeros(n)
    for k in range(38):
        f0 = rng.uniform(2600, 5200)
        notes = rng.integers(2, 6)
        start = rng.uniform(0, AMB)
        for j in range(notes):
            d = rng.uniform(0.05, 0.14)
            x = secs(d)
            sweep = f0 * (1 + rng.uniform(-0.3, 0.3) * x / d)
            ph = 2 * np.pi * np.cumsum(sweep) / SR
            chirp = np.sin(ph + 2 * np.sin(2 * np.pi * 40 * x)) * np.sin(np.pi * x / d) ** 2
            place(out, rng.uniform(0.2, 0.5) * chirp, int(SR * (start + j * rng.uniform(0.09, 0.18))))
    return norm(out, 0.45)


def amb_rain():
    rng = np.random.default_rng(24)
    n = int(SR * AMB)
    out = band(noise(n, rng), 400, 2500) * 0.25 + 0.35 * band(noise(n, rng), 100, 600)
    drops = np.zeros(n)
    for k in range(500):
        m = int(SR * 0.012)
        drop = rng.normal(0, 1, m) * np.exp(-np.arange(m) / (SR * 0.002))
        place(drops, rng.uniform(0.3, 1.0) * drop, int(rng.uniform(0, n)))
    out += band(drops, 200, 3000)  # gouttes sourdes, sans grésillement aigu
    return norm(out, 0.4)


def amb_cicadas():
    rng = np.random.default_rng(25)
    n = int(SR * AMB)
    x = np.arange(n) / SR
    buzz = band(noise(n, rng), 3800, 6500) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 45 * x)))
    pulse = 0.4 + 0.6 * (0.5 + 0.5 * np.sin(2 * np.pi * (AMB / 4 * 0 + 0.75) * x)) ** 3
    return norm(buzz * pulse, 0.3)


def amb_crickets():
    rng = np.random.default_rng(26)
    n = int(SR * AMB)
    out = np.zeros(n)
    for c in range(5):
        f = rng.uniform(3800, 4800)
        period = rng.uniform(0.5, 0.9)
        k = 0.0
        while k < AMB:
            for j in range(3):
                d = 0.025
                x = secs(d)
                place(out, rng.uniform(0.2, 0.4) * np.sin(2 * np.pi * f * x) * np.sin(np.pi * x / d), int(SR * (k + j * 0.04)))
            k += period + rng.uniform(-0.1, 0.1)
    return norm(out, 0.3)


def amb_water(kind="river"):
    rng = np.random.default_rng(27 if kind == "river" else 28)
    n = int(SR * AMB)
    if kind == "river":
        out = band(noise(n, rng), 200, 1500) * (0.7 + 0.3 * _slow(n, rng, (2, 3, 7)))
        count, lo, hi = 300, 300, 900
    else:  # fontaine
        out = band(noise(n, rng), 1200, 6000) * (0.8 + 0.2 * _slow(n, rng, (5, 9)))
        count, lo, hi = 500, 800, 2400
    for k in range(count):  # bulles
        d = rng.uniform(0.02, 0.06)
        x = secs(d)
        f = rng.uniform(lo, hi)
        bub = np.sin(2 * np.pi * f * x * (1 + 2 * x / d)) * np.exp(-x / (d / 3))
        place(out, rng.uniform(0.1, 0.4) * bub, int(rng.uniform(0, n)))
    return norm(out, 0.5)


def babble(rng, n, density=3.0, lo=250, hi=2200):
    """Brouhaha de conversations : bruit filtré découpé en syllabes."""
    out = np.zeros(n)
    voices = int(density * 4)
    for v in range(voices):
        f_lo = rng.uniform(lo, lo * 2)
        base = band(noise(n, rng), f_lo, rng.uniform(hi * 0.6, hi))
        x = np.arange(n) / SR
        rate = round(rng.uniform(3, 5) * AMB) / AMB  # un nombre entier de syllabes par boucle
        syll = np.clip(np.sin(2 * np.pi * rate * x + rng.uniform(0, 6)), 0, 1) ** 2
        talk = (_slow(n, rng, (rng.integers(2, 7), rng.integers(3, 9))) > 0.45).astype(float)
        out += base * syll * band(talk, 0, 4)
    return out


def amb_crowd(kind="cafe"):
    rng = np.random.default_rng({"cafe": 31, "hall": 32, "market": 33}[kind])
    n = int(SR * AMB)
    out = babble(rng, n, {"cafe": 2.0, "hall": 3.0, "market": 4.0}[kind])
    if kind == "cafe":
        for k in range(18):  # tasses et verres
            place(out, 0.6 * bell(rng.uniform(2200, 3400), 0.3, 1), int(rng.uniform(0, n)))
    if kind == "market":
        for k in range(6):  # un marchand qui appelle
            d = rng.uniform(0.5, 0.9)
            x = secs(d)
            f = rng.uniform(180, 260)
            call = sum((1 / k2) * np.sin(2 * np.pi * f * k2 * x) for k2 in range(1, 6)) * np.sin(np.pi * x / d) ** 2
            place(out, 0.4 * band(call, 200, 2500), int(rng.uniform(0, n)))
    return norm(out, 0.45)


def amb_room(kind):
    rng = np.random.default_rng({"bureau": 43, "reserve": 44}[kind])
    n = int(SR * AMB)
    if kind == "bureau":
        noise(n, rng)  # (ancien souffle de fond, retiré)
        out = np.zeros(n)
        for k in range(int(AMB)):  # horloge
            tick = band(noise(int(SR * 0.02), rng), 2000, 6000) * np.exp(-np.arange(int(SR * 0.02)) / (SR * 0.003))
            place(out, (0.6 if k % 2 == 0 else 0.45) * tick, int(SR * k))
    else:  # réserve : souffle grave, craquements, goutte
        noise(n, rng)  # (ancien souffle grave, retiré)
        _slow(n, rng)
        out = np.zeros(n)
        for k in range(5):
            d = rng.uniform(0.25, 0.5)
            xx = secs(d)
            f = rng.uniform(90, 180)
            creak = np.sign(np.sin(2 * np.pi * (f + 40 * np.sin(2 * np.pi * 3 * xx)) * xx)) * np.exp(-xx / d * 2)
            place(out, 0.15 * band(creak, 100, 1500), int(rng.uniform(0, n)))
        for k in range(4):
            d = 0.08
            xx = secs(d)
            place(out, 0.3 * np.sin(2 * np.pi * 1400 * xx * (1 - xx / d * 0.4)) * np.exp(-xx / 0.02), int(SR * (k * 4 + 1.3)))
    return norm(out, 0.4)


# --- Pas et sons ponctuels --------------------------------------------------------------------

def footsteps():
    rng = np.random.default_rng(51)
    out = {}

    def step(d, lo, hi, decay, extra=None):
        n = int(SR * d)
        s = band(noise(n, rng), lo, hi) * np.exp(-np.arange(n) / (SR * decay))
        if extra is not None:
            s += extra[:n]
        return norm(s, 0.5)
    x = secs(0.12)
    out["pas_pierre"] = step(0.09, 1200, 6000, 0.012)
    out["pas_herbe"] = step(0.14, 1500, 7000, 0.04)
    out["pas_bois"] = step(0.12, 120, 1500, 0.025, 0.6 * np.sin(2 * np.pi * 180 * x) * np.exp(-x / 0.03))
    out["pas_tapis"] = step(0.1, 80, 600, 0.02)
    out["pas_beton"] = step(0.08, 600, 3500, 0.01)
    n = int(SR * 0.18)  # neige : craquement granuleux
    snow = np.zeros(n)
    for k in range(40):
        place(snow, rng.normal(0, 1, 60) * np.exp(-np.arange(60) / 10), int(rng.uniform(0, n - 60)), wrap=False)
    out["pas_neige"] = norm(band(snow, 800, 5000) * env(n, 0.01, 0.05), 0.5)
    return out


def oneshots():
    rng = np.random.default_rng(61)
    out = {}
    # porte : grincement puis choc
    d = 0.5
    x = secs(d)
    creak = band(np.sign(np.sin(2 * np.pi * (220 + 120 * x) * x)), 200, 2000) * np.exp(-x * 3) * 0.3
    thump = band(noise(len(x), rng), 60, 400) * np.exp(-np.maximum(0, x - 0.35) / 0.03) * (x > 0.35)
    out["porte"] = norm(creak + thump, 0.6)
    lock = np.zeros(int(SR * 0.35))  # verrou : cliquetis métalliques
    for k in range(4):
        place(lock, 0.5 * bell(rng.uniform(2500, 3500), 0.06, 1), int(SR * k * 0.07), wrap=False)
    out["verrou"] = norm(lock, 0.5)
    x = secs(0.18)
    out["ramasser"] = norm(np.sin(2 * np.pi * (500 + 1500 * x / 0.18) * x) * np.exp(-x / 0.06), 0.5)
    seq = lambda notes, gap, vel, dur: np.concatenate([vel * bell(midi(m), dur, 1) for m in notes]) if gap is None else None
    s = np.zeros(int(SR * 1.2))
    for i, m in enumerate([84, 88]):
        place(s, bell(midi(m), 0.9, 0.5), int(SR * i * 0.11), wrap=False)
    out["decouverte"] = norm(s, 0.55)
    s = np.zeros(int(SR * 2.0))
    for i, m in enumerate([76, 79, 84, 88, 91]):
        place(s, bell(midi(m), 1.4, 0.5), int(SR * i * 0.09), wrap=False)
    out["decouverte_rare"] = norm(reverb(s, 1.0, 0.25, rng), 0.6)
    s = np.zeros(int(SR * 3.2))
    for i, m in enumerate([72, 76, 79, 84, 88, 91, 96]):
        place(s, bell(midi(m), 2.0, 0.45), int(SR * i * 0.08), wrap=False)
    place(s, pad([midi(60), midi(64), midi(67), midi(72)], 3.0, 0.4), 0, wrap=False)
    out["decouverte_legendaire"] = norm(reverb(s, 1.6, 0.35, rng), 0.65)
    s = np.zeros(int(SR * 0.9))
    for i, m in enumerate([72, 76, 79]):
        place(s, keys(midi(m), 0.6, 0.5), int(SR * i * 0.1), wrap=False)
    out["quete"] = norm(s, 0.5)
    n = int(SR * 0.6)  # crayon qui griffonne
    scrib = band(noise(n, rng), 2500, 8000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 9 * np.arange(n) / SR))) * env(n, 0.02, 0.1)
    out["indice"] = norm(scrib, 0.35)
    d = 2.2  # bus : moteur diesel puis portes
    x = secs(d)
    engine = band(np.sign(np.sin(2 * np.pi * 38 * x)) + 0.3 * noise(len(x), rng), 30, 400) * env(len(x), 0.2, 0.6)
    hiss = band(noise(len(x), rng), 2000, 8000) * np.exp(-np.maximum(0, x - 1.4) / 0.15) * (x > 1.4)
    out["bus"] = norm(engine * 0.8 + 0.5 * hiss, 0.6)
    s = np.zeros(int(SR * 4.0))  # cloche de la mairie : trois coups
    for k in range(3):
        place(s, bell(midi(55), 3.0, 0.7), int(SR * k * 0.9), wrap=False)
    out["cloche"] = norm(reverb(s, 1.5, 0.3, rng), 0.55)
    d = 1.6  # sifflet du train
    x = secs(d)
    whistle = (np.sin(2 * np.pi * 740 * x) + 0.6 * np.sin(2 * np.pi * 932 * x) + 0.2 * band(noise(len(x), rng), 600, 1500)) * env(len(x), 0.08, 0.3)
    out["sifflet"] = norm(whistle, 0.45)
    d = 7.0  # passage du train : roulement et clac-clac
    x = secs(d)
    roll = band(noise(len(x), rng), 40, 600) * np.sin(np.pi * x / d) ** 2
    for k in range(int(d / 0.45)):
        place(roll, 1.2 * band(noise(int(SR * 0.05), rng), 300, 2500) * np.exp(-np.arange(int(SR * 0.05)) / 200) * np.sin(np.pi * k * 0.45 / d) ** 2,
              int(SR * k * 0.45), wrap=False)
        place(roll, 0.9 * band(noise(int(SR * 0.05), rng), 300, 2500) * np.exp(-np.arange(int(SR * 0.05)) / 200) * np.sin(np.pi * k * 0.45 / d) ** 2,
              int(SR * (k * 0.45 + 0.12)), wrap=False)
    out["train"] = norm(roll, 0.6)
    d = 0.22  # canard
    x = secs(d)
    quack = band(np.sign(np.sin(2 * np.pi * (300 - 120 * x / d) * x)), 400, 2500) * np.sin(np.pi * x / d) ** 0.5
    out["canard"] = norm(quack, 0.4)
    d = 0.6  # pigeon : roucoulement
    x = secs(d)
    coo = np.sin(2 * np.pi * (420 + 60 * np.sin(2 * np.pi * 3 * x)) * x) * (np.sin(np.pi * x / d) ** 2) * (0.6 + 0.4 * np.sin(2 * np.pi * 12 * x))
    out["pigeon"] = norm(band(coo, 250, 1200), 0.35)
    x = secs(0.04)  # voix des dialogues (très discrète)
    out["voix"] = norm(np.sin(2 * np.pi * 520 * x) * np.sin(np.pi * x / 0.04), 0.25)
    return out


def generate(write, music_dir, amb_dir, sfx_dir):
    music = {"ville_jour": music_city_day(), "ville_fetes": music_city_day(festive=True),
             "ville_nuit": music_city_night(), "reserve": music_reserve()}
    for k, v in music.items():
        write(f"{music_dir}/{k}.wav", v)
    # Pas de nappe de bruit continue (ville, vent, salle, coulisses) : sous la musique, on
    # l'entendait comme un grésillement. Restent des sons qui ont une forme (chants, gouttes, voix).
    amb = {"oiseaux": amb_birds(), "pluie": amb_rain(),
           "cigales": amb_cicadas(), "grillons": amb_crickets(), "riviere": amb_water("river"),
           "fontaine": amb_water("fountain"), "cafe": amb_crowd("cafe"), "marche": amb_crowd("market"),
           "foule": amb_crowd("hall"), "bureau": amb_room("bureau"), "reserve": amb_room("reserve"), "fanfare": music_fanfare()}
    for k, v in amb.items():
        write(f"{amb_dir}/{k}.wav", v)
    for k, v in {**footsteps(), **oneshots()}.items():
        write(f"{sfx_dir}/{k}.wav", v)
    return list(music) + list(amb)
