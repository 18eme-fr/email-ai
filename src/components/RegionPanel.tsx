'use client';

import { useMemo } from 'react';
import { getRegion, getAncestry } from '@/data/regions';
import { GRAPE_BY_ID } from '@/data/grapes';
import { drawableChildren, bboxOf } from '@/lib/atlas';
import { LEVEL_LABELS, WINE_STYLE_LABELS, type RegionGrape } from '@/lib/types';
import { NR, formatHectares, VINTAGE_COLORS } from '@/lib/format';
import { useAtlas } from '@/state/store';
import { Chip, EmptyHint, Field, ScaleBar, SectionTitle } from './primitives';

const ROLE_LABEL: Record<RegionGrape['role'], string> = {
  principal: 'principal',
  secondaire: 'secondaire',
  autochtone: 'autochtone',
};

function formatCoords(id: string): string {
  const b = bboxOf(id);
  if (!b) return NR;
  const lng = (b[0] + b[2]) / 2;
  const lat = (b[1] + b[3]) / 2;
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'O';
  return `${Math.abs(lat).toFixed(2)}° ${ns}, ${Math.abs(lng).toFixed(2)}° ${ew}`;
}

export default function RegionPanel() {
  const selectedId = useAtlas((s) => s.selectedId);
  const select = useAtlas((s) => s.select);
  const selectAndFocus = useAtlas((s) => s.selectAndFocus);
  const setGrapeExplorer = useAtlas((s) => s.setGrapeExplorer);
  const grapeExplorer = useAtlas((s) => s.grapeExplorer);
  const toggleCompare = useAtlas((s) => s.toggleCompare);
  const compare = useAtlas((s) => s.compare);
  const toggleFavorite = useAtlas((s) => s.toggleFavorite);
  const favorites = useAtlas((s) => s.favorites);

  const region = selectedId ? getRegion(selectedId) : undefined;
  const ancestry = useMemo(() => (selectedId ? getAncestry(selectedId) : []), [selectedId]);
  const children = useMemo(() => (selectedId ? drawableChildren(selectedId) : []), [selectedId]);

  if (!selectedId || !region) return null;

  const isFav = favorites.includes(region.id);
  const inCompare = compare.includes(region.id);

  const redGrapes = region.grapes.filter((g) => GRAPE_BY_ID.get(g.grapeId)?.color === 'rouge');
  const whiteGrapes = region.grapes.filter((g) => GRAPE_BY_ID.get(g.grapeId)?.color === 'blanc');

  const t = region.tasting;
  const hasTasting =
    [t.acidity, t.tannins, t.body, t.alcohol, t.sweetness, t.aromaticIntensity, t.ageingPotential].some(
      (v) => v !== null,
    ) || t.aromas.length > 0;

  return (
    <aside className="pointer-events-auto absolute right-0 top-0 z-20 flex h-full w-full max-w-full flex-col bg-paper-card/95 shadow-panel backdrop-blur-sm sm:w-[420px] sm:max-w-[92vw]">
      {/* En-tête */}
      <header className="animate-panel-in border-b border-line bg-gradient-to-b from-paper-card to-paper-card/60 px-5 pb-4 pt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <nav className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-ink-muted">
            {ancestry.slice(0, -1).map((a) => (
              <span key={a.id} className="flex items-center gap-1.5">
                <button
                  onClick={() => selectAndFocus(a.id)}
                  className="transition-colors hover:text-accent hover:underline"
                >
                  {a.name}
                </button>
                <span className="text-line">›</span>
              </span>
            ))}
          </nav>
          <button
            onClick={() => select(null)}
            aria-label="Fermer la fiche"
            className="-mr-1 rounded-full p-1.5 text-ink-muted transition-colors hover:bg-paper-soft hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <h2 className="font-serif text-2xl font-medium leading-tight text-ink">{region.name}</h2>
        <div className="mt-1 flex items-center gap-2 text-xs text-ink-muted">
          <span className="rounded bg-accent-faint px-1.5 py-0.5 font-medium text-accent">
            {LEVEL_LABELS[region.level]}
          </span>
          <span>{region.country}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => toggleFavorite(region.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
              isFav ? 'border-gold bg-gold/10 text-[#8a6a24]' : 'border-line text-ink-soft hover:border-ink-muted'
            }`}
          >
            <span aria-hidden>{isFav ? '★' : '☆'}</span>
            {isFav ? 'Favori' : 'Ajouter aux favoris'}
          </button>
          <button
            onClick={() => toggleCompare(region.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
              inCompare ? 'border-accent bg-accent-faint text-accent' : 'border-line text-ink-soft hover:border-ink-muted'
            }`}
          >
            ⇄ {inCompare ? 'Dans le comparateur' : 'Comparer'}
          </button>
        </div>
      </header>

      {/* Corps défilant */}
      <div className="thin-scroll flex-1 overflow-y-auto px-5 py-4">
        {region.description && (
          <p className="mb-5 text-[13.5px] leading-relaxed text-ink-soft">{region.description}</p>
        )}

        {/* Informations générales */}
        <section className="mb-6">
          <SectionTitle>Informations générales</SectionTitle>
          <Field label="Pays" value={region.country} />
          <Field label="Région administrative" value={region.adminRegion} />
          <Field label="Type de zone" value={LEVEL_LABELS[region.level]} />
          <Field
            label="Zone parente"
            value={ancestry.length > 1 ? ancestry[ancestry.length - 2].name : null}
          />
          <Field label="Superficie viticole" value={formatHectares(region.keyFacts.vineyardAreaHa)} />
          <Field label="Production annuelle" value={region.keyFacts.annualProduction} />
          <Field label="Domaines / producteurs" value={region.keyFacts.producerCount} />
          <Field label="Altitude" value={region.keyFacts.altitude} />
          <Field label="Localisation (centroïde)" value={formatCoords(region.id)} />
        </section>

        {/* Terroir */}
        <section className="mb-6">
          <SectionTitle>Terroir</SectionTitle>
          <Field label="Climat" value={region.climate.type} />
          <Field label="Températures" value={region.climate.temperatures} />
          <Field label="Pluviométrie" value={region.climate.rainfall} />
          <Field label="Relief" value={region.relief} />
          <Field label="Géologie" value={region.geology} />
          {region.climate.influences.length > 0 && (
            <div className="mt-2">
              <p className="mb-1.5 text-xs text-ink-muted">Influences</p>
              <div className="flex flex-wrap gap-1.5">
                {region.climate.influences.map((i) => (
                  <Chip key={i}>{i}</Chip>
                ))}
              </div>
            </div>
          )}
          <div className="mt-3">
            <p className="mb-1.5 text-xs text-ink-muted">Types de sols</p>
            {region.soils.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {region.soils.map((s) => (
                  <Chip key={s}>{s}</Chip>
                ))}
              </div>
            ) : (
              <EmptyHint>{NR}</EmptyHint>
            )}
          </div>
        </section>

        {/* Cépages */}
        <section className="mb-6">
          <SectionTitle>Cépages</SectionTitle>
          {region.grapes.length === 0 ? (
            <EmptyHint>{NR}</EmptyHint>
          ) : (
            <div className="space-y-4">
              <GrapeColumn
                title="Cépages rouges"
                grapes={redGrapes}
                active={grapeExplorer}
                onExplore={setGrapeExplorer}
              />
              <GrapeColumn
                title="Cépages blancs"
                grapes={whiteGrapes}
                active={grapeExplorer}
                onExplore={setGrapeExplorer}
              />
              <p className="text-[11px] italic text-ink-muted/70">
                Cliquez un cépage pour le localiser sur la carte. Les parts, lorsqu’indiquées, sont
                approximatives.
              </p>
            </div>
          )}
        </section>

        {/* Types de vins */}
        <section className="mb-6">
          <SectionTitle>Types de vins</SectionTitle>
          {region.wineStyles.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {region.wineStyles.map((s) => (
                <Chip key={s} tone="accent">
                  {WINE_STYLE_LABELS[s]}
                </Chip>
              ))}
            </div>
          ) : (
            <EmptyHint>{NR}</EmptyHint>
          )}
        </section>

        {/* Profil gustatif */}
        <section className="mb-6">
          <SectionTitle>Profil gustatif (indicatif)</SectionTitle>
          {hasTasting ? (
            <>
              <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                <ScaleBar label="Acidité" value={t.acidity} />
                <ScaleBar label="Tanins" value={t.tannins} />
                <ScaleBar label="Corps" value={t.body} />
                <ScaleBar label="Alcool" value={t.alcohol} />
                <ScaleBar label="Sucrosité" value={t.sweetness} />
                <ScaleBar label="Intensité aromatique" value={t.aromaticIntensity} />
                <ScaleBar label="Potentiel de garde" value={t.ageingPotential} />
              </div>
              {t.aromas.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1.5 text-xs text-ink-muted">Arômes typiques</p>
                  <div className="flex flex-wrap gap-1.5">
                    {t.aromas.map((a) => (
                      <Chip key={a} tone="gold">
                        {a}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyHint>{NR}</EmptyHint>
          )}
        </section>

        {/* Viticulture & Vinification */}
        {(region.viticulture.notes ||
          region.viticulture.yield ||
          region.viticulture.harvest ||
          region.viticulture.irrigation ||
          region.viticulture.plantingDensity ||
          region.viticulture.organic) && (
          <section className="mb-6">
            <SectionTitle>Viticulture</SectionTitle>
            <Field label="Densité de plantation" value={region.viticulture.plantingDensity} />
            <Field label="Rendement" value={region.viticulture.yield} />
            <Field label="Vendanges" value={region.viticulture.harvest} />
            <Field label="Irrigation" value={region.viticulture.irrigation} />
            <Field label="Agriculture bio / biodynamie" value={region.viticulture.organic} />
            {region.viticulture.notes && (
              <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{region.viticulture.notes}</p>
            )}
          </section>
        )}

        {(region.vinification.ageing.length > 0 ||
          region.vinification.ageingDuration ||
          region.vinification.malolactic ||
          region.vinification.maceration ||
          region.vinification.notes) && (
          <section className="mb-6">
            <SectionTitle>Vinification &amp; élevage</SectionTitle>
            {region.vinification.ageing.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {region.vinification.ageing.map((a) => (
                  <Chip key={a}>{a}</Chip>
                ))}
              </div>
            )}
            <Field label="Durée d’élevage" value={region.vinification.ageingDuration} />
            <Field label="Fermentation malolactique" value={region.vinification.malolactic} />
            <Field label="Macération" value={region.vinification.maceration} />
            {region.vinification.notes && (
              <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{region.vinification.notes}</p>
            )}
          </section>
        )}

        {/* Appellations / zones enfants */}
        {children.length > 0 && (
          <section className="mb-6">
            <SectionTitle>Zones &amp; appellations</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {children.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectAndFocus(c.id)}
                  className="rounded-full border border-line bg-paper px-2.5 py-1 text-xs text-ink-soft transition-colors hover:border-accent hover:bg-accent-faint hover:text-accent"
                >
                  {c.name} ↗
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Producteurs emblématiques */}
        <section className="mb-6">
          <SectionTitle>Domaines emblématiques</SectionTitle>
          {region.producers.length > 0 ? (
            <ul className="space-y-1.5">
              {region.producers.map((p) => (
                <li key={p.name} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-ink">{p.name}</span>
                  {p.note && <span className="text-right text-[11px] text-ink-muted">{p.note}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint>Section encyclopédique — {NR} pour cette zone.</EmptyHint>
          )}
        </section>

        {/* Millésimes */}
        {region.vintages.length > 0 && (
          <section className="mb-6">
            <SectionTitle>Millésimes récents</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {region.vintages.map((v) => (
                <div
                  key={v.year}
                  className="flex items-center gap-2 rounded-lg border border-line bg-paper px-2.5 py-1.5"
                >
                  <span className="font-serif text-sm font-medium text-ink">{v.year}</span>
                  <span
                    className="text-[11px] font-medium capitalize"
                    style={{ color: VINTAGE_COLORS[v.rating] ?? '#5b616e' }}
                  >
                    {v.rating}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Accords mets & vins */}
        {region.foodPairings.length > 0 && (
          <section className="mb-6">
            <SectionTitle>Accords mets &amp; vins</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {region.foodPairings.map((f) => (
                <Chip key={f}>{f}</Chip>
              ))}
            </div>
          </section>
        )}

        {/* Traçabilité */}
        <footer className="mt-2 border-t border-line pt-3 text-[11px] leading-relaxed text-ink-muted">
          <p>
            <span className="font-medium">Source :</span> {region.source ?? NR}
            {region.lastVerified && <> · vérifié {region.lastVerified}</>}
          </p>
          <p className="mt-1 italic">
            Tracé cartographique indicatif (MVP) — à remplacer par le parcellaire officiel.
          </p>
        </footer>
      </div>
    </aside>
  );
}

function GrapeColumn({
  title,
  grapes,
  active,
  onExplore,
}: {
  title: string;
  grapes: RegionGrape[];
  active: string | null;
  onExplore: (id: string | null) => void;
}) {
  if (grapes.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs text-ink-muted">{title}</p>
      <ul className="space-y-2">
        {grapes.map((g) => {
          const meta = GRAPE_BY_ID.get(g.grapeId);
          const isActive = active === g.grapeId;
          return (
            <li key={g.grapeId}>
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => onExplore(isActive ? null : g.grapeId)}
                  className={`text-left text-sm transition-colors hover:text-accent ${
                    isActive ? 'font-medium text-accent' : 'text-ink'
                  }`}
                  title="Explorer ce cépage sur la carte"
                >
                  {meta?.name ?? g.grapeId}
                  <span className="ml-1.5 text-[10px] uppercase tracking-wide text-ink-muted">
                    {ROLE_LABEL[g.role]}
                  </span>
                </button>
                {g.share !== null && <span className="text-xs text-ink-muted">≈ {g.share} %</span>}
              </div>
              {g.share !== null && (
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-paper-soft">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${g.share}%`,
                      background: meta?.color === 'rouge' ? '#7a2338' : '#b08a3e',
                    }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
