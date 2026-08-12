import { Request, Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service';
import { ApiResponse } from '../../utils/ApiResponse';

export const getDashboardData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [stats, admissionsChart, staffDistribution, recentActivity] = await Promise.all([
      dashboardService.getStats(),
      dashboardService.getAdmissionsChart(),
      dashboardService.getStaffDistribution(),
      dashboardService.getRecentActivity()
    ]);
    ApiResponse.success(res, { stats, admissionsChart, staffDistribution, recentActivity }, 'Dashboard data retrieved');
  } catch (err) { next(err); }
};
