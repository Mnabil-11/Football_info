import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import {
  addFavoriteTeamRequest,
  listFavoriteTeamsRequest,
  removeFavoriteTeamRequest,
} from '../api/favoritesApi';
import { getBackendErrorMessage } from '../api/http';
import { FavoriteTeam } from '../types/auth';
import { TeamSummary } from '../types/football';
import { useAuth } from './AuthContext';

interface FavoritesContextValue {
  favorites: FavoriteTeam[];
  loading: boolean;
  error: string | null;
  isFavorite: (teamId: number) => boolean;
  /** Add if not present, remove if already favorited. Returns nothing; throws on failure. */
  toggleFavorite: (team: TeamSummary) => Promise<void>;
  removeFavorite: (favoriteId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined
);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteTeam[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const list = await listFavoriteTeamsRequest();
      setFavorites(list);
    } catch (err) {
      setError(getBackendErrorMessage(err, 'تعذر تحميل المفضلة.'));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Load favorites whenever auth state changes.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isFavorite = useCallback(
    (teamId: number): boolean =>
      favorites.some((fav) => fav.teamId === teamId),
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (team: TeamSummary) => {
      const existing = favorites.find((fav) => fav.teamId === team.id);
      if (existing) {
        // Optimistic remove.
        setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
        try {
          await removeFavoriteTeamRequest(existing.id);
        } catch (err) {
          await refresh();
          throw new Error(getBackendErrorMessage(err));
        }
        return;
      }

      const created = await addFavoriteTeamRequest({
        teamId: team.id,
        teamName: team.name,
        teamLogo: team.logo,
      }).catch((err: unknown) => {
        throw new Error(getBackendErrorMessage(err));
      });
      setFavorites((prev) => [created, ...prev]);
    },
    [favorites, refresh]
  );

  const removeFavorite = useCallback(
    async (favoriteId: string) => {
      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
      try {
        await removeFavoriteTeamRequest(favoriteId);
      } catch (err) {
        await refresh();
        throw new Error(getBackendErrorMessage(err));
      }
    },
    [refresh]
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      loading,
      error,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      refresh,
    }),
    [favorites, loading, error, isFavorite, toggleFavorite, removeFavorite, refresh]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextValue => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return ctx;
};
