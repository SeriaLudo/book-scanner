import {serve} from '@hono/node-server';
import {Hono} from 'hono';
import {cors} from 'hono/cors';
import {HTTPException} from 'hono/http-exception';
import {ZodError} from 'zod';
import {requireAuth, type AppBindings} from './auth.js';
import {env} from './env.js';
import {bookRoutes} from './routes/books.js';
import {groupRoutes} from './routes/groups.js';

const app = new Hono<AppBindings>();

app.use(
  '*',
  cors({
    origin: env.CLIENT_ORIGIN,
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

app.get('/health', (c) => c.json({ok: true}));

app.use('/api/*', requireAuth);
app.route('/api/books', bookRoutes);
app.route('/api/groups', groupRoutes);

app.notFound((c) => c.json({error: 'Not found'}, 404));

app.onError((error, c) => {
  if (error instanceof ZodError) {
    return c.json({error: 'Invalid request', details: error.issues}, 400);
  }

  if (error instanceof HTTPException) {
    return error.getResponse();
  }

  console.error(error);
  return c.json({error: 'Internal server error'}, 500);
});

serve({fetch: app.fetch, port: env.PORT}, (info) => {
  console.log(`Book Scanner API listening on http://localhost:${info.port}`);
});
