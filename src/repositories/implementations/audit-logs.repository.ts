import { AuditLog } from '@prisma/client';
import prisma from '../../utils/prisma';
import { IAuditLogsRepository } from '../interfaces/audit-logs.interface';

export class AuditLogsRepository implements IAuditLogsRepository {
  async findById(id: string): Promise<AuditLog | null> {
    return prisma.auditLog.findUnique({ where: { id } });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      ...params,
      include: { user: true },
    });
  }

  async count(where?: Record<string, any>): Promise<number> {
    return prisma.auditLog.count({ where });
  }

  async create(data: Partial<AuditLog>): Promise<AuditLog> {
    return prisma.auditLog.create({ data: data as any });
  }
}
