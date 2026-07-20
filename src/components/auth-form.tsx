"use client";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { loginAction, registerAction, type AuthState } from "@/app/actions/auth";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-spot py-2.5 font-semibold text-stage-950 transition hover:bg-spot-light disabled:opacity-60"
    >
      {pending ? "…" : label}
    </button>
  );
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction] = useFormState<AuthState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required placeholder="vous@exemple.fr" autoComplete="email" />
      </div>
      <div>
        <label htmlFor="password">Mot de passe</label>
        <input id="password" name="password" type="password" required minLength={6} placeholder="6 caractères minimum" autoComplete={mode === "login" ? "current-password" : "new-password"} />
      </div>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <SubmitButton label={mode === "login" ? "Se connecter" : "Créer mon compte"} />
      <p className="text-center text-sm muted">
        {mode === "login" ? (
          <>
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-spot hover:underline">
              Créer un compte
            </Link>
          </>
        ) : (
          <>
            Déjà inscrit ?{" "}
            <Link href="/login" className="text-spot hover:underline">
              Se connecter
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
