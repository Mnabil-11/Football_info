import { http } from './http';
import { ApiEnvelope, FavoriteTeam } from '../types/auth';

export interface AddFavoriteTeamBody {
  teamId: number;
  teamName: string;
  teamLogo?: string | null;
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
