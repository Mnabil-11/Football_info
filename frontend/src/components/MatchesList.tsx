import { useMemo } from 'react';
import { getBackendErrorMessage } from '../api/http';
import { Match } from '../types/football';
import { useCompetitionMatches } from '../hooks/useFootball';
import MatchCard, { isFinished } from './MatchCard';
import Spinner from './common/Spinner';
import ErrorState from './common/ErrorState';
import EmptyState from './common/EmptyState';

interface MatchesListProps {
  code: string;
}

const MatchesList = ({ code }: MatchesListProps) => {
  const {
    data: matches = [],
    isPending,
    error,
    refetch,
  } = useCompetitionMatches(code);

  const { upcoming, past } = useMemo(() => {
    const up: Match[] = [];
    const done: Match[] = [];
    for (const m of matches) {
      (isFinished(m.status) ? done : up).push(m);
    }
    up.sort((a, b) => +new Date(a.utcDate) - +new Date(b.utcDate));
    done.sort((a, b) => +new Date(b.utcDate) - +new Date(a.utcDate));
    return { upcoming: up, past: done };
  }, [matches]);

  if (isPending) {
    return <Spinner label="جاري تحميل المباريات..." />;
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
      {past.length > 0 && (
        <section>
          <h3 className="mb-4 text-lg font-bold text-gray-900">أحدث النتائج</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.slice(0, 12).map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}
      {upcoming.length > 0 && (
        <section>
          <h3 className="mb-4 text-lg font-bold text-gray-900">المباريات القادمة</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.slice(0, 12).map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default MatchesList;
