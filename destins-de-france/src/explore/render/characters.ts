import type { CharacterLook, Direction } from './contract';
import { HAIR, HAIR_GRAY, HAIR_WHITE, INK, PANTS, SKIN, WHITE, hueRamp, type Ramp } from './palette';
import { Pix, cached, hash, hex, mix, shade, type RGBA, type Sprite } from './pixelKit';

/** Sprite de 16×28 ; les pieds reposent sur la rangée 25, centrés en x = 8. */
const CW = 16;
const CH = 28;
const FOOT = 25;
const CXL = 8; // première colonne à droite de l'axe

type AgeGroup = 'enfant' | 'ado' | 'adulte' | 'aine';

interface Build {
  headW: number;
  headH: number;
  torsoW: number;
  torsoH: number;
  legH: number;
  neck: number;
}

const BUILDS: Record<AgeGroup, Build> = {
  enfant: { headW: 6, headH: 6, torsoW: 6, torsoH: 4, legH: 4, neck: 0 },
  ado: { headW: 6, headH: 7, torsoW: 8, torsoH: 6, legH: 5, neck: 1 },
  adulte: { headW: 6, headH: 7, torsoW: 8, torsoH: 7, legH: 6, neck: 1 },
  aine: { headW: 6, headH: 7, torsoW: 8, torsoH: 7, legH: 5, neck: 0 },
};

function ageGroup(age: number): AgeGroup {
  if (age < 12) return 'enfant';
  if (age < 18) return 'ado';
  if (age < 60) return 'adulte';
  return 'aine';
}

type HairStyle = 'court' | 'frange' | 'boucles' | 'rase' | 'raie' | 'long' | 'queue' | 'carre' | 'chignon';
const HAIR_M: HairStyle[] = ['court', 'frange', 'boucles', 'rase', 'raie'];
const HAIR_F: HairStyle[] = ['long', 'queue', 'carre', 'chignon', 'boucles', 'frange'];

function pick<T>(list: readonly T[], t: number, fallback: T): T {
  return list[Math.floor(t * list.length) % list.length] ?? fallback;
}

interface Resolved {
  group: AgeGroup;
  build: Build;
  hair: HairStyle;
  hairC: Ramp;
  shirt: Ramp;
  pants: Ramp;
  shoes: RGBA;
  glasses: boolean;
  role: NonNullable<CharacterLook['role']> | 'aucun';
  seed: number;
}

function resolve(look: CharacterLook): Resolved {
  const group = ageGroup(look.age);
  const seed = Math.abs(Math.round(look.seed)) % 100000;
  let hair = pick(look.sex === 'F' ? HAIR_F : HAIR_M, hash(seed, 1), 'court');
  if (group === 'aine' && look.sex === 'M' && hair === 'raie') hair = 'rase';
  if (group === 'aine' && hair === 'long') hair = 'carre';
  const hairC = group === 'aine' ? (hash(seed, 2) < 0.5 ? HAIR_GRAY : HAIR_WHITE) : pick(HAIR, hash(seed, 3), HAIR[0]!);
  const role = look.role ?? 'aucun';
  return {
    group,
    build: BUILDS[group],
    hair,
    hairC,
    shirt: hueRamp(look.hue, 0.48, 0.52),
    pants: pick(PANTS, hash(seed, 4), PANTS[0]!),
    shoes: role === 'eleve' && hash(seed, 5) < 0.5 ? hex('#e9e6e0') : hex('#3a3238'),
    glasses: hash(seed, 6) < (group === 'aine' ? 0.55 : group === 'adulte' ? 0.25 : group === 'ado' ? 0.12 : 0),
    role,
    seed,
  };
}

/**
 * Dessine une vue (face ou dos) orientée vers la droite de l'écran.
 * `step` : -1, 0 ou 1 (jambe avancée) ; `bob` : 0 ou 1 (buste soulevé).
 */
function drawBody(r: Resolved, back: boolean, step: number, bob: number, sex: 'F' | 'M'): Pix {
  const p = new Pix(CW, CH);
  const b = r.build;
  const elder = r.group === 'aine';
  const legTop = FOOT - b.legH;
  const torsoTop = legTop - b.torsoH - bob;
  const headBottom = torsoTop - b.neck - 1 + (elder ? 1 : 0);
  const headTop = headBottom - b.headH + 1;
  // Voussure de l'aîné : la tête avance vers le regard
  const lean = elder ? 1 : 0;
  const hx0 = CXL - b.headW / 2 + lean;
  const hx1 = hx0 + b.headW - 1;
  const tx0 = CXL - b.torsoW / 2;
  const tx1 = tx0 + b.torsoW - 1;
  const S = SKIN;
  const sh = r.shirt;

  // Jambes et chaussures (la jambe levée est plus courte d'un pixel)
  const legW = Math.max(2, b.torsoW / 2 - 1);
  const lx0 = CXL - legW;
  const rx0 = CXL;
  const legL = step === 1 ? 1 : 0;
  const legR = step === -1 ? 1 : 0;
  const pants = r.pants;
  p.rect(lx0, legTop - bob, legW, b.legH + bob - legL, pants.base);
  p.rect(rx0, legTop - bob, legW, b.legH + bob - legR, pants.dark);
  p.rect(lx0, legTop - bob, 1, b.legH + bob - legL, pants.light);
  p.rect(lx0 - (back ? 0 : 0), FOOT - legL, legW + (back ? 0 : 1), 1, r.shoes);
  p.rect(rx0, FOOT - legR, legW + (back ? 0 : 1), 1, shade(r.shoes, 0.85));

  // Buste : épaules arrondies, éclairage haut-gauche
  for (let y = torsoTop; y < legTop; y++) {
    for (let x = tx0; x <= tx1; x++) {
      const first = y === torsoTop;
      if (first && (x === tx0 || x === tx1)) continue;
      if (first && sex === 'F' && (x === tx0 + 1 || x === tx1 - 1) && r.group !== 'enfant') continue;
      if (elder && first && (x === tx0 + 1 || x === tx1 - 1)) continue;
      let c = sh.base;
      if (x === tx0 || (x === tx0 + 1 && first)) c = sh.light;
      else if (x === tx1) c = sh.dark;
      if (y === legTop - 1) c = shade(c, 0.82);
      p.set(x, y, c);
    }
  }
  // Bras qui balancent
  const armTop = torsoTop + 1;
  const armLen = b.torsoH - 1;
  const swingL = -step;
  const swingR = step;
  p.rect(tx0 - 1, armTop, 1, armLen + (swingL > 0 ? 1 : 0) - (swingL < 0 ? 1 : 0), sh.light);
  p.rect(tx1 + 1, armTop, 1, armLen + (swingR > 0 ? 1 : 0) - (swingR < 0 ? 1 : 0), sh.dark);
  p.set(tx0 - 1, armTop + armLen + (swingL > 0 ? 1 : 0) - (swingL < 0 ? 1 : 0), S.base);
  p.set(tx1 + 1, armTop + armLen + (swingR > 0 ? 1 : 0) - (swingR < 0 ? 1 : 0), S.dark);

  // Cou
  if (b.neck > 0 || elder) p.rect(CXL - 1 + lean, headBottom + 1, 2, Math.max(1, torsoTop - headBottom - 1), S.dark);

  // Tenue selon le rôle
  roleDetails(p, r, back, { torsoTop, legTop, tx0, tx1 });

  // Tête
  for (let y = headTop; y <= headBottom; y++) {
    for (let x = hx0; x <= hx1; x++) {
      const corner = (y === headTop || y === headBottom) && (x === hx0 || x === hx1);
      if (corner) continue;
      let c = S.base;
      if (x === hx1 || y === headBottom) c = S.dark;
      if (x === hx0 && y < headBottom - 1) c = S.light;
      p.set(x, y, c);
    }
  }
  const eyeY = headTop + b.headH - 3;
  if (!back) {
    // Regard tourné vers la droite (3/4)
    const e1 = hx0 + 2;
    const e2 = hx0 + 4;
    p.set(e1, eyeY, INK);
    p.set(e2, eyeY, INK);
    if (r.glasses) {
      // Monture fine : pont et branches de part et d'autre des yeux
      const frame = mix(INK, S.dark, 0.45);
      p.set(e1 - 1, eyeY, frame);
      p.set(e1 + 1, eyeY, frame);
      p.set(e2 + 1, eyeY, frame);
      p.set(e1, eyeY - 1, mix(frame, S.base, 0.4));
      p.set(e2, eyeY - 1, mix(frame, S.base, 0.4));
    }
    if (r.group === 'enfant') {
      p.set(e1 - 1, eyeY + 1, mix(S.base, hex('#e08a7a'), 0.35));
      p.set(e2 + 1, eyeY + 1, mix(S.base, hex('#e08a7a'), 0.35));
    }
  }
  drawHair(p, r, back, { hx0, hx1, headTop, headBottom, torsoTop });
  // Nuque visible de dos pour les coiffures courtes
  return p;
}

interface TorsoBox {
  torsoTop: number;
  legTop: number;
  tx0: number;
  tx1: number;
}

function roleDetails(p: Pix, r: Resolved, back: boolean, t: TorsoBox): void {
  const { torsoTop, legTop, tx0, tx1 } = t;
  const mid = CXL;
  switch (r.role) {
    case 'eleve': {
      const bag = hueRamp(hash(r.seed, 9) * 360, 0.45, 0.45);
      if (back) {
        p.rect(tx0 + 1, torsoTop + 1, tx1 - tx0 - 1, legTop - torsoTop - 1, bag.base);
        p.rect(tx0 + 1, torsoTop + 1, tx1 - tx0 - 1, 1, bag.light);
        p.rect(tx0 + 2, legTop - 3, tx1 - tx0 - 3, 1, bag.dark);
      } else {
        p.rect(tx0 + 1, torsoTop, 1, 3, bag.dark);
        p.rect(tx1 - 1, torsoTop, 1, 3, bag.dark);
        p.set(tx1 + 1, torsoTop + 1, bag.base);
      }
      break;
    }
    case 'enseignant': {
      // Veste à revers, chemise claire et cravate
      const jacket = mix(r.shirt.dark, hex('#3d3a46'), 0.45);
      for (let y = torsoTop; y < legTop; y++) {
        for (let x = tx0; x <= tx1; x++) {
          if (p.alpha(x, y) === 0) continue;
          p.set(x, y, x === tx0 ? shade(jacket, 1.25) : x === tx1 ? shade(jacket, 0.85) : jacket);
        }
      }
      if (!back) {
        p.rect(mid - 1, torsoTop, 2, 3, WHITE);
        p.rect(mid - 1, torsoTop + 1, 1, 3, hex('#8e3b46'));
        p.set(mid - 1, torsoTop + 4, hex('#6f2d37'));
      }
      break;
    }
    case 'conseiller': {
      if (!back) {
        const lan = hex('#2e7d6f');
        p.set(mid - 2, torsoTop, lan);
        p.set(mid + 1, torsoTop, lan);
        p.set(mid - 2, torsoTop + 1, lan);
        p.set(mid + 1, torsoTop + 1, lan);
        p.set(mid - 1, torsoTop + 2, lan);
        p.set(mid, torsoTop + 2, lan);
        p.rect(mid - 1, torsoTop + 3, 2, 2, WHITE);
        p.set(mid - 1, torsoTop + 3, hex('#5fbfae'));
      } else {
        p.rect(mid - 2, torsoTop, 4, 1, hex('#2e7d6f'));
      }
      break;
    }
    case 'artisan': {
      const apron = hash(r.seed, 10) < 0.5;
      const c = apron ? hex('#8a6a4a') : hex('#3f5f8c');
      const y0 = apron ? torsoTop + 2 : torsoTop + 1;
      for (let y = y0; y < legTop + 3; y++) {
        for (let x = tx0 + 1; x < tx1; x++) {
          if (p.alpha(x, y) === 0 || back) continue;
          p.set(x, y, x === tx1 - 1 ? shade(c, 0.85) : c);
        }
      }
      if (!back) {
        p.set(tx0 + 1, torsoTop, c);
        p.set(tx1 - 1, torsoTop, c);
        p.set(tx0 + 1, torsoTop + 1, c);
        p.set(tx1 - 1, torsoTop + 1, c);
        p.set(mid, y0 + 2, shade(c, 0.7));
      } else {
        p.line(tx0 + 1, torsoTop, tx1 - 1, legTop - 1, c);
        p.line(tx1 - 1, torsoTop, tx0 + 1, legTop - 1, c);
      }
      break;
    }
    case 'agent': {
      const vest = hex('#2f3a56');
      for (let y = torsoTop; y < legTop; y++) {
        for (let x = tx0; x <= tx1; x++) {
          if (p.alpha(x, y) === 0) continue;
          if (!back && (x === mid - 1 || x === mid) && y < torsoTop + 3) continue;
          p.set(x, y, x === tx1 ? shade(vest, 0.8) : vest);
        }
      }
      p.rect(tx0, torsoTop + 3, tx1 - tx0 + 1, 1, hex('#c9ced3'));
      break;
    }
    case 'parent': {
      // Sacoche en bandoulière
      const strap = hex('#6b4a3a');
      p.line(tx0 + 1, torsoTop, tx1, legTop - 2, strap);
      p.rect(tx1, legTop - 2, 2, 3, back ? shade(strap, 0.8) : strap);
      break;
    }
    case 'aucun':
      if (!back) p.set(CXL - 1, torsoTop, SKIN.dark);
      break;
  }
}

interface HeadBox {
  hx0: number;
  hx1: number;
  headTop: number;
  headBottom: number;
  torsoTop: number;
}

function drawHair(p: Pix, r: Resolved, back: boolean, h: HeadBox): void {
  const { hx0, hx1, headTop, headBottom, torsoTop } = h;
  const c = r.hairC;
  const put = (x: number, y: number, light = false): void => p.set(x, y, light ? c.light : x >= hx1 ? c.dark : c.base);
  const row = (y: number, x0: number, x1: number): void => {
    for (let x = x0; x <= x1; x++) put(x, y, x === x0 + 1 && y <= headTop);
  };
  const style = r.hair;
  const thin = style === 'rase';

  // Calotte commune
  if (!thin) row(headTop - 1, hx0 + 1, hx1 - 1);
  row(headTop, hx0, hx1);
  if (!thin) row(headTop + 1, hx0, hx1);
  if (thin) {
    for (let x = hx0 + 1; x < hx1; x++) p.set(x, headTop - 1, mix(c.base, SKIN.base, 0.35));
  }

  if (back) {
    // De dos : la chevelure couvre la tête, sauf la nuque des coupes courtes
    const longish = style === 'long' || style === 'carre' || style === 'boucles' || style === 'queue' || style === 'chignon';
    const bottom = style === 'rase' || style === 'court' || style === 'raie' || style === 'frange' ? headBottom - 1 : headBottom;
    for (let y = headTop; y <= bottom; y++) row(y, hx0, hx1);
    if (style === 'long') for (let y = headBottom + 1; y <= torsoTop + 3; y++) row(y, hx0, hx1);
    if (style === 'queue') for (let y = headBottom; y <= torsoTop + 3; y++) put(CXL - 1 + (hx0 - (CXL - 3)), y);
    if (style === 'carre' && longish) row(headBottom, hx0 - 1, hx1 + 1);
  } else {
    switch (style) {
      case 'court':
        put(hx0, headTop + 2);
        put(hx1, headTop + 2);
        break;
      case 'frange':
        row(headTop + 2, hx0, hx1 - 2);
        put(hx1, headTop + 2);
        break;
      case 'raie':
        row(headTop + 2, hx0, hx0 + 2);
        put(hx1, headTop + 2);
        put(hx0, headTop + 3);
        break;
      case 'rase':
        break;
      case 'boucles':
        for (let y = headTop - 1; y <= headTop + 3; y++) {
          put(hx0 - 1, y);
          put(hx1 + 1, y);
        }
        // Volume bouclé : rangée pleine, texture de mèches plus sombres
        for (let x = hx0; x <= hx1; x++) p.set(x, headTop - 2, (x - hx0) % 2 === 0 ? c.base : c.dark);
        for (let x = hx0; x <= hx1; x += 2) p.set(x, headTop, c.dark);
        put(hx0, headTop + 2);
        break;
      case 'long':
        for (let y = headTop; y <= torsoTop + 2; y++) {
          put(hx0 - 1, y);
          put(hx1 + 1, y);
        }
        for (let y = headTop + 2; y <= headBottom - 1; y++) {
          put(hx0, y);
          put(hx1, y);
        }
        put(hx0 + 1, headTop + 2);
        break;
      case 'carre':
        for (let y = headTop; y <= headBottom; y++) {
          put(hx0 - 1, y);
          put(hx1 + 1, y);
        }
        row(headTop + 2, hx0, hx1);
        break;
      case 'queue':
        for (let y = headTop + 1; y <= headTop + 5; y++) put(hx1 + 1, y);
        put(hx0, headTop + 2);
        break;
      case 'chignon':
        put(hx0, headTop + 2);
        put(hx1, headTop + 2);
        break;
    }
  }
  if (style === 'chignon') {
    // Chignon rond, porté vers l'arrière de la tête (à gauche quand on regarde à droite)
    const bx = hx0 - 1;
    p.rect(bx + 1, headTop - 3, 3, 1, c.base);
    p.rect(bx, headTop - 2, 4, 2, c.base);
    p.set(bx + 1, headTop - 3, c.light);
    p.set(bx + 3, headTop - 1, c.dark);
  }
}

/** Indice de frame → pas de marche et soulèvement du buste. */
function gait(frame: number, moving: boolean, t: number): { step: number; bob: number } {
  if (!moving) {
    // Respiration lente : le buste se soulève d'un pixel par intermittence
    const breath = Math.sin(t * 2.1) > 0.55 ? 1 : 0;
    return { step: 0, bob: breath };
  }
  const f = ((frame % 4) + 4) % 4;
  return f === 1 ? { step: 1, bob: 1 } : f === 3 ? { step: -1, bob: 1 } : { step: 0, bob: 0 };
}

export function characterSprite(look: CharacterLook, dir: Direction, frame: number, moving: boolean, t: number): Sprite {
  const r = resolve(look);
  const { step, bob } = gait(frame, moving, t);
  const key = `c:${r.group}:${look.sex}:${Math.round(look.hue)}:${r.seed}:${r.role}:${dir}:${step}:${bob}`;
  return cached(key, () => {
    const back = dir === 'n' || dir === 'e';
    // Vue de base tournée vers la droite ; miroir pour 'w' (face) et 'n' (dos)
    let p = drawBody(r, back, step, bob, look.sex);
    p.outline(0.42);
    if (dir === 'w' || dir === 'n') p = p.mirrored();
    return { pix: p, ax: CXL, ay: FOOT + 1 };
  });
}
