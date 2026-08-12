require('dotenv').config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './modules/auth/auth.router';
import patientRouter from './modules/patients/patient.router';
import staffRouter from './modules/staff/staff.router';
import dashboardRouter from './modules/dashboard/dashboard.router';
import reportRouter from './modules/reports/report.router';

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests' },
});
app.use('/api', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/patients', patientRouter);
app.use('/api/v1/staff', staffRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/reports', reportRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`🏥 HMS API running on http://localhost:${env.PORT}`);
  console.log(`📊 Environment: ${env.NODE_ENV}`);
});

export default app;
