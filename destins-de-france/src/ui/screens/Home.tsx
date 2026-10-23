import type { Settings } from '../../engine/types';
import { Emblem } from '../art/Emblem';

interface Props {
  hasSave: boolean;
  livesCount: number;
  format: Settings['format'];
  onFormat: (f: Settings['format']) => void;
  onBirth: () => void;
  onCities: () => void;
  unlockedCount: number;
  onResume: () => void;
  onNavigate: (screen: 'library' | 'history' | 'settings' | 'method') => void;
}

const FORMATS: { id: Settings['format']; label: string; hint: string }[] = [
  { id: 'rapide', label: 'Rapide', hint: 'environ 15 à 30 min' },
  { id: 'standard', label: 'Standard', hint: 'environ 45 à 60 min' },
  { id: 'immersif', label: 'Immersif', hint: '90 min ou plus' },
];

export function Home({ hasSave, livesCount, format, onFormat, onBirth, onCities, unlockedCount, onResume, onNavigate }: Props) {
  return (
    <main className="home">
      <section className="home-hero">
        <Emblem size={150} />
        <div>
          <p className="eyebrow">Simulateur de vie · prototype 0.1</p>
          <h1 className="home-title">
            Destins <em>de</em> France
          </h1>
          <p className="home-lede">
            Vous allez naître quelque part en France, en 2026. Vous ne choisirez ni votre famille, ni votre ville, ni ce qu'il y aura dans le
            frigo. Ensuite, ce sera à vous : une vie entière de choix, de contraintes et de hasards.
          </p>
          <div className="home-actions">
            <button className="btn btn-primary" onClick={onBirth} title="Lieu, famille et ressources tirés au hasard">
              Naître
            </button>
            <button className="btn" onClick={onCities}>
              {unlockedCount === 0 ? 'Mode Villes : choisir une ville' : `Mode Villes (${unlockedCount} ville${unlockedCount > 1 ? 's' : ''})`}
            </button>
            {hasSave && (
              <button className="btn" onClick={onResume}>
                Reprendre la vie en cours
              </button>
            )}
          </div>
          <div className="formats" style={{ marginTop: 16 }} role="group" aria-label="Durée de partie">
            <span className="fine">Rythme :</span>
            {FORMATS.map((f) => (
              <button key={f.id} className="chip" aria-pressed={format === f.id} onClick={() => onFormat(f.id)} title={f.hint}>
                {f.label} <span className="fine">· {f.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="home-grid" aria-label="Explorer">
        <button className="card home-tile" onClick={() => onNavigate('history')}>
          <span className="eyebrow">Mémoire</span>
          <h3>Vies passées</h3>
          <p className="muted">{livesCount === 0 ? 'Aucune vie terminée pour l\'instant.' : `${livesCount} vie${livesCount > 1 ? 's' : ''} à comparer.`}</p>
        </button>
        <button className="card home-tile" onClick={() => onNavigate('library')}>
          <span className="eyebrow">Sources</span>
          <h3>Bibliothèque documentaire</h3>
          <p className="muted">Chaque donnée réelle du jeu, sa source, sa méthode et ses limites.</p>
        </button>
        <button className="card home-tile" onClick={() => onNavigate('method')}>
          <span className="eyebrow">Méthode</span>
          <h3>Comment le jeu est construit</h3>
          <p className="muted">Ce qui est observé, modélisé, supposé ou inventé — et ce qui ne l'est pas encore.</p>
        </button>
        <button className="card home-tile" onClick={() => onNavigate('settings')}>
          <span className="eyebrow">Réglages</span>
          <h3>Paramètres et sauvegardes</h3>
          <p className="muted">Mode atténué, mode automatique, export et import des sauvegardes.</p>
        </button>
      </section>

      <p className="notice">
        <b>À savoir avant de jouer.</b> Le jeu aborde la précarité, la maladie, le deuil, la séparation ou le chômage, avec sobriété. Un
        mode atténué est disponible dans les réglages. Les personnages sont fictifs. Tout ce qui se passe après octobre 2026 est un scénario
        hypothétique, jamais une prévision. Ce prototype n'a pas encore la précision scientifique visée : les paramètres provisoires sont
        signalés comme tels.
      </p>
    </main>
  );
}
