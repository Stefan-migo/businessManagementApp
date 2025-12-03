import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        customers: []
      });
    }

    // Search customers by email or name
    const { data: profiles, error: searchError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, phone, created_at')
      .or(`email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
      .limit(limit);

    if (searchError) {
      console.error('❌ Error searching customers:', searchError);
      return NextResponse.json(
        { error: 'Failed to search customers' },
        { status: 500 }
      );
    }

    // Get customer orders history for each profile
    const customersWithOrders = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: orders } = await supabase
          .from('orders')
          .select('id, order_number, total_amount, shipping_address_1, shipping_city, shipping_state, shipping_postal_code, shipping_phone')
          .eq('email', profile.email)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastOrder = orders && orders.length > 0 ? orders[0] : null;
        const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Cliente';

        return {
          id: profile.id,
          email: profile.email,
          name: fullName,
          phone: profile.phone,
          created_at: profile.created_at,
          last_order: lastOrder,
          shipping_info: lastOrder ? {
            address_1: lastOrder.shipping_address_1,
            city: lastOrder.shipping_city,
            state: lastOrder.shipping_state,
            postal_code: lastOrder.shipping_postal_code,
            phone: lastOrder.shipping_phone
          } : null
        };
      })
    );

    return NextResponse.json({
      success: true,
      customers: customersWithOrders
    });

  } catch (error) {
    console.error('❌ Customer search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

