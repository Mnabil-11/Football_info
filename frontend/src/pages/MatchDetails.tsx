import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchMatchDetail } from '../api/footballApi';
import { getBackendErrorMessage } from '../api/http';
import { MatchDetailResponse, teamRefToSummary } from '../types/football';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { isFinished } from '../components/MatchCard';
import PitchVisualization from '../components/PitchVisualization';
import Spinner from '../components/common/Spinner';
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

  const [data, setData] = useState<MatchDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchMatchDetail(matchId);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getBackendErrorMessage(err, 'تعذر تحميل تفاصيل المباراة.'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [matchId, reloadKey]);

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
    return <Spinner label="جاري تحميل تفاصيل المباراة..." fullScreen />;
  }
  if (error || !data) {
    return (
      <ErrorState
        message={error ?? 'تعذر تحميل المباراة.'}
        onRetry={() => setReloadKey((k) => k + 1)}
      />
    );
  }

  const { match, enrichment } = data;
  const played = isFinished(match.status);

  const handleFavoriteTeam = (team: typeof match.homeTeam) => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    void toggleFavorite(teamRefToSummary(team));
  };

  const homeLineup = enrichment?.lineups.find((l) => l.team.id === match.homeTeam.id);
  const awayLineup = enrichment?.lineups.find((l) => l.team.id === match.awayTeam.id);
  const homeStats = enrichment?.statistics.find((s) => s.team.id === match.homeTeam.id);
  const awayStats = enrichment?.statistics.find((s) => s.team.id === match.awayTeam.id);

  return (
    <div>
      {/* Header: base info — always available */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
          <span>{formatDateTime(match.utcDate)}</span>
          <span>{match.competition?.name}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 flex-col items-center gap-2">
            {match.homeTeam.crest && (
              <img src={match.homeTeam.crest} alt={match.homeTeam.name} className="h-16 w-16 object-contain" />
            )}
            <span className="text-center font-semibold text-gray-900">
              {match.homeTeam.name}
            </span>
            <button
              type="button"
              onClick={() => handleFavoriteTeam(match.homeTeam)}
              className="text-lg"
              aria-label="إضافة إلى المفضلة"
            >
              {isFavorite(match.homeTeam.id) ? '❤️' : '🤍'}
            </button>
          </div>

          <div className="flex flex-col items-center px-4">
            {played ? (
              <span className="text-3xl font-extrabold text-gray-900">
                {match.score.fullTime.home ?? 0} - {match.score.fullTime.away ?? 0}
              </span>
            ) : (
              <span className="text-lg font-semibold text-blue-600">
                {formatDateTime(match.utcDate)}
              </span>
            )}
            <span className="mt-1 text-xs text-gray-400">{match.status}</span>
            {match.matchday !== null && (
              <span className="text-xs text-gray-400">الجولة {match.matchday}</span>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center gap-2">
            {match.awayTeam.crest && (
              <img src={match.awayTeam.crest} alt={match.awayTeam.name} className="h-16 w-16 object-contain" />
            )}
            <span className="text-center font-semibold text-gray-900">
              {match.awayTeam.name}
            </span>
            <button
              type="button"
              onClick={() => handleFavoriteTeam(match.awayTeam)}
              className="text-lg"
              aria-label="إضافة إلى المفضلة"
            >
              {isFavorite(match.awayTeam.id) ? '❤️' : '🤍'}
            </button>
          </div>
        </div>

        {(match.venue || (match.referees && match.referees.length > 0)) && (
          <div className="mt-4 flex justify-center gap-6 text-xs text-gray-500">
            {match.venue && <span>الملعب: {match.venue}</span>}
            {match.referees && match.referees.length > 0 && (
              <span>الحكم: {match.referees[0].name}</span>
            )}
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
              <h3 className="mb-4 text-lg font-bold text-gray-900">التشكيلة</h3>
              <PitchVisualization home={homeLineup} away={awayLineup} />

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[homeLineup, awayLineup].map((lineup) => (
                  <div key={lineup.team.id} className="rounded-xl border border-gray-100 bg-white p-4">
                    <h4 className="mb-2 font-semibold text-gray-900">{lineup.team.name}</h4>
                    {lineup.coach?.name && (
                      <p className="mb-2 text-xs text-gray-500">المدرب: {lineup.coach.name}</p>
                    )}
                    <p className="mb-1 text-xs font-medium text-gray-400">الاحتياط</p>
                    <ul className="space-y-1 text-sm">
                      {lineup.substitutes.map((entry) => (
                        <li key={entry.player.id}>
                          <Link
                            to={`/player/af/${entry.player.id}`}
                            className="text-gray-700 hover:text-blue-600"
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
              <h3 className="mb-4 text-lg font-bold text-gray-900">الأحداث</h3>
              <ul className="space-y-2">
                {sortedEvents.map((event, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-2 text-sm"
                  >
                    <span className="w-10 text-center font-semibold text-gray-500">
                      {event.time.elapsed}&apos;
                    </span>
                    <span>{EVENT_ICON[event.type] ?? '•'}</span>
                    <span className="flex-1">
                      <span className="font-medium text-gray-900">
                        {event.player.name ?? '—'}
                      </span>{' '}
                      <span className="text-gray-500">
                        {event.detail}
                        {event.assist.name ? ` (صناعة: ${event.assist.name})` : ''}
                      </span>
                    </span>
                    <span className="text-xs text-gray-400">{event.team.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {homeStats && awayStats && (
            <section>
              <h3 className="mb-4 text-lg font-bold text-gray-900">الإحصائيات</h3>
              <div className="space-y-3 rounded-xl border border-gray-100 bg-white p-4">
                {homeStats.statistics.map((stat, index) => {
                  const awayStat = awayStats.statistics[index];
                  return (
                    <div key={stat.type} className="text-sm">
                      <div className="mb-1 flex items-center justify-between text-gray-600">
                        <span>{stat.value ?? 0}</span>
                        <span className="text-xs text-gray-400">{stat.type}</span>
                        <span>{awayStat?.value ?? 0}</span>
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
