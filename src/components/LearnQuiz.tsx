'use client';

import { useMemo, useState } from 'react';
import { REGIONS } from '@/data/regions';
import { GRAPES, GRAPE_BY_ID } from '@/data/grapes';
import { useAtlas } from '@/state/store';

interface Question {
  prompt: string;
  options: string[];
  answer: string;
  note?: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Questions dérivées des données (réponses vérifiables, non inventées). */
function buildQuiz(): Question[] {
  const questions: Question[] = [];

  // A — cépage dominant, lorsqu'une part de 100 % est renseignée.
  const monocepage = REGIONS.filter((r) =>
    r.grapes.some((g) => g.share === 100 && g.role === 'principal'),
  );
  for (const r of shuffle(monocepage).slice(0, 4)) {
    const g = r.grapes.find((x) => x.share === 100)!;
    const correct = GRAPE_BY_ID.get(g.grapeId)?.name ?? g.grapeId;
    const distractors = shuffle(GRAPES.filter((x) => x.id !== g.grapeId).map((x) => x.name)).slice(0, 3);
    questions.push({
      prompt: `Quel cépage domine à ${r.name} ?`,
      options: shuffle([correct, ...distractors]),
      answer: correct,
      note: r.country,
    });
  }

  // B — pays d'une région.
  const named = REGIONS.filter((r) => r.level !== 'country');
  const countries = [...new Set(REGIONS.map((r) => r.country))];
  for (const r of shuffle(named).slice(0, 3)) {
    const distractors = shuffle(countries.filter((c) => c !== r.country)).slice(0, 3);
    questions.push({
      prompt: `Dans quel pays se trouve « ${r.name} » ?`,
      options: shuffle([r.country, ...distractors]),
      answer: r.country,
    });
  }

  return shuffle(questions).slice(0, 6);
}

export default function LearnQuiz() {
  const learnOpen = useAtlas((s) => s.learnOpen);
  const setLearnOpen = useAtlas((s) => s.setLearnOpen);

  const [seed, setSeed] = useState(0);
  const quiz = useMemo(() => buildQuiz(), [seed]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (!learnOpen) return null;
  const q = quiz[index];

  function restart() {
    setSeed((s) => s + 1);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  }

  function pick(opt: string) {
    if (picked) return;
    setPicked(opt);
    if (opt === q.answer) setScore((s) => s + 1);
  }

  function next() {
    if (index + 1 >= quiz.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setPicked(null);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-paper-card p-6 shadow-float">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl font-medium text-ink">Mode apprentissage</h2>
          <button
            onClick={() => {
              setLearnOpen(false);
              restart();
            }}
            className="rounded-full p-1.5 text-ink-muted transition-colors hover:bg-paper-soft hover:text-ink"
            aria-label="Fermer"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {done ? (
          <div className="py-6 text-center">
            <p className="font-serif text-3xl font-medium text-accent">
              {score} / {quiz.length}
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              {score === quiz.length
                ? 'Sans faute — vous connaissez votre atlas !'
                : score >= quiz.length / 2
                  ? 'Beau parcours. Explorez les fiches pour aller plus loin.'
                  : 'Continuez d’explorer les régions pour progresser.'}
            </p>
            <button
              onClick={restart}
              className="mt-5 rounded-full bg-accent px-5 py-2 text-sm font-medium text-paper transition-colors hover:bg-accent-soft"
            >
              Nouvelle série
            </button>
          </div>
        ) : (
          <>
            <div className="mb-1 flex items-center justify-between text-xs text-ink-muted">
              <span>
                Question {index + 1} / {quiz.length}
              </span>
              <span>Score : {score}</span>
            </div>
            <p className="mb-4 font-serif text-lg text-ink">{q.prompt}</p>
            <div className="space-y-2">
              {q.options.map((opt) => {
                const isAnswer = opt === q.answer;
                const isPicked = opt === picked;
                let cls = 'border-line bg-paper hover:border-ink-muted';
                if (picked) {
                  if (isAnswer) cls = 'border-[#4f7a4f] bg-[#eaf1ea] text-[#2f5a2f]';
                  else if (isPicked) cls = 'border-accent bg-accent-faint text-accent';
                  else cls = 'border-line bg-paper opacity-60';
                }
                return (
                  <button
                    key={opt}
                    onClick={() => pick(opt)}
                    disabled={!!picked}
                    className={`flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors ${cls}`}
                  >
                    {opt}
                    {picked && isAnswer && <span aria-hidden>✓</span>}
                  </button>
                );
              })}
            </div>
            {picked && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-ink-muted">{q.note ? `Repère : ${q.note}` : ''}</span>
                <button
                  onClick={next}
                  className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-paper transition-colors hover:bg-accent-soft"
                >
                  {index + 1 >= quiz.length ? 'Voir le score' : 'Suivant'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
