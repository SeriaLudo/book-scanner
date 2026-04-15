import 'dotenv/config';
import {env} from './config.js';
import {pool} from './db.js';
import {initFirebaseAdmin} from './firebaseAdmin.js';
import {createApp} from './app.js';

async function main() {
  initFirebaseAdmin();
  await pool.query('SELECT 1');

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`Book Scanner API listening on port ${env.PORT}`);
  });
}

main().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
