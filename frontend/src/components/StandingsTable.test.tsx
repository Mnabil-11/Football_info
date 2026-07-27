import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StandingRow } from '../types/football';

vi.mock('../hooks/useFootball', () => ({
  useStandings: vi.fn(),
}));
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('../context/FavoritesContext', () => ({
  useFavorites: vi.fn(),
}));

import { useStandings } from '../hooks/useFootball';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import StandingsTable from './StandingsTable';

const row: StandingRow = {
  position: 1,
  team: { id: 64, name: 'Liverpool FC', shortName: 'Liverpool', tla: 'LIV', crest: null },
  playedGames: 10,
  won: 8,
  draw: 1,
  lost: 1,
  points: 25,
  goalsFor: 20,
  goalsAgainst: 5,
  goalDifference: 15,
};

const renderTable = (onRequireAuth = vi.fn()) =>
  render(
    <MemoryRouter>
      <StandingsTable code="PL" onRequireAuth={onRequireAuth} />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe('StandingsTable', () => {
  it('shows a skeleton while loading', () => {
    vi.mocked(useStandings).mockReturnValue({ data: undefined, isPending: true, error: null, refetch: vi.fn() } as never);
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false } as never);
    vi.mocked(useFavorites).mockReturnValue({ isFavorite: vi.fn(), toggleFavorite: vi.fn() } as never);

    renderTable();

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders the table with team data', () => {
    vi.mocked(useStandings).mockReturnValue({ data: [row], isPending: false, error: null, refetch: vi.fn() } as never);
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true } as never);
    vi.mocked(useFavorites).mockReturnValue({ isFavorite: vi.fn().mockReturnValue(false), toggleFavorite: vi.fn() } as never);

    renderTable();

    expect(screen.getByText('Liverpool')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Liverpool/ })).toHaveAttribute('href', '/team/64');
  });

  it('shows an empty state when there is no standings data', () => {
    vi.mocked(useStandings).mockReturnValue({ data: [], isPending: false, error: null, refetch: vi.fn() } as never);
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false } as never);
    vi.mocked(useFavorites).mockReturnValue({ isFavorite: vi.fn(), toggleFavorite: vi.fn() } as never);

    renderTable();

    expect(screen.getByText('لا يوجد جدول ترتيب متاح بعد.')).toBeInTheDocument();
  });

  it('prompts a guest to sign in instead of favoriting directly', async () => {
    const onRequireAuth = vi.fn();
    const toggleFavorite = vi.fn();
    vi.mocked(useStandings).mockReturnValue({ data: [row], isPending: false, error: null, refetch: vi.fn() } as never);
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false } as never);
    vi.mocked(useFavorites).mockReturnValue({ isFavorite: vi.fn().mockReturnValue(false), toggleFavorite } as never);
    const user = userEvent.setup();

    renderTable(onRequireAuth);
    await user.click(screen.getByRole('button', { name: 'إضافة إلى المفضلة' }));

    expect(onRequireAuth).toHaveBeenCalledOnce();
    expect(toggleFavorite).not.toHaveBeenCalled();
  });

  it('toggles the favorite for an authenticated user', async () => {
    const toggleFavorite = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useStandings).mockReturnValue({ data: [row], isPending: false, error: null, refetch: vi.fn() } as never);
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true } as never);
    vi.mocked(useFavorites).mockReturnValue({ isFavorite: vi.fn().mockReturnValue(false), toggleFavorite } as never);
    const user = userEvent.setup();

    renderTable();
    await user.click(screen.getByRole('button', { name: 'إضافة إلى المفضلة' }));

    expect(toggleFavorite).toHaveBeenCalledWith(
      expect.objectContaining({ id: 64, name: 'Liverpool FC' })
    );
  });
});
