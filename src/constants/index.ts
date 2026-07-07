export { MESSAGES } from './messages';

export const ROLES = {
  ADMIN: 'admin',
  ADVISOR: 'advisor',
  CLIENT: 'client',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

export const TOKEN = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  REFRESH_TOKEN_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000,
  RESET_TOKEN_EXPIRY: 60 * 60 * 1000, // 1 hour
  VERIFICATION_TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
};

export const INCLUDE_USER = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      status: true,
      userRoles: {
        select: {
          role: {
            select: { slug: true },
          },
        },
      },
    },
  },
};
export const INCLUDE_USER_ADVISOR = {
  ...INCLUDE_USER,
  clientAssignment: {
    include: {
      advisor: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        },
      }
    }
  },
}