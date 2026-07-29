import { useState } from 'react';
import { getBackendErrorMessage } from '../api/http';
import { useCompetitions } from '../hooks/useFootball';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import CompetitionSelect from '../components/CompetitionSelect';
import SearchBar from '../components/SearchBar';
import MatchesList from '../components/MatchesList';
import StandingsTable from '../components/StandingsTable';
import TopScorers from '../components/TopScorers';
import FavoritesDashboard from '../components/FavoritesDashboard';
import { SkeletonBox, SkeletonMatchGrid } from '../components/common/Skeleton';
import ErrorState from '../components/common/ErrorState';
import { hideOnImgError } from '../utils/img';

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

  const {
    data: competitions = [],
    isPending: loadingComps,
    error: compError,
    refetch: refetchCompetitions,
  } = useCompetitions();

  // `null` means "nothing picked yet" — we fall back to the first competition
  // rather than storing it, so no effect is needed to sync the two.
  const [pickedCode, setPickedCode] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('matches');
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);

  const code = pickedCode ?? competitions[0]?.code ?? '';
  const selected = competitions.find((c) => c.code === code);

  useDocumentTitle(selected?.name);

  return (
    <>
      {!favoritesOnly && (
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h1 className="mb-1 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
            المباريات والترتيب والهدافون
          </h1>
          <p className="mb-5 text-center text-sm text-gray-500 dark:text-gray-400">
            بيانات مباشرة من football-data.org
          </p>
          {!loadingComps && !compError && competitions.length > 0 && (
            <div className="space-y-3">
              <CompetitionSelect
                competitions={competitions}
                value={code}
                onChange={setPickedCode}
              />
              <SearchBar
                competitions={competitions}
                currentCode={code}
                onSelectCompetition={setPickedCode}
              />
            </div>
          )}
        </div>
      )}

      {isAuthenticated && (
        <div className="mx-auto mb-4 flex max-w-md items-center justify-center">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={favoritesOnly}
              onChange={(e) => setFavoritesOnly(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-700"
            />
            عرض مباريات الفرق المفضلة فقط
          </label>
        </div>
      )}

      {favoritesOnly ? (
        <FavoritesDashboard />
      ) : loadingComps ? (
        <>
          <div className="flex items-center gap-3">
            <SkeletonBox className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <SkeletonBox className="h-5 w-40" />
              <SkeletonBox className="h-3 w-24" />
            </div>
          </div>
          <div className="mt-6 flex gap-2 border-b border-gray-200 pb-2 dark:border-gray-800">
            <SkeletonBox className="h-6 w-20" />
            <SkeletonBox className="h-6 w-20" />
            <SkeletonBox className="h-6 w-20" />
          </div>
          <div className="mt-6">
            <SkeletonMatchGrid />
          </div>
        </>
      ) : compError ? (
        <ErrorState
          message={getBackendErrorMessage(compError, 'تعذر تحميل المسابقات.')}
          onRetry={() => void refetchCompetitions()}
        />
      ) : !selected ? (
        <ErrorState message="لا توجد مسابقات متاحة." />
      ) : (
        <>
          {/* Competition header */}
          <div className="flex items-center gap-3">
            {selected.emblem && (
              <img
                src={selected.emblem}
                alt={selected.name}
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
                onError={hideOnImgError}
              />
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selected.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{selected.area.name}</p>
            </div>
          </div>

          {/* Tabs */}
          <div
            role="tablist"
            aria-label="أقسام المسابقة"
            className="mt-6 flex gap-2 border-b border-gray-200 dark:border-gray-800"
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') {
                return;
              }
              e.preventDefault();
              const currentIndex = TABS.findIndex((t) => t.key === tab);
              const delta = e.key === 'ArrowRight' ? 1 : -1;
              const next = TABS[(currentIndex + delta + TABS.length) % TABS.length];
              setTab(next.key);
              document.getElementById(`tab-${next.key}`)?.focus();
            }}
          >
            {TABS.map((t) => (
              <button
                key={t.key}
                id={`tab-${t.key}`}
                role="tab"
                aria-selected={tab === t.key}
                aria-controls={`panel-${t.key}`}
                tabIndex={tab === t.key ? 0 : -1}
                type="button"
                onClick={() => setTab(t.key)}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0}>
            {tab === 'matches' && <MatchesList code={code} />}
            {tab === 'standings' && (
              <StandingsTable code={code} onRequireAuth={onRequireAuth} />
            )}
            {tab === 'scorers' && <TopScorers code={code} />}
          </div>
        </>
      )}
    </>
  );
};

export default HomePage;
