import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Admin Reviews Reject called for review:', params.id);
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

    // Reject the review (set is_approved to false)
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update({
        is_approved: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error rejecting review:', updateError);
      return NextResponse.json(
        { error: 'Failed to reject review' },
        { status: 500 }
      );
    }

    console.log('✅ Review rejected successfully');

    return NextResponse.json({
      success: true,
      review: updatedReview
    });

  } catch (error) {
    console.error('❌ Admin review rejection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
