import { describe, expect, it } from 'vitest';
import { buildMatchIcs } from './ics';

describe('buildMatchIcs', () => {
  it('builds a valid single-event ICS with CRLF line endings', () => {
    const ics = buildMatchIcs({
      id: 42,
      utcDate: '2026-07-27T20:00:00Z',
      homeTeamName: 'Flamengo',
      awayTeamName: 'Palmeiras',
      competitionName: 'Campeonato Brasileiro Série A',
      venue: 'Estádio Maracanã',
    });

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('UID:match-42@football-info');
    expect(ics).toContain('DTSTART:20260727T200000Z');
    expect(ics).toContain('DTEND:20260727T220000Z'); // +2h
    expect(ics).toContain('SUMMARY:Flamengo vs Palmeiras');
    expect(ics).toContain('LOCATION:Estádio Maracanã');
    expect(ics.includes('\r\n')).toBe(true);
  });

  it('omits DESCRIPTION/LOCATION when not provided', () => {
    const ics = buildMatchIcs({
      id: 1,
      utcDate: '2026-01-01T00:00:00Z',
      homeTeamName: 'A',
      awayTeamName: 'B',
    });

    expect(ics).not.toContain('DESCRIPTION:');
    expect(ics).not.toContain('LOCATION:');
  });

  it('escapes commas and semicolons in text fields', () => {
    const ics = buildMatchIcs({
      id: 2,
      utcDate: '2026-01-01T00:00:00Z',
      homeTeamName: 'A, B',
      awayTeamName: 'C; D',
    });

    expect(ics).toContain('SUMMARY:A\\, B vs C\\; D');
  });
});
