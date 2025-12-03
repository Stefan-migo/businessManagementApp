import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({
        authenticated: false,
        error: 'Not authenticated'
      });
    }

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', {
      user_id: user.id
    });

    // Get admin role
    const { data: adminRole, error: roleError } = await supabase.rpc('get_admin_role', {
      user_id: user.id
    });

    // Check admin_users table directly
    const { data: adminRecord, error: adminRecordError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', user.id)
      .single();

    // Test products query
    const { data: products, count, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .limit(5);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
      },
      adminCheck: {
        isAdmin: isAdmin,
        adminError: adminError?.message,
        role: adminRole,
        roleError: roleError?.message,
        adminRecord: adminRecord,
        adminRecordError: adminRecordError?.message,
      },
      productsTest: {
        count: count,
        productsReturned: products?.length,
        error: productsError?.message,
        firstProduct: products?.[0],
      }
    });

  } catch (error) {
    console.error('Check status error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

