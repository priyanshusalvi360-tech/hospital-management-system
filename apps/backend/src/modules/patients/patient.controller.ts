import { Request, Response, NextFunction } from 'express';
import * as patientService from './patient.service';
import { ApiResponse } from '../../utils/ApiResponse';

const getId = (req: Request): string => String(req.params['id']);

export const getPatients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await patientService.getPatients(req.query);
    ApiResponse.success(res, result.data, 'Patients retrieved', 200, result.meta);
  } catch (err) { next(err); }
};

export const getPatientById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await patientService.getPatientById(getId(req));
    ApiResponse.success(res, patient);
  } catch (err) { next(err); }
};

export const createPatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await patientService.createPatient(req.body);
    ApiResponse.success(res, patient, 'Patient created successfully', 201);
  } catch (err) { next(err); }
};

export const updatePatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await patientService.updatePatient(getId(req), req.body);
    ApiResponse.success(res, patient, 'Patient updated successfully');
  } catch (err) { next(err); }
};

export const deletePatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await patientService.deletePatient(getId(req));
    ApiResponse.success(res, null, 'Patient deleted successfully');
  } catch (err) { next(err); }
};

export const admitPatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await patientService.admitPatient(getId(req));
    ApiResponse.success(res, patient, 'Patient admitted successfully');
  } catch (err) { next(err); }
};

export const dischargePatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await patientService.dischargePatient(getId(req));
    ApiResponse.success(res, patient, 'Patient discharged successfully');
  } catch (err) { next(err); }
};
