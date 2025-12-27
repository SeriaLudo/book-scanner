# Post-Merge Setup Guide

This guide covers the essential configuration steps needed after merging Supabase changes to main.

## Quick Start Checklist

### 1. Environment Variables

#### For Local Development

Create a `.env.local` file in the project root (this file is gitignored and only for local use):

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Where to get these values for local dev:**

- Run `supabase start` and copy the values from the output
- Or use your cloud Supabase project URL and anon key if testing against cloud

#### For GitHub Pages Deployment

**Do NOT create `.env.local` for production.** Instead, use GitHub repository secrets (see
[GitHub Pages Deployment](#github-pages-deployment) section below).

### 2. Database Setup

#### Option A: Local Development (Recommended for testing)

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase
# or
brew install supabase/tap/supabase

# Start local Supabase instance
supabase start

# Run migrations
supabase db reset  # This applies all migrations in supabase/migrations/
```

The migration file `supabase/migrations/20240101000000_create_books_and_groups.sql` will:

- Create `groups` and `books` tables
- Set up Row Level Security (RLS) policies
- Create necessary indexes
- Set up auto-update triggers

#### Option B: Cloud/Production

1. Go to your Supabase project dashboard (https://supabase.com/dashboard)
2. Click **SQL Editor** in the left sidebar (it's under the "Database" section)
3. Click **New query** (or use the existing query editor)
4. Copy the contents of `supabase/migrations/20240101000000_create_books_and_groups.sql`
5. Paste it into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)

**Verify setup:**

- Check that `groups` and `books` tables exist in the Table Editor
- Verify RLS is enabled (should show a lock icon next to table names)

### 3. Install Dependencies

```bash
npm install
```

The Supabase client (`@supabase/supabase-js`) should already be in `package.json`.

### 4. Test the Application

```bash
npm run dev
```

**Test checklist:**

- [ ] App loads without errors
- [ ] Can create a new account (sign up)
- [ ] Can log in with created account
- [ ] Can create a group
- [ ] Can scan/add a book
- [ ] Book appears in the group

## Common Issues

### "Missing Supabase environment variables" error

**Solution:** Make sure `.env.local` exists in the project root with both `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` set.

### RLS policy errors when trying to access data

**Solution:** Verify that:

1. You're logged in (check browser console for auth errors)
2. RLS policies were created correctly (check Supabase dashboard → Database → Policies)
3. The migration ran successfully

### Local Supabase won't start

**Solution:**

- Make sure Docker Desktop is running
- Check that ports 54321, 54322, 54323 are not in use
- Try `supabase stop` then `supabase start` again
- Check Docker logs if services fail

## Detailed Documentation

For more comprehensive guides, see:

- **`SUPABASE_SETUP_CHECKLIST.md`** - Complete setup checklist (local and cloud)
- **`SUPABASE_DASHBOARD_CONFIG.md`** - Dashboard configuration for production
- **`SUPABASE_MIGRATION_PLAN.md`** - Architecture and migration details
- **`SUPABASE_EXAMPLE.md`** - Code examples and patterns

## GitHub Pages Deployment

Since this is a static site on GitHub Pages, you need to configure secrets in GitHub Actions.

### Repository Secrets vs Environment Secrets

**Use Repository Secrets** (recommended for this setup):

- Simpler for a single static site
- Secrets are available to all workflows in the repository
- Perfect for GitHub Pages deployments

**Use Environment Secrets** only if:

- You have multiple environments (dev, staging, prod)
- You need different secrets per environment
- You want additional approval requirements

### Setting Up Repository Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these two secrets:

   **Secret 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)

   **Secret 2:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: Your Supabase anon key (from Supabase dashboard → Settings → API)

### Updating the GitHub Actions Workflow

The workflow file (`.github/workflows/deploy.yml`) needs to pass these secrets as environment
variables during the build. Update the build step:

```yaml
- name: Build
  run: npm run build
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

**Note:** The workflow file should already be updated to include this. If not, add the `env:`
section to the build step.

### Configure Supabase Site URL (IMPORTANT!)

**This must be done before users can sign up/login!** Otherwise email confirmation links will point
to localhost.

1. Go to your Supabase dashboard
2. Click **Authentication** → **URL Configuration** (in the left sidebar)
3. Set **Site URL** to your GitHub Pages URL:
   - Format: `https://yourusername.github.io/book-scanner/` (or your custom domain)
   - **Note:** Include the trailing slash and the `/book-scanner/` path if that's your basepath
4. Add **Redirect URLs**:
   - Add your GitHub Pages URL: `https://yourusername.github.io/book-scanner/**`
   - The `/**` wildcard allows all paths under your site
5. Click **Save**

**To find your GitHub Pages URL:**

- Go to your repository → Settings → Pages
- Your site URL is shown there (e.g., `https://username.github.io/repo-name/`)

### Complete Deployment Checklist

1. **Create Supabase Cloud project** (if not already done)
   - Go to https://supabase.com
   - Create a new project
   - Wait for provisioning (~2 minutes)

2. **Run the database migration**
   - Go to Supabase dashboard → SQL Editor (left sidebar)
   - Click **New query**
   - Copy contents of `supabase/migrations/20240101000000_create_books_and_groups.sql`
   - Paste and click **Run** (or Cmd/Ctrl + Enter)

3. **Configure Site URL** (CRITICAL - see section above)
   - Authentication → URL Configuration
   - Set Site URL to your GitHub Pages URL
   - Add redirect URLs

4. **Get your Supabase credentials**
   - Go to Settings → API
   - Copy the **Project URL** and **anon public** key

5. **Add GitHub repository secrets**
   - Repository → Settings → Secrets and variables → Actions
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

6. **Verify workflow is updated**
   - Check `.github/workflows/deploy.yml` includes the `env:` section in the build step

7. **Deploy**
   - Push to `main` branch (triggers automatic deployment)
   - Or manually trigger via Actions tab → Deploy workflow → Run workflow

8. **Review `SUPABASE_DASHBOARD_CONFIG.md`** for additional production settings:
   - Email configuration
   - Authentication settings
   - Security policies
   - Rate limiting

## Next Steps

After successful setup:

- Create your first user account
- Test scanning and adding books
- Verify data persists after page refresh
- Check that data is isolated per user (create a second test account)
