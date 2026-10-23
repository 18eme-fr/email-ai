/**
 * Contrat entre la logique d'exploration (déplacement, collisions, profondeur)
 * et le rendu pixel art. Le rendu ne connaît ni le moteur de vie ni React :
 * il dessine, aux coordonnées écran fournies, des tuiles, des objets et des
 * personnages, sur un canvas en basse résolution agrandi sans lissage.
 *
 * Projection pseudo-isométrique (losanges 2:1) :
 *   écranX = (x − y) · TILE_W / 2 + origineX
 *   écranY = (x + y) · TILE_H / 2 + origineY
 * Le point (sx, sy) transmis aux fonctions de dessin est le CENTRE du losange
 * au sol de la case (ou des pieds du personnage).
 */

export const TILE_W = 32;
export const TILE_H = 16;
/** Hauteur d'un mur en pixels (au-dessus du sol). */
export const WALL_H = 34;

export type FloorKind = 'lino' | 'parquet' | 'carrelage' | 'herbe' | 'trottoir' | 'tapis';

export type WallKind = 'mur' | 'mur_fenetre' | 'mur_affiches' | 'porte';

export type PropKind =
  | 'stand'
  | 'table'
  | 'chaise'
  | 'plante'
  | 'etagere'
  | 'banc'
  | 'panier_basket'
  | 'tableau_liaison'
  | 'distributeur'
  | 'kakemono';

export type Direction = 'n' | 's' | 'e' | 'w';

export interface CharacterLook {
  age: number;
  sex: 'F' | 'M';
  /** Teinte des vêtements (0-360) — jamais une couleur de peau. */
  hue: number;
  /** Variation déterministe de coiffure / accessoires. */
  seed: number;
  /** Indices visuels de rôle, purement décoratifs. */
  role?: 'eleve' | 'enseignant' | 'conseiller' | 'artisan' | 'parent' | 'agent';
}

export interface Renderer {
  /** Sol d'une case. `variant` (0-3) varie légèrement la texture. */
  drawFloor(ctx: CanvasRenderingContext2D, kind: FloorKind, sx: number, sy: number, variant: number): void;
  /**
   * Bloc de mur sur une case. `faces` indique quelles faces visibles dessiner
   * (sud-ouest = gauche, sud-est = droite) selon les voisins.
   */
  drawWall(
    ctx: CanvasRenderingContext2D,
    kind: WallKind,
    sx: number,
    sy: number,
    faces: { left: boolean; right: boolean },
    variant: number,
    /** Présence d'un sol devant chaque face (ombre de pied de mur, lumière des fenêtres). Absent = sol supposé. */
    floorAhead?: { left: boolean; right: boolean },
  ): void;
  /** Objet posé au sol. `accent` = teinte (0-360) pour les stands et kakémonos. */
  drawProp(ctx: CanvasRenderingContext2D, kind: PropKind, sx: number, sy: number, accent: number, variant: number): void;
  /**
   * Personnage debout, pieds en (sx, sy). `frame` 0-3 (marche) ; `moving`
   * false = pose immobile (respiration lente via `t`, secondes).
   */
  drawCharacter(
    ctx: CanvasRenderingContext2D,
    look: CharacterLook,
    dir: Direction,
    frame: number,
    moving: boolean,
    sx: number,
    sy: number,
    t: number,
  ): void;
  /** Indicateur d'interaction (bulle « ! » ou « … ») au-dessus d'un point. */
  drawPrompt(ctx: CanvasRenderingContext2D, sx: number, sy: number, kind: 'parler' | 'info', t: number): void;
  /** Ombre portée ovale au sol. */
  drawShadow(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number): void;
  /** Couleur de fond derrière la carte (thème jour). */
  background: string;
}
