# Supabase Migration Plan

## Overview

This document outlines the migration from localStorage to Supabase, including database schema,
authentication, and future eBay/Amazon listing integration.

## Supabase Architecture

### What Supabase Provides

1. **PostgreSQL Database** - Full SQL database with real-time subscriptions
2. **Authentication** - Built-in auth (email, OAuth, magic links)
3. **Row Level Security (RLS)** - Database-level security policies
4. **Edge Functions** - Serverless TypeScript/JavaScript functions (like AWS Lambda)
5. **Storage** - File storage (for images, PDFs, etc.)
6. **Realtime** - WebSocket subscriptions for live updates

### How It Works

- **Client SDK**: Your React app uses `@supabase/supabase-js` to interact with the database
- **Direct Database Access**: You write SQL queries through the SDK (no REST endpoints needed)
- **Edge Functions**: For server-side operations (eBay/Amazon APIs, webhooks, background jobs)
- **No Server Management**: Everything is hosted by Supabase

## Database Schema

```sql
-- Users table (handled by Supabase Auth, but we can extend with profiles)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups table
CREATE TABLE groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Books table
CREATE TABLE books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  isbn TEXT NOT NULL,
  title TEXT NOT NULL,
  authors TEXT[] DEFAULT '{}',
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, isbn, group_id) -- Prevent duplicate ISBNs in same group
);

-- Listing status table (for future eBay/Amazon integration)
CREATE TABLE listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ebay', 'amazon')),
  listing_id TEXT, -- External listing ID from platform
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'sold', 'ended')),
  price DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_books_group_id ON books(group_id);
CREATE INDEX idx_groups_user_id ON groups(user_id);
CREATE INDEX idx_listings_book_id ON listings(book_id);
```

## Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Groups: Users can only see/edit their own groups
CREATE POLICY "Users can view own groups" ON groups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own groups" ON groups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own groups" ON groups
  FOR DELETE USING (auth.uid() = user_id);

-- Books: Users can only see/edit their own books
CREATE POLICY "Users can view own books" ON books
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own books" ON books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own books" ON books
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own books" ON books
  FOR DELETE USING (auth.uid() = user_id);

-- Listings: Users can only see/edit listings for their own books
CREATE POLICY "Users can view own listings" ON listings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = listings.book_id
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own listings" ON listings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = listings.book_id
      AND books.user_id = auth.uid()
    )
  );
```

## Migration Steps

### Phase 1: Setup Supabase

1. Create Supabase project at https://supabase.com
2. Install dependencies: `npm install @supabase/supabase-js`
3. Create Supabase client utility
4. Set up environment variables

### Phase 2: Database Setup

1. Run SQL schema migrations in Supabase SQL Editor
2. Set up RLS policies
3. Test database access

### Phase 3: Authentication

1. Add auth UI (login/signup)
2. Protect routes
3. Add user context provider

### Phase 4: Data Migration

1. Create hooks for Supabase operations
2. Replace localStorage with Supabase queries
3. Add real-time subscriptions (optional)
4. Migrate existing localStorage data (one-time script)

### Phase 5: Future - eBay/Amazon Integration

1. Create Edge Functions for API calls
2. Store API credentials securely
3. Add listing management UI

## Edge Functions for eBay/Amazon Listing

### Example: Supabase Edge Function Structure

```
supabase/
  functions/
    create-ebay-listing/
      index.ts
    create-amazon-listing/
      index.ts
    sync-listings/
      index.ts
```

### Example Edge Function: `create-ebay-listing/index.ts`

```typescript
import {serve} from 'https://deno.land/std@0.168.0/http/server.ts';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders});
  }

  try {
    // Get authenticated user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {Authorization: req.headers.get('Authorization')!},
        },
      }
    );

    const {
      data: {user},
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({error: 'Unauthorized'}), {
        status: 401,
        headers: {...corsHeaders, 'Content-Type': 'application/json'},
      });
    }

    // Get request body
    const {bookId, price, condition} = await req.json();

    // Fetch book from database
    const {data: book, error: bookError} = await supabaseClient
      .from('books')
      .select('*')
      .eq('id', bookId)
      .eq('user_id', user.id)
      .single();

    if (bookError || !book) {
      return new Response(JSON.stringify({error: 'Book not found'}), {
        status: 404,
        headers: {...corsHeaders, 'Content-Type': 'application/json'},
      });
    }

    // Call eBay API (using credentials stored in environment or user's encrypted storage)
    const ebayApiKey = Deno.env.get('EBAY_API_KEY');
    const ebayResponse = await fetch('https://api.ebay.com/sell/inventory/v1/offer', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ebayApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // eBay listing payload
        title: book.title,
        // ... other fields
      }),
    });

    const listingData = await ebayResponse.json();

    // Save listing to database
    const {data: listing, error: listingError} = await supabaseClient
      .from('listings')
      .insert({
        book_id: bookId,
        platform: 'ebay',
        listing_id: listingData.listingId,
        status: 'active',
        price: price,
      })
      .select()
      .single();

    if (listingError) {
      return new Response(JSON.stringify({error: listingError.message}), {
        status: 500,
        headers: {...corsHeaders, 'Content-Type': 'application/json'},
      });
    }

    return new Response(JSON.stringify({success: true, listing}), {
      status: 200,
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    });
  } catch (error) {
    return new Response(JSON.stringify({error: error.message}), {
      status: 500,
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    });
  }
});
```

### Calling Edge Functions from React

```typescript
// In your React component
const createEbayListing = async (bookId: string, price: number) => {
  const {data, error} = await supabase.functions.invoke('create-ebay-listing', {
    body: {bookId, price, condition: 'used'},
  });

  if (error) {
    console.error('Error creating listing:', error);
    return;
  }

  console.log('Listing created:', data);
};
```

## Key Benefits of This Architecture

1. **Security**: API keys never exposed to client
2. **Scalability**: Edge Functions auto-scale
3. **No Server Management**: Supabase handles infrastructure
4. **Real-time**: Can subscribe to database changes
5. **Type Safety**: Can generate TypeScript types from schema
6. **Cost Effective**: Pay only for what you use

## Environment Variables

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For Edge Functions (set in Supabase dashboard):

```
EBAY_API_KEY=your-ebay-key
AMAZON_ACCESS_KEY=your-amazon-key
AMAZON_SECRET_KEY=your-amazon-secret
```

## Next Steps

1. Review this plan
2. Set up Supabase project
3. Start with Phase 1 (basic setup)
4. Gradually migrate features
5. Add Edge Functions when ready for eBay/Amazon integration
