import type { YoutubeCandidate } from "@/types";

export interface YoutubeSearchParams {
  query: string;
  maxViews?: number;
  minDurationSeconds?: number;
  maxDurationSeconds?: number;
  publishedAfter?: string;
  publishedBefore?: string;
  language?: string;
  regionCode?: string;
  categoryId?: string;
}

function parseIsoDuration(iso: string): number {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return 0;
  const [, h, m, s] = match;
  return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
}

/**
 * Searches YouTube via the official Data API v3 when YOUTUBE_API_KEY is set.
 * Falls back to a small set of mock candidates in demo mode so the admin
 * "search" workflow can be exercised without any API key.
 */
export async function searchYoutube(
  params: YoutubeSearchParams
): Promise<YoutubeCandidate[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return mockSearch(params);

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("q", params.query);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("maxResults", "15");
  searchUrl.searchParams.set("key", apiKey);
  if (params.publishedAfter)
    searchUrl.searchParams.set("publishedAfter", params.publishedAfter);
  if (params.publishedBefore)
    searchUrl.searchParams.set("publishedBefore", params.publishedBefore);
  if (params.language) searchUrl.searchParams.set("relevanceLanguage", params.language);
  if (params.regionCode) searchUrl.searchParams.set("regionCode", params.regionCode);
  if (params.categoryId) searchUrl.searchParams.set("videoCategoryId", params.categoryId);

  const searchRes = await fetch(searchUrl.toString());
  if (!searchRes.ok) throw new Error(`YouTube search failed: ${searchRes.status}`);
  const searchData = await searchRes.json();
  const ids = (searchData.items ?? [])
    .map((item: { id?: { videoId?: string } }) => item.id?.videoId)
    .filter(Boolean)
    .join(",");
  if (!ids) return [];

  const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  detailsUrl.searchParams.set("part", "snippet,statistics,contentDetails,status");
  detailsUrl.searchParams.set("id", ids);
  detailsUrl.searchParams.set("key", apiKey);

  const detailsRes = await fetch(detailsUrl.toString());
  if (!detailsRes.ok) throw new Error(`YouTube videos.list failed: ${detailsRes.status}`);
  const detailsData = await detailsRes.json();

  interface YoutubeVideoItem {
    id: string;
    snippet: {
      title: string;
      description: string;
      channelTitle: string;
      channelId: string;
      publishedAt: string;
      tags?: string[];
      categoryId?: string;
      thumbnails: { high?: { url: string }; default?: { url: string } };
    };
    statistics: { viewCount?: string; likeCount?: string };
    contentDetails: { duration: string };
    status: { embeddable?: boolean };
  }

  let candidates: YoutubeCandidate[] = (detailsData.items ?? []).map(
    (item: YoutubeVideoItem) => ({
      youtube_video_id: item.id,
      title: item.snippet.title,
      channel_name: item.snippet.channelTitle,
      channel_id: item.snippet.channelId,
      description: item.snippet.description ?? "",
      thumbnail_url:
        item.snippet.thumbnails?.high?.url ??
        item.snippet.thumbnails?.default?.url ??
        "",
      duration_seconds: parseIsoDuration(item.contentDetails.duration),
      view_count: Number(item.statistics.viewCount ?? 0),
      like_count: Number(item.statistics.likeCount ?? 0),
      published_at: item.snippet.publishedAt,
      category: item.snippet.categoryId ?? "unknown",
      tags: item.snippet.tags ?? [],
      embed_allowed: item.status.embeddable !== false,
    })
  );

  if (typeof params.maxViews === "number")
    candidates = candidates.filter((c) => c.view_count <= params.maxViews!);
  if (typeof params.minDurationSeconds === "number")
    candidates = candidates.filter(
      (c) => c.duration_seconds >= params.minDurationSeconds!
    );
  if (typeof params.maxDurationSeconds === "number")
    candidates = candidates.filter(
      (c) => c.duration_seconds <= params.maxDurationSeconds!
    );

  return candidates;
}

function mockSearch(params: YoutubeSearchParams): YoutubeCandidate[] {
  const base: YoutubeCandidate[] = [
    {
      youtube_video_id: "m0Qz7XqRvT2",
      title: `${params.query} — session live retrouvée`,
      channel_name: "Archive Anonyme",
      channel_id: "ch-archive-anonyme",
      description: `Enregistrement lié à "${params.query}", origine incertaine, qualité artisanale.`,
      thumbnail_url: "https://i.ytimg.com/vi/m0Qz7XqRvT2/hqdefault.jpg",
      duration_seconds: 214,
      view_count: 850,
      like_count: 42,
      published_at: "2016-03-11",
      category: "Music",
      tags: [params.query, "rare", "archive"],
      embed_allowed: true,
    },
    {
      youtube_video_id: "b8Yw3LpQmN5",
      title: `${params.query} (cassette non commercialisée)`,
      channel_name: "Tape Diggers",
      channel_id: "ch-tape-diggers",
      description: `Découverte communautaire autour de "${params.query}", jamais rééditée.`,
      thumbnail_url: "https://i.ytimg.com/vi/b8Yw3LpQmN5/hqdefault.jpg",
      duration_seconds: 187,
      view_count: 2300,
      like_count: 130,
      published_at: "2019-07-04",
      category: "Music",
      tags: [params.query, "cassette"],
      embed_allowed: true,
    },
    {
      youtube_video_id: "t4Rk9WvXpL1",
      title: `PUB - ${params.query} - abonne toi et gagne`,
      channel_name: "ClickFast Media",
      channel_id: "ch-clickfast",
      description: "Offre exclusive, clique vite, lien en description !!!",
      thumbnail_url: "https://i.ytimg.com/vi/t4Rk9WvXpL1/hqdefault.jpg",
      duration_seconds: 45,
      view_count: 12000000,
      like_count: 200,
      published_at: "2024-01-01",
      category: "Entertainment",
      tags: ["pub", "spam"],
      embed_allowed: true,
    },
  ];

  let candidates = base;
  if (typeof params.maxViews === "number")
    candidates = candidates.filter((c) => c.view_count <= params.maxViews!);
  if (typeof params.minDurationSeconds === "number")
    candidates = candidates.filter(
      (c) => c.duration_seconds >= params.minDurationSeconds!
    );
  if (typeof params.maxDurationSeconds === "number")
    candidates = candidates.filter(
      (c) => c.duration_seconds <= params.maxDurationSeconds!
    );
  return candidates;
}

/** Extracts a YouTube video id from a full URL or returns the input if it already looks like an id. */
export function extractYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const shortsMatch = u.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shortsMatch) return shortsMatch[1];
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Fetches metadata for a single video id via the Data API, or returns a
 * minimal placeholder candidate in demo mode.
 */
export async function fetchVideoMetadata(
  youtubeId: string
): Promise<YoutubeCandidate | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return {
      youtube_video_id: youtubeId,
      title: "Vidéo ajoutée manuellement",
      channel_name: "Chaîne inconnue",
      channel_id: `ch-${youtubeId}`,
      description: "Ajoutée manuellement via l'admin en mode démo (sans clé YOUTUBE_API_KEY).",
      thumbnail_url: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
      duration_seconds: 180,
      view_count: 0,
      like_count: 0,
      published_at: new Date().toISOString(),
      category: "unknown",
      tags: [],
      embed_allowed: true,
    };
  }

  const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  detailsUrl.searchParams.set("part", "snippet,statistics,contentDetails,status");
  detailsUrl.searchParams.set("id", youtubeId);
  detailsUrl.searchParams.set("key", apiKey);

  const res = await fetch(detailsUrl.toString());
  if (!res.ok) throw new Error(`YouTube videos.list failed: ${res.status}`);
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) return null;

  return {
    youtube_video_id: youtubeId,
    title: item.snippet.title,
    channel_name: item.snippet.channelTitle,
    channel_id: item.snippet.channelId,
    description: item.snippet.description ?? "",
    thumbnail_url:
      item.snippet.thumbnails?.high?.url ??
      item.snippet.thumbnails?.default?.url ??
      "",
    duration_seconds: parseIsoDuration(item.contentDetails.duration),
    view_count: Number(item.statistics.viewCount ?? 0),
    like_count: Number(item.statistics.likeCount ?? 0),
    published_at: item.snippet.publishedAt,
    category: item.snippet.categoryId ?? "unknown",
    tags: item.snippet.tags ?? [],
    embed_allowed: item.status.embeddable !== false,
  };
}
