import { QueryParams } from '../types';

export function buildMeetingsFilter(query: QueryParams): QueryParams {
  const where: QueryParams = {};
  if (query.status) where.status = query.status;
  if (query.advisorId) where.advisorId = query.advisorId;
  if (query.clientId) where.clientId = query.clientId;
  if (query.fromDate) where.meetingDate = { ...where.meetingDate, gte: new Date(query.fromDate) };
  if (query.toDate) where.meetingDate = { ...where.meetingDate, lte: new Date(query.toDate) };
  return where;
}

export function buildUsersFilter(query: QueryParams): QueryParams {
  const where: QueryParams = {};
  if (query.role) {
    where.userRoles = { some: { role: { slug: query.role } } };
  }
  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  return where;
}

export function buildSubscriptionsFilter(query: QueryParams): QueryParams {
  const where: QueryParams = {};
  if (query.plan) where.plan = query.plan;
  if (query.status) where.status = query.status;
  return where;
}

export function buildAdvisorsFilter(query: QueryParams): QueryParams {
  const where: QueryParams = {};
  if (query.isAvailable !== undefined) where.isAvailable = query.isAvailable === 'true';
  if (query.specialization) where.specialization = { contains: query.specialization, mode: 'insensitive' };
  return where;
}

export function buildGoalsFilter(query: QueryParams): QueryParams {
  const where: QueryParams = {};
  if (query.clientId) where.clientId = query.clientId;
  if (query.status) where.status = query.status;
  return where;
}

export function buildServiceRequestsFilter(query: QueryParams): QueryParams {
  const where: QueryParams = {};
  if (query.clientId) where.clientId = query.clientId;
  if (query.advisorId) where.advisorId = query.advisorId;
  if (query.status) where.status = query.status;
  if (query.serviceType) where.serviceType = query.serviceType;
  return where;
}

export function buildNotificationsFilter(query: QueryParams): QueryParams {
  const where: QueryParams = {};
  if (query.unreadOnly === 'true') where.readAt = null;
  if (query.type) where.type = query.type;
  return where;
}

export function buildAssignmentsFilter(query: QueryParams): QueryParams {
  const where: QueryParams = {};
  if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
  if (query.advisorId) where.advisorId = query.advisorId;
  if (query.clientId) where.client = { user: { id: query.clientId } };
  return where;
}
