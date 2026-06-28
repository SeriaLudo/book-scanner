import {and, desc, eq} from 'drizzle-orm';
import {Hono} from 'hono';
import {z} from 'zod';
import type {AppBindings} from '../auth.js';
import {db} from '../db/client.js';
import {books, groups, type Book} from '../db/schema.js';

const conditionSchema = z.enum(['new', 'like_new', 'very_good', 'good', 'acceptable']);
const formatSchema = z.enum([
  'hardcover',
  'paperback',
  'trade_paperback',
  'mass_market_paperback',
  'other',
]);

const createBookSchema = z.object({
  isbn: z.string().trim().min(1),
  title: z.string().trim().min(1),
  authors: z.array(z.string()).default([]),
  group_id: z.string().uuid().nullable().optional(),
  condition: conditionSchema.default('good'),
  format: formatSchema.default('paperback'),
});

const updateBookSchema = z
  .object({
    group_id: z.string().uuid().nullable().optional(),
    condition: conditionSchema.optional(),
    format: formatSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

function serializeBook(book: Book) {
  return {
    id: book.id,
    user_id: book.userId,
    isbn: book.isbn,
    title: book.title,
    authors: book.authors,
    group_id: book.groupId,
    condition: book.condition,
    format: book.format,
    created_at: book.createdAt.toISOString(),
    updated_at: book.updatedAt.toISOString(),
  };
}

async function assertGroupBelongsToUser(groupId: string | null | undefined, userId: string) {
  if (!groupId) return true;

  const [group] = await db
    .select({id: groups.id})
    .from(groups)
    .where(and(eq(groups.id, groupId), eq(groups.userId, userId)))
    .limit(1);

  return Boolean(group);
}

export const bookRoutes = new Hono<AppBindings>()
  .get('/', async (c) => {
    const user = c.get('user');
    const groupId = c.req.query('group_id');

    const rows = await db
      .select()
      .from(books)
      .where(
        groupId
          ? and(eq(books.userId, user.id), eq(books.groupId, groupId))
          : eq(books.userId, user.id)
      )
      .orderBy(desc(books.createdAt));

    return c.json(rows.map(serializeBook));
  })
  .post('/', async (c) => {
    const user = c.get('user');
    const body = createBookSchema.parse(await c.req.json());
    const groupId = body.group_id ?? null;

    if (!(await assertGroupBelongsToUser(groupId, user.id))) {
      return c.json({error: 'Group not found'}, 404);
    }

    const now = new Date();
    const [book] = await db
      .insert(books)
      .values({
        userId: user.id,
        isbn: body.isbn,
        title: body.title,
        authors: body.authors,
        groupId,
        condition: body.condition,
        format: body.format,
        updatedAt: now,
      })
      .returning();

    return c.json(serializeBook(book), 201);
  })
  .patch('/:id', async (c) => {
    const user = c.get('user');
    const body = updateBookSchema.parse(await c.req.json());
    const groupId = body.group_id;

    if (!(await assertGroupBelongsToUser(groupId, user.id))) {
      return c.json({error: 'Group not found'}, 404);
    }

    const [book] = await db
      .update(books)
      .set({
        ...(groupId !== undefined ? {groupId} : {}),
        ...(body.condition ? {condition: body.condition} : {}),
        ...(body.format ? {format: body.format} : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(books.id, c.req.param('id')), eq(books.userId, user.id)))
      .returning();

    if (!book) return c.json({error: 'Book not found'}, 404);
    return c.json(serializeBook(book));
  })
  .delete('/:id', async (c) => {
    const user = c.get('user');
    const [book] = await db
      .delete(books)
      .where(and(eq(books.id, c.req.param('id')), eq(books.userId, user.id)))
      .returning();

    if (!book) return c.json({error: 'Book not found'}, 404);
    return c.body(null, 204);
  });
