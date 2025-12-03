-- Create admin user script
-- This will create a user and add them to admin_users table

DO $$
DECLARE
  user_id uuid;
  user_email text := 'admin@test.com';
  user_password text := 'Admin123!';
  profile_exists boolean;
BEGIN
  -- Create auth user (trigger will try to create profile, but may fail due to constraint)
  BEGIN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    )
    VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      user_email,
      crypt(user_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      'authenticated'
    )
    RETURNING id INTO user_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error creating user: %', SQLERRM;
      RAISE;
  END;

  -- Check if profile was created by trigger
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = user_id) INTO profile_exists;
  
  -- Create or update profile with valid membership_tier
  -- Valid values: 'basic', 'premium', 'vip', 'admin'
  IF profile_exists THEN
    -- Update existing profile (trigger created it with invalid tier)
    UPDATE public.profiles 
    SET membership_tier = 'admin', updated_at = now()
    WHERE id = user_id;
  ELSE
    -- Create profile manually if trigger failed
    INSERT INTO public.profiles (id, email, membership_tier, created_at, updated_at)
    VALUES (user_id, user_email, 'admin', now(), now());
  END IF;

  -- Create admin entry (role must be 'admin' after simplification migration)
  INSERT INTO public.admin_users (id, email, role, is_active, created_at)
  VALUES (user_id, user_email, 'admin', true, now())
  ON CONFLICT (id) DO UPDATE SET role = 'admin', is_active = true;

  RAISE NOTICE 'Admin user created successfully!';
  RAISE NOTICE 'Email: %', user_email;
  RAISE NOTICE 'Password: %', user_password;
  RAISE NOTICE 'User ID: %', user_id;
END $$;

