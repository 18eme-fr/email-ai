import type { EventConsequence, NarrativeContext } from '../engine/narrative-types';
import type { SimulationRun } from '../engine/types';
import type { CharacterLook, Direction, FloorKind, PropKind, WallKind } from './render/contract';

/**
 * Scènes d'exploration : module secondaire, branché sur le moteur de vie.
 *
 * Une scène est rattachée à un événement narratif (`eventId`). Elle s'ouvre
 * quand cet événement est en attente de décision ; le temps de la vie est
 * alors suspendu (l'âge ne dépend jamais du temps passé à marcher). Elle se
 * referme par un choix de l'événement (mêmes conséquences que sur la carte),
 * par une sortie, ou en passant la scène.
 */

type Text = string | ((ctx: NarrativeContext) => string);

export type SceneAction =
  /** Prend une décision de l'événement en attente (identifiant de choix). */
  | { type: 'choose'; choiceId: string }
  /**
   * Interaction ayant une conséquence réelle, appliquée par le moteur une seule
   * fois par partie (clé unique), et inscrite au journal.
   */
  | { type: 'consequence'; key: string; consequence: EventConsequence; journal: { title: string; text: Text } }
  /** Revient à la carte de l'événement sans décider. */
  | { type: 'leave' };

export interface DialogueOption {
  label: Text;
  /** Nœud suivant ; absent = fin du dialogue (après l'action éventuelle). */
  next?: string;
  action?: SceneAction;
  available?: (run: SimulationRun) => boolean;
}

export interface DialogueNode {
  id: string;
  text: Text;
  options: DialogueOption[];
}

export interface SceneNpc {
  id: string;
  name: Text;
  /** Fonction (titre ou rôle) affichée sous le nom. */
  title: Text;
  look: (run: SimulationRun) => CharacterLook;
  x: number;
  y: number;
  dir: Direction;
  prompt: 'parler' | 'info';
  /** Le premier nœud est le point d'entrée. */
  dialogue: DialogueNode[];
  present?: (run: SimulationRun) => boolean;
}

export interface SceneProp {
  kind: PropKind;
  x: number;
  y: number;
  accent?: number;
  /** Texte court affiché quand on s'en approche (panneau, affiche…). */
  label?: string;
  blocking?: boolean;
}

export interface ExplorationScene {
  id: string;
  eventId: string;
  title: Text;
  /** Phrase d'introduction affichée en haut de la scène. */
  intro: Text;
  /**
   * Carte : une chaîne par rangée (axe y), un caractère par case (axe x).
   * Légende dans `legend` ; ' ' = vide (hors carte).
   */
  map: string[];
  legend: Record<string, { floor?: FloorKind; wall?: WallKind; exit?: boolean }>;
  props: SceneProp[];
  npcs: SceneNpc[];
  spawn: { x: number; y: number; dir: Direction };
  /** Durée indicative affichée au joueur. */
  duration: string;
}
