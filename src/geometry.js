// =============================================================================
//  Géométrie 2D (plan au sol). Coordonnées en mètres.
//  Repère plan : (x, y). Dans la scène 3D : monde X = plan.x, monde Z = plan.y,
//  monde Y = altitude (hauteur). Voir viewer.js.
// =============================================================================

export function snap(value, step) {
  if (!step) return value;
  return Math.round(value / step) * step;
}

export function snapPoint(p, step) {
  return { x: snap(p.x, step), y: snap(p.y, step) };
}

export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Longueur d'un mur (segment entre ses deux extrémités).
export function wallLength(w) {
  return Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
}

// Angle du mur autour de l'axe vertical, pour orienter son groupe 3D.
// Le +x local du groupe doit pointer dans la direction (dx, dz=dy) du mur.
export function wallAngleY(w) {
  const dx = w.x2 - w.x1;
  const dy = w.y2 - w.y1;
  return Math.atan2(-dy, dx);
}

// Milieu du mur.
export function wallMid(w) {
  return { x: (w.x1 + w.x2) / 2, y: (w.y1 + w.y2) / 2 };
}

// Projette un point p sur la droite du mur ; renvoie l'abscisse curviligne
// t (distance depuis l'extrémité 1, non bornée) et le point projeté.
export function projectOnWall(w, p) {
  const dx = w.x2 - w.x1;
  const dy = w.y2 - w.y1;
  const len2 = dx * dx + dy * dy || 1e-9;
  const t = ((p.x - w.x1) * dx + (p.y - w.y1) * dy) / len2; // 0..1 le long du mur
  const len = Math.sqrt(len2);
  return {
    t: t * len, // en mètres depuis l'extrémité 1
    len,
    point: { x: w.x1 + t * dx, y: w.y1 + t * dy },
  };
}

// Distance d'un point au segment de mur (pour le picking / choix du mur).
export function distToWall(w, p) {
  const dx = w.x2 - w.x1;
  const dy = w.y2 - w.y1;
  const len2 = dx * dx + dy * dy || 1e-9;
  let t = ((p.x - w.x1) * dx + (p.y - w.y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = w.x1 + t * dx;
  const cy = w.y1 + t * dy;
  return Math.hypot(p.x - cx, p.y - cy);
}

// Aire d'un polygone (formule du lacet), en valeur absolue.
export function polygonArea(points) {
  let a = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p = points[i];
    const q = points[(i + 1) % n];
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
}

// Centroïde d'un polygone (pour poser l'étiquette).
export function polygonCentroid(points) {
  let a = 0, cx = 0, cy = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p = points[i];
    const q = points[(i + 1) % n];
    const cross = p.x * q.y - q.x * p.y;
    a += cross;
    cx += (p.x + q.x) * cross;
    cy += (p.y + q.y) * cross;
  }
  if (Math.abs(a) < 1e-9) {
    // Repli : moyenne des sommets.
    const m = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: m.x / n, y: m.y / n };
  }
  a *= 0.5;
  return { x: cx / (6 * a), y: cy / (6 * a) };
}

// Test point-dans-polygone (ray casting), pour le picking des zones.
export function pointInPolygon(p, points) {
  let inside = false;
  const n = points.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const a = points[i], b = points[j];
    const intersect =
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y || 1e-9) + a.x;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Rectangle (4 sommets, sens horaire) à partir de deux coins opposés.
export function rectFromCorners(a, b) {
  return [
    { x: a.x, y: a.y },
    { x: b.x, y: a.y },
    { x: b.x, y: b.y },
    { x: a.x, y: b.y },
  ];
}

// Boîte englobante d'un ensemble de points.
export function bbox(points) {
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (const p of points) {
    if (p.x < minx) minx = p.x; if (p.x > maxx) maxx = p.x;
    if (p.y < miny) miny = p.y; if (p.y > maxy) maxy = p.y;
  }
  return { minx, miny, maxx, maxy };
}

// {x, y, w, h} (coin bas-gauche + dimensions) d'un ensemble de points.
export function rectOf(points) {
  const b = bbox(points);
  return { x: b.minx, y: b.miny, w: b.maxx - b.minx, h: b.maxy - b.miny };
}

// Recouvrement de deux rectangles alignés (avec petite tolérance : les bords
// jointifs ne comptent pas comme un recouvrement).
export function rectsOverlap(a, b, eps = 0.02) {
  const ra = bbox(a), rb = bbox(b);
  return (
    ra.minx < rb.maxx - eps && rb.minx < ra.maxx - eps &&
    ra.miny < rb.maxy - eps && rb.miny < ra.maxy - eps
  );
}
