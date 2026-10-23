import { EDUCATION_LABELS } from '../data/jobs';
import { getRegion, TERRITORY_LABELS } from '../data/regions';
import type { LifeRecord, SimulationRun } from './types';

/**
 * Bilan de vie : synthèse écrite UNIQUEMENT à partir de l'historique de la
 * partie. Pas de note, pas de « vie réussie ou ratée ».
 */

export interface LifeSummary {
  headline: string;
  paragraphs: string[];
  facts: { label: string; value: string }[];
  keyChoices: string[];
  memories: { year: number; age: number; title: string }[];
}

const fmt = (n: number) => n.toLocaleString('fr-FR');

export function summarize(run: SimulationRun): LifeSummary {
  const c = run.citizen;
  const g = (m: string, f: string) => (c.sex === 'F' ? f : m);
  const region = getRegion(c.regionId);
  const age = run.deathAge ?? run.age;
  const origin = run.household.parents.map((p) => p.occupationLabel).join(' et ');
  const p: string[] = [];

  p.push(
    `${c.firstName} ${c.lastName} ${g('est né', 'est née')} en ${c.birthYear} à ${c.birthPlace}, en ${region.name}, dans un foyer où l'on était ${origin}. ` +
      (run.household.percentile < 0.25
        ? 'Les fins de mois y étaient souvent comptées.'
        : run.household.percentile > 0.75
          ? 'L\'argent y était rarement un sujet d\'inquiétude.'
          : 'On y vivait sans luxe, avec des marges modestes.'),
  );

  const edu = run.education;
  const studyLine =
    edu.milestones.length > 0
      ? `Son parcours scolaire l'a mené${g('', 'e')} jusqu'à : ${edu.milestones.join(', ').toLowerCase()}.`
      : `${g('Il', 'Elle')} a quitté l'école sans diplôme du secondaire, ce qui ne dit rien de ce qu'${g('il', 'elle')} savait faire.`;
  p.push(studyLine + (run.flags.etudes_loin !== undefined ? ' Pour étudier, il avait fallu partir loin de chez soi.' : ''));

  const jobs = run.employment.jobs;
  if (jobs.length > 0) {
    const labels = [...new Set(jobs.map((j) => j.label))];
    p.push(
      `${g('Il', 'Elle')} a travaillé comme ${labels.join(', puis ')}.` +
        (run.employment.unemploymentSpells > 0 ? ` Le chômage a interrompu ce parcours ${run.employment.unemploymentSpells === 1 ? 'une fois' : `${run.employment.unemploymentSpells} fois`}.` : '') +
        (run.flags.reconversion !== undefined ? ' Une reconversion a marqué le milieu de sa vie.' : ''),
    );
  } else {
    p.push(`${g('Il', 'Elle')} n'a pas eu d'emploi durable : la vie s'est construite ailleurs.`);
  }

  const partner = run.people.find((x) => x.kind === 'partenaire');
  const kids = run.people.filter((x) => x.kind === 'enfant');
  const friend = run.people.find((x) => x.id === 'meilleur_ami');
  const rel: string[] = [];
  if (partner) rel.push(`${partner.name} a partagé sa vie${run.flags.separe !== undefined ? ' un temps' : ''}`);
  if (kids.length > 0) rel.push(`${kids.length === 1 ? 'un enfant' : `${kids.length} enfants`} (${kids.map((k) => k.name).join(', ')})`);
  if (friend && friend.closeness > 55) rel.push(`l'amitié de ${friend.name}, rencontré${friend.sex === 'F' ? 'e' : ''} à l'école, a traversé les années`);
  p.push(rel.length > 0 ? `Dans sa vie, il y a eu ${rel.join(' ; ')}.` : `${g('Il', 'Elle')} a vécu sans couple ni enfant, entouré${g('', 'e')} d'autres liens.`);

  const civic: string[] = [];
  if (run.civic.memberships.length > 0) civic.push(`engagement dans ${run.civic.memberships.join(', ').toLowerCase()}`);
  if (run.civic.mandates.length > 0) civic.push(`${run.civic.mandates.length} mandat${run.civic.mandates.length > 1 ? 's' : ''} d'élu${g('', 'e')} local${g('', 'e')}`);
  if (run.civic.votesCast + run.civic.abstentions > 0) civic.push(`${run.civic.votesCast} vote${run.civic.votesCast > 1 ? 's' : ''} pour ${run.civic.votesCast + run.civic.abstentions} élections simulées`);
  p.push(civic.length > 0 ? `Vie collective : ${civic.join(', ')}.` : 'La vie collective est restée à distance, ce qui est aussi une manière de vivre.');

  p.push(
    `${g('Il', 'Elle')} s'est ${g('éteint', 'éteinte')} en ${run.deathYear ?? run.year}, à ${age} ans` +
      (run.residences.length > 1 ? `, après avoir vécu à ${run.residences.join(', ')}.` : `, sans avoir jamais vraiment quitté ${run.residences[0]}.`),
  );

  const facts = [
    { label: 'Durée de vie', value: `${age} ans (${c.birthYear}–${run.deathYear ?? run.year})` },
    { label: 'Lieu de naissance', value: `${c.birthPlace}, ${TERRITORY_LABELS[c.territory]}` },
    { label: 'Milieu d\'origine', value: origin },
    { label: 'Diplôme le plus élevé', value: EDUCATION_LABELS[edu.level] },
    { label: 'Dernier métier', value: jobs[jobs.length - 1]?.label ?? '—' },
    { label: 'Épargne finale (estimation de jeu)', value: `${fmt(run.finances.savings)} €${run.finances.debt > 0 ? `, dette ${fmt(run.finances.debt)} €` : ''}` },
    { label: 'Lieux de vie', value: String(run.residences.length) },
    { label: 'Décisions prises', value: String(run.choices.length) },
  ];

  return {
    headline: `${c.firstName} ${c.lastName}, ${c.birthYear}–${run.deathYear ?? run.year}`,
    paragraphs: p,
    facts,
    keyChoices: run.choices.filter((ch) => !ch.automatic).slice(-12).map((ch) => `${ch.age} ans — ${ch.label}`),
    memories: run.timeline.filter((t) => t.memorable).map((t) => ({ year: t.year, age: t.age, title: t.title })),
  };
}

export function toLifeRecord(run: SimulationRun): LifeRecord {
  const c = run.citizen;
  return {
    id: run.id,
    seed: run.seed,
    name: `${c.firstName} ${c.lastName}`,
    sex: c.sex,
    birthYear: c.birthYear,
    deathYear: run.deathYear ?? run.year,
    deathAge: run.deathAge ?? run.age,
    birthPlace: c.birthPlace,
    regionName: getRegion(c.regionId).name,
    territory: c.territory,
    originOccupation: run.household.parents.map((p) => p.occupationLabel).join(' / '),
    originPercentile: run.household.percentile,
    education: run.education.level,
    lastJob: run.employment.jobs[run.employment.jobs.length - 1]?.label ?? '—',
    finalSavings: run.finances.savings - run.finances.debt,
    engagements: run.civic.memberships,
    mandates: run.civic.mandates.length,
    children: run.people.filter((x) => x.kind === 'enfant').length,
    keyMoments: run.timeline.filter((t) => t.memorable).slice(0, 8).map((t) => t.title),
    dataVersion: run.dataVersion,
    endedAt: new Date().toISOString(),
  };
}
