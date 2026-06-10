import { Response } from 'express';
import { NotesService } from '../services/notes.service';
import { AuthenticatedRequest } from '../types';
import { HTTP_STATUS } from '../constants';
import { asyncHandler } from '../helpers';

export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  findByAdvisor = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const advisorId = req.params.advisorId || req.user!.userId;
    const result = await this.notesService.findByAdvisor(advisorId, req.query);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Notes retrieved successfully.',
      ...result,
    });
  });

  findById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const note = await this.notesService.findById(req.params.id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Note retrieved successfully.',
      data: note,
    });
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const note = await this.notesService.create(req.body);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Note created successfully.',
      data: note,
    });
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const note = await this.notesService.update(req.params.id, req.body);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Note updated successfully.',
      data: note,
    });
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.notesService.delete(req.params.id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Note deleted successfully.',
    });
  });
}
