import { randomUUID } from "crypto";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { MOCK_VIDEOS } from "@/lib/mock-videos";
import type {
  Playlist,
  UserFeedback,
  Video,
  VideoFilters,
  VideoStatus,
} from "@/types";

// --- In-memory demo store -------------------------------------------------
// Used whenever Supabase isn't configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
// missing from the environment). Persists for the lifetime of the server
// process via globalThis, so it survives Next.js dev-mode hot reloads.

interface DemoStore {
  videos: Video[];
  feedback: UserFeedback[];
  playlists: Playlist[];
}

declare global {
  var __salinRadioStore: DemoStore | undefined;
}

const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: "pl-nocturne",
    name: "Nuit profonde",
    description: "Sons nocturnes, ambient, archives étranges, vidéos calmes.",
    mood: "nocturne",
    start_hour: 0,
    end_hour: 6,
    created_at: new Date().toISOString(),
  },
  {
    id: "pl-reveil",
    name: "Réveil doux",
    description: "Soul, jazz, groove, folk, musiques chaleureuses.",
    mood: "chaleureux",
    start_hour: 6,
    end_hour: 10,
    created_at: new Date().toISOString(),
  },
  {
    id: "pl-international",
    name: "Découvertes internationales",
    description: "Musiques rares et vidéos culturelles du monde entier.",
    mood: "solennel",
    start_hour: 10,
    end_hour: 14,
    created_at: new Date().toISOString(),
  },
  {
    id: "pl-rythme",
    name: "Groove de l'après-midi",
    description: "Funk, hip-hop, électronique, morceaux rythmés.",
    mood: "énergique",
    start_hour: 14,
    end_hour: 18,
    created_at: new Date().toISOString(),
  },
  {
    id: "pl-bestof",
    name: "Meilleures découvertes du jour",
    description: "Les vidéos les mieux notées par l'IA aujourd'hui.",
    mood: "chaleureux",
    start_hour: 18,
    end_hour: 21,
    created_at: new Date().toISOString(),
  },
  {
    id: "pl-experimental",
    name: "Expérimental & club",
    description: "Vidéos expérimentales, club, archives, curiosités.",
    mood: "hypnotique",
    start_hour: 21,
    end_hour: 24,
    created_at: new Date().toISOString(),
  },
];

function getStore(): DemoStore {
  if (!globalThis.__salinRadioStore) {
    globalThis.__salinRadioStore = {
      videos: MOCK_VIDEOS.map((v) => ({ ...v })),
      feedback: [],
      playlists: DEFAULT_PLAYLISTS,
    };
  }
  return globalThis.__salinRadioStore;
}

function applyFilters(videos: Video[], filters?: VideoFilters): Video[] {
  let result = videos;
  if (!filters) return result;

  if (filters.q) {
    const q = filters.q.toLowerCase();
    result = result.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.channel_name.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        v.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  if (filters.genre) {
    result = result.filter(
      (v) => v.genre.toLowerCase() === filters.genre!.toLowerCase()
    );
  }
  if (filters.country) {
    result = result.filter(
      (v) => v.country.toLowerCase() === filters.country!.toLowerCase()
    );
  }
  if (filters.decade) {
    result = result.filter((v) => v.decade === filters.decade);
  }
  if (filters.mood) {
    result = result.filter(
      (v) => v.mood.toLowerCase() === filters.mood!.toLowerCase()
    );
  }
  if (typeof filters.max_views === "number") {
    result = result.filter((v) => v.view_count <= filters.max_views!);
  }
  if (typeof filters.min_rarity === "number") {
    result = result.filter((v) => v.rarity_score >= filters.min_rarity!);
  }

  switch (filters.sort) {
    case "rarest":
      result = [...result].sort((a, b) => b.rarity_score - a.rarity_score);
      break;
    case "best_discovery":
      result = [...result].sort(
        (a, b) => b.discovery_score - a.discovery_score
      );
      break;
    case "strangest":
      result = [...result].sort(
        (a, b) =>
          b.rarity_score + (100 - b.quality_score) -
          (a.rarity_score + (100 - a.quality_score))
      );
      break;
    case "best_sample":
      result = [...result].sort((a, b) => b.sample_score - a.sample_score);
      break;
    case "newest":
      result = [...result].sort(
        (a, b) =>
          new Date(b.published_at).getTime() -
          new Date(a.published_at).getTime()
      );
      break;
    default:
      break;
  }

  return result;
}

// --- Public data-access API ------------------------------------------------
// Every function checks isSupabaseConfigured and delegates to the Supabase
// client when available; otherwise it falls back to the in-memory demo
// store. This keeps callers (API routes, server components) agnostic of
// which backend is active.

export async function listVideos(filters?: VideoFilters): Promise<Video[]> {
  const supabase = getSupabase();
  if (supabase) {
    let query = supabase.from("videos").select("*");
    if (filters?.genre) query = query.eq("genre", filters.genre);
    if (filters?.country) query = query.eq("country", filters.country);
    if (filters?.decade) query = query.eq("decade", filters.decade);
    if (filters?.mood) query = query.eq("mood", filters.mood);
    if (typeof filters?.max_views === "number")
      query = query.lte("view_count", filters.max_views);
    if (typeof filters?.min_rarity === "number")
      query = query.gte("rarity_score", filters.min_rarity);
    if (filters?.q)
      query = query.or(
        `title.ilike.%${filters.q}%,channel_name.ilike.%${filters.q}%,description.ilike.%${filters.q}%`
      );

    const sortColumn: Record<string, string> = {
      rarest: "rarity_score",
      best_discovery: "discovery_score",
      strangest: "rarity_score",
      best_sample: "sample_score",
      newest: "published_at",
    };
    const column = filters?.sort ? sortColumn[filters.sort] : "created_at";
    query = query.order(column, { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return (data as Video[]) ?? [];
  }

  const store = getStore();
  return applyFilters(store.videos, filters);
}

export async function getVideoById(id: string): Promise<Video | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as Video) ?? null;
  }

  const store = getStore();
  return store.videos.find((v) => v.id === id) ?? null;
}

export async function getVideosByStatus(
  status: VideoStatus
): Promise<Video[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("status", status);
    if (error) throw error;
    return (data as Video[]) ?? [];
  }
  const store = getStore();
  return store.videos.filter((v) => v.status === status);
}

export async function createVideo(
  input: Omit<Video, "id" | "created_at" | "updated_at">
): Promise<Video> {
  const nowIso = new Date().toISOString();
  const video: Video = {
    ...input,
    id: randomUUID(),
    created_at: nowIso,
    updated_at: nowIso,
  };

  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("videos")
      .insert(video)
      .select()
      .single();
    if (error) throw error;
    return data as Video;
  }

  const store = getStore();
  store.videos.unshift(video);
  return video;
}

export async function updateVideo(
  id: string,
  patch: Partial<Video>
): Promise<Video | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("videos")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return (data as Video) ?? null;
  }

  const store = getStore();
  const video = store.videos.find((v) => v.id === id);
  if (!video) return null;
  Object.assign(video, patch, { updated_at: new Date().toISOString() });
  return video;
}

export async function addFeedback(
  videoId: string,
  action: UserFeedback["action"]
): Promise<UserFeedback> {
  const entry: UserFeedback = {
    id: randomUUID(),
    video_id: videoId,
    action,
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("user_feedback")
      .insert(entry)
      .select()
      .single();
    if (error) throw error;
    return data as UserFeedback;
  }

  const store = getStore();
  store.feedback.push(entry);

  if (action === "report") {
    const video = store.videos.find((v) => v.id === videoId);
    if (video) video.status = "unavailable";
  }

  return entry;
}

export async function listFeedback(videoId?: string): Promise<UserFeedback[]> {
  const supabase = getSupabase();
  if (supabase) {
    let query = supabase.from("user_feedback").select("*");
    if (videoId) query = query.eq("video_id", videoId);
    const { data, error } = await query;
    if (error) throw error;
    return (data as UserFeedback[]) ?? [];
  }
  const store = getStore();
  return videoId
    ? store.feedback.filter((f) => f.video_id === videoId)
    : store.feedback;
}

export async function listPlaylists(): Promise<Playlist[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from("playlists").select("*");
    if (error) throw error;
    return (data as Playlist[]) ?? DEFAULT_PLAYLISTS;
  }
  return getStore().playlists;
}

export { isSupabaseConfigured };
