-- Fix membership_tier default value and trigger function
-- The constraint was changed to exclude 'none', but the default and trigger still use 'none'

-- First, update the default value for membership_tier column
ALTER TABLE public.profiles 
  ALTER COLUMN membership_tier SET DEFAULT 'basic';

-- Update any existing profiles with 'none' to 'basic'
UPDATE public.profiles 
SET membership_tier = 'basic' 
WHERE membership_tier = 'none' OR membership_tier IS NULL;

-- Update the handle_new_user() function to explicitly set membership_tier to 'basic'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, membership_tier)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    'basic'  -- Explicitly set to 'basic' to satisfy the constraint
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

