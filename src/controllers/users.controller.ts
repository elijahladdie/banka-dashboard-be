import { Request, Response } from 'express';
import { UsersService } from '../services/users.service';
import { AuthenticatedRequest } from '../types';
import { HTTP_STATUS } from '../constants';
import { asyncHandler } from '../helpers';

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.usersService.findAll(req.query);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Users retrieved successfully.',
      ...result,
    });
  });

  findById = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.usersService.findById(req.params.id);
    const { passwordHash, ...userWithoutPassword } = user;
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User retrieved successfully.',
      data: userWithoutPassword,
    });
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await this.usersService.update(req.params.id, req.body, req.user!.userId);
    const { passwordHash, ...userWithoutPassword } = user;
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User updated successfully.',
      data: userWithoutPassword,
    });
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.usersService.softDelete(req.params.id, req.user!.userId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User deleted successfully.',
    });
  });
}
