import { Request, Response } from 'express';
import { AdvisorsService } from '../services/advisors.service';
import { AuthenticatedRequest } from '../types';
import { HTTP_STATUS } from '../constants';
import { asyncHandler } from '../helpers';

export class AdvisorsController {
  constructor(private readonly advisorsService: AdvisorsService) {}

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.advisorsService.findAll(req.query);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Advisors retrieved successfully.',
      ...result,
    });
  });

  findById = asyncHandler(async (req: Request, res: Response) => {
    const advisor = await this.advisorsService.findById(req.params.id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Advisor retrieved successfully.',
      data: advisor,
    });
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const advisor = await this.advisorsService.create(req.body, req.user!.userId);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Advisor created successfully.',
      data: advisor,
    });
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const advisor = await this.advisorsService.update(req.params.id, req.body, req.user!.userId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Advisor updated successfully.',
      data: advisor,
    });
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.advisorsService.softDelete(req.params.id, req.user!.userId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Advisor deleted successfully.',
    });
  });

  toggleAvailability = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const advisor = await this.advisorsService.toggleAvailability(req.params.id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Advisor is now ${advisor.isAvailable ? 'available' : 'unavailable'}.`,
      data: advisor,
    });
  });
}
