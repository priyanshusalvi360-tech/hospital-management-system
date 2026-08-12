import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';

interface AuditOptions {
  action: string;
  entity: string;
  getEntityId: (req: Request, res: Response) => string;
  getDetails?: (req: Request, res: Response) => Record<string, unknown>;
}

export const auditLog = (options: AuditOptions) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalSend = res.json.bind(res);
    const chunks: unknown[] = [];

    res.json = (body: unknown) => {
      chunks.push(body);
      return originalSend(body);
    };

    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        try {
          const responseBody = chunks[0] as any;
          const entityId = options.getEntityId(req, res) || responseBody?.data?.id || 'unknown';
          await prisma.auditLog.create({
            data: {
              userId: req.user.userId,
              action: options.action,
              entity: options.entity,
              entityId,
              details: options.getDetails ? (JSON.parse(JSON.stringify(options.getDetails(req, res))) as any) : undefined,
              ipAddress: req.ip,
            },
          });
        } catch (err) {
          console.error('Audit log error:', err);
        }
      }
    });

    next();
  };
};
