import { useState } from 'react';
import type { Settings } from '../../engine/types';

interface Props {
  settings: Settings;
  storageOk: boolean;
  exportText: () => string;
  onChange: (s: Partial<Settings>) => void;
  onImport: (text: string) => boolean;
  onReset: () => void;
  onBack: () => void;
}

export function SettingsScreen({ settings, storageOk, exportText, onChange, onImport, onReset, onBack }: Props) {
  const [dump, setDump] = useState('');
  const [message, setMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const copy = async () => {
    const text = exportText();
    setDump(text);
    try {
      await navigator.clipboard.writeText(text);
      setMessage('Sauvegarde copiée dans le presse-papiers.');
    } catch {
      setMessage('Copie impossible ici : sélectionnez le texte ci-dessous et copiez-le.');
    }
  };
  return (
    <main className="page">
      <div className="page-head">
        <h1>Réglages</h1>
        <button className="btn" onClick={onBack}>
          Retour
        </button>
      </div>
      <div className="settings-grid">
        <section className="card setting">
          <h2 style={{ fontSize: '1.4rem' }}>Récit</h2>
          <label className="toggle">
            <input id="soft-mode" type="checkbox" checked={settings.softMode} onChange={(e) => onChange({ softMode: e.target.checked })} />
            <span>
              <b>Mode atténué.</b> Les scènes difficiles (deuil, maladie, séparation) sont racontées plus brièvement, sans changer la suite de la
              vie.
            </span>
          </label>
          <label className="toggle">
            <input id="explore-mode" type="checkbox" checked={settings.explore !== false} onChange={(e) => onChange({ explore: e.target.checked })} />
            <span>
              <b>Scènes à explorer.</b> À certains moments clés, une courte scène en pixel art (1 à 3 minutes) permet d'incarner le personnage. On peut
              toujours la passer.
            </span>
          </label>
          <label className="toggle">
            <input id="auto-mode" type="checkbox" checked={settings.autoMode} onChange={(e) => onChange({ autoMode: e.target.checked })} />
            <span>
              <b>Mode automatique.</b> Le moteur prend les décisions à votre place, par un tirage reproductible. Vous pouvez reprendre la main à
              tout moment.
            </span>
          </label>
        </section>
        <section className="card setting">
          <h2 style={{ fontSize: '1.4rem' }}>Sauvegardes</h2>
          <p className="fine">
            {storageOk
              ? 'La partie en cours et l\'historique des vies sont enregistrés automatiquement dans ce navigateur, sur cet appareil uniquement. Rien n\'est envoyé sur un serveur.'
              : 'Le stockage du navigateur est indisponible ici (navigation privée ou aperçu). La partie reste en mémoire jusqu\'à la fermeture de la page : exportez-la pour la garder.'}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-small" onClick={copy}>
              Exporter (copier le texte)
            </button>
            <button
              className="btn btn-small"
              onClick={() => {
                const ok = onImport(dump);
                setMessage(ok ? 'Sauvegarde importée.' : 'Ce texte n\'est pas une sauvegarde valide de Destins de France.');
              }}
            >
              Importer le texte collé
            </button>
            {!confirmReset ? (
              <button className="btn btn-small btn-ghost" onClick={() => setConfirmReset(true)}>
                Tout effacer…
              </button>
            ) : (
              <button
                className="btn btn-small"
                style={{ borderColor: 'var(--warn)', color: 'var(--warn)' }}
                onClick={() => {
                  onReset();
                  setConfirmReset(false);
                  setMessage('Partie et historique effacés.');
                }}
              >
                Confirmer l'effacement définitif
              </button>
            )}
          </div>
          {message && (
            <p role="status" className="fine">
              {message}
            </p>
          )}
          <label htmlFor="save-text" className="fine">
            Texte de sauvegarde (à copier pour exporter, à coller pour importer)
          </label>
          <textarea id="save-text" value={dump} onChange={(e) => setDump(e.target.value)} spellCheck={false} />
        </section>
      </div>
    </main>
  );
}
