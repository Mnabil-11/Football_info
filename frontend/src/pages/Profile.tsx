import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { getBackendErrorMessage } from '../api/http';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { SkeletonList } from '../components/common/Skeleton';
import Avatar from '../components/common/Avatar';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { hideOnImgError } from '../utils/img';

interface ProfileProps {
  onBack: () => void;
}

const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';
const labelClass = 'mb-1 block text-sm text-gray-700 dark:text-gray-300';

/** Name/avatar edit, password change, and account deletion — all folded into
 * collapsible sections so the profile page stays scannable by default. */
const AccountSettings = ({ onAccountDeleted }: { onAccountDeleted: () => void }) => {
  const { user, updateProfile, changePassword, deleteAccount, logout } = useAuth();

  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    try {
      await updateProfile({
        name: name.trim() !== user.name ? name.trim() : undefined,
        avatar: avatar.trim() !== (user.avatar ?? '') ? avatar.trim() || null : undefined,
      });
      setEditingProfile(false);
    } catch (err) {
      setProfileError(getBackendErrorMessage(err, 'تعذر حفظ التغييرات.'));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    if (newPassword !== confirmPassword) {
      setPasswordError('كلمتا المرور الجديدتان غير متطابقتين.');
      return;
    }
    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(getBackendErrorMessage(err, 'تعذر تغيير كلمة المرور.'));
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      await logout();
      onAccountDeleted();
    } catch (err) {
      setDeleteError(getBackendErrorMessage(err, 'تعذر حذف الحساب.'));
      setDeleting(false);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Edit name/avatar */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <button
          type="button"
          onClick={() => setEditingProfile((v) => !v)}
          className="flex w-full items-center justify-between text-start text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          تعديل الاسم والصورة
          <span aria-hidden>{editingProfile ? '−' : '+'}</span>
        </button>
        {editingProfile && (
          <form onSubmit={handleSaveProfile} className="mt-4 space-y-3">
            <div>
              <label htmlFor="profile-name" className={labelClass}>
                الاسم
              </label>
              <input
                id="profile-name"
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="profile-avatar" className={labelClass}>
                رابط الصورة الشخصية (اختياري)
              </label>
              <input
                id="profile-avatar"
                type="url"
                placeholder="https://..."
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className={inputClass}
                dir="ltr"
              />
            </div>
            {profileError && (
              <p className="text-sm text-red-600 dark:text-red-400">{profileError}</p>
            )}
            <button
              type="submit"
              disabled={profileSaving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {profileSaving ? '...جارٍ الحفظ' : 'حفظ'}
            </button>
          </form>
        )}
      </div>

      {/* Change password */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <button
          type="button"
          onClick={() => setChangingPassword((v) => !v)}
          className="flex w-full items-center justify-between text-start text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          تغيير كلمة المرور
          <span aria-hidden>{changingPassword ? '−' : '+'}</span>
        </button>
        {changingPassword && (
          <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
            <div>
              <label htmlFor="current-password" className={labelClass}>
                كلمة المرور الحالية
              </label>
              <input
                id="current-password"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
                dir="ltr"
              />
            </div>
            <div>
              <label htmlFor="new-password" className={labelClass}>
                كلمة المرور الجديدة
              </label>
              <input
                id="new-password"
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                dir="ltr"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className={labelClass}>
                تأكيد كلمة المرور الجديدة
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                dir="ltr"
              />
            </div>
            {passwordError && (
              <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-sm text-green-600 dark:text-green-400">
                تم تغيير كلمة المرور بنجاح.
              </p>
            )}
            <button
              type="submit"
              disabled={passwordSaving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {passwordSaving ? '...جارٍ الحفظ' : 'تغيير كلمة المرور'}
            </button>
          </form>
        )}
      </div>

      {/* Delete account */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
        <button
          type="button"
          onClick={() => setConfirmingDelete((v) => !v)}
          className="flex w-full items-center justify-between text-start text-sm font-medium text-red-700 dark:text-red-400"
        >
          حذف الحساب نهائياً
          <span aria-hidden>{confirmingDelete ? '−' : '+'}</span>
        </button>
        {confirmingDelete && (
          <form onSubmit={handleDeleteAccount} className="mt-4 space-y-3">
            <p className="text-sm text-red-700 dark:text-red-400">
              هذا الإجراء نهائي ولا يمكن التراجع عنه — سيتم حذف حسابك وكل مفضلاتك.
              أدخل كلمة المرور لتأكيد الحذف.
            </p>
            <input
              type="password"
              required
              placeholder="كلمة المرور"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className={inputClass}
              dir="ltr"
            />
            {deleteError && (
              <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>
            )}
            <button
              type="submit"
              disabled={deleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {deleting ? '...جارٍ الحذف' : 'حذف الحساب نهائياً'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const Profile = ({ onBack }: ProfileProps) => {
  const { user } = useAuth();
  useDocumentTitle('الحساب');
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

      <AccountSettings onAccountDeleted={onBack} />

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
                <Link
                  to={`/team/${fav.teamId}`}
                  className="flex flex-1 items-center gap-3 hover:text-blue-600 dark:hover:text-blue-400"
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
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {fav.teamName}
                  </span>
                </Link>
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
