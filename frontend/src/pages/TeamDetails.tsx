import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getBackendErrorMessage } from '../api/http';
import { teamRefToSummary } from '../types/football';
import { useTeamDetail, useTeamMatches } from '../hooks/useFootball';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import MatchCard from '../components/MatchCard';
import { hideOnImgError } from '../utils/img';
import { isFinished } from '../utils/matchStatus';
import { SkeletonBox, SkeletonMatchGrid } from '../components/common/Skeleton';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';

interface TeamDetailsProps {
  onRequireAuth: () => void;
}

const TeamDetails = ({ onRequireAuth }: TeamDetailsProps) => {
  const { id } = useParams<{ id: string }>();
  const teamId = Number(id);
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  const { data: team, isPending, error, refetch } = useTeamDetail(teamId);
  const { data: matches } = useTeamMatches(teamId);

  useDocumentTitle(team?.name);

  const { upcoming, past } = useMemo(() => {
    const up = (matches ?? [])
      .filter((m) => !isFinished(m.status))
      .sort((a, b) => +new Date(a.utcDate) - +new Date(b.utcDate))
      .slice(0, 6);
    const done = (matches ?? [])
      .filter((m) => isFinished(m.status))
      .sort((a, b) => +new Date(b.utcDate) - +new Date(a.utcDate))
      .slice(0, 6);
    return { upcoming: up, past: done };
  }, [matches]);

  const handleFavorite = () => {
    if (!team) {
      return;
    }
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    // The optimistic cache update already rolls back visually on failure;
    // this just prevents an unhandled promise rejection reaching the console.
    toggleFavorite(teamRefToSummary(team)).catch(() => {});
  };

  if (!Number.isInteger(teamId) || teamId <= 0) {
    return <ErrorState message="معرّف الفريق غير صالح." />;
  }
  if (isPending) {
    return (
      <div>
        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <SkeletonBox className="h-20 w-20 rounded-xl" />
          <div className="flex-1 space-y-2">
            <SkeletonBox className="h-6 w-40" />
            <SkeletonBox className="h-4 w-32" />
          </div>
        </div>
        <div className="mt-6">
          <SkeletonMatchGrid count={3} />
        </div>
      </div>
    );
  }
  if (error || !team) {
    return (
      <ErrorState
        message={getBackendErrorMessage(error, 'تعذر تحميل بيانات الفريق.')}
        onRetry={() => void refetch()}
      />
    );
  }

  const hasCoach = Boolean(team.coach?.name);
  const hasSquad = team.squad.length > 0;

  return (
    <div>
      <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {team.crest && (
          <img
            src={team.crest}
            alt={team.name}
            width={80}
            height={80}
            className="h-20 w-20 object-contain"
            onError={hideOnImgError}
          />
        )}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{team.name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{team.area.name}</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
            {team.venue && <span>الملعب: {team.venue}</span>}
            {team.founded && <span>تأسس: {team.founded}</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={handleFavorite}
          className="-m-2 p-2 text-2xl"
          aria-label="إضافة إلى المفضلة"
        >
          {isFavorite(team.id) ? '❤️' : '🤍'}
        </button>
      </div>

      {hasCoach && (
        <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4 text-sm dark:border-gray-800 dark:bg-gray-900">
          <span className="text-gray-500 dark:text-gray-400">المدرب: </span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{team.coach!.name}</span>
        </div>
      )}

      <div className="mt-6">
        <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">القائمة</h3>
        {hasSquad ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {team.squad.map((member) => (
              <div
                key={member.id}
                className="rounded-xl border border-gray-100 bg-white p-3 text-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <p className="font-medium text-gray-900 dark:text-gray-100">{member.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {member.position ?? '—'}
                  {member.nationality ? ` · ${member.nationality}` : ''}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="لا تتوفر قائمة اللاعبين لهذا الفريق حالياً." icon="👥" />
        )}
      </div>

      <div className="mt-8 space-y-8">
        {past.length > 0 && (
          <section>
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">أحدث النتائج</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </section>
        )}
        {upcoming.length > 0 && (
          <section>
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">المباريات القادمة</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default TeamDetails;
