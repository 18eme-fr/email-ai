class_name Format
extends RefCounted
## Mise en forme des nombres à la française : « 12 450 € », « +3 », « 85 % ».

const THIN_SPACE := " "  # espace fine insécable


static func thousands(value: int) -> String:
	var digits := str(absi(value))
	var out := ""
	var count := 0
	for i in range(digits.length() - 1, -1, -1):
		out = digits[i] + out
		count += 1
		if count % 3 == 0 and i > 0:
			out = THIN_SPACE + out
	return ("−" if value < 0 else "") + out


static func money(value: int) -> String:
	return thousands(value) + " €"


static func signed_money(value: int) -> String:
	return ("+" if value > 0 else "") + money(value)


static func signed_int(value: int) -> String:
	if value > 0:
		return "+%d" % value
	if value < 0:
		return "−%d" % absi(value)
	return "0"


static func percent(ratio: float) -> String:
	return "%d %%" % roundi(ratio * 100.0)
