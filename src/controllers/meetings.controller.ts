import { Request, Response } from 'express';
import { MeetingsService } from '../services/meetings.service';
import { AuthenticatedRequest } from '../types';
import { ResponseHandler } from '../utils/response-handler';

export class MeetingsController {
  private readonly meetingsService: MeetingsService;
  constructor() {
    this.meetingsService = new MeetingsService();
  }

  async findAll(req: Request, res: Response) {
    const result = await this.meetingsService.findAll(req.query);
    
    ResponseHandler.success(res, result, 'Meetings retrieved successfully.');
  }

  async findById(req: Request, res: Response) {
    const meeting = await this.meetingsService.findById(req.params.id);
    ResponseHandler.success(res, meeting, 'Meeting retrieved successfully.');
  }

  async create(req: AuthenticatedRequest, res: Response) {
    const meeting = await this.meetingsService.create(req.body, req.user!.userId);
    ResponseHandler.success(res, meeting, 'Meeting created successfully.', 100, 201);
  }

  async update(req: AuthenticatedRequest, res: Response) {
    const meeting = await this.meetingsService.update(req.params.id, req.body, req.user!.userId);
    ResponseHandler.success(res, meeting, 'Meeting updated successfully.');
  }

  async updateStatus(req: AuthenticatedRequest, res: Response) {
    const meeting = await this.meetingsService.updateStatus(
      req.params.id,
      req.body.status,
      req.user!.userId
    );
    ResponseHandler.success(res, meeting, 'Meeting status updated successfully.');
  }
}
