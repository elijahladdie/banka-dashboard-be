import { Prisma, User } from '@prisma/client';
import prisma from '../../utils/prisma';
import { IAuthRepository } from '../interfaces/auth.interface';

export class AuthRepository implements IAuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByIdWithRoles(id: string): Promise<(User & { userRoles: { role: { slug: string } }[] }) | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: { select: { slug: true } } } } },
    });
  }

  async findByEmailWithRoles(email: string): Promise<(User & { userRoles: { role: { slug: string } }[] }) | null> {
    return prisma.user.findUnique({
      where: { email },
      include: { userRoles: { include: { role: { select: { slug: true } } } } },
    });
  }

  async createUser(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    isRegComplete?: boolean;
    source?: string;
  }): Promise<User> {
    return await prisma.user.create({
      data: {
        email: data.email,
        password: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        isRegComplete: data.isRegComplete ?? true,
        source: data.source,
        status: 'PENDING',
      },
    });
  }

  async createUserWithRole(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    isRegComplete?: boolean;
    source?: string;
    roleSlug: string;
  }): Promise<User & { userRoles: { role: { slug: string } }[] }> {
    return await prisma.user.create({
      data: {
        email: data.email,
        password: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        isRegComplete: data.isRegComplete ?? true,
        source: data.source,
        status: 'PENDING',
        userRoles: {
          create: {
            role: {
              connect: { slug: data.roleSlug },
            },
          },
        },
      },
      include: { userRoles: { include: { role: { select: { slug: true } } } } },
    }) as any;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return await prisma.user.update({ where: { id }, data });
  }
}
