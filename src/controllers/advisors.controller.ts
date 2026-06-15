import { Request, Response } from 'express';
import { AdvisorsService } from '../services/advisors.service';
import { AuthenticatedRequest } from '../types';
import { ResponseHandler } from '../utils/response-handler';

export class AdvisorsController {
  constructor(private readonly advisorsService: AdvisorsService) {}

  async findAll(req: Request, res: Response) {
    const result = await this.advisorsService.findAll(req.query);
    ResponseHandler.success(res, result, 'Advisors retrieved successfully.');
  }

  async findById(req: Request, res: Response) {
    const advisor = await this.advisorsService.findById(req.params.id);
    ResponseHandler.success(res, advisor, 'Advisor retrieved successfully.');
  }

  async create(req: AuthenticatedRequest, res: Response) {
    const advisor = await this.advisorsService.create(req.body, req.user!.userId);
    ResponseHandler.success(res, advisor, 'Advisor created successfully.', 100, 201);
  }

  async update(req: AuthenticatedRequest, res: Response) {
    const advisor = await this.advisorsService.update(req.params.id, req.body, req.user!.userId);
    ResponseHandler.success(res, advisor, 'Advisor updated successfully.');
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    await this.advisorsService.softDelete(req.params.id, req.user!.userId);
    ResponseHandler.success(res, null, 'Advisor deleted successfully.');
  }

  async toggleAvailability(req: AuthenticatedRequest, res: Response) {
    const advisor = await this.advisorsService.toggleAvailability(req.params.id);
    ResponseHandler.success(res, advisor, `Advisor is now ${advisor.isAvailable ? 'available' : 'unavailable'}.`);
  }
}
