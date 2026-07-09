import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import { TtlCache } from '../utils/cache';
import {
  AfEvent,
  AfFixtureRef,
  AfLineup,
  AfPlayerEntry,
  AfResponse,
  AfTeamEntry,
  AfTeamStatistics,
} from '../types/apiFootball';

/**
 * API-Football (RapidAPI) client — used ONLY for match-detail enrichment
 * (lineups/events/statistics) and player season stats, since football-data.org
 * doesn't provide these at any tier. Every function here is "best effort":
 * on any failure (not subscribed, rate limited, no match found, network error)
 * it resolves to `null`/empty rather than throwing, so callers can render a
 * graceful "unavailable" state instead of breaking the whole page.
 */
const client: AxiosInstance = axios.create({
  baseURL: `https://${env.APIFOOTBALL_HOST}/v3`,
  headers: {
    'x-rapidapi-key': env.APIFOOTBALL_KEY,
    'x-rapidapi-host': env.APIFOOTBALL_HOST,
  },
  timeout: 15_000,
});

const cache = new TtlCache(300_000);

/** GET against API-Football, returning `null` on ANY failure (never throws). */
const safeGet = async <T>(
  path: string,
  params: Record<string, string | number>,
  cacheKey: string
): Promise<T[] | null> => {
  try {
    return await cache.wrap<T[]>(cacheKey, async () => {
      const { data } = await client.get<AfResponse<T>>(path, { params });
      return data.response;
    });
  } catch {
    // Not subscribed (403), rate limited (429), network error, etc. — all
    // treated the same: enrichment is simply unavailable.
    return null;
  }
};

/** Current year first, then the known API-Football free-tier seasons as fallback. */
const CANDIDATE_SEASONS = [new Date().getUTCFullYear(), 2023, 2022, 2021];

/**
 * Best-effort: find the API-Football fixture id that corresponds to a
 * football-data.org match, by searching each team's name and cross-checking
 * fixtures on that date. There is no shared ID space between the two
 * providers, so this is inherently fuzzy — returns `null` if no confident
 * match is found.
 */
export const findFixtureByTeamsAndDate = async (
  homeName: string,
  awayName: string,
  isoDate: string
): Promise<number | null> => {
  const dateOnly = isoDate.slice(0, 10);

  const [homeTeams, awayTeams] = await Promise.all([
    safeGet<AfTeamEntry>('/teams', { search: homeName }, `af-team:${homeName}`),
    safeGet<AfTeamEntry>('/teams', { search: awayName }, `af-team:${awayName}`),
  ]);

  const homeId = homeTeams?.[0]?.team.id;
  const awayId = awayTeams?.[0]?.team.id;
  if (!homeId || !awayId) {
    return null;
  }

  const fixtures = await safeGet<AfFixtureRef>(
    '/fixtures',
    { team: homeId, date: dateOnly },
    `af-fixtures:${homeId}:${dateOnly}`
  );

  const match = fixtures?.find((f) => f.teams.away.id === awayId);
  return match?.fixture.id ?? null;
};

export const getFixtureLineups = (fixtureId: number): Promise<AfLineup[] | null> =>
  safeGet<AfLineup>(
    '/fixtures/lineups',
    { fixture: fixtureId },
    `af-lineups:${fixtureId}`
  );

export const getFixtureEvents = (fixtureId: number): Promise<AfEvent[] | null> =>
  safeGet<AfEvent>(
    '/fixtures/events',
    { fixture: fixtureId },
    `af-events:${fixtureId}`
  );

export const getFixtureStatistics = (
  fixtureId: number
): Promise<AfTeamStatistics[] | null> =>
  safeGet<AfTeamStatistics>(
    '/fixtures/statistics',
    { fixture: fixtureId },
    `af-stats:${fixtureId}`
  );

/** Direct fetch by API-Football's own player id (exact, no fuzzy matching). */
export const getPlayerByAfId = async (
  playerId: number,
  season?: number
): Promise<AfPlayerEntry | null> => {
  const seasons = season ? [season, ...CANDIDATE_SEASONS] : CANDIDATE_SEASONS;
  for (const s of seasons) {
    const result = await safeGet<AfPlayerEntry>(
      '/players',
      { id: playerId, season: s },
      `af-player:${playerId}:${s}`
    );
    if (result && result.length > 0) {
      return result[0];
    }
  }
  return null;
};

/**
 * Best-effort enrichment for a football-data.org-sourced player: search
 * API-Football by name and pick the entry whose current team name matches.
 */
export const findPlayerByNameAndTeam = async (
  name: string,
  teamName: string
): Promise<AfPlayerEntry | null> => {
  for (const season of CANDIDATE_SEASONS) {
    const results = await safeGet<AfPlayerEntry>(
      '/players',
      { search: name, season },
      `af-player-search:${name}:${season}`
    );
    const found = results?.find((entry) =>
      entry.statistics.some(
        (stat) => stat.team.name.toLowerCase() === teamName.toLowerCase()
      )
    );
    if (found) {
      return found;
    }
  }
  return null;
};
