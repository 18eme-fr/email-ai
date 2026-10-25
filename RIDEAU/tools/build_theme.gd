extends SceneTree
## Construit assets/ui/rideau_theme.tres à partir des textures pixel art.
## Usage : godot --headless --path . -s res://tools/build_theme.gd
## Le thème produit est une ressource Godot standard, modifiable ensuite dans l'éditeur.

const UI := "res://assets/ui/"
const OUT := "res://assets/ui/rideau_theme.tres"
const OUT_READABLE := "res://assets/ui/rideau_theme_readable.tres"

const CREAM := Color("f3e9d2")
const PAPER_INK := Color("2b1d2e")
const GOLD := Color("f0d48a")
const GOLD_DIM := Color("c9a24b")
const MUTED := Color("b9b0c8")
const DISABLED := Color("8a8f98")
const NIGHT := Color("1f1830")


func _init() -> void:
	# Police de texte : Pixelify Sans sans ligatures (sa ligature « fi » ressemble à un « A »).
	var ts := TextServerManager.get_primary_interface()
	# Police de repli pour les symboles absents des polices pixel (flèches, étoiles, ✓, ⚠).
	var symbols: Font = load("res://assets/fonts/DejaVuSans.ttf")
	var body_var := FontVariation.new()
	body_var.base_font = load("res://assets/fonts/PixelifySans.ttf")
	body_var.fallbacks = [symbols]
	body_var.opentype_features = {ts.name_to_tag("liga"): 0, ts.name_to_tag("clig"): 0, ts.name_to_tag("dlig"): 0}
	ResourceSaver.save(body_var, "res://assets/fonts/pixelify_body.tres")
	var bold := FontVariation.new()
	bold.base_font = load("res://assets/fonts/PixelifySans.ttf")
	bold.variation_opentype = {ts.name_to_tag("wght"): 650}
	bold.opentype_features = body_var.opentype_features
	bold.fallbacks = [symbols]
	ResourceSaver.save(bold, "res://assets/fonts/pixelify_bold.tres")
	var title_var := FontVariation.new()
	title_var.base_font = load("res://assets/fonts/Jersey10-Regular.ttf")
	title_var.fallbacks = [symbols]
	ResourceSaver.save(title_var, "res://assets/fonts/jersey_title.tres")
	for weight: String in ["Regular", "Bold"]:
		var readable := FontVariation.new()
		readable.base_font = load("res://assets/fonts/AtkinsonHyperlegible-%s.ttf" % weight)
		readable.fallbacks = [symbols]
		ResourceSaver.save(readable, "res://assets/fonts/atkinson_%s.tres" % weight.to_lower())
	var err := ResourceSaver.save(_build(load("res://assets/fonts/pixelify_body.tres"), load("res://assets/fonts/pixelify_bold.tres"), 17), OUT)
	print("Thème enregistré : ", OUT, " (", error_string(err), ")")
	# Variante « police très lisible » : même thème, texte en Atkinson Hyperlegible.
	var err2 := ResourceSaver.save(_build(load("res://assets/fonts/atkinson_regular.tres"), load("res://assets/fonts/atkinson_bold.tres"), 17), OUT_READABLE)
	print("Thème enregistré : ", OUT_READABLE, " (", error_string(err2), ")")
	quit(0 if err == OK and err2 == OK else 1)


func _build(body: Font, bold: Font, body_size: int) -> Theme:
	var theme := Theme.new()
	var title: Font = load("res://assets/fonts/jersey_title.tres")
	theme.default_font = body
	theme.default_font_size = body_size

	# --- Libellés -------------------------------------------------------------
	theme.set_color("font_color", "Label", CREAM)
	theme.set_color("font_shadow_color", "Label", Color(0, 0, 0, 0))
	theme.set_constant("line_spacing", "Label", 2)
	_label_variation(theme, "TitleLabel", title, 64, GOLD, 4)
	_label_variation(theme, "HeaderLabel", title, 34, GOLD, 2)
	_label_variation(theme, "SubHeaderLabel", bold, 19, GOLD_DIM, 0)
	_label_variation(theme, "NumberLabel", title, 30, CREAM, 0)
	_label_variation(theme, "SmallLabel", body, 14, MUTED, 0)
	_label_variation(theme, "MutedLabel", body, 16, MUTED, 0)
	_label_variation(theme, "PaperLabel", body, 16, PAPER_INK, 0)
	_label_variation(theme, "PaperTitleLabel", title, 26, PAPER_INK, 0)

	theme.set_color("default_color", "RichTextLabel", CREAM)
	theme.set_font("normal_font", "RichTextLabel", body)
	theme.set_font("bold_font", "RichTextLabel", bold)
	theme.set_font_size("normal_font_size", "RichTextLabel", 17)
	theme.set_font_size("bold_font_size", "RichTextLabel", 17)
	theme.set_constant("line_separation", "RichTextLabel", 3)
	theme.set_type_variation("PaperRichText", "RichTextLabel")
	theme.set_color("default_color", "PaperRichText", PAPER_INK)

	# --- Panneaux --------------------------------------------------------------
	var night := _tex("panel_night", 6, Vector4(12, 10, 12, 10))
	theme.set_stylebox("panel", "PanelContainer", night)
	theme.set_stylebox("panel", "Panel", night)
	_panel_variation(theme, "WoodPanel", _tex("panel_wood", 12, Vector4(20, 18, 20, 18)))
	_panel_variation(theme, "PaperPanel", _tex("panel_paper", 8, Vector4(14, 12, 14, 12)))
	_panel_variation(theme, "InsetPanel", _tex("panel_inset", 6, Vector4(10, 8, 10, 8)))
	var clear := StyleBoxEmpty.new()
	_panel_variation(theme, "ClearPanel", clear)

	# --- Boutons ---------------------------------------------------------------
	_button_styles(theme, "Button", "button", true)
	theme.set_type_variation("SecondaryButton", "Button")
	_button_styles(theme, "SecondaryButton", "button2", false)
	theme.set_type_variation("GoldButton", "Button")
	_button_styles(theme, "GoldButton", "button_gold", false)
	theme.set_color("font_color", "GoldButton", PAPER_INK)
	theme.set_color("font_hover_color", "GoldButton", PAPER_INK)
	theme.set_color("font_pressed_color", "GoldButton", PAPER_INK)
	theme.set_color("font_focus_color", "GoldButton", PAPER_INK)
	theme.set_type_variation("FlatButton", "Button")
	for state in ["normal", "hover", "pressed", "disabled", "focus"]:
		var e := StyleBoxEmpty.new()
		e.content_margin_left = 4
		e.content_margin_right = 4
		theme.set_stylebox(state, "FlatButton", e if state != "focus" else _tex("focus", 8, Vector4(4, 2, 4, 2)))
	theme.set_color("font_color", "FlatButton", GOLD_DIM)
	theme.set_color("font_hover_color", "FlatButton", GOLD)
	theme.set_color("font_pressed_color", "FlatButton", CREAM)

	for type in ["OptionButton", "MenuButton"]:
		_button_styles(theme, type, "button2", false)

	# --- Champs, barres, curseurs -----------------------------------------------
	var inset := _tex("panel_inset", 6, Vector4(10, 6, 10, 6))
	theme.set_stylebox("normal", "LineEdit", inset)
	theme.set_stylebox("focus", "LineEdit", _tex("focus", 8, Vector4(10, 6, 10, 6)))
	theme.set_color("font_color", "LineEdit", CREAM)
	theme.set_color("caret_color", "LineEdit", GOLD)
	theme.set_stylebox("normal", "SpinBox", inset)

	theme.set_stylebox("background", "ProgressBar", _tex("bar_bg", 4, Vector4(2, 2, 2, 2)))
	var fill := StyleBoxFlat.new()
	fill.bg_color = GOLD_DIM
	fill.border_color = Color("f0d48a")
	fill.border_width_top = 2
	fill.content_margin_top = 2
	theme.set_stylebox("fill", "ProgressBar", fill)
	theme.set_color("font_color", "ProgressBar", CREAM)
	theme.set_font_size("font_size", "ProgressBar", 13)

	var slider := StyleBoxFlat.new()
	slider.bg_color = NIGHT
	slider.border_color = Color("160f1e")
	slider.set_border_width_all(2)
	slider.content_margin_top = 4
	slider.content_margin_bottom = 4
	var slider_fill := slider.duplicate()
	slider_fill.bg_color = GOLD_DIM
	theme.set_stylebox("slider", "HSlider", slider)
	theme.set_stylebox("grabber_area", "HSlider", slider_fill)
	theme.set_stylebox("grabber_area_highlight", "HSlider", slider_fill)
	theme.set_icon("grabber", "HSlider", load(UI + "grabber.png"))
	theme.set_icon("grabber_highlight", "HSlider", load(UI + "grabber_hover.png"))

	for type in ["CheckBox", "CheckButton"]:
		theme.set_icon("checked", type, load(UI + "check_on.png"))
		theme.set_icon("unchecked", type, load(UI + "check_off.png"))
		theme.set_color("font_color", type, CREAM)
		theme.set_color("font_hover_color", type, GOLD)
		theme.set_color("font_pressed_color", type, CREAM)
		theme.set_color("font_focus_color", type, GOLD)
		theme.set_constant("h_separation", type, 10)
		for state in ["normal", "hover", "pressed", "hover_pressed", "disabled"]:
			theme.set_stylebox(state, type, StyleBoxEmpty.new())
		theme.set_stylebox("focus", type, _tex("focus", 8, Vector4(4, 2, 4, 2)))

	var scroll := StyleBoxFlat.new()
	scroll.bg_color = Color("160f1e")
	scroll.content_margin_left = 5
	scroll.content_margin_right = 5
	var grab := StyleBoxFlat.new()
	grab.bg_color = Color("5e3a24")
	grab.border_color = GOLD_DIM
	grab.set_border_width_all(1)
	var grab_h := grab.duplicate()
	grab_h.bg_color = Color("8a5a36")
	for type in ["VScrollBar", "HScrollBar"]:
		theme.set_stylebox("scroll", type, scroll)
		theme.set_stylebox("grabber", type, grab)
		theme.set_stylebox("grabber_highlight", type, grab_h)
		theme.set_stylebox("grabber_pressed", type, grab_h)

	# --- Infobulles ---------------------------------------------------------------
	theme.set_stylebox("panel", "TooltipPanel", _tex("panel_paper", 8, Vector4(12, 10, 12, 10)))
	theme.set_color("font_color", "TooltipLabel", PAPER_INK)
	theme.set_font_size("font_size", "TooltipLabel", 15)

	var sep := StyleBoxTexture.new()
	sep.texture = load(UI + "divider.png")
	sep.texture_margin_left = 2
	sep.texture_margin_right = 2
	theme.set_stylebox("separator", "HSeparator", sep)
	theme.set_constant("separation", "HSeparator", 10)

	theme.set_constant("separation", "VBoxContainer", 8)
	theme.set_constant("separation", "HBoxContainer", 8)
	theme.set_constant("h_separation", "GridContainer", 8)
	theme.set_constant("v_separation", "GridContainer", 8)

	return theme


func _tex(name: String, margin: int, content: Vector4) -> StyleBoxTexture:
	var sb := StyleBoxTexture.new()
	sb.texture = load(UI + name + ".png")
	sb.texture_margin_left = margin
	sb.texture_margin_top = margin
	sb.texture_margin_right = margin
	sb.texture_margin_bottom = margin
	sb.content_margin_left = content.x
	sb.content_margin_top = content.y
	sb.content_margin_right = content.z
	sb.content_margin_bottom = content.w
	return sb


func _label_variation(theme: Theme, name: String, font: Font, size: int, color: Color, outline: int) -> void:
	theme.set_type_variation(name, "Label")
	theme.set_font("font", name, font)
	theme.set_font_size("font_size", name, size)
	theme.set_color("font_color", name, color)
	if outline > 0:
		theme.set_constant("outline_size", name, outline)
		theme.set_color("font_outline_color", name, Color("160f1e"))


func _panel_variation(theme: Theme, name: String, style: StyleBox) -> void:
	theme.set_type_variation(name, "PanelContainer")
	theme.set_stylebox("panel", name, style)


func _button_styles(theme: Theme, type: String, prefix: String, with_disabled: bool) -> void:
	var content := Vector4(16, 8, 16, 10)
	theme.set_stylebox("normal", type, _tex(prefix + "_normal", 8, content))
	theme.set_stylebox("hover", type, _tex(prefix + "_hover", 8, content))
	var pressed := _tex(prefix + "_pressed", 8, content + Vector4(0, 2, 0, -2))
	theme.set_stylebox("pressed", type, pressed)
	theme.set_stylebox("hover_pressed", type, pressed)
	theme.set_stylebox("disabled", type, _tex("button_disabled", 8, content))
	theme.set_stylebox("focus", type, _tex("focus", 8, content))
	theme.set_color("font_color", type, CREAM)
	theme.set_color("font_hover_color", type, Color("fffcf4"))
	theme.set_color("font_pressed_color", type, GOLD)
	theme.set_color("font_focus_color", type, Color("fffcf4"))
	theme.set_color("font_disabled_color", type, DISABLED)
	theme.set_constant("h_separation", type, 8)
	theme.set_constant("icon_max_width", type, 32)
