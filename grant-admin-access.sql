-- Grant admin access to stefan.migo@gmail.com
-- This script will:
-- 1. Find the user by email
-- 2. Add them to admin_users table
-- 3. Update their profile membership_tier to 'admin'

DO $$
DECLARE
  user_id uuid;
  user_email text := 'stefan.migo@gmail.com';
BEGIN
  -- Find user by email
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  RAISE NOTICE 'Found user: % (ID: %)', user_email, user_id;

  -- Update profile membership_tier to 'admin' if it exists
  UPDATE public.profiles
  SET 
    membership_tier = 'admin',
    updated_at = now()
  WHERE id = user_id;

  IF NOT FOUND THEN
    -- Create profile if it doesn't exist
    INSERT INTO public.profiles (id, email, membership_tier, created_at, updated_at)
    VALUES (user_id, user_email, 'admin', now(), now())
    ON CONFLICT (id) DO UPDATE SET membership_tier = 'admin', updated_at = now();
    
    RAISE NOTICE 'Profile created/updated with admin tier';
  ELSE
    RAISE NOTICE 'Profile updated with admin tier';
  END IF;

  -- Add to admin_users table (or update if exists)
  INSERT INTO public.admin_users (id, email, role, is_active, created_at, updated_at)
  VALUES (user_id, user_email, 'admin', true, now(), now())
  ON CONFLICT (id) DO UPDATE SET 
    role = 'admin',
    is_active = true,
    updated_at = now();

  RAISE NOTICE '✅ Admin access granted successfully!';
  RAISE NOTICE 'Email: %', user_email;
  RAISE NOTICE 'User ID: %', user_id;
  RAISE NOTICE '';
  RAISE NOTICE 'The user can now access the admin panel at /admin';

END $$;

-- Verify the admin access was granted
SELECT 
  au.id,
  au.email,
  au.role,
  au.is_active,
  p.membership_tier,
  au.created_at
FROM public.admin_users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'stefan.migo@gmail.com';

