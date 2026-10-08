# First admin bootstrap (owner operation)

The app does not create admin accounts or offer public signup. Only a Supabase Auth user **also** present in `public.admin_members` may read admin data or mutate it. Do not insert unverified browser IDs or put a service-role key in this app.

1. In your Supabase project, obtain **Project URL** and **publishable key** under **Project Settings → API / Connect**. Set `NEXT_PUBLIC_SUPABASE_URL` (PUBLIC URL) and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (PUBLIC, publishable key only) in the deployment environment. Do **not** use a `service_role` or secret key here. Set `DATABASE_URL` (SECRET, server-only, Supabase Dashboard → Connect) for the app and `DIRECT_URL` (SECRET, direct DB connection if using a pooler) for migrations. Never commit `.env.local`. Set public variables **before building** Next.js (they are build-time inlined), and rebuild/redeploy if the project URL or publishable key changes.
2. In **Authentication → Users**, create/invite the owner's Auth user using an email the owner controls; ensure the account can sign in with email/password and its email is confirmed. Configure appropriate email confirmation and disable self-service signup in the project's Auth settings if it is not needed; the app has no signup form. Do not share the password with the agent. Use a strong unique password and enable project security controls/MFA where supported.
3. Apply migrations with `npm run db:migrate` using the correct project `DIRECT_URL`/`DATABASE_URL` before granting membership. Backup the live database first. Check that `public.admin_members` exists and has row-level security enabled with no client policies; its grants to `anon` and `authenticated` are revoked by migration `0002`.
4. In the **Supabase SQL Editor** (owner project, privileged SQL only), replace `owner@example.com` below with the exact owner's email and execute. It verifies a unique existing confirmed Auth identity and is safe to repeat. **Do not** make this SQL a public endpoint or give arbitrary authenticated users table write access.

```sql
DO $$
DECLARE member_id uuid;
BEGIN
  SELECT id INTO STRICT member_id FROM auth.users
  WHERE lower(email) = lower('owner@example.com') AND email_confirmed_at IS NOT NULL;
  INSERT INTO public.admin_members (user_id) VALUES (member_id)
  ON CONFLICT (user_id) DO NOTHING;
EXCEPTION WHEN NO_DATA_FOUND THEN
  RAISE EXCEPTION 'No confirmed Auth user found for this exact email';
WHEN TOO_MANY_ROWS THEN
  RAISE EXCEPTION 'Multiple Auth users match this email';
END $$;
```

5. Confirm one matching row with `SELECT user_id, created_at FROM public.admin_members WHERE user_id = (SELECT id FROM auth.users WHERE lower(email) = lower('owner@example.com'));`. Log in at `/admin/login`, verify `/admin` loads; in a private browser without a session, `/admin` must redirect to login. A signed-in *nonmember* must not see the admin page. Verify logout and that revoking membership immediately denies access to subsequent requests. Do not post passwords or database URLs in issue/chat logs.

To revoke an admin, run (privileged SQL Editor) `DELETE FROM public.admin_members WHERE user_id = '<verified-user-uuid>';` and optionally revoke/sign out the Auth user in **Authentication → Users**. Access checks re-read membership for each privileged operation; a layout alone is never a security boundary. Future admin reads and mutations (goals 06/07) must call `requireAdmin()` inside their own server handler/function. Use `getUser()` for current Auth identity and never trust `getSession()`'s user directly. Keep `/admin` and Auth refresh responses uncacheable in reverse proxies/CDNs.
