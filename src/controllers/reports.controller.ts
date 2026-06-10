import { Request, Response } from 'express';
import { ReportsService } from '../services/reports.service';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../helpers';
import { ResponseHandler } from '../utils/response-handler';

export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.reportsService.findAll(req.query);
    ResponseHandler.success(res, result, 'Reports retrieved successfully.');
  });

  findById = asyncHandler(async (req: Request, res: Response) => {
    const report = await this.reportsService.findById(req.params.id);
    ResponseHandler.success(res, report, 'Report retrieved successfully.');
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const report = await this.reportsService.create(req.body, req.user!.userId);
    ResponseHandler.success(res, report, 'Report created successfully.', 100, 201);
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const report = await this.reportsService.update(req.params.id, req.body, req.user!.userId);
    ResponseHandler.success(res, report, 'Report updated successfully.');
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.reportsService.delete(req.params.id, req.user!.userId);
    ResponseHandler.success(res, null, 'Report deleted successfully.');
  });
}
