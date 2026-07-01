import { Prisma, User } from '@prisma/client';

export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByIdWithRoles(id: string): Promise<(User & { userRoles: { role: { slug: string } }[] }) | null>;
  findByEmailWithRoles(email: string): Promise<(User & { userRoles: { role: { slug: string } }[] }) | null>;
  createUser(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    isRegComplete?: boolean;
    source?: string;
  }): Promise<User>;
  createUserWithRole(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    isRegComplete?: boolean;
    source?: string;
    roleSlug: string;
  }): Promise<User & { userRoles: { role: { slug: string } }[] }>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
}
