import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getBackendErrorMessage } from '../api/http';
import { teamRefToSummary } from '../types/football';
import { hideOnImgError } from '../utils/img';
import { isFinished, isLive } from '../utils/matchStatus';
import { parseStatValue, translateStatType } from '../utils/matchStats';
import { buildMatchIcs, downloadIcsFile } from '../utils/ics';
import { useMatchDetail } from '../hooks/useFootball';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useJsonLd } from '../hooks/useJsonLd';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import PitchVisualization from '../components/PitchVisualization';
import LiveBadge from '../components/common/LiveBadge';
import { SkeletonBox } from '../components/common/Skeleton';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';

interface MatchDetailsProps {
  onRequireAuth: () => void;
}

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('ar', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const EVENT_ICON: Record<string, string> = {
  Goal: '⚽',
  Card: '🟨',
  subst: '🔁',
  Var: '📺',
};

const MatchDetails = ({ onRequireAuth }: MatchDetailsProps) => {
  const { id } = useParams<{ id: string }>();
  const matchId = Number(id);
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  const {
    data,
    isPending: loading,
    error,
    refetch,
  } = useMatchDetail(matchId);

  useDocumentTitle(
    data ? `${data.match.homeTeam.name} × ${data.match.awayTeam.name}` : undefined
  );
  useJsonLd(
    data
      ? {
          '@context': 'https://schema.org',
          '@type': 'SportsEvent',
          name: `${data.match.homeTeam.name} vs ${data.match.awayTeam.name}`,
          startDate: data.match.utcDate,
          ...(data.match.venue ? { location: { '@type': 'Place', name: data.match.venue } } : {}),
          competitor: [
            { '@type': 'SportsTeam', name: data.match.homeTeam.name },
            { '@type': 'SportsTeam', name: data.match.awayTeam.name },
          ],
          ...(data.match.competition?.name
            ? { superEvent: { '@type': 'SportsEvent', name: data.match.competition.name } }
            : {}),
        }
      : null
  );

  const sortedEvents = useMemo(
    () =>
      data?.enrichment
        ? [...data.enrichment.events].sort(
            (a, b) => a.time.elapsed - b.time.elapsed
          )
        : [],
    [data]
  );

  if (!Number.isInteger(matchId) || matchId <= 0) {
    return <ErrorState message="معرّف المباراة غير صالح." />;
  }
  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <SkeletonBox className="h-3 w-24" />
          <SkeletonBox className="h-3 w-32" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 flex-col items-center gap-2">
            <SkeletonBox className="h-16 w-16 rounded-full" />
            <SkeletonBox className="h-4 w-20" />
          </div>
          <SkeletonBox className="h-8 w-16" />
          <div className="flex flex-1 flex-col items-center gap-2">
            <SkeletonBox className="h-16 w-16 rounded-full" />
            <SkeletonBox className="h-4 w-20" />
          </div>
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <ErrorState
        message={getBackendErrorMessage(error, 'تعذر تحميل المباراة.')}
        onRetry={() => void refetch()}
      />
    );
  }

  const { match, enrichment } = data;
  const played = isFinished(match.status);
  const live = isLive(match.status);

  const handleFavoriteTeam = (team: typeof match.homeTeam) => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    // The optimistic cache update already rolls back visually on failure;
    // this just prevents an unhandled promise rejection reaching the console.
    toggleFavorite(teamRefToSummary(team)).catch(() => {});
  };

  const handleAddToCalendar = () => {
    const ics = buildMatchIcs({
      id: match.id,
      utcDate: match.utcDate,
      homeTeamName: match.homeTeam.name,
      awayTeamName: match.awayTeam.name,
      competitionName: match.competition?.name,
      venue: match.venue,
    });
    downloadIcsFile(`match-${match.id}.ics`, ics);
  };

  const homeLineup = enrichment?.lineups.find((l) => l.team.id === match.homeTeam.id);
  const awayLineup = enrichment?.lineups.find((l) => l.team.id === match.awayTeam.id);
  const homeStats = enrichment?.statistics.find((s) => s.team.id === match.homeTeam.id);
  const awayStats = enrichment?.statistics.find((s) => s.team.id === match.awayTeam.id);

  return (
    <div>
      {/* Header: base info — always available */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{formatDateTime(match.utcDate)}</span>
          <span>{match.competition?.name}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 flex-col items-center gap-2">
            <Link to={`/team/${match.homeTeam.id}`} className="flex flex-col items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400">
              {match.homeTeam.crest && (
                <img src={match.homeTeam.crest} alt={match.homeTeam.name} width={64} height={64} className="h-16 w-16 object-contain" onError={hideOnImgError} />
              )}
              <span className="text-center font-semibold text-gray-900 dark:text-gray-100">
                {match.homeTeam.name}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => handleFavoriteTeam(match.homeTeam)}
              className="-m-2 p-2 text-lg"
              aria-label="إضافة إلى المفضلة"
            >
              {isFavorite(match.homeTeam.id) ? '❤️' : '🤍'}
            </button>
          </div>

          <div className="flex flex-col items-center px-4">
            {played || live ? (
              <span className={`text-3xl font-extrabold ${live ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                {match.score.fullTime.home ?? 0} - {match.score.fullTime.away ?? 0}
              </span>
            ) : (
              <span className="text-lg font-semibold text-blue-600">
                {formatDateTime(match.utcDate)}
              </span>
            )}
            {live ? (
              <span className="mt-1">
                <LiveBadge />
              </span>
            ) : (
              <span className="mt-1 text-xs text-gray-400 dark:text-gray-500">{match.status}</span>
            )}
            {match.matchday !== null && (
              <span className="text-xs text-gray-400 dark:text-gray-500">الجولة {match.matchday}</span>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center gap-2">
            <Link to={`/team/${match.awayTeam.id}`} className="flex flex-col items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400">
              {match.awayTeam.crest && (
                <img src={match.awayTeam.crest} alt={match.awayTeam.name} width={64} height={64} className="h-16 w-16 object-contain" onError={hideOnImgError} />
              )}
              <span className="text-center font-semibold text-gray-900 dark:text-gray-100">
                {match.awayTeam.name}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => handleFavoriteTeam(match.awayTeam)}
              className="-m-2 p-2 text-lg"
              aria-label="إضافة إلى المفضلة"
            >
              {isFavorite(match.awayTeam.id) ? '❤️' : '🤍'}
            </button>
          </div>
        </div>

        {(match.venue || (match.referees && match.referees.length > 0)) && (
          <div className="mt-4 flex justify-center gap-6 text-xs text-gray-500 dark:text-gray-400">
            {match.venue && <span>الملعب: {match.venue}</span>}
            {match.referees && match.referees.length > 0 && (
              <span>الحكم: {match.referees[0].name}</span>
            )}
          </div>
        )}

        {!played && !live && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={handleAddToCalendar}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              📅 أضف للتقويم
            </button>
          </div>
        )}
      </div>

      {/* Enrichment: lineups/pitch/events/statistics — best-effort, may be unavailable */}
      {!enrichment ? (
        <div className="mt-6">
          <EmptyState
            message="لا تتوفر بيانات التشكيلة والإحصائيات لهذه المباراة."
            icon="📋"
          />
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {homeLineup && awayLineup && (
            <section>
              <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">التشكيلة</h3>
              <PitchVisualization home={homeLineup} away={awayLineup} />

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[homeLineup, awayLineup].map((lineup) => (
                  <div key={lineup.team.id} className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                    <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">{lineup.team.name}</h4>
                    {lineup.coach?.name && (
                      <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">المدرب: {lineup.coach.name}</p>
                    )}
                    <p className="mb-1 text-xs font-medium text-gray-400 dark:text-gray-500">الاحتياط</p>
                    <ul className="space-y-1 text-sm">
                      {lineup.substitutes.map((entry) => (
                        <li key={entry.player.id}>
                          <Link
                            to={`/player/af/${entry.player.id}`}
                            className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                          >
                            {entry.player.number ? `#${entry.player.number} ` : ''}
                            {entry.player.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {sortedEvents.length > 0 && (
            <section>
              <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">الأحداث</h3>
              <ul className="space-y-2">
                {sortedEvents.map((event, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-2 text-sm dark:border-gray-800 dark:bg-gray-900"
                  >
                    <span className="w-10 text-center font-semibold text-gray-500 dark:text-gray-400">
                      {event.time.elapsed}&apos;
                    </span>
                    <span>{EVENT_ICON[event.type] ?? '•'}</span>
                    <span className="flex-1">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {event.player.name ?? '—'}
                      </span>{' '}
                      <span className="text-gray-500 dark:text-gray-400">
                        {event.detail}
                        {event.assist.name ? ` (صناعة: ${event.assist.name})` : ''}
                      </span>
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{event.team.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {homeStats && awayStats && (
            <section>
              <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">الإحصائيات</h3>
              <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                {homeStats.statistics.map((stat, index) => {
                  const awayStat = awayStats.statistics[index];
                  const homeVal = parseStatValue(stat.value);
                  const awayVal = parseStatValue(awayStat?.value ?? null);
                  const total = homeVal + awayVal;
                  const homePct = total > 0 ? (homeVal / total) * 100 : 50;
                  return (
                    <div key={stat.type} className="text-sm">
                      <div className="mb-1 flex items-center justify-between text-gray-700 dark:text-gray-300">
                        <span className="font-medium">{stat.value ?? 0}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {translateStatType(stat.type)}
                        </span>
                        <span className="font-medium">{awayStat?.value ?? 0}</span>
                      </div>
                      <div className="flex h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div className="bg-blue-600" style={{ width: `${homePct}%` }} />
                        <div className="bg-red-600" style={{ width: `${100 - homePct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default MatchDetails;
