import {Router} from 'express';
import {z} from 'zod';
import {pool} from '../db.js';

const createGroupSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
});

const updateGroupSchema = z.object({
  name: z.string().min(1),
});

export const groupsRouter = Router();

groupsRouter.get('/', async (req, res, next) => {
  try {
    const uid = req.user!.uid;
    const result = await pool.query(
      `
      SELECT id, user_id, name, slug, created_at, updated_at
      FROM groups
      WHERE user_id = $1
      ORDER BY created_at ASC
      `,
      [uid]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

groupsRouter.post('/', async (req, res, next) => {
  try {
    const payload = createGroupSchema.parse(req.body);
    const uid = req.user!.uid;
    const result = await pool.query(
      `
      INSERT INTO groups (user_id, name, slug)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, name, slug, created_at, updated_at
      `,
      [uid, payload.name, payload.slug]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

groupsRouter.patch('/:id', async (req, res, next) => {
  try {
    const payload = updateGroupSchema.parse(req.body);
    const uid = req.user!.uid;
    const {id} = req.params;
    const result = await pool.query(
      `
      UPDATE groups
      SET name = $1, updated_at = NOW()
      WHERE id = $2 AND user_id = $3
      RETURNING id, user_id, name, slug, created_at, updated_at
      `,
      [payload.name, id, uid]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({error: 'Group not found'});
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

groupsRouter.delete('/:id', async (req, res, next) => {
  try {
    const uid = req.user!.uid;
    const {id} = req.params;
    const result = await pool.query('DELETE FROM groups WHERE id = $1 AND user_id = $2', [id, uid]);
    if (result.rowCount === 0) {
      return res.status(404).json({error: 'Group not found'});
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
