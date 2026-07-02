import { AdvisoryNote } from '@prisma/client';

export interface INotesRepository {
  findById(id: string): Promise<AdvisoryNote | null>;
  findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<[AdvisoryNote[], number]>;
  create(data: Partial<AdvisoryNote>): Promise<AdvisoryNote>;
  update(id: string, data: Partial<AdvisoryNote>): Promise<AdvisoryNote>;
  delete(id: string): Promise<void>;
}
