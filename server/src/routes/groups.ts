import {and, asc, eq} from 'drizzle-orm';
import {Hono} from 'hono';
import {z} from 'zod';
import type {AppBindings} from '../auth.js';
import {db} from '../db/client.js';
import {groups, type Group} from '../db/schema.js';

const createGroupSchema = z.object({
  name: z.string().trim().min(1),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

const updateGroupSchema = z.object({
  name: z.string().trim().min(1),
});

function serializeGroup(group: Group) {
  return {
    id: group.id,
    user_id: group.userId,
    name: group.name,
    slug: group.slug,
    created_at: group.createdAt.toISOString(),
    updated_at: group.updatedAt.toISOString(),
  };
}

export const groupRoutes = new Hono<AppBindings>()
  .get('/', async (c) => {
    const user = c.get('user');
    const rows = await db
      .select()
      .from(groups)
      .where(eq(groups.userId, user.id))
      .orderBy(asc(groups.createdAt));

    return c.json(rows.map(serializeGroup));
  })
  .post('/', async (c) => {
    const user = c.get('user');
    const body = createGroupSchema.parse(await c.req.json());
    const now = new Date();

    const [group] = await db
      .insert(groups)
      .values({...body, userId: user.id, updatedAt: now})
      .returning();

    return c.json(serializeGroup(group), 201);
  })
  .patch('/:id', async (c) => {
    const user = c.get('user');
    const body = updateGroupSchema.parse(await c.req.json());
    const [group] = await db
      .update(groups)
      .set({...body, updatedAt: new Date()})
      .where(and(eq(groups.id, c.req.param('id')), eq(groups.userId, user.id)))
      .returning();

    if (!group) return c.json({error: 'Group not found'}, 404);
    return c.json(serializeGroup(group));
  })
  .delete('/:id', async (c) => {
    const user = c.get('user');
    const [group] = await db
      .delete(groups)
      .where(and(eq(groups.id, c.req.param('id')), eq(groups.userId, user.id)))
      .returning();

    if (!group) return c.json({error: 'Group not found'}, 404);
    return c.body(null, 204);
  });
