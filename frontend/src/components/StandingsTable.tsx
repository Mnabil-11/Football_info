import { getBackendErrorMessage } from '../api/http';
import { StandingRow, teamRefToSummary } from '../types/football';
import { useStandings } from '../hooks/useFootball';
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

  const { data: rows = [], isPending, error, refetch } = useStandings(code);

  const handleFavorite = (row: StandingRow) => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    void toggleFavorite(teamRefToSummary(row.team));
  };

  if (isPending) {
    return <Spinner label="جاري تحميل الترتيب..." />;
  }
  if (error) {
    return (
      <ErrorState
        message={getBackendErrorMessage(error, 'تعذر تحميل جدول الترتيب.')}
        onRetry={() => void refetch()}
      />
    );
  }
  if (rows.length === 0) {
    return <EmptyState message="لا يوجد جدول ترتيب متاح بعد." icon="📊" />;
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[640px] overflow-hidden rounded-xl bg-white text-sm shadow-sm dark:bg-gray-900">
        <thead>
          <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
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
              className="border-b border-gray-50 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/60"
            >
              <td className="px-3 py-2 text-center font-semibold text-gray-500 dark:text-gray-400">
                {row.position}
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  {row.team.crest && (
                    <img src={row.team.crest} alt={row.team.name} className="h-6 w-6 object-contain" loading="lazy" />
                  )}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {row.team.shortName ?? row.team.name}
                  </span>
                </div>
              </td>
              <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">{row.playedGames}</td>
              <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">{row.won}</td>
              <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">{row.draw}</td>
              <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">{row.lost}</td>
              <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">{row.goalsFor}</td>
              <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">{row.goalsAgainst}</td>
              <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">{row.goalDifference}</td>
              <td className="px-3 py-2 text-center font-bold text-gray-900 dark:text-gray-100">{row.points}</td>
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
