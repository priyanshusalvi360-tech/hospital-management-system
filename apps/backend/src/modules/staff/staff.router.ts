import { Router } from 'express';
import * as staffController from './staff.controller';
import { validate } from '../../middleware/validate';
import { createStaffSchema, updateStaffSchema } from './staff.schema';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate);

router.get('/', staffController.getStaff);
router.get('/:id', staffController.getStaffById);

router.post('/', authorize('ADMIN'), validate(createStaffSchema), staffController.createStaff);
router.patch('/:id', authorize('ADMIN'), validate(updateStaffSchema), staffController.updateStaff);
router.delete('/:id', authorize('ADMIN'), staffController.deleteStaff);

export default router;
