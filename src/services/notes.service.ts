import { AdvisoryNote } from '@prisma/client';
import prisma from '../utils/prisma';
import { NotFoundError } from '../helpers';
import { PaginatedResult } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';

export class NotesService {
  async findByAdvisor(
    advisorId: string,
    query: Record<string, any>
  ): Promise<PaginatedResult<AdvisoryNote>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);

    const where: Record<string, any> = { advisorId };
    if (query.subscriberId) where.subscriberId = query.subscriberId;

    const [notes, total] = await Promise.all([
      prisma.advisoryNote.findMany({ where, skip, take, orderBy }),
      prisma.advisoryNote.count({ where }),
    ]);

    return paginateResult(notes, total, pagination);
  }

  async findById(id: string): Promise<AdvisoryNote> {
    const note = await prisma.advisoryNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundError('Advisory note');
    return note;
  }

  async create(data: Partial<AdvisoryNote>): Promise<AdvisoryNote> {
    return prisma.advisoryNote.create({ data: data as any });
  }

  async update(id: string, data: Partial<AdvisoryNote>): Promise<AdvisoryNote> {
    await this.findById(id);
    return prisma.advisoryNote.update({ where: { id }, data });
  }

  async delete(id: string): Promise<AdvisoryNote> {
    await this.findById(id);
    return prisma.advisoryNote.delete({ where: { id } });
  }
}
