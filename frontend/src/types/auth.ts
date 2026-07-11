/** Authenticated user as returned by the backend. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  createdAt: string;
}

/** A favorite-team record owned by the user. */
export interface FavoriteTeam {
  id: string;
  userId: string;
  teamId: number;
  teamName: string;
  teamLogo: string | null;
  createdAt: string;
}

/** A favorite-player record owned by the user. */
export interface FavoritePlayer {
  id: string;
  userId: string;
  playerId: number;
  playerName: string;
  playerPhoto: string | null;
  createdAt: string;
}

/** Standard success envelope from the backend. */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}
