import type { AiAnalysis, YoutubeCandidate } from "@/types";

const REJECT_KEYWORDS = [
  "spam",
  "click here",
  "clickbait",
  "xxx",
  "porn",
  "free money",
  "subscribe now",
  "livestream 24/7",
];

const KNOWN_HUGE_CHANNEL_THRESHOLD = 5_000_000; // views: treated as "too well known"

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function guessMood(candidate: YoutubeCandidate): string {
  const text = `${candidate.title} ${candidate.description}`.toLowerCase();
  if (/(nuit|night|dark|ambient|drone)/.test(text)) return "nocturne";
  if (/(funk|groove|dance|club|techno)/.test(text)) return "énergique";
  if (/(triste|sad|mélancol|melanchol)/.test(text)) return "mélancolique";
  if (/(calme|ambient|pluie|rain|relax)/.test(text)) return "apaisant";
  if (/(chaleureux|soul|jazz|folk|warm)/.test(text)) return "chaleureux";
  if (/(bizarre|étrange|weird|strange|absurd)/.test(text)) return "absurde";
  return "hypnotique";
}

function guessGenre(candidate: YoutubeCandidate): string {
  const text = `${candidate.title} ${candidate.description} ${candidate.category}`.toLowerCase();
  if (/(funk)/.test(text)) return "funk";
  if (/(techno|house|electro)/.test(text)) return "électronique";
  if (/(jazz)/.test(text)) return "jazz";
  if (/(folk)/.test(text)) return "folk";
  if (/(rock)/.test(text)) return "rock";
  if (/(field recording|nature|ambient)/.test(text)) return "ambient";
  if (/(hip.?hop|rap)/.test(text)) return "hip-hop";
  if (/(archive|vhs|television|tv)/.test(text)) return "archive";
  return candidate.category || "inclassable";
}

/**
 * Rule-based fallback analyzer used when OPENAI_API_KEY is not configured.
 * Approximates the scoring criteria from the Salin Radio brief so the app
 * is fully usable in demo mode without any AI provider.
 */
export function analyzeHeuristic(candidate: YoutubeCandidate): AiAnalysis {
  const text = `${candidate.title} ${candidate.description}`.toLowerCase();
  const looksSpammy = REJECT_KEYWORDS.some((k) => text.includes(k));
  const tooLong = candidate.duration_seconds > 60 * 45; // interminable live
  const tooShortForSample = candidate.duration_seconds < 5;

  let rarity = 100;
  rarity -= Math.min(70, Math.log10(candidate.view_count + 1) * 12);
  if (candidate.view_count > KNOWN_HUGE_CHANNEL_THRESHOLD) rarity -= 15;
  const ageYears =
    (Date.now() - new Date(candidate.published_at).getTime()) /
    (1000 * 60 * 60 * 24 * 365);
  if (ageYears > 5 && candidate.view_count < 100_000) rarity += 10;
  rarity = clamp(rarity);

  let quality = 60;
  if (candidate.duration_seconds >= 30 && candidate.duration_seconds <= 900)
    quality += 15;
  if (candidate.description.length > 40) quality += 10;
  if (looksSpammy) quality -= 60;
  if (tooLong) quality -= 30;
  quality = clamp(quality);

  let discovery = Math.round((rarity + quality) / 2);
  if (/(rare|inconnu|obscure|perdu|archive|oublié)/.test(text))
    discovery += 10;
  discovery = clamp(discovery);

  let sample = 20;
  if (/(instrumental|groove|break|funk|drum|sample)/.test(text)) sample += 40;
  if (candidate.duration_seconds >= 60 && candidate.duration_seconds <= 420)
    sample += 15;
  sample = clamp(sample);

  const decision: AiAnalysis["decision"] =
    looksSpammy || tooLong || tooShortForSample || !candidate.embed_allowed
      ? "reject"
      : rarity >= 50 && quality >= 40
      ? "accept"
      : "hold";

  const mood = guessMood(candidate);
  const genre = guessGenre(candidate);
  const tags = Array.from(
    new Set([genre, mood, ...candidate.tags.slice(0, 3)].filter(Boolean))
  );

  return {
    summary: `${candidate.title} — ${candidate.channel_name}, ${genre} (${mood}).`,
    mood,
    tags,
    genre,
    country: "Inconnu",
    decade: `${Math.floor(new Date(candidate.published_at).getFullYear() / 10) * 10}s`,
    rarity_score: rarity,
    quality_score: quality,
    discovery_score: discovery,
    sample_score: sample,
    reason: looksSpammy
      ? "Contenu jugé spammy ou promotionnel : refusé automatiquement."
      : tooLong
      ? "Durée trop longue pour un format radio exploitable (live interminable)."
      : `Score composite basé sur les vues (${candidate.view_count.toLocaleString(
          "fr-FR"
        )}), la durée (${candidate.duration_seconds}s) et la présence de mots-clés de rareté dans le titre/la description.`,
    decision,
  };
}

/**
 * Analyzes a YouTube candidate with OpenAI when OPENAI_API_KEY is set,
 * otherwise falls back to the local heuristic analyzer.
 */
export async function analyzeVideo(
  candidate: YoutubeCandidate
): Promise<AiAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return analyzeHeuristic(candidate);

  try {
    const prompt = `Tu es le moteur de curation IA de Salin Radio, une radio web qui diffuse des vidéos YouTube rares, oubliées ou peu vues, triées par rareté, qualité et potentiel de découverte.

Analyse cette vidéo candidate et réponds UNIQUEMENT avec un JSON valide respectant ce schéma :
{
  "summary": string (résumé court en français),
  "mood": string (ambiance principale),
  "genre": string,
  "country": string (pays ou zone culturelle probable),
  "decade": string (ex: "1970s"),
  "tags": string[],
  "rarity_score": number (0-100),
  "quality_score": number (0-100),
  "discovery_score": number (0-100),
  "sample_score": number (0-100),
  "reason": string (justification en 2-3 phrases),
  "decision": "accept" | "hold" | "reject"
}

Critères de rareté : moins de vues = mieux, chaîne peu connue = mieux, ancienneté + peu de vues = mieux, titre atypique = mieux.
Critères de refus automatique : trop connue, haineuse/violente/explicite, spam, pub pure, impossible à intégrer, hors sujet, mauvaise qualité évidente, live interminable, contenu enfantin ou abusif.

Métadonnées de la vidéo :
Titre: ${candidate.title}
Chaîne: ${candidate.channel_name}
Description: ${candidate.description}
Durée (s): ${candidate.duration_seconds}
Vues: ${candidate.view_count}
Publiée le: ${candidate.published_at}
Catégorie: ${candidate.category}
Tags YouTube: ${candidate.tags.join(", ")}
Intégration autorisée: ${candidate.embed_allowed}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.4,
      }),
    });

    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
    const data = await res.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    return {
      summary: parsed.summary,
      mood: parsed.mood,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      genre: parsed.genre,
      country: parsed.country,
      decade: parsed.decade,
      rarity_score: clamp(parsed.rarity_score),
      quality_score: clamp(parsed.quality_score),
      discovery_score: clamp(parsed.discovery_score),
      sample_score: clamp(parsed.sample_score),
      reason: parsed.reason,
      decision: parsed.decision,
    };
  } catch {
    return analyzeHeuristic(candidate);
  }
}
