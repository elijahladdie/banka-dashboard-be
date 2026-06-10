import { Request, Response } from 'express';
import { ReportsService } from '../services/reports.service';
import { AuthenticatedRequest } from '../types';
import { HTTP_STATUS } from '../constants';
import { asyncHandler } from '../helpers';

export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.reportsService.findAll(req.query);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Reports retrieved successfully.',
      ...result,
    });
  });

  findById = asyncHandler(async (req: Request, res: Response) => {
    const report = await this.reportsService.findById(req.params.id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Report retrieved successfully.',
      data: report,
    });
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const report = await this.reportsService.create(req.body, req.user!.userId);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Report created successfully.',
      data: report,
    });
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const report = await this.reportsService.update(req.params.id, req.body, req.user!.userId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Report updated successfully.',
      data: report,
    });
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.reportsService.delete(req.params.id, req.user!.userId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Report deleted successfully.',
    });
  });
}
