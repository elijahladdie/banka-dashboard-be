import { Response } from 'express';
import { NotesService } from '../services/notes.service';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../helpers';
import { ResponseHandler } from '../utils/response-handler';

export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  findByAdvisor = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const advisorId = req.params.advisorId || req.user!.userId;
    const result = await this.notesService.findByAdvisor(advisorId, req.query);
    ResponseHandler.success(res, result, 'Notes retrieved successfully.');
  });

  findById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const note = await this.notesService.findById(req.params.id);
    ResponseHandler.success(res, note, 'Note retrieved successfully.');
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const note = await this.notesService.create(req.body);
    ResponseHandler.success(res, note, 'Note created successfully.', 100, 201);
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const note = await this.notesService.update(req.params.id, req.body);
    ResponseHandler.success(res, note, 'Note updated successfully.');
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.notesService.delete(req.params.id);
    ResponseHandler.success(res, null, 'Note deleted successfully.');
  });
}
