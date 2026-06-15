import { User, RefreshToken } from '@prisma/client';

export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  createUser(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    registrationCompleted?: boolean;
    source?: string;
  }): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
}
