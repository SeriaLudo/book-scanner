# Deployment Options

This document records the hosting decision and keeps alternative options as context.

## Current Decision

Use Netlify for the static client, an Azure VM for the backend API, and Azure Database for PostgreSQL Flexible Server for persistence.

```text
Client (Netlify)
  -> Backend API (Azure VM)
  -> Managed DB (Azure PostgreSQL Flexible Server)
```

This is now the active deployment architecture:

- `client/`: Vite React static site deployed to Netlify.
- `server/`: Node/Hono API deployed to an Azure VM.
- Postgres: Azure Database for PostgreSQL Flexible Server named `bookscanner`.

## Current Azure Resources

### Azure VM

- Public IP is available.
- SSH access is working.
- Intended to run the backend API.
- Should run the app process under PM2 or systemd.
- Must be able to connect outbound to Azure PostgreSQL on port `5432`.

### Azure Database for PostgreSQL Flexible Server

- Server name: `bookscanner`.
- Region: North Europe.
- Status: ready.
- Admin login: `pgadmin`.
- Public access enabled for this initial deployment.
- Storage: 32 GiB.
- Compute: B2s for dev/test.
- Backups, patching, and encryption are managed by Azure.

Firewall rules should allow:

- Your Mac public IP, for admin access and one-off migration/debug work.
- The Azure VM public IP, for the backend API.

## Required Runtime Configuration

### Server Environment On Azure VM

```bash
PORT=8787
CLIENT_ORIGIN=https://your-netlify-site.netlify.app
DATABASE_URL=postgresql://pgadmin:<password>@bookscanner.postgres.database.azure.com:5432/postgres
CLERK_SECRET_KEY=sk_live_...
```

If you create a dedicated application database, replace the trailing `/postgres` with that database name.

Do not commit real database passwords or Clerk secrets. Keep them in the VM environment, a `.env` file that is not committed, or a future secrets manager.

### Client Environment On Netlify

```bash
VITE_API_URL=https://your-api-host.example
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
```

`VITE_API_URL` should point to the Azure VM API endpoint. If a domain and reverse proxy are added later, point it at the HTTPS domain rather than the raw VM IP.

## Backend Deployment Shape

The first deploy can be simple and VM-based:

1. SSH into the Azure VM.
2. Pull the latest repo.
3. Install dependencies with pnpm.
4. Build the server package.
5. Run Drizzle migrations explicitly.
6. Restart the API process with PM2 or systemd.

Example command flow:

```bash
git pull
pnpm install --frozen-lockfile
pnpm --filter @book-scanner/server build
pnpm --filter @book-scanner/server db:migrate
pm2 restart book-scanner-api
```

For systemd:

```bash
sudo systemctl restart book-scanner-api
```

Do not run migrations automatically during server startup. Keep migrations as a deliberate deploy step so startup remains predictable and rollback handling is clearer.

## GitHub Actions Direction

The deployment workflow is `.github/workflows/deploy.yml`. It runs on pushes to `main` and manual dispatch.

The workflow:

- sets up Node 24 and pnpm,
- builds the client as a validation step,
- builds the server as a validation step,
- SSHes into the Azure VM,
- pulls `main` in the VM checkout,
- installs dependencies,
- builds the server,
- runs migrations,
- restarts the PM2 or systemd service.

Required GitHub Actions secrets:

```bash
AZURE_VM_HOST=...
AZURE_VM_USER=...
AZURE_VM_SSH_KEY=...
AZURE_VM_PORT=22
AZURE_APP_DIR=/opt/book-scanner
```

`AZURE_VM_PORT` and `AZURE_APP_DIR` are optional if the defaults are correct.

The VM must already have the repo cloned at `AZURE_APP_DIR`, Node 24, pnpm, access to the Git remote, and either PM2 or a `book-scanner-api` systemd service.

Netlify owns the client deploy from `main`. GitHub Actions only validates the client build and deploys the server.

## Netlify Client Setup

Build settings:

```bash
Base directory: client
Build command: pnpm build
Publish directory: client/dist
```

Environment variables:

```bash
VITE_API_URL=https://your-api-host.example
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
```

The app now builds for the domain root (`/`). Netlify SPA routing is configured in `netlify.toml`, which rewrites all paths to `/index.html`.

External Netlify setup needed:

- Create or connect the Netlify site.
- Enable Netlify production deploys from `main`.
- Add `VITE_API_URL` and `VITE_CLERK_PUBLISHABLE_KEY` in Netlify.

## Clerk Production Setup

For production:

- Add the Netlify domain to Clerk allowed origins and redirects.
- Add the Azure API domain where needed.
- Use production Clerk keys:
  - `VITE_CLERK_PUBLISHABLE_KEY=pk_live_...`
  - `CLERK_SECRET_KEY=sk_live_...`
- Ensure sign-in, sign-up, and post-auth redirects land on the deployed Netlify client.

## Suggested Deployment Sequence

1. Confirm the Azure VM can SSH and run Node 24 plus pnpm.
2. Confirm the Azure PostgreSQL server is ready.
3. Add PostgreSQL firewall rules for your Mac and the Azure VM public IP.
4. Decide whether to use the default `postgres` database or create a dedicated `book_scanner` database.
5. Clone the repo to `/opt/book-scanner` on the VM, or set `AZURE_APP_DIR` to the chosen path.
6. Configure the backend environment on the Azure VM.
7. Build and start the server once under PM2 or systemd.
8. Configure GitHub Actions secrets for Azure VM deployment.
9. Configure Netlify with `VITE_API_URL` pointing at the Azure API and production deploys from `main`.
10. Update Clerk domains and redirect URLs for root-path routes.
11. Merge to `main` and let GitHub Actions deploy the client and server.
12. Confirm `/health` works from your Mac.
13. Test sign-in, dashboard stats, group creation, scan/save book, and sign-out.

## Operational Notes

- Keep the VM and PostgreSQL in the same region where possible to reduce latency.
- Prefer HTTPS for the API before relying on browser features in production.
- Keep `CLIENT_ORIGIN` strict to the Netlify origin to avoid broad CORS access.
- Rotate the database password if it has been copied through chats, screenshots, or temporary notes.
- Back up the VM service configuration separately from app code.
- Rely on Azure PostgreSQL backups for database recovery, but periodically verify restore flow.

## Alternative Hosting Context

These options are no longer the chosen path, but they remain reasonable alternatives if requirements change.

### AWS

Previous recommendation was Netlify client, AWS App Runner API, and AWS RDS PostgreSQL.

Pros:

- App Runner is a managed container service.
- RDS PostgreSQL is mature and widely documented.
- AWS has strong private networking options.

Cons for this project:

- You already created working Azure VM and PostgreSQL resources.
- App Runner/RDS would require a fresh networking and deployment setup.
- It would add another cloud migration before the app is live.

### All Azure Managed Services

The VM could later be replaced by Azure App Service or Azure Container Apps.

Pros:

- Less VM maintenance.
- Managed HTTPS and process lifecycle.
- Better long-term fit if the API needs autoscaling.

Cons for the first deployment:

- More Azure service setup before validating the app.
- The VM is already available and SSH access is working.

### Render, Railway, Fly.io, Neon, Or Crunchy Bridge

These remain useful for prototypes or specialized database hosting, but they are not the current target. The current deployment should use the Azure resources already provisioned.
