import { ClientAssignment, UserStatus, Subscription } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';

interface JwtPayload {
  userId: string;
  email: string;
  roles: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
export interface SignUpInput {
  email: string;
  password?: string;
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  subscriptionId?: string;
  customerId?: string;
  isRegComplete?: boolean;
  roleSlug?: string;
  source: 'paddle' | 'manual';
}
export interface CompleteRegistrationInput {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface PendingRegistrationResult {
  exists: boolean;
  email?: string;
  fullName?: string;
  isRegComplete?: boolean;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface TUserSelect {
  id: string,
  firstName: string,
  lastName: string,
  email: string,
  phoneNumber: string,
  status: UserStatus,
  roles: { role: { slug: string } }[],
}

export interface AnalyticsOverview {
  users: {
    total: number;
    clients: number;
    advisors: number;
    admins: number;
    newClientsLast30Days: number;
  };

  subscriptions: {
    active: number;
    inactive: number;
    cancelled: number;

    monthlyPlans: number;
    yearlyPlans: number;

    monthlyPercentage: number;
    yearlyPercentage: number;
  };

  goals: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;

    completionRate: number;
  };

  advisorCapacity: {
    totalCapacity: number;
    utilizedCapacity: number;
    availableCapacity: number;
    utilizationRate: number;
  };

  trends: {
    clients: {
      month: string;
      count: number;
    }[];

    subscriptions: {
      month: string;
      count: number;
    }[];

    goals: {
      month: string;
      count: number;
    }[];
  };
}

export interface ProductQuery {
  interval?: 'month' | 'year';
}

export interface WebhookResult {
  handled: boolean;
  reason?: string;
}

export interface UpdateActivationInput {
  customerId: string;
  subscriptionId: string;
  event: Record<string, any>;
}
export type AsyncFunction = (
  request: Request,
  response: Response,
  next: NextFunction,
) => Promise<any>;

/** Central type for dynamic query params parsed from Express req.query */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryParams = Record<string, any>;

/** Role info from UserRole join */
export interface UserRoleInfo {
  role: { slug: string };
}

/** User with roles */
export type UserWithRoles = {
  userRoles: UserRoleInfo[];
};

export interface SafeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  status: string;
  roles: string[];
  isRegComplete: boolean;
  isVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  source: string | null;
}

export interface AuthResponse {
  user: SafeUser;
  token: string;
}

export interface JwtDecodedPayload {
  userId: string;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

export interface CreateAdvisorInput {
  userId: string;
  employeeCode: string;
  specialization?: string;
  bio?: string;
  maxClients?: number;
}

export type TSelectClientAssignment = {
  client: { user: TUserSelect };
} & ClientAssignment;


export type SubscriptionWithUser = Subscription & {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    status: string;
    userRoles: { role: { slug: string } }[];
  };
};
