import { Request, Response } from 'express';
import { AuditLogsService } from '../services/audit-logs.service';
import { asyncHandler } from '../helpers';
import { ResponseHandler } from '../utils/response-handler';

export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.auditLogsService.findAll(req.query);
    ResponseHandler.success(res, result, 'Audit logs retrieved successfully.');
  });

  findById = asyncHandler(async (req: Request, res: Response) => {
    const log = await this.auditLogsService.findById(req.params.id);
    ResponseHandler.success(res, log, 'Audit log retrieved successfully.');
  });
}
