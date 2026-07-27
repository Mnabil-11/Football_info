import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../services/footballData.service', () => ({
  getCompetitions: vi.fn(),
  getStandings: vi.fn(),
  getScorers: vi.fn(),
  getCompetitionTeams: vi.fn(),
  getCompetitionMatches: vi.fn(),
  getTeamById: vi.fn(),
  getTeamMatches: vi.fn(),
  getMatchById: vi.fn(),
  getPersonById: vi.fn(),
}));

vi.mock('../services/apiFootball.service', () => ({
  findFixtureByTeamsAndDate: vi.fn().mockResolvedValue(null),
  getFixtureLineups: vi.fn(),
  getFixtureEvents: vi.fn(),
  getFixtureStatistics: vi.fn(),
  findPlayerByNameAndTeam: vi.fn().mockResolvedValue(null),
  getPlayerByAfId: vi.fn(),
}));

import { getCompetitionMatches, getCompetitions, getStandings } from '../services/footballData.service';
import app from '../app';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/football/competitions', () => {
  it('returns the upstream data with a Cache-Control header matching its TTL', async () => {
    vi.mocked(getCompetitions).mockResolvedValue({
      count: 1,
      competitions: [{ id: 1, name: 'Premier League', code: 'PL', type: 'LEAGUE', emblem: null, area: { id: 1, name: 'England', code: 'ENG', flag: null }, currentSeason: null }],
    });

    const res = await request(app).get('/api/football/competitions');

    expect(res.status).toBe(200);
    expect(res.body.data.competitions).toHaveLength(1);
    expect(res.headers['cache-control']).toBe('public, max-age=600');
  });

  it('carries the rate-limit headers', async () => {
    vi.mocked(getCompetitions).mockResolvedValue({ count: 0, competitions: [] });

    const res = await request(app).get('/api/football/competitions');

    expect(res.headers['ratelimit-limit']).toBe('300');
  });
});

describe('GET /api/football/competitions/:code/standings', () => {
  it('rejects an invalid competition code before calling the service', async () => {
    const res = await request(app).get('/api/football/competitions/xyz123/standings');

    expect(res.status).toBe(400);
    expect(getStandings).not.toHaveBeenCalled();
  });

  it('passes a valid code through to the service', async () => {
    vi.mocked(getStandings).mockResolvedValue({
      competition: { id: 1, name: 'Brasileiro', code: 'BSA', type: 'LEAGUE', emblem: null, area: { id: 1, name: 'Brazil', code: 'BRA', flag: null }, currentSeason: null },
      season: { id: 1, startDate: '2026-01-01', endDate: '2026-12-01', currentMatchday: 1 },
      standings: [],
    });

    const res = await request(app).get('/api/football/competitions/BSA/standings');

    expect(res.status).toBe(200);
    expect(getStandings).toHaveBeenCalledWith('BSA');
  });
});

describe('GET /api/football/competitions/:code/matches', () => {
  it('rejects an unknown status value', async () => {
    const res = await request(app).get(
      '/api/football/competitions/BSA/matches?status=NOT_A_STATUS'
    );

    expect(res.status).toBe(400);
    expect(getCompetitionMatches).not.toHaveBeenCalled();
  });

  it('accepts a known status value', async () => {
    vi.mocked(getCompetitionMatches).mockResolvedValue({ count: 0, matches: [] });

    const res = await request(app).get(
      '/api/football/competitions/BSA/matches?status=FINISHED'
    );

    expect(res.status).toBe(200);
    expect(getCompetitionMatches).toHaveBeenCalledWith('BSA', 'FINISHED');
  });
});

describe('GET /api/football/teams/:id', () => {
  it('rejects a non-numeric id', async () => {
    const res = await request(app).get('/api/football/teams/not-a-number');
    expect(res.status).toBe(400);
  });
});
