import { AdvisoryNote, Prisma } from '@prisma/client';
import prisma from '../../utils/prisma';
import { INotesRepository } from '../interfaces/notes.interface';
import { QueryParams } from '../../types';

export class NotesRepository implements INotesRepository {
  async findById(id: string): Promise<AdvisoryNote | null> {
    return prisma.advisoryNote.findUnique({ where: { id } });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: QueryParams;
  }): Promise<[AdvisoryNote[], number]> {
    const { skip, take, orderBy, where } = params;
    const [notes, total] = await Promise.all([
      prisma.advisoryNote.findMany({ where, skip, take, orderBy }),
      prisma.advisoryNote.count({ where }),
    ]);
    return [notes, total];
  }

  async create(data: Partial<AdvisoryNote>): Promise<AdvisoryNote> {
    return prisma.advisoryNote.create({ data: data as Prisma.AdvisoryNoteCreateInput });
  }

  async update(id: string, data: Partial<AdvisoryNote>): Promise<AdvisoryNote> {
    return prisma.advisoryNote.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.advisoryNote.delete({ where: { id } });
  }
}
