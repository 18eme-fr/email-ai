"use client";
import { useState } from "react";
import { saveOpportunity, unsaveOpportunity, updateSaved } from "@/app/actions/opportunities";
import { SAVED_STATUSES } from "@/lib/reference";

export type OppView = {
  id: string;
  structureName: string;
  country: string;
  city: string | null;
  structureType: string;
  missionTitle: string;
  duration: string | null;
  startDate: string | null;
  deadline: string | null;
  contractType: string | null;
  compensation: string | null;
  housingProvided: boolean | null;
  mealsOrTransport: string | null;
  languagesRequired: string[];
  experienceLevel: string | null;
  degreeRequired: string | null;
  visaRequired: boolean | null;
  eligibleFrench: boolean | null;
  adminTasks: string[];
  officialLink: string | null;
  lastChecked: string | null;
  source: string | null;
  reliability: string | null;
  lat: number | null;
  lng: number | null;
  isDemo: boolean;
  compat: { score: number; strengths: string[]; weaknesses: string[] };
  saved: null | {
    id: string;
    status: string;
    category: string | null;
    note: string | null;
    followUpDate: string | null;
    contactName: string | null;
    contactEmail: string | null;
    appliedAt: string | null;
    responseStatus: string | null;
  };
};

function scoreColor(s: number) {
  return s >= 75 ? "#34d399" : s >= 55 ? "#e9b949" : "#ef4444";
}

export function OpportunityCard({ opp }: { opp: OppView }) {
  const [open, setOpen] = useState(false);
  const [tracking, setTracking] = useState(false);
  const c = opp.compat;

  return (
    <div className="panel rounded-xl p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold truncate">{opp.missionTitle}</h3>
            {opp.isDemo && <span className="text-[10px] rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 px-1.5 py-0.5">démo</span>}
          </div>
          <div className="text-sm muted truncate">
            {opp.structureName} · {opp.structureType}
          </div>
          <div className="text-xs muted mt-0.5">
            📍 {opp.city ? `${opp.city}, ` : ""}{opp.country} · {opp.contractType || "—"} · {opp.duration || "durée n.c."}
          </div>
        </div>
        <div className="text-center shrink-0">
          <div className="text-2xl font-bold" style={{ color: scoreColor(c.score) }}>{c.score}</div>
          <div className="text-[10px] muted">compat.</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {opp.adminTasks.slice(0, 4).map((t) => (
          <span key={t} className="text-[11px] rounded-full panel-2 px-2 py-0.5">{t}</span>
        ))}
        {opp.housingProvided && <span className="text-[11px] rounded-full bg-emerald-500/15 text-emerald-300 px-2 py-0.5">🏠 logement</span>}
        {opp.visaRequired && <span className="text-[11px] rounded-full bg-red-500/15 text-red-300 px-2 py-0.5">visa</span>}
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <button onClick={() => setOpen((o) => !o)} className="text-xs text-spot hover:underline">
          {open ? "Masquer" : "Pourquoi ce score ?"}
        </button>
        {opp.officialLink && (
          <a href={opp.officialLink} target="_blank" rel="noopener noreferrer" className="text-xs text-sceneblue hover:underline">
            Lien officiel ↗
          </a>
        )}
        <span className="text-[11px] muted ml-auto">
          Source : {opp.source || "—"} · fiabilité {opp.reliability || "?"} · vérifié {opp.lastChecked || "?"}
        </span>
      </div>

      {open && (
        <div className="grid sm:grid-cols-2 gap-3 mt-3 panel-2 rounded-lg p-3">
          <div>
            <div className="text-xs font-medium text-emerald-300 mb-1">Points forts</div>
            <ul className="space-y-0.5">
              {c.strengths.length ? c.strengths.map((s, i) => <li key={i} className="text-xs muted">• {s}</li>) : <li className="text-xs muted">—</li>}
            </ul>
          </div>
          <div>
            <div className="text-xs font-medium text-amber-300 mb-1">Points faibles</div>
            <ul className="space-y-0.5">
              {c.weaknesses.length ? c.weaknesses.map((s, i) => <li key={i} className="text-xs muted">• {s}</li>) : <li className="text-xs muted">—</li>}
            </ul>
          </div>
          <div className="sm:col-span-2 text-[11px] muted">
            Langues : {opp.languagesRequired.join(", ") || "—"} · Niveau : {opp.experienceLevel || "—"} · Diplôme : {opp.degreeRequired || "—"} · Éligible FR : {opp.eligibleFrench === false ? "à vérifier" : "oui"}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3">
        {opp.saved ? (
          <>
            <form action={unsaveOpportunity.bind(null, opp.id)}>
              <button className="text-xs panel-2 rounded-lg px-3 py-1.5 hover:border-red-500/40">Retirer</button>
            </form>
            <button onClick={() => setTracking((t) => !t)} className="text-xs bg-spot text-stage-950 rounded-lg px-3 py-1.5 font-medium">
              {tracking ? "Fermer le suivi" : `Suivi : ${SAVED_STATUSES.find((s) => s.key === opp.saved!.status)?.label}`}
            </button>
          </>
        ) : (
          <form action={saveOpportunity.bind(null, opp.id)}>
            <button className="text-xs bg-spot text-stage-950 rounded-lg px-3 py-1.5 font-medium">＋ Sauvegarder</button>
          </form>
        )}
      </div>

      {tracking && opp.saved && (
        <form action={updateSaved.bind(null, opp.saved.id)} className="mt-3 panel-2 rounded-lg p-3 grid sm:grid-cols-2 gap-3">
          <div>
            <label>Statut</label>
            <select name="status" defaultValue={opp.saved.status}>
              {SAVED_STATUSES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Catégorie / dossier</label>
            <input name="category" defaultValue={opp.saved.category || ""} placeholder="ex: Prioritaire" />
          </div>
          <div>
            <label>Date de candidature</label>
            <input name="appliedAt" type="date" defaultValue={opp.saved.appliedAt || ""} />
          </div>
          <div>
            <label>Réponse reçue</label>
            <input name="responseStatus" defaultValue={opp.saved.responseStatus || ""} placeholder="ex: Entretien le 12/05" />
          </div>
          <div>
            <label>Relance prévue</label>
            <input name="followUpDate" type="date" defaultValue={opp.saved.followUpDate || ""} />
          </div>
          <div>
            <label>Contact</label>
            <input name="contactName" defaultValue={opp.saved.contactName || ""} placeholder="Nom du contact" />
          </div>
          <div className="sm:col-span-2">
            <label>Email du contact</label>
            <input name="contactEmail" type="email" defaultValue={opp.saved.contactEmail || ""} />
          </div>
          <div className="sm:col-span-2">
            <label>Note</label>
            <textarea name="note" rows={2} defaultValue={opp.saved.note || ""} />
          </div>
          <div className="sm:col-span-2">
            <button className="bg-spot text-stage-950 rounded-lg px-3 py-2 text-sm font-medium">Enregistrer le suivi</button>
          </div>
        </form>
      )}
    </div>
  );
}
