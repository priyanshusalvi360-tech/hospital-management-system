import { Request, Response, NextFunction } from 'express';
import * as staffService from './staff.service';
import { ApiResponse } from '../../utils/ApiResponse';

const getId = (req: Request): string => String(req.params['id']);

export const getStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await staffService.getStaff(req.query);
    ApiResponse.success(res, result.data, 'Staff retrieved', 200, result.meta);
  } catch (err) { next(err); }
};

export const getStaffById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = await staffService.getStaffById(getId(req));
    ApiResponse.success(res, staff);
  } catch (err) { next(err); }
};

export const createStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = await staffService.createStaff(req.body);
    ApiResponse.success(res, staff, 'Staff created successfully', 201);
  } catch (err) { next(err); }
};

export const updateStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = await staffService.updateStaff(getId(req), req.body);
    ApiResponse.success(res, staff, 'Staff updated successfully');
  } catch (err) { next(err); }
};

export const deleteStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await staffService.deleteStaff(getId(req));
    ApiResponse.success(res, null, 'Staff deleted successfully');
  } catch (err) { next(err); }
};
