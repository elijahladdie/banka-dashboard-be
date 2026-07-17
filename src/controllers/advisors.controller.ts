import { Request, Response } from 'express';
import { AdvisorsService } from '../services/advisors.service';
import { AuthenticatedRequest } from '../types';
import { ResponseHandler } from '../utils/response-handler';
import { MESSAGES } from '../constants';

export class AdvisorsController {
  private readonly advisorsService: AdvisorsService;
  constructor() {
    this.advisorsService = new AdvisorsService();
  }

  async findAll(req: Request, res: Response) {
    const result = await this.advisorsService.findAll(req.query);
    ResponseHandler.success(res, result, MESSAGES.ADVISORS.RETRIEVED);
  }

  async findById(req: Request, res: Response) {
    const advisor = await this.advisorsService.findById(req.params.id);
    ResponseHandler.success(res, advisor, MESSAGES.ADVISORS.RETRIEVED_SINGLE);
  }

  async create(req: AuthenticatedRequest, res: Response) {
    const advisor = await this.advisorsService.create(req.body, req.user!.userId);
    ResponseHandler.success(res, advisor, MESSAGES.ADVISORS.CREATED, 100, 201);
  }

  async update(req: AuthenticatedRequest, res: Response) {
    const advisor = await this.advisorsService.update(req.params.id, req.body, req.user!.userId);
    ResponseHandler.success(res, advisor, MESSAGES.ADVISORS.UPDATED);
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    await this.advisorsService.softDelete(req.params.id, req.user!.userId);
    ResponseHandler.success(res, null, MESSAGES.ADVISORS.DELETED);
  }

  async toggleAvailability(req: AuthenticatedRequest, res: Response) {
    const advisor = await this.advisorsService.toggleAvailability(req.params.id);
    ResponseHandler.success(res, advisor, advisor.isAvailable ? MESSAGES.ADVISORS.AVAILABLE : MESSAGES.ADVISORS.UNAVAILABLE);
  }
}
