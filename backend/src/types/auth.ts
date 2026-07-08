/** A user object safe to expose to clients (never includes the password hash). */
export interface SafeUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  createdAt: Date;
}
