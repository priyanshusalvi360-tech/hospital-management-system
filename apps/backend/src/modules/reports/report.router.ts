import { Router } from 'express';
import * as reportController from './report.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();
router.use(authenticate);

// Staff and Admin can view patient reports, admissions, and discharges
router.get('/patients', authorize('ADMIN', 'STAFF'), reportController.getPatientReport);
router.get('/admissions', authorize('ADMIN', 'STAFF'), reportController.getAdmissionsReport);
router.get('/discharges', authorize('ADMIN', 'STAFF'), reportController.getDischargesReport);

// Staff directory report with payroll/salaries is restricted to Admin
router.get('/staff', authorize('ADMIN'), reportController.getStaffReport);

export default router;
