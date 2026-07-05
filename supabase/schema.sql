-- Salin Radio — Supabase / PostgreSQL schema
-- Run this against a fresh Supabase project (SQL editor or `psql "$DATABASE_URL" -f supabase/schema.sql`).

create extension if not exists "pgcrypto";

create type video_status as enum ('pending', 'approved', 'rejected', 'unavailable');
create type queue_status as enum ('queued', 'playing', 'played', 'skipped');
create type feedback_action as enum ('like', 'skip', 'report');
create type admin_role as enum ('admin', 'editor');

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  youtube_video_id text not null unique,
  title text not null,
  channel_name text not null,
  channel_id text not null,
  description text default '',
  thumbnail_url text default '',
  duration_seconds integer not null default 0,
  view_count bigint not null default 0,
  like_count bigint not null default 0,
  published_at timestamptz,
  youtube_url text not null,
  embed_allowed boolean not null default true,
  status video_status not null default 'pending',
  rarity_score integer not null default 0 check (rarity_score between 0 and 100),
  quality_score integer not null default 0 check (quality_score between 0 and 100),
  discovery_score integer not null default 0 check (discovery_score between 0 and 100),
  sample_score integer not null default 0 check (sample_score between 0 and 100),
  ai_summary text default '',
  ai_reason text default '',
  mood text default '',
  genre text default '',
  country text default '',
  decade text default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists videos_status_idx on videos (status);
create index if not exists videos_genre_idx on videos (genre);
create index if not exists videos_country_idx on videos (country);
create index if not exists videos_decade_idx on videos (decade);
create index if not exists videos_mood_idx on videos (mood);

create table if not exists playlists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  mood text default '',
  start_hour smallint not null check (start_hour between 0 and 24),
  end_hour smallint not null check (end_hour between 0 and 24),
  created_at timestamptz not null default now()
);

create table if not exists radio_queue (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos (id) on delete cascade,
  position integer not null default 0,
  playlist_name text default '',
  scheduled_at timestamptz,
  played_at timestamptz,
  status queue_status not null default 'queued'
);

create index if not exists radio_queue_status_idx on radio_queue (status);

create table if not exists user_feedback (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos (id) on delete cascade,
  action feedback_action not null,
  created_at timestamptz not null default now()
);

create index if not exists user_feedback_video_id_idx on user_feedback (video_id);

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role admin_role not null default 'editor',
  created_at timestamptz not null default now()
);

-- Keep updated_at fresh on every write to videos.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists videos_set_updated_at on videos;
create trigger videos_set_updated_at
  before update on videos
  for each row execute function set_updated_at();

-- Seed the default programmation grid described in the product spec.
insert into playlists (name, description, mood, start_hour, end_hour) values
  ('Nuit profonde', 'Sons nocturnes, ambient, archives étranges, vidéos calmes.', 'nocturne', 0, 6),
  ('Réveil doux', 'Soul, jazz, groove, folk, musiques chaleureuses.', 'chaleureux', 6, 10),
  ('Découvertes internationales', 'Musiques rares et vidéos culturelles du monde entier.', 'solennel', 10, 14),
  ('Groove de l''après-midi', 'Funk, hip-hop, électronique, morceaux rythmés.', 'énergique', 14, 18),
  ('Meilleures découvertes du jour', 'Les vidéos les mieux notées par l''IA aujourd''hui.', 'chaleureux', 18, 21),
  ('Expérimental & club', 'Vidéos expérimentales, club, archives, curiosités.', 'hypnotique', 21, 24)
on conflict do nothing;
