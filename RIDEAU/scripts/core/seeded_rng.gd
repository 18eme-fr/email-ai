class_name SeededRng
extends RefCounted
## Générateurs pseudo-aléatoires reproductibles.
## Chaque tirage est dérivé de (graine de partie, période, canal), si bien que
## le résultat ne dépend pas de l'ordre des clics dans l'interface :
## une même graine et les mêmes décisions donnent toujours la même saison.

const CHANNEL_OFFERS := 1
const CHANNEL_EVENT := 2
const CHANNEL_CHANCE := 3
const CHANNEL_SHOWS := 4
const CHANNEL_QUALITY := 5
const CHANNEL_INCIDENT := 6
const CHANNEL_DOSSIER := 7


static func make(game_seed: int, turn: int, channel: int, salt: int = 0) -> RandomNumberGenerator:
	var rng := RandomNumberGenerator.new()
	rng.seed = hash([game_seed, turn, channel, salt])
	return rng


## Tirage gaussien centré réduit (Box-Muller), borné pour éviter les valeurs extrêmes.
static func gaussian(rng: RandomNumberGenerator, limit: float = 2.5) -> float:
	var u1 := maxf(rng.randf(), 1e-9)
	var u2 := rng.randf()
	var z := sqrt(-2.0 * log(u1)) * cos(TAU * u2)
	return clampf(z, -limit, limit)


static func weighted_pick(rng: RandomNumberGenerator, items: Array, weights: Array) -> Variant:
	var total := 0.0
	for w: float in weights:
		total += maxf(w, 0.0)
	if items.is_empty() or total <= 0.0:
		return null
	var roll := rng.randf() * total
	for i in items.size():
		roll -= maxf(float(weights[i]), 0.0)
		if roll <= 0.0:
			return items[i]
	return items[items.size() - 1]
