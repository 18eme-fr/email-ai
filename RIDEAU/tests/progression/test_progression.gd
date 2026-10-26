extends GdUnitTestSuite
## Scénarios, missions, dossiers, compétences et trophées.

var data: GameData


func before() -> void:
	data = GameData.get_default()


func _session(scenario: String = "premiere_saison", game_seed: int = 11) -> GameSession:
	var s := GameSession.new()
	s.new_game(game_seed, "standard", scenario)
	return s


## Réponses parfaites à un dossier.
func _perfect(d: Dictionary) -> Dictionary:
	var rng := RandomNumberGenerator.new()
	return Dossiers.auto_answers(d, rng, 1.0)


func _play_turn(s: GameSession) -> Dictionary:
	s.open_programming()
	s.confirm_programming([])
	s.confirm_actions([])
	if s.state.current_event != "":
		for choice: Dictionary in s.current_event()["choices"]:
			if EventSystem.choice_block_reason(s.data, s.state, s.state.current_event, str(choice["id"])) == "":
				s.choose_event(str(choice["id"]))
				break
	return s.resolve_turn()


# --- Données ------------------------------------------------------------------------

func test_scenarios_missions_and_skills_are_consistent() -> void:
	assert_int(data.scenario_order.size()).is_equal(4)
	for sid: String in data.scenario_order:
		var sc := data.scenario(sid)
		for key: String in ["title", "level", "summary", "context", "question"]:
			assert_str(str(sc.get(key, ""))).override_failure_message("%s : %s vide" % [sid, key]).is_not_empty()
		for mid: String in sc["missions"]:
			assert_bool(data.missions.has(mid)).override_failure_message("%s : mission inconnue %s" % [sid, mid]).is_true()
		for notion: String in sc.get("learning", []):
			assert_bool(data.glossary.has(notion)).override_failure_message("%s : notion %s" % [sid, notion]).is_true()
		var ids: Array = []
		for obj: Dictionary in sc.get("objectives", data.balance["objectives"]):
			ids.append(obj["id"])
		assert_bool("equilibre" in ids).is_true()
	for mid: String in data.mission_order:
		var m: Dictionary = data.missions[mid]
		assert_bool(data.characters.has(str(m["giver"]))).override_failure_message(mid).is_true()
		assert_bool(data.glossary.has(str(m["notion"]))).override_failure_message(mid).is_true()
		for key: String in ["title", "pitch", "success_text", "failure_text", "takeaway"]:
			assert_str(str(m.get(key, ""))).override_failure_message("%s : %s" % [mid, key]).is_not_empty()
		var goal: Dictionary = m["goal"]
		match str(goal["kind"]):
			"dossier":
				assert_bool(Dossiers.CATALOG.has(str(goal["dossier"]))).is_true()
			"played":
				assert_bool(data.shows.has(str(goal["show"]))).is_true()
		for block: String in ["reward", "penalty"]:
			for skill: String in m.get(block, {}).get("xp", {}):
				assert_bool(data.skills.has(skill)).override_failure_message("%s : compétence %s" % [mid, skill]).is_true()
		assert_bool(m.has("duration") or m.has("deadline_turn")).override_failure_message(mid).is_true()
	assert_int(data.skill_order.size()).is_equal(5)
	for a: Dictionary in data.achievements:
		assert_object(UiKit.icon(str(a["icon"]))).override_failure_message(str(a["id"])).is_not_null()


# --- Dossiers -----------------------------------------------------------------------

func test_every_dossier_is_well_formed_and_graded() -> void:
	var s := _session()
	for dossier_id: String in Dossiers.CATALOG:
		for attempt in 6:
			var rng := RandomNumberGenerator.new()
			rng.seed = attempt * 7919 + hash(dossier_id)
			var d := Dossiers.generate(dossier_id, data, s.state, rng)
			assert_array(d["items"]).override_failure_message(dossier_id).is_not_empty()
			for item: Dictionary in d["items"]:
				assert_str(str(item.get("explain", ""))).override_failure_message("%s/%s" % [dossier_id, item["id"]]).is_not_empty()
				if item["kind"] == "choice":
					var opts: Array = item["options"]
					assert_int(opts.size()).override_failure_message("%s/%s : %s" % [dossier_id, item["id"], opts]).is_greater_equal(3)
					var unique := {}
					for o: Variant in opts:
						unique[str(o)] = true
					assert_int(unique.size()).override_failure_message("%s/%s : doublons %s" % [dossier_id, item["id"], opts]).is_equal(opts.size())
					assert_int(int(item["answer"])).is_between(0, opts.size() - 1)
				elif item["kind"] == "multi":
					assert_bool(Dossiers.is_correct(item, item["solution"])).override_failure_message("%s : solution invalide" % dossier_id).is_true()
			assert_float(float(Dossiers.grade(d, _perfect(d))["score"])).override_failure_message(dossier_id).is_equal(1.0)
			var wrong := Dossiers.auto_answers(d, rng, 0.0)
			assert_float(float(Dossiers.grade(d, wrong)["score"])).override_failure_message(dossier_id).is_less(1.0)
			assert_float(float(Dossiers.grade(d, {})["score"])).is_equal(0.0)


func test_break_even_is_computed_like_the_game() -> void:
	var s := _session()
	var rng := RandomNumberGenerator.new()
	rng.seed = 42
	var d := Dossiers.generate("seuil", data, s.state, rng)
	var item: Dictionary = d["items"][1]
	assert_str(str(item["kind"])).is_equal("number")
	# Vérification indépendante : au seuil, la marge calculée par le moteur est positive ou nulle.
	var show: Dictionary = {}
	for id: String in data.show_order:
		if str(d["intro"]).contains(str(data.shows[id]["title"])):
			show = data.shows[id]
	assert_bool(show.is_empty()).is_false()
	var threshold := int(item["answer"])
	var gross := roundi(threshold * float(show["price"]))
	var fin := ShowEconomics.finance(data, show, gross, 1)
	var costs := int(show["fee"]) + int(show.get("tech_cost", 0)) + int(show.get("hosting", 0))
	assert_int(int(fin["net"]) - int(fin["rights"]) - costs).is_greater_equal(-5)
	var below := ShowEconomics.finance(data, show, roundi((threshold - 2) * float(show["price"])), 1)
	assert_int(int(below["net"]) - int(below["rights"]) - costs).is_less(0)


func test_dossier_numbers_change_between_attempts_but_are_reproducible() -> void:
	var s := _session()
	var a := s.open_dossier("contrat")
	var b := s.open_dossier("contrat")
	assert_str(str(a["intro"])).is_equal(str(b["intro"]))
	s.submit_dossier(a, {})
	var c := s.open_dossier("contrat")
	assert_str(str(c["intro"])).is_not_equal(str(a["intro"]))


func test_practice_gives_no_experience() -> void:
	var s := _session()
	var d := s.open_dossier("tresorerie", true)
	var r := s.submit_dossier(d, _perfect(d))
	assert_int(int(r["xp"])).is_equal(0)
	assert_int(SkillSystem.xp(s.state, "finances")).is_equal(0)


# --- Missions -----------------------------------------------------------------------

func test_missions_are_offered_from_the_scenario() -> void:
	var s := _session("redressement")
	var offered := MissionSystem.with_status(s.state, "offered")
	assert_int(offered.size()).is_between(1, MissionSystem.MAX_OFFERED)
	for id: String in offered:
		assert_bool(id in data.scenario("redressement")["missions"]).is_true()
	assert_bool(s.take_notices().size() >= offered.size()).is_true()
	assert_array(s.state.notices).is_empty()


func test_dossier_mission_succeeds_with_reward_and_experience() -> void:
	var s := _session()
	assert_str(MissionSystem.status(s.state, "budget_saison")).is_equal("offered")
	assert_str(s.accept_mission("budget_saison")).is_empty()
	var relations := s.state.stat("relations")
	var d := s.open_dossier("budget")
	var r := s.submit_dossier(d, _perfect(d))
	assert_int((r["missions"] as Array).size()).is_equal(1)
	assert_bool(r["missions"][0]["success"]).is_true()
	assert_str(MissionSystem.status(s.state, "budget_saison")).is_equal("done")
	assert_float(s.state.stat("relations")).is_greater(relations)
	# XP du dossier (15) + récompense de mission (20).
	assert_int(SkillSystem.xp(s.state, "finances")).is_equal(35)


func test_failed_dossier_keeps_mission_open_until_deadline() -> void:
	var s := _session()
	s.accept_mission("budget_saison")
	var d := s.open_dossier("budget")
	var r := s.submit_dossier(d, {})
	assert_array(r["missions"]).is_empty()
	assert_str(MissionSystem.status(s.state, "budget_saison")).is_equal("active")
	_play_turn(s)
	s.next_turn()
	var report := _play_turn(s)
	assert_str(MissionSystem.status(s.state, "budget_saison")).is_equal("failed")
	var found := false
	for o: Dictionary in report["missions"]:
		if o["id"] == "budget_saison":
			found = true
			assert_bool(o["success"]).is_false()
	assert_bool(found).is_true()


func test_metric_mission_succeeds_at_end_of_period() -> void:
	var s := _session()
	assert_str(s.accept_mission("commission_securite")).is_empty()
	s.state.set_stat("equipement", 90.0)
	var report := _play_turn(s)
	assert_str(MissionSystem.status(s.state, "commission_securite")).is_equal("done")
	assert_int(SkillSystem.xp(s.state, "technique")).is_equal(25)
	assert_str(str(report["missions"][0]["takeaway"])).is_not_empty()


func test_at_deadline_mission_waits_for_its_deadline() -> void:
	var s := _session()
	s.state.missions["frequentation_mi_saison"] = {"status": "offered", "offered_turn": 1}
	assert_str(s.accept_mission("frequentation_mi_saison")).is_empty()
	s.state.totals["attendance_total"] = 5000
	_play_turn(s)
	assert_str(MissionSystem.status(s.state, "frequentation_mi_saison")).is_equal("active")
	for t in 3:
		s.next_turn()
		s.state.totals["attendance_total"] = 5000
		_play_turn(s)
	assert_int(s.state.turn).is_equal(4)
	assert_str(MissionSystem.status(s.state, "frequentation_mi_saison")).is_equal("done")


func test_delta_mission_counts_only_progress_after_acceptance() -> void:
	var s := _session("territoire")
	s.state.totals["eac_count"] = 10
	assert_str(s.accept_mission("parcours_eac")).is_empty()
	_play_turn(s)
	assert_str(MissionSystem.status(s.state, "parcours_eac")).is_equal("active")
	s.state.totals["eac_count"] = 12
	s.next_turn()
	_play_turn(s)
	assert_str(MissionSystem.status(s.state, "parcours_eac")).is_equal("done")


func test_failure_applies_the_penalty() -> void:
	var s := _session()
	s.accept_mission("commission_securite")
	s.state.set_stat("equipement", 10.0)
	for t in 3:
		_play_turn(s)
		if t < 2:
			s.next_turn()
	assert_str(MissionSystem.status(s.state, "commission_securite")).is_equal("failed")
	var penalty := 0.0
	for item: Dictionary in s.state.stat_log:
		if item["stat"] == "relations" and str(item["source"]).contains("commission"):
			penalty += float(item["delta"])
	assert_float(penalty).is_less(0.0)


func test_active_missions_are_limited_and_can_be_declined() -> void:
	var s := _session()
	var offered := MissionSystem.with_status(s.state, "offered")
	for id: String in offered:
		s.accept_mission(id)
	s.state.missions["mecenat"] = {"status": "offered", "offered_turn": 1}
	assert_str(s.accept_mission("mecenat")).contains("déjà")
	s.decline_mission("mecenat")
	assert_str(MissionSystem.status(s.state, "mecenat")).is_equal("declined")


func test_a_mission_brings_its_show_into_the_offers() -> void:
	var s := _session("creation", 3)
	s.state.missions["creation_machine"] = {"status": "offered", "offered_turn": 1}
	assert_str(s.accept_mission("creation_machine")).is_empty()
	assert_bool("creation_machine" in s.state.offers).is_true()


# --- Compétences --------------------------------------------------------------------

func test_levels_unlock_perks() -> void:
	var s := _session()
	assert_int(SkillSystem.level(data, s.state, "programmation")).is_equal(1)
	SkillSystem.add_xp(data, s.state, "programmation", 30)
	assert_int(SkillSystem.level(data, s.state, "programmation")).is_equal(2)
	assert_str(str(s.state.notices.back()["kind"])).is_equal("level_up")
	assert_int(SkillSystem.extra_offers(data, s.state)).is_equal(1)
	s.next_turn()
	s.state.phase = GameState.PHASE_REPORT
	s.state.turn = 1
	s.next_turn()
	assert_int(s.state.offers.size()).is_equal(6)


func test_discount_and_overdraft_perks() -> void:
	var s := _session()
	var base_cost := Programming.action_cost(data, s.state, "mediation")
	var base_limit := Rules.overdraft_limit(data, s.state)
	SkillSystem.add_xp(data, s.state, "publics", 30)
	SkillSystem.add_xp(data, s.state, "finances", 80)
	assert_int(Programming.action_cost(data, s.state, "mediation")).is_equal(roundi(int(data.actions["mediation"]["cost"]) * 0.7 * 0.9))
	assert_int(Programming.action_cost(data, s.state, "mediation")).is_less(base_cost)
	assert_int(Rules.overdraft_limit(data, s.state)).is_equal(base_limit - 2000)
	# Le grand livre enregistre le coût réduit.
	s.open_programming()
	s.confirm_programming([])
	s.confirm_actions(["mediation"])
	if s.state.current_event != "":
		for choice: Dictionary in s.current_event()["choices"]:
			if EventSystem.choice_block_reason(s.data, s.state, s.state.current_event, str(choice["id"])) == "":
				s.choose_event(str(choice["id"]))
				break
	s.resolve_turn()
	var paid := 0
	for e: Dictionary in s.state.ledger:
		if e["category"] == "action" and e["source"] == "mediation":
			paid += int(e["amount"])
	assert_int(paid).is_equal(roundi(int(data.actions["mediation"]["cost"]) * 0.7 * 0.9))


# --- Scénarios et trophées -----------------------------------------------------------

func test_scenario_start_and_objectives() -> void:
	var s := _session("redressement")
	assert_int(s.state.cash).is_equal(18500)
	assert_float(s.state.stat("equipe")).is_equal(42.0)
	var debts := 0
	for e: Dictionary in s.state.ledger:
		if e["source"] == "scenario":
			debts += int(e["amount"])
	assert_int(debts).is_equal(5000)
	var ids: Array = []
	for o: Dictionary in SeasonEvaluator.objectives(data, s.state):
		ids.append(o["id"])
	assert_array(ids).contains(["confiance"])


func test_every_scenario_plays_a_full_season() -> void:
	for sid: String in data.scenario_order:
		var s := _session(sid, 2024)
		var bot := StrategyBot.new("equilibre", 2024)
		bot.play_season(s)
		assert_bool(s.state.finished).override_failure_message(sid).is_true()
		assert_int(MissionSystem.with_status(s.state, "done").size()).override_failure_message("%s : aucune mission réussie" % sid).is_greater(0)
		assert_bool(s.state.ending.has("title")).is_true()


func test_achievements_are_awarded_once() -> void:
	var s := _session()
	s.accept_mission("commission_securite")
	s.state.set_stat("equipement", 90.0)
	var report := _play_turn(s)
	var ids: Array = []
	for a: Dictionary in report["achievements"]:
		ids.append(a["id"])
	assert_array(ids).contains(["mission_accomplie"])
	s.next_turn()
	var report2 := _play_turn(s)
	for a: Dictionary in report2["achievements"]:
		assert_str(str(a["id"])).is_not_equal("mission_accomplie")


func test_progression_survives_save_and_old_saves_migrate() -> void:
	var s := _session("territoire")
	s.accept_mission("parcours_eac")
	SkillSystem.add_xp(data, s.state, "publics", 12)
	var r := SaveSystem.deserialize(SaveSystem.serialize(s.state))
	var st: GameState = r["state"]
	assert_str(st.scenario).is_equal("territoire")
	assert_str(str(st.missions["parcours_eac"]["status"])).is_equal("active")
	assert_int(SkillSystem.xp(st, "publics")).is_equal(12)
	var d := s.state.to_dict()
	for key: String in ["scenario", "missions", "skills_xp", "dossiers", "achievements", "notions_seen", "notices"]:
		d.erase(key)
	var envelope := {"format": SaveSystem.FORMAT_ID, "version": 2, "state": d, "checksum": SaveSystem.checksum(d)}
	var old := SaveSystem.deserialize(JSON.stringify(envelope, "", true, true))
	assert_int(int(old["status"])).is_equal(SaveSystem.Status.OK)
	assert_str((old["state"] as GameState).scenario).is_equal("premiere_saison")
