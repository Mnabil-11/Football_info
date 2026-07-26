import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  ReactNode,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addFavoritePlayerRequest,
  addFavoriteTeamRequest,
  listFavoritePlayersRequest,
  listFavoriteTeamsRequest,
  removeFavoritePlayerRequest,
  removeFavoriteTeamRequest,
} from '../api/favoritesApi';
import { FavoritePlayer, FavoriteTeam } from '../types/auth';
import { PlayerSummary, TeamSummary } from '../types/football';
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

  favoritePlayers: FavoritePlayer[];
  playersLoading: boolean;
  playersError: string | null;
  isPlayerFavorite: (playerId: number) => boolean;
  togglePlayerFavorite: (player: PlayerSummary) => Promise<void>;
  removePlayerFavorite: (favoriteId: string) => Promise<void>;
  refreshPlayers: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined
);

const teamsKey = ['favorites', 'teams'] as const;
const playersKey = ['favorites', 'players'] as const;

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const teamsQuery = useQuery({
    queryKey: teamsKey,
    queryFn: listFavoriteTeamsRequest,
    enabled: isAuthenticated,
  });
  const favorites = isAuthenticated ? teamsQuery.data ?? [] : [];

  const playersQuery = useQuery({
    queryKey: playersKey,
    queryFn: listFavoritePlayersRequest,
    enabled: isAuthenticated,
  });
  const favoritePlayers = isAuthenticated ? playersQuery.data ?? [] : [];

  const isFavorite = useCallback(
    (teamId: number): boolean => favorites.some((fav) => fav.teamId === teamId),
    [favorites]
  );

  const isPlayerFavorite = useCallback(
    (playerId: number): boolean =>
      favoritePlayers.some((fav) => fav.playerId === playerId),
    [favoritePlayers]
  );

  // Add and remove share one mutation per resource: an optimistic cache
  // update in `onMutate`, with `onError` rolling back to the snapshot and
  // `onSettled` refetching to reconcile with the server either way.
  const addTeamMutation = useMutation({
    mutationFn: addFavoriteTeamRequest,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: teamsKey });
      return { previous: queryClient.getQueryData<FavoriteTeam[]>(teamsKey) };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(teamsKey, context.previous);
      }
    },
    onSuccess: (created) => {
      queryClient.setQueryData<FavoriteTeam[]>(teamsKey, (prev) => [
        created,
        ...(prev ?? []),
      ]);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: teamsKey });
    },
  });

  const removeTeamMutation = useMutation({
    mutationFn: removeFavoriteTeamRequest,
    onMutate: async (favoriteId: string) => {
      await queryClient.cancelQueries({ queryKey: teamsKey });
      const previous = queryClient.getQueryData<FavoriteTeam[]>(teamsKey);
      queryClient.setQueryData<FavoriteTeam[]>(teamsKey, (prev) =>
        (prev ?? []).filter((f) => f.id !== favoriteId)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(teamsKey, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: teamsKey });
    },
  });

  const addPlayerMutation = useMutation({
    mutationFn: addFavoritePlayerRequest,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: playersKey });
      return { previous: queryClient.getQueryData<FavoritePlayer[]>(playersKey) };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(playersKey, context.previous);
      }
    },
    onSuccess: (created) => {
      queryClient.setQueryData<FavoritePlayer[]>(playersKey, (prev) => [
        created,
        ...(prev ?? []),
      ]);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: playersKey });
    },
  });

  const removePlayerMutation = useMutation({
    mutationFn: removeFavoritePlayerRequest,
    onMutate: async (favoriteId: string) => {
      await queryClient.cancelQueries({ queryKey: playersKey });
      const previous = queryClient.getQueryData<FavoritePlayer[]>(playersKey);
      queryClient.setQueryData<FavoritePlayer[]>(playersKey, (prev) =>
        (prev ?? []).filter((f) => f.id !== favoriteId)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(playersKey, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: playersKey });
    },
  });

  const toggleFavorite = useCallback(
    async (team: TeamSummary) => {
      const existing = favorites.find((fav) => fav.teamId === team.id);
      if (existing) {
        await removeTeamMutation.mutateAsync(existing.id);
        return;
      }
      await addTeamMutation.mutateAsync({
        teamId: team.id,
        teamName: team.name,
        teamLogo: team.logo,
      });
    },
    [favorites, addTeamMutation, removeTeamMutation]
  );

  const removeFavorite = useCallback(
    (favoriteId: string) => removeTeamMutation.mutateAsync(favoriteId),
    [removeTeamMutation]
  );

  const togglePlayerFavorite = useCallback(
    async (player: PlayerSummary) => {
      const existing = favoritePlayers.find((fav) => fav.playerId === player.id);
      if (existing) {
        await removePlayerMutation.mutateAsync(existing.id);
        return;
      }
      await addPlayerMutation.mutateAsync({
        playerId: player.id,
        playerName: player.name,
        playerPhoto: player.photo,
      });
    },
    [favoritePlayers, addPlayerMutation, removePlayerMutation]
  );

  const removePlayerFavorite = useCallback(
    (favoriteId: string) => removePlayerMutation.mutateAsync(favoriteId),
    [removePlayerMutation]
  );

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: teamsKey });
  }, [queryClient]);

  const refreshPlayers = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: playersKey });
  }, [queryClient]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      loading: teamsQuery.isPending && isAuthenticated,
      error: teamsQuery.error ? 'تعذر تحميل المفضلة.' : null,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      refresh,
      favoritePlayers,
      playersLoading: playersQuery.isPending && isAuthenticated,
      playersError: playersQuery.error ? 'تعذر تحميل مفضلة اللاعبين.' : null,
      isPlayerFavorite,
      togglePlayerFavorite,
      removePlayerFavorite,
      refreshPlayers,
    }),
    [
      favorites,
      teamsQuery.isPending,
      teamsQuery.error,
      isAuthenticated,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      refresh,
      favoritePlayers,
      playersQuery.isPending,
      playersQuery.error,
      isPlayerFavorite,
      togglePlayerFavorite,
      removePlayerFavorite,
      refreshPlayers,
    ]
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
