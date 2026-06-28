# Deployment Notes

The app is split into a static Vite client and a portable Node API server.

## Runtime Pieces

- Client: build with `pnpm --filter @book-scanner/client build` and host `client/dist`.
- Server: build the image from `server/Dockerfile` and run it as a standard HTTP container.
- Database: use Postgres locally through Docker Compose and managed Postgres in production.

## Required Server Environment

```bash
PORT=8787
CLIENT_ORIGIN=https://your-client-origin.example
DATABASE_URL=postgres://user:password@host:5432/book_scanner
CLERK_SECRET_KEY=sk_live_...
```

## Required Client Environment

```bash
VITE_API_URL=https://your-api-origin.example
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
```

## Migration Flow

Run database migrations as an explicit deployment step:

```bash
pnpm --filter @book-scanner/server db:migrate
```

Do not run migrations implicitly during server startup. That keeps app boot predictable and makes rollback/failure handling clearer.

## Hosting Options

AWS and GCP both fit this shape:

- AWS: static client on S3/CloudFront or Amplify Hosting, server on ECS/Fargate/App Runner, database on RDS Postgres.
- GCP: static client on Firebase Hosting/Cloud Storage, server on Cloud Run, database on Cloud SQL Postgres.

The app code should not need cloud-specific changes. Cloud details should live in deployment configuration and environment variables.
