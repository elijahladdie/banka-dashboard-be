import { AdvisoryNote } from '@prisma/client';
import { NotesRepository } from '../repositories/implementations/notes.repository';
import { NotFoundError } from '../helpers';
import { PaginatedResult, QueryParams } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';
import { MESSAGES } from '../constants';

export class NotesService {
  private readonly notesRepository: NotesRepository;
  constructor() {
    this.notesRepository = new NotesRepository();
  }

  async findByAdvisor(advisorId: string, query: QueryParams): Promise<PaginatedResult<AdvisoryNote>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);
    const where: QueryParams = { advisorId };
    if (query.clientId) where.clientId = query.clientId;
    if (query.noteType) where.noteType = query.noteType;
    console.log(where)
    const [notes, total] = await this.notesRepository.findAll({ skip, take, orderBy, where });
    return paginateResult(notes, total, pagination);
  }

  async findById(id: string): Promise<AdvisoryNote> {
    const note = await this.notesRepository.findById(id);
    if (!note) throw new NotFoundError(MESSAGES.NOTES.NOT_FOUND);
    return note;
  }

  async create(data: Partial<AdvisoryNote>): Promise<AdvisoryNote> {
    return this.notesRepository.create(data);
  }

  async update(id: string, data: Partial<AdvisoryNote>): Promise<AdvisoryNote> {
    await this.findById(id);
    return this.notesRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.notesRepository.delete(id);
  }
}
