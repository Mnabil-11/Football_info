/** Arabic labels for API-Football's known `fixtures/statistics` type strings. */
const STAT_LABELS: Record<string, string> = {
  'Shots on Goal': 'تسديدات على المرمى',
  'Shots off Goal': 'تسديدات خارج المرمى',
  'Total Shots': 'إجمالي التسديدات',
  'Blocked Shots': 'تسديدات محجوبة',
  'Shots insidebox': 'تسديدات داخل المنطقة',
  'Shots outsidebox': 'تسديدات خارج المنطقة',
  Fouls: 'الأخطاء',
  'Corner Kicks': 'الركلات الركنية',
  Offsides: 'التسلل',
  'Ball Possession': 'الاستحواذ',
  'Yellow Cards': 'بطاقات صفراء',
  'Red Cards': 'بطاقات حمراء',
  'Goalkeeper Saves': 'تصديات الحارس',
  'Total passes': 'إجمالي التمريرات',
  'Passes accurate': 'تمريرات دقيقة',
  'Passes %': 'دقة التمرير',
  expected_goals: 'الأهداف المتوقعة (xG)',
};

/** Falls back to the raw upstream label for any type not in the map above. */
export const translateStatType = (type: string): string => STAT_LABELS[type] ?? type;

/** Parses "55%" / 55 / null into a plain number for bar-width math. */
export const parseStatValue = (value: number | string | null): number => {
  if (value === null) {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  const parsed = parseFloat(value.replace('%', ''));
  return Number.isFinite(parsed) ? parsed : 0;
};
