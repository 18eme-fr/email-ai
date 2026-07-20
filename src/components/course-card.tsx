"use client";
import { useTransition } from "react";
import { setCourseStatus, addCourseTime } from "@/app/actions/skills";

type Course = {
  key: string;
  title: string;
  org: string;
  url: string;
  language: string;
  level: string;
  duration: string;
  price: string;
  certification: string;
  format: string;
  skills: string[];
  relevance: number;
};

const STATUS_LABEL: Record<string, string> = { not_started: "À faire", in_progress: "En cours", done: "Terminé" };

export function CourseCard({ course, status, timeSpent }: { course: Course; status: string; timeSpent: number }) {
  const [pending, start] = useTransition();
  return (
    <div className="panel-2 rounded-lg p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium">{course.title}</div>
          <div className="text-xs muted">{course.org}</div>
        </div>
        <span className="text-xs shrink-0 rounded-full bg-white/5 px-2 py-0.5" title="Pertinence pour le projet">{course.relevance}%</span>
      </div>
      <div className="flex flex-wrap gap-1 mt-2 text-[10px] muted">
        <span className="panel rounded px-1.5 py-0.5">{course.format}</span>
        <span className="panel rounded px-1.5 py-0.5">{course.level}</span>
        <span className="panel rounded px-1.5 py-0.5">{course.language}</span>
        <span className="panel rounded px-1.5 py-0.5">{course.duration}</span>
        <span className="panel rounded px-1.5 py-0.5">{course.price}</span>
        {course.certification !== "Aucune" && <span className="panel rounded px-1.5 py-0.5">🎖 {course.certification}</span>}
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {course.skills.map((s) => (
          <span key={s} className="text-[10px] rounded-full bg-spot/10 text-spot-light px-1.5 py-0.5">{s}</span>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <a href={course.url} target="_blank" rel="noopener noreferrer" className="text-xs text-sceneblue hover:underline">Lien officiel ↗</a>
        <div className="ml-auto flex items-center gap-1">
          {(["not_started", "in_progress", "done"] as const).map((s) => (
            <button
              key={s}
              disabled={pending}
              onClick={() => start(() => setCourseStatus(course.key, s))}
              className={`text-[11px] rounded px-2 py-1 ${status === s ? "bg-spot text-stage-950 font-medium" : "panel"}`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 text-[11px] muted">
        <span>⏱ {timeSpent} min {status === "done" && "· 🎖 badge acquis"}</span>
        <button onClick={() => start(() => addCourseTime(course.key, 30))} disabled={pending} className="hover:text-spot">+30 min</button>
      </div>
    </div>
  );
}
