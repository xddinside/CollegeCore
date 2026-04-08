import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { defineConfig } from 'drizzle-kit';

function safeLoadEnvFile(path: string) {
  if (existsSync(path)) {
    loadEnvFile(path);
  }
}

safeLoadEnvFile('.env.local');
safeLoadEnvFile('.env');

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

function getDbCredentials() {
  const ssl = getSslConfig();

  if (!ssl) {
    return {
      url: getDatabaseUrl(),
    };
  }

  const url = new URL(getDatabaseUrl());
  return {
    host: decodeURIComponent(url.hostname),
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    ssl,
  };
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  strict: true,
  verbose: true,
  dbCredentials: getDbCredentials(),
});
