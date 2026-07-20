import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/json";
import { TopBar } from "@/components/topbar";
import { Card, SectionTitle, ProgressBar, Badge } from "@/components/ui";
import { CourseCard } from "@/components/course-card";
import { Collapsible } from "@/components/collapsible";
import { ACADEMY_BLOCKS, COURSES } from "@/lib/reference";
import { savePositioning } from "@/app/actions/skills";

const BLOCK_LABEL: Record<string, string> = {
  finance: "Gestion & comptabilité", admin: "Administration culturelle", law: "Droit du spectacle vivant",
  production: "Production & exploitation", hr: "RH & management", policy: "Politiques culturelles",
};

export default async function SkillsPage() {
  const user = await requireAuth();
  const [profile, progress] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: user.id } }),
    prisma.courseProgress.findMany({ where: { userId: user.id } }),
  ]);
  const progressMap = new Map(progress.map((p) => [p.courseKey, p]));
  const selfAssess = parseJson<Record<string, number>>(profile?.selfAssess, {});
  const doneCount = progress.filter((p) => p.status === "done").length;
  const totalTime = progress.reduce((s, p) => s + p.timeSpentMin, 0);

  // Parcours personnalisé : priorise les blocs les plus faibles (auto-éval).
  const ranked = ACADEMY_BLOCKS.map((b) => ({ key: b.key, title: BLOCK_LABEL[b.key], score: selfAssess[b.key] ?? 0 }))
    .sort((a, b) => a.score - b.score);
  const path = buildPath(ranked);

  return (
    <div>
      <TopBar title="Compétences, cours & formations" subtitle="Votre académie de l'administration du spectacle vivant" accent="#c56cf0" />

      {/* Vue d'ensemble */}
      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        <Card className="p-4"><div className="text-xs muted">Formations terminées</div><div className="text-2xl font-bold text-emerald-400">{doneCount}</div></Card>
        <Card className="p-4"><div className="text-xs muted">Temps d'apprentissage</div><div className="text-2xl font-bold">{Math.floor(totalTime / 60)}h {totalTime % 60}min</div></Card>
        <Card className="p-4"><div className="text-xs muted">Badges obtenus</div><div className="text-2xl font-bold text-spot">{progress.filter((p) => p.badgeEarned).length} 🎖</div></Card>
      </div>

      {/* Test de positionnement */}
      <Card className="p-5 mb-4" accent="#c56cf0">
        <SectionTitle sub="Évaluez votre niveau : le parcours et les sous-scores du tableau de bord s'ajustent.">Test de positionnement</SectionTitle>
        <form action={savePositioning} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACADEMY_BLOCKS.map((b) => (
            <div key={b.key}>
              <label className="flex justify-between">
                <span>{BLOCK_LABEL[b.key]}</span>
                <span className="text-spot">{selfAssess[b.key] ?? 0}</span>
              </label>
              <input type="range" name={b.key} min={0} max={100} defaultValue={selfAssess[b.key] ?? 0} />
            </div>
          ))}
          <div className="sm:col-span-2 lg:col-span-3">
            <button className="bg-spot text-stage-950 rounded-lg px-4 py-2 text-sm font-medium">Enregistrer & recalculer</button>
          </div>
        </form>
      </Card>

      {/* Parcours personnalisé */}
      <Card className="p-5 mb-4">
        <SectionTitle sub="Généré depuis vos points faibles — programme sur 3, 6 et 12 mois.">Parcours personnalisé</SectionTitle>
        <div className="grid sm:grid-cols-3 gap-3">
          {(["m3", "m6", "m12"] as const).map((k) => (
            <div key={k} className="panel-2 rounded-lg p-3">
              <div className="font-medium mb-2">{k === "m3" ? "3 mois" : k === "m6" ? "6 mois" : "12 mois"}</div>
              <ul className="space-y-1">
                {path[k].map((item, i) => (
                  <li key={i} className="text-xs muted flex gap-1"><span>•</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* Blocs + ressources */}
      <div className="space-y-3">
        {ACADEMY_BLOCKS.map((block) => {
          const courses = COURSES.filter((c) => c.blockKey === block.key);
          const blockDone = courses.filter((c) => progressMap.get(c.key)?.status === "done").length;
          return (
            <Collapsible
              key={block.key}
              title={BLOCK_LABEL[block.key]}
              sub={`${block.topics.length} thèmes · ${blockDone}/${courses.length} ressources validées`}
              defaultOpen={block.key === ranked[0].key}
            >
              <div className="mb-3">
                <div className="flex flex-wrap gap-1.5">
                  {block.topics.map((t) => (
                    <span key={t} className="text-[11px] rounded-full px-2 py-0.5" style={{ background: `${block.accent}18`, color: block.accent }}>{t}</span>
                  ))}
                </div>
              </div>
              {courses.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-3">
                  {courses.map((c) => {
                    const p = progressMap.get(c.key);
                    return <CourseCard key={c.key} course={c} status={p?.status || "not_started"} timeSpent={p?.timeSpentMin || 0} />;
                  })}
                </div>
              ) : (
                <p className="text-sm muted">Ressources à connecter (voir sources). En attendant, explorez les thèmes ci-dessus.</p>
              )}
            </Collapsible>
          );
        })}
      </div>

      <p className="text-xs muted mt-4">
        Les liens pointent vers des organismes réels (domaines racines) et sont marqués « à vérifier » : une vérification régulière des liens
        est prévue dans les automatisations. Aucun lien mort n'est proposé sciemment.
      </p>
    </div>
  );
}

function buildPath(ranked: { key: string; title: string; score: number }[]): { m3: string[]; m6: string[]; m12: string[] } {
  const weak = ranked.map((r) => r.title);
  return {
    m3: [
      `Bases : ${weak[0]}`,
      "Découverte du spectacle vivant & vocabulaire professionnel",
      "Premier budget prévisionnel (exercice)",
    ],
    m6: [
      `Approfondir : ${weak[0]} et ${weak[1]}`,
      "Droit des contrats (cession, coréalisation)",
      "Étude d'une salle réelle + simulation de projet",
    ],
    m12: [
      `Consolider : ${weak[2] ?? weak[0]}`,
      "Production, planification, exploitation quotidienne",
      "Politiques culturelles & financements — préparation dossier master",
    ],
  };
}
