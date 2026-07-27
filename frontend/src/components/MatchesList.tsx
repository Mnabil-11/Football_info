import { useMemo } from 'react';
import { getBackendErrorMessage } from '../api/http';
import { Match } from '../types/football';
import { formatDate } from '../utils/date';
import { isFinished } from '../utils/matchStatus';
import { useCompetitionMatches } from '../hooks/useFootball';
import MatchCard from './MatchCard';
import { SkeletonMatchGrid } from './common/Skeleton';
import ErrorState from './common/ErrorState';
import EmptyState from './common/EmptyState';

interface MatchesListProps {
  code: string;
}

/** One heading + grid per calendar day, in the given display order. */
interface DayGroup {
  day: string;
  matches: Match[];
}

const groupByDay = (matches: Match[]): DayGroup[] => {
  const groups: DayGroup[] = [];
  const indexByDay = new Map<string, number>();
  for (const m of matches) {
    const day = formatDate(m.utcDate);
    const existingIndex = indexByDay.get(day);
    if (existingIndex === undefined) {
      indexByDay.set(day, groups.length);
      groups.push({ day, matches: [m] });
    } else {
      groups[existingIndex].matches.push(m);
    }
  }
  return groups;
};

const MatchesList = ({ code }: MatchesListProps) => {
  const {
    data: matches = [],
    isPending,
    error,
    refetch,
  } = useCompetitionMatches(code);

  const { upcomingByDay, pastByDay } = useMemo(() => {
    const up: Match[] = [];
    const done: Match[] = [];
    for (const m of matches) {
      (isFinished(m.status) ? done : up).push(m);
    }
    up.sort((a, b) => +new Date(a.utcDate) - +new Date(b.utcDate));
    done.sort((a, b) => +new Date(b.utcDate) - +new Date(a.utcDate));
    return {
      upcomingByDay: groupByDay(up.slice(0, 12)),
      pastByDay: groupByDay(done.slice(0, 12)),
    };
  }, [matches]);

  if (isPending) {
    return (
      <div className="mt-6">
        <SkeletonMatchGrid />
      </div>
    );
  }
  if (error) {
    return (
      <ErrorState
        message={getBackendErrorMessage(error, 'تعذر تحميل المباريات.')}
        onRetry={() => void refetch()}
      />
    );
  }
  if (matches.length === 0) {
    return <EmptyState message="لا توجد مباريات لهذه المسابقة." />;
  }

  return (
    <div className="mt-6 space-y-8">
      {pastByDay.length > 0 && (
        <section>
          <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">أحدث النتائج</h3>
          <div className="space-y-5">
            {pastByDay.map((group) => (
              <div key={group.day}>
                <h4 className="mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500">{group.day}</h4>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.matches.map((m) => (
                    <MatchCard key={m.id} match={m} showDate={false} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {upcomingByDay.length > 0 && (
        <section>
          <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">المباريات القادمة</h3>
          <div className="space-y-5">
            {upcomingByDay.map((group) => (
              <div key={group.day}>
                <h4 className="mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500">{group.day}</h4>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.matches.map((m) => (
                    <MatchCard key={m.id} match={m} showDate={false} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default MatchesList;
