import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api/authApi', () => ({
  meRequest: vi.fn(),
  loginRequest: vi.fn(),
  registerRequest: vi.fn(),
  logoutRequest: vi.fn(),
}));

vi.mock('../api/favoritesApi', () => ({
  listFavoriteTeamsRequest: vi.fn(),
  addFavoriteTeamRequest: vi.fn(),
  removeFavoriteTeamRequest: vi.fn(),
  listFavoritePlayersRequest: vi.fn(),
  addFavoritePlayerRequest: vi.fn(),
  removeFavoritePlayerRequest: vi.fn(),
}));

import { meRequest } from '../api/authApi';
import {
  addFavoriteTeamRequest,
  listFavoriteTeamsRequest,
  listFavoritePlayersRequest,
  removeFavoriteTeamRequest,
} from '../api/favoritesApi';
import { AuthProvider } from './AuthContext';
import { FavoritesProvider, useFavorites } from './FavoritesContext';

const authedUser = { id: 'user-1', email: 'test@example.com', name: 'Test User', avatar: null, createdAt: '2026-01-01' };

const Wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FavoritesProvider>{children}</FavoritesProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

const team = { id: 'fav-1', userId: 'user-1', teamId: 64, teamName: 'Liverpool FC', teamLogo: null, createdAt: '' };

const Consumer = () => {
  const { favorites, isFavorite, toggleFavorite, removeFavorite } = useFavorites();
  return (
    <div>
      <span data-testid="count">{favorites.length}</span>
      <span data-testid="is-fav-64">{String(isFavorite(64))}</span>
      <button onClick={() => toggleFavorite({ id: 64, name: 'Liverpool FC', logo: null }).catch(() => {})}>
        add
      </button>
      <button onClick={() => void removeFavorite('fav-1').catch(() => {})}>remove</button>
    </div>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(meRequest).mockResolvedValue(authedUser);
  vi.mocked(listFavoritePlayersRequest).mockResolvedValue([]);
});

describe('FavoritesProvider', () => {
  it('loads the favorite teams for an authenticated user', async () => {
    vi.mocked(listFavoriteTeamsRequest).mockResolvedValue([team]);

    render(<Consumer />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'));
    expect(screen.getByTestId('is-fav-64').textContent).toBe('true');
  });

  it('optimistically adds a team and rolls back if the request fails', async () => {
    vi.mocked(listFavoriteTeamsRequest).mockResolvedValue([]);
    // A manually-controlled promise lets us inspect the optimistic state
    // before deciding the outcome — an instantly-rejecting mock would race
    // the assertion, since onMutate + onError could both settle within the
    // same microtask flush.
    let rejectAdd!: (err: Error) => void;
    vi.mocked(addFavoriteTeamRequest).mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectAdd = reject;
      })
    );
    const user = userEvent.setup();

    render(<Consumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('0'));

    await user.click(screen.getByText('add'));

    // Optimistic add shows immediately, before the request resolves.
    await waitFor(() => expect(screen.getByTestId('is-fav-64').textContent).toBe('true'));

    rejectAdd(new Error('server error'));

    // ...then rolls back once the mutation rejects.
    await waitFor(() => expect(screen.getByTestId('is-fav-64').textContent).toBe('false'));
  });

  it('optimistically removes a favorite', async () => {
    vi.mocked(listFavoriteTeamsRequest)
      .mockResolvedValueOnce([team]) // initial load
      .mockResolvedValue([]); // refetch after the mutation settles
    vi.mocked(removeFavoriteTeamRequest).mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<Consumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'));

    await user.click(screen.getByText('remove'));

    // Optimistic removal is immediate...
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('0'));
    // ...and stays removed once the invalidated query refetches.
    await waitFor(() => expect(vi.mocked(listFavoriteTeamsRequest)).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId('count').textContent).toBe('0');
  });
});
