import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api/authApi', () => ({
  loginRequest: vi.fn(),
  registerRequest: vi.fn(),
  meRequest: vi.fn(),
  logoutRequest: vi.fn(),
}));

import { loginRequest, logoutRequest, meRequest } from '../api/authApi';
import { AuthProvider, useAuth } from './AuthContext';

const user = { id: 'user-1', email: 'test@example.com', name: 'Test User', avatar: null, createdAt: '2026-01-01' };

/** Exercises the hook via its public surface — no internals reached into. */
const Consumer = () => {
  const { user: current, initializing, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="initializing">{String(initializing)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="name">{current?.name ?? 'none'}</span>
      <button onClick={() => void login('test@example.com', 'password123')}>login</button>
      <button onClick={() => void logout()}>logout</button>
    </div>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AuthProvider', () => {
  it('hydrates the session from /auth/me on mount', async () => {
    vi.mocked(meRequest).mockResolvedValue(user);

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('initializing').textContent).toBe('true');

    await waitFor(() => {
      expect(screen.getByTestId('initializing').textContent).toBe('false');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('name').textContent).toBe('Test User');
  });

  it('stays logged out when /auth/me rejects (no session cookie)', async () => {
    vi.mocked(meRequest).mockRejectedValue(new Error('401'));

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('initializing').textContent).toBe('false');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });

  it('logs in and updates the user', async () => {
    vi.mocked(meRequest).mockRejectedValue(new Error('401'));
    vi.mocked(loginRequest).mockResolvedValue({ user, token: 'signed' });
    const eventUser = userEvent.setup();

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('initializing').textContent).toBe('false'));

    await eventUser.click(screen.getByText('login'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });
  });

  it('clears the user even if the logout request fails', async () => {
    vi.mocked(meRequest).mockResolvedValue(user);
    vi.mocked(logoutRequest).mockRejectedValue(new Error('network error'));
    const eventUser = userEvent.setup();

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('authenticated').textContent).toBe('true'));

    await act(async () => {
      await eventUser.click(screen.getByText('logout'));
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });
});
