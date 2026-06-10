export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(params?: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<T[]>;
  count(where?: Record<string, any>): Promise<number>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  softDelete(id: string): Promise<T>;
  hardDelete(id: string): Promise<T>;
}
