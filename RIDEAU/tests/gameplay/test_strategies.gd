extends GdUnitTestSuite
## Équilibrage : plusieurs stratégies viables, aucune stratégie triviale gagnante.
## (L'outil tools/simulate.gd fait la même chose à plus grande échelle.)

const GAMES := 24

var data: GameData


func before() -> void:
	data = GameData.get_default()


func _run(strategy: String) -> Dictionary:
	var renewed := 0
	var bankrupt := 0
	var endings := {}
	for i in GAMES:
		var s := GameSession.new(data)
		s.new_game(500 + i, "standard")
		StrategyBot.new(strategy, 500 + i).play_season(s)
		assert_bool(s.state.finished).is_true()
		if s.state.ending["renewed"]:
			renewed += 1
		if s.state.bankrupt:
			bankrupt += 1
		endings[s.state.ending["ending_id"]] = true
	return {"renewed": renewed, "bankrupt": bankrupt, "endings": endings}


func test_balanced_and_artistic_strategies_are_viable() -> void:
	assert_int(_run("equilibre")["renewed"]).is_greater(GAMES / 2)
	assert_int(_run("artistique")["renewed"]).is_greater(GAMES / 3)


func test_doing_nothing_never_wins() -> void:
	var r := _run("passive")
	assert_int(r["renewed"]).is_equal(0)


func test_pure_profit_strategy_fails_public_service_missions() -> void:
	var r := _run("prudente")
	assert_int(r["renewed"]).is_less(GAMES / 4)


func test_random_play_rarely_wins_and_may_fail() -> void:
	var r := _run("aleatoire")
	assert_int(r["renewed"]).is_less(GAMES * 2 / 3)


func test_several_endings_are_reachable() -> void:
	var all := {}
	for strategy: String in StrategyBot.STRATEGIES:
		all.merge(_run(strategy)["endings"])
	assert_int(all.size()).is_greater_equal(5)
