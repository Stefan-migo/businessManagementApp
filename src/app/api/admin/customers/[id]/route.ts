import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Customer Detail API GET called for ID:', params.id);
    
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

    // Get customer profile
    console.log('🗄️ Fetching customer profile...');
    const { data: customer, error: customerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', params.id)
      .single();

    if (customerError) {
      console.error('❌ Error fetching customer:', customerError);
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (!customer) {
      console.log('❌ Customer not found:', params.id);
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    console.log('✅ Customer found:', customer.email);

    // Get customer orders
    console.log('📦 Fetching customer orders...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products:product_id (
            id,
            name,
            featured_image
          )
        )
      `)
      .eq('user_id', params.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      // Continue without orders rather than failing
    }

    console.log('✅ Orders fetched:', orders?.length || 0);

    // Get customer memberships
    console.log('👑 Fetching customer memberships...');
    const { data: memberships, error: membershipsError } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', params.id)
      .order('created_at', { ascending: false });

    if (membershipsError) {
      console.error('❌ Error fetching memberships:', membershipsError);
      // Continue without memberships rather than failing
    }

    console.log('✅ Memberships fetched:', memberships?.length || 0);

    // Calculate analytics
    console.log('📊 Calculating customer analytics...');
    const totalSpent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const orderCount = orders?.length || 0;
    const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
    const lastOrderDate = orders?.[0]?.created_at || null;

    // Determine customer segment
    let segment = 'new';
    if (orderCount > 10) segment = 'vip';
    else if (orderCount > 3) segment = 'regular';
    else if (orderCount > 0) segment = 'first-time';

    // Order status counts
    const orderStatusCounts = orders?.reduce((acc: Record<string, number>, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Favorite products (most purchased)
    const productCounts = orders?.reduce((acc: Record<string, any>, order) => {
      order.order_items?.forEach((item: any) => {
        // Try both 'products' and 'product' for compatibility
        const product = item.products || item.product;
        if (product) {
          const productId = product.id;
          if (!acc[productId]) {
            acc[productId] = {
              product: product,
              quantity: 0,
              totalSpent: 0
            };
          }
          acc[productId].quantity += item.quantity;
          acc[productId].totalSpent += item.total_price;
        } else if (item.product_name) {
          // Fallback to using product_name if no product relation
          const productKey = `product_${item.product_id}`;
          if (!acc[productKey]) {
            acc[productKey] = {
              product: {
                id: item.product_id,
                name: item.product_name,
                featured_image: null
              },
              quantity: 0,
              totalSpent: 0
            };
          }
          acc[productKey].quantity += item.quantity;
          acc[productKey].totalSpent += item.total_price;
        }
      });
      return acc;
    }, {}) || {};

    const favoriteProducts = Object.values(productCounts)
      .sort((a: any, b: any) => b.quantity - a.quantity)
      .slice(0, 5);

    // Monthly spending (last 12 months)
    const monthlySpending = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthOrders = orders?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= month && orderDate < nextMonth;
      }) || [];

      const monthAmount = monthOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      
      monthlySpending.push({
        month: month.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }),
        amount: monthAmount,
        orders: monthOrders.length
      });
    }

    const analytics = {
      totalSpent,
      orderCount,
      lastOrderDate,
      avgOrderValue,
      segment,
      lifetimeValue: totalSpent,
      orderStatusCounts,
      favoriteProducts,
      monthlySpending
    };

    console.log('✅ Analytics calculated successfully');

    return NextResponse.json({
      customer: {
        ...customer,
        orders: orders || [],
        memberships: memberships || [],
        analytics
      }
    });

  } catch (error) {
    console.error('Error in customer detail API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Customer Update API PUT called for ID:', params.id);
    
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

    // Get request body
    const body = await request.json();
    console.log('📝 Update data received:', body);

    // Prepare update data
    const updateData = {
      first_name: body.first_name || null,
      last_name: body.last_name || null,
      phone: body.phone || null,
      address_line_1: body.address_line_1 || null,
      address_line_2: body.address_line_2 || null,
      city: body.city || null,
      state: body.state || null,
      postal_code: body.postal_code || null,
      country: body.country || 'Argentina',
      membership_tier: body.membership_tier || 'none',
      is_member: body.is_member || false,
      membership_start_date: body.membership_start_date ? new Date(body.membership_start_date).toISOString() : null,
      membership_end_date: body.membership_end_date ? new Date(body.membership_end_date).toISOString() : null,
      newsletter_subscribed: body.newsletter_subscribed || false,
      updated_at: new Date().toISOString()
    };

    console.log('🔄 Updating customer profile...');
    const { data: updatedCustomer, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating customer:', updateError);
      return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
    }

    if (!updatedCustomer) {
      console.log('❌ Customer not found for update:', params.id);
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    console.log('✅ Customer updated successfully:', updatedCustomer.email);

    return NextResponse.json({
      success: true,
      customer: updatedCustomer
    });

  } catch (error) {
    console.error('Error in customer update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}