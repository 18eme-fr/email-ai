"""Synthèse des sons et musiques de RIDEAU ! (100 % originaux, licence du projet).

Usage : python3 tools/generate_audio.py
Produit des WAV 16 bits mono dans assets/audio/. Graines fixes : résultat identique à chaque exécution.
"""
import os
import wave

import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SR = 22050
RNG = np.random.default_rng(42)


def write(path, signal, sr=SR):
    signal = np.clip(signal, -1, 1)
    data = (signal * 32000).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(data.tobytes())


def t(dur):
    return np.arange(int(SR * dur)) / SR


def env(n, attack=0.005, release=0.1, sustain=1.0):
    a = max(1, int(SR * attack))
    r = max(1, int(SR * release))
    e = np.ones(n) * sustain
    e[:a] = np.linspace(0, 1, a)
    if r < n:
        e[-r:] = np.linspace(e[-r - 1] if n > r else 1, 0, r)
    return e


def tone(freq, dur, kind="sine", decay=6.0, harmonics=(1.0,)):
    x = t(dur)
    s = np.zeros_like(x)
    for i, amp in enumerate(harmonics):
        f = freq * (i + 1)
        if kind == "sine":
            s += amp * np.sin(2 * np.pi * f * x)
        elif kind == "square":
            s += amp * np.sign(np.sin(2 * np.pi * f * x)) * 0.5
        elif kind == "tri":
            s += amp * (2 / np.pi) * np.arcsin(np.sin(2 * np.pi * f * x))
    return s * np.exp(-decay * x)


def lowpass(s, alpha=0.1):
    out = np.zeros_like(s)
    acc = 0.0
    for i, v in enumerate(s):
        acc += alpha * (v - acc)
        out[i] = acc
    return out


def note(n):
    """Numéro MIDI -> fréquence."""
    return 440.0 * 2 ** ((n - 69) / 12)


def sfx(out):
    write(f"{out}/click.wav", 0.5 * tone(1200, 0.05, "square", 60) + 0.3 * tone(600, 0.05, decay=50))
    write(f"{out}/hover.wav", 0.18 * tone(1800, 0.03, "sine", 90))
    write(f"{out}/blip.wav", 0.3 * tone(900, 0.06, "tri", 40))
    conf = np.concatenate([0.4 * tone(note(72), 0.09, "tri", 18), 0.4 * tone(note(79), 0.18, "tri", 12)])
    write(f"{out}/confirm.wav", conf)
    canc = np.concatenate([0.35 * tone(note(67), 0.08, "tri", 20), 0.35 * tone(note(60), 0.16, "tri", 14)])
    write(f"{out}/cancel.wav", canc)
    err = 0.3 * tone(140, 0.25, "square", 10) + 0.2 * tone(147, 0.25, "square", 10)
    write(f"{out}/error.wav", err)
    coins = np.zeros(int(SR * 0.6))
    for i, (f, d) in enumerate([(2400, 0.0), (3100, 0.07), (2700, 0.15), (3500, 0.22)]):
        s = 0.3 * tone(f, 0.3, "sine", 25, harmonics=(1, 0.4, 0.2))
        start = int(SR * d)
        coins[start:start + len(s)] += s[: len(coins) - start]
    write(f"{out}/coins.wav", coins)
    # applaudissements : rafales de bruit filtré
    dur = 2.6
    n = int(SR * dur)
    app = np.zeros(n)
    for _ in range(900):
        pos = int(RNG.uniform(0, n - 600))
        clap = RNG.normal(0, 1, 400) * np.exp(-np.arange(400) / 60)
        app[pos:pos + 400] += clap * RNG.uniform(0.1, 0.4)
    app = lowpass(app, 0.5) * env(n, 0.3, 1.0)
    app /= np.max(np.abs(app)) + 1e-9
    write(f"{out}/applause.wav", 0.6 * app)
    # rideau : souffle filtré
    n = int(SR * 1.2)
    whoosh = lowpass(RNG.normal(0, 1, n), 0.05) * np.sin(np.linspace(0, np.pi, n)) ** 2
    whoosh /= np.max(np.abs(whoosh)) + 1e-9
    write(f"{out}/curtain.wav", 0.5 * whoosh)
    n = int(SR * 0.25)
    page = lowpass(RNG.normal(0, 1, n), 0.3) * np.exp(-np.arange(n) / (SR * 0.05))
    page /= np.max(np.abs(page)) + 1e-9
    write(f"{out}/page.wav", 0.35 * page)


def piano(freq, dur, vel=0.5):
    x = t(dur)
    s = np.sin(2 * np.pi * freq * x) + 0.35 * np.sin(4 * np.pi * freq * x) + 0.12 * np.sin(6 * np.pi * freq * x)
    return vel * s * np.exp(-3.2 * x) * env(len(x), 0.004, 0.05)


def pad(freqs, dur, vel=0.12):
    x = t(dur)
    s = sum(np.sin(2 * np.pi * f * x) + 0.3 * np.sin(2 * np.pi * f * 2.003 * x) for f in freqs)
    return vel * s / len(freqs) * env(len(x), 0.4, 0.6)


def render(events, total):
    out = np.zeros(int(SR * total) + SR)
    for start, sig in events:
        i = int(SR * start)
        out[i:i + len(sig)] += sig[: len(out) - i]
    return out[: int(SR * total)]


def waltz(out):
    """Valse de la Lanterne (menu) : 3/4, 16 mesures, en boucle."""
    bpm = 132
    beat = 60 / bpm
    bar = 3 * beat
    # accords (fondamentale MIDI, type)
    prog = [(57, "m"), (62, "m"), (55, ""), (60, ""), (65, ""), (62, "m"), (64, ""), (64, "7"),
            (57, "m"), (62, "m"), (55, ""), (60, ""), (65, ""), (64, ""), (57, "m"), (57, "m")]
    melody = [76, 74, 72, 74, 76, 77, 79, 77, 76, 74, 72, 71, 72, 74, 76, 72,
              77, 76, 74, 72, 74, 76, 77, 76, 74, 76, 72, 71, 69, 71, 72, 69,
              76, 74, 72, 74, 76, 77, 79, 77, 76, 74, 72, 71, 72, 74, 76, 72,
              77, 79, 81, 79, 77, 76, 74, 72, 71, 72, 69, 71, 69, 0, 0, 0]
    events = []
    for b, (root, kind) in enumerate(prog):
        third = root + (3 if kind == "m" else 4)
        fifth = root + 7
        start = b * bar
        events.append((start, piano(note(root - 12), bar, 0.32)))
        for k in (1, 2):
            for nn in (third, fifth):
                events.append((start + k * beat, piano(note(nn), beat * 0.9, 0.12)))
        events.append((start, pad([note(root), note(third), note(fifth)], bar, 0.06)))
    step = bar / 4
    for i, m in enumerate(melody):
        if m:
            events.append((i * step, 0.22 * tone(note(m), step * 1.6, "tri", 2.5) * env(int(SR * step * 1.6), 0.01, 0.1)))
    total = len(prog) * bar
    s = render(events, total)
    s = 0.8 * s / (np.max(np.abs(s)) + 1e-9)
    write(f"{out}/lanterne_theme.wav", s)


def foyer(out):
    """Boucle calme pour la gestion : piano feutré et nappe, 4/4 lent."""
    bpm = 84
    beat = 60 / bpm
    bar = 4 * beat
    prog = [(53, [0, 4, 7, 11]), (57, [0, 3, 7, 10]), (50, [0, 3, 7, 10]), (55, [0, 4, 7, 10]),
            (53, [0, 4, 7, 11]), (52, [0, 3, 7, 10]), (50, [0, 3, 7, 10]), (55, [0, 4, 7, 9])]
    events = []
    r = np.random.default_rng(7)
    for b, (root, ints) in enumerate(prog):
        start = b * bar
        events.append((start, pad([note(root + i) for i in ints], bar, 0.08)))
        events.append((start, piano(note(root - 12), bar, 0.22)))
        pattern = [0, 1, 2, 3, 2, 1, 2, 3]
        for k, p in enumerate(pattern):
            nn = root + 12 + ints[p]
            events.append((start + k * beat / 2, piano(note(nn), beat * 1.5, 0.08 + 0.03 * r.random())))
    total = len(prog) * bar
    s = render(events, total)
    s = lowpass(s, 0.35)
    s = 0.7 * s / (np.max(np.abs(s)) + 1e-9)
    write(f"{out}/foyer_loop.wav", s)


def main():
    sfx_dir = os.path.join(ROOT, "assets", "audio", "sfx")
    mus_dir = os.path.join(ROOT, "assets", "audio", "music")
    os.makedirs(sfx_dir, exist_ok=True)
    os.makedirs(mus_dir, exist_ok=True)
    sfx(sfx_dir)
    waltz(mus_dir)
    foyer(mus_dir)
    import sys
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import audio_world  # noqa: E402
    amb_dir = os.path.join(ROOT, "assets", "audio", "ambience")
    os.makedirs(amb_dir, exist_ok=True)
    audio_world.generate(write, mus_dir, amb_dir, sfx_dir)
    print("Audio généré dans assets/audio/")


if __name__ == "__main__":
    main()
