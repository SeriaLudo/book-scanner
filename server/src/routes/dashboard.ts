import {and, count, eq, isNotNull} from 'drizzle-orm';
import {Hono} from 'hono';
import type {AppBindings} from '../auth.js';
import {db} from '../db/client.js';
import {books, groups} from '../db/schema.js';

export const dashboardRoutes = new Hono<AppBindings>().get('/', async (c) => {
  const user = c.get('user');

  const [[bookCount], [groupCount], [assignedBookCount]] = await Promise.all([
    db.select({count: count()}).from(books).where(eq(books.userId, user.id)),
    db.select({count: count()}).from(groups).where(eq(groups.userId, user.id)),
    db
      .select({count: count()})
      .from(books)
      .where(and(eq(books.userId, user.id), isNotNull(books.groupId))),
  ]);

  return c.json({
    books: bookCount?.count ?? 0,
    groups: groupCount?.count ?? 0,
    assignedBooks: assignedBookCount?.count ?? 0,
  });
});
