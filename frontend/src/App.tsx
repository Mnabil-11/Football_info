import { useState } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import HomePage from './pages/HomePage';
import Profile from './pages/Profile';
import MatchDetails from './pages/MatchDetails';
import PlayerDetails from './pages/PlayerDetails';

function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-lg font-bold text-gray-900">
              ⚽ متتبع كرة القدم
            </Link>

            <div className="flex items-center gap-3">
              {isAuthenticated && user ? (
                <>
                  <Link
                    to="/profile"
                    className="text-sm font-medium text-gray-700 hover:text-blue-600"
                  >
                    {user.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      void logout();
                      navigate('/');
                    }}
                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    خروج
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  تسجيل الدخول
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
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
        </Routes>
      </main>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}

export default App;
