import { Link } from 'react-router-dom';
import { getBackendErrorMessage } from '../api/http';
import { hideOnImgError } from '../utils/img';
import { useScorers } from '../hooks/useFootball';
import { SkeletonTable } from './common/Skeleton';
import ErrorState from './common/ErrorState';
import EmptyState from './common/EmptyState';

interface TopScorersProps {
  code: string;
}

const TopScorers = ({ code }: TopScorersProps) => {
  const { data: scorers = [], isPending, error, refetch } = useScorers(code);

  if (isPending) {
    return <SkeletonTable cols={7} />;
  }
  if (error) {
    return (
      <ErrorState
        message={getBackendErrorMessage(error, 'تعذر تحميل الهدافين.')}
        onRetry={() => void refetch()}
      />
    );
  }
  if (scorers.length === 0) {
    return (
      <EmptyState
        message="لا يوجد هدافون بعد (قد لا يكون الموسم قد بدأ)."
        icon="⚽"
      />
    );
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[560px] overflow-hidden rounded-xl bg-white text-sm shadow-sm dark:bg-gray-900">
        <thead>
          <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
            <th className="px-4 py-3 text-center font-medium">#</th>
            <th className="px-4 py-3 text-start font-medium">اللاعب</th>
            <th className="px-4 py-3 text-start font-medium">الفريق</th>
            <th className="px-4 py-3 text-center font-medium">مباريات</th>
            <th className="px-4 py-3 text-center font-medium">أهداف</th>
            <th className="px-4 py-3 text-center font-medium">صناعة</th>
            <th className="px-4 py-3 text-center font-medium">ركلات جزاء</th>
          </tr>
        </thead>
        <tbody>
          {scorers.map((s, index) => (
            <tr
              key={s.player.id}
              className="border-b border-gray-50 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/60"
            >
              <td className="px-4 py-2 text-center font-semibold text-gray-500 dark:text-gray-400">
                {index + 1}
              </td>
              <td className="px-4 py-2">
                <Link
                  to={`/player/fd/${s.player.id}`}
                  className="font-medium text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
                >
                  {s.player.name}
                </Link>
                {s.player.nationality && (
                  <span className="block text-xs text-gray-400 dark:text-gray-500">
                    {s.player.nationality}
                  </span>
                )}
              </td>
              <td className="px-4 py-2">
                <Link to={`/team/${s.team.id}`} className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400">
                  {s.team.crest && (
                    <img src={s.team.crest} alt={s.team.name} width={20} height={20} className="h-5 w-5 object-contain" loading="lazy" onError={hideOnImgError} />
                  )}
                  <span className="text-gray-700 dark:text-gray-300">
                    {s.team.shortName ?? s.team.name}
                  </span>
                </Link>
              </td>
              <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400">
                {s.playedMatches ?? '—'}
              </td>
              <td className="px-4 py-2 text-center font-bold text-green-600 dark:text-green-400">
                {s.goals ?? 0}
              </td>
              <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400">
                {s.assists ?? 0}
              </td>
              <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400">
                {s.penalties ?? 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopScorers;
