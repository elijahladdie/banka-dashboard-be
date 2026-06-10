import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ForbiddenError } from '../helpers';
import { ROLE_PERMISSIONS } from '../constants';

export function permissionsGuard(...requiredPermissions: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required.');
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];

    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      throw new ForbiddenError('Insufficient permissions.');
    }

    next();
  };
}
