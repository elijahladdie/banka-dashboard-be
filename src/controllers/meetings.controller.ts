import { Request, Response } from 'express';
import { MeetingsService } from '../services/meetings.service';
import { AuthenticatedRequest } from '../types';
import { HTTP_STATUS } from '../constants';
import { asyncHandler } from '../helpers';

export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.meetingsService.findAll(req.query);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Meetings retrieved successfully.',
      ...result,
    });
  });

  findById = asyncHandler(async (req: Request, res: Response) => {
    const meeting = await this.meetingsService.findById(req.params.id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Meeting retrieved successfully.',
      data: meeting,
    });
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const meeting = await this.meetingsService.create(req.body, req.user!.userId);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Meeting created successfully.',
      data: meeting,
    });
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const meeting = await this.meetingsService.update(req.params.id, req.body, req.user!.userId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Meeting updated successfully.',
      data: meeting,
    });
  });

  updateStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const meeting = await this.meetingsService.updateStatus(
      req.params.id,
      req.body.status,
      req.user!.userId
    );
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Meeting status updated successfully.',
      data: meeting,
    });
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.meetingsService.delete(req.params.id, req.user!.userId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Meeting deleted successfully.',
    });
  });
}
