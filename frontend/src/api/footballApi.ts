import { http } from './http';
import { ApiEnvelope } from '../types/auth';
import {
  AfPlayerResponse,
  Competition,
  FdPlayerResponse,
  Match,
  MatchDetailResponse,
  Scorer,
  Standing,
} from '../types/football';

/**
 * These call our backend proxy (`/api/football/*`), which talks to
 * football-data.org server-side. The upstream payload is returned under `data`.
 */

interface CompetitionsData {
  competitions: Competition[];
}

interface StandingsData {
  standings: Standing[];
}

interface ScorersData {
  scorers: Scorer[];
}

interface MatchesData {
  matches: Match[];
}

export const fetchCompetitions = async (): Promise<Competition[]> => {
  const { data } = await http.get<ApiEnvelope<CompetitionsData>>(
    '/football/competitions'
  );
  return data.data.competitions;
};

export const fetchStandings = async (code: string): Promise<Standing[]> => {
  const { data } = await http.get<ApiEnvelope<StandingsData>>(
    `/football/competitions/${code}/standings`
  );
  return data.data.standings;
};

export const fetchScorers = async (code: string): Promise<Scorer[]> => {
  const { data } = await http.get<ApiEnvelope<ScorersData>>(
    `/football/competitions/${code}/scorers`
  );
  return data.data.scorers;
};

export const fetchCompetitionMatches = async (
  code: string,
  status?: string
): Promise<Match[]> => {
  const { data } = await http.get<ApiEnvelope<MatchesData>>(
    `/football/competitions/${code}/matches`,
    { params: status ? { status } : undefined }
  );
  return data.data.matches;
};

export const fetchTeamMatches = async (
  teamId: number,
  status?: string
): Promise<Match[]> => {
  const { data } = await http.get<ApiEnvelope<MatchesData>>(
    `/football/teams/${teamId}/matches`,
    { params: status ? { status } : undefined }
  );
  return data.data.matches;
};

/**
 * Full match detail: base info from football-data.org (always present) plus
 * best-effort API-Football enrichment (lineups/events/statistics), which is
 * `null` when no confident cross-provider match was found.
 */
export const fetchMatchDetail = async (
  matchId: number
): Promise<MatchDetailResponse> => {
  const { data } = await http.get<ApiEnvelope<MatchDetailResponse>>(
    `/football/matches/${matchId}`
  );
  return data.data;
};

/** football-data.org player bio + best-effort API-Football stats enrichment. */
export const fetchPlayerFd = async (
  personId: number
): Promise<FdPlayerResponse> => {
  const { data } = await http.get<ApiEnvelope<FdPlayerResponse>>(
    `/football/players/fd/${personId}`
  );
  return data.data;
};

/** Direct API-Football player profile + season stats. */
export const fetchPlayerAf = async (
  playerId: number,
  season?: number
): Promise<AfPlayerResponse> => {
  const { data } = await http.get<ApiEnvelope<AfPlayerResponse>>(
    `/football/players/af/${playerId}`,
    { params: season ? { season } : undefined }
  );
  return data.data;
};
