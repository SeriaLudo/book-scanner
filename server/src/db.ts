import {Pool} from 'pg';
import {env} from './config.js';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DB_SSL ? {rejectUnauthorized: false} : undefined,
});
