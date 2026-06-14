import { AuditLog } from '@prisma/client';

export interface IAuditLogsRepository {
  findById(id: string): Promise<AuditLog | null>;
  findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<[AuditLog[], number]>;
  create(data: Partial<AuditLog>): Promise<AuditLog>;
}
