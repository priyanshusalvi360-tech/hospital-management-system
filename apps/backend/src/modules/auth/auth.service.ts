import { prisma } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import { comparePassword, hashPassword } from '../../utils/hash';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { LoginInput, ChangePasswordInput } from './auth.schema';

export const login = async ({ username, password, rememberMe }: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.isActive) throw new ApiError(401, 'Invalid credentials');
  
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw new ApiError(401, 'Invalid credentials');

  const accessToken = signAccessToken({ userId: user.id, username: user.username, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, username: user.username, role: user.role });

  const hashedRefreshToken = await hashPassword(refreshToken);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: hashedRefreshToken, lastLoginAt: new Date() },
  });

  const { password: _, refreshToken: __, ...userWithoutSecrets } = user;
  return { accessToken, refreshToken, user: userWithoutSecrets };
};

export const refreshToken = async (token: string) => {
  if (!token) throw new ApiError(401, 'Refresh token required');
  const payload = verifyRefreshToken(token);
  
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.refreshToken) throw new ApiError(401, 'Invalid refresh token');

  const isMatch = await comparePassword(token, user.refreshToken);
  if (!isMatch) throw new ApiError(401, 'Invalid refresh token');

  const accessToken = signAccessToken({ userId: user.id, username: user.username, role: user.role });
  return { accessToken };
};

export const logout = async (userId: string) => {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found');
  const { password, refreshToken, ...safeUser } = user;
  return safeUser;
};

export const changePassword = async (userId: string, { currentPassword, newPassword }: ChangePasswordInput) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found');

  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) throw new ApiError(400, 'Incorrect current password');

  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};
