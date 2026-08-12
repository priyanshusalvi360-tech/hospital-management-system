import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { ApiResponse } from '../../utils/ApiResponse';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await authService.login(req.body);
    ApiResponse.success(res, data, 'Login successful');
  } catch (err) { next(err); }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    const data = await authService.refreshToken(token);
    ApiResponse.success(res, data, 'Token refreshed');
  } catch (err) { next(err); }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return;
    await authService.logout(req.user.userId);
    ApiResponse.success(res, null, 'Logged out successfully');
  } catch (err) { next(err); }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return;
    const data = await authService.getMe(req.user.userId);
    ApiResponse.success(res, data);
  } catch (err) { next(err); }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return;
    await authService.changePassword(req.user.userId, req.body);
    ApiResponse.success(res, null, 'Password changed successfully');
  } catch (err) { next(err); }
};
