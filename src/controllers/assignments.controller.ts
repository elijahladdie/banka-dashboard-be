import { Request, Response } from 'express';
import { AssignmentsService } from '../services/assignments.service';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../helpers';
import { ResponseHandler } from '../utils/response-handler';

export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.assignmentsService.findAll(req.query);
    ResponseHandler.success(res, result, 'Assignments retrieved successfully.');
  });

  assign = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { subscriberId, advisorId } = req.body;
    const assignment = await this.assignmentsService.assignSubscriber(
      subscriberId,
      advisorId,
      req.user!.userId
    );
    ResponseHandler.success(res, assignment, 'Subscriber assigned to advisor successfully.', 100, 201);
  });

  endAssignment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const assignment = await this.assignmentsService.endAssignment(
      req.params.id,
      req.user!.userId
    );
    ResponseHandler.success(res, assignment, 'Assignment ended successfully.');
  });

  getActiveAssignment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const assignment = await this.assignmentsService.getActiveAssignment(req.params.subscriberId);
    const message = assignment ? 'Active assignment found.' : 'No active assignment.';
    ResponseHandler.success(res, assignment, message);
  });
}
