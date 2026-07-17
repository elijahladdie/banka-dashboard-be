import { Response } from 'express';
import { NotesService } from '../services/notes.service';
import { AuthenticatedRequest } from '../types';
import { ResponseHandler } from '../utils/response-handler';
import { MESSAGES } from '../constants';

export class NotesController {
  private readonly notesService: NotesService;
  constructor() {
    this.notesService = new NotesService();
  }

  async findByAdvisor(req: AuthenticatedRequest, res: Response) {
    const advisorId = req.params.advisorId || req.user!.userId;
    const result = await this.notesService.findByAdvisor(advisorId, req.query);
    ResponseHandler.success(res, result, MESSAGES.NOTES.RETRIEVED);
  }
}
