import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/json";
import { TopBar } from "@/components/topbar";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { Collapsible } from "@/components/collapsible";
import { PrintButton } from "@/components/print-button";
import { PORTFOLIO_SECTIONS, VENUE_STUDY_FIELDS } from "@/lib/reference";
import { addPortfolioItem, deletePortfolioItem, updatePortfolioItem, saveVenueStudy } from "@/app/actions/portfolio";

const STATUS_TONE: Record<string, string> = { acquis: "good", "en cours": "info", objectif: "warn" };

export default async function PortfolioPage() {
  const user = await requireAuth();
  const items = await prisma.portfolioItem.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  const bySection = new Map<string, typeof items>();
  for (const it of items) {
    const sec = it.section || "Autres";
    if (!bySection.has(sec)) bySection.set(sec, []);
    bySection.get(sec)!.push(it);
  }

  return (
    <div>
      <TopBar
        title="Portfolio professionnel"
        subtitle="Transformer vos expériences en preuves — jamais de contenu inventé"
        accent="#e8853a"
      />

      {/* En-tête + génération de documents */}
      <Card className="p-5 mb-4" accent="#e8853a">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <SectionTitle sub="Version web imprimable (PDF via le navigateur), courte ou complète.">Générer les documents</SectionTitle>
          </div>
          <div className="flex gap-2">
            <PrintButton label="Portfolio complet (PDF)" target="/portfolio/print?mode=full" />
            <PrintButton label="Version courte (5 p.)" target="/portfolio/print?mode=short" />
          </div>
        </div>
        <p className="text-xs muted mt-2">
          Chaque affirmation est reliée à une preuve ou marquée « objectif en cours ». {items.length} élément(s) au total.
        </p>
      </Card>

      {/* Ajouter un élément */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card className="p-4">
          <SectionTitle>Ajouter un élément</SectionTitle>
          <form action={addPortfolioItem} className="grid sm:grid-cols-2 gap-2">
            <select name="section" defaultValue="Expériences" className="sm:col-span-2">
              {PORTFOLIO_SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input name="title" className="sm:col-span-2" placeholder="Titre *" required />
            <textarea name="content" className="sm:col-span-2" rows={3} placeholder="Description (factuelle)" />
            <select name="status" defaultValue="en cours">
              <option value="acquis">Acquis</option>
              <option value="en cours">En cours d'acquisition</option>
              <option value="objectif">Objectif</option>
            </select>
            <input name="evidence" placeholder="Preuve (lien, doc)" />
            <input type="hidden" name="kind" value="experience" />
            <button className="sm:col-span-2 bg-spot text-stage-950 rounded-lg py-2 text-sm font-medium">Ajouter au portfolio</button>
          </form>
        </Card>

        {/* Rubriques */}
        <Card className="p-4">
          <SectionTitle sub="14 rubriques structurent votre portfolio.">Rubriques</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {PORTFOLIO_SECTIONS.map((s) => {
              const n = bySection.get(s)?.length || 0;
              return (
                <span key={s} className={`text-xs rounded-full px-2 py-1 ${n ? "bg-spot/15 text-spot-light" : "panel-2 muted"}`}>
                  {s} {n > 0 && `· ${n}`}
                </span>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Étude d'une salle */}
      <Collapsible title="Étude d'une salle de spectacle" sub="Modèle d'analyse d'une salle réelle (20 champs). Indiquez toujours vos sources.">
        <form action={saveVenueStudy} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-2">
            <input name="venueName" placeholder="Nom de la salle *" required />
            <input name="source" placeholder="Sources (site, rapport, presse…)" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {VENUE_STUDY_FIELDS.map((f) => (
              <div key={f}>
                <label>{f}</label>
                <input name={f} placeholder={f} />
              </div>
            ))}
          </div>
          <button className="bg-spot text-stage-950 rounded-lg px-4 py-2 text-sm font-medium">Enregistrer l'étude</button>
        </form>
      </Collapsible>

      {/* Contenu par section */}
      <div className="mt-4 space-y-4">
        {items.length === 0 && <Card className="p-6"><p className="text-sm muted text-center">Votre portfolio est vide. Ajoutez vos premières preuves ci-dessus.</p></Card>}
        {Array.from(bySection.entries()).map(([section, list]) => (
          <Card key={section} className="p-4">
            <SectionTitle>{section}</SectionTitle>
            <div className="grid md:grid-cols-2 gap-3">
              {list.map((it) => {
                const venueData = it.kind === "venue_study" ? parseJson<Record<string, string>>(it.data, {}) : {};
                return (
                  <Collapsible key={it.id} title={it.title} sub={it.content?.slice(0, 70) || undefined}>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge tone={STATUS_TONE[it.status] || "neutral"}>{it.status}</Badge>
                      {it.evidence && <a href={it.evidence} target="_blank" rel="noopener noreferrer" className="text-xs text-sceneblue hover:underline">preuve ↗</a>}
                    </div>
                    {it.content && <p className="text-sm whitespace-pre-line mb-2">{it.content}</p>}
                    {Object.keys(venueData).length > 0 && (
                      <div className="grid sm:grid-cols-2 gap-1 mb-2">
                        {Object.entries(venueData).map(([k, v]) => (
                          <div key={k} className="text-xs"><span className="muted">{k} :</span> {v}</div>
                        ))}
                      </div>
                    )}
                    <form action={updatePortfolioItem.bind(null, it.id)} className="grid sm:grid-cols-2 gap-2 mt-2">
                      <input name="title" defaultValue={it.title} className="sm:col-span-2" />
                      <textarea name="content" rows={2} defaultValue={it.content || ""} className="sm:col-span-2" />
                      <select name="status" defaultValue={it.status}>
                        <option value="acquis">Acquis</option>
                        <option value="en cours">En cours</option>
                        <option value="objectif">Objectif</option>
                      </select>
                      <input name="evidence" defaultValue={it.evidence || ""} placeholder="Preuve" />
                      <button className="panel-2 rounded-lg py-1.5 text-xs font-medium">Enregistrer</button>
                      <div />
                    </form>
                    <form action={deletePortfolioItem.bind(null, it.id)} className="mt-1">
                      <button className="text-xs muted hover:text-red-400">supprimer</button>
                    </form>
                  </Collapsible>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
