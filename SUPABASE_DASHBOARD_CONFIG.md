# Supabase Dashboard Configuration Checklist

When deploying to Supabase Cloud, configure these settings in the dashboard:

## 🔐 Authentication Settings

### Password Requirements

- [ ] **Authentication → Settings → Password Requirements**
  - Set minimum password length (you have 12 in config)
  - Set password complexity (you have `lower_upper_letters_digits_symbols` in config)
  - These should match your `supabase/config.toml` settings

### Email Settings

- [ ] **Authentication → Settings → Email Templates**
  - Configure SMTP server (for production emails)
  - Or use Supabase's default email service (limited: ~3-4 emails/hour per user, daily limits, lower
    deliverability, no custom domain)
  - Set sender email and name
  - Customize email templates if needed

### Email Confirmations

- [ ] **Authentication → Settings → Email**
  - **Enable email confirmations** (recommended for production)
    - Users must verify email before signing in
    - Prevents fake accounts
  - Configure email change confirmations
  - Set OTP expiry time

### Site URL & Redirects

- [ ] **Authentication → URL Configuration**
  - Set **Site URL** to your production domain (e.g., `https://yourdomain.com`)
  - Add **Redirect URLs** for OAuth callbacks
  - Add any additional allowed redirect URLs

### Security Settings

- [ ] **Authentication → Settings → Security**
  - Enable/disable signups (if you want invite-only)
  - Configure JWT expiry (default 1 hour)
  - Enable refresh token rotation (you have this enabled)
  - Set secure password change requirements

## 🗄️ Database Settings

### Row Level Security (RLS)

- [ ] **Database → Policies**
  - Verify RLS is enabled on `groups` table
  - Verify RLS is enabled on `books` table
  - Review all policies to ensure they're correct
  - Test policies with different user accounts

### Database Migrations

- [ ] **Database → Migrations**
  - Push your local migrations to cloud
  - Or run SQL manually in SQL Editor
  - Verify all tables exist: `groups`, `books`
  - Verify indexes are created

### Database Backups

- [ ] **Database → Backups**
  - Enable automatic backups (if on paid plan)
  - Configure backup schedule
  - Set up point-in-time recovery if needed

## 🔒 Security & Access

### API Keys

- [ ] **Project Settings → API**
  - Copy your production `anon` key (for client)
  - Copy your `service_role` key (keep secret! Server-side only)
  - Regenerate keys if compromised
  - Set up API key restrictions if needed

### Network Restrictions

- [ ] **Database → Network Restrictions** (optional)
  - Restrict database access to specific IPs
  - Useful for additional security layer

### SSL Enforcement

- [ ] **Database → Connection Pooling**
  - Ensure SSL is enforced for database connections
  - Verify connection strings use SSL

## 📧 Email Configuration (Production)

### SMTP Setup (Required for Production)

- [ ] **Authentication → Settings → SMTP**
  - Configure production SMTP server:
    - SendGrid, Mailgun, AWS SES, etc.
  - Enter SMTP host, port, username, password
  - Test email sending
  - Set admin email and sender name

### Email Templates

- [ ] **Authentication → Email Templates**
  - Customize signup confirmation email
  - Customize password reset email
  - Customize magic link email
  - Add your branding/logo

## 🚀 Performance & Limits

### Connection Pooling

- [ ] **Database → Connection Pooling**
  - Enable connection pooling (recommended)
  - Configure pooler mode (transaction/session)
  - Set connection limits

### Rate Limiting

- [ ] **Authentication → Rate Limits**
  - Review default rate limits
  - Adjust if needed for your use case
  - Monitor for abuse

## 🔍 Monitoring & Logs

### Logs

- [ ] **Logs → API Logs**
  - Monitor API requests
  - Check for errors
  - Set up alerts if needed

### Database Logs

- [ ] **Logs → Database Logs**
  - Monitor slow queries
  - Check for connection issues
  - Review query performance

## 🌐 OAuth Providers (Optional)

If you want social login:

- [ ] **Authentication → Providers**
  - Configure Google OAuth
  - Configure GitHub OAuth
  - Configure other providers as needed
  - Set redirect URLs for each provider

## 📊 Storage (If Needed Later)

- [ ] **Storage → Buckets**
  - Create storage buckets if needed
  - Set bucket policies
  - Configure CORS if needed

## ✅ Post-Deployment Checklist

- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test password reset
- [ ] Verify email confirmations work
- [ ] Test RLS policies with different users
- [ ] Verify data isolation between users
- [ ] Check API logs for errors
- [ ] Monitor database performance
- [ ] Set up error alerts/notifications

## 🔄 Sync Local Config to Cloud

Many settings in `supabase/config.toml` can be synced:

- Password requirements
- JWT expiry
- Rate limits
- Email settings

Make sure your cloud dashboard settings match your local config for consistency.
