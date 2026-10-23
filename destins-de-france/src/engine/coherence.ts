import { canHoldJob, getJob } from '../data/jobs';
import { getSource } from '../data/sources';
import type { SimulationRun } from './types';

/**
 * Contrôles automatiques de cohérence. Renvoie la liste des violations
 * (vide si tout va bien). Utilisé par les tests et, en développement, après
 * chaque étape.
 */
export function checkCoherence(run: SimulationRun): string[] {
  const v: string[] = [];
  const c = run.citizen;
  if (run.year - c.birthYear !== run.age) v.push(`Âge incohérent : ${run.age} en ${run.year}`);

  const scales: [string, number][] = [
    ['santé', run.health.physical],
    ['bien-être', run.health.wellbeing],
    ['soutien social', run.social],
    ['engagement', run.civic.engagement],
    ['conditions d\'étude', run.education.conditions],
  ];
  for (const [label, value] of scales) if (!(value >= 0 && value <= 100)) v.push(`Indicateur hors bornes : ${label} = ${value}`);

  const f = run.finances;
  for (const [label, value] of [['épargne', f.savings], ['dette', f.debt], ['revenu', f.monthlyIncome]] as const) {
    if (!Number.isFinite(value)) v.push(`Montant non fini : ${label}`);
    if (value < 0) v.push(`Montant négatif : ${label} = ${value}`);
  }

  // Emploi : âge minimal et qualifications.
  if ((run.employment.status === 'emploi' || run.employment.status === 'independant') && run.age < 16) v.push('Emploi avant 16 ans');
  if (run.employment.jobId) {
    const job = getJob(run.employment.jobId);
    if (!job) v.push(`Emploi inconnu : ${run.employment.jobId}`);
    else if (!canHoldJob(job, run.education.level, run.flags)) v.push(`Emploi sans qualification requise : ${job.id}`);
  }
  for (const j of run.employment.jobs) if (j.age < 16) v.push(`Emploi enregistré à ${j.age} ans`);

  // Mandats : 18 ans révolus.
  for (const m of run.civic.mandates) if (m.fromYear - c.birthYear < 18) v.push(`Mandat avant 18 ans : ${m.label}`);
  if (run.civic.votesCast + run.civic.abstentions > 0 && run.age < 18) v.push('Vote avant 18 ans');

  // Chronologie : ordre et pas d'événement après le décès.
  let prevAge = -1;
  for (const t of run.timeline) {
    if (t.age < prevAge) v.push(`Chronologie non ordonnée : ${t.title}`);
    prevAge = t.age;
    if (run.deathAge !== undefined && t.age > run.deathAge) v.push(`Événement après le décès : ${t.title}`);
    // Aucune statistique ni fait vérifié ne peut être daté du futur.
    if (t.year > 2026 && (t.status === 'statistique' || t.status === 'verifie')) v.push(`Futur présenté comme vérifié : ${t.title} (${t.year})`);
    for (const id of t.sourceIds) if (!getSource(id)) v.push(`Source inconnue : ${id}`);
  }
  if (!run.alive && run.pending) v.push('Décision en attente après le décès');
  if (!run.alive && run.timeline[run.timeline.length - 1]?.title !== 'Fin de vie') v.push('La fin de vie n\'est pas le dernier événement');

  // Diplômes réglementés.
  if (run.employment.jobId === 'medecin' && run.education.level !== 'medecine') v.push('Médecin sans diplôme de médecine');
  return v;
}
