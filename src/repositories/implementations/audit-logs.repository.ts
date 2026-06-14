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
  }): Promise<[AuditLog[], number]> {
    const [records, count] = await prisma.$transaction([
      prisma.auditLog.findMany({
        ...params,
        include: { user: true },
      }),
      prisma.auditLog.count({ where: params.where })
    ]);
    return [records, count];
  }

  async create(data: Partial<AuditLog>): Promise<AuditLog> {
    return prisma.auditLog.create({ data: data as any });
  }
}
