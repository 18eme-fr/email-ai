"""Registre de la collection : vérifie les quotas et écrit docs/COLLECTION.md.

Usage (depuis la racine du projet) :
    python3 tools/collection_registry.py

Le registre est produit à partir de data/progression/collection.json : il ne
peut pas diverger du jeu. Le script échoue si un quota n'est pas respecté.
"""
import json
import os
import sys
from collections import Counter

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
QUOTAS = {
    "family": {"archives": 10, "costumes": 11, "decors": 10, "technique": 10, "legendes": 10},
    "rarity": {"commun": 20, "peu_commun": 16, "rare": 10, "legendaire": 4, "mythique": 1},
    "method": {"exploration": 15, "mission": 12, "pnj": 8, "secret": 6, "progression": 5, "evenement": 5},
}
MAPS = {"rue": "la ville", "hall": "le hall", "salle": "la salle", "coulisses": "les coulisses", "bureau": "le bureau",
        "reserve": "la réserve",
        "escalier": "la cage d'escalier", "couloir": "le couloir de la direction", "toilettes": "les toilettes",
        "archives": "les archives"}


def load():
    with open(os.path.join(ROOT, "data", "progression", "collection.json"), encoding="utf-8") as f:
        col = json.load(f)
    with open(os.path.join(ROOT, "data", "world", "world.json"), encoding="utf-8") as f:
        world = json.load(f)
    return col, world


def person(world, key):
    for pid, p in world["people"].items():
        if pid == key or p.get("bark") == key:
            return p.get("name", pid).split(",")[0] if p.get("name") else pid.capitalize()
    return key


def spot(world, key):
    for mid, m in world["maps"].items():
        for s in m["spots"]:
            if s.get("flavor", s["id"]) == key:
                return "%s (%s)" % (s["label"], MAPS.get(mid, mid))
    return key


def trigger(world, t):
    k = t["type"]
    if k == "talk":
        return "Parler à « %s »" % person(world, t["person"])
    if k == "examine":
        return "Examiner : %s" % spot(world, t["spot"])
    if k == "pickup":
        return "Ramasser (Entrée face à l'objet) dans %s, case %s" % (MAPS[t["map"]], tuple(t["cell"]))
    if k == "search":
        return "Fouiller (Entrée) dans %s, case %s" % (MAPS[t["map"]], tuple(t["cell"]))
    if k == "visit":
        return "Entrer dans %s" % MAPS[t["map"]]
    if k == "quest":
        return "Terminer l'enquête « %s »" % t["quest"]
    if k == "state":
        return "Vérifié après chaque étape : " + cond(world, t["when"])
    return k


def cond(world, c):
    parts = []
    if "any" in c:
        parts.append(" OU ".join(cond(world, x) for x in c["any"]))
    for k, v in c.items():
        if k == "min_turn":
            parts.append("période ≥ %d" % v)
        elif k == "owned":
            parts.append("posséder " + ", ".join(v))
        elif k == "owned_min":
            parts.append("%d objets dans la collection" % v)
        elif k == "clues":
            parts.append("indice(s) " + ", ".join(v))
        elif k == "exhibit_min":
            parts.append("%d objets exposés" % v)
        elif k == "mission_done":
            parts.append("mission « %s » réussie" % v)
        elif k == "upgrade":
            parts.append("rénovation « %s »" % v)
        elif k == "achievement":
            parts.append("trophée « %s »" % v)
        elif k == "event_choice":
            parts.append("événement « %s » (choix %s)" % (v["event"], "/".join(v["choices"])))
        elif k == "dossier_min":
            parts.append("dossier « %s » ≥ %d %%" % (v["dossier"], round(v["score"] * 100)))
        elif k == "played_min":
            parts.append("%d spectacle(s) joué(s)" % v)
        elif k == "evening":
            parts.append("un soir de spectacle")
        elif k == "metric_min":
            parts.append(", ".join("%s ≥ %s" % (m, n) for m, n in v.items()))
        elif k == "rules":
            parts.append(", ".join("%s ≥ %s" % (m, n) for m, n in v.get("stat_min", {}).items()) or json.dumps(v, ensure_ascii=False))
    return " ; ".join(parts) if parts else "aucune"


def check(col):
    errors = []
    for key, want in QUOTAS.items():
        got = dict(Counter(o[key] for o in col["objects"]))
        if got != want:
            errors.append("%s : %s au lieu de %s" % (key, got, want))
    ids = [o["id"] for o in col["objects"]]
    if len(set(ids)) != len(ids):
        errors.append("identifiants en double")
    return errors


def main():
    col, world = load()
    errors = check(col)
    if errors:
        print("QUOTAS NON RESPECTÉS :", *errors, sep="\n  ")
        sys.exit(1)
    rar = {r["id"]: r["label"] for r in col["rarities"]}
    meth = {k: v["label"] for k, v in col["methods"].items()}
    out = ["# Registre de la collection de la Lanterne", "",
           "*Généré par `python3 tools/collection_registry.py` à partir de `data/progression/collection.json` : "
           "ne pas modifier à la main.*", "",
           "51 objets, conservés d'une partie à l'autre (`user://collection.json`). Aucun objet ne donne d'avantage "
           "de gestion ; les récompenses sont décoratives (tenues, guirlande du hall, distinctions).", "",
           "## Répartition (vérifiée par le script et par `tests/progression/test_collection.gd`)", "",
           "| | " + " | ".join(rar[r] for r in QUOTAS["rarity"]) + " | Total |", "|---|" + "---|" * 6]
    for f in col["families"]:
        objs = [o for o in col["objects"] if o["family"] == f["id"]]
        c = Counter(o["rarity"] for o in objs)
        out.append("| %s | %s | %d |" % (f["title"], " | ".join(str(c.get(r, 0)) for r in QUOTAS["rarity"]), len(objs)))
    c = Counter(o["rarity"] for o in col["objects"])
    out.append("| **Total** | %s | **51** |" % " | ".join("**%d**" % c[r] for r in QUOTAS["rarity"]))
    out += ["", "| Mode d'obtention principal | Objets |", "|---|---|"]
    m = Counter(o["method"] for o in col["objects"])
    for k in QUOTAS["method"]:
        out.append("| %s | %d |" % (meth[k], m[k]))
    for f in col["families"]:
        out += ["", "## %s" % f["title"], "",
                "| # | Identifiant | Nom | Rareté | Mode | Source et déclencheur | Prérequis | Alternative | Exposition |",
                "|---|---|---|---|---|---|---|---|---|"]
        for i, o in enumerate([o for o in col["objects"] if o["family"] == f["id"]], 1):
            out.append("| %d | `%s` | %s | %s | %s | %s | %s | %s | %s |" % (
                i, o["id"], o["name"], rar[o["rarity"]], meth[o["method"]], trigger(world, o["trigger"]),
                cond(world, o.get("requires", {})), o.get("alternative", "—"), "vitrines du hall"))
        out.append("")
        for o in [o for o in col["objects"] if o["family"] == f["id"]]:
            out.append("- **%s** — %s *Indices : %s / %s*" % (o["name"], o["description"], o["hint2"], o["hint3"]))
    out += ["", "## Enquêtes (missions de collection)", ""]
    for q in col["quests"]:
        reward = next(o for o in col["objects"] if o["id"] == q["reward"])
        out.append("### %s — récompense : %s (%s)" % (q["title"], reward["name"], rar[reward["rarity"]]))
        out.append("Commence avec %s%s." % (person(world, q["giver"]), (", condition : " + cond(world, q["requires"])) if q.get("requires") else ""))
        out.append("")
        for i, st in enumerate(q["steps"], 1):
            req = (" — condition : " + cond(world, st["requires"])) if st.get("requires") else ""
            clue = (" — donne l'indice « %s »" % st["gives_clue"]) if st.get("gives_clue") else ""
            out.append("%d. %s *(%s%s%s)*" % (i, st["text"], trigger(world, st["trigger"]), req, clue))
        out.append("")
    out += ["## Indices et secrets", "", "| Indice | Texte | Comment l'obtenir |", "|---|---|---|"]
    sources = {}
    for c in col["clue_sources"]:
        sources[c["clue"]] = trigger(world, c["trigger"]) + ((" (" + cond(world, c["requires"]) + ")") if c.get("requires") else "")
    for q in col["quests"]:
        for st in q["steps"]:
            if st.get("gives_clue"):
                sources[st["gives_clue"]] = "Enquête « %s »" % q["title"]
    for o in col["objects"]:
        if o.get("gives_clue"):
            sources[o["gives_clue"]] = "En trouvant « %s »" % o["name"]
    for k, v in col["clues"].items():
        out.append("| `%s` — %s | %s | %s |" % (k, v["title"], v["text"], sources.get(k, "?")))
    out += ["", "## Indices progressifs", "",
            "1. Toujours visible : le mode d'obtention (exploration, rencontre, secret…).",
            "2. La région ou le type de lieu : dès 2 objets de la même famille, ou 10 objets en tout.",
            "3. L'indication précise : Fernand, l'ancien régisseur (près du Café des Artistes), en donne une par "
            "période de jeu, en commençant par l'objet le moins rare de la famille choisie ; à partir de 40 objets, "
            "tous les indices précis sont visibles, pour ne jamais rester bloqué en fin de collection.", "",
            "## Récompenses", "", "| Palier | Récompense | Type |", "|---|---|---|"]
    for r in col["rewards"]:
        when = r["when"]
        palier = ("%d objets" % when["total"]) if "total" in when else (
            "famille « %s » complète" % when["family"] if "family" in when else "trouver « %s »" % when["item"])
        out.append("| %s | %s | %s |" % (palier, r["label"], {"outfit": "tenue", "decor": "décor du hall", "title": "distinction"}[r["kind"]]))
    path = os.path.join(ROOT, "docs", "COLLECTION.md")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(out) + "\n")
    print("Quotas respectés. Registre écrit :", path)


if __name__ == "__main__":
    main()
