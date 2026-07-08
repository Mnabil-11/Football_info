import { useEffect, useState } from 'react';
import { fetchStandings } from '../api/footballApi';
import { getBackendErrorMessage } from '../api/http';
import { StandingRow, teamRefToSummary } from '../types/football';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import Spinner from './common/Spinner';
import ErrorState from './common/ErrorState';
import EmptyState from './common/EmptyState';

interface StandingsTableProps {
  code: string;
  /** Called when a guest tries to favorite a team (to open the auth modal). */
  onRequireAuth: () => void;
}

const StandingsTable = ({ code, onRequireAuth }: StandingsTableProps) => {
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [rows, setRows] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const standings = await fetchStandings(code);
        const total = standings.find((s) => s.type === 'TOTAL') ?? standings[0];
        if (!cancelled) {
          setRows(total ? total.table : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getBackendErrorMessage(err, 'تعذر تحميل جدول الترتيب.'));
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
  }, [code, reloadKey]);

  const handleFavorite = (row: StandingRow) => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    void toggleFavorite(teamRefToSummary(row.team));
  };

  if (loading) {
    return <Spinner label="جاري تحميل الترتيب..." />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />;
  }
  if (rows.length === 0) {
    return <EmptyState message="لا يوجد جدول ترتيب متاح بعد." icon="📊" />;
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[640px] overflow-hidden rounded-xl bg-white text-sm shadow-sm">
        <thead>
          <tr className="border-b border-gray-100 text-gray-500">
            <th className="px-3 py-3 text-center font-medium">#</th>
            <th className="px-3 py-3 text-start font-medium">الفريق</th>
            <th className="px-3 py-3 text-center font-medium">لعب</th>
            <th className="px-3 py-3 text-center font-medium">فوز</th>
            <th className="px-3 py-3 text-center font-medium">تعادل</th>
            <th className="px-3 py-3 text-center font-medium">خسارة</th>
            <th className="px-3 py-3 text-center font-medium">له</th>
            <th className="px-3 py-3 text-center font-medium">عليه</th>
            <th className="px-3 py-3 text-center font-medium">+/-</th>
            <th className="px-3 py-3 text-center font-medium">نقاط</th>
            <th className="px-3 py-3 text-center font-medium">❤️</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.team.id}
              className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
            >
              <td className="px-3 py-2 text-center font-semibold text-gray-500">
                {row.position}
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  {row.team.crest && (
                    <img src={row.team.crest} alt={row.team.name} className="h-6 w-6 object-contain" loading="lazy" />
                  )}
                  <span className="font-medium text-gray-900">
                    {row.team.shortName ?? row.team.name}
                  </span>
                </div>
              </td>
              <td className="px-3 py-2 text-center text-gray-600">{row.playedGames}</td>
              <td className="px-3 py-2 text-center text-gray-600">{row.won}</td>
              <td className="px-3 py-2 text-center text-gray-600">{row.draw}</td>
              <td className="px-3 py-2 text-center text-gray-600">{row.lost}</td>
              <td className="px-3 py-2 text-center text-gray-600">{row.goalsFor}</td>
              <td className="px-3 py-2 text-center text-gray-600">{row.goalsAgainst}</td>
              <td className="px-3 py-2 text-center text-gray-600">{row.goalDifference}</td>
              <td className="px-3 py-2 text-center font-bold text-gray-900">{row.points}</td>
              <td className="px-3 py-2 text-center">
                <button
                  type="button"
                  onClick={() => handleFavorite(row)}
                  className="text-base"
                  aria-label="إضافة إلى المفضلة"
                  title="إضافة إلى المفضلة"
                >
                  {isFavorite(row.team.id) ? '❤️' : '🤍'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StandingsTable;
