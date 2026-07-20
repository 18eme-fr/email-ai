import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/json";
import { TopBar } from "@/components/topbar";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { Collapsible } from "@/components/collapsible";
import { updateProfile, addExperience, removeExperience, deleteAccount } from "@/app/actions/profile";

export default async function SettingsPage() {
  const user = (await getCurrentUser())!;
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });

  const languages = parseJson<{ label?: string; level?: string }[]>(profile?.languages, []);
  const degrees = parseJson<{ title?: string; year?: number }[]>(profile?.degrees, []);
  const skills = parseJson<{ name: string; level: string }[]>(profile?.skills, []);
  const experiences = parseJson<any[]>(profile?.experiences, []);
  const preferred = parseJson<string[]>(profile?.preferredCountries, []);
  const excluded = parseJson<string[]>(profile?.excludedCountries, []);
  const contracts = parseJson<string[]>(profile?.acceptedContracts, []);

  return (
    <div>
      <TopBar title="Profil & paramètres" subtitle="Vos infos pilotent les recommandations et les scores" accent="#9c96b3" />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <SectionTitle sub="Chaque modification recalcule automatiquement scores et recommandations.">Profil détaillé</SectionTitle>
            <form action={updateProfile} className="grid sm:grid-cols-2 gap-3">
              <div><label>Nom complet</label><input name="fullName" defaultValue={profile?.fullName || ""} /></div>
              <div><label>Nationalité</label><input name="nationality" defaultValue={profile?.nationality || ""} /></div>
              <div><label>Âge</label><input name="age" type="number" defaultValue={profile?.age ?? ""} /></div>
              <div><label>Pays de résidence</label><input name="countryResidence" defaultValue={profile?.countryResidence || ""} /></div>
              <div>
                <label>Mobilité</label>
                <select name="mobility" defaultValue={profile?.mobility || "Europe"}>
                  <option>Locale</option><option>France</option><option>Europe</option><option>International</option>
                </select>
              </div>
              <div><label>Durée souhaitée</label><input name="durationWish" defaultValue={profile?.durationWish || ""} placeholder="ex: 3 à 6 mois" /></div>
              <div><label>Disponibilité</label><input name="availability" defaultValue={profile?.availability || ""} placeholder="ex: septembre 2026" /></div>
              <div><label>Rémunération minimale (€/mois)</label><input name="minSalary" type="number" defaultValue={profile?.minSalary ?? ""} /></div>
              <div><label>Budget disponible (€)</label><input name="budget" type="number" defaultValue={profile?.budget ?? ""} /></div>
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" name="drivingLicense" className="w-auto" defaultChecked={profile?.drivingLicense} /> Permis</label>
                <label className="flex items-center gap-2"><input type="checkbox" name="wantsHousing" className="w-auto" defaultChecked={profile?.wantsHousing} /> Souhaite logement</label>
              </div>
              <div className="sm:col-span-2"><label>Projet professionnel</label><textarea name="professionalProject" rows={2} defaultValue={profile?.professionalProject || ""} /></div>

              <div className="sm:col-span-2"><label>Langues (une par ligne : « Français - B2 »)</label>
                <textarea name="languages" rows={3} defaultValue={languages.map((l) => `${l.label || ""}${l.level ? ` - ${l.level}` : ""}`).join("\n")} />
              </div>
              <div className="sm:col-span-2"><label>Diplômes (un par ligne : « Licence de Psychologie (2025) »)</label>
                <textarea name="degrees" rows={2} defaultValue={degrees.map((d) => `${d.title || ""}${d.year ? ` (${d.year})` : ""}`).join("\n")} />
              </div>
              <div className="sm:col-span-2"><label>Compétences (une par ligne : « Budget prévisionnel - objectif »)</label>
                <textarea name="skills" rows={3} defaultValue={skills.map((s) => `${s.name}${s.level ? ` - ${s.level}` : ""}`).join("\n")} />
              </div>
              <div><label>Pays préférés (séparés par des virgules)</label><input name="preferredCountries" defaultValue={preferred.join(", ")} /></div>
              <div><label>Pays refusés</label><input name="excludedCountries" defaultValue={excluded.join(", ")} /></div>
              <div className="sm:col-span-2"><label>Types de contrats acceptés</label><input name="acceptedContracts" defaultValue={contracts.join(", ")} /></div>

              <button className="sm:col-span-2 bg-spot text-stage-950 rounded-lg py-2.5 text-sm font-medium">Enregistrer le profil</button>
            </form>
          </Card>

          {/* Expériences structurées */}
          <Card className="p-5">
            <SectionTitle sub="Les mois + le type + « admin » alimentent directement le score de préparation.">Expériences</SectionTitle>
            <div className="space-y-2 mb-3">
              {experiences.map((e, i) => (
                <div key={i} className="panel-2 rounded-lg p-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{e.title} {e.org ? <span className="muted">· {e.org}</span> : null}</div>
                    <div className="text-xs muted">{e.months || 0} mois · {e.kind} · {e.nature} {e.admin ? "· admin" : ""}</div>
                  </div>
                  <form action={removeExperience.bind(null, i)}>
                    <button className="text-xs muted hover:text-red-400">✕</button>
                  </form>
                </div>
              ))}
              {experiences.length === 0 && <p className="text-sm muted">Aucune expérience enregistrée.</p>}
            </div>
            <form action={addExperience} className="grid sm:grid-cols-2 gap-2">
              <input name="title" placeholder="Intitulé *" required />
              <input name="org" placeholder="Structure" />
              <select name="kind" defaultValue="culture">
                <option value="culture">Culture / spectacle vivant</option>
                <option value="social">Social / institutionnel</option>
                <option value="autre">Autre</option>
              </select>
              <select name="nature" defaultValue="exercée">
                <option value="exercée">Exercée</option>
                <option value="observée">Observée</option>
              </select>
              <input name="months" type="number" placeholder="Durée (mois)" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="admin" className="w-auto" /> Dimension administrative</label>
              <input name="description" className="sm:col-span-2" placeholder="Description factuelle" />
              <button className="sm:col-span-2 panel-2 rounded-lg py-2 text-sm font-medium">＋ Ajouter l'expérience</button>
            </form>
          </Card>
        </div>

        {/* Colonne latérale : intégrations + RGPD */}
        <div className="space-y-4">
          <Card className="p-4">
            <SectionTitle sub="Prévu par l'architecture — à activer plus tard.">Connecteurs (à venir)</SectionTitle>
            <ul className="space-y-2">
              {["Google Drive", "Google Calendar", "Gmail", "Google Sheets", "Notion", "Extension navigateur", "Application mobile"].map((c) => (
                <li key={c} className="flex items-center justify-between panel-2 rounded-lg px-3 py-2 text-sm">
                  <span>{c}</span><Badge tone="neutral">bientôt</Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4">
            <SectionTitle>Compte</SectionTitle>
            <p className="text-sm muted mb-1">{user.email}</p>
            <Collapsible title="Confidentialité (RGPD)" sub="Vos droits sur vos données.">
              <p className="text-xs muted mb-3">
                Vos données restent privées. Aucun mot de passe externe n'est stocké. Vous pouvez supprimer votre compte
                et toutes vos données à tout moment (suppression en cascade, irréversible).
              </p>
              <form action={deleteAccount}>
                <button className="text-sm bg-curtain text-white rounded-lg px-3 py-2 font-medium hover:bg-curtain-light">
                  Supprimer mon compte et mes données
                </button>
              </form>
            </Collapsible>
          </Card>
        </div>
      </div>
    </div>
  );
}
