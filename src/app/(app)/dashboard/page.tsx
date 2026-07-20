import { requireAuth } from "@/lib/auth";
import { getDashboardData } from "@/lib/metrics";
import { prisma } from "@/lib/db";
import { TopBar } from "@/components/topbar";
import { Card, SectionTitle, ScoreRing, Badge, ProgressBar, LinkButton, EmptyState } from "@/components/ui";
import { NotificationsPanel } from "@/components/notifications-panel";
import { bandFor } from "@/lib/reference";

export default async function DashboardPage() {
  const user = await requireAuth();
  const data = await getDashboardData(user.id);
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return (
    <div>
      <TopBar
        title="Tableau de bord"
        subtitle="Votre niveau de préparation à l'administration culturelle"
        notifications={data.notificationsUnread}
      />

      {/* Score général + sous-scores */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card className="p-5 flex flex-col items-center justify-center text-center">
          <h2 className="text-sm muted mb-3">Score de préparation à l'administration culturelle</h2>
          <ScoreRing value={data.global} size={150} />
          <div className="mt-3">
            <Badge tone={data.band.tone}>{data.band.label}</Badge>
          </div>
          <p className="text-xs muted mt-3">
            Calculé à partir de 9 sous-scores pondérés, reliés à des preuves concrètes de votre profil.
          </p>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <SectionTitle sub="Chaque sous-score est expliqué et relié à vos données réelles.">
            Détail des sous-scores
          </SectionTitle>
          <div className="grid sm:grid-cols-2 gap-3">
            {data.subscores.map((s) => (
              <div key={s.key} className="panel-2 rounded-lg p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{s.label}</span>
                  <span className="text-sm font-semibold" style={{ color: colorFor(s.value) }}>{s.value}</span>
                </div>
                <div className="mt-2">
                  <ProgressBar value={s.value} accent={colorFor(s.value)} />
                </div>
                <ul className="mt-2 space-y-0.5">
                  {s.evidence.slice(0, 2).map((e, i) => (
                    <li key={i} className="text-[11px] muted flex gap-1">
                      <span>•</span>
                      <span>{e}</span>
                    </li>
                  ))}
                  {s.missing.slice(0, 1).map((m, i) => (
                    <li key={i} className="text-[11px] text-spot-light flex gap-1">
                      <span>→</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-[11px] muted mt-3">
            Pondération : expérience culture 16% · projet 14% · exp. admin / gestion / spectacle vivant 12% · droit 10% · réseau / portfolio / candidatures 8%.
          </p>
        </Card>
      </div>

      {/* Actions prioritaires + échéances */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card className="p-5" accent="#e9b949">
          <SectionTitle sub="Généré depuis vos sous-scores les plus faibles.">Actions prioritaires de la semaine</SectionTitle>
          {data.priorities.length === 0 ? (
            <EmptyState title="Rien d'urgent 🎉" hint="Continuez votre feuille de route." />
          ) : (
            <ul className="space-y-2">
              {data.priorities.map((p, i) => (
                <li key={i} className="panel-2 rounded-lg p-3">
                  <div className="text-sm font-medium">{p.title}</div>
                  <div className="text-xs muted mt-0.5">{p.area}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5" accent="#3a7bd5">
          <SectionTitle sub="Offres, candidatures et relances datées.">Prochaines échéances</SectionTitle>
          {data.deadlines.length === 0 ? (
            <EmptyState title="Aucune échéance enregistrée" hint="Ajoutez des dates dans vos offres et candidatures." />
          ) : (
            <ul className="space-y-2">
              {data.deadlines.map((d, i) => (
                <li key={i} className="flex items-center justify-between gap-2 panel-2 rounded-lg p-2.5">
                  <span className="text-sm truncate">{d.title}</span>
                  <span className="text-xs muted shrink-0">{d.date}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5" accent="#2fae8f">
          <SectionTitle>Avancement</SectionTitle>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Projet culturel</span>
                <span className="muted">{data.projectProgress?.pct ?? 0}%</span>
              </div>
              <ProgressBar value={data.projectProgress?.pct ?? 0} accent="#2fae8f" />
              <div className="text-xs muted mt-1 truncate">{data.projectProgress?.title ?? "Aucun projet"}</div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Portfolio</span>
                <span className="muted">{data.portfolioCount} élément(s)</span>
              </div>
              <ProgressBar value={Math.min(100, data.portfolioCount * 12)} accent="#e8853a" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Formations en cours</span>
                <span className="muted">{data.inProgressCourses.length}</span>
              </div>
              <ProgressBar value={Math.min(100, data.inProgressCourses.length * 25)} accent="#c56cf0" />
            </div>
          </div>
        </Card>
      </div>

      {/* Feuille de route 12 mois */}
      <Card className="p-5 mb-4">
        <SectionTitle sub="Personnalisée selon vos priorités, avec jalons fixes.">Feuille de route sur 12 mois</SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {data.roadmap.map((m) => (
            <div key={m.month} className="panel-2 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="h-6 w-6 rounded-full bg-spot text-stage-950 text-xs font-bold flex items-center justify-center">{m.month}</span>
                <span className="text-sm font-medium">{m.label}</span>
              </div>
              <ul className="space-y-1">
                {m.focus.map((f, i) => (
                  <li key={i} className="text-[11px] muted flex gap-1">
                    <span>•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* Opportunités récentes + compétences + notifications */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <SectionTitle right={<LinkButton href="/opportunities" variant="ghost">Voir tout</LinkButton>}>
            Opportunités sauvegardées
          </SectionTitle>
          {data.recentOpportunities.length === 0 ? (
            <EmptyState title="Aucune offre sauvegardée" hint="Explorez le moteur d'opportunités." />
          ) : (
            <ul className="space-y-2">
              {data.recentOpportunities.map((o) => (
                <li key={o.id} className="panel-2 rounded-lg p-2.5">
                  <div className="text-sm font-medium truncate">{o.title}</div>
                  <div className="text-xs muted">{o.structure} · {o.country}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle>Compétences</SectionTitle>
          <div className="mb-3">
            <div className="text-xs muted mb-1">Acquises</div>
            <div className="flex flex-wrap gap-1.5">
              {data.acquiredSkills.length ? data.acquiredSkills.map((s) => <Badge key={s} tone="good">{s}</Badge>) : <span className="text-xs muted">—</span>}
            </div>
          </div>
          <div>
            <div className="text-xs muted mb-1">À renforcer</div>
            <div className="flex flex-wrap gap-1.5">
              {data.missingSkills.length ? data.missingSkills.map((s) => <Badge key={s} tone="warn">{s}</Badge>) : <span className="text-xs muted">—</span>}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle>Centre de notifications</SectionTitle>
          <NotificationsPanel
            notifications={notifications.map((n) => ({
              id: n.id,
              type: n.type,
              title: n.title,
              body: n.body,
              read: n.read,
              createdAt: n.createdAt.toISOString(),
            }))}
          />
        </Card>
      </div>
    </div>
  );
}

function colorFor(v: number) {
  const t = bandFor(v).tone;
  return t === "great" ? "#e9b949" : t === "good" ? "#34d399" : t === "info" ? "#3a7bd5" : t === "warn" ? "#f59e0b" : "#ef4444";
}
