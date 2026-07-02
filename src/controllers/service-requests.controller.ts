import { Request, Response } from 'express';
import { ServiceRequestsService } from '../services/service-requests.service';
import { AuthenticatedRequest } from '../types';
import { ResponseHandler } from '../utils/response-handler';

export class ServiceRequestsController {
  private readonly service: ServiceRequestsService;
  constructor() {
    this.service = new ServiceRequestsService();
  }

  async findAll(req: Request, res: Response) {
    const result = await this.service.findAll(req.query);
    ResponseHandler.success(res, result, 'Service requests retrieved successfully.');
  }

  async findById(req: Request, res: Response) {
    const request = await this.service.findById(req.params.id);
    ResponseHandler.success(res, request, 'Service request retrieved successfully.');
  }

  async findByClient(req: AuthenticatedRequest, res: Response) {
    const clientId = req.params.clientId || req.user!.userId;
    const result = await this.service.findByClient(clientId, req.query);
    ResponseHandler.success(res, result, 'Service requests retrieved successfully.');
  }

  async findByAdvisor(req: AuthenticatedRequest, res: Response) {
    const advisorId = req.params.advisorId || req.user!.userId;
    const result = await this.service.findByAdvisor(advisorId, req.query);
    ResponseHandler.success(res, result, 'Service requests retrieved successfully.');
  }

  async create(req: AuthenticatedRequest, res: Response) {
    const request = await this.service.create(req.body, req.user!.userId);
    ResponseHandler.success(res, request, 'Service request created successfully.', 100, 201);
  }

  async update(req: AuthenticatedRequest, res: Response) {
    const request = await this.service.update(req.params.id, req.body, req.user!.userId);
    ResponseHandler.success(res, request, 'Service request updated successfully.');
  }

  async respond(req: AuthenticatedRequest, res: Response) {
    const { status, advisorResponse } = req.body;
    const request = await this.service.respond(req.params.id, status, advisorResponse);
    ResponseHandler.success(res, request, `Service request ${status.toLowerCase()} successfully.`);
  }

  async linkMeeting(req: AuthenticatedRequest, res: Response) {
    const { meetingId } = req.body;
    const request = await this.service.linkMeeting(req.params.id, meetingId);
    ResponseHandler.success(res, request, 'Meeting linked to service request successfully.');
  }
}
