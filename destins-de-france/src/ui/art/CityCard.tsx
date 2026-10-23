import type { CSSProperties } from 'react';
import './art.css';
import { CITIES, type CityId } from './cities';
import { SceneCanvas } from './Scene';
import { H, W } from './sceneKit';

export interface CityCardProps {
  city: CityId;
  locked?: boolean;
  /** Largeur maximale en pixels (la carte est fluide, ratio 4:3). */
  size?: number;
}

const CROP_W = Math.round((H * 4) / 3);

/** Vignette « carte postale » 4:3 d'une ville, en plein jour ; voilée et cadenassée si verrouillée. */
export function CityCard(props: CityCardProps): JSX.Element {
  const { city, locked = false, size } = props;
  const info = CITIES[city];
  const x = Math.min(W - CROP_W, Math.max(0, info.focus - CROP_W / 2));
  // Fluide : occupe toute la largeur du conteneur ; `size` n'est qu'une largeur maximale
  const style: CSSProperties | undefined = size ? { maxWidth: size } : undefined;

  return (
    <div
      className={locked ? 'art-card art-card--locked' : 'art-card'}
      style={style}
      role="img"
      aria-label={locked ? `${info.name} — ville verrouillée` : `Carte postale de ${info.name}`}
    >
      <div className="art-card__picture">
        <SceneCanvas
          territory="metropole"
          landscape="plaine"
          city={city}
          age={36}
          paused
          decorative
          height={300}
          viewBox={`${x} 0 ${CROP_W} ${H}`}
          className="art-card__scene"
        />
        {/* Cachet postal */}
        <svg className="art-card__overlay" viewBox="0 0 400 300" preserveAspectRatio="xMaxYMin meet" aria-hidden="true">
          <g className="art-card__postmark" transform="translate(352 40)">
            <circle r={22} />
            <circle r={16} />
            <path d="M-60 -6q7.5 -6 15 0t15 0t15 0M-60 6q7.5 -6 15 0t15 0t15 0" />
          </g>
        </svg>
        {locked ? (
          <svg className="art-card__lock" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx={50} cy={50} r={30} className="art-card__lock-disc" />
            <path d="M39 47V40a11 11 0 0 1 22 0v7" className="art-card__lock-shackle" />
            <rect x={34} y={46} width={32} height={24} rx={4} className="art-card__lock-body" />
            <circle cx={50} cy={56} r={3} className="art-card__lock-hole" />
            <rect x={48.8} y={57} width={2.4} height={7} rx={1} className="art-card__lock-hole" />
          </svg>
        ) : null}
      </div>
      <span className="art-card__name">{info.name}</span>
    </div>
  );
}
