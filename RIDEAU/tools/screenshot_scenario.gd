class_name ScreenshotScenario
extends RefCounted
## Fait avancer une partie de façon déterministe avant une capture d'écran.
## steps : nombre de demi-étapes jouées par le bot « equilibre ».


static func advance(session: GameSession, steps: int) -> void:
	var bot := StrategyBot.new("equilibre", 1)
	var remaining := steps
	while remaining > 0 and not session.state.finished:
		match session.state.phase:
			GameState.PHASE_SITUATION:
				session.open_programming()
			GameState.PHASE_PROGRAMMING:
				session.confirm_programming(bot.choose_programming(session))
			GameState.PHASE_MANAGEMENT:
				session.confirm_actions(bot.choose_actions(session))
			GameState.PHASE_EVENT:
				if session.state.current_event != "" and session.state.event_choice == "":
					session.choose_event(bot.choose_event(session))
				else:
					session.resolve_turn()
			GameState.PHASE_REPORT:
				session.next_turn()
		remaining -= 1
