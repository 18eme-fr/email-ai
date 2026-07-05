// Core domain types for Salin Radio

export type VideoStatus = "pending" | "approved" | "rejected" | "unavailable";

export type QueueStatus = "queued" | "playing" | "played" | "skipped";

export type FeedbackAction = "like" | "skip" | "report";

export type AdminRole = "admin" | "editor";

export type AiDecision = "accept" | "hold" | "reject";

export interface Video {
  id: string;
  youtube_video_id: string;
  title: string;
  channel_name: string;
  channel_id: string;
  description: string;
  thumbnail_url: string;
  duration_seconds: number;
  view_count: number;
  like_count: number;
  published_at: string; // ISO date
  youtube_url: string;
  embed_allowed: boolean;
  status: VideoStatus;
  rarity_score: number;
  quality_score: number;
  discovery_score: number;
  sample_score: number;
  ai_summary: string;
  ai_reason: string;
  mood: string;
  genre: string;
  country: string;
  decade: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface RadioQueueItem {
  id: string;
  video_id: string;
  position: number;
  playlist_name: string;
  scheduled_at: string | null;
  played_at: string | null;
  status: QueueStatus;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  mood: string;
  start_hour: number;
  end_hour: number;
  created_at: string;
}

export interface UserFeedback {
  id: string;
  video_id: string;
  action: FeedbackAction;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  created_at: string;
}

// Shape returned by the AI analysis pipeline for a YouTube search candidate
export interface AiAnalysis {
  summary: string;
  mood: string;
  tags: string[];
  genre: string;
  country: string;
  decade: string;
  rarity_score: number;
  quality_score: number;
  discovery_score: number;
  sample_score: number;
  reason: string;
  decision: AiDecision;
}

// Raw metadata pulled from the YouTube Data API (or mocked) before AI analysis
export interface YoutubeCandidate {
  youtube_video_id: string;
  title: string;
  channel_name: string;
  channel_id: string;
  description: string;
  thumbnail_url: string;
  duration_seconds: number;
  view_count: number;
  like_count: number;
  published_at: string;
  category: string;
  tags: string[];
  embed_allowed: boolean;
}

export interface VideoFilters {
  q?: string;
  genre?: string;
  country?: string;
  decade?: string;
  mood?: string;
  max_views?: number;
  min_rarity?: number;
  sort?:
    | "rarest"
    | "best_discovery"
    | "strangest"
    | "best_sample"
    | "newest";
}
