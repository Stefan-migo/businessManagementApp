import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all active admin users
    const { data: adminUsers, error: fetchError } = await supabase
      .from('admin_users')
      .select('id, email, role, is_active')
      .eq('is_active', true)
      .order('email', { ascending: true });

    if (fetchError) {
      console.error('Error fetching admin users:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch admin users',
        details: fetchError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      users: adminUsers || [],
      count: adminUsers?.length || 0
    });

  } catch (error) {
    console.error('Error in admin users GET API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

