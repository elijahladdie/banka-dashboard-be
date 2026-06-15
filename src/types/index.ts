import { UserRole, UserStatus } from '@prisma/client';
import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
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

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  stack?: string;
}

export interface AuthTokens {
  accessToken: string;
}

export interface SignUpInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface PaddleSignUpInput {
  email: string;
  fullName: string;
  source: 'paddle';
  subscriptionId: string;
  customerId: string;
}

export interface PaddleSubscriptionUpdateInput {
  customerId: string;
  subscriptionId: string;
}

export interface CompleteRegistrationInput {
  email: string;
  phone: string;
  password: string;
}

export interface PendingRegistrationResult {
  exists: boolean;
  email?: string;
  fullName?: string;
  registrationCompleted?: boolean;
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

export interface AuditLogInput {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}
export interface TUserSelect {
  id: string,
  firstName: string,
  lastName: string,
  email: string,
  phoneNumber: string,
  status: UserStatus,
  role: UserRole,
}

export interface AnalyticsOverview {
  users: {
    total: number;
    subscribers: number;
    advisors: number;
    admins: number;
    newSubscribersLast30Days: number;
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
    subscribers: {
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