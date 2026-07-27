import { Response } from 'express';
import { NotesService } from '../services/notes.service';
import { AdvisorsRepository } from '../repositories/implementations/advisors.repository';
import { AuthenticatedRequest } from '../types';
import { ResponseHandler } from '../utils/response-handler';
import { ForbiddenError } from '../helpers';
import { MESSAGES } from '../constants';

export class NotesController {
  private readonly notesService: NotesService;
  private readonly advisorsRepository: AdvisorsRepository;
  constructor() {
    this.notesService = new NotesService();
    this.advisorsRepository = new AdvisorsRepository();
  }

  private async resolveAdvisorId(userId: string): Promise<string> {
    const advisor = await this.advisorsRepository.findByUserId(userId);
    if (!advisor) throw new ForbiddenError('Only advisors can manage advisory notes');
    return advisor.id;
  }

  async findByAdvisor(req: AuthenticatedRequest, res: Response) {
    const advisorId = req.params.advisorId || await this.resolveAdvisorId(req.user!.userId);
    const result = await this.notesService.findByAdvisor(advisorId, req.query);
    ResponseHandler.success(res, result, MESSAGES.NOTES.RETRIEVED);
  }

  async findClientNotes(req: AuthenticatedRequest, res: Response) {
    const { advisorId, clientId } = req.params;
    const query = { ...req.query, advisorId, clientId, noteType: 'CLIENT' };
    const result = await this.notesService.findByAdvisor(advisorId, query);
    ResponseHandler.success(res, result, MESSAGES.NOTES.RETRIEVED);
  }

  async findById(req: AuthenticatedRequest, res: Response) {
    const note = await this.notesService.findById(req.params.id);
    ResponseHandler.success(res, note, MESSAGES.NOTES.RETRIEVED_SINGLE);
  }

  async create(req: AuthenticatedRequest, res: Response) {
    const advisorId = await this.resolveAdvisorId(req.user!.userId);
    const note = await this.notesService.create({ ...req.body, advisorId });
    ResponseHandler.success(res, note, MESSAGES.NOTES.CREATED, 201);
  }

  async update(req: AuthenticatedRequest, res: Response) {
    const note = await this.notesService.update(req.params.id, req.body);
    ResponseHandler.success(res, note, MESSAGES.NOTES.UPDATED);
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    await this.notesService.delete(req.params.id);
    ResponseHandler.success(res, null, MESSAGES.NOTES.DELETED);
  }
}
