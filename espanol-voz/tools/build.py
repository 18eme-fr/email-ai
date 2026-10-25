"""Génère index.html (appli GitHub Pages, SDK Anthropic + clé API) à partir de artifact.html (artefact claude.ai)."""
import pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
src = (root / "artifact.html").read_text()

backend = '''const MODEL = "claude-opus-5-5";

// Chaque appel est indépendant : la page envoie la consigne et l'historique dans le prompt.
async function askJSON(prompt) {
  const client = new Anthropic({ apiKey: settings.apiKey, dangerouslyAllowBrowser: true });
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low" },
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal") throw new Error("Claude n'a pas répondu à ce message. Reformule ta phrase.");
  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  try {
    return JSON.parse(text);
  } catch {
    const a = text.indexOf("{"), b = text.lastIndexOf("}");
    if (a < 0 || b <= a) throw new Error("La réponse est arrivée incomplète.");
    return JSON.parse(text.slice(a, b + 1));
  }
}

function explainError(err) {
  if (err instanceof Anthropic.AuthenticationError) return "Clé API refusée. Vérifie-la dans Réglages.";
  if (err instanceof Anthropic.PermissionDeniedError) return "Cette clé API n'a pas accès au modèle. Vérifie ton compte Anthropic.";
  if (err instanceof Anthropic.RateLimitError) return "Trop de messages d'un coup. Attends quelques secondes avant de renvoyer.";
  if (err instanceof Anthropic.APIConnectionError) return "L'API ne répond pas. Vérifie ta connexion internet.";
  if (err instanceof Anthropic.APIError) return "Erreur de l'API (" + (err.status ?? "?") + ") : " + err.message;
  return err?.message || "La réponse n'est pas arrivée.";
}

function needsSetup() {
  if (settings.apiKey) return false;
  setStatus("Ajoute d'abord ta clé API dans Réglages.");
  $("settings").showModal();
  $("apiKey").focus();
  return true;
}
'''

key_field = '''<label class="row"><span>Clé API Anthropic</span>
    <input id="apiKey" type="password" placeholder="sk-ant-…" autocomplete="off">
  </label>
  <p class="hint" style="margin:-8px 0 16px">Gardée uniquement dans ce navigateur. Crée-la sur console.anthropic.com, rubrique API Keys.</p>'''

out = re.sub(r"// BACKEND-START.*?// BACKEND-END\n", lambda m: backend, src, flags=re.S)
out = out.replace("// BACKEND-IMPORT", 'import Anthropic from "https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.132.1/+esm";')
out = out.replace("<!-- SETTINGS-EXTRA -->", key_field)
out = out.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', "")
out = ('<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
       '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
       '<meta name="theme-color" content="#0e6b66">\n'
       + out.replace("<style>", "<style>\n:root { padding-top: env(safe-area-inset-top, 0px); }", 1)
            .replace("</style>\n", "</style>\n</head>\n<body>\n", 1)
       + "</body>\n</html>\n")
assert "BACKEND" not in out and "SETTINGS-EXTRA" not in out
(root / "index.html").write_text(out)
print("index.html généré")
