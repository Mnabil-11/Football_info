import { useEffect, useState } from 'react';
import { fetchScorers } from '../api/footballApi';
import { getBackendErrorMessage } from '../api/http';
import { Scorer } from '../types/football';
import Spinner from './common/Spinner';
import ErrorState from './common/ErrorState';
import EmptyState from './common/EmptyState';

interface TopScorersProps {
  code: string;
}

const TopScorers = ({ code }: TopScorersProps) => {
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchScorers(code);
        if (!cancelled) {
          setScorers(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getBackendErrorMessage(err, 'تعذر تحميل الهدافين.'));
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

  if (loading) {
    return <Spinner label="جاري تحميل الهدافين..." />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />;
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
      <table className="w-full min-w-[560px] overflow-hidden rounded-xl bg-white text-sm shadow-sm">
        <thead>
          <tr className="border-b border-gray-100 text-gray-500">
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
              className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
            >
              <td className="px-4 py-2 text-center font-semibold text-gray-500">
                {index + 1}
              </td>
              <td className="px-4 py-2">
                <span className="font-medium text-gray-900">{s.player.name}</span>
                {s.player.nationality && (
                  <span className="block text-xs text-gray-400">
                    {s.player.nationality}
                  </span>
                )}
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  {s.team.crest && (
                    <img src={s.team.crest} alt={s.team.name} className="h-5 w-5 object-contain" loading="lazy" />
                  )}
                  <span className="text-gray-700">
                    {s.team.shortName ?? s.team.name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-2 text-center text-gray-600">
                {s.playedMatches ?? '—'}
              </td>
              <td className="px-4 py-2 text-center font-bold text-green-600">
                {s.goals ?? 0}
              </td>
              <td className="px-4 py-2 text-center text-gray-600">
                {s.assists ?? 0}
              </td>
              <td className="px-4 py-2 text-center text-gray-600">
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
