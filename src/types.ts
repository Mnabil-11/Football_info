// Team Interface (SofaScore)
export interface Team {
  id: number;
  name: string;
  shortName: string;
}

// Category Interface (country/region grouping)
export interface Category {
  id: number;
  name: string;
}

// Tournament Interface
export interface Tournament {
  id: number;
  name: string;
  category: Category;
}

// Status Interface
export interface EventStatus {
  code: number;
  description: string;
  type: string;
}

// Score Interface
export interface Score {
  current?: number;
  display?: number;
}

// Scheduled Event (a single match)
export interface ScheduledEvent {
  id: number;
  startTimestamp: number;
  status: EventStatus;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: Score;
  awayScore: Score;
  tournament: Tournament;
}

// API Response Structure
export interface ScheduledEventsResponse {
  events: ScheduledEvent[];
}
