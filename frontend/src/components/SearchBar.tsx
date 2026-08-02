import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Competition, TeamRef } from '../types/football';
import { useCompetitionTeamsList } from '../hooks/useFootball';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { hideOnImgError } from '../utils/img';

interface SearchBarProps {
  competitions: Competition[];
  /** The competition currently open on the page — its teams are searchable too. */
  currentCode: string;
  onSelectCompetition: (code: string) => void;
}

const MAX_RESULTS = 6;

/**
 * Searches competitions by name (always available, already loaded) and teams
 * within the currently open competition (football-data.org's free tier has
 * no cross-competition team search, only per-competition team lists).
 */
const SearchBar = ({ competitions, currentCode, onSelectCompetition }: SearchBarProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 200);

  // Timer ref for blur delay — cleaned up on unmount to prevent state updates on unmounted component.
  const blurTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(blurTimerRef.current), []);

  const { data: teams = [] } = useCompetitionTeamsList(currentCode);

  const q = debouncedQuery.trim().toLowerCase();

  const matchingCompetitions = useMemo(() => {
    if (!q) {
      return [];
    }
    return competitions
      .filter((c) => c.name.toLowerCase().includes(q) || c.area.name.toLowerCase().includes(q))
      .slice(0, MAX_RESULTS);
  }, [competitions, q]);

  const matchingTeams = useMemo(() => {
    if (!q) {
      return [];
    }
    return teams
      .filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.shortName && t.shortName.toLowerCase().includes(q))
      )
      .slice(0, MAX_RESULTS);
  }, [teams, q]);

  const hasResults = matchingCompetitions.length > 0 || matchingTeams.length > 0;

  const selectCompetition = (c: Competition) => {
    onSelectCompetition(c.code);
    setQuery('');
    setOpen(false);
  };

  const selectTeam = (t: TeamRef) => {
    navigate(`/team/${t.id}`);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="relative mx-auto max-w-md">
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        // Delay closing so a click on a result registers before the dropdown unmounts.
        onBlur={() => { blurTimerRef.current = setTimeout(() => setOpen(false), 150); }}
        placeholder="ابحث عن فريق أو مسابقة..."
        aria-label="بحث عن فريق أو مسابقة"
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />

      {open && q && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-100 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
          {!hasResults ? (
            <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">لا توجد نتائج.</p>
          ) : (
            <>
              {matchingCompetitions.length > 0 && (
                <div>
                  <p className="px-4 pt-2 text-xs font-semibold text-gray-400 dark:text-gray-500">
                    المسابقات
                  </p>
                  {matchingCompetitions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectCompetition(c)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-start text-sm hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      {c.emblem && (
                        <img src={c.emblem} alt="" width={20} height={20} className="h-5 w-5 object-contain" onError={hideOnImgError} />
                      )}
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
              {matchingTeams.length > 0 && (
                <div>
                  <p className="px-4 pt-2 text-xs font-semibold text-gray-400 dark:text-gray-500">
                    الفرق
                  </p>
                  {matchingTeams.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectTeam(t)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-start text-sm hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      {t.crest && <img src={t.crest} alt="" width={20} height={20} className="h-5 w-5 object-contain" onError={hideOnImgError} />}
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="h-2" />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
