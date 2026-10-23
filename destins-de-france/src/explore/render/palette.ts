import { hex, hsl, type RGBA } from './pixelKit';

/**
 * Palette contemporaine et chaleureuse. Chaque matériau a 3 à 4 tons
 * (clair, base, ombre, creux) ; la lumière vient du haut-gauche.
 */

export interface Ramp {
  light: RGBA;
  base: RGBA;
  dark: RGBA;
  deep: RGBA;
}

function ramp(light: string, base: string, dark: string, deep: string): Ramp {
  return { light: hex(light), base: hex(base), dark: hex(dark), deep: hex(deep) };
}

/** Rampe dérivée d'une teinte (vêtements, stands, kakémonos). */
export function hueRamp(h: number, s = 0.5, l = 0.5): Ramp {
  return {
    light: hsl(h, s * 0.9, Math.min(0.85, l + 0.13)),
    base: hsl(h, s, l),
    dark: hsl(h + 6, s * 1.05, l - 0.13),
    deep: hsl(h + 12, s * 1.1, Math.max(0.1, l - 0.25)),
  };
}

export const INK = hex('#2b2233');
export const WHITE = hex('#f7f3ea');

export const P = {
  lino: ramp('#c2cdbd', '#adbaa9', '#97a594', '#7f8d7d'),
  parquet: ramp('#d9a56c', '#c48e57', '#aa7643', '#8a5d33'),
  carrelage: ramp('#ece7de', '#dcd5c9', '#c6bdaf', '#aca291'),
  herbe: ramp('#93c26f', '#77ab5a', '#5f914a', '#4a763c'),
  trottoir: ramp('#bdbab3', '#a9a6a0', '#94918b', '#7c7974'),
  tapis: ramp('#c86a5c', '#b0544a', '#8f413c', '#6d3133'),
  mur: ramp('#efe6d6', '#e3d7c3', '#cbbca4', '#a99a83'),
  soubassement: ramp('#a3bcae', '#8eaa9b', '#789585', '#5f7a6c'),
  plinthe: ramp('#6c6070', '#5a4f5e', '#483f4c', '#352e39'),
  bois: ramp('#d1a272', '#b78655', '#986b41', '#76512f'),
  boisSombre: ramp('#9c7354', '#7f5b40', '#664731', '#4c3424'),
  metal: ramp('#c9ced3', '#a7adb4', '#868d96', '#646a73'),
  liege: ramp('#d8aa72', '#c4925c', '#a87946', '#8a6038'),
  terre: ramp('#e08a5c', '#c86d44', '#a55635', '#7f4029'),
  feuille: ramp('#8cc56b', '#62a552', '#468742', '#336834'),
  verre: ramp('#e4f3f6', '#b4dbe6', '#86bfd2', '#5e98ad'),
  sortie: ramp('#5fcf8a', '#2f9e5b', '#227a45', '#175733'),
  orange: ramp('#f2a65a', '#e07a3f', '#b95c2c', '#8c4320'),
};

/** Teinte unique et stylisée de la peau, identique pour tous les personnages. */
export const SKIN = ramp('#d6c2b2', '#c4ab98', '#a68d7b', '#86705f');

export const HAIR: Ramp[] = [
  ramp('#4a3a3a', '#2f2526', '#221a1c', '#160f12'),
  ramp('#6a4a38', '#4a3226', '#38251c', '#271912'),
  ramp('#8f603f', '#6b4530', '#523323', '#3a2318'),
  ramp('#b07848', '#8c5a36', '#6d4428', '#4f301c'),
  ramp('#d8b070', '#b98a4e', '#97703c', '#73542c'),
  ramp('#5a4a5a', '#3b2f3a', '#2c222b', '#1d161c'),
];
export const HAIR_GRAY = ramp('#c3c3c8', '#a5a5ad', '#87878f', '#6b6b73');
export const HAIR_WHITE = ramp('#f0eff0', '#dcdbe0', '#bdbcc4', '#9c9ba4');

export const PANTS: Ramp[] = [
  ramp('#5a6884', '#3e4a61', '#2f384b', '#222838'),
  ramp('#66666e', '#4a4a52', '#38383f', '#28282e'),
  ramp('#8a7862', '#6b5b4a', '#524537', '#3b3127'),
  ramp('#7c90b0', '#5c6e8c', '#475672', '#343f56'),
];

export const POSTER_COLORS = ['#e9c46a', '#e76f51', '#2a9d8f', '#8ab17d', '#f4a261', '#9c89b8', '#f2efe8', '#5fa8d3'].map((c) => hex(c));
