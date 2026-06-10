import { Request, Response } from 'express';
import { MeetingsService } from '../services/meetings.service';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../helpers';
import { ResponseHandler } from '../utils/response-handler';

export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.meetingsService.findAll(req.query);
    ResponseHandler.success(res, result, 'Meetings retrieved successfully.');
  });

  findById = asyncHandler(async (req: Request, res: Response) => {
    const meeting = await this.meetingsService.findById(req.params.id);
    ResponseHandler.success(res, meeting, 'Meeting retrieved successfully.');
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const meeting = await this.meetingsService.create(req.body, req.user!.userId);
    ResponseHandler.success(res, meeting, 'Meeting created successfully.', 100, 201);
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const meeting = await this.meetingsService.update(req.params.id, req.body, req.user!.userId);
    ResponseHandler.success(res, meeting, 'Meeting updated successfully.');
  });

  updateStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const meeting = await this.meetingsService.updateStatus(
      req.params.id,
      req.body.status,
      req.user!.userId
    );
    ResponseHandler.success(res, meeting, 'Meeting status updated successfully.');
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.meetingsService.delete(req.params.id, req.user!.userId);
    ResponseHandler.success(res, null, 'Meeting deleted successfully.');
  });
}
