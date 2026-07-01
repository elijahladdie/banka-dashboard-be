import { Request, Response } from 'express';
import { AssignmentsService } from '../services/assignments.service';
import { AuthenticatedRequest } from '../types';
import { ResponseHandler } from '../utils/response-handler';

export class AssignmentsController {
  private readonly assignmentsService: AssignmentsService;
  constructor() {
    this.assignmentsService = new AssignmentsService();
  }

  async findAll(req: Request, res: Response) {
    const result = await this.assignmentsService.findAll(req.query);
    ResponseHandler.success(res, result, 'Assignments retrieved successfully.');
  }

  async assign(req: AuthenticatedRequest, res: Response) {
    const { clientId, advisorId } = req.body;
    const assignment = await this.assignmentsService.assignClient(
      clientId,
      advisorId,
      req.user!.userId
    );
    ResponseHandler.success(res, assignment, 'Client assigned to advisor successfully.', 100, 201);
  }

  async endAssignment(req: AuthenticatedRequest, res: Response) {
    const assignment = await this.assignmentsService.endAssignment(
      req.params.id,
      req.user!.userId
    );
    ResponseHandler.success(res, assignment, 'Assignment ended successfully.');
  }

  async getActiveAssignment(req: AuthenticatedRequest, res: Response) {
    const assignment = await this.assignmentsService.getActiveAssignment(req.params.clientId);
    const message = assignment ? 'Active assignment found.' : 'No active assignment.';
    ResponseHandler.success(res, assignment, message);
  }
}
