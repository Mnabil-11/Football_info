/**
 * Frontend models for the football-data.org data served through our backend
 * proxy (`/api/football/*`). Shapes mirror the proxy payloads (which pass the
 * upstream JSON through under `data`).
 */

export interface Area {
  id: number;
  name: string;
  flag: string | null;
}

export interface Competition {
  id: number;
  name: string;
  code: string;
  type: string;
  emblem: string | null;
  area: Area;
}

export interface TeamRef {
  id: number;
  name: string;
  shortName: string | null;
  tla: string | null;
  crest: string | null;
}

/** Team shape stored in favorites (logo instead of crest). */
export interface TeamSummary {
  id: number;
  name: string;
  logo: string | null;
}

export const teamRefToSummary = (team: TeamRef): TeamSummary => ({
  id: team.id,
  name: team.name,
  logo: team.crest,
});

export interface MatchScore {
  home: number | null;
  away: number | null;
}

export interface Match {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  homeTeam: TeamRef;
  awayTeam: TeamRef;
  score: {
    winner: string | null;
    fullTime: MatchScore;
  };
  competition?: {
    id: number;
    name: string;
    emblem: string | null;
  };
}

export interface StandingRow {
  position: number;
  team: TeamRef;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface Standing {
  stage: string;
  type: string;
  table: StandingRow[];
}

export interface Scorer {
  player: {
    id: number;
    name: string;
    nationality: string | null;
  };
  team: TeamRef;
  playedMatches: number | null;
  goals: number | null;
  assists: number | null;
  penalties: number | null;
}
