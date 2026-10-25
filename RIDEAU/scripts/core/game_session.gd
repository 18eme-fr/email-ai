class_name GameSession
extends RefCounted
## Orchestration d'une partie, indépendante de l'interface.
## Utilisée par l'autoload Game (jeu), par la simulation (tools/) et par les tests.
##
## Cycle d'une période :
##   situation → programmation → gestion → événement → bilan → (période suivante)

var data: GameData
var state: GameState
var last_report: Dictionary = {}


func _init(game_data: GameData = null) -> void:
	data = game_data if game_data != null else GameData.get_default()


func new_game(game_seed: int, difficulty_id: String = "standard") -> void:
	state = GameState.new()
	state.game_seed = game_seed
	state.difficulty = difficulty_id if data.balance.get("difficulties", {}).has(difficulty_id) else "standard"
	var diff := data.difficulty(state.difficulty)
	var start: Dictionary = data.balance["start"]
	state.cash = starting_cash()
	for id: String in GameState.STAT_IDS:
		state.stats[id] = float(start["stats"].get(id, 50))
	# Subvention de fonctionnement : versements programmés dès le départ.
	var sub: Dictionary = data.balance["municipal_subsidy"]
	var total := float(sub["total"]) * float(diff.get("subsidy_mult", 1.0))
	for tranche: Dictionary in sub["tranches"]:
		var t := int(tranche["turn"])
		Ledger.add(state, "%s — %s" % [sub["label"], tranche["label"]], "subvention", roundi(total * float(tranche["share"])),
				Ledger.INCOME, t, t, {"conditional": bool(tranche.get("conditional", false)), "source": "ville"})
	start_turn()


func load_state(loaded: GameState) -> void:
	state = loaded
	last_report = state.reports.back() if not state.reports.is_empty() else {}


func start_turn() -> void:
	state.phase = GameState.PHASE_SITUATION
	state.programmed = []
	state.actions = []
	state.turn_mods = {}
	state.stat_log = []
	state.current_event = ""
	state.event_choice = ""
	state.event_outcome = {}
	state.offers = Programming.draw_offers(data, state)


# --- Lecture ---------------------------------------------------------------------

## Trésorerie de départ selon la difficulté (premier point des courbes).
func starting_cash() -> int:
	return roundi(float(data.balance["start"]["cash"]) * float(data.difficulty(state.difficulty).get("cash_mult", 1.0)))


func period_name() -> String:
	return str(data.period(state.turn).get("name", ""))


func rayonnement() -> float:
	return Rules.rayonnement(data, state)


func estimate(show_id: String, price_level: String) -> Dictionary:
	return ShowEconomics.estimate(data, state, data.shows[show_id], price_level)


func action_capacity() -> int:
	return Programming.action_capacity(data, state)


func fixed_costs_total() -> int:
	var diff := data.difficulty(state.difficulty)
	var total := 0
	for item: Dictionary in data.balance["fixed_costs"]:
		total += roundi(float(item["amount"]) * float(diff.get("fixed_mult", 1.0)))
	return total


## Trésorerie prévue en fin de période selon une programmation et des actions.
## Retourne {expected, low} : la valeur basse suppose une fréquentation faible.
func projected_cash(programmed: Array = state.programmed, actions: Array = state.actions) -> Dictionary:
	var base := state.cash + Ledger.due_until(state, state.turn) - fixed_costs_total()
	for id: String in actions:
		var action: Dictionary = data.actions[id]
		if int(action.get("payment_delay", 0)) == 0:
			base -= int(action["cost"])
	var expected := base
	var low := base
	for entry: Dictionary in programmed:
		var show: Dictionary = data.shows[entry["show_id"]]
		var est := ShowEconomics.estimate(data, state, show, str(entry["price_level"]))
		# En trésorerie, la TVA et les droits d'auteur partent à la période suivante :
		# on compte la recette TTC moins ce qui est payé dans la période.
		expected += _cash_effect(int(est["gross"]), est["finance"])
		low += _cash_effect(int(est["gross_low"]), est["finance_low"])
	return {"expected": expected, "low": low}


static func _cash_effect(gross: int, fin: Dictionary) -> int:
	return gross - int(fin["fee"]) - int(fin["tech"]) - int(fin["hosting"]) - int(fin["company_share"])


# --- Décisions -------------------------------------------------------------------

func open_programming() -> void:
	if state.phase == GameState.PHASE_SITUATION:
		state.phase = GameState.PHASE_PROGRAMMING


## Retour à l'étape précédente (avant l'événement uniquement : ensuite, les choix sont engagés).
func go_back() -> bool:
	match state.phase:
		GameState.PHASE_PROGRAMMING:
			state.phase = GameState.PHASE_SITUATION
		GameState.PHASE_MANAGEMENT:
			state.phase = GameState.PHASE_PROGRAMMING
		_:
			return false
	return true


## Valide et enregistre la programmation. Retourne "" ou un message d'erreur.
func confirm_programming(programmed: Array) -> String:
	if state.phase != GameState.PHASE_PROGRAMMING:
		return "La programmation n'est pas ouverte à cette étape."
	var err := Programming.validate(data, state, programmed)
	if err != "":
		return err
	err = _affordability_error(programmed, [])
	if err != "":
		return err
	state.programmed = programmed.duplicate(true)
	state.phase = GameState.PHASE_MANAGEMENT
	return ""


## Ajoute ou retire une action du plan de la période (monde explorable : on
## décide les actions une par une auprès des personnes concernées).
## Retourne "" ou la raison du refus.
func plan_action(action_id: String, planned: bool) -> String:
	if state.phase != GameState.PHASE_MANAGEMENT:
		return "Les actions se décident une fois la programmation validée."
	var next := state.actions.duplicate()
	if planned:
		if action_id in next:
			return ""
		next.append(action_id)
	else:
		next.erase(action_id)
	var err := Programming.validate_actions(data, state, next)
	if err == "" and planned:
		err = _affordability_error(state.programmed, next)
	if err != "":
		return err
	state.actions = next
	return ""


## Valide les actions, puis tire l'événement de la période.
func confirm_actions(actions: Array) -> String:
	if state.phase != GameState.PHASE_MANAGEMENT:
		return "Les actions de gestion ne sont pas ouvertes à cette étape."
	var err := Programming.validate_actions(data, state, actions)
	if err != "":
		return err
	err = _affordability_error(state.programmed, actions)
	if err != "":
		return err
	state.actions = actions.duplicate()
	state.phase = GameState.PHASE_EVENT
	state.current_event = EventSystem.pick(data, state)
	if state.current_event != "":
		state.seen_events.append(state.current_event)
	return ""


## Refuse une dépense qui ferait passer la trésorerie sous le découvert autorisé.
## Ne rien programmer reste toujours possible : si les seules charges fixes
## suffisent à dépasser la limite, la faillite sera la conséquence de la période,
## mais le joueur n'est jamais bloqué.
func _affordability_error(programmed: Array, actions: Array) -> String:
	var limit := int(data.balance.get("overdraft_limit", -6000))
	var projection := projected_cash(programmed, actions)
	var baseline := projected_cash([], [])
	if projection["low"] < limit and projection["low"] < baseline["low"]:
		return "Dépenses refusées : dans le pire des cas, la trésorerie tomberait à %s, sous la limite du découvert (%s). Allégez la programmation ou les actions." % [Format.money(projection["low"]), Format.money(limit)]
	return ""


# --- Rénovations (investissements) ---------------------------------------------

## Dotation aux amortissements d'une rénovation, par période : son coût réparti
## sur sa durée d'utilisation (en années de huit périodes).
func amortization_per_turn(upgrade_id: String) -> int:
	var upgrade: Dictionary = data.upgrades.get(upgrade_id, {})
	if upgrade.is_empty():
		return 0
	var periods := maxi(1, int(upgrade.get("useful_life_years", 1)) * data.periods_per_year)
	return maxi(1, roundi(float(upgrade["cost"]) / float(periods)))


## Raison pour laquelle une rénovation ne peut pas être achetée maintenant, ou "".
func upgrade_block_reason(upgrade_id: String) -> String:
	if not data.upgrades.has(upgrade_id):
		return "Rénovation inconnue."
	if upgrade_id in state.upgrades:
		return "Ces travaux sont déjà faits."
	if not state.phase in [GameState.PHASE_SITUATION, GameState.PHASE_PROGRAMMING, GameState.PHASE_MANAGEMENT]:
		return "Les travaux se décident avant l'événement de la période."
	var limit := int(data.balance.get("overdraft_limit", -6000))
	var low := int(projected_cash(state.programmed, state.actions)["low"]) - int(data.upgrades[upgrade_id]["cost"])
	if low < limit:
		return "Trésorerie insuffisante : dans le pire des cas, elle tomberait à %s, sous la limite du découvert (%s)." % [Format.money(low), Format.money(limit)]
	return ""


## Achète une rénovation. Le prix sort de la trésorerie (écriture neutre pour
## le résultat) ; le résultat supporte une dotation aux amortissements à chaque
## période restante. Retourne "" ou un message d'erreur.
func buy_upgrade(upgrade_id: String) -> String:
	var reason := upgrade_block_reason(upgrade_id)
	if reason != "":
		return reason
	var upgrade: Dictionary = data.upgrades[upgrade_id]
	var label := str(upgrade["label"])
	var turn := state.turn
	Ledger.add(state, "Investissement — %s" % label, "investissement", int(upgrade["cost"]), Ledger.EXPENSE,
			turn, turn + int(upgrade.get("payment_delay", 0)), {"neutral": true, "source": upgrade_id})
	var per := amortization_per_turn(upgrade_id)
	for t in range(turn, data.turns() + 1):
		Ledger.add(state, "Dotation aux amortissements — %s" % label, "amortissement", per, Ledger.EXPENSE,
				t, t, {"non_cash": true, "source": upgrade_id})
	Rules.apply(upgrade.get("effects", {}), data, state, label, hash(upgrade_id))
	state.upgrades.append(upgrade_id)
	state.key_decisions.append({"turn": turn, "text": "Rénovation : %s" % label, "kind": "upgrade"})
	return ""


func current_event() -> Dictionary:
	return data.events.get(state.current_event, {})


## Applique le choix fait pendant l'événement. Retourne le résumé des effets.
func choose_event(choice_id: String) -> Dictionary:
	if state.phase != GameState.PHASE_EVENT or state.current_event == "" or state.event_choice != "":
		return {"error": "Aucun événement en attente de décision."}
	var reason := EventSystem.choice_block_reason(data, state, state.current_event, choice_id)
	if reason != "":
		return {"error": reason}
	var choice := EventSystem.find_choice(data, state.current_event, choice_id)
	var event := current_event()
	state.event_choice = choice_id
	var summary := Rules.apply(choice.get("effects", {}), data, state, str(event["title"]), hash(state.current_event))
	state.event_outcome = summary.get("chance", {})
	var decision := "%s : %s" % [event["title"], choice["label"]]
	if not state.event_outcome.is_empty():
		decision += " (%s)" % ("réussi" if state.event_outcome["success"] else "raté")
	state.key_decisions.append({"turn": state.turn, "text": decision})
	return summary


func event_resolved() -> bool:
	return state.current_event == "" or state.event_choice != ""


## Calcule la période et passe au bilan (ou à la fin de partie).
func resolve_turn() -> Dictionary:
	if state.phase == GameState.PHASE_REPORT or state.phase == GameState.PHASE_FINISHED:
		return last_report
	if state.phase != GameState.PHASE_EVENT or not event_resolved():
		return {"error": "La période ne peut être lancée qu'après l'événement."}
	for entry: Dictionary in state.programmed:
		state.key_decisions.append({"turn": state.turn, "text": "Programmation : %s" % data.shows[entry["show_id"]]["title"], "kind": "show"})
	var report := TurnResolver.resolve(data, state)
	if not state.current_event.is_empty():
		var choice := EventSystem.find_choice(data, state.current_event, state.event_choice)
		report["event"] = {"id": state.current_event, "title": current_event().get("title", ""),
				"choice": choice.get("label", ""), "outcome": state.event_outcome}
	state.reports.append(report)
	last_report = report
	if state.bankrupt or state.turn >= data.turns():
		state.finished = true
		state.ending = SeasonEvaluator.evaluate(data, state)
		state.phase = GameState.PHASE_FINISHED
	else:
		state.phase = GameState.PHASE_REPORT
	return report


func next_turn() -> void:
	if state.finished or state.phase != GameState.PHASE_REPORT:
		return
	state.turn += 1
	start_turn()
