import { NextRequest } from 'next/server';
import { auth as clerkAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export interface AuthenticatedRequest extends NextRequest {
  auth: any;
}

export type RouteHandler = (
  req: AuthenticatedRequest,
  context: any
) => Promise<Response> | Response;

export function auth(handler: RouteHandler): (req: NextRequest, context: any) => Promise<Response>;
export function auth(): Promise<any>;

export function auth(...args: any[]): any {
  // If it's a wrapper for a Route Handler
  if (args.length === 1 && typeof args[0] === 'function') {
    const handler = args[0] as RouteHandler;
    return async (req: NextRequest, context: any) => {
      const session = await getSession();
      const authReq = req as AuthenticatedRequest;
      authReq.auth = session;
      return handler(authReq, context);
    };
  }

  // Otherwise, it's a direct call in a Server Component / Server Action
  return getSession();
}

interface CachedSession {
  session: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      image: string;
    };
  } | null;
  expiresAt: number;
}

const sessionCache = new Map<string, CachedSession>();
const CACHE_TTL_MS = 15000; // 15 seconds cache TTL

export function clearSessionCache(userId: string) {
  // Try to find the user in the cache and delete it
  for (const [key, val] of sessionCache.entries()) {
    if (val.session?.user.id === userId) {
      sessionCache.delete(key);
      break;
    }
  }
}

async function getSession() {
  try {
    const { userId } = await clerkAuth();
    if (!userId) return null;

    const now = Date.now();
    const cached = sessionCache.get(userId);
    if (cached && cached.expiresAt > now) {
      return cached.session;
    }

    const { currentUser } = await import('@clerk/nextjs/server');
    const fullUser = await currentUser();
    if (!fullUser) return null;

    const email = fullUser.emailAddresses[0]?.emailAddress;
    if (!email) return null;

    let dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          firstName: fullUser.firstName || 'New',
          lastName: fullUser.lastName || 'User',
          password: '',
          role: 'PROCUREMENT_OFFICER',
          isActive: true,
        },
      });
    }

    const sessionPayload = {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: `${dbUser.firstName} ${dbUser.lastName}`,
        role: dbUser.role,
        image: dbUser.photo || fullUser.imageUrl,
      },
    };

    // Save to memory cache
    sessionCache.set(userId, {
      session: sessionPayload,
      expiresAt: now + CACHE_TTL_MS,
    });

    return sessionPayload;
  } catch (e) {
    console.error('Error getting Clerk session:', e);
    return null;
  }
}

export const handlers = {
  GET: () => new Response('Mock GET'),
  POST: () => new Response('Mock POST'),
};

export const signIn = async () => {};
export const signOut = async () => {};
