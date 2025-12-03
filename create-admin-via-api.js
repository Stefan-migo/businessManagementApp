// Create admin user via Supabase Auth API
// This ensures the password is hashed correctly for Supabase Auth

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  const email = 'admin@test.com';
  const password = 'Admin123!';

  try {
    // Create user via Auth API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: 'Admin',
        last_name: 'User'
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    if (!authData.user) {
      console.error('No user returned from auth');
      return;
    }

    const userId = authData.user.id;
    console.log('✅ Auth user created:', userId);

    // Wait a moment for profile to be created by trigger
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update profile membership_tier to 'admin'
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ membership_tier: 'admin' })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    } else {
      console.log('✅ Profile updated with admin tier');
    }

    // Create admin_users entry
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert({
        id: userId,
        email: email,
        role: 'admin',
        is_active: true
      });

    if (adminError) {
      console.error('Error creating admin_users entry:', adminError);
    } else {
      console.log('✅ Admin user entry created');
    }

    console.log('\n🎉 Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', userId);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAdminUser();

