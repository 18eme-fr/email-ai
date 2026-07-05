import VideoCard from "@/components/VideoCard";
import { listVideos } from "@/lib/db";
import type { VideoFilters } from "@/types";

const SORT_OPTIONS: { value: NonNullable<VideoFilters["sort"]>; label: string }[] = [
  { value: "rarest", label: "Plus rare" },
  { value: "best_discovery", label: "Meilleure découverte" },
  { value: "strangest", label: "Plus étrange" },
  { value: "best_sample", label: "Meilleur potentiel sample" },
  { value: "newest", label: "Plus récente" },
];

function FilterSelect({
  name,
  label,
  options,
  value,
}: {
  name: string;
  label: string;
  options: string[];
  value?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-salin-fg-muted">
      {label}
      <select
        name={name}
        defaultValue={value ?? ""}
        className="rounded-lg border border-salin-line bg-salin-bg-card px-3 py-2 text-sm text-salin-fg"
      >
        <option value="">Tous</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const get = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const filters: VideoFilters = {
    q: get("q") || undefined,
    genre: get("genre") || undefined,
    country: get("country") || undefined,
    decade: get("decade") || undefined,
    mood: get("mood") || undefined,
    max_views: get("max_views") ? Number(get("max_views")) : undefined,
    min_rarity: get("min_rarity") ? Number(get("min_rarity")) : undefined,
    sort: (get("sort") as VideoFilters["sort"]) || undefined,
  };

  const allApproved = (await listVideos()).filter((v) => v.status === "approved");
  const genres = Array.from(new Set(allApproved.map((v) => v.genre))).sort();
  const countries = Array.from(new Set(allApproved.map((v) => v.country))).sort();
  const decades = Array.from(new Set(allApproved.map((v) => v.decade))).sort();
  const moods = Array.from(new Set(allApproved.map((v) => v.mood))).sort();

  const results = (await listVideos(filters)).filter((v) => v.status === "approved");

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl">Explorer les découvertes</h1>
        <p className="mt-2 text-sm text-salin-fg-muted">
          {results.length} vidéo{results.length > 1 ? "s" : ""} correspondant à tes
          critères.
        </p>
      </div>

      <form
        method="get"
        className="mb-10 grid gap-4 rounded-2xl border border-salin-line bg-salin-bg-card p-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="flex flex-col gap-1 text-xs text-salin-fg-muted lg:col-span-2">
          Recherche
          <input
            type="text"
            name="q"
            defaultValue={filters.q}
            placeholder="titre, chaîne, tag..."
            className="rounded-lg border border-salin-line bg-salin-bg-elevated px-3 py-2 text-sm text-salin-fg placeholder:text-salin-fg-muted/60"
          />
        </label>

        <FilterSelect name="genre" label="Genre" options={genres} value={filters.genre} />
        <FilterSelect
          name="country"
          label="Pays"
          options={countries}
          value={filters.country}
        />
        <FilterSelect
          name="decade"
          label="Décennie"
          options={decades}
          value={filters.decade}
        />
        <FilterSelect name="mood" label="Ambiance" options={moods} value={filters.mood} />

        <label className="flex flex-col gap-1 text-xs text-salin-fg-muted">
          Vues max
          <input
            type="number"
            name="max_views"
            defaultValue={filters.max_views}
            placeholder="ex: 10000"
            className="rounded-lg border border-salin-line bg-salin-bg-elevated px-3 py-2 text-sm text-salin-fg"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-salin-fg-muted">
          Rareté minimum
          <input
            type="number"
            name="min_rarity"
            min={0}
            max={100}
            defaultValue={filters.min_rarity}
            className="rounded-lg border border-salin-line bg-salin-bg-elevated px-3 py-2 text-sm text-salin-fg"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-salin-fg-muted">
          Trier par
          <select
            name="sort"
            defaultValue={filters.sort ?? ""}
            className="rounded-lg border border-salin-line bg-salin-bg-card px-3 py-2 text-sm text-salin-fg"
          >
            <option value="">Pertinence</option>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end gap-3 lg:col-span-4">
          <button
            type="submit"
            className="rounded-full bg-salin-red px-6 py-2 text-sm font-semibold uppercase tracking-wide transition hover:bg-salin-red-bright"
          >
            Filtrer
          </button>
          <a
            href="/explore"
            className="text-xs text-salin-fg-muted hover:text-salin-fg"
          >
            Réinitialiser
          </a>
        </div>
      </form>

      {results.length === 0 ? (
        <p className="rounded-xl border border-salin-line bg-salin-bg-card p-8 text-center text-salin-fg-muted">
          Aucune vidéo ne correspond à ces critères pour le moment.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
