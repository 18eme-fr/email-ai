import { AuthForm } from "./auth-form";

export function AuthShell({ mode }: { mode: "login" | "register" }) {
  return (
    <main className="min-h-screen bg-stage-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-3xl">🎭</span>
          </div>
          <h1 className="font-display text-3xl font-bold">Backstage Path</h1>
          <p className="muted mt-1">Construire son parcours vers l'administration du spectacle vivant</p>
        </div>
        <div className="panel rounded-2xl p-6 shadow-card">
          <h2 className="text-lg font-semibold mb-4">
            {mode === "login" ? "Connexion" : "Créer un compte"}
          </h2>
          <AuthForm mode={mode} />
        </div>
        <p className="text-center text-xs muted mt-6">
          Vos données restent privées (RGPD). Aucun mot de passe externe stocké.
        </p>
      </div>
    </main>
  );
}
