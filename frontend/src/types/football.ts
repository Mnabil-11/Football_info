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

/** Player shape stored in favorites. */
export interface PlayerSummary {
  id: number;
  name: string;
  photo: string | null;
}

/* ── Match Details (/match/:id) ──────────────────────────────────────────── */

export interface MatchDetail extends Match {
  venue?: string | null;
  referees?: { id: number; name: string; type: string }[];
}

export interface LineupPlayerEntry {
  player: {
    id: number;
    name: string;
    number: number | null;
    pos: string | null;
    /** "row:col" grid position, e.g. "4:2" — used to plot on the pitch. */
    grid: string | null;
  };
}

export interface Lineup {
  team: { id: number; name: string; logo: string | null };
  formation: string | null;
  startXI: LineupPlayerEntry[];
  substitutes: LineupPlayerEntry[];
  coach: { id: number | null; name: string | null } | null;
}

export interface MatchEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string };
  player: { id: number | null; name: string | null };
  assist: { id: number | null; name: string | null };
  type: string;
  detail: string;
}

export interface StatItem {
  type: string;
  value: number | string | null;
}

export interface TeamStatistics {
  team: { id: number; name: string; logo: string | null };
  statistics: StatItem[];
}

export interface MatchEnrichment {
  lineups: Lineup[];
  events: MatchEvent[];
  statistics: TeamStatistics[];
}

export interface MatchDetailResponse {
  match: MatchDetail;
  enrichment: MatchEnrichment | null;
}

/* ── Player Details (/player/:provider/:id) ──────────────────────────────── */

/** Bio from football-data.org (`fd` provider). */
export interface FdPlayerProfile {
  id: number;
  name: string;
  dateOfBirth: string | null;
  nationality: string | null;
  position: string | null;
  shirtNumber: number | null;
  currentTeam?: { id: number; name: string; crest: string | null };
}

/** API-Football player profile + season statistics (direct fetch or enrichment). */
export interface AfPlayerStatsEntry {
  player: {
    id: number;
    name: string;
    photo: string;
    age: number | null;
    nationality: string | null;
    height: string | null;
    weight: string | null;
  };
  statistics: {
    team: { id: number; name: string; logo: string | null };
    games: {
      appearences: number | null;
      minutes: number | null;
      number: number | null;
      position: string | null;
      rating: string | null;
    };
    goals: { total: number | null; assists: number | null };
    cards: { yellow: number | null; red: number | null };
  }[];
}

export interface FdPlayerResponse {
  profile: FdPlayerProfile;
  statsEnrichment: AfPlayerStatsEntry | null;
}

export interface AfPlayerResponse {
  profile: AfPlayerStatsEntry;
}
