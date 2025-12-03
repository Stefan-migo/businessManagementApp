import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/utils/supabase/server';
import { EmailNotificationService } from '@/lib/email/notifications';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Admin Orders PATCH called for order:', params.id);
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

    const body = await request.json();
    const { status, payment_status, tracking_number, carrier } = body;

    console.log('📝 Updating order with:', { status, payment_status, tracking_number, carrier });

    // Get current order to check status changes
    const { data: currentOrder } = await supabase
      .from('orders')
      .select('status, shipped_at, delivered_at')
      .eq('id', params.id)
      .single();

    // Build update object dynamically to only update provided fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (status !== undefined) {
      updateData.status = status;
      
      // Set timestamps for status changes
      if (status === 'shipped' && !currentOrder?.shipped_at) {
        updateData.shipped_at = new Date().toISOString();
      }
      if (status === 'delivered' && !currentOrder?.delivered_at) {
        updateData.delivered_at = new Date().toISOString();
      }
    }

    if (payment_status !== undefined) {
      updateData.payment_status = payment_status;
    }

    if (tracking_number !== undefined) {
      updateData.tracking_number = tracking_number;
    }

    if (carrier !== undefined) {
      updateData.carrier = carrier;
    }

    // Update the order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        order_items (
          id,
          product_name,
          variant_title,
          quantity,
          unit_price,
          total_price
        )
      `)
      .single();

    if (updateError) {
      console.error('❌ Error updating order:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    console.log('✅ Order updated successfully');

    // Send email notifications based on status changes
    if (status && status !== currentOrder?.status) {
      try {
        const supabaseAdmin = createServiceRoleClient();
        
        // Get full order details for email
        const { data: fullOrder } = await supabaseAdmin
          .from('orders')
          .select(`
            *,
            order_items (
              id,
              product_name,
              variant_title,
              quantity,
              unit_price,
              total_price
            ),
            profiles (
              full_name,
              email
            )
          `)
          .eq('id', params.id)
          .single();

        if (fullOrder) {
          // Prepare order data for email service
          const emailOrder = {
            id: fullOrder.id,
            order_number: fullOrder.order_number,
            user_email: fullOrder.email,
            email: fullOrder.email,
            customer_name: fullOrder.shipping_first_name && fullOrder.shipping_last_name
              ? `${fullOrder.shipping_first_name} ${fullOrder.shipping_last_name}`
              : fullOrder.profiles?.full_name || 'Cliente',
            items: fullOrder.order_items?.map((item: any) => ({
              id: item.id,
              name: item.product_name,
              quantity: item.quantity,
              price: item.unit_price,
              variant_title: item.variant_title
            })) || [],
            total_amount: fullOrder.total_amount,
            payment_method: fullOrder.mp_payment_method || 'MercadoPago',
            status: fullOrder.status,
            created_at: fullOrder.created_at,
            payment_id: fullOrder.mp_payment_id,
            tracking_number: fullOrder.tracking_number,
            carrier: fullOrder.carrier,
            shipped_at: fullOrder.shipped_at,
            delivered_at: fullOrder.delivered_at,
            profiles: fullOrder.profiles
          };

          // Send appropriate email based on status
          if (status === 'shipped') {
            await EmailNotificationService.sendShippingNotification(emailOrder);
            console.log('📧 Shipping notification email sent');
          } else if (status === 'delivered') {
            await EmailNotificationService.sendDeliveryConfirmation(emailOrder);
            console.log('📧 Delivery confirmation email sent');
          }
        }
      } catch (emailError) {
        console.error('⚠️ Error sending status change email (non-critical):', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder
    });

  } catch (error) {
    console.error('❌ Admin order update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Admin Orders GET single order:', params.id);
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

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_name,
          variant_title,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq('id', params.id)
      .single();

    if (orderError) {
      console.error('❌ Error fetching order:', orderError);
      return NextResponse.json(
        { error: 'Failed to fetch order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('❌ Admin order fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🗑️ Admin Orders DELETE called for order:', params.id);
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

    // First, delete all order items for this order
    console.log('🗑️ Deleting order items for order:', params.id);
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', params.id);

    if (itemsError) {
      console.error('❌ Error deleting order items:', itemsError);
      return NextResponse.json(
        { error: 'Failed to delete order items', details: itemsError.message },
        { status: 500 }
      );
    }

    // Then, delete the order
    console.log('🗑️ Deleting order:', params.id);
    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', params.id);

    if (orderError) {
      console.error('❌ Error deleting order:', orderError);
      return NextResponse.json(
        { error: 'Failed to delete order', details: orderError.message },
        { status: 500 }
      );
    }

    console.log('✅ Order deleted successfully:', params.id);
    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    });

  } catch (error) {
    console.error('❌ Admin order delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}