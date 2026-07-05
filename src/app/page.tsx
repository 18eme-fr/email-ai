import Link from "next/link";

const STEPS = [
  {
    number: "01",
    title: "L'IA cherche des vidéos peu connues.",
    body: "Elle explore YouTube à la recherche de contenus rares, oubliés ou tombés hors des recommandations classiques.",
  },
  {
    number: "02",
    title: "Elle analyse leur rareté, leur ambiance et leur intérêt.",
    body: "Chaque candidate reçoit un résumé, des tags, une ambiance et des scores de rareté, qualité, découverte et potentiel sample.",
  },
  {
    number: "03",
    title: "Salin Radio les diffuse dans un flux continu.",
    body: "Une programmation qui suit l'heure de la journée, enchaîne automatiquement et ne s'arrête jamais.",
  },
];

const TAGLINES = [
  "La radio qui fouille YouTube à ta place.",
  "Escape the algorithm.",
  "Découvre ce que YouTube ne te montre plus.",
  "L'IA dig, l'humain garde le goût.",
];

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(122,31,43,0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(184,48,63,0.25), transparent 40%)",
        }}
      />

      <section className="relative mx-auto flex max-w-4xl flex-col items-center px-5 pb-20 pt-24 text-center sm:pt-32">
        <span className="mb-6 rounded-full border border-salin-line px-4 py-1 text-xs uppercase tracking-[0.2em] text-salin-fg-muted">
          Radio web 24h/24 — 100% YouTube officiel
        </span>
        <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
          Salin<span className="text-gradient-red">Radio</span>
        </h1>
        <p className="mt-6 font-display text-xl italic text-salin-fg-muted sm:text-2xl">
          Des vidéos perdues. Une IA qui trie. Une radio qui découvre.
        </p>
        <p className="mx-auto mt-8 max-w-xl text-balance text-salin-fg-muted">
          Salin Radio fouille YouTube pour trouver des vidéos rares, oubliées ou peu
          vues. L&apos;IA trie, classe et programme. Vous découvrez.
        </p>
        <Link
          href="/radio"
          className="mt-10 inline-flex items-center gap-3 rounded-full bg-salin-red px-8 py-4 text-sm font-semibold uppercase tracking-wider text-salin-fg shadow-[0_0_40px_-10px_rgba(184,48,63,0.8)] transition hover:bg-salin-red-bright"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-salin-fg" />
          Écouter maintenant
        </Link>
        <p className="mt-4 text-xs text-salin-fg-muted">
          Gratuit, sans compte, en direct.
        </p>
      </section>

      <section className="relative mx-auto max-w-5xl px-5 py-16">
        <h2 className="mb-10 text-center font-display text-2xl text-salin-fg-muted">
          Comment ça marche
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-salin-line bg-salin-bg-card p-6"
            >
              <span className="font-display text-3xl text-salin-red-bright">
                {step.number}
              </span>
              <h3 className="mt-4 font-display text-lg leading-snug">
                {step.title}
              </h3>
              <p className="mt-3 text-sm text-salin-fg-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-5xl px-5 py-16">
        <div className="grid gap-3 sm:grid-cols-2">
          {TAGLINES.map((line) => (
            <div
              key={line}
              className="rounded-xl border border-salin-line/70 bg-salin-bg-elevated px-5 py-4 font-display italic text-salin-fg-muted"
            >
              &ldquo;{line}&rdquo;
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-3xl px-5 pb-24 text-center">
        <h2 className="font-display text-2xl">
          Prêt à quitter l&apos;algorithme ?
        </h2>
        <p className="mt-3 text-sm text-salin-fg-muted">
          Rejoins le flux, sans compte, sans playlist à choisir. Juste la radio.
        </p>
        <Link
          href="/radio"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-salin-red-bright px-6 py-3 text-sm font-semibold uppercase tracking-wider transition hover:bg-salin-red-bright"
        >
          Écouter Salin Radio
        </Link>
      </section>
    </div>
  );
}
