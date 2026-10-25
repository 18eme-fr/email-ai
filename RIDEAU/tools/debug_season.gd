extends SceneTree
## Rejoue une saison avec une stratégie et une graine, et affiche chaque période.
## Usage : godot --headless --path . -s res://tools/debug_season.gd -- <stratégie> <graine>

func _init() -> void:
	var args := OS.get_cmdline_user_args()
	var strategy := args[0] if args.size() > 0 else "equilibre"
	var game_seed := int(args[1]) if args.size() > 1 else 1000
	var session := GameSession.new()
	session.new_game(game_seed, "standard")
	var bot := StrategyBot.new(strategy, game_seed)
	while not session.state.finished:
		bot.play_turn(session)
		var r: Dictionary = session.last_report
		var shows: Array[String] = []
		for s: Dictionary in r["shows"]:
			shows.append("%s(%s)" % [s["title"], Format.signed_money(s.get("finance", {}).get("margin", 0))])
		var acts: Array[String] = []
		for a: Dictionary in r["actions"]:
			acts.append(a["id"])
		print("T%d cash %s → %s | résultat %s | %s | actions %s | évt %s : %s" % [r["turn"], Format.money(r["cash_before"]), Format.money(r["finance"]["cash_after"]), Format.signed_money(r["finance"]["resultat"]), ", ".join(shows), ",".join(acts), r.get("event", {}).get("title", "-"), r.get("event", {}).get("choice", "-")])
	print("FIN : ", session.state.ending.get("title"), " cash ", session.state.cash, " bankrupt ", session.state.bankrupt)
	quit()
