"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Category } from "@/types/topic";

type WheelProps = {
  categories: Category[];
  /** Index (dans `categories`) du segment sur lequel s'arrêter. */
  targetIndex: number | null;
  /** Jeton incrémenté à chaque lancer pour déclencher l'animation. */
  spinToken: number;
  onSpinEnd: () => void;
  disabled?: boolean;
};

const CENTER = 50;
const RADIUS = 48;

/** Point du cercle pour un angle mesuré en degrés, dans le sens horaire depuis le haut. */
function polarPoint(angleDeg: number, radius: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [CENTER + radius * Math.cos(a), CENTER + radius * Math.sin(a)];
}

function segmentPath(startAngle: number, endAngle: number): string {
  const [x1, y1] = polarPoint(startAngle, RADIUS);
  const [x2, y2] = polarPoint(endAngle, RADIUS);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

/**
 * Calcule la rotation cible : après l'animation, le centre du segment visé
 * doit se retrouver sous le pointeur (en haut). On ajoute plusieurs tours
 * complets et une légère variation aléatoire pour un rendu naturel.
 */
function computeTargetRotation(
  current: number,
  targetIndex: number,
  count: number,
): number {
  const segmentAngle = 360 / count;
  const segmentCenter = targetIndex * segmentAngle + segmentAngle / 2;
  const jitter = (Math.random() - 0.5) * segmentAngle * 0.6;
  const desiredMod = (((360 - segmentCenter + jitter) % 360) + 360) % 360;
  const currentMod = ((current % 360) + 360) % 360;
  let delta = desiredMod - currentMod;
  if (delta < 0) delta += 360;
  const extraSpins = 5;
  return current + delta + extraSpins * 360;
}

export function Wheel({
  categories,
  targetIndex,
  spinToken,
  onSpinEnd,
  disabled,
}: WheelProps) {
  const [rotation, setRotation] = useState(0);
  const spinningRef = useRef(false);
  const count = Math.max(categories.length, 1);
  const segmentAngle = 360 / count;

  useEffect(() => {
    if (spinToken === 0 || targetIndex == null || categories.length === 0) {
      return;
    }
    spinningRef.current = true;
    setRotation((prev) => computeTargetRotation(prev, targetIndex, count));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinToken]);

  const handleAnimationComplete = () => {
    if (!spinningRef.current) return;
    spinningRef.current = false;
    onSpinEnd();
  };

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px] select-none sm:max-w-[400px]">
      {/* Pointeur fixe */}
      <div className="absolute left-1/2 top-[-2px] z-20 -translate-x-1/2">
        <div
          className="h-0 w-0 border-l-[13px] border-r-[13px] border-t-[22px] border-l-transparent border-r-transparent drop-shadow-md"
          style={{ borderTopColor: "hsl(var(--foreground))" }}
        />
      </div>

      <motion.div
        className="h-full w-full"
        animate={{ rotate: rotation }}
        transition={{ duration: 4.4, ease: [0.16, 1, 0.3, 1] }}
        onAnimationComplete={handleAnimationComplete}
        style={{ transformOrigin: "50% 50%" }}
      >
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full drop-shadow-xl"
          role="img"
          aria-label="Roue des catégories"
        >
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS + 1.5}
            fill="hsl(var(--card))"
            stroke="hsl(var(--border))"
            strokeWidth={1}
          />
          {categories.map((category, index) => {
            const start = index * segmentAngle;
            const end = start + segmentAngle;
            const midAngle = start + segmentAngle / 2;
            const [ex, ey] = polarPoint(midAngle, RADIUS * 0.66);
            return (
              <g key={category.id}>
                <path
                  d={segmentPath(start, end)}
                  fill={`hsl(${category.color})`}
                  stroke="hsl(var(--card))"
                  strokeWidth={0.6}
                  opacity={0.92}
                />
                <text
                  x={ex}
                  y={ey}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={count > 12 ? 4.5 : 5.5}
                >
                  {category.emoji}
                  <title>{category.label}</title>
                </text>
              </g>
            );
          })}
        </svg>
      </motion.div>

      {/* Moyeu central */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-background bg-primary text-2xl text-primary-foreground shadow-lg">
        🎯
      </div>

      {disabled && (
        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-full bg-background/60 px-6 text-center text-sm font-medium text-muted-foreground backdrop-blur-sm">
          Aucun thème ne correspond à ces filtres.
        </div>
      )}
    </div>
  );
}
