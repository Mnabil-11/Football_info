/** Minimal fields needed to build a calendar event for a match — decoupled
 * from the exact Match/MatchDetail shape so any screen with this much info
 * can offer "add to calendar" without extra plumbing. */
export interface IcsMatchInput {
  id: number;
  utcDate: string;
  homeTeamName: string;
  awayTeamName: string;
  competitionName?: string | null;
  venue?: string | null;
}

const MATCH_DURATION_MS = 2 * 60 * 60 * 1000; // ~2h covers stoppage/halftime

/** UTC timestamp in iCalendar's basic format: YYYYMMDDTHHMMSSZ. */
const toIcsDate = (date: Date): string =>
  `${date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;

/** Escapes text per RFC 5545 §3.3.11 (backslash, comma, semicolon, newline). */
const escapeIcsText = (text: string): string =>
  text.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');

/** Builds a single-event .ics file's contents for a match. */
export const buildMatchIcs = (match: IcsMatchInput): string => {
  const start = new Date(match.utcDate);
  const end = new Date(start.getTime() + MATCH_DURATION_MS);
  const summary = `${match.homeTeamName} vs ${match.awayTeamName}`;

  // iCalendar requires CRLF line endings.
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Football Info//Match Reminder//AR',
    'BEGIN:VEVENT',
    `UID:match-${match.id}@football-info`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
  ];
  if (match.competitionName) {
    lines.push(`DESCRIPTION:${escapeIcsText(match.competitionName)}`);
  }
  if (match.venue) {
    lines.push(`LOCATION:${escapeIcsText(match.venue)}`);
  }
  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
};

/** Triggers a browser download of the given .ics content. */
export const downloadIcsFile = (filename: string, icsContent: string): void => {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
