import { Request, Response } from 'express';
import { MeetingsService } from '../services/meetings.service';
import { ResponseHandler } from '../utils/response-handler';
import { MESSAGES } from '../constants';

export class MeetingsController {
  private readonly meetingsService: MeetingsService;
  constructor() {
    this.meetingsService = new MeetingsService();
  }

  async findAll(req: Request, res: Response) {
    const result = await this.meetingsService.findAll(req.query);
    ResponseHandler.success(res, result, MESSAGES.MEETINGS.RETRIEVED);
  }
}
