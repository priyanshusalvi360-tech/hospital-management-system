import { Router } from 'express';
import * as reportController from './report.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();
router.use(authenticate, authorize('ADMIN'));

router.get('/patients', reportController.getPatientReport);
router.get('/staff', reportController.getStaffReport);
router.get('/admissions', reportController.getAdmissionsReport);
router.get('/discharges', reportController.getDischargesReport);

export default router;
