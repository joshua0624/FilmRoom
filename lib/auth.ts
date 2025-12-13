import { hash, compare } from 'bcryptjs';
import { prisma } from './prisma';

export const hashPassword = async (password: string): Promise<string> => {
  return hash(password, 12);
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return compare(password, hashedPassword);
};

export const getUserByUsername = async (username: string) => {
  return prisma.user.findUnique({
    where: { username },
  });
};

export const createUser = async (username: string, passwordHash: string) => {
  return prisma.user.create({
    data: {
      username,
      passwordHash,
    },
  });
};



