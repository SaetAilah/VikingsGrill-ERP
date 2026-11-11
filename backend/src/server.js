import env from './config/env.js';
import app from './app.js';
import pool from './config/database.js';

const port = env.PORT;

// Verify Database connection on startup
pool.query('SELECT 1')
  .then(() => {
    console.log(`[VikingsERP Database] Connected to MySQL (${env.DB_NAME} on ${env.DB_HOST}:${env.DB_PORT})`);
  })
  .catch((err) => {
    console.warn(`[VikingsERP Database Warning] Could not connect to MySQL: ${err.message}. Running in offline/degraded mode.`);
  });

app.listen(port, () => {
  console.log(`[VikingsERP Unified Backend] listening on http://localhost:${port}`);
});
