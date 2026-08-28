'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import Toolbar from './Toolbar';
import RegionPanel from './RegionPanel';
import CompareView from './CompareView';
import LearnQuiz from './LearnQuiz';
import LevelLegend from './LevelLegend';
import { useAtlas } from '@/state/store';

// La carte est strictement côté client (WebGL) : import dynamique sans SSR.
const AtlasMap = dynamic(() => import('./AtlasMap'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-paper">
      <div className="flex flex-col items-center gap-3 text-ink-muted">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
        <p className="text-sm">Chargement de la carte…</p>
      </div>
    </div>
  ),
});

export default function AtlasShell() {
  const hydrateFavorites = useAtlas((s) => s.hydrateFavorites);

  useEffect(() => {
    hydrateFavorites();
  }, [hydrateFavorites]);

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-paper">
      <AtlasMap />
      <Toolbar />
      <LevelLegend />
      <RegionPanel />
      <CompareView />
      <LearnQuiz />
    </main>
  );
}
