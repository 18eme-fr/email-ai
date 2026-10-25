class_name Ledger
extends RefCounted
## Grand livre simplifié.
##
## Chaque écriture distingue :
## - la période où elle est ENGAGÉE (elle compte dans le résultat de cette période) ;
## - la période où elle est RÉGLÉE (elle fait bouger la trésorerie).
## Une écriture « neutre » (TVA collectée, avance remboursable) touche la
## trésorerie sans compter dans le résultat.
## Une écriture « conditionnelle » n'est ni comptée ni réglée tant que sa
## condition n'est pas validée (ex. solde de subvention lié au bilan).
## Une écriture « sans mouvement d'argent » (non_cash : dotation aux
## amortissements) compte dans le résultat mais ne touche jamais la trésorerie.
##
## Format d'une écriture :
## {id, label, category, amount (int > 0), direction (+1 recette / -1 dépense),
##  turn_engaged, due_turn, settled, neutral, non_cash, conditional, cancelled, source}

const INCOME := 1
const EXPENSE := -1


## Ajoute une écriture. Refuse les montants négatifs ou nuls et les directions
## invalides : une dépense s'exprime avec direction = -1, jamais avec un montant négatif.
static func add(state: GameState, label: String, category: String, amount: int, direction: int,
		turn_engaged: int, due_turn: int, extra: Dictionary = {}) -> Dictionary:
	if amount <= 0:
		push_warning("Écriture refusée (montant <= 0) : %s" % label)
		return {}
	if direction != INCOME and direction != EXPENSE:
		push_warning("Écriture refusée (sens invalide) : %s" % label)
		return {}
	if due_turn < turn_engaged:
		due_turn = turn_engaged
	var entry := {
		"id": state.next_ledger_id,
		"label": label,
		"category": category,
		"amount": amount,
		"direction": direction,
		"turn_engaged": turn_engaged,
		"due_turn": due_turn,
		"settled": false,
		"neutral": bool(extra.get("neutral", false)),
		"non_cash": bool(extra.get("non_cash", false)),
		"conditional": bool(extra.get("conditional", false)),
		"cancelled": false,
		"source": str(extra.get("source", "")),
	}
	state.next_ledger_id += 1
	state.ledger.append(entry)
	return entry


## Règle toutes les écritures échues (due_turn <= turn). Retourne les écritures réglées.
## C'est la SEULE fonction qui modifie state.cash à partir du grand livre.
static func settle_due(state: GameState, turn: int) -> Array:
	var settled: Array = []
	for entry: Dictionary in state.ledger:
		if entry["settled"] or entry["cancelled"] or entry["conditional"]:
			continue
		if int(entry["due_turn"]) <= turn:
			entry["settled"] = true
			entry["settled_turn"] = turn
			if entry.get("non_cash", false):
				continue
			state.cash += int(entry["amount"]) * int(entry["direction"])
			settled.append(entry)
	return settled


## Écritures engagées pendant une période, hors neutres et hors conditionnelles non validées.
static func engaged_in(state: GameState, turn: int) -> Array:
	var out: Array = []
	for entry: Dictionary in state.ledger:
		if entry["cancelled"] or entry["neutral"] or entry["conditional"]:
			continue
		if int(entry["turn_engaged"]) == turn:
			out.append(entry)
	return out


static func sum(entries: Array, direction: int) -> int:
	var total := 0
	for entry: Dictionary in entries:
		if int(entry["direction"]) == direction:
			total += int(entry["amount"])
	return total


## Résultat d'une période = produits engagés − charges engagées.
static func result_of(state: GameState, turn: int) -> int:
	var entries := engaged_in(state, turn)
	return sum(entries, INCOME) - sum(entries, EXPENSE)


## Écritures non encore réglées (à recevoir / à payer), conditionnelles et
## écritures sans mouvement d'argent exclues.
static func outstanding(state: GameState, direction: int) -> Array:
	var out: Array = []
	for entry: Dictionary in state.ledger:
		if entry["settled"] or entry["cancelled"] or entry["conditional"] or entry.get("non_cash", false):
			continue
		if int(entry["direction"]) == direction:
			out.append(entry)
	return out


static func outstanding_total(state: GameState, direction: int) -> int:
	return sum(outstanding(state, direction), direction)


## Somme des mouvements de trésorerie prévus jusqu'à une période incluse (non réglés).
static func due_until(state: GameState, turn: int) -> int:
	var total := 0
	for entry: Dictionary in state.ledger:
		if entry["settled"] or entry["cancelled"] or entry["conditional"] or entry.get("non_cash", false):
			continue
		if int(entry["due_turn"]) <= turn:
			total += int(entry["amount"]) * int(entry["direction"])
	return total


static func conditional_entries(state: GameState) -> Array:
	var out: Array = []
	for entry: Dictionary in state.ledger:
		if entry["conditional"] and not entry["cancelled"]:
			out.append(entry)
	return out


## Valide une écriture conditionnelle : elle devient une écriture normale.
static func confirm_conditional(entry: Dictionary) -> void:
	entry["conditional"] = false


static func cancel(entry: Dictionary) -> void:
	entry["cancelled"] = true
