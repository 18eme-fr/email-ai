import type { CharacterLook, Direction } from './contract';
import { HAIR, HAIR_GRAY, HAIR_WHITE, INK, PANTS, SKIN, SKIN_MOUTH, WHITE, hueRamp, type Ramp } from './palette';
import { Pix, cached, dith, hash, hex, mix, shade, type RGBA, type Sprite } from './pixelKit';

/**
 * Personnages ~14×28 px (contour compris), vus de 3/4. Vue de base tournée
 * vers la droite de l'écran ; les autres directions s'obtiennent par miroir
 * et par vue de dos. Sprite 20×34, pieds sur la rangée FOOT, centrés en CX.
 */
const CW = 20;
const CH = 34;
const FOOT = 31;
const CX = 10; // première colonne à droite de l'axe du corps

type AgeGroup = 'enfant' | 'ado' | 'adulte' | 'aine';

interface Build {
  headW: number;
  headH: number;
  /** Demi-largeur du buste. */
  half: number;
  torsoH: number;
  legH: number;
  neck: number;
  armW: number;
}

const BUILDS: Record<AgeGroup, Build> = {
  enfant: { headW: 6, headH: 6, half: 3, torsoH: 6, legH: 6, neck: 0, armW: 1 },
  ado: { headW: 6, headH: 7, half: 4, torsoH: 8, legH: 8, neck: 1, armW: 2 },
  adulte: { headW: 6, headH: 7, half: 4, torsoH: 9, legH: 9, neck: 1, armW: 2 },
  aine: { headW: 6, headH: 7, half: 4, torsoH: 9, legH: 8, neck: 0, armW: 2 },
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
  sex: 'F' | 'M';
  hair: HairStyle;
  hairC: Ramp;
  shirt: Ramp;
  pants: Ramp;
  shoes: Ramp;
  glasses: boolean;
  role: NonNullable<CharacterLook['role']> | 'aucun';
  seed: number;
}

const SHOES_DARK: Ramp = { hi: hex('#7a7076'), light: hex('#5c5358'), base: hex('#433b40'), dark: hex('#332c31'), deep: hex('#241f23') };
const SHOES_WHITE: Ramp = { hi: hex('#ffffff'), light: hex('#f2efe9'), base: hex('#e2ded6'), dark: hex('#c4bfb6'), deep: hex('#9f9a92') };

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
    sex: look.sex,
    hair,
    hairC,
    shirt: hueRamp(look.hue, 0.38, 0.54),
    pants: pick(PANTS, hash(seed, 4), PANTS[0]!),
    shoes: (role === 'eleve' || group === 'enfant') && hash(seed, 5) < 0.55 ? SHOES_WHITE : SHOES_DARK,
    glasses: hash(seed, 6) < (group === 'aine' ? 0.55 : group === 'adulte' ? 0.25 : group === 'ado' ? 0.12 : 0),
    role,
    seed,
  };
}

/** Géométrie d'une pose. */
interface Frame {
  headTop: number;
  headBottom: number;
  hx0: number;
  hx1: number;
  torsoTop: number;
  legTop: number;
  tx0: number;
  tx1: number;
  eyeY: number;
}

/**
 * Dessine une vue (face ou dos) tournée vers la droite.
 * `step` : -1, 0 ou 1 (jambe avancée) ; `bob` : 0 ou 1 (buste soulevé).
 */
function drawBody(r: Resolved, back: boolean, step: number, bob: number): Pix {
  const p = new Pix(CW, CH);
  const b = r.build;
  const elder = r.group === 'aine';
  const legTop = FOOT - b.legH;
  const torsoTop = legTop - b.torsoH - bob;
  const headBottom = torsoTop - b.neck - 1 + (elder ? 1 : 0);
  const headTop = headBottom - b.headH + 1;
  const lean = elder ? 1 : 0;
  const hx0 = CX - b.headW / 2 + lean;
  const hx1 = hx0 + b.headW - 1;
  const tx0 = CX - b.half;
  const tx1 = CX + b.half - 1;
  const f: Frame = { headTop, headBottom, hx0, hx1, torsoTop, legTop, tx0, tx1, eyeY: headTop + 3 };
  const S = SKIN;
  const sh = r.shirt;
  const pa = r.pants;

  // —— Jambes : la jambe levée est plus courte, genou marqué
  const lift = (side: number): number => (step === side ? 1 : 0);
  const legs: Array<[number, number, number]> = [
    // [x début, largeur, côté]
    [tx0, b.half, -1],
    [CX, b.half, 1],
  ];
  for (const [x0, w, side] of legs) {
    const l = lift(side === -1 ? 1 : -1);
    const top = legTop - bob;
    const bottom = FOOT - 1 - l;
    for (let y = top; y <= bottom; y++) {
      const lower = y > legTop + 2;
      for (let x = x0; x < x0 + w; x++) {
        // Entrejambe : léger creux entre les jambes sur le bas
        if (lower && ((side === -1 && x === x0 + w - 1) || (side === 1 && x === x0))) continue;
        let c = side === -1 ? pa.base : pa.dark;
        if (x === x0 && side === -1) c = pa.light;
        if (x === x0 + w - 1 && side === 1) c = pa.deep;
        // Pli du genou et ourlet
        if (y === top + Math.floor(b.legH / 2) + 1 && x === x0 + 1) c = shade(c, 0.85);
        if (y === bottom) c = mix(c, pa.deep, 0.4);
        p.set(x, y, c);
      }
    }
    // Chaussure, pointe vers la droite
    const sy = FOOT - l;
    const sw = w + (back ? 0 : 1);
    for (let x = x0; x < x0 + sw; x++) p.set(x, sy, x === x0 ? r.shoes.light : side === 1 ? r.shoes.dark : r.shoes.base);
  }

  // —— Buste : épaules arrondies, plis, ceinture
  for (let y = torsoTop; y < legTop - bob + 1 && y < legTop + 1; y++) {
    for (let x = tx0; x <= tx1; x++) {
      const first = y === torsoTop;
      if (first && (x === tx0 || x === tx1)) continue;
      if (elder && first && (x === tx0 + 1 || x === tx1 - 1)) continue;
      // Taille un peu plus marquée (subtil)
      if (r.sex === 'F' && r.group !== 'enfant' && y === legTop - 3 && (x === tx0 || x === tx1)) continue;
      const rel = (x - tx0) / Math.max(1, tx1 - tx0);
      let c = rel < 0.15 ? sh.light : rel > 0.85 ? sh.dark : sh.base;
      if (first && rel < 0.5) c = sh.hi;
      // Plis : diagonale sous l'aisselle et au ventre
      if (!back && y === torsoTop + 3 && x === tx1 - 2) c = sh.dark;
      if (!back && y === torsoTop + 4 && x === tx1 - 3) c = mix(sh.base, sh.dark, 0.6);
      if (back && x === CX - 1 && y > torsoTop + 1 && y < legTop - 1) c = mix(sh.base, sh.dark, 0.4);
      if (y >= legTop - bob - 1) c = y === legTop - bob - 1 ? sh.dark : pa.deep;
      p.set(x, y, c);
    }
  }
  // Ceinture / bas du vêtement
  for (let x = tx0; x <= tx1; x++) p.set(x, legTop - bob, x === tx0 + 2 ? pa.light : pa.deep);

  // —— Bras qui balancent, mains lisibles (2 px)
  const armTop = torsoTop + 1;
  const armLen = b.torsoH - 3;
  const drawArm = (x0: number, swing: number, light: boolean): void => {
    const len = armLen + swing;
    for (let y = armTop; y < armTop + len; y++) {
      for (let x = x0; x < x0 + b.armW; x++) {
        let c = light ? (x === x0 ? sh.light : sh.base) : x === x0 + b.armW - 1 ? sh.deep : sh.dark;
        if (y === armTop + Math.floor(len / 2) && x === x0) c = shade(c, 0.88); // pli du coude
        p.set(x, y, c);
      }
    }
    for (let x = x0; x < x0 + b.armW; x++) {
      p.set(x, armTop + len, light ? S.base : S.dark);
      if (b.armW > 1) p.set(x, armTop + len + 1, light ? S.dark : S.deep);
    }
  };
  drawArm(tx0 - b.armW, -step, true);
  drawArm(tx1 + 1, step, false);

  // —— Cou
  const neckTop = headBottom + 1;
  for (let y = neckTop; y < torsoTop; y++) p.rect(CX - 1 + lean, y, 2, 1, S.dark);
  if (!back) p.set(CX - 1, torsoTop, S.base);

  roleDetails(p, r, back, f);

  // —— Tête : 4 tons, oreille côté nuque, traits fins
  for (let y = headTop; y <= headBottom; y++) {
    for (let x = hx0; x <= hx1; x++) {
      const corner = (y === headTop || y === headBottom) && (x === hx0 || x === hx1);
      if (corner) continue;
      let c = S.base;
      if (x === hx1) c = S.dark;
      if (y === headBottom) c = x === hx1 ? S.deep : S.dark;
      if (x === hx0 && y < headBottom - 1) c = S.light;
      if (x === hx0 + 1 && y === headTop + 1) c = S.hi;
      p.set(x, y, c);
    }
  }
  const eyeY = f.eyeY;
  if (!back) {
    const e1 = hx0 + 2;
    const e2 = hx0 + 4;
    // Oreille côté nuque
    p.set(hx0 - 1, eyeY + 1, S.dark);
    p.set(e1, eyeY, INK);
    p.set(e2, eyeY, INK);
    if (r.group !== 'enfant' && !r.glasses) {
      p.set(e1, eyeY - 1, mix(r.hairC.dark, S.base, 0.3));
      p.set(e2, eyeY - 1, mix(r.hairC.dark, S.base, 0.3));
    } else {
      p.set(e1 - 1, eyeY + 1, mix(S.base, hex('#d99a8a'), 0.35));
    }
    // Nez (ombre) et bouche
    p.set(e2, eyeY + 1, S.dark);
    if (b.headH >= 7) p.set(e1 + 1, eyeY + 2, SKIN_MOUTH);
    else p.set(e1 + 1, eyeY + 2, mix(SKIN_MOUTH, S.base, 0.4));
    if (elder) p.set(e2 + 1, eyeY + 1, S.dark);
    if (r.glasses) {
      const frame = mix(INK, S.dark, 0.45);
      p.set(e1 - 1, eyeY, frame);
      p.set(e1 + 1, eyeY, frame);
      p.set(e2 + 1, eyeY, frame);
    }
  } else {
    p.set(hx0 - 1, eyeY + 1, S.dark);
  }
  drawHair(p, r, back, f);
  return p;
}

function roleDetails(p: Pix, r: Resolved, back: boolean, f: Frame): void {
  const { torsoTop, legTop, tx0, tx1 } = f;
  const mid = CX;
  const inside = (fn: (x: number, y: number) => RGBA | null, y0 = torsoTop, y1 = legTop - 1): void => {
    for (let y = y0; y <= y1; y++) {
      for (let x = tx0 - 2; x <= tx1 + 2; x++) {
        if (p.alpha(x, y) === 0) continue;
        const c = fn(x, y);
        if (c) p.set(x, y, c);
      }
    }
  };
  switch (r.role) {
    case 'eleve': {
      const bag = hueRamp(hash(r.seed, 9) * 360, 0.32, 0.46);
      if (back) {
        for (let y = torsoTop + 1; y < legTop - 1; y++) {
          for (let x = tx0; x <= tx1; x++) p.set(x, y, x === tx0 ? bag.light : x === tx1 ? bag.dark : y === torsoTop + 1 ? bag.hi : bag.base);
        }
        p.rect(tx0 + 1, legTop - 4, tx1 - tx0 - 1, 1, bag.deep);
        p.set(mid, torsoTop + 3, bag.deep);
      } else {
        p.rect(tx0 + 1, torsoTop, 1, 4, bag.dark);
        p.rect(tx1 - 1, torsoTop, 1, 4, bag.deep);
        p.rect(tx1 + 1, torsoTop + 1, 1, 3, bag.base);
      }
      break;
    }
    case 'enseignant': {
      // Veste ouverte, chemise claire, cravate
      const jacket = hueRamp(220, 0.12, 0.34);
      inside((x, y) => {
        if (!back && x >= mid - 1 && x <= mid && y < legTop - 2) return null;
        const rel = (x - tx0) / Math.max(1, tx1 - tx0);
        if (x < tx0 || x > tx1) return x < tx0 ? jacket.light : jacket.dark;
        return rel < 0.15 ? jacket.light : rel > 0.85 ? jacket.dark : y === torsoTop ? jacket.hi : jacket.base;
      });
      if (!back) {
        p.rect(mid - 1, torsoTop, 2, legTop - torsoTop - 2, WHITE);
        p.rect(mid, torsoTop + 1, 1, 4, hex('#8a4651'));
        p.set(mid, torsoTop + 5, hex('#6b343d'));
        p.set(mid - 2, torsoTop + 1, jacket.hi); // revers
        p.set(mid + 1, torsoTop + 1, jacket.dark);
      }
      break;
    }
    case 'conseiller': {
      const lan = hex('#3f8a7c');
      if (!back) {
        p.line(mid - 2, torsoTop, mid - 1, torsoTop + 3, lan);
        p.line(mid + 1, torsoTop, mid, torsoTop + 3, lan);
        p.rect(mid - 1, torsoTop + 4, 3, 3, WHITE);
        p.rect(mid - 1, torsoTop + 4, 3, 1, hex('#69b8a8'));
        p.set(mid, torsoTop + 6, hex('#c8c3ba'));
      } else {
        p.rect(mid - 2, torsoTop, 4, 1, lan);
      }
      break;
    }
    case 'artisan': {
      const apron = hash(r.seed, 10) < 0.5;
      const c = apron ? hueRamp(30, 0.25, 0.42) : hueRamp(214, 0.35, 0.4);
      if (!back) {
        inside(
          (x, y) => {
            if (x < tx0 + 1 || x > tx1 - 1) return null;
            if (apron && y < torsoTop + 3 && (x === tx0 + 2 || x === tx1 - 2)) return c.dark;
            if (apron && y < torsoTop + 3) return null;
            return x === tx1 - 1 ? c.dark : x === tx0 + 1 ? c.light : c.base;
          },
          torsoTop,
          legTop + 3,
        );
        p.rect(mid - 1, torsoTop + 5, 3, 2, c.dark); // poche
        p.set(mid - 1, torsoTop + 5, c.deep);
      } else {
        p.line(tx0 + 1, torsoTop, tx1 - 1, legTop - 1, c.base);
        p.line(tx1 - 1, torsoTop, tx0 + 1, legTop - 1, c.base);
      }
      break;
    }
    case 'agent': {
      const vest = hueRamp(225, 0.25, 0.3);
      inside((x, y) => {
        if (x < tx0 || x > tx1) return null;
        if (!back && x >= mid - 1 && x <= mid && y < torsoTop + 3) return null;
        if (y === torsoTop + 4) return hex('#d6d9dc');
        return x === tx0 ? vest.light : x === tx1 ? vest.dark : vest.base;
      });
      break;
    }
    case 'parent': {
      // Sacoche en bandoulière
      const strap = hueRamp(24, 0.3, 0.32);
      p.line(tx0 + 1, torsoTop, tx1, legTop - 2, strap.base);
      p.rect(tx1, legTop - 2, 3, 3, back ? strap.dark : strap.base);
      p.set(tx1, legTop - 2, strap.light);
      break;
    }
    case 'aucun':
      if (!back) {
        // Col en V
        p.set(mid - 1, torsoTop + 1, SKIN.dark);
        p.set(mid, torsoTop, SKIN.base);
      }
      break;
  }
}

function drawHair(p: Pix, r: Resolved, back: boolean, f: Frame): void {
  const { hx0, hx1, headTop, headBottom, torsoTop } = f;
  const c = r.hairC;
  const put = (x: number, y: number): void => {
    // Reflet haut-gauche, ombre côté droit
    const col = x >= hx1 ? c.dark : x <= hx0 + 1 && y <= headTop ? c.light : c.base;
    p.set(x, y, col);
  };
  const row = (y: number, x0: number, x1: number): void => {
    for (let x = x0; x <= x1; x++) put(x, y);
  };
  const style = r.hair;
  const thin = style === 'rase';

  if (!thin) row(headTop - 1, hx0 + 1, hx1 - 1);
  row(headTop, hx0, hx1);
  if (!thin) row(headTop + 1, hx0, hx1);
  if (thin) for (let x = hx0 + 1; x < hx1; x++) p.set(x, headTop - 1, mix(c.base, SKIN.base, 0.4));
  // Mèche de reflet
  if (!thin) {
    p.set(hx0 + 2, headTop - 1, c.hi);
    p.set(hx0 + 1, headTop, c.light);
  }

  if (back) {
    const short = style === 'rase' || style === 'court' || style === 'raie' || style === 'frange';
    for (let y = headTop; y <= (short ? headBottom - 1 : headBottom); y++) row(y, hx0, hx1);
    p.set(hx0 + 1, headTop + 2, c.light);
    p.set(hx1 - 1, headTop + 3, c.dark);
    if (style === 'long') {
      for (let y = headBottom + 1; y <= torsoTop + 4; y++) row(y, hx0, hx1);
      p.set(hx0 + 2, torsoTop + 4, c.dark);
    }
    if (style === 'queue') {
      for (let y = headBottom; y <= torsoTop + 3; y++) p.set(CX - 1, y, y % 2 ? c.base : c.dark);
    }
    if (style === 'carre') row(headBottom, hx0 - 1, hx1 + 1);
    if (style === 'boucles') {
      for (let y = headTop - 1; y <= headBottom; y++) {
        put(hx0 - 1, y);
        put(hx1 + 1, y);
      }
    }
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
        p.set(hx0 + 3, headTop, c.dark);
        break;
      case 'rase':
        break;
      case 'boucles':
        for (let y = headTop - 1; y <= headTop + 3; y++) {
          put(hx0 - 1, y);
          put(hx1 + 1, y);
        }
        for (let x = hx0; x <= hx1; x++) p.set(x, headTop - 2, (x - hx0) % 2 === 0 ? c.base : c.dark);
        for (let x = hx0; x <= hx1; x += 2) p.set(x, headTop, c.dark);
        put(hx0, headTop + 2);
        break;
      case 'long':
        for (let y = headTop; y <= torsoTop + 3; y++) {
          put(hx0 - 1, y);
          if (y <= headBottom + 1) p.set(hx1 + 1, y, c.dark);
        }
        for (let y = headTop + 2; y <= headBottom - 1; y++) put(hx0, y);
        put(hx0 + 1, headTop + 2);
        break;
      case 'carre':
        for (let y = headTop; y <= headBottom; y++) {
          put(hx0 - 1, y);
          p.set(hx1 + 1, y, c.dark);
        }
        row(headTop + 2, hx0, hx1 - 1);
        put(hx0, headTop + 3);
        break;
      case 'queue':
        // Queue de cheval visible derrière la nuque
        for (let y = headTop + 1; y <= headTop + 6; y++) p.set(hx0 - 1 - (y > headTop + 4 ? 1 : 0), y, y % 2 ? c.base : c.dark);
        put(hx0, headTop + 2);
        break;
      case 'chignon':
        put(hx0, headTop + 2);
        put(hx1, headTop + 2);
        break;
    }
  }
  if (style === 'chignon') {
    const bx = back ? hx0 + 1 : hx0 - 1;
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
    return { step: 0, bob: Math.sin(t * 2.1) > 0.55 ? 1 : 0 };
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
    let p = drawBody(r, back, step, bob);
    p.outline(0.4);
    // Vue de base tournée vers la droite ; miroir pour 'w' (face) et 'n' (dos)
    if (dir === 'w' || dir === 'n') p = p.mirrored();
    // Dégradé d'occlusion discret au bas des jambes (tramé)
    for (let y = FOOT - 2; y <= FOOT; y++) {
      for (let x = 0; x < CW; x++) {
        const a = p.alpha(x, y);
        if (a > 200 && y < FOOT && dith(x, y, 0.3, [0, 0, 0, 0], [1, 1, 1, 1])[3] === 1) p.set(x, y, shade(p.get(x, y), 0.9));
      }
    }
    return { pix: p, ax: CX, ay: FOOT + 1 };
  });
}
