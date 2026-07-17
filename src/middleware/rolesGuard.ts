import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ForbiddenError } from '../helpers';
import { MESSAGES, ROLES } from '../constants';

export function rolesGuard(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ForbiddenError(MESSAGES.AUTH.AUTH_REQUIRED);
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      throw new ForbiddenError(MESSAGES.AUTH.INSUFFICIENT_PERMISSIONS);
    }

    next();
  };
}

export const isAdmin = rolesGuard(ROLES.ADMIN);
export const isAdvisor = rolesGuard(ROLES.ADVISOR);
export const isClient = rolesGuard(ROLES.CLIENT);
export const isAdminOrAdvisor = rolesGuard(ROLES.ADMIN, ROLES.ADVISOR);
export const isClientOrAdvisor = rolesGuard(ROLES.CLIENT, ROLES.ADVISOR);