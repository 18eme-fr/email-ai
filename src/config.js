// =============================================================================
//  CONFIGURATION UNIQUE
//  -------------------------------------------------------------------------
//  C'est LE fichier à éditer pour faire évoluer l'outil :
//   - ajouter / renommer un pôle       -> objet POLES
//   - ajouter / renommer un type       -> tableau TYPES (chaque type cite son pôle)
//   - régler les valeurs par défaut    -> DEFAULTS
//
//  Chaque zone dessinée reçoit un pôle (couleur de base) et un type
//  (nuance de cette couleur, calculée automatiquement — voir typeColor()).
// =============================================================================

// --- Pôles : couleur de base -------------------------------------------------
export const POLES = {
  concert:    { name: 'Pôle Concert',    color: '#d6473c' }, // rouge scène
  restaurant: { name: 'Pôle Restaurant', color: '#8c2f4d' }, // bordeaux (vin)
  ateliers:   { name: 'Pôle Ateliers',   color: '#2aa17b' }, // vert lumineux
  commun:     { name: 'Commun',          color: '#5f7185' }, // ardoise neutre
};

// --- Types : { key, name, pole } ---------------------------------------------
//  L'ordre à l'intérieur d'un même pôle sert à répartir les nuances.
export const TYPES = [
  // Pôle Concert
  { key: 'salle_concert',   name: 'Salle',              pole: 'concert' },
  { key: 'scene',           name: 'Scène',              pole: 'concert' },
  { key: 'regie',           name: 'Régie',              pole: 'concert' },
  { key: 'loges',           name: 'Loges',              pole: 'concert' },
  { key: 'merch',           name: 'Espace merch',       pole: 'concert' },
  { key: 'stockage_mat',    name: 'Stockage matériel',  pole: 'concert' },

  // Pôle Restaurant
  { key: 'salle_resto',     name: 'Salle de restaurant',pole: 'restaurant' },
  { key: 'cuisine',         name: 'Cuisine',            pole: 'restaurant' },
  { key: 'cave_vin',        name: 'Cave / stockage vin',pole: 'restaurant' },
  { key: 'bar',             name: 'Bar / comptoir',     pole: 'restaurant' },

  // Pôle Ateliers
  { key: 'atelier',         name: 'Atelier modulable',  pole: 'ateliers' },
  { key: 'rangement',       name: 'Rangement matériel', pole: 'ateliers' },
  { key: 'expo',            name: "Espace d'exposition",pole: 'ateliers' },

  // Commun (transversal à tous les pôles)
  { key: 'accueil',         name: 'Accueil',            pole: 'commun' },
  { key: 'sanitaires',      name: 'Sanitaires',         pole: 'commun' },
  { key: 'circulation',     name: 'Circulation',        pole: 'commun' },
  { key: 'vestiaires',      name: 'Vestiaires',         pole: 'commun' },
  { key: 'technique',       name: 'Locaux techniques',  pole: 'commun' },
  { key: 'livraisons',      name: 'Livraisons',         pole: 'commun' },
  { key: 'sas',             name: 'Sas',                pole: 'commun' },
];

// --- Valeurs par défaut ------------------------------------------------------
export const DEFAULTS = {
  levelHeight: 3.0,     // hauteur d'un niveau (m)
  wallThickness: 0.2,   // épaisseur de mur (m)
  gridStep: 0.25,       // pas d'aimantation à la grille (m)
  door:   { width: 0.9, height: 2.1, exterior: false },
  window: { width: 1.2, height: 1.2, sill: 1.0, bay: false }, // sill = allège
  bayHeight: 2.1,       // hauteur par défaut d'une baie vitrée (allège 0)
};

// =============================================================================
//  Dérivés — pas besoin d'y toucher pour ajouter un pôle/type
// =============================================================================

export const TYPES_BY_KEY = Object.fromEntries(TYPES.map((t) => [t.key, t]));

export const TYPES_BY_POLE = (() => {
  const out = {};
  for (const key of Object.keys(POLES)) out[key] = [];
  for (const t of TYPES) (out[t.pole] ||= []).push(t);
  return out;
})();

// Couleur d'un pôle (repli gris si clé inconnue).
export function poleColor(poleKey) {
  return POLES[poleKey]?.color ?? '#888888';
}

// Nuance d'un type : la couleur de base du pôle éclaircie/assombrie selon
// la position du type dans son pôle, pour distinguer les types d'un même pôle.
export function typeColor(typeKey) {
  const t = TYPES_BY_KEY[typeKey];
  if (!t) return '#888888';
  const siblings = TYPES_BY_POLE[t.pole] || [t];
  const idx = siblings.findIndex((s) => s.key === typeKey);
  const n = Math.max(siblings.length - 1, 1);
  // Répartit la luminosité de -18% (premier) à +26% (dernier).
  const factor = -0.18 + (idx / n) * 0.44;
  return shade(poleColor(t.pole), factor);
}

export function poleName(poleKey) {
  return POLES[poleKey]?.name ?? poleKey;
}

export function typeName(typeKey) {
  return TYPES_BY_KEY[typeKey]?.name ?? typeKey;
}

// --- Utilitaires couleur -----------------------------------------------------
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}
function rgbToHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
// factor > 0 éclaircit vers le blanc, factor < 0 assombrit vers le noir.
export function shade(hex, factor) {
  const { r, g, b } = hexToRgb(hex);
  if (factor >= 0) {
    return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor);
  }
  const f = 1 + factor;
  return rgbToHex(r * f, g * f, b * f);
}
