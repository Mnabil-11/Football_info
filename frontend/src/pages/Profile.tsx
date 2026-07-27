import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { SkeletonList } from '../components/common/Skeleton';
import Avatar from '../components/common/Avatar';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { hideOnImgError } from '../utils/img';

interface ProfileProps {
  onBack: () => void;
}

const Profile = ({ onBack }: ProfileProps) => {
  const { user } = useAuth();
  const {
    favorites,
    loading,
    error,
    removeFavorite,
    refresh,
    favoritePlayers,
    playersLoading,
    playersError,
    removePlayerFavorite,
    refreshPlayers,
  } = useFavorites();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removingPlayerId, setRemovingPlayerId] = useState<string | null>(null);

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

  const handleRemovePlayer = async (favoriteId: string) => {
    setRemovingPlayerId(favoriteId);
    try {
      await removePlayerFavorite(favoriteId);
    } finally {
      setRemovingPlayerId(null);
    }
  };

  return (
    <section>
      <button
        type="button"
        onClick={onBack}
        className="-ms-2 mb-5 inline-flex items-center gap-1 rounded-lg px-2 py-2.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
      >
        <span aria-hidden>→</span> العودة
      </button>

      {/* User card */}
      <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <Avatar src={user.avatar} alt={user.name} fallbackText={user.name} size="h-16 w-16" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user.name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400" dir="ltr">
            {user.email}
          </p>
        </div>
      </div>

      {/* Favorites */}
      <div className="mt-8">
        <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
          الفرق المفضلة
          <span className="ms-2 rounded-full bg-red-100 px-2.5 py-0.5 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
            {favorites.length}
          </span>
        </h3>

        {loading ? (
          <SkeletonList />
        ) : error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : favorites.length === 0 ? (
          <EmptyState message="لم تقم بإضافة أي فريق للمفضلة بعد." icon="❤️" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                {fav.teamLogo && (
                  <img
                    src={fav.teamLogo}
                    alt={fav.teamName}
                    width={40}
                    height={40}
                    className="h-10 w-10 object-contain"
                    loading="lazy"
                    onError={hideOnImgError}
                  />
                )}
                <span className="flex-1 font-medium text-gray-900 dark:text-gray-100">
                  {fav.teamName}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(fav.id)}
                  disabled={removingId === fav.id}
                  className="-m-2 p-2 text-sm text-red-500 hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                  aria-label="إزالة من المفضلة"
                >
                  {removingId === fav.id ? '...' : '🗑️'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Favorite players */}
      <div className="mt-8">
        <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
          اللاعبون المفضلون
          <span className="ms-2 rounded-full bg-red-100 px-2.5 py-0.5 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
            {favoritePlayers.length}
          </span>
        </h3>

        {playersLoading ? (
          <SkeletonList />
        ) : playersError ? (
          <ErrorState message={playersError} onRetry={refreshPlayers} />
        ) : favoritePlayers.length === 0 ? (
          <EmptyState message="لم تقم بإضافة أي لاعب للمفضلة بعد." icon="❤️" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoritePlayers.map((fav) => (
              <div
                key={fav.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <Avatar
                  src={fav.playerPhoto}
                  alt={fav.playerName}
                  fallbackText={fav.playerName}
                  size="h-10 w-10"
                  textSize="text-sm"
                />
                <span className="flex-1 font-medium text-gray-900 dark:text-gray-100">
                  {fav.playerName}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemovePlayer(fav.id)}
                  disabled={removingPlayerId === fav.id}
                  className="-m-2 p-2 text-sm text-red-500 hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                  aria-label="إزالة من المفضلة"
                >
                  {removingPlayerId === fav.id ? '...' : '🗑️'}
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
