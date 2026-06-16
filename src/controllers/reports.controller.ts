import { Request, Response } from 'express';
import { ReportsService } from '../services/reports.service';
import { AuthenticatedRequest } from '../types';
import { ResponseHandler } from '../utils/response-handler';

export class ReportsController {
  private readonly reportsService: ReportsService;
  constructor() {
    this.reportsService = new ReportsService();
  }

  async findAll(req: Request, res: Response) {
    const result = await this.reportsService.findAll(req.query);
    ResponseHandler.success(res, result, 'Reports retrieved successfully.');
  }

  async findById(req: Request, res: Response) {
    const report = await this.reportsService.findById(req.params.id);
    ResponseHandler.success(res, report, 'Report retrieved successfully.');
  }

  async create(req: AuthenticatedRequest, res: Response) {
    const report = await this.reportsService.create(req.body, req.user!.userId);
    ResponseHandler.success(res, report, 'Report created successfully.', 100, 201);
  }

  async update(req: AuthenticatedRequest, res: Response) {
    const report = await this.reportsService.update(req.params.id, req.body, req.user!.userId);
    ResponseHandler.success(res, report, 'Report updated successfully.');
  }
}
