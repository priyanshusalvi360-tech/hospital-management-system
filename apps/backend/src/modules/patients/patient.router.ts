import { Router, Request, Response } from 'express';
import * as patientController from './patient.controller';
import { validate } from '../../middleware/validate';
import { createPatientSchema, updatePatientSchema } from './patient.schema';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLog } from '../../middleware/auditLogger';

const router = Router();

const getParamId = (req: Request, _res: Response): string => String(req.params['id'] ?? 'unknown');

const auditCreate = auditLog({ action: 'PATIENT_CREATED', entity: 'Patient', getEntityId: getParamId });
const auditUpdate = auditLog({ action: 'PATIENT_UPDATED', entity: 'Patient', getEntityId: getParamId });
const auditDelete = auditLog({ action: 'PATIENT_DELETED', entity: 'Patient', getEntityId: getParamId });
const auditAdmit = auditLog({ action: 'PATIENT_ADMITTED', entity: 'Patient', getEntityId: getParamId });
const auditDischarge = auditLog({ action: 'PATIENT_DISCHARGED', entity: 'Patient', getEntityId: getParamId });

router.use(authenticate);

router.get('/', patientController.getPatients);
router.get('/:id', patientController.getPatientById);

router.post('/', authorize('ADMIN'), validate(createPatientSchema), auditCreate, patientController.createPatient);
router.patch('/:id', authorize('ADMIN'), validate(updatePatientSchema), auditUpdate, patientController.updatePatient);
router.delete('/:id', authorize('ADMIN'), auditDelete, patientController.deletePatient);

router.patch('/:id/admit', authorize('ADMIN'), auditAdmit, patientController.admitPatient);
router.patch('/:id/discharge', authorize('ADMIN'), auditDischarge, patientController.dischargePatient);

export default router;
