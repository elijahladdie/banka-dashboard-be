import { Request, Response } from 'express';
import { GoalsService } from '../services/goals.service';
import { AuthenticatedRequest } from '../types';
import { ResponseHandler } from '../utils/response-handler';
import { MESSAGES } from '../constants';

export class GoalsController {
  private readonly goalsService: GoalsService;
  constructor() {
    this.goalsService = new GoalsService();
  }

  async findAll(req: Request, res: Response) {
    const result = await this.goalsService.findAll(req.query);
    ResponseHandler.success(res, result, MESSAGES.GOALS.RETRIEVED);
  }

  async findById(req: Request, res: Response) {
    const goal = await this.goalsService.findById(req.params.id);
    ResponseHandler.success(res, goal, MESSAGES.GOALS.RETRIEVED_SINGLE);
  }

  async findByClient(req: AuthenticatedRequest, res: Response) {
    const clientId = req.params.clientId || req.user!.userId;
    const result = await this.goalsService.findByClient(clientId, req.query);
    ResponseHandler.success(res, result, MESSAGES.GOALS.RETRIEVED);
  }

  async create(req: AuthenticatedRequest, res: Response) {
    const {targetDate, ...dto} = req.body;
    const goal = await this.goalsService.create(
      { ...dto, targetDate: new Date(targetDate).toISOString(), clientId: req.user!.userId },
      req.user!.userId
    );
    ResponseHandler.success(res, goal, MESSAGES.GOALS.CREATED, 100, 201);
  }

  async update(req: AuthenticatedRequest, res: Response) {
    const goal = await this.goalsService.update(req.params.id, req.body, req.user!.userId);
    ResponseHandler.success(res, goal, MESSAGES.GOALS.UPDATED);
  }

  async updateProgress(req: AuthenticatedRequest, res: Response) {
    const { currentAmount } = req.body;
    const goal = await this.goalsService.updateProgress(
      req.params.id,
      currentAmount,
      req.user!.userId
    );
    ResponseHandler.success(res, goal, MESSAGES.GOALS.PROGRESS_UPDATED);
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    await this.goalsService.softDelete(req.params.id, req.user!.userId);
    ResponseHandler.success(res, null, MESSAGES.GOALS.DELETED);
  }
}
