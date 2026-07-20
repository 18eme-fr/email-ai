import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/json";
import { TopBar } from "@/components/topbar";
import { Card, SectionTitle, ProgressBar, Badge, EmptyState, Stat } from "@/components/ui";
import { ProjectStep, BreakEvenCalc } from "@/components/project-tools";
import { PROJECT_STEPS, BUDGET_CATEGORIES, INCOME_CATEGORIES, PROJECT_EXAMPLE_LIBRARY } from "@/lib/reference";
import {
  createProject, updateProjectMeta, addBudgetLine, deleteBudgetLine, addTask, toggleTask, deleteTask, generateProjectPortfolio,
} from "@/app/actions/project";

export default async function ProjectPage({ searchParams }: { searchParams: { p?: string } }) {
  const user = await requireAuth();
  const projects = await prisma.project.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  const selectedId = searchParams.p || projects[0]?.id;
  const project = selectedId ? projects.find((p) => p.id === selectedId) : undefined;

  const [lines, tasks] = project
    ? await Promise.all([
        prisma.budgetLine.findMany({ where: { projectId: project.id } }),
        prisma.task.findMany({ where: { projectId: project.id }, orderBy: { createdAt: "asc" } }),
      ])
    : [[], []];

  const steps = project ? parseJson<Record<string, { done?: boolean; notes?: string }>>(project.steps, {}) : {};
  const doneCount = PROJECT_STEPS.filter((s) => steps[s.key]?.done).length;
  const pct = Math.round((doneCount / PROJECT_STEPS.length) * 100);
  const income = lines.filter((l) => l.kind === "income").reduce((s, l) => s + l.amount, 0);
  const expense = lines.filter((l) => l.kind === "expense").reduce((s, l) => s + l.amount, 0);

  return (
    <div>
      <TopBar title="Mon projet culturel" subtitle="Assistant étape par étape — de l'idée aux preuves" accent="#2fae8f" />

      {/* Sélecteur / création */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card className="p-4 lg:col-span-2">
          <SectionTitle sub="Sélectionnez ou créez un projet (concert, showcase, scène ouverte, mini-festival…).">Projets</SectionTitle>
          <div className="flex flex-wrap gap-2 mb-3">
            {projects.map((p) => (
              <a
                key={p.id}
                href={`/project?p=${p.id}`}
                className={`text-sm rounded-lg px-3 py-1.5 ${p.id === selectedId ? "bg-spot text-stage-950 font-medium" : "panel-2"}`}
              >
                {p.title}
              </a>
            ))}
          </div>
          <form action={createProject} className="grid sm:grid-cols-4 gap-2">
            <input name="title" className="sm:col-span-2" placeholder="Titre du nouveau projet" required />
            <select name="type" defaultValue="concert">
              <option value="concert">Concert</option>
              <option value="showcase">Showcase</option>
              <option value="scene-ouverte">Scène ouverte</option>
              <option value="cafe-theatre">Café-théâtre</option>
              <option value="mini-festival">Mini-festival</option>
              <option value="rencontre">Rencontre artistique</option>
            </select>
            <button className="bg-spot text-stage-950 rounded-lg px-3 py-2 text-sm font-medium">＋ Créer</button>
            <input name="concept" className="sm:col-span-4" placeholder="Concept en une phrase (optionnel)" />
          </form>
        </Card>
        <Card className="p-4 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm muted">Avancement</span>
            <span className="text-2xl font-bold text-emerald-400">{pct}%</span>
          </div>
          <ProgressBar value={pct} accent="#2fae8f" />
          <div className="text-xs muted mt-2">{doneCount}/{PROJECT_STEPS.length} étapes réalisées</div>
        </Card>
      </div>

      {!project ? (
        <EmptyState title="Aucun projet" hint="Créez votre premier projet culturel ci-dessus." />
      ) : (
        <>
          {/* Méta projet */}
          <Card className="p-4 mb-4">
            <form action={updateProjectMeta.bind(null, project.id)} className="grid sm:grid-cols-4 gap-2 items-end">
              <div className="sm:col-span-2">
                <label>Titre</label>
                <input name="title" defaultValue={project.title} />
              </div>
              <div>
                <label>Statut</label>
                <select name="status" defaultValue={project.status}>
                  <option value="draft">Brouillon</option>
                  <option value="active">En cours</option>
                  <option value="done">Terminé</option>
                </select>
              </div>
              <button className="panel-2 rounded-lg px-3 py-2 text-sm font-medium">Enregistrer</button>
              <div className="sm:col-span-4">
                <label>Concept</label>
                <textarea name="concept" rows={2} defaultValue={project.concept || ""} />
              </div>
            </form>
          </Card>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Assistant 22 étapes */}
            <Card className="p-4">
              <SectionTitle sub="22 étapes, de la définition du concept à l'archivage des preuves.">Assistant étape par étape</SectionTitle>
              <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
                {PROJECT_STEPS.map((s) => (
                  <ProjectStep
                    key={s.key}
                    projectId={project.id}
                    stepKey={s.key}
                    n={s.n}
                    title={s.title}
                    hint={s.hint}
                    done={!!steps[s.key]?.done}
                    notes={steps[s.key]?.notes || ""}
                  />
                ))}
              </div>
            </Card>

            <div className="space-y-4">
              {/* Budget prévisionnel */}
              <Card className="p-4">
                <SectionTitle sub="Recettes & dépenses — le résultat alimente le bilan.">Budget prévisionnel</SectionTitle>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <Stat label="Dépenses" value={`${expense.toFixed(0)} €`} />
                  <Stat label="Recettes" value={`${income.toFixed(0)} €`} />
                  <Stat label="Résultat" value={`${(income - expense).toFixed(0)} €`} hint={income - expense >= 0 ? "équilibré" : "déficit"} />
                </div>
                <div className="space-y-1.5 max-h-52 overflow-y-auto mb-3">
                  {lines.map((l) => (
                    <div key={l.id} className="flex items-center justify-between gap-2 panel-2 rounded px-2 py-1.5 text-sm">
                      <span className="flex items-center gap-2 min-w-0">
                        <Badge tone={l.kind === "income" ? "good" : "warn"}>{l.kind === "income" ? "R" : "D"}</Badge>
                        <span className="truncate">{l.category}{l.label ? ` — ${l.label}` : ""}</span>
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="font-medium">{l.amount.toFixed(0)} €</span>
                        <form action={deleteBudgetLine.bind(null, project.id, l.id)}>
                          <button className="text-xs muted hover:text-red-400">✕</button>
                        </form>
                      </span>
                    </div>
                  ))}
                  {lines.length === 0 && <p className="text-sm muted">Aucune ligne budgétaire.</p>}
                </div>
                <form action={addBudgetLine.bind(null, project.id)} className="grid grid-cols-2 gap-2">
                  <select name="kind" defaultValue="expense">
                    <option value="expense">Dépense</option>
                    <option value="income">Recette</option>
                  </select>
                  <input name="amount" type="number" step="0.01" placeholder="Montant €" required />
                  <select name="category" className="col-span-2" defaultValue={BUDGET_CATEGORIES[0]}>
                    <optgroup label="Dépenses">
                      {BUDGET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </optgroup>
                    <optgroup label="Recettes">
                      {INCOME_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </optgroup>
                  </select>
                  <input name="label" className="col-span-2" placeholder="Libellé (optionnel)" />
                  <button className="col-span-2 bg-spot text-stage-950 rounded-lg py-2 text-sm font-medium">＋ Ajouter la ligne</button>
                </form>
              </Card>

              {/* Seuil de rentabilité */}
              <Card className="p-4">
                <SectionTitle sub="Calcul du nombre de billets à vendre pour équilibrer.">Seuil de rentabilité</SectionTitle>
                <BreakEvenCalc suggestedFixed={expense} />
              </Card>
            </div>
          </div>

          {/* Tâches / rétroplanning */}
          <Card className="p-4 mt-4">
            <SectionTitle sub="Liste des tâches par phase (base du rétroplanning et de la matrice des responsabilités).">Tâches & production</SectionTitle>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
              {tasks.map((t) => (
                <div key={t.id} className="panel-2 rounded-lg p-2.5 flex items-start gap-2">
                  <form action={toggleTask.bind(null, project.id, t.id)}>
                    <button className={`mt-0.5 h-5 w-5 rounded border flex items-center justify-center text-[10px] ${t.done ? "bg-emerald-500 border-emerald-500 text-stage-950" : "border-[var(--border)]"}`}>
                      {t.done ? "✓" : ""}
                    </button>
                  </form>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm ${t.done ? "line-through opacity-60" : ""}`}>{t.title}</div>
                    <div className="text-[11px] muted">{t.phase}{t.dueDate ? ` · ${t.dueDate}` : ""}{t.owner ? ` · ${t.owner}` : ""}</div>
                  </div>
                  <form action={deleteTask.bind(null, project.id, t.id)}>
                    <button className="text-xs muted hover:text-red-400">✕</button>
                  </form>
                </div>
              ))}
              {tasks.length === 0 && <p className="text-sm muted">Aucune tâche.</p>}
            </div>
            <form action={addTask.bind(null, project.id)} className="grid sm:grid-cols-4 gap-2">
              <input name="title" className="sm:col-span-2" placeholder="Nouvelle tâche" required />
              <input name="phase" placeholder="Phase (ex: Communication)" />
              <input name="dueDate" type="date" />
              <input name="owner" className="sm:col-span-3" placeholder="Responsable (matrice RACI)" />
              <button className="bg-spot text-stage-950 rounded-lg px-3 py-2 text-sm font-medium">＋ Ajouter</button>
            </form>
          </Card>

          {/* Mode portfolio + exemples */}
          <div className="grid lg:grid-cols-2 gap-4 mt-4">
            <Card className="p-4" accent="#e8853a">
              <SectionTitle sub="Génère une fiche professionnelle du projet dans votre portfolio.">Mode portfolio</SectionTitle>
              <p className="text-sm muted mb-3">
                Contexte, objectifs, budget, résultats et compétences acquises sont assemblés automatiquement à partir des données du projet.
                Aucune donnée inventée : seuls vos éléments réels sont repris.
              </p>
              <form action={generateProjectPortfolio.bind(null, project.id)}>
                <button className="bg-spot text-stage-950 rounded-lg px-3 py-2 text-sm font-medium">Générer la fiche portfolio</button>
              </form>
            </Card>
            <Card className="p-4">
              <SectionTitle sub="Modèles pédagogiques. ⚠ Les modèles juridiques doivent être validés par un professionnel.">Bibliothèque d'exemples</SectionTitle>
              <ul className="space-y-1.5">
                {PROJECT_EXAMPLE_LIBRARY.map((e) => (
                  <li key={e.key} className="panel-2 rounded-lg p-2.5">
                    <div className="text-sm font-medium">{e.title}</div>
                    <div className="text-xs muted">{e.note}</div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
