import type { ExplorationScene } from '../types';
import { FORUM_ORIENTATION } from './forumOrientation';

/** Registre des scènes d'exploration, indexé par l'événement narratif qu'elles incarnent. */
export const SCENES: ExplorationScene[] = [FORUM_ORIENTATION];

export function sceneForEvent(eventId: string): ExplorationScene | undefined {
  return SCENES.find((s) => s.eventId === eventId);
}
