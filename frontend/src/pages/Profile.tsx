import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import Spinner from '../components/common/Spinner';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';

interface ProfileProps {
  onBack: () => void;
}

const Profile = ({ onBack }: ProfileProps) => {
  const { user } = useAuth();
  const { favorites, loading, error, removeFavorite, refresh } = useFavorites();
  const [removingId, setRemovingId] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  const handleRemove = async (favoriteId: string) => {
    setRemovingId(favoriteId);
    try {
      await removeFavorite(favoriteId);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <section>
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        <span aria-hidden>→</span> العودة
      </button>

      {/* User card */}
      <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
          <p className="text-sm text-gray-500" dir="ltr">
            {user.email}
          </p>
        </div>
      </div>

      {/* Favorites */}
      <div className="mt-8">
        <h3 className="mb-4 text-xl font-bold text-gray-900">
          الفرق المفضلة
          <span className="ms-2 rounded-full bg-red-100 px-2.5 py-0.5 text-sm text-red-700">
            {favorites.length}
          </span>
        </h3>

        {loading ? (
          <Spinner label="جاري تحميل المفضلة..." />
        ) : error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : favorites.length === 0 ? (
          <EmptyState message="لم تقم بإضافة أي فريق للمفضلة بعد." icon="❤️" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                {fav.teamLogo && (
                  <img src={fav.teamLogo} alt={fav.teamName} className="h-10 w-10 object-contain" />
                )}
                <span className="flex-1 font-medium text-gray-900">
                  {fav.teamName}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(fav.id)}
                  disabled={removingId === fav.id}
                  className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
                  aria-label="إزالة من المفضلة"
                >
                  {removingId === fav.id ? '...' : '🗑️'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Profile;
