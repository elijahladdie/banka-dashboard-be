export function buildMeetingsFilter(query: Record<string, any>): Record<string, any> {
  const where: Record<string, any> = {};
  if (query.status) where.status = query.status;
  if (query.advisorId) where.advisorId = query.advisorId;
  if (query.clientId) where.clientId = query.clientId;
  if (query.fromDate) where.meetingDate = { ...where.meetingDate, gte: new Date(query.fromDate) };
  if (query.toDate) where.meetingDate = { ...where.meetingDate, lte: new Date(query.toDate) };
  return where;
}

export function buildUsersFilter(query: Record<string, any>): Record<string, any> {
  const where: Record<string, any> = {};
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

export function buildSubscriptionsFilter(query: Record<string, any>): Record<string, any> {
  const where: Record<string, any> = {};
  if (query.plan) where.plan = query.plan;
  if (query.status) where.status = query.status;
  return where;
}

export function buildAdvisorsFilter(query: Record<string, any>): Record<string, any> {
  const where: Record<string, any> = {};
  if (query.isAvailable !== undefined) where.isAvailable = query.isAvailable === 'true';
  if (query.specialization) where.specialization = { contains: query.specialization, mode: 'insensitive' };
  return where;
}

export function buildGoalsFilter(query: Record<string, any>): Record<string, any> {
  const where: Record<string, any> = {};
  if (query.clientId) where.clientId = query.clientId;
  if (query.status) where.status = query.status;
  return where;
}

export function buildServiceRequestsFilter(query: Record<string, any>): Record<string, any> {
  const where: Record<string, any> = {};
  if (query.clientId) where.clientId = query.clientId;
  if (query.advisorId) where.advisorId = query.advisorId;
  if (query.status) where.status = query.status;
  if (query.serviceType) where.serviceType = query.serviceType;
  return where;
}

export function buildNotificationsFilter(query: Record<string, any>): Record<string, any> {
  const where: Record<string, any> = {};
  if (query.unreadOnly === 'true') where.readAt = null;
  if (query.type) where.type = query.type;
  return where;
}

export function buildAssignmentsFilter(query: Record<string, any>): Record<string, any> {
  const where: Record<string, any> = {};
  if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
  if (query.advisorId) where.advisorId = query.advisorId;
  if (query.clientId) where.client = { user: { id: query.clientId } };
  return where;
}
