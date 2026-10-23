import { useCallback, useEffect, useRef, useState } from 'react';
import { exportSave, importSave, loadSave, resetSave, storageAvailable, writeSave } from '../engine/save';
import { autoChoose, choose, createRun, DEFAULT_SETTINGS, step, updateSettings } from '../engine/simulation';
import { toLifeRecord } from '../engine/summary';
import type { LifeRecord, Settings, SimulationRun } from '../engine/types';
import { SourceSheet } from './components/common';
import { allowedCities, type CityId } from '../data/cities';
import { Birth } from './screens/Birth';
import { Cities } from './screens/Cities';
import { History } from './screens/History';
import { Home } from './screens/Home';
import { Library, type LibraryTab } from './screens/Library';
import { Life, lifeStage, type Speed } from './screens/Life';
import { SettingsScreen } from './screens/SettingsScreen';
import { Summary } from './screens/Summary';

type Screen = 'home' | 'birth' | 'life' | 'summary' | 'library' | 'history' | 'settings' | 'cities';

/** Durée réelle d'une année de vie selon la vitesse (ms). */
const YEAR_MS: Record<Exclude<Speed, 0>, number> = { 1: 3400, 2: 1700, 3: 650 };
const DEFAULT_SPEED: Record<Settings['format'], Speed> = { rapide: 3, standard: 2, immersif: 1 };

/** Seul point non déterministe : la graine d'une nouvelle vie. */
const freshSeed = () => (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;

export function App() {
  const initial = useRef(loadSave());
  const [run, setRun] = useState<SimulationRun | null>(initial.current.run);
  const [lives, setLives] = useState<LifeRecord[]>(initial.current.lives);
  const [unlocked, setUnlocked] = useState<string[]>(initial.current.unlockedCities ?? []);
  const [screen, setScreen] = useState<Screen>('home');
  const [back, setBack] = useState<Screen>('home');
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('sources');
  const [prefs, setPrefs] = useState<Settings>(initial.current.run?.settings ?? DEFAULT_SETTINGS);
  const [speed, setSpeed] = useState<Speed>(0);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const storageOk = storageAvailable();
  const lastSaveYear = useRef(0);

  // Sauvegarde : à chaque décision, à la fin de vie, et au plus tous les 5 ans de jeu.
  useEffect(() => {
    if (!run) return;
    const decisive = run.pending !== null || !run.alive;
    if (decisive || Math.abs(run.year - lastSaveYear.current) >= 5) {
      writeSave(run.alive ? run : null, lives, unlocked);
      lastSaveYear.current = run.year;
    }
  }, [run, lives, unlocked]);

  // Horloge : une seule source de progression, pilotée par l'état.
  useEffect(() => {
    if (screen !== 'life' || !run || !run.alive || run.pending || speed === 0) return;
    const t = window.setTimeout(() => setRun((r) => (r ? step(r) : r)), YEAR_MS[speed]);
    return () => window.clearTimeout(t);
  }, [screen, run, speed]);

  // Mode automatique : laisse le temps de lire avant de choisir.
  useEffect(() => {
    if (screen !== 'life' || !run?.pending || !run.settings.autoMode || speed === 0) return;
    const t = window.setTimeout(() => setRun((r) => (r ? autoChoose(r) : r)), speed === 3 ? 1500 : 3500);
    return () => window.clearTimeout(t);
  }, [screen, run, speed]);

  // Transition de chapitre de vie.
  const prevStage = useRef<string | null>(null);
  useEffect(() => {
    if (!run || screen !== 'life') return;
    const stage = lifeStage(run.age);
    if (prevStage.current && prevStage.current !== stage) {
      setFlash(stage);
      const t = window.setTimeout(() => setFlash(null), 2400);
      prevStage.current = stage;
      return () => window.clearTimeout(t);
    }
    prevStage.current = stage;
  }, [run, screen]);

  // Fin de vie → bilan et archivage (une seule fois par vie).
  useEffect(() => {
    if (run && !run.alive && screen === 'life') {
      const record = toLifeRecord(run);
      setLives((l) => (l.some((x) => x.id === record.id) ? l : [...l, record]));
      setSpeed(0);
      setScreen('summary');
    }
  }, [run, screen]);

  // Barre d'espace : pause / reprise.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (screen !== 'life' || e.code !== 'Space' || (e.target as HTMLElement)?.closest('button, input, textarea')) return;
      e.preventDefault();
      setSpeed((s) => (s === 0 ? DEFAULT_SPEED[prefs.format] : 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, prefs.format]);

  const go = (s: Screen) => {
    setBack(screen === 'library' || screen === 'history' || screen === 'settings' || screen === 'cities' ? back : screen);
    setScreen(s);
    window.scrollTo({ top: 0 });
  };

  const newBirth = useCallback((cityId?: CityId) => {
    setRun(createRun(freshSeed(), prefs, { cityId }));
    prevStage.current = null;
    setSpeed(0);
    setScreen('birth');
    window.scrollTo({ top: 0 });
  }, [prefs]);

  const changeSettings = (s: Partial<Settings>) => {
    const next = { ...prefs, ...s };
    setPrefs(next);
    setRun((r) => (r ? updateSettings(r, s) : r));
  };

  return (
    <div className="app">
      {screen === 'home' && (
        <Home
          hasSave={!!run?.alive}
          livesCount={lives.length}
          format={prefs.format}
          onFormat={(format) => changeSettings({ format })}
          onBirth={() => newBirth()}
          onCities={() => go('cities')}
          unlockedCount={unlocked.length}
          onResume={() => {
            setScreen('life');
            setSpeed(0);
          }}
          onNavigate={(s) => {
            if (s === 'method') {
              setLibraryTab('methode');
              go('library');
            } else {
              if (s === 'library') setLibraryTab('sources');
              go(s);
            }
          }}
        />
      )}
      {screen === 'birth' && run && (
        <Birth
          run={run}
          onSource={setSourceId}
          onReroll={() => newBirth(run.citizen.cityId as CityId | undefined)}
          onStart={() => {
            setScreen('life');
            setSpeed(DEFAULT_SPEED[prefs.format]);
          }}
        />
      )}
      {screen === 'life' && run && (
        <Life
          run={run}
          speed={speed}
          storageOk={storageOk}
          onSpeed={setSpeed}
          onChoose={(id) => setRun((r) => (r ? choose(r, id) : r))}
          onSource={setSourceId}
          onHome={() => {
            setSpeed(0);
            writeSave(run.alive ? run : null, lives, unlocked);
            setScreen('home');
          }}
          onToggleAuto={() => changeSettings({ autoMode: !run.settings.autoMode })}
        />
      )}
      {screen === 'summary' && run && (
        <Summary
          run={run}
          onNewLife={() => (run.citizen.cityId ? go('cities') : newBirth())}
          onHistory={() => go('history')}
          onHome={() => setScreen('home')}
          newCityAvailable={unlocked.length > 0 && unlocked.length < allowedCities(lives.length)}
        />
      )}
      {screen === 'cities' && (
        <Cities
          unlocked={unlocked}
          livesCount={lives.length}
          onBorn={(c) => newBirth(c)}
          onUnlock={(c) => {
            const next = [...unlocked, c];
            setUnlocked(next);
            writeSave(run?.alive ? run : null, lives, next);
          }}
          onBack={() => setScreen(back)}
        />
      )}
      {screen === 'library' && <Library initialTab={libraryTab} onSource={setSourceId} onBack={() => setScreen(back)} />}
      {screen === 'history' && <History lives={lives} onBack={() => setScreen(back)} />}
      {screen === 'settings' && (
        <SettingsScreen
          settings={prefs}
          storageOk={storageOk}
          exportText={() => exportSave(run?.alive ? run : null, lives, unlocked)}
          onChange={changeSettings}
          onImport={(text) => {
            const save = importSave(text);
            if (!save) return false;
            setRun(save.run);
            setLives(save.lives);
            setUnlocked(save.unlockedCities ?? []);
            writeSave(save.run, save.lives, save.unlockedCities ?? []);
            return true;
          }}
          onReset={() => {
            resetSave();
            setRun(null);
            setLives([]);
            setUnlocked([]);
          }}
          onBack={() => setScreen(back)}
        />
      )}
      {sourceId && <SourceSheet sourceId={sourceId} onClose={() => setSourceId(null)} />}
      {flash && (
        <div className="chapter-flash" aria-live="polite">
          <div>{flash}</div>
        </div>
      )}
    </div>
  );
}
