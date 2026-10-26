extends SceneTree
## Outil de simulation : joue automatiquement de nombreuses saisons avec
## différentes stratégies et produit un rapport d'équilibrage.
##
## Usage :
##   godot --headless --path . -s res://tools/simulate.gd -- --games 200 --difficulty standard [--scenario redressement] --out docs/BALANCE_REPORT.md
## Chaque partie utilise la graine (base + index) : un problème repéré se
## reproduit exactement en relançant la même graine.

var games := 200
var difficulty := "standard"
var scenario := "premiere_saison"
var base_seed := 1000
var out_path := ""


func _init() -> void:
	_parse_args()
	var data := GameData.get_default()
	var lines: Array[String] = []
	lines.append("# Rapport d'équilibrage automatique")
	lines.append("")
	lines.append("Généré par `tools/simulate.gd` — %d saisons par stratégie, scénario « %s », difficulté « %s », graines %d à %d." % [games, data.scenario(scenario).get("title", scenario), difficulty, base_seed, base_seed + games - 1])
	lines.append("")
	lines.append("| Stratégie | Trésorerie finale moy. | Écart-type | Min | Max | Convention renouvelée | Faillite | Score moy. | Spectateurs moy. | Rayonnement moy. | Missions réussies moy. |")
	lines.append("|---|---|---|---|---|---|---|---|---|---|---|")
	var endings_by_strategy := {}
	var show_margins := {}
	var objectives_by_strategy := {}
	var stats_by_strategy := {}
	for strategy: String in StrategyBot.STRATEGIES:
		var cash: Array[float] = []
		var renewed := 0
		var bankrupt := 0
		var score_sum := 0.0
		var att_sum := 0.0
		var ray_sum := 0.0
		var missions_sum := 0.0
		var endings := {}
		var obj_counts := {}
		var stat_sums := {}
		for i in games:
			var session := GameSession.new(data)
			session.new_game(base_seed + i, difficulty, scenario)
			var bot := StrategyBot.new(strategy, base_seed + i)
			var state := bot.play_season(session)
			cash.append(float(state.cash))
			if state.ending.get("renewed", false):
				renewed += 1
			if state.bankrupt:
				bankrupt += 1
			score_sum += float(state.ending.get("score", 0))
			att_sum += float(state.totals["attendance_total"])
			ray_sum += Rules.rayonnement(data, state)
			missions_sum += MissionSystem.with_status(state, "done").size()
			for sid: String in GameState.STAT_IDS:
				stat_sums[sid] = float(stat_sums.get(sid, 0.0)) + state.stat(sid)
			var eid := str(state.ending.get("ending_id", "?"))
			endings[eid] = int(endings.get(eid, 0)) + 1
			for obj: Dictionary in state.ending.get("objectives", []):
				if obj["met"]:
					obj_counts[obj["id"]] = int(obj_counts.get(obj["id"], 0)) + 1
			for report: Dictionary in state.reports:
				for s: Dictionary in report["shows"]:
					if s.get("cancelled", false):
						continue
					var acc: Array = show_margins.get(s["show_id"], [0.0, 0, 0.0])
					acc[0] += float(s["finance"]["margin"])
					acc[1] += 1
					acc[2] += float(s["fill"])
					show_margins[s["show_id"]] = acc
		var mean := _mean(cash)
		lines.append("| %s | %s | %s | %s | %s | %d %% | %d %% | %.1f | %d | %.1f | %.1f |" % [
			strategy, Format.money(roundi(mean)), Format.money(roundi(_sd(cash, mean))),
			Format.money(roundi(cash.min())), Format.money(roundi(cash.max())),
			roundi(100.0 * renewed / games), roundi(100.0 * bankrupt / games),
			score_sum / games, roundi(att_sum / games), ray_sum / games, missions_sum / games])
		endings_by_strategy[strategy] = endings
		var stat_parts: Array[String] = []
		for sid: String in GameState.STAT_IDS:
			stat_parts.append("%s %d" % [sid, roundi(float(stat_sums.get(sid, 0.0)) / games)])
		stats_by_strategy[strategy] = ", ".join(stat_parts)
		objectives_by_strategy[strategy] = obj_counts
	lines.append("")
	lines.append("## Fins obtenues")
	lines.append("")
	for strategy: String in endings_by_strategy:
		var parts: Array[String] = []
		var e: Dictionary = endings_by_strategy[strategy]
		for k: String in e:
			parts.append("%s : %d" % [k, e[k]])
		lines.append("- **%s** — %s" % [strategy, ", ".join(parts)])
	lines.append("")
	lines.append("## Indicateurs internes moyens en fin de saison")
	lines.append("")
	for strategy: String in stats_by_strategy:
		lines.append("- **%s** — %s" % [strategy, stats_by_strategy[strategy]])
	lines.append("")
	lines.append("## Objectifs atteints (sur %d saisons)" % games)
	lines.append("")
	for strategy: String in objectives_by_strategy:
		var parts: Array[String] = []
		var o: Dictionary = objectives_by_strategy[strategy]
		for obj: Dictionary in data.scenario(scenario).get("objectives", data.balance["objectives"]):
			parts.append("%s %d" % [obj["id"], int(o.get(obj["id"], 0))])
		lines.append("- **%s** — %s" % [strategy, ", ".join(parts)])
	lines.append("")
	lines.append("## Marge moyenne par spectacle (toutes stratégies)")
	lines.append("")
	lines.append("| Spectacle | Programmations | Marge moyenne | Remplissage moyen |")
	lines.append("|---|---|---|---|")
	var ids := show_margins.keys()
	ids.sort_custom(func(a: Variant, b: Variant) -> bool: return show_margins[a][0] / show_margins[a][1] > show_margins[b][0] / show_margins[b][1])
	for id: Variant in ids:
		var acc: Array = show_margins[id]
		lines.append("| %s | %d | %s | %d %% |" % [data.shows[id]["title"], acc[1], Format.money(roundi(acc[0] / acc[1])), roundi(100.0 * acc[2] / acc[1])])
	var text := "\n".join(lines) + "\n"
	print(text)
	if out_path != "":
		var f := FileAccess.open(out_path, FileAccess.WRITE)
		if f:
			f.store_string(text)
			f.close()
			print("Rapport écrit dans ", out_path)
	quit(0)


func _parse_args() -> void:
	var args := OS.get_cmdline_user_args()
	var i := 0
	while i < args.size():
		match args[i]:
			"--games":
				games = int(args[i + 1]); i += 1
			"--difficulty":
				difficulty = args[i + 1]; i += 1
			"--scenario":
				scenario = args[i + 1]; i += 1
			"--seed":
				base_seed = int(args[i + 1]); i += 1
			"--out":
				out_path = args[i + 1]; i += 1
		i += 1


func _mean(values: Array[float]) -> float:
	var s := 0.0
	for v in values:
		s += v
	return s / maxf(values.size(), 1)


func _sd(values: Array[float], mean: float) -> float:
	var s := 0.0
	for v in values:
		s += (v - mean) * (v - mean)
	return sqrt(s / maxf(values.size(), 1))
