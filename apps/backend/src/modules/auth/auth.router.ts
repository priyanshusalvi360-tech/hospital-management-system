import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '../../middleware/validate';
import { loginSchema, changePasswordSchema } from './auth.schema';
import { authenticate } from '../../middleware/authenticate';
import { auditLog } from '../../middleware/auditLogger';

const router = Router();

router.post('/login', validate(loginSchema), auditLog({
  action: 'LOGIN',
  entity: 'User',
  getEntityId: (req, res) => (res as any).locals?.user?.id || 'unknown'
}), authController.login);

router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.patch('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

export default router;
