"use client";
import { useMemo, useState } from "react";
import { OpportunityCard, type OppView } from "./opportunity-card";
import { WorldMap, type MapPoint } from "./world-map";

export function OpportunitiesExplorer({ opportunities }: { opportunities: OppView[] }) {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [type, setType] = useState("");
  const [contract, setContract] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [onlySaved, setOnlySaved] = useState(false);

  const countries = useMemo(() => Array.from(new Set(opportunities.map((o) => o.country))).sort(), [opportunities]);
  const types = useMemo(() => Array.from(new Set(opportunities.map((o) => o.structureType))).sort(), [opportunities]);
  const contracts = useMemo(() => Array.from(new Set(opportunities.map((o) => o.contractType).filter(Boolean))) as string[], [opportunities]);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return opportunities
      .filter((o) => {
        if (onlySaved && !o.saved) return false;
        if (country && o.country !== country) return false;
        if (type && o.structureType !== type) return false;
        if (contract && o.contractType !== contract) return false;
        if (o.compat.score < minScore) return false;
        if (needle) {
          const hay = `${o.missionTitle} ${o.structureName} ${o.city} ${o.country} ${o.structureType}`.toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        return true;
      })
      .sort((a, b) => b.compat.score - a.compat.score);
  }, [opportunities, q, country, type, contract, minScore, onlySaved]);

  const points: MapPoint[] = filtered
    .filter((o) => o.lat != null && o.lng != null)
    .map((o) => ({
      id: o.id,
      lat: o.lat as number,
      lng: o.lng as number,
      label: o.missionTitle,
      sublabel: `${o.structureName} · ${o.country}`,
      score: o.compat.score,
    }));

  return (
    <div>
      <div className="panel rounded-xl p-4 mb-4">
        <WorldMap points={points} />
      </div>

      <div className="panel rounded-xl p-4 mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label>Recherche</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Poste, structure, ville…" />
        </div>
        <div>
          <label>Pays</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">Tous</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label>Type de structure</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Tous</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label>Type de contrat</label>
          <select value={contract} onChange={(e) => setContract(e.target.value)}>
            <option value="">Tous</option>
            {contracts.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label>Compatibilité min : {minScore}</label>
          <input type="range" min={0} max={100} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-auto" checked={onlySaved} onChange={(e) => setOnlySaved(e.target.checked)} />
            <span>Sauvegardées seulement</span>
          </label>
        </div>
        <div className="flex items-end justify-end text-sm muted">{filtered.length} résultat(s)</div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((o) => (
          <OpportunityCard key={o.id} opp={o} />
        ))}
        {filtered.length === 0 && <p className="muted text-sm">Aucune opportunité ne correspond à ces filtres.</p>}
      </div>
    </div>
  );
}
