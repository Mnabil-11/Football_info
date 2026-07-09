/**
 * Minimal typed DTOs for the football-data.org v4 responses we consume.
 * Only the fields the app uses are modeled (the API returns much more).
 */

export interface FdArea {
  id: number;
  name: string;
  code: string | null;
  flag: string | null;
}

export interface FdSeason {
  id: number;
  startDate: string;
  endDate: string;
  currentMatchday: number | null;
}

export interface FdCompetition {
  id: number;
  name: string;
  code: string;
  type: string;
  emblem: string | null;
  area: FdArea;
  currentSeason: FdSeason | null;
}

export interface FdCompetitionsResponse {
  count: number;
  competitions: FdCompetition[];
}

export interface FdTeamRef {
  id: number;
  name: string;
  shortName: string | null;
  tla: string | null;
  crest: string | null;
}

export interface FdScore {
  home: number | null;
  away: number | null;
}

export interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  stage: string | null;
  homeTeam: FdTeamRef;
  awayTeam: FdTeamRef;
  score: {
    winner: string | null;
    fullTime: FdScore;
  };
  competition?: {
    id: number;
    name: string;
    emblem: string | null;
  };
}

export interface FdMatchesResponse {
  count: number;
  matches: FdMatch[];
}

export interface FdStandingRow {
  position: number;
  team: FdTeamRef;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface FdStanding {
  stage: string;
  type: string;
  table: FdStandingRow[];
}

export interface FdStandingsResponse {
  competition: FdCompetition;
  season: FdSeason;
  standings: FdStanding[];
}

export interface FdScorer {
  player: {
    id: number;
    name: string;
    nationality: string | null;
    section: string | null;
    position: string | null;
  };
  team: FdTeamRef;
  playedMatches: number | null;
  goals: number | null;
  assists: number | null;
  penalties: number | null;
}

export interface FdScorersResponse {
  count: number;
  competition: FdCompetition;
  scorers: FdScorer[];
}

export interface FdTeamsResponse {
  count: number;
  teams: FdTeamRef[];
}

/* ── /matches/:id (returns the match object directly, no envelope) ──────── */

export interface FdMatchDetail extends FdMatch {
  venue?: string | null;
  referees?: { id: number; name: string; type: string }[];
}

/* ── /persons/:id ─────────────────────────────────────────────────────────── */

export interface FdPerson {
  id: number;
  name: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  position: string | null;
  shirtNumber: number | null;
  currentTeam?: {
    id: number;
    name: string;
    crest: string | null;
  };
}
