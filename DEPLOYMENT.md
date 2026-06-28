# Deployment Notes

The chosen production shape is a Netlify client, an Azure VM API server, and Azure Database for
PostgreSQL Flexible Server.

```text
Netlify client -> Azure VM backend API -> Azure PostgreSQL Flexible Server
```

## Runtime Pieces

- Client: Vite React static site built from `client/` and hosted on Netlify.
- Server: Node/Hono API from `server/`, running on the Azure VM under PM2 or systemd.
- Database: Azure Database for PostgreSQL Flexible Server named `bookscanner` in North Europe.

The client is not deployed in Azure. The backend and managed database are deployed in Azure.

## Required Server Environment

Set these on the Azure VM in the backend process environment:

```bash
PORT=8787
CLIENT_ORIGIN=https://your-netlify-site.netlify.app
DATABASE_URL=postgresql://pgadmin:<password>@bookscanner.postgres.database.azure.com:5432/postgres
CLERK_SECRET_KEY=sk_live_...
```

Use the actual database name if you create an application database instead of using `postgres`. Do
not commit real passwords or secret keys.

## Required Client Environment

Set these in Netlify:

```bash
VITE_API_URL=https://your-api-host.example
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
```

`VITE_API_URL` must point to the public API URL served by the Azure VM, including any reverse proxy
hostname if one is added.

## Azure Networking

- PostgreSQL firewall rules must allow inbound access from your Mac and the Azure VM public IP.
- The Azure VM must have outbound access to `bookscanner.postgres.database.azure.com:5432`.
- The API should only allow browser requests from `CLIENT_ORIGIN` through CORS.
- If a domain or reverse proxy is added later, update `VITE_API_URL`, `CLIENT_ORIGIN`, and Clerk
  allowed origins/redirects together.

## Backend Deployment Flow

Deploy the API by SSHing into the Azure VM and updating the checked-out repo:

```bash
git pull
pnpm install --frozen-lockfile
pnpm --filter @book-scanner/server build
pnpm --filter @book-scanner/server db:migrate
pm2 restart book-scanner-api
```

If using systemd instead of PM2, replace the restart command with the service restart, for example:

```bash
sudo systemctl restart book-scanner-api
```

Run migrations as an explicit deploy step. Do not run migrations implicitly during server startup.

## GitHub Actions Deployment

Merges to `main` run `.github/workflows/deploy.yml`.

The workflow:

- builds the client and server with Node 24,
- deploys `client/dist` to Netlify,
- SSHes into the Azure VM,
- pulls `main`,
- installs dependencies,
- builds the server,
- runs Drizzle migrations,
- restarts `book-scanner-api` with PM2 or systemd.

Required GitHub Actions secrets:

```bash
VITE_API_URL=https://your-api-host.example
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
NETLIFY_AUTH_TOKEN=...
NETLIFY_SITE_ID=...
AZURE_VM_HOST=...
AZURE_VM_USER=...
AZURE_VM_SSH_KEY=...
AZURE_VM_PORT=22
AZURE_APP_DIR=/opt/book-scanner
```

`AZURE_VM_PORT` and `AZURE_APP_DIR` are optional if the defaults match the VM.

## Netlify Client Setup

Netlify should build the static client:

```bash
Base directory: client
Build command: pnpm build
Publish directory: client/dist
```

The app now builds for the domain root (`/`). Netlify SPA routing is configured in `netlify.toml`,
which rewrites all paths to `/index.html`.

External Netlify setup needed:

- Create or connect a Netlify site.
- Add `VITE_API_URL` and `VITE_CLERK_PUBLISHABLE_KEY` in Netlify if Netlify builds the client
  directly.
- Add `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` in GitHub if GitHub Actions deploys the client.
- Avoid enabling both Netlify automatic production deploys and the GitHub Actions Netlify deploy
  unless duplicate deploys are acceptable.

## Clerk Production Setup

- Add the Netlify client domain to Clerk allowed origins and redirects.
- Add the Azure API domain where Clerk/API integrations require it.
- Use production Clerk keys:
  - `VITE_CLERK_PUBLISHABLE_KEY=pk_live_...`
  - `CLERK_SECRET_KEY=sk_live_...`
- Confirm sign-in, sign-up, and post-auth redirects land on the Netlify client.

## Suggested Deployment Sequence

1. Confirm the Azure VM can SSH and reach `bookscanner.postgres.database.azure.com:5432`.
2. Add PostgreSQL firewall rules for your Mac and the Azure VM public IP.
3. Create the application database if not using the default `postgres` database.
4. Clone the repo to `/opt/book-scanner` on the VM, or set `AZURE_APP_DIR` to the chosen path.
5. Configure the server `.env` or process environment on the VM.
6. Start the backend once with PM2 or create a `book-scanner-api` systemd service.
7. Configure GitHub Actions secrets for Netlify and Azure VM deployment.
8. Configure Netlify environment variables if Netlify also builds from the repo.
9. Update Clerk production domains and redirects for root-path routes.
10. Merge to `main` and let GitHub Actions deploy the client and server.
11. Confirm the API `/health` endpoint works from your Mac.
12. Test sign-in, dashboard stats, group creation, and scan/save book.
