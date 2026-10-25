"""Textures 9-slice de l'interface (panneaux, boutons, cadres)."""
from pixel import P, Canvas, shade

UI_SCALE = 2


def panel_wood() -> Canvas:
    """Cadre en bois sombre, filet doré, fond bleu nuit."""
    s = 24
    c = Canvas(s, s)
    c.rect(0, 0, s, s, P["ink"])
    c.rect(1, 1, s - 2, s - 2, P["wood2"])
    c.hline(1, s - 2, 1, P["wood3"])
    c.vline(1, 1, s - 2, P["wood3"])
    c.hline(1, s - 2, s - 2, P["wood1"])
    c.vline(s - 2, 1, s - 2, P["wood1"])
    # grain du bois
    for i in range(3, s - 3, 5):
        c.set(i, 2, P["wood1"])
        c.set(2, i + 2, P["wood1"])
    c.frame(3, 3, s - 6, s - 6, P["gold2"])
    c.set(3, 3, P["gold3"])
    c.frame(4, 4, s - 8, s - 8, P["ink"])
    c.rect(5, 5, s - 10, s - 10, P["night2"])
    return c


def panel_night() -> Canvas:
    """Panneau léger : fond nuit, filet bleu, coins dorés."""
    s = 12
    c = Canvas(s, s)
    c.rect(0, 0, s, s, P["ink"])
    c.rect(1, 1, s - 2, s - 2, P["night2"])
    c.frame(1, 1, s - 2, s - 2, P["navy"])
    for x, y in [(1, 1), (s - 2, 1), (1, s - 2), (s - 2, s - 2)]:
        c.set(x, y, P["gold1"])
    return c


def panel_paper() -> Canvas:
    s = 16
    c = Canvas(s, s)
    c.rect(0, 0, s, s, P["ink"])
    c.rect(1, 1, s - 2, s - 2, P["paper"])
    c.hline(1, s - 2, 1, P["cream"])
    c.hline(1, s - 2, s - 2, P["paper2"])
    c.vline(s - 2, 2, s - 2, P["paper2"])
    c.frame(2, 2, s - 4, s - 4, P["paper2"])
    c.rect(3, 3, s - 6, s - 6, P["paper"])
    return c


def panel_inset() -> Canvas:
    s = 12
    c = Canvas(s, s)
    c.rect(0, 0, s, s, P["ink"])
    c.rect(1, 1, s - 2, s - 2, P["night"])
    c.hline(1, s - 2, s - 2, P["navy"])
    c.vline(s - 2, 1, s - 2, P["navy"])
    return c


def button(fill, light, dark, border, pressed=False) -> Canvas:
    s = 12
    c = Canvas(s, s)
    c.rect(1, 0, s - 2, s, P["ink"])
    c.rect(0, 1, s, s - 2, P["ink"])
    c.rect(1, 1, s - 2, s - 2, border)
    c.rect(2, 2, s - 4, s - 4, fill)
    if pressed:
        c.hline(2, s - 3, 2, dark)
        c.hline(2, s - 3, 3, dark)
    else:
        c.hline(2, s - 3, 2, light)
        c.hline(2, s - 3, s - 3, dark)
        c.hline(2, s - 3, s - 4, dark)
    return c


def focus_ring() -> Canvas:
    s = 12
    c = Canvas(s, s)
    c.frame(0, 0, s, s, P["gold3"])
    c.set(0, 0, P["ink"])
    c.set(s - 1, 0, P["ink"])
    c.set(0, s - 1, P["ink"])
    c.set(s - 1, s - 1, P["ink"])
    return c


def chip() -> Canvas:
    s = 8
    c = Canvas(s, s)
    c.rect(1, 0, s - 2, s, P["ink"])
    c.rect(0, 1, s, s - 2, P["ink"])
    c.rect(1, 1, s - 2, s - 2, P["navy"])
    c.hline(1, s - 2, 1, P["blue"])
    return c


def bar_bg() -> Canvas:
    c = Canvas(8, 6)
    c.rect(0, 0, 8, 6, P["ink"])
    c.rect(1, 1, 6, 4, P["night"])
    return c


def divider() -> Canvas:
    c = Canvas(16, 3)
    c.hline(0, 15, 1, P["gold1"])
    c.hline(0, 15, 0, P["ink"])
    c.hline(0, 15, 2, P["ink"])
    return c


def grabber(hover=False) -> Canvas:
    c = Canvas(7, 10)
    c.rect(1, 0, 5, 10, P["ink"])
    c.rect(0, 1, 7, 8, P["ink"])
    c.rect(1, 1, 5, 8, P["gold3"] if hover else P["gold2"])
    c.hline(1, 5, 8, P["gold1"])
    c.vline(3, 3, 6, P["gold0"])
    return c


def checkbox(checked: bool) -> Canvas:
    c = Canvas(9, 9)
    c.rect(0, 0, 9, 9, P["ink"])
    c.rect(1, 1, 7, 7, P["night"])
    c.frame(1, 1, 7, 7, P["gold1"])
    if checked:
        for x, y in [(2, 4), (3, 5), (4, 6), (5, 5), (6, 4), (7, 3), (6, 2)]:
            c.set(x, y, P["gold3"])
        c.set(3, 4, P["gold2"])
        c.set(4, 5, P["gold2"])
    return c


def export(out_dir: str) -> None:
    items = {
        "panel_wood": panel_wood(),
        "panel_night": panel_night(),
        "panel_paper": panel_paper(),
        "panel_inset": panel_inset(),
        "button_normal": button(P["velvet2"], P["velvet3"], P["velvet1"], P["gold1"]),
        "button_hover": button(P["velvet3"], P["velvet4"], P["velvet2"], P["gold2"]),
        "button_pressed": button(P["velvet1"], P["velvet2"], P["velvet0"], P["gold1"], pressed=True),
        "button_disabled": button(P["grey0"], P["grey1"], P["ink"], P["grey1"]),
        "button2_normal": button(P["navy"], P["blue"], P["night2"], P["steel"]),
        "button2_hover": button(P["blue"], P["steel"], P["navy"], P["sky"]),
        "button2_pressed": button(P["night2"], P["navy"], P["night"], P["steel"], pressed=True),
        "button_gold_normal": button(P["gold1"], P["gold2"], P["gold0"], P["gold3"]),
        "button_gold_hover": button(P["gold2"], P["gold3"], P["gold1"], P["light"]),
        "button_gold_pressed": button(P["gold0"], P["gold1"], P["wood1"], P["gold2"], pressed=True),
        "focus": focus_ring(),
        "chip": chip(),
        "bar_bg": bar_bg(),
        "divider": divider(),
        "grabber": grabber(),
        "grabber_hover": grabber(True),
        "check_on": checkbox(True),
        "check_off": checkbox(False),
    }
    for name, canvas in items.items():
        canvas.save(f"{out_dir}/{name}.png", UI_SCALE)
