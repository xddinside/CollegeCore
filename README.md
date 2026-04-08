# College Planner

Next.js 16 app for planning semesters, subjects, assignments, todos, and exam sprints.

## Stack

- Next.js 16
- React 19
- Clerk for auth
- Drizzle ORM
- MySQL (`mysql2`)

## Environment

Copy `.env.example` to `.env.local` and fill in the values you actually use.

Required in production:

- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

Optional for local development:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

`DATABASE_URL` is the preferred setting everywhere. The split `DB_*` variables are only kept as a local fallback.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Database Workflow

Generate a migration after schema changes:

```bash
npm run db:generate
```

Apply migrations to the target database:

```bash
npm run db:migrate
```

Push schema changes directly without generating SQL first:

```bash
npm run db:push
```

Open Drizzle Studio:

```bash
npm run db:studio
```

## Vercel Deployment

This app is ready to deploy to Vercel.

### 1. Create the database

Use a managed MySQL database. For your current plan, use Aiven and copy the exact `DATABASE_URL` they provide for the MySQL service.

If your Aiven service requires SSL, also add the CA certificate contents as `DATABASE_SSL_CA`. The app and Drizzle tooling now support that directly.

### 2. Set Vercel environment variables

Add these in the Vercel project settings:

- `DATABASE_URL`
- `DATABASE_SSL_CA` if Aiven requires TLS verification
- `DATABASE_SSL_REJECT_UNAUTHORIZED` with value `true`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

Add UploadThing keys only if you enable uploads in production.

### 3. Run database migrations

Before the first production release, run:

```bash
npm run db:migrate
```

Run it against the production `DATABASE_URL` so the tables exist before the app starts serving traffic.

This repo also includes a GitHub Actions workflow that can run the same migration automatically after a successful Vercel production deployment, plus a manual dispatch option for controlled releases.

### 4. Configure Clerk

- Add your Vercel production URL to Clerk allowed origins / redirect URLs.
- Use the production Clerk keys in Vercel.

### 5. Deploy

- Import the repo into Vercel.
- Keep the default build command: `npm run build`
- Keep the default install command: `npm install`

## GitHub Actions

The repo includes `.github/workflows/production-db-migrate.yml`.

It runs database migrations in two cases:

- manually through `workflow_dispatch`
- automatically after a successful GitHub `deployment_status` event for the `Production` environment

Set these GitHub environment secrets in the `production` environment:

- `DATABASE_URL`
- `DATABASE_SSL_CA` if your Aiven service requires TLS verification
- `DATABASE_SSL_REJECT_UNAUTHORIZED` with value `true`

For schema changes that are not backward-compatible, use the manual workflow before or alongside the production rollout instead of relying only on the post-deploy trigger.

## Notes

- The app builds successfully in production mode.
- The repo now supports a single `DATABASE_URL` for runtime and Drizzle tooling.
- The runtime and Drizzle config both support optional SSL settings for managed MySQL providers like Aiven.
