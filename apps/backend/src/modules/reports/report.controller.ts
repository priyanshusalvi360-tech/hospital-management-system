import { Request, Response, NextFunction } from 'express';
import * as reportService from './report.service';
import { ApiResponse } from '../../utils/ApiResponse';

export const getPatientReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await reportService.getPatientReport(req.query);
    ApiResponse.success(res, data, 'Patient report generated');
  } catch (err) { next(err); }
};

export const getStaffReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await reportService.getStaffReport(req.query);
    ApiResponse.success(res, data, 'Staff report generated');
  } catch (err) { next(err); }
};

export const getAdmissionsReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await reportService.getAdmissionsReport(req.query);
    ApiResponse.success(res, data, 'Admissions report generated');
  } catch (err) { next(err); }
};

export const getDischargesReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await reportService.getDischargesReport(req.query);
    ApiResponse.success(res, data, 'Discharges report generated');
  } catch (err) { next(err); }
};
