import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/json";
import { TopBar } from "@/components/topbar";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { PSYCH_MATRIX } from "@/lib/reference";
import { generateReformulation, deletePsychEntry, pushReformulationToPortfolio } from "@/app/actions/psychology";

export default async function PsychologyPage() {
  const user = (await getCurrentUser())!;
  const entries = await prisma.psychEntry.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });

  return (
    <div>
      <TopBar title="Transformer la psychologie en atout" subtitle="Valoriser son parcours sans jamais le surestimer" accent="#5b95e0" />

      {/* Matrice de correspondance */}
      <Card className="p-5 mb-4" accent="#5b95e0">
        <SectionTitle sub="Compétences issues de la psychologie → compétences utiles en salle de spectacle.">Matrice de correspondance</SectionTitle>
        <div className="grid md:grid-cols-2 gap-2">
          {PSYCH_MATRIX.map((m) => (
            <div key={m.psych} className="panel-2 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{m.psych}</span>
                <span className="text-spot">→</span>
                <span className="text-sceneblue">{m.cultural}</span>
              </div>
              <p className="text-xs muted mt-1">{m.note}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Générateur de reformulations */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <SectionTitle sub="Saisissez une expérience réelle : obtenez des formulations honnêtes.">Générateur de reformulations</SectionTitle>
          <form action={generateReformulation} className="space-y-3">
            <div>
              <label>Expérience</label>
              <input name="experience" placeholder="ex : Accueil et billetterie dans une salle de spectacle" required defaultValue="" />
            </div>
            <div>
              <label>Nature de l'expérience</label>
              <select name="nature" defaultValue="exercée">
                <option value="exercée">Réellement exercée</option>
                <option value="observée">Observée / appui ponctuel</option>
              </select>
            </div>
            <button className="bg-spot text-stage-950 rounded-lg px-4 py-2 text-sm font-medium">Générer</button>
          </form>

          <div className="mt-4 panel-2 rounded-lg p-3 text-xs">
            <div className="font-medium mb-1 text-amber-300">Règles importantes (ne jamais) :</div>
            <ul className="space-y-0.5 muted">
              <li>• exagérer une mission ou transformer une observation en responsabilité ;</li>
              <li>• inventer une compétence ou une preuve ;</li>
              <li>• présenter la psychologie comme un équivalent d'une formation en gestion.</li>
            </ul>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge tone="good">acquis</Badge>
              <Badge tone="info">en cours</Badge>
              <Badge tone="warn">objectif</Badge>
              <Badge tone="neutral">observée</Badge>
              <Badge tone="great">exercée</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle sub="Vos reformulations enregistrées.">Mes reformulations</SectionTitle>
          {entries.length === 0 ? (
            <p className="text-sm muted">Aucune reformulation pour le moment.</p>
          ) : (
            <div className="space-y-3 max-h-[560px] overflow-y-auto">
              {entries.map((e) => {
                const transferable = parseJson<string[]>(e.transferableSkills, []);
                const cultural = parseJson<string[]>(e.culturalSkills, []);
                return (
                  <div key={e.id} className="panel-2 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium">{e.inputExperience}</div>
                      <Badge tone={e.nature === "exercée" ? "great" : "neutral"}>{e.nature}</Badge>
                    </div>
                    <div className="mt-2">
                      <div className="text-[11px] muted mb-1">Compétences transférables</div>
                      <div className="flex flex-wrap gap-1">
                        {transferable.map((s) => <span key={s} className="text-[11px] rounded-full bg-white/5 px-2 py-0.5">{s}</span>)}
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-[11px] muted mb-1">Compétences culturelles</div>
                      <div className="flex flex-wrap gap-1">
                        {cultural.map((s) => <span key={s} className="text-[11px] rounded-full bg-sceneblue/15 text-sceneblue px-2 py-0.5">{s}</span>)}
                      </div>
                    </div>
                    <div className="mt-2 space-y-1 text-xs">
                      <p><span className="muted">CV :</span> {e.cvPhrase}</p>
                      <p><span className="muted">Lettre :</span> {e.letterPhrase}</p>
                      <p><span className="muted">Entretien :</span> {e.interviewPhrase}</p>
                      <p className="text-amber-300/90"><span className="muted">Limites :</span> {e.limits}</p>
                      <p className="text-emerald-300/90"><span className="muted">Preuves nécessaires :</span> {e.evidenceNeeded}</p>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <form action={pushReformulationToPortfolio.bind(null, e.id)}>
                        <button className="text-xs panel rounded px-2 py-1 hover:border-spot/40">→ Portfolio</button>
                      </form>
                      <form action={deletePsychEntry.bind(null, e.id)}>
                        <button className="text-xs muted hover:text-red-400">supprimer</button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
