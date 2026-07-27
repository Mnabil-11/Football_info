import { http } from './http';
import { ApiEnvelope, AuthUser } from '../types/auth';

interface AuthPayload {
  user: AuthUser;
  token: string;
}

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface UpdateProfileBody {
  name?: string;
  avatar?: string | null;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export const registerRequest = async (
  body: RegisterBody
): Promise<AuthPayload> => {
  const { data } = await http.post<ApiEnvelope<AuthPayload>>(
    '/auth/register',
    body
  );
  return data.data;
};

export const loginRequest = async (body: LoginBody): Promise<AuthPayload> => {
  const { data } = await http.post<ApiEnvelope<AuthPayload>>('/auth/login', body);
  return data.data;
};

export const meRequest = async (): Promise<AuthUser> => {
  const { data } = await http.get<ApiEnvelope<{ user: AuthUser }>>('/auth/me');
  return data.data.user;
};

export const logoutRequest = async (): Promise<void> => {
  await http.post('/auth/logout');
};

export const updateProfileRequest = async (
  body: UpdateProfileBody
): Promise<AuthUser> => {
  const { data } = await http.patch<ApiEnvelope<{ user: AuthUser }>>(
    '/auth/profile',
    body
  );
  return data.data.user;
};

export const changePasswordRequest = async (
  body: ChangePasswordBody
): Promise<void> => {
  await http.patch('/auth/password', body);
};

export const deleteAccountRequest = async (password: string): Promise<void> => {
  await http.delete('/auth/me', { data: { password } });
};
