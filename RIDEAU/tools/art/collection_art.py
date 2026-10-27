"""Icônes des 50 objets de la collection (16×16, pixel art), lues par le jeu dans
assets/collection/<icone>.png. Chaque icône est dessinée à la main avec les
primitives de pixel.py ; le contour sombre est ajouté automatiquement."""
from pixel import P, Canvas, shade

INK = P["ink"]


def _paper(c, x, y, w, h, col=P["paper"]):
    c.rect(x, y, w, h, col)
    c.vline(x + w - 1, y, y + h - 1, shade(col, 0.85))


def _lines(c, x0, x1, ys, col=P["grey1"]):
    for y in ys:
        c.hline(x0, x1, y, col)


def programme(c):
    _paper(c, 3, 1, 10, 14)
    c.rect(5, 3, 6, 5, P["velvet3"])
    c.rect(7, 4, 2, 3, P["gold3"])
    _lines(c, 5, 10, (10, 12), P["paper3"])


def programme_blue(c):
    _paper(c, 3, 1, 10, 14, P["cream"])
    c.rect(4, 2, 8, 4, P["blue"])
    c.hline(5, 10, 3, P["white"])
    _lines(c, 5, 10, (8, 10, 12))


def newspaper(c):
    _paper(c, 2, 2, 12, 12, P["paper2"])
    c.rect(3, 3, 10, 2, P["ink"])
    c.rect(3, 6, 5, 4, P["grey2"])
    _lines(c, 9, 12, (6, 8, 10, 12))
    _lines(c, 3, 7, (12,))


def ticket(c):
    c.rect(1, 4, 14, 8, P["gold2"])
    c.vline(5, 4, 11, P["gold0"])
    c.rect(7, 6, 6, 1, P["velvet3"])
    c.rect(7, 8, 4, 1, P["velvet3"])
    c.set(1, 7, INK)
    c.set(14, 7, INK)


def book(c):
    c.rect(2, 2, 12, 12, P["velvet2"])
    c.rect(3, 3, 1, 10, P["velvet1"])
    c.rect(6, 5, 6, 3, P["gold2"])
    c.rect(4, 13, 10, 1, P["cream"])


def plaque(c):
    c.rect(1, 3, 14, 10, P["gold1"])
    c.frame(2, 4, 12, 8, P["gold3"])
    _lines(c, 4, 11, (6, 8, 10), P["gold0"])


def contract(c):
    _paper(c, 3, 1, 10, 14, P["cream"])
    _lines(c, 4, 11, (3, 5, 7, 9))
    c.line(5, 12, 10, 11, P["blue"])
    c.ellipse(11, 13, 1.5, 1.5, P["velvet3"])


def ledger(c):
    c.rect(2, 2, 12, 12, P["green0"])
    c.rect(7, 2, 1, 12, P["green1"])
    c.rect(3, 4, 3, 1, P["gold2"])
    c.rect(9, 4, 3, 1, P["gold2"])
    _lines(c, 3, 6, (7, 9, 11), P["green2"])
    _lines(c, 9, 12, (7, 9, 11), P["green2"])


def poster_old(c):
    _paper(c, 2, 1, 12, 14, P["paper2"])
    c.rect(3, 2, 10, 2, P["velvet3"])
    c.ellipse(8, 8, 3, 3, P["gold2"])
    c.rect(7, 6, 2, 4, P["light"])
    _lines(c, 4, 11, (12, 13), P["paper3"])


def photo(c):
    c.rect(1, 3, 14, 11, P["cream"])
    c.rect(2, 4, 12, 8, P["paper3"])
    for i in range(5):
        c.rect(3 + i * 2, 7, 1, 3, P["wood1"])
        c.set(3 + i * 2, 6, P["skin1"])
    c.rect(7, 11, 3, 1, INK)


def mask(c):
    c.ellipse(8, 7, 6.5, 4.5, P["velvet3"])
    for (x, y) in [(4, 5), (8, 4), (12, 5), (6, 9), (10, 9)]:
        c.hline(x, x + 1, y, P["green1"])
    c.ellipse(5, 7, 1.8, 1.2, INK)
    c.ellipse(11, 7, 1.8, 1.2, INK)
    c.hline(0, 1, 6, P["gold2"])
    c.hline(14, 15, 6, P["gold2"])


def gloves(c):
    for x0 in (1, 8):
        c.rect(x0 + 1, 6, 6, 8, P["white"])
        for i in range(4):
            c.rect(x0 + 1 + i + (1 if i else 0), 2 + (i % 2), 1, 4, P["white"])
        c.hline(x0 + 1, x0 + 6, 12, P["velvet3"])


def fan(c):
    for i in range(7):
        c.line(8, 13, 2 + i * 2, 3 + abs(3 - i), P["white"] if i % 2 else P["grey3"])
    c.ellipse(8, 13, 1.5, 1.5, P["gold2"])


def nose(c):
    c.ellipse(8, 8, 5, 5, P["velvet4"])
    c.ellipse(6, 6, 1.5, 1.5, P["white"])


def hat(c):
    c.ellipse(8, 11, 7, 2, P["grey0"])
    c.rect(4, 4, 8, 7, P["grey0"])
    c.rect(4, 8, 8, 2, P["velvet3"])
    c.hline(5, 10, 4, P["grey1"])


def costume(c):
    c.rect(4, 3, 8, 11, P["teal"])
    c.rect(1, 4, 3, 6, P["teal"])
    c.rect(12, 4, 3, 6, P["teal"])
    c.rect(4, 6, 4, 4, P["orange"])
    c.rect(8, 9, 4, 3, P["purple2"])
    c.rect(7, 3, 2, 2, P["cream"])


def redingote(c):
    c.rect(4, 4, 8, 9, P["velvet3"])                 # redingote de velours
    c.rect(4, 12, 3, 3, P["velvet2"])                # basques
    c.rect(9, 12, 3, 3, P["velvet2"])
    c.rect(1, 5, 3, 6, P["velvet2"])
    c.rect(12, 5, 3, 6, P["velvet2"])
    c.rect(6, 4, 4, 4, P["cream"])                   # plastron et nœud
    c.rect(7, 5, 2, 1, P["ink"])
    for y in (9, 11):
        c.set(6, y, P["gold3"])
        c.set(9, y, P["gold3"])
    c.rect(5, 0, 6, 3, P["ink"])                     # haut-de-forme posé dessus
    c.hline(4, 11, 3, P["ink"])


def crown(c):
    c.rect(2, 8, 12, 5, P["gold2"])
    for x in (2, 6, 10, 13):
        c.rect(x, 4, 2, 4, P["gold2"])
    c.set(7, 10, P["velvet4"])
    c.set(4, 10, P["teal"])
    c.set(11, 10, P["teal"])


def shoes(c):
    for x0 in (1, 8):
        c.ellipse(x0 + 3, 10, 3.5, 2, (238, 170, 190))
        c.rect(x0 + 5, 7, 1, 4, (238, 170, 190))
        c.hline(x0, x0 + 6, 12, P["velvet2"])


def cape(c):
    c.poly([(7, 1), (9, 1), (15, 14), (1, 14)], P["velvet2"])
    c.line(8, 2, 3, 13, P["gold2"])
    c.line(8, 2, 13, 13, P["gold2"])
    c.rect(6, 1, 4, 2, P["gold3"])


def mask_venice(c):
    c.ellipse(8, 8, 6, 6, P["white"])
    c.ellipse(5, 7, 1.5, 1, INK)
    c.ellipse(11, 7, 1.5, 1, INK)
    c.rect(7, 9, 2, 3, P["grey3"])
    c.hline(4, 12, 3, P["gold2"])
    c.set(8, 2, P["gold3"])


def maquette(c):
    c.rect(1, 10, 14, 4, P["wood3"])
    c.rect(2, 3, 12, 7, P["paper"])
    c.rect(4, 5, 3, 5, P["wood2"])
    c.rect(9, 6, 4, 2, P["velvet3"])
    c.rect(9, 8, 1, 2, P["wood1"])
    c.rect(12, 8, 1, 2, P["wood1"])


def brush(c):
    c.line(2, 14, 10, 6, P["wood2"])
    c.line(3, 14, 11, 6, P["wood3"])
    c.rect(10, 3, 4, 4, P["grey2"])
    c.rect(11, 1, 4, 3, P["teal"])


def flower(c):
    c.vline(8, 8, 15, P["green1"])
    c.rect(9, 11, 2, 1, P["green1"])
    for (dx, dy) in [(0, -3), (3, 0), (0, 3), (-3, 0)]:
        c.ellipse(8 + dx, 6 + dy, 2, 2, P["velvet4"])
    c.ellipse(8, 6, 1.5, 1.5, P["gold3"])


def miniature(c):
    c.rect(2, 12, 12, 2, P["grey2"])
    c.rect(3, 6, 10, 6, P["cream"])
    c.poly([(2, 6), (8, 2), (14, 6)], P["paper2"])
    for x in (4, 7, 10):
        c.rect(x, 7, 1, 5, P["paper3"])
    c.rect(7, 9, 2, 3, P["velvet3"])


def canvas(c):
    c.rect(1, 3, 14, 10, P["night"])
    for (x, y) in [(3, 5), (7, 4), (11, 6), (5, 9), (12, 10), (9, 8)]:
        c.set(x, y, P["light"])
    c.ellipse(11, 5, 1.5, 1.5, P["gold3"])
    c.rect(0, 2, 16, 1, P["wood3"])
    c.rect(0, 13, 16, 1, P["wood3"])


def miniature_orange(c):
    c.rect(1, 12, 14, 2, P["paper3"])
    c.rect(2, 4, 12, 8, P["wood4"])
    for x in range(3, 13, 3):
        c.rect(x, 6, 2, 3, P["wood1"])
    c.rect(6, 9, 4, 3, P["wood1"])
    c.hline(2, 13, 4, P["paper"])


def sign_complet(c):
    c.rect(1, 4, 14, 8, P["velvet2"])
    c.frame(1, 4, 14, 8, P["gold2"])
    for x in range(3, 13, 2):
        c.rect(x, 7, 1, 3, P["gold3"])


def forest(c):
    c.rect(1, 2, 14, 12, P["green2"])
    for (x, h) in [(3, 8), (7, 10), (11, 7)]:
        c.poly([(x, 13 - h), (x - 3, 13), (x + 3, 13)], P["green0"])
    c.rect(1, 13, 14, 1, P["wood1"])


def letters(c):
    c.rect(1, 3, 2, 10, P["velvet3"])
    c.rect(1, 11, 6, 2, P["velvet3"])
    c.poly([(11, 3), (8, 13), (14, 13)], P["gold2"])
    c.rect(10, 9, 3, 1, P["velvet3"])
    c.set(2, 4, P["light"])


def sketch(c):
    _paper(c, 1, 2, 14, 12, P["cream"])
    for x in range(2, 14, 2):
        c.set(x, 10 + (x // 2) % 2, P["blue"])
        c.set(x + 1, 11 - (x // 2) % 2, P["blue"])
    for (x, y) in [(4, 4), (11, 5), (7, 3)]:
        c.set(x, y, P["gold2"])
    c.rect(7, 6, 2, 3, P["gold2"])


def gel(c):
    c.rect(2, 2, 12, 12, (240, 170, 70))
    c.rect(3, 3, 4, 2, (255, 220, 150))
    c.frame(2, 2, 12, 12, P["grey0"])


def wrench(c):
    c.line(3, 13, 10, 6, P["grey2"])
    c.line(4, 13, 11, 6, P["grey3"])
    c.ellipse(11, 5, 3, 3, P["grey3"])
    c.rect(11, 3, 2, 3, INK)


def register(c):
    c.rect(2, 7, 12, 7, P["gold1"])
    c.rect(4, 2, 8, 5, P["gold2"])
    c.rect(5, 3, 6, 2, P["cream"])
    for x in range(4, 13, 2):
        c.set(x, 9, P["gold3"])
        c.set(x, 11, P["gold3"])


def talkie(c):
    c.rect(5, 4, 6, 11, P["grey0"])
    c.rect(9, 1, 1, 3, P["grey1"])
    c.rect(6, 5, 4, 3, P["grey2"])
    c.set(7, 10, P["velvet4"])
    _lines(c, 6, 9, (12, 13), P["grey1"])


def microphone(c):
    c.ellipse(8, 5, 3.5, 4, P["grey3"])
    _lines(c, 6, 10, (3, 5, 7), P["grey1"])
    c.rect(7, 9, 2, 4, P["grey2"])
    c.rect(4, 13, 8, 2, P["grey1"])


def par(c):
    c.rect(3, 3, 9, 9, P["grey0"])
    c.ellipse(7, 7, 3.5, 3.5, (255, 220, 150))
    c.rect(12, 6, 2, 3, P["grey1"])
    c.rect(6, 12, 3, 3, P["grey1"])


def registry(c):
    c.rect(2, 2, 12, 12, P["velvet1"])
    c.rect(3, 3, 1, 10, P["velvet0"])
    c.rect(6, 4, 6, 4, P["white"])
    c.rect(8, 5, 2, 2, P["velvet3"])


def pulley(c):
    c.ellipse(8, 7, 5, 5, P["wood3"])
    c.ellipse(8, 7, 2, 2, P["grey1"])
    c.rect(7, 0, 2, 3, P["grey2"])
    c.vline(3, 7, 15, P["paper2"])
    c.vline(13, 7, 15, P["paper2"])


def projector(c):
    c.rect(2, 4, 10, 7, P["navy"])
    c.ellipse(12, 7, 3, 3, P["gold3"])
    c.rect(3, 2, 6, 2, P["grey1"])
    c.rect(6, 11, 2, 4, P["grey1"])
    c.rect(3, 14, 8, 1, P["grey1"])


def console(c):
    c.rect(1, 5, 14, 9, P["grey1"])
    for x in range(2, 14, 2):
        c.vline(x, 7, 12, P["ink"])
        c.rect(x, 8 + (x % 3), 1, 1, P["white"])
    c.rect(1, 4, 14, 1, P["grey2"])


def book_signed(c):
    c.rect(3, 2, 10, 12, P["blue"])
    c.rect(4, 3, 1, 10, P["navy"])
    c.line(6, 10, 11, 6, P["gold3"])
    c.set(11, 5, P["gold3"])


def bouquet(c):
    c.line(8, 8, 6, 15, P["green0"])
    c.line(8, 8, 10, 15, P["green0"])
    for (x, y) in [(5, 5), (8, 3), (11, 5), (7, 7), (10, 7)]:
        c.ellipse(x, y, 1.8, 1.8, (180, 110, 120))
    c.rect(6, 10, 5, 2, P["gold2"])


def glass(c):
    c.poly([(4, 2), (12, 2), (9, 8), (7, 8)], P["sky"])
    c.rect(7, 8, 2, 5, P["grey3"])
    c.rect(5, 13, 6, 1, P["grey3"])
    c.set(8, 4, P["gold3"])


def rose(c):
    c.ellipse(8, 5, 3.5, 3.5, P["velvet3"])
    c.ellipse(8, 5, 1.5, 1.5, P["velvet1"])
    c.vline(8, 9, 15, P["green1"])
    c.rect(5, 11, 3, 1, P["green1"])


def frontpage(c):
    _paper(c, 2, 1, 12, 14, P["cream"])
    c.rect(3, 2, 10, 3, P["ink"])
    c.hline(4, 11, 3, P["white"])
    c.rect(3, 6, 10, 4, P["velvet3"])
    _lines(c, 3, 12, (11, 13))


def medal(c):
    c.poly([(5, 0), (8, 6), (11, 0)], P["blue"])
    c.line(5, 0, 8, 6, P["white"])
    c.ellipse(8, 10, 4.5, 4.5, P["gold2"])
    c.ellipse(8, 10, 2.5, 2.5, P["gold3"])


def notebook(c):
    c.rect(3, 2, 10, 12, P["wood3"])
    c.vline(4, 2, 13, P["wood1"])
    _lines(c, 6, 11, (5, 7, 9), P["wood4"])


def letter(c):
    _paper(c, 1, 4, 14, 9, P["cream"])
    c.line(1, 4, 8, 9, P["paper3"])
    c.line(15, 4, 8, 9, P["paper3"])
    c.ellipse(8, 10, 2, 2, P["velvet3"])


def staff(c):
    c.rect(7, 1, 3, 14, P["wood2"])
    c.rect(6, 1, 5, 2, P["gold2"])
    c.rect(6, 13, 5, 2, P["velvet3"])
    for y in (5, 8, 11):
        c.hline(7, 9, y, P["wood3"])


def lantern(c):
    c.rect(7, 0, 2, 2, P["gold1"])
    c.rect(4, 2, 8, 2, P["gold2"])
    c.rect(4, 4, 8, 8, P["gold1"])
    c.rect(5, 5, 6, 6, P["light"])
    c.ellipse(8, 8, 1.5, 2, P["orange"])
    c.rect(3, 12, 10, 2, P["gold2"])


ICONS = {f.__name__: f for f in [
    programme, programme_blue, newspaper, ticket, book, plaque, contract, ledger, poster_old, photo,
    mask, gloves, fan, nose, hat, costume, redingote, crown, shoes, cape, mask_venice,
    maquette, brush, flower, miniature, canvas, miniature_orange, sign_complet, forest, letters, sketch,
    gel, wrench, register, talkie, microphone, par, registry, pulley, projector, console,
    book_signed, bouquet, glass, rose, frontpage, medal, notebook, letter, staff, lantern]}


def icon(name):
    c = Canvas(16, 16)
    ICONS[name](c)
    c.outline(INK)
    return c


def generate(out_dir):
    import os
    os.makedirs(out_dir, exist_ok=True)
    for name in ICONS:
        icon(name).save(os.path.join(out_dir, name + ".png"))
    return list(ICONS)
