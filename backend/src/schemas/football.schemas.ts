import { z } from 'zod';

// football-data.org competition codes are 2-4 uppercase letters (PL, BSA, CL, WC, ...).
export const competitionCodeParams = z.object({
  code: z.string().regex(/^[A-Z]{2,4}$/, 'رمز المسابقة غير صالح'),
});

// The full set of match statuses football-data.org's `?status=` filter accepts.
export const matchStatusQuery = z.object({
  status: z
    .enum([
      'SCHEDULED',
      'TIMED',
      'IN_PLAY',
      'PAUSED',
      'FINISHED',
      'SUSPENDED',
      'POSTPONED',
      'CANCELLED',
      'AWARDED',
    ])
    .optional(),
});
