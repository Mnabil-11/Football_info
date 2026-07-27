import { useQuery } from '@tanstack/react-query';
import {
  fetchCompetitionMatches,
  fetchCompetitions,
  fetchCompetitionTeams,
  fetchMatchDetail,
  fetchPlayerAf,
  fetchPlayerFd,
  fetchScorers,
  fetchStandings,
  fetchTeamDetail,
  fetchTeamMatches,
} from '../api/footballApi';
import { Match, MatchDetailResponse, StandingRow } from '../types/football';
import { isLive } from '../utils/matchStatus';

/**
 * React Query wrappers around the backend football proxy.
 *
 * Everything under `/api/football/*` is already cached server-side with
 * per-resource TTLs (see backend/src/services/footballData.service.ts), so the
 * client-side `staleTime` here mirrors those values: switching tabs or going
 * back to a page re-uses the cached data instead of re-hitting the provider's
 * rate-limited free tier.
 */

/** Query keys, kept in one place so invalidation stays consistent. */
export const footballKeys = {
  competitions: ['football', 'competitions'] as const,
  standings: (code: string) => ['football', 'standings', code] as const,
  scorers: (code: string) => ['football', 'scorers', code] as const,
  competitionMatches: (code: string, status?: string) =>
    ['football', 'competition-matches', code, status ?? 'all'] as const,
  teamMatches: (teamId: number, status?: string) =>
    ['football', 'team-matches', teamId, status ?? 'all'] as const,
  competitionTeams: (code: string) => ['football', 'competition-teams', code] as const,
  team: (teamId: number) => ['football', 'team', teamId] as const,
  match: (id: number) => ['football', 'match', id] as const,
  playerFd: (id: number) => ['football', 'player', 'fd', id] as const,
  playerAf: (id: number, season?: number) =>
    ['football', 'player', 'af', id, season ?? 'current'] as const,
};

const MINUTE = 60_000;
// TanStack Query only fires `refetchInterval` while the tab is focused
// (refetchIntervalInBackground defaults to false), so this never polls a
// backgrounded tab.
const LIVE_POLL_MS = 30_000;

export const useCompetitions = () =>
  useQuery({
    queryKey: footballKeys.competitions,
    queryFn: fetchCompetitions,
    staleTime: 10 * MINUTE,
  });

/**
 * The league table. football-data.org returns several standing groups
 * (TOTAL / HOME / AWAY, or one per group in cup competitions); we surface the
 * TOTAL table, falling back to the first group.
 */
export const useStandings = (code: string) =>
  useQuery({
    queryKey: footballKeys.standings(code),
    queryFn: () => fetchStandings(code),
    enabled: code.length > 0,
    staleTime: 5 * MINUTE,
    select: (standings): StandingRow[] => {
      const total = standings.find((s) => s.type === 'TOTAL') ?? standings[0];
      return total ? total.table : [];
    },
  });

export const useScorers = (code: string) =>
  useQuery({
    queryKey: footballKeys.scorers(code),
    queryFn: () => fetchScorers(code),
    enabled: code.length > 0,
    staleTime: 5 * MINUTE,
  });

/** Polls every 30s while any match in the list is in progress; stops otherwise. */
const hasLiveMatch = (matches: Match[] | undefined): boolean =>
  matches?.some((m) => isLive(m.status)) ?? false;

export const useCompetitionMatches = (code: string, status?: string) =>
  useQuery({
    queryKey: footballKeys.competitionMatches(code, status),
    queryFn: () => fetchCompetitionMatches(code, status),
    enabled: code.length > 0,
    staleTime: 2 * MINUTE,
    refetchInterval: (query) => (hasLiveMatch(query.state.data) ? LIVE_POLL_MS : false),
  });

export const useTeamMatches = (teamId: number, status?: string) =>
  useQuery({
    queryKey: footballKeys.teamMatches(teamId, status),
    queryFn: () => fetchTeamMatches(teamId, status),
    enabled: Number.isInteger(teamId) && teamId > 0,
    staleTime: 2 * MINUTE,
    refetchInterval: (query) => (hasLiveMatch(query.state.data) ? LIVE_POLL_MS : false),
  });

export const useCompetitionTeamsList = (code: string) =>
  useQuery({
    queryKey: footballKeys.competitionTeams(code),
    queryFn: () => fetchCompetitionTeams(code),
    enabled: code.length > 0,
    staleTime: 10 * MINUTE,
  });

export const useTeamDetail = (teamId: number) =>
  useQuery({
    queryKey: footballKeys.team(teamId),
    queryFn: () => fetchTeamDetail(teamId),
    enabled: Number.isInteger(teamId) && teamId > 0,
    staleTime: 60 * MINUTE,
  });

export const useMatchDetail = (matchId: number) =>
  useQuery({
    queryKey: footballKeys.match(matchId),
    queryFn: () => fetchMatchDetail(matchId),
    enabled: Number.isInteger(matchId) && matchId > 0,
    staleTime: MINUTE,
    refetchInterval: (query) => {
      const data = query.state.data as MatchDetailResponse | undefined;
      return data && isLive(data.match.status) ? LIVE_POLL_MS : false;
    },
  });

/**
 * Player bio from football-data.org (+ best-effort API-Football stats).
 * `enabled` lets a caller that supports both providers keep the hook order
 * stable while only fetching from the one the route asked for.
 */
export const usePlayerFd = (personId: number, enabled = true) =>
  useQuery({
    queryKey: footballKeys.playerFd(personId),
    queryFn: () => fetchPlayerFd(personId),
    enabled: enabled && Number.isInteger(personId) && personId > 0,
    staleTime: 60 * MINUTE,
  });

/** Direct API-Football player profile + season stats. */
export const usePlayerAf = (playerId: number, enabled = true, season?: number) =>
  useQuery({
    queryKey: footballKeys.playerAf(playerId, season),
    queryFn: () => fetchPlayerAf(playerId, season),
    enabled: enabled && Number.isInteger(playerId) && playerId > 0,
    staleTime: 60 * MINUTE,
  });
