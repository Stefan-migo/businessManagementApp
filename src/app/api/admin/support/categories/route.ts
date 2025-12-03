import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Support Categories API GET called');
    const supabase = await createClient();
    
    // Check admin authorization
    console.log('🔐 Checking user authentication...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ User authentication failed:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('✅ User authenticated:', user.email);

    console.log('🔒 Checking admin privileges...');
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', { user_id: user.id });
    if (adminError) {
      console.error('❌ Admin check error:', adminError);
      return NextResponse.json({ error: 'Admin verification failed' }, { status: 500 });
    }
    if (!isAdmin) {
      console.log('❌ User is not admin:', user.email);
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    console.log('✅ Admin access confirmed for:', user.email);

    // Get all support categories from database
    console.log('🗄️ Fetching support categories from database...');
    
    const { data: categories, error: fetchError } = await supabase
      .from('support_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching categories:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch categories',
        details: fetchError.message 
      }, { status: 500 });
    }

    // If no categories exist, return empty array
    if (!categories || categories.length === 0) {
      console.log('⚠️ No categories found in database');
      return NextResponse.json({ 
        categories: [],
        message: 'No categories found. Please create some categories first.' 
      });
    }
    
    console.log('✅ Support categories fetched:', categories.length);
    return NextResponse.json({ categories });

  } catch (error) {
    console.error('Error in support categories API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      sort_order = 0
    } = body;

    const supabase = await createClient();
    
    // Check admin authorization
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: isAdmin } = await supabase.rpc('is_admin', { user_id: user.id });
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Create the category
    const { data: category, error: categoryError } = await supabase
      .from('support_categories')
      .insert({
        name,
        description,
        sort_order,
        is_active: true
      })
      .select()
      .single();

    if (categoryError) {
      console.error('Error creating support category:', categoryError);
      return NextResponse.json({ error: 'Failed to create support category' }, { status: 500 });
    }

    // Log admin activity
    await supabase.rpc('log_admin_activity', {
      action: 'create_support_category',
      resource_type: 'support_category',
      resource_id: category.id,
      details: { category_name: name }
    });

    return NextResponse.json({ category });

  } catch (error) {
    console.error('Error in create support category API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
