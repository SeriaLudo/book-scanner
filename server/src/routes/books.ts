import {Router} from 'express';
import {z} from 'zod';
import {pool} from '../db.js';

const createBookSchema = z.object({
  isbn: z.string().min(1),
  title: z.string().min(1),
  authors: z.array(z.string()).default([]),
  group_id: z.string().uuid().nullable().optional(),
});

const updateBookSchema = z.object({
  group_id: z.string().uuid().nullable(),
});

export const booksRouter = Router();

booksRouter.get('/', async (req, res, next) => {
  try {
    const uid = req.user!.uid;
    const groupId = req.query.groupId as string | undefined;

    if (groupId) {
      const result = await pool.query(
        `
        SELECT id, user_id, isbn, title, authors, group_id, created_at, updated_at
        FROM books
        WHERE user_id = $1 AND group_id = $2
        ORDER BY created_at DESC
        `,
        [uid, groupId]
      );
      return res.json(result.rows);
    }

    const result = await pool.query(
      `
      SELECT id, user_id, isbn, title, authors, group_id, created_at, updated_at
      FROM books
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [uid]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

booksRouter.post('/', async (req, res, next) => {
  try {
    const payload = createBookSchema.parse(req.body);
    const uid = req.user!.uid;
    const result = await pool.query(
      `
      INSERT INTO books (user_id, isbn, title, authors, group_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, isbn, title, authors, group_id, created_at, updated_at
      `,
      [uid, payload.isbn, payload.title, payload.authors, payload.group_id ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

booksRouter.patch('/:id', async (req, res, next) => {
  try {
    const payload = updateBookSchema.parse(req.body);
    const uid = req.user!.uid;
    const {id} = req.params;
    const result = await pool.query(
      `
      UPDATE books
      SET group_id = $1, updated_at = NOW()
      WHERE id = $2 AND user_id = $3
      RETURNING id, user_id, isbn, title, authors, group_id, created_at, updated_at
      `,
      [payload.group_id, id, uid]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({error: 'Book not found'});
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

booksRouter.delete('/:id', async (req, res, next) => {
  try {
    const uid = req.user!.uid;
    const {id} = req.params;
    const result = await pool.query('DELETE FROM books WHERE id = $1 AND user_id = $2', [id, uid]);
    if (result.rowCount === 0) {
      return res.status(404).json({error: 'Book not found'});
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
