import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPlayerAf, fetchPlayerFd } from '../api/footballApi';
import { getBackendErrorMessage } from '../api/http';
import { AfPlayerStatsEntry, FdPlayerProfile } from '../types/football';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import StatCard from '../components/common/StatCard';
import Spinner from '../components/common/Spinner';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';

interface PlayerDetailsProps {
  onRequireAuth: () => void;
}

type Provider = 'fd' | 'af';

interface FdData {
  provider: 'fd';
  profile: FdPlayerProfile;
  stats: AfPlayerStatsEntry | null;
}

interface AfData {
  provider: 'af';
  profile: AfPlayerStatsEntry;
}

type PageData = FdData | AfData;

const PlayerDetails = ({ onRequireAuth }: PlayerDetailsProps) => {
  const { provider, id } = useParams<{ provider: Provider; id: string }>();
  const playerId = Number(id);
  const { isAuthenticated } = useAuth();
  const { isPlayerFavorite, togglePlayerFavorite } = useFavorites();

  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        if (provider === 'af') {
          const { profile } = await fetchPlayerAf(playerId);
          if (!cancelled) {
            setData({ provider: 'af', profile });
          }
        } else {
          const { profile, statsEnrichment } = await fetchPlayerFd(playerId);
          if (!cancelled) {
            setData({ provider: 'fd', profile, stats: statsEnrichment });
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(getBackendErrorMessage(err, 'تعذر تحميل بيانات اللاعب.'));
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
  }, [provider, playerId, reloadKey]);

  if (!Number.isInteger(playerId) || playerId <= 0 || (provider !== 'fd' && provider !== 'af')) {
    return <ErrorState message="معرّف اللاعب غير صالح." />;
  }
  if (loading) {
    return <Spinner label="جاري تحميل بيانات اللاعب..." fullScreen />;
  }
  if (error || !data) {
    return (
      <ErrorState
        message={error ?? 'تعذر تحميل اللاعب.'}
        onRetry={() => setReloadKey((k) => k + 1)}
      />
    );
  }

  const name = data.provider === 'fd' ? data.profile.name : data.profile.player.name;
  const photo = data.provider === 'fd' ? data.stats?.player.photo ?? null : data.profile.player.photo;
  const nationality =
    data.provider === 'fd' ? data.profile.nationality : data.profile.player.nationality;
  const position = data.provider === 'fd' ? data.profile.position : null;
  const teamName =
    data.provider === 'fd'
      ? data.profile.currentTeam?.name ?? null
      : data.profile.statistics[0]?.team.name ?? null;

  const statLine =
    data.provider === 'fd' ? data.stats?.statistics[0] : data.profile.statistics[0];

  const handleFavorite = () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    void togglePlayerFavorite({ id: playerId, name, photo });
  };

  return (
    <div>
      <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {photo ? (
          <img src={photo} alt={name} className="h-20 w-20 rounded-full object-cover ring-2 ring-gray-100" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
            {name.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
          <p className="text-sm text-gray-500">
            {position ?? statLine?.games.position ?? '—'}
            {teamName ? ` · ${teamName}` : ''}
          </p>
          <p className="text-xs text-gray-400">{nationality ?? '—'}</p>
        </div>
        <button
          type="button"
          onClick={handleFavorite}
          className="text-2xl"
          aria-label="إضافة إلى المفضلة"
        >
          {isPlayerFavorite(playerId) ? '❤️' : '🤍'}
        </button>
      </div>

      {!statLine ? (
        <div className="mt-6">
          <EmptyState message="لا تتوفر إحصائيات موسمية لهذا اللاعب." icon="📊" />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="مباريات" value={statLine.games.appearences ?? 0} icon="🎽" />
          <StatCard label="دقائق اللعب" value={statLine.games.minutes ?? 0} icon="⏱️" />
          <StatCard label="أهداف" value={statLine.goals.total ?? 0} icon="⚽" accent="text-green-600" />
          <StatCard label="صناعة أهداف" value={statLine.goals.assists ?? 0} icon="🅰️" accent="text-blue-600" />
          <StatCard label="بطاقات صفراء" value={statLine.cards.yellow ?? 0} icon="🟨" accent="text-yellow-500" />
          <StatCard label="بطاقات حمراء" value={statLine.cards.red ?? 0} icon="🟥" accent="text-red-600" />
          <StatCard
            label="التقييم"
            value={statLine.games.rating ? Number(statLine.games.rating).toFixed(2) : '—'}
            icon="⭐"
            accent="text-amber-500"
          />
        </div>
      )}
    </div>
  );
};

export default PlayerDetails;
