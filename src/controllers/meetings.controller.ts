import { Request, Response } from 'express';
import { MeetingsService } from '../services/meetings.service';
import { AuthenticatedRequest } from '../types';
import { ResponseHandler } from '../utils/response-handler';
import { MESSAGES } from '../constants';

export class MeetingsController {
  private readonly meetingsService: MeetingsService;
  constructor() {
    this.meetingsService = new MeetingsService();
  }

  async findAll(req: Request, res: Response) {
    const result = await this.meetingsService.findAll(req.query);
    
    ResponseHandler.success(res, result, MESSAGES.MEETINGS.RETRIEVED);
  }

  async findById(req: Request, res: Response) {
    const meeting = await this.meetingsService.findById(req.params.id);
    ResponseHandler.success(res, meeting, MESSAGES.MEETINGS.RETRIEVED_SINGLE);
  }

  async create(req: AuthenticatedRequest, res: Response) {
    const meeting = await this.meetingsService.create(req.body, req.user!.userId);
    ResponseHandler.success(res, meeting, MESSAGES.MEETINGS.CREATED, 100, 201);
  }

  async update(req: AuthenticatedRequest, res: Response) {
    const meeting = await this.meetingsService.update(req.params.id, req.body, req.user!.userId);
    ResponseHandler.success(res, meeting, MESSAGES.MEETINGS.UPDATED);
  }

  async updateStatus(req: AuthenticatedRequest, res: Response) {
    const meeting = await this.meetingsService.updateStatus(
      req.params.id,
      req.body.status,
      req.user!.userId
    );
    ResponseHandler.success(res, meeting, MESSAGES.MEETINGS.STATUS_UPDATED);
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    await this.meetingsService.delete(req.params.id, req.user!.userId);
    ResponseHandler.success(res, null, MESSAGES.MEETINGS.DELETED);
  }
}
