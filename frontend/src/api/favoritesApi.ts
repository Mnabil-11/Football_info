import { http } from './http';
import { ApiEnvelope, FavoritePlayer, FavoriteTeam } from '../types/auth';

export interface AddFavoriteTeamBody {
  teamId: number;
  teamName: string;
  teamLogo?: string | null;
}

export interface AddFavoritePlayerBody {
  playerId: number;
  playerName: string;
  playerPhoto?: string | null;
}

export const listFavoriteTeamsRequest = async (): Promise<FavoriteTeam[]> => {
  const { data } = await http.get<ApiEnvelope<FavoriteTeam[]>>(
    '/favorites/teams'
  );
  return data.data;
};

export const addFavoriteTeamRequest = async (
  body: AddFavoriteTeamBody
): Promise<FavoriteTeam> => {
  const { data } = await http.post<ApiEnvelope<FavoriteTeam>>(
    '/favorites/teams',
    body
  );
  return data.data;
};

export const removeFavoriteTeamRequest = async (
  favoriteId: string
): Promise<void> => {
  await http.delete(`/favorites/teams/${favoriteId}`);
};

export const listFavoritePlayersRequest = async (): Promise<FavoritePlayer[]> => {
  const { data } = await http.get<ApiEnvelope<FavoritePlayer[]>>(
    '/favorites/players'
  );
  return data.data;
};

export const addFavoritePlayerRequest = async (
  body: AddFavoritePlayerBody
): Promise<FavoritePlayer> => {
  const { data } = await http.post<ApiEnvelope<FavoritePlayer>>(
    '/favorites/players',
    body
  );
  return data.data;
};

export const removeFavoritePlayerRequest = async (
  favoriteId: string
): Promise<void> => {
  await http.delete(`/favorites/players/${favoriteId}`);
};
