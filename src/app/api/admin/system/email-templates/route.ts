import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || '';
    const active_only = searchParams.get('active_only') === 'true';

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

    // Build the query for system email templates
    let query = supabase
      .from('system_email_templates')
      .select(`
        id,
        name,
        type,
        subject,
        content,
        variables,
        is_active,
        is_system,
        usage_count,
        created_by,
        created_at,
        updated_at
      `);

    // Apply filters
    if (active_only) {
      query = query.eq('is_active', true);
    }
    
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    // Order by type and name
    const { data: templates, error } = await query
      .order('type', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching email templates:', error);
      return NextResponse.json({ error: 'Failed to fetch email templates' }, { status: 500 });
    }

    return NextResponse.json({ templates: templates || [] });

  } catch (error) {
    console.error('Error in email templates API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      type,
      subject,
      content,
      variables = [],
      is_active = true
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

    // Validate input
    if (!name || !type || !subject || !content) {
      return NextResponse.json({ 
        error: 'Name, type, subject, and content are required' 
      }, { status: 400 });
    }

    const validTypes = [
      'order_confirmation',
      'order_shipped',
      'order_delivered',
      'password_reset',
      'account_welcome',
      'membership_welcome',
      'membership_reminder',
      'low_stock_alert',
      'payment_success',
      'payment_failed',
      'marketing',
      'custom'
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid template type' }, { status: 400 });
    }

    // Create the template
    const { data: template, error: templateError } = await supabase
      .from('system_email_templates')
      .insert({
        name,
        type,
        subject,
        content,
        variables: JSON.stringify(variables),
        is_active,
        is_system: false,
        usage_count: 0,
        created_by: user.id
      })
      .select()
      .single();

    if (templateError) {
      console.error('Error creating email template:', templateError);
      return NextResponse.json({ error: 'Failed to create email template' }, { status: 500 });
    }

    // Log admin activity
    await supabase.rpc('log_admin_activity', {
      action: 'create_email_template',
      resource_type: 'email_template',
      resource_id: template.id,
      details: { template_name: name, template_type: type }
    });

    return NextResponse.json({ template });

  } catch (error) {
    console.error('Error in create email template API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
