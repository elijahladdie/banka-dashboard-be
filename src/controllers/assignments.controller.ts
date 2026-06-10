import { Request, Response } from 'express';
import { AssignmentsService } from '../services/assignments.service';
import { AuthenticatedRequest } from '../types';
import { HTTP_STATUS } from '../constants';
import { asyncHandler } from '../helpers';

export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.assignmentsService.findAll(req.query);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Assignments retrieved successfully.',
      ...result,
    });
  });

  assign = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { subscriberId, advisorId } = req.body;
    const assignment = await this.assignmentsService.assignSubscriber(
      subscriberId,
      advisorId,
      req.user!.userId
    );
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Subscriber assigned to advisor successfully.',
      data: assignment,
    });
  });

  endAssignment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const assignment = await this.assignmentsService.endAssignment(
      req.params.id,
      req.user!.userId
    );
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Assignment ended successfully.',
      data: assignment,
    });
  });

  getActiveAssignment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const assignment = await this.assignmentsService.getActiveAssignment(req.params.subscriberId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: assignment ? 'Active assignment found.' : 'No active assignment.',
      data: assignment,
    });
  });
}
