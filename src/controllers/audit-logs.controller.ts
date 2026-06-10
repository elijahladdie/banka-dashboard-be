import { Request, Response } from 'express';
import { AuditLogsService } from '../services/audit-logs.service';
import { HTTP_STATUS } from '../constants';
import { asyncHandler } from '../helpers';

export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.auditLogsService.findAll(req.query);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Audit logs retrieved successfully.',
      ...result,
    });
  });

  findById = asyncHandler(async (req: Request, res: Response) => {
    const log = await this.auditLogsService.findById(req.params.id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Audit log retrieved successfully.',
      data: log,
    });
  });
}
