import type { NarrativeEvent } from '../../engine/narrative-types';
import { ADULT_EVENTS } from './adult';
import { AGING_EVENTS } from './aging';
import { CHILDHOOD_EVENTS } from './childhood';
import { ENRICHMENT_EVENTS } from './enrichment';
import { YOUTH_EVENTS } from './youth';

/**
 * Bibliothèque complète des événements. L'ordre compte pour les jalons :
 * à âge égal, ils sont examinés dans cet ordre.
 */
export const ALL_EVENTS: NarrativeEvent[] = [...CHILDHOOD_EVENTS, ...YOUTH_EVENTS, ...ADULT_EVENTS, ...AGING_EVENTS, ...ENRICHMENT_EVENTS];

const BY_ID = new Map(ALL_EVENTS.map((e) => [e.id, e]));

export function getEvent(id: string): NarrativeEvent | undefined {
  return BY_ID.get(id);
}
