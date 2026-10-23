import { hex, hsl, type RGBA } from './pixelKit';

/**
 * Palette naturelle et nuancée (peu saturée, tons intermédiaires), chaude
 * et lumineuse. Chaque matériau a 5 tons : reflet, clair, base, ombre, creux.
 * La lumière vient du haut-gauche.
 */

export interface Ramp {
  hi: RGBA;
  light: RGBA;
  base: RGBA;
  dark: RGBA;
  deep: RGBA;
}

function ramp(hi: string, light: string, base: string, dark: string, deep: string): Ramp {
  return { hi: hex(hi), light: hex(light), base: hex(base), dark: hex(dark), deep: hex(deep) };
}

/** Rampe dérivée d'une teinte (vêtements, stands, kakémonos) : ombres plus chaudes, reflets plus froids. */
export function hueRamp(h: number, s = 0.42, l = 0.5): Ramp {
  return {
    hi: hsl(h - 4, s * 0.7, Math.min(0.9, l + 0.24)),
    light: hsl(h - 2, s * 0.85, Math.min(0.84, l + 0.12)),
    base: hsl(h, s, l),
    dark: hsl(h + 8, s * 0.95, l - 0.12),
    deep: hsl(h + 16, s * 0.9, Math.max(0.1, l - 0.24)),
  };
}

export const INK = hex('#2a2430');
export const WHITE = hex('#f4f0e8');
export const PAPER = hex('#ebe6dc');

export const P = {
  // Sol sportif du gymnase : vert-de-gris doux, ciré
  lino: ramp('#d3dccd', '#bfcab9', '#adb9a8', '#9aa696', '#859181'),
  parquet: ramp('#e2bb8c', '#cfa274', '#ba8c5f', '#9f744c', '#7f5b3b'),
  carrelage: ramp('#f1ede6', '#e3ddd3', '#d3ccc0', '#bdb4a6', '#a1988a'),
  herbe: ramp('#a9c98a', '#8db571', '#76a05e', '#5f8a4d', '#4a703e'),
  trottoir: ramp('#c8c5be', '#b6b3ac', '#a4a19a', '#8f8c86', '#76736e'),
  tapis: ramp('#c98478', '#b46d62', '#9c5a52', '#7f4743', '#603637'),
  mur: ramp('#f6efe2', '#ede4d3', '#e2d7c3', '#cdbfa8', '#b1a28b'),
  soubassement: ramp('#bfd0c4', '#a9bfb2', '#94ae9f', '#7e978a', '#667d71'),
  plinthe: ramp('#8a7e80', '#6f6467', '#5c5256', '#4a4145', '#383135'),
  bois: ramp('#e0b98c', '#cba173', '#b48a5f', '#98714b', '#795839'),
  boisSombre: ramp('#a8836a', '#8e6b54', '#765844', '#5f4536', '#483428'),
  metal: ramp('#e1e4e7', '#c7ccd1', '#aab0b7', '#8c939b', '#6d737b'),
  liege: ramp('#e0bb8d', '#cfa271', '#bb8c5d', '#a0744a', '#815c3a'),
  terre: ramp('#e7a881', '#d38b63', '#bb734e', '#9b5c3e', '#77452f'),
  feuille: ramp('#b7d39a', '#8fbb72', '#6e9f58', '#557f46', '#3f6136'),
  verre: ramp('#f2f8f7', '#d7eaec', '#b9d8de', '#97bec8', '#7aa2ae'),
  ciel: ramp('#f5f1e4', '#dfeaee', '#c7dde6', '#a9c9d6', '#8db2c2'),
  sortie: ramp('#8fd8a8', '#5cbf83', '#3b9d63', '#2c7d4d', '#1f5c39'),
  rouge: ramp('#ec9b88', '#d9705d', '#c2564a', '#a0433c', '#7a332f'),
  orange: ramp('#f3c08c', '#e8a265', '#d4844b', '#b06a3b', '#86502e'),
  jaune: ramp('#f5dd9a', '#ebc870', '#d9b04f', '#b78f3b', '#8c6c2d'),
};

/** Teinte unique et stylisée de la peau, identique pour tous les personnages. */
export const SKIN = ramp('#e2d3c6', '#d3c0b0', '#c3ad9b', '#a99383', '#8a7768');
/** Lèvres / creux du visage, dans la même famille neutre. */
export const SKIN_MOUTH = hex('#a1857a');

export const HAIR: Ramp[] = [
  ramp('#6b5a58', '#4a3d3c', '#382d2e', '#2a2123', '#1c1517'),
  ramp('#8a6a55', '#6b4e3d', '#55392c', '#432b21', '#311e17'),
  ramp('#a87d5c', '#8c6146', '#744d36', '#5c3b29', '#43291d'),
  ramp('#c39a6c', '#a87d52', '#8e6641', '#734f33', '#573a26'),
  ramp('#e2c590', '#cfab70', '#b8915a', '#9a7647', '#775a36'),
  ramp('#76656f', '#574a53', '#43383f', '#33292f', '#241c21'),
];
export const HAIR_GRAY = ramp('#d6d6d9', '#bdbdc1', '#a3a3a9', '#8a8a91', '#707077');
export const HAIR_WHITE = ramp('#fbfafa', '#ebeaec', '#d9d8dc', '#c1c0c6', '#a5a4ab');

export const PANTS: Ramp[] = [
  ramp('#8592a8', '#68758d', '#536078', '#424d62', '#333b4c'),
  ramp('#8e8d93', '#727177', '#5d5c62', '#4a494f', '#38383d'),
  ramp('#b2a189', '#978670', '#7f6f5b', '#665847', '#4e4336'),
  ramp('#93a6c0', '#7689a6', '#60728f', '#4d5c75', '#3b475b'),
];

export const POSTER_COLORS = ['#e3c47e', '#d98a72', '#6aa79a', '#9dba8a', '#e8b07e', '#a99cbf', '#f1ece2', '#86b3cf'].map((c) => hex(c));
