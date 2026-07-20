import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/json";
import { computeCompatibility, ProfileForScore } from "@/lib/scoring";
import { TopBar } from "@/components/topbar";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { OpportunitiesExplorer } from "@/components/opportunities-explorer";
import { OppView } from "@/components/opportunity-card";
import { Collapsible } from "@/components/collapsible";
import {
  addManualOpportunity, importOpportunitiesCsv, createSearchQuery, deleteSearchQuery, addSource,
} from "@/app/actions/opportunities";
import { STRUCTURE_TYPES, OPPORTUNITY_TYPES, JOB_KEYWORDS, SEARCH_LANGUAGES } from "@/lib/reference";

export default async function OpportunitiesPage() {
  const user = (await getCurrentUser())!;
  const [profile, opps, saved, searches, sources] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: user.id } }),
    prisma.opportunity.findMany({ where: { OR: [{ isDemo: true }, { ownerId: user.id }] }, orderBy: { createdAt: "desc" } }),
    prisma.savedOpportunity.findMany({ where: { userId: user.id } }),
    prisma.searchQuery.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.source.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  const profileScore: ProfileForScore = {
    languages: parseJson(profile?.languages, []),
    preferredCountries: parseJson(profile?.preferredCountries, []),
    excludedCountries: parseJson(profile?.excludedCountries, []),
    acceptedContracts: parseJson(profile?.acceptedContracts, []),
    mobility: profile?.mobility,
    wantsHousing: profile?.wantsHousing,
  };
  const savedMap = new Map(saved.map((s) => [s.opportunityId, s]));

  const views: OppView[] = opps.map((o) => {
    const languagesRequired = parseJson<string[]>(o.languagesRequired, []);
    const adminTasks = parseJson<string[]>(o.adminTasks, []);
    const compat = computeCompatibility(
      {
        structureType: o.structureType,
        missionTitle: o.missionTitle,
        adminTasks,
        experienceLevel: o.experienceLevel,
        languagesRequired,
        visaRequired: o.visaRequired,
        eligibleFrench: o.eligibleFrench,
        duration: o.duration,
        compensation: o.compensation,
        housingProvided: o.housingProvided,
        country: o.country,
      },
      profileScore
    );
    const s = savedMap.get(o.id);
    return {
      id: o.id,
      structureName: o.structureName,
      country: o.country,
      city: o.city,
      structureType: o.structureType,
      missionTitle: o.missionTitle,
      duration: o.duration,
      startDate: o.startDate,
      deadline: o.deadline,
      contractType: o.contractType,
      compensation: o.compensation,
      housingProvided: o.housingProvided,
      mealsOrTransport: o.mealsOrTransport,
      languagesRequired,
      experienceLevel: o.experienceLevel,
      degreeRequired: o.degreeRequired,
      visaRequired: o.visaRequired,
      eligibleFrench: o.eligibleFrench,
      adminTasks,
      officialLink: o.officialLink,
      lastChecked: o.lastChecked,
      source: o.source,
      reliability: o.reliability,
      lat: o.lat,
      lng: o.lng,
      isDemo: o.isDemo,
      compat: { score: compat.score, strengths: compat.strengths, weaknesses: compat.weaknesses },
      saved: s
        ? {
            id: s.id, status: s.status, category: s.category, note: s.note, followUpDate: s.followUpDate,
            contactName: s.contactName, contactEmail: s.contactEmail, appliedAt: s.appliedAt, responseStatus: s.responseStatus,
          }
        : null,
    };
  });

  return (
    <div>
      <TopBar
        title="Expériences & opportunités"
        subtitle="Moteur de recherche du spectacle vivant — score de compatibilité expliqué"
        accent="#3a7bd5"
      />

      <OpportunitiesExplorer opportunities={views} />

      {/* Outils : recherches, sources, ajout manuel, CSV */}
      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <Collapsible title="Mes recherches automatiques" sub="Alertes quotidiennes ou hebdomadaires (exécutées par les automatisations)." defaultOpen>
          <ul className="space-y-2 mb-3">
            {searches.length === 0 && <li className="text-sm muted">Aucune recherche enregistrée.</li>}
            {searches.map((s) => (
              <li key={s.id} className="panel-2 rounded-lg p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{s.name}</div>
                  <div className="text-xs muted truncate">{s.keywords} · {s.frequency === "daily" ? "quotidienne" : "hebdomadaire"}</div>
                </div>
                <form action={deleteSearchQuery.bind(null, s.id)}>
                  <button className="text-xs muted hover:text-red-400">supprimer</button>
                </form>
              </li>
            ))}
          </ul>
          <form action={createSearchQuery} className="grid sm:grid-cols-2 gap-2">
            <input name="name" placeholder="Nom de la recherche" required />
            <select name="frequency" defaultValue="weekly">
              <option value="daily">Alerte quotidienne</option>
              <option value="weekly">Alerte hebdomadaire</option>
            </select>
            <input name="keywords" className="sm:col-span-2" placeholder="Mots-clés (ex: assistant production culture)" />
            <input name="countries" className="sm:col-span-2" placeholder="Pays (ex: France, Belgique, Espagne)" />
            <button className="sm:col-span-2 bg-spot text-stage-950 rounded-lg py-2 text-sm font-medium">Créer la recherche</button>
          </form>
        </Collapsible>

        <Collapsible title="Sources & connecteurs" sub="Ajoutez une source (site, flux RSS, API). Respect des CGU / robots.txt.">
          <ul className="space-y-2 mb-3">
            {sources.map((s) => (
              <li key={s.id} className="panel-2 rounded-lg p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{s.name}</div>
                  <div className="text-xs muted truncate">{s.url} · {s.type}</div>
                </div>
                <Badge tone={s.status === "connected" ? "good" : "warn"}>{s.status}</Badge>
              </li>
            ))}
          </ul>
          <form action={addSource} className="grid sm:grid-cols-2 gap-2">
            <input name="name" placeholder="Nom de la source" required />
            <select name="type" defaultValue="site">
              <option value="site">Site web</option>
              <option value="rss">Flux RSS</option>
              <option value="api">API</option>
              <option value="newsletter">Newsletter</option>
            </select>
            <input name="url" className="sm:col-span-2" placeholder="https://…" />
            <input name="note" className="sm:col-span-2" placeholder="Note (connexion à venir)" />
            <button className="sm:col-span-2 panel-2 rounded-lg py-2 text-sm font-medium">Ajouter la source</button>
          </form>
        </Collapsible>

        <Collapsible title="Ajouter une opportunité manuellement" sub="Interface prête à recevoir une API — saisie manuelle en attendant.">
          <form action={addManualOpportunity} className="grid sm:grid-cols-2 gap-2">
            <input name="structureName" placeholder="Nom de la structure *" required />
            <select name="structureType" defaultValue="Salle de concert">
              {STRUCTURE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <input name="missionTitle" className="sm:col-span-2" placeholder="Intitulé de la mission *" required />
            <input name="country" placeholder="Pays" defaultValue="France" />
            <input name="city" placeholder="Ville" />
            <select name="contractType" defaultValue="Stage">
              {OPPORTUNITY_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <input name="duration" placeholder="Durée (ex: 6 mois)" />
            <input name="startDate" type="date" />
            <input name="deadline" type="date" />
            <input name="compensation" placeholder="Rémunération" />
            <input name="experienceLevel" placeholder="Niveau (ex: Débutant accepté)" />
            <input name="languagesRequired" placeholder="Langues (ex: Français, Anglais B2)" />
            <input name="adminTasks" placeholder="Missions admin (ex: budget, contrats)" />
            <input name="officialLink" className="sm:col-span-2" placeholder="Lien officiel https://…" />
            <button className="sm:col-span-2 bg-spot text-stage-950 rounded-lg py-2 text-sm font-medium">Ajouter & sauvegarder</button>
          </form>
        </Collapsible>

        <Collapsible title="Import CSV" sub="Colonnes : structureName,country,city,structureType,missionTitle,duration,deadline,contractType,compensation,officialLink">
          <form action={importOpportunitiesCsv} className="space-y-2">
            <textarea
              name="csv"
              rows={5}
              placeholder={"structureName,country,city,structureType,missionTitle,duration,deadline,contractType,compensation,officialLink\nLe Rocher,France,Nantes,SMAC (musiques actuelles),Assistant production,6 mois,2026-09-01,Stage,Gratification,https://exemple.fr"}
            />
            <button className="bg-spot text-stage-950 rounded-lg px-3 py-2 text-sm font-medium">Importer</button>
          </form>
        </Collapsible>
      </div>

      {/* Référentiel de recherche */}
      <Card className="p-5 mt-4">
        <SectionTitle sub="Le moteur cible ces intitulés et leurs équivalents dans 6 langues.">Postes & mots-clés ciblés</SectionTitle>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {JOB_KEYWORDS.map((k) => (
            <span key={k.fr} className="text-xs panel-2 rounded-full px-2 py-1" title={k.en}>{k.fr}</span>
          ))}
        </div>
        <div className="text-xs muted">Langues de recherche : {SEARCH_LANGUAGES.join(" · ")}</div>
      </Card>
    </div>
  );
}
