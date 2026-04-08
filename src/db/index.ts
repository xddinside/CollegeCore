import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD ?? '';
  const database = process.env.DB_NAME;
  const port = process.env.DB_PORT;

  if (!host || !user || !database) {
    throw new Error(
      'Database configuration is missing. Set DATABASE_URL, or DB_HOST, DB_USER, and DB_NAME.'
    );
  }

  const auth = `${encodeURIComponent(user)}:${encodeURIComponent(password)}`;
  const hostWithPort = port ? `${host}:${port}` : host;
  return `mysql://${auth}@${hostWithPort}/${database}`;
}

function getSslConfig() {
  const ca = process.env.DATABASE_SSL_CA;
  const rejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;

  if (!ca && !rejectUnauthorized) {
    return undefined;
  }

  return {
    ...(ca ? { ca } : {}),
    rejectUnauthorized: rejectUnauthorized ? rejectUnauthorized !== 'false' : true,
  };
}

const pool = mysql.createPool({
  uri: getDatabaseUrl(),
  ssl: getSslConfig(),
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60_000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export const db = drizzle(pool, { schema, mode: 'default' });
export { schema };
