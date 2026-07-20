import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/json";
import { TopBar } from "@/components/topbar";
import { Card, SectionTitle, Badge, ProgressBar } from "@/components/ui";
import { Collapsible } from "@/components/collapsible";
import { MASTER_TEMPLATES, APPLICATION_STATUSES } from "@/lib/reference";
import { GapAnalysis } from "@/lib/ai";
import {
  addMasterFromTemplate, addCustomMaster, updateApplication, regenerateGap, deleteApplication,
} from "@/app/actions/applications";

const STATUS_TONE: Record<string, string> = {
  to_study: "neutral", priority: "warn", preparing: "info", sent: "info",
  interview: "good", waitlist: "warn", accepted: "great", rejected: "danger", followup: "warn",
};

export default async function ApplicationsPage() {
  const user = await requireAuth();
  const applications = await prisma.application.findMany({ where: { userId: user.id }, orderBy: [{ priority: "asc" }, { createdAt: "desc" }] });

  return (
    <div>
      <TopBar title="Candidatures & stratégie annuelle" subtitle="Masters, analyse d'écart et suivi des candidatures" accent="#8f1d2d" />

      {/* Suivi par statut (aperçu) */}
      <Card className="p-4 mb-4">
        <SectionTitle sub="Répartition de vos candidatures par statut.">Vue d'ensemble</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {APPLICATION_STATUSES.map((s) => {
            const n = applications.filter((a) => a.status === s.key).length;
            return (
              <div key={s.key} className="panel-2 rounded-lg px-3 py-2 text-center min-w-[90px]">
                <div className="text-lg font-bold">{n}</div>
                <div className="text-[11px] muted">{s.label}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Base des masters */}
        <div className="lg:col-span-2 space-y-3">
          <SectionTitle sub="Chaque fiche : attendus, analyse d'écart, plan d'action et suivi.">Mes masters ciblés</SectionTitle>
          {applications.length === 0 && <Card className="p-4"><p className="text-sm muted">Ajoutez un master depuis les modèles à droite.</p></Card>}
          {applications.map((a) => {
            const gap = parseJson<GapAnalysis>(a.gap, { have: [], missing: [], actions: [] });
            const skills = parseJson<string[]>(a.skillsRequired, []);
            const docs = parseJson<string[]>(a.requiredDocuments, []);
            const compat = gap.have.length + gap.missing.length > 0 ? Math.round((gap.have.length / (gap.have.length + gap.missing.length)) * 100) : 0;
            return (
              <Collapsible
                key={a.id}
                title={`${a.programName}`}
                sub={`${a.university}${a.city ? ` · ${a.city}` : ""} · compatibilité ${compat}%`}
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge tone={STATUS_TONE[a.status]}>{APPLICATION_STATUSES.find((s) => s.key === a.status)?.label}</Badge>
                  {a.selectivity && <Badge tone={a.selectivity === "forte" ? "danger" : a.selectivity === "moyenne" ? "warn" : "good"}>Sélectivité {a.selectivity}</Badge>}
                  {a.hasAlternance && <Badge tone="info">Alternance</Badge>}
                  {a.hasInternship && <Badge tone="info">Stage</Badge>}
                  {a.officialLink && <a href={a.officialLink} target="_blank" rel="noopener noreferrer" className="text-xs text-sceneblue hover:underline">Site officiel ↗</a>}
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1"><span>Compatibilité du profil</span><span>{compat}%</span></div>
                  <ProgressBar value={compat} accent="#8f1d2d" />
                </div>

                {/* Analyse d'écart */}
                <div className="grid sm:grid-cols-3 gap-3 mb-3">
                  <div className="panel-2 rounded-lg p-3">
                    <div className="text-xs font-medium text-emerald-300 mb-1">Acquis</div>
                    <ul className="space-y-0.5">{gap.have.map((h, i) => <li key={i} className="text-[11px] muted">• {h}</li>)}</ul>
                  </div>
                  <div className="panel-2 rounded-lg p-3">
                    <div className="text-xs font-medium text-amber-300 mb-1">À renforcer</div>
                    <ul className="space-y-0.5">{gap.missing.map((h, i) => <li key={i} className="text-[11px] muted">• {h}</li>)}</ul>
                  </div>
                  <div className="panel-2 rounded-lg p-3">
                    <div className="text-xs font-medium text-sceneblue mb-1">Actions</div>
                    <ul className="space-y-0.5">{gap.actions.map((h, i) => <li key={i} className="text-[11px] muted">→ {h}</li>)}</ul>
                  </div>
                </div>

                {(skills.length > 0 || docs.length > 0 || a.keyDates) && (
                  <div className="text-xs muted mb-3 space-y-1">
                    {skills.length > 0 && <div><span className="font-medium">Compétences demandées :</span> {skills.join(", ")}</div>}
                    {docs.length > 0 && <div><span className="font-medium">Pièces :</span> {docs.join(", ")}</div>}
                    {a.keyDates && <div><span className="font-medium">Dates :</span> {a.keyDates}</div>}
                  </div>
                )}

                {/* Suivi */}
                <form action={updateApplication.bind(null, a.id)} className="grid sm:grid-cols-3 gap-2 items-end">
                  <div>
                    <label>Statut</label>
                    <select name="status" defaultValue={a.status}>
                      {APPLICATION_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Priorité</label>
                    <select name="priority" defaultValue={String(a.priority)}>
                      <option value="1">Haute</option>
                      <option value="2">Moyenne</option>
                      <option value="3">Basse</option>
                    </select>
                  </div>
                  <div>
                    <label>Dates clés</label>
                    <input name="keyDates" defaultValue={a.keyDates || ""} placeholder="ex: dossier 15/04" />
                  </div>
                  <div className="sm:col-span-2">
                    <label>Contact</label>
                    <input name="contactName" defaultValue={a.contactName || ""} placeholder="Responsable pédagogique…" />
                  </div>
                  <button className="panel-2 rounded-lg px-3 py-2 text-sm font-medium">Enregistrer</button>
                  <div className="sm:col-span-3">
                    <label>Notes / préparation d'entretien</label>
                    <textarea name="note" rows={2} defaultValue={a.note || ""} placeholder="Arguments, questions probables, points à préparer…" />
                  </div>
                </form>
                <div className="flex gap-2 mt-2">
                  <form action={regenerateGap.bind(null, a.id)}>
                    <button className="text-xs panel-2 rounded px-2 py-1 hover:border-spot/40">↻ Recalculer l'analyse d'écart</button>
                  </form>
                  <form action={deleteApplication.bind(null, a.id)}>
                    <button className="text-xs muted hover:text-red-400">supprimer</button>
                  </form>
                </div>
              </Collapsible>
            );
          })}
        </div>

        {/* Modèles de masters + ajout custom */}
        <div className="space-y-3">
          <Card className="p-4">
            <SectionTitle sub="Ajoutez un master prioritaire (gestion / administration).">Modèles de masters</SectionTitle>
            <div className="space-y-2">
              {MASTER_TEMPLATES.map((m, i) => (
                <div key={i} className="panel-2 rounded-lg p-3">
                  <div className="text-sm font-medium">{m.programName}</div>
                  <div className="text-xs muted">{m.university} · {m.city}</div>
                  <form action={addMasterFromTemplate.bind(null, i)} className="mt-2">
                    <button className="text-xs bg-spot text-stage-950 rounded px-2 py-1 font-medium">＋ Ajouter</button>
                  </form>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[11px] muted panel-2 rounded-lg p-2">
              Hors priorité : musicologie, création artistique pure, communication culturelle pure, médiation sans dimension administrative.
            </div>
          </Card>

          <Collapsible title="Ajouter un master personnalisé">
            <form action={addCustomMaster} className="space-y-2">
              <input name="programName" placeholder="Nom du parcours *" required />
              <input name="university" placeholder="Université / école *" required />
              <input name="city" placeholder="Ville" />
              <select name="selectivity" defaultValue="moyenne">
                <option value="faible">Sélectivité faible</option>
                <option value="moyenne">Sélectivité moyenne</option>
                <option value="forte">Sélectivité forte</option>
              </select>
              <input name="keyDates" placeholder="Dates clés" />
              <input name="officialLink" placeholder="Lien officiel https://…" />
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" name="hasAlternance" className="w-auto" /> Alternance</label>
                <label className="flex items-center gap-2"><input type="checkbox" name="hasInternship" className="w-auto" /> Stage</label>
              </div>
              <button className="w-full bg-spot text-stage-950 rounded-lg py-2 text-sm font-medium">Ajouter</button>
            </form>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}
