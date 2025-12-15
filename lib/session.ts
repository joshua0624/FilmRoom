import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const getSession = async () => {
  return getServerSession(authOptions);
};

export const requireAuth = async () => {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
};





