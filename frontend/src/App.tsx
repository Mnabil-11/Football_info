import { lazy, Suspense, useState } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTheme } from './hooks/useTheme';
import AuthModal from './components/AuthModal';
import HomePage from './pages/HomePage';
import Spinner from './components/common/Spinner';
import EmptyState from './components/common/EmptyState';

// Split off routes that aren't needed on first paint — the home page (the
// most common entry point) no longer pulls their code into the main bundle.
const Profile = lazy(() => import('./pages/Profile'));
const MatchDetails = lazy(() => import('./pages/MatchDetails'));
const PlayerDetails = lazy(() => import('./pages/PlayerDetails'));

function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [authOpen, setAuthOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-lg font-bold text-gray-900 dark:text-gray-100">
              ⚽ متتبع كرة القدم
            </Link>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'}
                title={theme === 'dark' ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'}
                className="rounded-lg p-2 text-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              {isAuthenticated && user ? (
                <>
                  <Link
                    to="/profile"
                    className="text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                  >
                    {user.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      void logout();
                      navigate('/');
                    }}
                    className="rounded-lg bg-gray-100 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    خروج
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  تسجيل الدخول
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Suspense fallback={<Spinner label="جاري التحميل..." fullScreen />}>
          <Routes>
            <Route path="/" element={<HomePage onRequireAuth={() => setAuthOpen(true)} />} />
            <Route path="/profile" element={<Profile onBack={() => navigate('/')} />} />
            <Route
              path="/match/:id"
              element={<MatchDetails onRequireAuth={() => setAuthOpen(true)} />}
            />
            <Route
              path="/player/:provider/:id"
              element={<PlayerDetails onRequireAuth={() => setAuthOpen(true)} />}
            />
            <Route
              path="*"
              element={
                <EmptyState message="الصفحة غير موجودة." icon="🔍" />
              }
            />
          </Routes>
        </Suspense>
      </main>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}

export default App;
