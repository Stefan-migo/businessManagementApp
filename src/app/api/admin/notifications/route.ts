import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔔 Admin Notifications API GET called');
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

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const unreadOnly = url.searchParams.get('unread_only') === 'true';
    const type = url.searchParams.get('type');

    // Build query
    let query = supabase
      .from('admin_notifications')
      .select('*', { count: 'exact' })
      .or(`target_admin_id.eq.${user.id},target_admin_id.is.null`)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      console.error('❌ Error fetching notifications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    // Get unread count
    const { data: unreadCount } = await supabase
      .rpc('get_unread_notification_count', { admin_user_id: user.id });

    return NextResponse.json({
      notifications: notifications || [],
      count: count || 0,
      unreadCount: unreadCount || 0
    });

  } catch (error) {
    console.error('❌ Error in notifications API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
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

    const { notificationId, markAllRead } = await request.json();

    if (markAllRead) {
      // Mark all notifications as read
      await supabase.rpc('mark_all_notifications_read');
      
      return NextResponse.json({ 
        success: true,
        message: 'All notifications marked as read' 
      });
    }

    if (notificationId) {
      // Mark specific notification as read
      await supabase.rpc('mark_notification_read', { 
        notification_id: notificationId 
      });
      
      return NextResponse.json({ 
        success: true,
        message: 'Notification marked as read' 
      });
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Error updating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

