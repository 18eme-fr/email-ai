"""Intérieurs des bâtiments de Bréval-sur-Ondine : on peut entrer partout.

Chaque bâtiment de la ville (sauf le théâtre, qui a ses propres salles) reçoit une
carte « int_<bâtiment> » : un plan en caractères (mêmes conventions que les
autres cartes de world.json), ses habitants, ses objets à examiner et son
ambiance sonore. Les huit tours des Coteaux partagent le même décor (« art »).

Appelé par city_layout.py, qui relie les portes de la ville à ces cartes.
Le dessin est fait par interiors.py à partir des mêmes données.

Conventions des plans :
  rangées 0-1 : mur du fond (la rangée 1 montre la face du mur) ;
  dernière rangée : mur avec la ou les portes « D » vers la rue ;
  mobilier : c comptoir, b bibliothèque, k casiers/armoire, t table, o plante,
  s fauteuils, w établi, x caisses, R portant, U vitrine, d bureau, B banc,
  n panneau, p estrade (praticable), e bord d'estrade, j machine (selon le lieu),
  Z piano, l étal ou présentoir (selon le lieu), i pupitre, y œuvre ou maquette,
  O escalier vers les étages privés, , tapis.
"""

# Légende des nouveaux caractères (les autres existent déjà dans world.json).
LEGEND = {
    "j": ("machine", False),
    "Z": ("piano", False),
    "l": ("étal ou présentoir", False),
    "i": ("pupitre", False),
    "y": ("œuvre ou maquette", False),
    "O": ("escalier vers les étages", False),
}

# Personnes qu'on rencontre à l'intérieur : sprite, nom affiché.
PEOPLE = {
    "guichetiere": ("guichetiere", "Mme Ferrand, guichetière"),
    "voyageuse": ("passant_e", "Voyageuse"),
    "artiste_fabrique": ("artiste", "Lucie, artiste en résidence"),
    "receptionniste": ("receptionniste", "Le réceptionniste"),
    "agent_mairie": ("agent_mairie", "Agent d'accueil de la mairie"),
    "patronne_cafe": ("patronne", "Mado, patronne du café"),
    "client_cafe": ("spectateur_a", "Habituée du café"),
    "lebrun": ("imprimeur", "M. Lebrun, imprimeur"),
    "boulangere": ("boulangere", "Mme Pain, boulangère"),
    "caissiere_rex": ("caissiere", "Caissière du Rex"),
    "cinephile": ("spectateur_b", "Cinéphile"),
    "prof_piano": ("prof_piano", "M. Delattre, professeur de piano"),
    "eleve_conservatoire": ("enfant_a", "Élève du conservatoire"),
    "lectrice": ("passant_a", "Lectrice"),
    "fleuriste_pnj": ("fleuriste", "Rose, fleuriste"),
    "disquaire_pnj": ("disquaire", "Jo, disquaire"),
    "galeriste": ("galeriste", "Mme Nakamura, galeriste"),
    "lecteur": ("passant_d", "Lecteur assidu"),
    "fromager": ("fromager", "M. Vidal, fromager"),
    "marchande": ("marchande", "Marchande de primeurs"),
    "instituteur": ("instituteur", "M. Benali, instituteur"),
    "hotesse_ondine": ("hotesse", "Hôtesse d'Ondine Énergie"),
    "gardienne": ("gardienne", "Mme Lopes, gardienne"),
    "voisine": ("passant_c", "Voisine du 7e"),
    "etudiant": ("etudiant", "Étudiant du 3e"),
    "cpe": ("cpe", "M. Garnier, CPE du collège"),
    "collegien": ("enfant_b", "Collégienne"),
    "benevole": ("benevole", "Nadia, bénévole"),
}

BASE_INTERIORS = {
    "gare": {
        "name": "Hall de la gare", "floor": "marble", "walls": "gare", "music": "ville_jour", "ambience": {"foule": 0.35},
        "grid": [
            "####################",
            "####################",
            "#..................#",
            "#.cccc.......cccc..#",
            "#..................#",
            "#..BBB...j...BBB..o#",
            "#..................#",
            "#..BBB.......BBB...#",
            "#o................o#",
            "#########DD#########",
        ],
        "spots": [("gare", [(9, 1), (10, 1)], "Tableau des départs"),
                  ("guichet_gare", [(2, 3), (3, 3), (4, 3), (5, 3), (13, 3), (14, 3), (15, 3), (16, 3)], "Guichets"),
                  ("distributeur", [(9, 5)], "Distributeur de billets")],
        "npcs": [("guichetiere", 4, 2, 0), ("voyageuse", 8, 6, 3)],
        "wall": [("board", 8, 4), ("clock", 4), ("window", 13, 3), ("poster", 2)],
    },
    "fabrique": {
        "name": "La Fabrique", "floor": "concrete", "walls": "fabrique", "music": "ville_jour", "ambience": {"coulisses": 0.4},
        "grid": [
            "####################",
            "####################",
            "#x..pppppppppp...R.#",
            "#x..pppppppppp.....#",
            "#...eeeeeeeeee..xx.#",
            "#..................#",
            "#.ww....t..t....ww.#",
            "#..................#",
            "#o..xx.........y...#",
            "#..................#",
            "#########DD#########",
        ],
        "spots": [("fabrique", [(16, 1), (17, 1)], "Programme de la Fabrique"),
                  ("scene_fabrique", [(x, 4) for x in range(4, 14)], "Petite scène de la Fabrique"),
                  ("oeuvre_fabrique", [(15, 8)], "Sculpture en cours")],
        "npcs": [("artiste_fabrique", 8, 3, 2)],
        "wall": [("graffiti", 2, 6), ("graffiti", 10, 5), ("poster", 16), ("poster", 17)],
    },
    "hotel": {
        "name": "Hôtel du Commerce", "floor": "parquet", "walls": "hotel", "music": "foyer", "ambience": {"bureau": 0.5},
        "grid": [
            "################",
            "################",
            "#o...........OO#",
            "#...cccc.....OO#",
            "#..............#",
            "#.t.,,,,,,,..t.#",
            "#...,,,,,,,....#",
            "#.x.,,,,,,,..o.#",
            "#o.............#",
            "#######D########",
        ],
        "spots": [("hotel", [(4, 3), (5, 3), (6, 3), (7, 3)], "Réception de l'hôtel"),
                  ("etages_hotel", [(13, 2), (14, 2), (13, 3), (14, 3)], "Escalier des chambres"),
                  ("bagages", [(2, 7)], "Valises d'une troupe en tournée")],
        "npcs": [("receptionniste", 5, 2, 0)],
        "wall": [("keys", 5, 3), ("frame", 9), ("frame", 11), ("window", 1, 2)],
    },
    "mairie": {
        "name": "Mairie — hall d'accueil", "floor": "marble", "walls": "mairie", "music": "foyer", "ambience": {"bureau": 0.6},
        "grid": [
            "##################",
            "##################",
            "#o..............o#",
            "#..cccccc....n...#",
            "#................#",
            "#.BB..,,,,,,..BB.#",
            "#.....,,,,,,.....#",
            "#.BB..,,,,,,..BB.#",
            "#o....,,,,,,....o#",
            "########DD########",
        ],
        "spots": [("mairie", [(3, 3), (4, 3), (5, 3), (6, 3), (7, 3), (8, 3)], "Accueil de la mairie"),
                  ("panneau_mairie", [(13, 3)], "Panneau d'affichage municipal"),
                  ("marianne", [(8, 1), (9, 1)], "Buste de Marianne")],
        "npcs": [("agent_mairie", 5, 2, 0)],
        "wall": [("bust", 8), ("flag", 6), ("flag", 11), ("window", 2, 2), ("window", 14, 2)],
    },
    "cafe": {
        "name": "Café des Artistes", "floor": "checker", "walls": "cafe", "music": "foyer", "ambience": {"cafe": 0.8},
        "grid": [
            "##############",
            "##############",
            "#ZZ.........o#",
            "#......ccccc.#",
            "#............#",
            "#.t..t..t....#",
            "#............#",
            "#.t..t..t..o.#",
            "#............#",
            "######D#######",
        ],
        "spots": [("cafe", [(7, 3), (8, 3), (9, 3), (10, 3), (11, 3)], "Comptoir du café"),
                  ("piano_cafe", [(1, 2), (2, 2)], "Vieux piano droit")],
        "npcs": [("patronne_cafe", 9, 2, 0), ("client_cafe", 4, 6, 1)],
        "wall": [("bottles", 7, 5), ("frame", 3), ("frame", 5), ("mirror", 11)],
    },
    "imprimerie": {
        "name": "Imprimerie Lebrun", "floor": "planks", "walls": "imprimerie", "music": "ville_jour", "ambience": {"coulisses": 0.5},
        "grid": [
            "############",
            "############",
            "#jj..jj..kk#",
            "#..........#",
            "#.xx....xx.#",
            "#..........#",
            "#..cccc....#",
            "#..........#",
            "#o.........#",
            "#####D######",
        ],
        "spots": [("imprimerie", [(3, 6), (4, 6), (5, 6), (6, 6)], "Comptoir de l'imprimerie", {"kind": "action", "action": "communication"}),
                  ("presse", [(1, 2), (2, 2), (5, 2), (6, 2)], "Presses typographiques"),
                  ("rames", [(2, 4), (3, 4), (8, 4), (9, 4)], "Rames de papier")],
        "npcs": [("lebrun", 4, 5, 1)],
        "wall": [("posters", 3, 2), ("clock", 8)],
    },
    "boulangerie": {
        "name": "Boulangerie", "floor": "checker", "walls": "boulangerie", "music": "ville_jour", "ambience": {"bureau": 0.4},
        "grid": [
            "############",
            "############",
            "#llll..jj..#",
            "#..........#",
            "#.cccccc...#",
            "#..........#",
            "#........o.#",
            "#..........#",
            "#####D######",
        ],
        "spots": [("boulangerie", [(2, 4), (3, 4), (4, 4), (5, 4), (6, 4), (7, 4)], "Comptoir de la boulangerie"),
                  ("fournil", [(7, 2), (8, 2)], "Four à pain")],
        "npcs": [("boulangere", 4, 3, 1)],
        "wall": [("slate", 9, 2)],
    },
    "cinema": {
        "name": "Cinéma Le Rex", "floor": "carpet_red", "walls": "cinema", "music": "foyer", "ambience": {"salle": 0.5},
        "grid": [
            "##################",
            "##################",
            "#................#",
            "#.sssssss..sssss.#",
            "#................#",
            "#.sssssss..sssss.#",
            "#................#",
            "#................#",
            "#cccc.........jj.#",
            "#..............o.#",
            "########DD########",
        ],
        "spots": [("cinema", [(1, 8), (2, 8), (3, 8), (4, 8)], "Caisse du Rex"),
                  ("ecran", [(8, 1), (9, 1)], "L'écran"),
                  ("popcorn", [(14, 8), (15, 8)], "Machine à pop-corn")],
        "npcs": [("caissiere_rex", 2, 7, 0), ("cinephile", 10, 4, 2)],
        "wall": [("screen", 2, 14)],
    },
    "conservatoire": {
        "name": "Conservatoire", "floor": "parquet", "walls": "conservatoire", "music": "foyer", "ambience": {"salle": 0.3},
        "grid": [
            "##################",
            "##################",
            "#ZZ....ZZ....kkk.#",
            "#................#",
            "#..i..i..i..i....#",
            "#................#",
            "#.,,,,,,,,,,,,,,.#",
            "#.,,,,,,,,,,,,,,.#",
            "#o..............o#",
            "########DD########",
        ],
        "spots": [("conservatoire", [(1, 2), (2, 2), (7, 2), (8, 2)], "Pianos du conservatoire"),
                  ("partitions", [(13, 2), (14, 2), (15, 2)], "Armoire à partitions")],
        "npcs": [("prof_piano", 4, 3, 2), ("eleve_conservatoire", 10, 6, 2)],
        "wall": [("frame", 4), ("frame", 10), ("window", 11, 2), ("staff", 3, 3)],
    },
    "librairie": {
        "name": "Librairie La Plume", "floor": "parquet", "walls": "librairie", "music": "foyer", "ambience": {"bureau": 0.6},
        "grid": [
            "############",
            "############",
            "#bbbb..bbbb#",
            "#..........#",
            "#.ll..ll...#",
            "#..........#",
            "#t.....cc..#",
            "#o.........#",
            "#####D######",
        ],
        "spots": [("librairie", [(7, 6), (8, 6)], "Coups de cœur du libraire"),
                  ("rayons", [(1, 2), (2, 2), (3, 2), (4, 2), (7, 2), (8, 2), (9, 2), (10, 2)], "Rayon théâtre"),
                  ("tables_livres", [(2, 4), (3, 4), (6, 4), (7, 4)], "Tables des nouveautés")],
        "npcs": [("lectrice", 3, 5, 2)],
        "wall": [],
    },
    "fleuriste": {
        "name": "Fleuriste", "floor": "checker_green", "walls": "fleuriste", "music": "foyer", "ambience": {"oiseaux": 0.15},
        "grid": [
            "##########",
            "##########",
            "#llll.ll.#",
            "#........#",
            "#.l...cc.#",
            "#........#",
            "#ll....o.#",
            "#........#",
            "####D#####",
        ],
        "spots": [("fleuriste", [(1, 2), (2, 2), (3, 2), (4, 2), (6, 2), (7, 2)], "Bouquets du jour"),
                  ("comptoir_fleurs", [(6, 4), (7, 4)], "Comptoir de la fleuriste")],
        "npcs": [("fleuriste_pnj", 7, 3, 0)],
        "wall": [("window", 1, 2)],
    },
    "disquaire": {
        "name": "Disquaire", "floor": "planks", "walls": "disquaire", "music": "ville_nuit", "ambience": {},
        "grid": [
            "############",
            "############",
            "#llll..kk.j#",
            "#..........#",
            "#.ll..ll...#",
            "#..........#",
            "#.....ccc..#",
            "#o.........#",
            "#####D######",
        ],
        "spots": [("disquaire", [(1, 2), (2, 2), (3, 2), (4, 2), (2, 4), (3, 4), (6, 4), (7, 4)], "Bacs de vinyles"),
                  ("platine", [(10, 2)], "Platine d'écoute"),
                  ("comptoir_disques", [(6, 6), (7, 6), (8, 6)], "Comptoir du disquaire")],
        "npcs": [("disquaire_pnj", 7, 5, 1)],
        "wall": [("records", 1, 4), ("poster", 8), ("poster", 9)],
    },
    "galerie": {
        "name": "Galerie d'art", "floor": "concrete_light", "walls": "galerie", "music": "foyer", "ambience": {},
        "grid": [
            "##############",
            "##############",
            "#............#",
            "#..y....y..y.#",
            "#............#",
            "#.....yy.....#",
            "#.........dd.#",
            "#o..........o#",
            "######D#######",
        ],
        "spots": [("galerie", [(2, 1), (3, 1), (5, 1), (6, 1), (8, 1), (9, 1), (11, 1)], "Exposition du moment"),
                  ("sculpture", [(6, 5), (7, 5)], "Grande sculpture"),
                  ("socles", [(3, 3), (8, 3), (11, 3)], "Petites œuvres sur socle")],
        "npcs": [("galeriste", 11, 7, 1)],
        "wall": [("painting", 2), ("painting", 5), ("painting", 8), ("painting", 11)],
    },
    "mediatheque": {
        "name": "Médiathèque Louise-Michel", "floor": "parquet", "walls": "mediatheque", "music": "foyer", "ambience": {"bureau": 0.5},
        "grid": [
            "####################",
            "####################",
            "#bbbbbb....bbbbbbb.#",
            "#..................#",
            "#.bbbb..t..t..bbbb.#",
            "#..................#",
            "#.bbbb..t..t..bbbb.#",
            "#..................#",
            "#.,,,,,..cccc..ddd.#",
            "#o................o#",
            "#########DD#########",
        ],
        "spots": [("mediatheque", [(9, 8), (10, 8), (11, 8), (12, 8)], "Banque de prêt"),
                  ("postes", [(15, 8), (16, 8), (17, 8)], "Postes informatiques"),
                  ("rayon_arts", [(1, 2), (2, 2), (3, 2), (4, 2), (5, 2), (6, 2)], "Rayon arts du spectacle")],
        "npcs": [("lecteur", 9, 5, 2)],
        "wall": [("window", 7, 4)],
    },
    "halle": {
        "name": "Halle du marché", "floor": "concrete", "walls": "halle", "music": "ville_jour", "ambience": {"marche": 0.7},
        "grid": [
            "######################",
            "######################",
            "#ll..ll..ll..ll..ll..#",
            "#....................#",
            "#.cc..cc..cc..cc..cc.#",
            "#....................#",
            "#.ll..ll......ll..ll.#",
            "#....................#",
            "#o..................o#",
            "##########DD##########",
        ],
        "spots": [("halle", [(x, 4) for x in (2, 3, 6, 7, 10, 11, 14, 15, 18, 19)], "Étals de la halle"),
                  ("primeurs", [(x, 6) for x in (2, 3, 6, 7, 14, 15, 18, 19)], "Cagettes de primeurs")],
        "npcs": [("fromager", 3, 3, 1), ("marchande", 15, 5, 2)],
        "wall": [("glass", 1, 20)],
    },
    "ecole": {
        "name": "École des Tilleuls — salle de classe", "floor": "lino", "walls": "ecole", "music": "ville_jour", "ambience": {"bureau": 0.4},
        "grid": [
            "##################",
            "##################",
            "#.....dd.........#",
            "#................#",
            "#.ii.ii.ii.ii.ii.#",
            "#................#",
            "#.ii.ii.ii.ii.ii.#",
            "#................#",
            "#o.kk........kk.o#",
            "########DD########",
        ],
        "spots": [("ecole", [(9, 1), (10, 1), (11, 1)], "Tableau noir"),
                  ("dessins", [(3, 8), (4, 8), (13, 8), (14, 8)], "Dessins des élèves")],
        "npcs": [("instituteur", 8, 3, 2)],
        "wall": [("blackboard", 8, 5), ("map", 2, 3), ("window", 14, 2)],
    },
    "ondine": {
        "name": "Ondine Énergie — accueil", "floor": "marble_dark", "walls": "siege", "music": "foyer", "ambience": {"bureau": 0.5},
        "grid": [
            "##################",
            "##################",
            "#o..............o#",
            "#.....cccccc.....#",
            "#................#",
            "#.tt..........yy.#",
            "#................#",
            "#.tt.,,,,,,,,....#",
            "#o.......,,.....o#",
            "########DD########",
        ],
        "spots": [("ondine", [(6, 3), (7, 3), (8, 3), (9, 3), (10, 3), (11, 3)], "Accueil d'Ondine Énergie"),
                  ("maquette", [(14, 5), (15, 5)], "Maquette de l'éco-quartier")],
        "npcs": [("hotesse_ondine", 8, 2, 0)],
        "wall": [("logo", 7, 4), ("screen_small", 2, 2), ("screen_small", 13, 2)],
    },
    "college": {
        "name": "Collège des Coteaux — préau", "floor": "lino", "walls": "college", "music": "ville_jour", "ambience": {"foule": 0.2},
        "grid": [
            "####################",
            "####################",
            "#kkkkkk......kkkkkk#",
            "#..................#",
            "#..................#",
            "#.U..n........t..t.#",
            "#..................#",
            "#.BB..........BB...#",
            "#o................o#",
            "#########DD#########",
        ],
        "spots": [("college", [(5, 5)], "Panneau de la vie scolaire"),
                  ("vitrine_trophees", [(2, 5)], "Vitrine des trophées"),
                  ("casiers", [(x, 2) for x in list(range(1, 7)) + list(range(13, 19))], "Casiers des élèves")],
        "npcs": [("cpe", 9, 4, 2), ("collegien", 12, 7, 2)],
        "wall": [("window", 8, 4), ("clock", 13)],
    },
    "maison_quartier": {
        "name": "Maison de quartier des Coteaux", "floor": "planks", "walls": "maison", "music": "ville_jour", "ambience": {"foule": 0.25},
        "grid": [
            "##################",
            "##################",
            "#bbb....ZZ.....kk#",
            "#................#",
            "#.tt..tt....tt...#",
            "#................#",
            "#.tt..tt....,,,,.#",
            "#...........,,,,.#",
            "#o..............o#",
            "########DD########",
        ],
        "spots": [("maison_quartier", [(1, 2), (2, 2), (3, 2)], "Boîte à livres"),
                  ("piano_mq", [(8, 2), (9, 2)], "Piano partagé"),
                  ("jeux_societe", [(12, 4), (13, 4)], "Jeux de société")],
        "npcs": [("benevole", 4, 3, 2)],
        "wall": [("posters", 4, 3), ("garland", 1, 16)],
    },
    "tour": {
        "name": "Résidence des Coteaux — hall", "floor": "tiles_grey", "walls": "tour", "music": "ville_jour", "ambience": {"ville": 0.2},
        "grid": [
            "############",
            "############",
            "#kkk.....OO#",
            "#........OO#",
            "#..........#",
            "#j.........#",
            "#.....n....#",
            "#o........o#",
            "#####D######",
        ],
        "spots": [("tour", [(1, 2), (2, 2), (3, 2)], "Boîtes aux lettres", {"flavor": "tour"}),
                  ("ascenseur", [(1, 5)], "Ascenseur"),
                  ("panneau_tour", [(6, 6)], "Panneau de l'amicale des locataires"),
                  ("etages_tour", [(9, 2), (10, 2), (9, 3), (10, 3)], "Cage d'escalier")],
        "npcs": [],
        "wall": [("window", 5, 2)],
    },
}

# Habitants des tours (une personne différente dans quelques halls).
TOWER_PEOPLE = {"tour_a": [("gardienne", 4, 5, 2)], "tour_d": [("voisine", 6, 4, 2)], "tour_f": [("etudiant", 3, 4, 1)]}


# Bruit de pas selon le sol.
STEPS = {"marble": "pierre", "marble_dark": "pierre", "checker": "pierre", "checker_green": "pierre", "tiles_grey": "pierre",
         "parquet": "bois", "planks": "bois", "carpet_red": "tapis", "concrete": "beton", "concrete_light": "beton", "lino": "beton"}


# Son de la porte de chaque bâtiment (assets/audio/sfx/porte_<sorte>_in|out.wav) :
# bois (porte ordinaire), lourde (grand portail), boutique (clochette), vitree (automatique),
# metal (porte coulissante d'atelier), immeuble (interphone et groom).
DOOR_SOUND = {
    "theatre": "lourde", "mairie": "lourde", "conservatoire": "lourde", "halle": "lourde",
    "cafe": "boutique", "imprimerie": "boutique", "boulangerie": "boutique", "librairie": "boutique",
    "fleuriste": "boutique", "disquaire": "boutique", "galerie": "boutique",
    "gare": "vitree", "cinema": "vitree", "mediatheque": "vitree", "ondine": "vitree",
    "fabrique": "metal", "tour": "immeuble",
    "hotel": "bois", "ecole": "bois", "college": "bois", "maison_quartier": "bois",
}


def door_sound(building_id, style):
    return DOOR_SOUND.get("tour" if style == "tour" else building_id, "bois")


def interior_for(building_id, style):
    """Plan d'intérieur d'un bâtiment de la ville ({} : aucun)."""
    key = "tour" if style == "tour" else building_id
    spec = BASE_INTERIORS.get(key)
    if spec is None:
        return {}
    spec = dict(spec)
    if key == "tour":
        spec["npcs"] = TOWER_PEOPLE.get(building_id, [])
        spec["art"] = "int_tour"
    return spec


def to_map(map_id, spec, outside_doors, sound="bois"):
    """Carte world.json d'un intérieur. `outside_doors` : cases-portes dans la rue."""
    g = spec["grid"]
    w = len(g[0])
    for row in g:
        assert len(row) == w, (map_id, row, len(row), w)
    bottom = len(g) - 1
    inside = [x for x, ch in enumerate(g[bottom]) if ch == "D"]
    assert len(inside) == len(outside_doors), (map_id, inside, outside_doors)
    doors = []
    for x, (ox, oy) in zip(inside, outside_doors):
        doors.append({"cell": [x, bottom], "to": "rue", "to_cell": [ox, oy + 1], "facing": "down", "sound": sound})
    spots = []
    for sp in spec["spots"]:
        sid, cells, label = sp[0], sp[1], sp[2]
        for (x, y) in cells:
            assert g[y][x] not in ".,pDS", (map_id, sid, x, y, g[y][x])
        s = {"id": sid, "cells": [list(c) for c in cells], "label": label, "kind": "flavor"}
        if len(sp) > 3:
            s.update(sp[3])
        spots.append(s)
    npcs = []
    for (pid, x, y, r) in spec["npcs"]:
        assert g[y][x] in ".,p", (map_id, pid, x, y, g[y][x])
        npcs.append({"id": pid, "cell": [x, y], "radius": r})
    m = {"name": spec["name"], "outdoor": False, "grid": list(g), "doors": doors, "spots": spots, "npcs": npcs,
         "style": {"floor": spec["floor"], "walls": spec["walls"], "wall": [list(d) for d in spec.get("wall", [])]},
         "sound": {"music": spec["music"], "layers": spec["ambience"], "steps": STEPS[spec["floor"]]}}
    if spec.get("art"):
        m["art"] = spec["art"]
    return m
