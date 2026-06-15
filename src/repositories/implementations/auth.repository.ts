import { User, RefreshToken } from '@prisma/client';
import prisma from '../../utils/prisma';
import { IAuthRepository } from '../interfaces/auth.interface';

export class AuthRepository implements IAuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async createUser(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    registrationCompleted?: boolean;
    source?: string;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        registrationCompleted: data.registrationCompleted ?? true,
        source: data.source,
        role: 'SUBSCRIBER',
        status: 'PENDING',
      },
    });
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }
}
