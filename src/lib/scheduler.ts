import type { Video } from "@/types";

export interface ProgrammingSlot {
  name: string;
  startHour: number;
  endHour: number;
  moods: string[];
  description: string;
}

// The 6-block programmation grid described in the Salin Radio spec.
export const PROGRAMMING_GRID: ProgrammingSlot[] = [
  {
    name: "Nuit profonde",
    startHour: 0,
    endHour: 6,
    moods: ["nocturne", "hypnotique", "apaisant", "mélancolique", "indéfini"],
    description: "Sons nocturnes, ambient, archives étranges, vidéos calmes.",
  },
  {
    name: "Réveil doux",
    startHour: 6,
    endHour: 10,
    moods: ["chaleureux", "solennel", "doux", "nostalgique"],
    description: "Soul, jazz, groove, folk, musiques chaleureuses.",
  },
  {
    name: "Découvertes internationales",
    startHour: 10,
    endHour: 14,
    moods: ["solennel", "chaleureux", "mélancolique", "apaisant"],
    description: "Musiques rares et vidéos culturelles du monde entier.",
  },
  {
    name: "Groove de l'après-midi",
    startHour: 14,
    endHour: 18,
    moods: ["énergique", "hypnotique", "brut", "ludique"],
    description: "Funk, hip-hop, électronique, morceaux rythmés.",
  },
  {
    name: "Meilleures découvertes du jour",
    startHour: 18,
    endHour: 21,
    moods: [],
    description: "Les vidéos les mieux notées par l'IA aujourd'hui.",
  },
  {
    name: "Expérimental & club",
    startHour: 21,
    endHour: 24,
    moods: ["hypnotique", "nocturne", "absurde", "nostalgique", "brut"],
    description: "Vidéos expérimentales, club, archives, curiosités.",
  },
];

export function getCurrentSlot(date: Date = new Date()): ProgrammingSlot {
  const hour = date.getHours();
  return (
    PROGRAMMING_GRID.find((s) => hour >= s.startHour && hour < s.endHour) ??
    PROGRAMMING_GRID[0]
  );
}

function score(video: Video, slot: ProgrammingSlot): number {
  const moodBonus = slot.moods.length
    ? slot.moods.includes(video.mood)
      ? 40
      : 0
    : 0;
  const aiScore =
    (video.discovery_score + video.rarity_score + video.quality_score) / 3;
  return moodBonus + aiScore;
}

/**
 * Picks the next `count` videos for the live radio feed, given the videos
 * already approved for rotation and a short history of recently played
 * video ids / channel ids to avoid immediate repeats.
 */
export function pickNextVideos(
  approved: Video[],
  recentVideoIds: string[],
  recentChannelIds: string[],
  count: number,
  now: Date = new Date()
): Video[] {
  const slot = getCurrentSlot(now);
  const pool = approved.filter((v) => v.embed_allowed);
  const picked: Video[] = [];
  const usedIds = new Set(recentVideoIds);
  const lastChannels = [...recentChannelIds];
  const usedGenresInBatch: string[] = [];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const candidates = pool.filter((v) => !usedIds.has(v.id));
    if (candidates.length === 0) break;

    const ranked = candidates
      .map((v) => {
        let penalty = 0;
        if (lastChannels.slice(-2).includes(v.channel_id)) penalty += 60;
        if (usedGenresInBatch.slice(-1).includes(v.genre)) penalty += 25;
        return { video: v, value: score(v, slot) - penalty };
      })
      .sort((a, b) => b.value - a.value);

    const next = ranked[0].video;
    picked.push(next);
    usedIds.add(next.id);
    lastChannels.push(next.channel_id);
    usedGenresInBatch.push(next.genre);
  }

  return picked;
}
