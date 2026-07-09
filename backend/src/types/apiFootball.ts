/**
 * Minimal typed DTOs for the API-Football (RapidAPI, v3) responses we consume.
 * Used only for match enrichment (lineups/events/statistics) and player season
 * stats, since football-data.org doesn't provide these at any tier.
 */

export interface AfResponse<T> {
  response: T[];
}

/* ── /teams?search= (used for fuzzy team-name matching) ──────────────────── */

export interface AfTeam {
  id: number;
  name: string;
  logo: string;
}

export interface AfTeamEntry {
  team: AfTeam;
}

/* ── /fixtures?date=&team= (used to find the fixture id by team+date) ───── */

export interface AfFixtureRef {
  fixture: { id: number; date: string };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
}

/* ── /fixtures/lineups?fixture= ──────────────────────────────────────────── */

export interface AfLineupPlayer {
  player: {
    id: number;
    name: string;
    number: number | null;
    pos: string | null;
    /** "row:col" grid position used to plot the player on a pitch, e.g. "4:2". */
    grid: string | null;
  };
}

export interface AfLineup {
  team: { id: number; name: string; logo: string | null };
  formation: string | null;
  startXI: AfLineupPlayer[];
  substitutes: AfLineupPlayer[];
  coach: { id: number | null; name: string | null } | null;
}

/* ── /fixtures/events?fixture= ───────────────────────────────────────────── */

export interface AfEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string };
  player: { id: number | null; name: string | null };
  assist: { id: number | null; name: string | null };
  type: string; // "Goal" | "Card" | "subst" | "Var"
  detail: string; // e.g. "Normal Goal", "Yellow Card", "Red Card"
}

/* ── /fixtures/statistics?fixture= ───────────────────────────────────────── */

export interface AfStatItem {
  type: string;
  value: number | string | null;
}

export interface AfTeamStatistics {
  team: { id: number; name: string; logo: string | null };
  statistics: AfStatItem[];
}

/* ── /players?id=&season= ────────────────────────────────────────────────── */

export interface AfPlayer {
  id: number;
  name: string;
  photo: string;
  age: number | null;
  nationality: string | null;
  height: string | null;
  weight: string | null;
}

export interface AfPlayerGames {
  appearences: number | null;
  minutes: number | null;
  number: number | null;
  position: string | null;
  rating: string | null;
}

export interface AfPlayerGoals {
  total: number | null;
  assists: number | null;
}

export interface AfPlayerCards {
  yellow: number | null;
  red: number | null;
}

export interface AfPlayerStatistics {
  team: { id: number; name: string; logo: string | null };
  games: AfPlayerGames;
  goals: AfPlayerGoals;
  cards: AfPlayerCards;
}

export interface AfPlayerEntry {
  player: AfPlayer;
  statistics: AfPlayerStatistics[];
}
