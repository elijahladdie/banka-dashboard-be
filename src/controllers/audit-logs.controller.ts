import { Request, Response } from 'express';
import { AuditLogsService } from '../services/audit-logs.service';
import { ResponseHandler } from '../utils/response-handler';

export class AuditLogsController {
  private readonly auditLogsService: AuditLogsService
  constructor() {
    this.auditLogsService = new AuditLogsService();
  }

  async findAll(req: Request, res: Response) {
    const result = await this.auditLogsService.findAll(req.query);
    ResponseHandler.success(res, result, 'Audit logs retrieved successfully.');
  }

  async findById(req: Request, res: Response) {
    const log = await this.auditLogsService.findById(req.params.id);
    ResponseHandler.success(res, log, 'Audit log retrieved successfully.');
  }
}
