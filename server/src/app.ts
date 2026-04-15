import cors from 'cors';
import express from 'express';
import {ZodError} from 'zod';
import {env} from './config.js';
import {requireAuth} from './middleware/auth.js';
import {booksRouter} from './routes/books.js';
import {groupsRouter} from './routes/groups.js';
import {healthRouter} from './routes/health.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
      credentials: true,
    })
  );
  app.use(express.json());

  app.use('/api', healthRouter);
  app.use('/api/groups', requireAuth, groupsRouter);
  app.use('/api/books', requireAuth, booksRouter);

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof ZodError) {
      return res.status(400).json({error: 'Invalid request payload', details: error.issues});
    }

    console.error(error);
    return res.status(500).json({error: 'Internal server error'});
  });

  return app;
}
