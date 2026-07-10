import { useEffect, useState } from 'react';
import { fetchCompetitions } from '../api/footballApi';
import { getBackendErrorMessage } from '../api/http';
import { Competition } from '../types/football';
import { useAuth } from '../context/AuthContext';
import CompetitionSelect from '../components/CompetitionSelect';
import MatchesList from '../components/MatchesList';
import StandingsTable from '../components/StandingsTable';
import TopScorers from '../components/TopScorers';
import FavoritesDashboard from '../components/FavoritesDashboard';
import Spinner from '../components/common/Spinner';
import ErrorState from '../components/common/ErrorState';

type Tab = 'matches' | 'standings' | 'scorers';

const TABS: { key: Tab; label: string }[] = [
  { key: 'matches', label: 'المباريات' },
  { key: 'standings', label: 'الترتيب' },
  { key: 'scorers', label: 'الهدافون' },
];

interface HomePageProps {
  onRequireAuth: () => void;
}

const HomePage = ({ onRequireAuth }: HomePageProps) => {
  const { isAuthenticated } = useAuth();

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [code, setCode] = useState<string>('');
  const [loadingComps, setLoadingComps] = useState<boolean>(true);
  const [compError, setCompError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>('matches');
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoadingComps(true);
        setCompError(null);
        const comps = await fetchCompetitions();
        if (!cancelled) {
          setCompetitions(comps);
          setCode((prev) => prev || comps[0]?.code || '');
        }
      } catch (err) {
        if (!cancelled) {
          setCompError(getBackendErrorMessage(err, 'تعذر تحميل المسابقات.'));
        }
      } finally {
        if (!cancelled) {
          setLoadingComps(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const selected = competitions.find((c) => c.code === code);

  return (
    <>
      {!favoritesOnly && (
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6">
          <h1 className="mb-1 text-center text-2xl font-bold text-gray-900">
            المباريات والترتيب والهدافون
          </h1>
          <p className="mb-5 text-center text-sm text-gray-500">
            بيانات مباشرة من football-data.org
          </p>
          {!loadingComps && !compError && competitions.length > 0 && (
            <CompetitionSelect
              competitions={competitions}
              value={code}
              onChange={setCode}
            />
          )}
        </div>
      )}

      {isAuthenticated && (
        <div className="mx-auto mb-4 flex max-w-md items-center justify-center">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={favoritesOnly}
              onChange={(e) => setFavoritesOnly(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            عرض مباريات الفرق المفضلة فقط
          </label>
        </div>
      )}

      {favoritesOnly ? (
        <FavoritesDashboard />
      ) : loadingComps ? (
        <Spinner label="جاري تحميل المسابقات..." fullScreen />
      ) : compError ? (
        <ErrorState message={compError} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : !selected ? (
        <ErrorState message="لا توجد مسابقات متاحة." />
      ) : (
        <>
          {/* Competition header */}
          <div className="flex items-center gap-3">
            {selected.emblem && (
              <img src={selected.emblem} alt={selected.name} className="h-12 w-12 object-contain" />
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selected.name}</h2>
              <p className="text-sm text-gray-500">{selected.area.name}</p>
            </div>
          </div>

          {/* Tabs */}
          <nav className="mt-6 flex gap-2 border-b border-gray-200">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {tab === 'matches' && <MatchesList code={code} />}
          {tab === 'standings' && (
            <StandingsTable code={code} onRequireAuth={onRequireAuth} />
          )}
          {tab === 'scorers' && <TopScorers code={code} />}
        </>
      )}
    </>
  );
};

export default HomePage;
