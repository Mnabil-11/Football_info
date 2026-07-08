import { useEffect, useState } from 'react';
import { fetchTeamMatches } from '../api/footballApi';
import { getBackendErrorMessage } from '../api/http';
import { Match } from '../types/football';
import { FavoriteTeam } from '../types/auth';
import { useFavorites } from '../context/FavoritesContext';
import MatchCard from './MatchCard';
import Spinner from './common/Spinner';
import ErrorState from './common/ErrorState';
import EmptyState from './common/EmptyState';

/** One favorite team's recent + upcoming matches. */
const TeamMatches = ({ team }: { team: FavoriteTeam }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchTeamMatches(team.teamId);
        if (!cancelled) {
          const sorted = [...data].sort(
            (a, b) => +new Date(a.utcDate) - +new Date(b.utcDate)
          );
          setMatches(sorted.slice(0, 6));
        }
      } catch (err) {
        if (!cancelled) {
          setError(getBackendErrorMessage(err, 'تعذر تحميل مباريات الفريق.'));
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
  }, [team.teamId]);

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        {team.teamLogo && (
          <img src={team.teamLogo} alt={team.teamName} className="h-8 w-8 object-contain" />
        )}
        <h3 className="text-lg font-bold text-gray-900">{team.teamName}</h3>
      </div>
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} />
      ) : matches.length === 0 ? (
        <EmptyState message="لا توجد مباريات." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </section>
  );
};

const FavoritesDashboard = () => {
  const { favorites, loading, error, refresh } = useFavorites();

  if (loading) {
    return <Spinner label="جاري تحميل المفضلة..." />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={refresh} />;
  }
  if (favorites.length === 0) {
    return (
      <EmptyState message="أضف فرقاً إلى المفضلة لعرض مبارياتها هنا." icon="❤️" />
    );
  }

  return (
    <div className="space-y-10">
      {favorites.map((team) => (
        <TeamMatches key={team.id} team={team} />
      ))}
    </div>
  );
};

export default FavoritesDashboard;
