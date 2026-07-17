import { Prisma, User } from '@prisma/client';
import { SignUpInput } from '../../types';

export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByIdWithRoles(id: string): Promise<(User & { userRoles: { role: { slug: string } }[] }) | null>;
  findByEmailWithRoles(email: string): Promise<(User & { userRoles: { role: { slug: string } }[] }) | null>;
  createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    isRegComplete?: boolean;
    source?: string;
  }): Promise<User>;
  createUserWithRole(data: SignUpInput): Promise<User & { userRoles: { role: { slug: string } }[] }>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
}
