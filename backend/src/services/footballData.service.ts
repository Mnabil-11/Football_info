import axios, { AxiosError, AxiosInstance } from 'axios';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { TtlCache } from '../utils/cache';
import {
  FdCompetitionsResponse,
  FdMatchDetail,
  FdMatchesResponse,
  FdPerson,
  FdScorersResponse,
  FdStandingsResponse,
  FdTeamsResponse,
} from '../types/footballData';

const client: AxiosInstance = axios.create({
  baseURL: 'https://api.football-data.org/v4',
  headers: { 'X-Auth-Token': env.FOOTBALL_DATA_KEY },
  timeout: 15_000,
});

// Cache upstream responses briefly to respect the free-tier rate limit.
const cache = new TtlCache(60_000);

/** Perform a cached GET against football-data.org, mapping errors to ApiError. */
const get = async <T>(
  path: string,
  cacheKey: string,
  ttlMs?: number
): Promise<T> => {
  try {
    return await cache.wrap<T>(
      cacheKey,
      async () => {
        const { data } = await client.get<T>(path);
        return data;
      },
      ttlMs
    );
  } catch (err) {
    if (err instanceof AxiosError) {
      const status = err.response?.status;
      if (status === 429) {
        throw new ApiError(429, 'تم تجاوز حد الطلبات المسموح. حاول بعد قليل.');
      }
      if (status === 403) {
        throw new ApiError(
          403,
          'هذه المسابقة غير متاحة في خطتك المجانية على football-data.org.'
        );
      }
      if (status === 404) {
        throw ApiError.notFound('المورد غير موجود.');
      }
      throw new ApiError(502, 'تعذر الاتصال بمزود البيانات (football-data.org).');
    }
    throw err;
  }
};

export const getCompetitions = (): Promise<FdCompetitionsResponse> =>
  // Competitions rarely change; cache for 10 minutes.
  get<FdCompetitionsResponse>('/competitions', 'competitions', 600_000);

export const getStandings = (code: string): Promise<FdStandingsResponse> =>
  get<FdStandingsResponse>(
    `/competitions/${code}/standings`,
    `standings:${code}`
  );

export const getScorers = (code: string): Promise<FdScorersResponse> =>
  get<FdScorersResponse>(
    `/competitions/${code}/scorers`,
    `scorers:${code}`
  );

export const getCompetitionTeams = (code: string): Promise<FdTeamsResponse> =>
  get<FdTeamsResponse>(
    `/competitions/${code}/teams`,
    `teams:${code}`,
    600_000
  );

export const getCompetitionMatches = (
  code: string,
  status?: string
): Promise<FdMatchesResponse> => {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : '';
  return get<FdMatchesResponse>(
    `/competitions/${code}/matches${suffix}`,
    `matches:${code}:${status ?? 'all'}`,
    120_000
  );
};

export const getMatchById = (id: number): Promise<FdMatchDetail> =>
  get<FdMatchDetail>(`/matches/${id}`, `match:${id}`, 60_000);

export const getPersonById = (id: number): Promise<FdPerson> =>
  get<FdPerson>(`/persons/${id}`, `person:${id}`, 3_600_000);

export const getTeamMatches = (
  teamId: number,
  status?: string
): Promise<FdMatchesResponse> => {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : '';
  return get<FdMatchesResponse>(
    `/teams/${teamId}/matches${suffix}`,
    `team-matches:${teamId}:${status ?? 'all'}`,
    120_000
  );
};
