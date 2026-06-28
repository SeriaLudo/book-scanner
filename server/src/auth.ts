import {verifyToken} from '@clerk/backend';
import {eq} from 'drizzle-orm';
import {createMiddleware} from 'hono/factory';
import {db} from './db/client.js';
import {users, type User} from './db/schema.js';
import {env} from './env.js';

export type AppBindings = {
  Variables: {
    user: User;
  };
};

function extractBearerToken(header: string | undefined) {
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

function extractEmail(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null;
  const maybeEmail = (payload as {email?: unknown; email_address?: unknown}).email;
  if (typeof maybeEmail === 'string') return maybeEmail;
  const maybeEmailAddress = (payload as {email_address?: unknown}).email_address;
  return typeof maybeEmailAddress === 'string' ? maybeEmailAddress : null;
}

export const requireAuth = createMiddleware<AppBindings>(async (c, next) => {
  if (!env.CLERK_SECRET_KEY) {
    return c.json({error: 'Clerk is not configured on the server'}, 500);
  }

  const token = extractBearerToken(c.req.header('Authorization'));
  if (!token) {
    return c.json({error: 'Missing bearer token'}, 401);
  }

  try {
    const payload = await verifyToken(token, {secretKey: env.CLERK_SECRET_KEY});
    const clerkUserId = payload.sub;
    if (!clerkUserId) {
      return c.json({error: 'Invalid Clerk token'}, 401);
    }

    const now = new Date();
    const [user] = await db
      .insert(users)
      .values({clerkUserId, email: extractEmail(payload), updatedAt: now})
      .onConflictDoUpdate({
        target: users.clerkUserId,
        set: {email: extractEmail(payload), updatedAt: now},
      })
      .returning();

    if (!user) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, clerkUserId))
        .limit(1);
      if (!existingUser) return c.json({error: 'Could not resolve user'}, 500);
      c.set('user', existingUser);
    } else {
      c.set('user', user);
    }

    await next();
  } catch (error) {
    console.error('Clerk token verification failed', error);
    return c.json({error: 'Invalid bearer token'}, 401);
  }
});
