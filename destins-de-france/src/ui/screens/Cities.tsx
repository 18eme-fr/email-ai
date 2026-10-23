import { allowedCities, CITIES, LIVES_PER_UNLOCK, type CityId } from '../../data/cities';
import { CityCard } from '../art/CityCard';

interface Props {
  unlocked: string[];
  livesCount: number;
  onBorn: (city: CityId) => void;
  onUnlock: (city: CityId) => void;
  onBack: () => void;
}

/** Mode « Villes » : choisir où naître parmi les villes débloquées, et débloquer la suivante toutes les 10 vies. */
export function Cities({ unlocked, livesCount, onBorn, onUnlock, onBack }: Props) {
  const slots = allowedCities(livesCount);
  const canUnlock = unlocked.length < slots;
  const remaining = LIVES_PER_UNLOCK - (livesCount % LIVES_PER_UNLOCK);
  const allUnlocked = unlocked.length >= CITIES.length;
  return (
    <main className="page">
      <div className="page-head">
        <div style={{ display: 'grid', gap: 4 }}>
          <span className="eyebrow">Mode Villes</span>
          <h1>Où naître ?</h1>
        </div>
        <button className="btn" onClick={onBack}>
          Retour
        </button>
      </div>
      {canUnlock ? (
        <p className="notice" role="status">
          <b>{unlocked.length === 0 ? 'Choisissez votre première ville.' : 'Une nouvelle ville vous attend.'}</b>{' '}
          {unlocked.length === 0
            ? `Vous y naîtrez, puis une ville supplémentaire se débloquera toutes les ${LIVES_PER_UNLOCK} vies terminées.`
            : `Vous avez terminé ${livesCount} vies : choisissez la prochaine ville à ouvrir.`}
        </p>
      ) : (
        <p className="notice">
          {livesCount} vie{livesCount > 1 ? 's' : ''} terminée{livesCount > 1 ? 's' : ''}.{' '}
          {allUnlocked ? 'Toutes les villes sont ouvertes.' : `Prochaine ville dans ${remaining} vie${remaining > 1 ? 's' : ''} (toutes les vies comptent, y compris en hasard intégral).`}{' '}
          Seul le lieu est choisi : la famille, le quartier et les ressources restent tirés au hasard. Personne ne choisit vraiment où naître.
        </p>
      )}
      <div className="city-grid">
        {CITIES.map((c) => {
          const isOpen = unlocked.includes(c.id);
          const action = isOpen ? () => onBorn(c.id) : canUnlock ? () => onUnlock(c.id) : undefined;
          return (
            <button
              key={c.id}
              className={`card city-card${isOpen ? '' : ' is-locked'}${!isOpen && canUnlock ? ' is-unlockable' : ''}`}
              onClick={action}
              disabled={!action}
              aria-label={isOpen ? `Naître à ${c.name}` : canUnlock ? `Débloquer ${c.name}` : `${c.name}, verrouillée`}
            >
              <CityCard city={c.id} locked={!isOpen} />
              <span className="city-body">
                <span className="city-name">{c.name}</span>
                <span className="fine">{c.tagline}</span>
                {isOpen && <span className="city-ambiance">{c.ambiance}</span>}
                <span className="city-cta">{isOpen ? 'Naître ici' : canUnlock ? 'Débloquer cette ville' : 'Verrouillée'}</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="fine">
        Les descriptions d'ambiance sont des repères géographiques et historiques généraux, sans chiffre ; elles n'ont pas encore de fiche
        source dédiée.
      </p>
    </main>
  );
}
