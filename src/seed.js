// =============================================================================
//  Exemple de départ : un rez-de-chaussée regroupant les trois pôles et leurs
//  espaces communs (accueil, sas, circulation, sanitaires, vestiaires) + un R+1.
//  Toutes les valeurs sont modifiables ; ce n'est qu'un point de départ.
//  Les zones ne se recouvrent pas (règle de la V1).
// =============================================================================
import { newId, SCHEMA_VERSION } from './store.js';
import { DEFAULTS } from './config.js';

export function seedProject() {
  const rdc = newId('lvl');
  const r1 = newId('lvl');
  const walls = [], doors = [], windows = [], zones = [];

  // levelId, (x1,y1)->(x2,y2). L'extrémité 1 sert de référence pour les offsets.
  const wall = (levelId, x1, y1, x2, y2, height = 3.2) => {
    const id = newId('wall');
    walls.push({ id, levelId, x1, y1, x2, y2, thickness: DEFAULTS.wallThickness, height });
    return id;
  };
  const zone = (levelId, name, pole, type, a, b) => {
    zones.push({
      id: newId('zone'), levelId, name, pole, type, note: '',
      points: [{ x: a[0], y: a[1] }, { x: b[0], y: a[1] }, { x: b[0], y: b[1] }, { x: a[0], y: b[1] }],
    });
  };
  const door = (wallId, offset, width, exterior) =>
    doors.push({ id: newId('door'), wallId, offset, width, height: 2.2, exterior });
  const win = (wallId, offset, width, height, sill, bay = false) =>
    windows.push({ id: newId('window'), wallId, offset, width, height, sill, bay });

  // ---- Enveloppe 24 x 15 ----
  const wBottom = wall(rdc, 0, 0, 24, 0);    // façade (offset = x)
  const wRight = wall(rdc, 24, 0, 24, 15);    // droite  (offset = y)
  const wTop = wall(rdc, 24, 15, 0, 15);      // arrière (offset = 24 - x)
  const wLeft = wall(rdc, 0, 15, 0, 0);       // gauche  (offset = 15 - y)
  const wSep1 = wall(rdc, 8.9, 0, 8.9, 15);   // Concert | Restaurant (offset = y)
  const wSep2 = wall(rdc, 16.6, 0, 16.6, 15); // Restaurant | Ateliers (offset = y)

  // ---- Bande d'entrée (Commun) ----
  zone(rdc, 'Accueil', 'commun', 'accueil', [0.3, 0.3], [7.0, 2.1]);
  zone(rdc, 'Sas', 'commun', 'sas', [7.2, 0.3], [8.7, 2.1]);
  zone(rdc, 'Circulation', 'commun', 'circulation', [9.1, 0.3], [16.4, 2.1]);
  zone(rdc, 'Sanitaires', 'commun', 'sanitaires', [16.8, 0.3], [20.0, 2.1]);
  zone(rdc, 'Vestiaires', 'commun', 'vestiaires', [20.2, 0.3], [23.7, 2.1]);

  // ---- Pôle Concert (x 0.3–8.7) ----
  zone(rdc, 'Espace merch', 'concert', 'merch', [0.3, 2.5], [8.7, 3.8]);
  zone(rdc, 'Salle', 'concert', 'salle_concert', [0.3, 4.0], [8.7, 11.0]);
  zone(rdc, 'Scène', 'concert', 'scene', [0.3, 11.2], [5.4, 14.7]);
  zone(rdc, 'Stockage matériel', 'concert', 'stockage_mat', [5.6, 11.2], [8.7, 14.7]);

  // ---- Pôle Restaurant et vin (x 9.1–16.4) ----
  zone(rdc, 'Bar / comptoir', 'restaurant', 'bar', [9.1, 2.5], [16.4, 3.8]);
  zone(rdc, 'Salle de restaurant', 'restaurant', 'salle_resto', [9.1, 4.0], [16.4, 11.0]);
  zone(rdc, 'Cuisine', 'restaurant', 'cuisine', [9.1, 11.2], [12.9, 14.7]);
  zone(rdc, 'Cave / stockage vin', 'restaurant', 'cave_vin', [13.1, 11.2], [16.4, 14.7]);

  // ---- Pôle Ateliers (x 16.8–23.7) ----
  zone(rdc, 'Atelier modulable', 'ateliers', 'atelier', [16.8, 2.5], [23.7, 11.0]);
  zone(rdc, 'Rangement matériel', 'ateliers', 'rangement', [16.8, 11.2], [20.0, 14.7]);
  zone(rdc, "Espace d'exposition", 'ateliers', 'expo', [20.2, 11.2], [23.7, 14.7]);

  // ---- Portes ----
  door(wBottom, 3.6, 1.8, true);   // entrée principale commune -> accueil
  door(wBottom, 12.7, 1.4, true);  // accès restaurant indépendant
  door(wBottom, 20.0, 1.4, true);  // accès ateliers indépendant
  door(wLeft, 2.0, 1.4, true);     // accès service artistes/livraisons (côté scène)
  door(wRight, 13.0, 1.4, true);   // livraisons ateliers
  door(wSep1, 1.2, 1.0, false);    // sas/circulation -> restaurant
  door(wSep1, 7.5, 1.0, false);    // salle concert <-> salle restaurant
  door(wSep2, 1.2, 1.0, false);    // circulation -> ateliers
  door(wSep2, 7.5, 1.0, false);    // restaurant <-> ateliers

  // ---- Fenêtres ----
  win(wTop, 11.3, 3.2, 2.6, 0, true);   // baie vitrée salle de restaurant
  win(wLeft, 8.0, 1.4, 1.3, 1.0);       // salle concert
  win(wLeft, 11.0, 1.4, 1.3, 1.0);
  win(wRight, 5.0, 3.0, 2.4, 0, true);  // grande baie atelier (lumière naturelle)
  win(wRight, 9.5, 1.6, 1.4, 1.0);
  win(wTop, 3.5, 1.6, 1.4, 1.0);        // exposition

  // ---- R+1 : loges + locaux techniques ----
  wall(r1, 0, 0, 9, 0, 3);
  wall(r1, 9, 0, 9, 7, 3);
  wall(r1, 0, 7, 9, 7, 3);
  wall(r1, 0, 7, 0, 0, 3);
  zone(r1, 'Loges', 'concert', 'loges', [0.3, 0.3], [4.4, 6.7]);
  zone(r1, 'Locaux techniques', 'commun', 'technique', [4.6, 0.3], [8.7, 6.7]);

  return {
    schemaVersion: SCHEMA_VERSION,
    name: 'Établissement culturel — exemple',
    activeLevelId: rdc,
    gridStep: DEFAULTS.gridStep,
    levels: [
      { id: rdc, name: 'Rez-de-chaussée', elevation: 0, height: 3.2 },
      { id: r1, name: 'R+1', elevation: 3.6, height: 3 },
    ],
    walls, doors, windows, zones,
  };
}
