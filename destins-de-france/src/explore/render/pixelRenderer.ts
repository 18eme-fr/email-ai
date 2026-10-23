import type { Renderer } from './contract';
import { characterSprite } from './characters';
import { INK, WHITE } from './palette';
import { Pix, blit, cached, hex, type Sprite } from './pixelKit';
import { propSprite } from './props';
import { floorSprite, wallSprite } from './tiles';

/**
 * Rendu pixel art pseudo-isométrique. Chaque sprite est rastérisé une seule
 * fois dans un petit canvas hors écran (cache par clé), puis posé avec
 * `drawImage` aux coordonnées entières : aucun lissage.
 */

function shadowSprite(w: number): Sprite {
  const ww = Math.max(4, Math.round(w));
  return cached(`s:${ww}`, () => {
    const hh = Math.max(2, Math.round(ww / 2.6));
    const p = new Pix(ww + 2, hh + 2);
    p.ellipse((ww + 2) / 2, (hh + 2) / 2, ww / 2, hh / 2, [26, 18, 40, 72]);
    // Cœur un peu plus dense, toujours net
    p.ellipse((ww + 2) / 2, (hh + 2) / 2, ww / 3, hh / 3, [26, 18, 40, 40]);
    return { pix: p, ax: Math.floor((ww + 2) / 2), ay: Math.floor((hh + 2) / 2) };
  });
}

const GLYPH_PARLER = ['.#.', '.#.', '.#.', '...', '.#.'];
const GLYPH_INFO = ['.#.', '...', '##.', '.#.', '###'];

function promptSprite(kind: 'parler' | 'info'): Sprite {
  return cached(`b:${kind}`, () => {
    const p = new Pix(11, 12);
    // Bulle arrondie et sa pointe
    p.rect(1, 0, 9, 9, WHITE);
    p.rect(0, 1, 11, 7, WHITE);
    p.rect(4, 9, 3, 1, WHITE);
    p.set(5, 10, WHITE);
    p.rect(1, 7, 9, 1, hex('#e6dccb'));
    const color = kind === 'parler' ? hex('#e76f51') : hex('#2e7d6f');
    const glyph = kind === 'parler' ? GLYPH_PARLER : GLYPH_INFO;
    glyph.forEach((line, y) => {
      for (let x = 0; x < line.length; x++) if (line[x] === '#') p.set(4 + x, 2 + y, color);
    });
    p.outline(0.4, INK);
    return { pix: p, ax: 5, ay: 11 };
  });
}

export const pixelRenderer: Renderer = {
  background: '#1c2135',

  drawFloor(ctx, kind, sx, sy, variant) {
    blit(ctx, floorSprite(kind, variant), sx, sy);
  },

  drawWall(ctx, kind, sx, sy, faces, variant) {
    blit(ctx, wallSprite(kind, faces, variant), sx, sy);
  },

  drawProp(ctx, kind, sx, sy, accent, variant) {
    blit(ctx, propSprite(kind, accent, variant), sx, sy);
  },

  drawCharacter(ctx, look, dir, frame, moving, sx, sy, t) {
    blit(ctx, characterSprite(look, dir, frame, moving, t), sx, sy);
  },

  drawPrompt(ctx, sx, sy, kind, t) {
    // Flottement doux, au pixel près
    const bob = Math.round(Math.sin(t * 3) * 1.5);
    blit(ctx, promptSprite(kind), sx, sy + bob);
  },

  drawShadow(ctx, sx, sy, w) {
    blit(ctx, shadowSprite(w), sx, sy);
  },
};
