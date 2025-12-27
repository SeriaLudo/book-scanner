# Supabase Authentication Setup Checklist

## Option 1: Local Development (Supabase CLI)

### Prerequisites

- [ ] Install Docker Desktop (required for local Supabase)
- [ ] Install Supabase CLI: `npm install -g supabase` or `brew install supabase/tap/supabase`
- [ ] Verify installation: `supabase --version`

### Local Supabase Setup

- [ ] Initialize Supabase in project: `supabase init`
- [ ] Start local Supabase: `supabase start`
  - This will give you:
    - Local database URL
    - Local anon key
    - Local service role key
    - Local API URL (usually `http://localhost:54321`)
- [ ] Copy the `.env.local` file that Supabase generates (or create one)
- [ ] Note the local credentials from `supabase start` output

### Database Setup (Local)

- [ ] Open Supabase Studio: Run `npx supabase status` and open the Studio URL shown (usually
      `http://127.0.0.1:54323`)
- [ ] Run SQL migrations in SQL Editor:
  - [ ] Create `profiles` table (if needed)
  - [ ] Create `groups` table
  - [ ] Create `books` table
  - [ ] Create `listings` table (for future eBay/Amazon integration)
  - [ ] Set up Row Level Security (RLS) policies
  - [ ] Create indexes for performance

### Application Setup

- [ ] Install Supabase client: `npm install @supabase/supabase-js`
- [ ] Create `.env.local` file with:
  ```
  VITE_SUPABASE_URL=http://localhost:54321
  VITE_SUPABASE_ANON_KEY=<your-local-anon-key>
  ```
- [ ] Create `src/lib/supabase.ts` - Supabase client configuration
- [ ] Create `src/contexts/AuthContext.tsx` - Authentication context provider
- [ ] Create `src/components/Login.tsx` - Login/signup component
- [ ] Update `src/routes/__root.tsx` to wrap app with AuthProvider
- [ ] Update `src/components/ScannerInterface.tsx` to require authentication
- [ ] Test login/signup flow locally

### Testing Local Setup

- [ ] Create a test user account
- [ ] Verify authentication state persists
- [ ] Test protected routes
- [ ] Verify data is saved to local database

---

## Option 2: Cloud Development (Supabase Cloud)

### Supabase Cloud Setup

- [ ] Create account at https://supabase.com
- [ ] Create a new project
- [ ] Wait for project to finish provisioning (~2 minutes)
- [ ] Go to Project Settings → API
- [ ] Copy your project URL and anon key

### Database Setup (Cloud)

- [ ] Open SQL Editor in Supabase dashboard
- [ ] Run SQL migrations:
  - [ ] Create `profiles` table (if needed)
  - [ ] Create `groups` table
  - [ ] Create `books` table
  - [ ] Create `listings` table (for future eBay/Amazon integration)
  - [ ] Set up Row Level Security (RLS) policies
  - [ ] Create indexes for performance
- [ ] Go to Authentication → Settings
- [ ] Configure email settings (or use default)
- [ ] Enable email confirmations (optional, recommended for production)

### Application Setup

- [ ] Install Supabase client: `npm install @supabase/supabase-js`
- [ ] Create `.env.local` file with:
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=<your-anon-key>
  ```
- [ ] Add `.env.local` to `.gitignore` (if not already)
- [ ] Create `src/lib/supabase.ts` - Supabase client configuration
- [ ] Create `src/contexts/AuthContext.tsx` - Authentication context provider
- [ ] Create `src/components/Login.tsx` - Login/signup component
- [ ] Update `src/routes/__root.tsx` to wrap app with AuthProvider
- [ ] Update `src/components/ScannerInterface.tsx` to require authentication
- [ ] Test login/signup flow with cloud database

### Testing Cloud Setup

- [ ] Create a test user account
- [ ] Verify email confirmation (if enabled)
- [ ] Verify authentication state persists
- [ ] Test protected routes
- [ ] Verify data is saved to cloud database

---

## Common Implementation Steps (Both Options)

### 1. Install Dependencies

- [ ] `npm install @supabase/supabase-js`

### 2. Create Supabase Client

- [ ] Create `src/lib/supabase.ts`
- [ ] Export configured Supabase client
- [ ] Handle environment variables

### 3. Create Authentication Context

- [ ] Create `src/contexts/AuthContext.tsx`
- [ ] Implement `AuthProvider` component
- [ ] Implement `useAuth` hook
- [ ] Handle session state
- [ ] Implement `signIn`, `signUp`, `signOut` functions

### 4. Create Login Component

- [ ] Create `src/components/Login.tsx`
- [ ] Add email/password form
- [ ] Add sign up form
- [ ] Handle errors and loading states
- [ ] Add "Forgot password" link (optional)

### 5. Update App Structure

- [ ] Wrap app with `AuthProvider` in root route
- [ ] Add loading state while checking auth
- [ ] Show login screen if not authenticated
- [ ] Show main app if authenticated

### 6. Protect Routes

- [ ] Update `ScannerInterface` to check auth
- [ ] Redirect to login if not authenticated
- [ ] Add logout button to header

### 7. Update Data Layer (Future)

- [ ] Replace localStorage with Supabase queries
- [ ] Create hooks: `useGroups`, `useBooks`
- [ ] Update components to use new hooks
- [ ] Test data persistence

---

## Quick Start Commands

### Local Development

```bash
# Initialize Supabase
supabase init

# Start local Supabase (first time takes a few minutes)
supabase start

# Open Supabase Studio (check status for URL)
npx supabase status
# Then open the Studio URL in your browser (usually http://127.0.0.1:54323)

# Stop local Supabase
supabase stop

# Reset local database (if needed)
supabase db reset
```

### Cloud Development

```bash
# Link to cloud project (optional, for migrations)
supabase link --project-ref <your-project-ref>

# Push migrations to cloud (optional)
supabase db push
```

---

## Environment Variables Template

Create `.env.local`:

```env
# Local Development
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<from-supabase-start-output>

# OR Cloud Development
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=<from-supabase-dashboard>
```

---

## Troubleshooting

### Local Issues

- [ ] Docker Desktop is running
- [ ] Ports 54321, 54322, 54323 are not in use
- [ ] Check `supabase status` to see if services are running
- [ ] Check Docker logs if services fail to start

### Authentication Issues

- [ ] Verify environment variables are loaded (check browser console)
- [ ] Check Supabase dashboard → Authentication → Users
- [ ] Verify RLS policies are set correctly
- [ ] Check browser console for CORS errors

### Database Issues

- [ ] Verify tables exist in Supabase Studio
- [ ] Check RLS policies allow user access
- [ ] Verify foreign key relationships
- [ ] Check SQL Editor for errors

---

## Next Steps After Authentication

- [ ] Migrate localStorage data to Supabase
- [ ] Implement real-time subscriptions (optional)
- [ ] Add user profile management
- [ ] Add password reset functionality
- [ ] Add OAuth providers (Google, GitHub, etc.) if needed
