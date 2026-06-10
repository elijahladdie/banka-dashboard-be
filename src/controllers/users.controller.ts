import { Request, Response } from 'express';
import { UsersService } from '../services/users.service';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../helpers';
import { ResponseHandler } from '../utils/response-handler';

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.usersService.findAll(req.query);
    ResponseHandler.success(res, result, 'Users retrieved successfully.');
  });

  findById = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.usersService.findById(req.params.id);
    const { passwordHash, ...userWithoutPassword } = user;
    ResponseHandler.success(res, userWithoutPassword, 'User retrieved successfully.');
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await this.usersService.update(req.params.id, req.body, req.user!.userId);
    const { passwordHash, ...userWithoutPassword } = user;
    ResponseHandler.success(res, userWithoutPassword, 'User updated successfully.');
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.usersService.softDelete(req.params.id, req.user!.userId);
    ResponseHandler.success(res, null, 'User deleted successfully.');
  });
}
