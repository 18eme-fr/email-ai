class_name SeasonReport
extends RefCounted
## Rapport de saison au format Markdown : scénario, résultats, missions, dossiers,
## compétences, trophées, notions consultées et questions de débriefing.
## Pensé pour être remis à un enseignant (téléchargeable depuis l'écran de fin).


static func file_name(session: GameSession) -> String:
	return "rideau_rapport_%s_%d.md" % [session.state.scenario, session.state.game_seed]


static func markdown(session: GameSession, player_name: String = "") -> String:
	var data := session.data
	var s := session.state
	var sc := session.scenario()
	var e: Dictionary = s.ending if not s.ending.is_empty() else SeasonEvaluator.evaluate(data, s)
	var L: Array[String] = []
	L.append("# RIDEAU ! — Rapport de saison")
	L.append("")
	if player_name != "":
		L.append("**Direction :** %s  " % player_name)
	L.append("**Scénario :** %s (%s)  " % [sc.get("title", s.scenario), sc.get("level", "")])
	L.append("**Difficulté :** %s · **Graine :** %d · **Périodes jouées :** %d / %d  " % [data.difficulty(s.difficulty).get("label", s.difficulty), s.game_seed, s.reports.size(), data.turns()])
	L.append("**Version du jeu :** %s" % str(ProjectSettings.get_setting("application/config/version", "")))
	L.append("")
	L.append("> %s" % sc.get("question", ""))
	L.append("")
	L.append("## Verdict")
	L.append("")
	var verdict := "Convention renouvelée" if e.get("renewed", false) else ("Faillite" if s.bankrupt else "Convention non renouvelée")
	L.append("**%s — %s.** %s" % [e.get("title", ""), verdict, e.get("text", "")])
	L.append("")
	L.append("Score indicatif : **%d / 100**. Trésorerie finale : **%s**. Entrées : **%s**. Rayonnement : **%d**." % [int(e.get("score", 0)), Format.money(s.cash), Format.thousands(int(s.totals["attendance_total"])), roundi(Rules.rayonnement(data, s))])
	L.append("")
	L.append("## Objectifs de la convention")
	L.append("")
	L.append("| Objectif | Résultat | Atteint |")
	L.append("|---|---|---|")
	for obj: Dictionary in SeasonEvaluator.objectives(data, s):
		var value := Format.money(int(obj["value"])) if obj["id"] == "equilibre" else Format.thousands(roundi(float(obj["value"])))
		L.append("| %s | %s | %s |" % [obj["label"], value, "oui" if obj["met"] else "non"])
	L.append("")
	L.append("## Évolution par période")
	L.append("")
	L.append("| Période | Résultat | Variation de trésorerie | Trésorerie fin | Entrées | Événement |")
	L.append("|---|---|---|---|---|---|")
	for r: Dictionary in s.reports:
		var fin: Dictionary = r.get("finance", {})
		var ev: Dictionary = r.get("event", {})
		L.append("| %s | %s | %s | %s | %s | %s |" % [r.get("period", ""), Format.signed_money(int(fin.get("resultat", 0))), Format.signed_money(int(fin.get("variation", 0))),
			Format.money(int(fin.get("cash_after", 0))), Format.thousands(int(r.get("attendance", 0))), ("%s → %s" % [ev.get("title", ""), ev.get("choice", "")]) if not ev.is_empty() else "—"])
	L.append("")
	L.append("## Missions")
	L.append("")
	var any := false
	for id: String in data.mission_order:
		var m: Dictionary = s.missions.get(id, {})
		if not m.get("status", "") in ["done", "failed", "active"]:
			continue
		any = true
		var def: Dictionary = data.missions[id]
		var st: String = {"done": "réussie", "failed": "échouée", "active": "en cours"}[m["status"]]
		L.append("- **%s** (%s, confiée par %s) — %s. *À retenir :* %s" % [def["title"], st, data.character_name(str(def["giver"])), def["goal"].get("text", ""), def["takeaway"]])
	if not any:
		L.append("Aucune mission acceptée.")
	L.append("")
	L.append("## Dossiers de compétences")
	L.append("")
	var by_dossier := {}
	for r: Dictionary in s.dossiers:
		if r.get("practice", false):
			continue
		var acc: Array = by_dossier.get(r["id"], [0, 0.0])
		acc[0] += 1
		acc[1] = maxf(float(acc[1]), float(r["score"]))
		by_dossier[r["id"]] = acc
	if by_dossier.is_empty():
		L.append("Aucun dossier rendu.")
	else:
		L.append("| Dossier | Tentatives | Meilleur score |")
		L.append("|---|---|---|")
		for id: String in by_dossier:
			L.append("| %s | %d | %d %% |" % [Dossiers.CATALOG[id]["title"], int(by_dossier[id][0]), roundi(float(by_dossier[id][1]) * 100)])
	var practice := 0
	for r: Dictionary in s.dossiers:
		if r.get("practice", false):
			practice += 1
	if practice > 0:
		L.append("")
		L.append("Dossiers faits en entraînement : %d." % practice)
	L.append("")
	L.append("## Compétences")
	L.append("")
	for skill: String in data.skill_order:
		L.append("- %s : niveau %d (%d XP)" % [data.skills[skill]["label"], SkillSystem.level(data, s, skill), SkillSystem.xp(s, skill)])
	L.append("")
	L.append("## Trophées")
	L.append("")
	var trophies: Array = []
	for a: Dictionary in data.achievements:
		if a["id"] in s.achievements:
			trophies.append(str(a["title"]))
	L.append(", ".join(trophies) if not trophies.is_empty() else "Aucun.")
	L.append("")
	L.append("## Décisions marquantes")
	L.append("")
	for d: Dictionary in s.key_decisions:
		if d.get("kind", "") != "show":
			L.append("- Période %d : %s" % [int(d["turn"]), d["text"]])
	if not s.upgrades.is_empty():
		var labels: Array = []
		for u: String in s.upgrades:
			labels.append(str(data.upgrades[u]["label"]))
		L.append("- Rénovations : %s" % ", ".join(labels))
	L.append("")
	L.append("## Notions travaillées")
	L.append("")
	var learning: Array = sc.get("learning", [])
	for n: String in learning:
		L.append("- %s %s" % [data.glossary.get(n, {}).get("title", n), "(consultée dans le carnet)" if n in s.notions_seen else ""])
	var others: Array = []
	for n: String in s.notions_seen:
		if not n in learning:
			others.append(str(data.glossary.get(n, {}).get("title", n)))
	if not others.is_empty():
		L.append("- Autres notions consultées : %s" % ", ".join(others))
	L.append("")
	L.append("## Enseignements de la saison")
	L.append("")
	for lesson: Variant in e.get("lessons", []):
		L.append("- %s" % lesson)
	L.append("")
	L.append("## Questions pour le débriefing")
	L.append("")
	var i := 1
	for q: String in sc.get("debrief", []):
		L.append("%d. %s" % [i, q])
		i += 1
	L.append("")
	L.append("*Jeu pédagogique : le théâtre, la ville et les montants sont fictifs et les règles simplifiées (voir SOURCES.md).*")
	return "\n".join(L) + "\n"
