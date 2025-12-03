import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Dashboard API called');
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

    // Fetch all data in parallel
    const [productsResult, ordersResult, customersResult] = await Promise.all([
      // Products - only active ones
      supabase
        .from('products')
        .select('*')
        .eq('status', 'active'),
      
      // Orders
      supabase
        .from('orders')
        .select(`
          *,
          order_items (
            product_id,
            quantity,
            unit_price,
            total_price,
            product_name
          )
        `)
        .order('created_at', { ascending: false }),
      
      // Customers
      supabase
        .from('profiles')
        .select('*')
    ]);

    if (productsResult.error) {
      console.error('❌ Error fetching products:', productsResult.error);
    }
    if (ordersResult.error) {
      console.error('❌ Error fetching orders:', ordersResult.error);
    }
    if (customersResult.error) {
      console.error('❌ Error fetching customers:', customersResult.error);
    }

    const products = productsResult.data || [];
    const orders = ordersResult.data || [];
    const customers = customersResult.data || [];

    // Calculate date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // === PRODUCTS METRICS ===
    const activeProducts = products.filter(p => p.status === 'active');
    const lowStockProducts = activeProducts
      .filter(p => (p.inventory_quantity || 0) <= 5 && (p.inventory_quantity || 0) > 0)
      .map(p => ({
        id: p.id,
        name: p.name,
        currentStock: p.inventory_quantity || 0,
        threshold: 5,
        slug: p.slug
      }))
      .sort((a, b) => a.currentStock - b.currentStock)
      .slice(0, 5);
    
    const outOfStockProducts = activeProducts.filter(p => (p.inventory_quantity || 0) === 0).length;

    // === ORDERS METRICS ===
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const processingOrders = orders.filter(o => o.status === 'processing').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const failedOrders = orders.filter(o => o.status === 'failed').length;

    // === REVENUE METRICS ===
    // Current month revenue (from completed or paid orders)
    const currentMonthOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      return orderDate >= startOfMonth && 
             (o.status === 'completed' || o.payment_status === 'paid');
    });
    const currentMonthRevenue = currentMonthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // Last month revenue for comparison
    const lastMonthOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      return orderDate >= startOfLastMonth && 
             orderDate <= endOfLastMonth &&
             (o.status === 'completed' || o.payment_status === 'paid');
    });
    const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // Calculate revenue change
    const revenueChange = lastMonthRevenue > 0 
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    // === CUSTOMERS METRICS ===
    const newCustomers = customers.filter(c => 
      new Date(c.created_at) >= thirtyDaysAgo
    ).length;
    const returningCustomers = customers.length - newCustomers;

    // === RECENT ORDERS ===
    const recentOrders = orders
      .slice(0, 5)
      .map(o => ({
        id: o.id,
        order_number: o.order_number,
        customer_name: o.shipping_first_name && o.shipping_last_name 
          ? `${o.shipping_first_name} ${o.shipping_last_name}`
          : 'Cliente',
        customer_email: o.email,
        total_amount: o.total_amount,
        status: o.status,
        payment_status: o.payment_status,
        created_at: o.created_at,
        items_count: o.order_items?.length || 0
      }));

    // === REVENUE TREND (Last 7 days) ===
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= date && 
               orderDate < nextDate && 
               (o.status === 'completed' || o.payment_status === 'paid');
      });
      
      const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      
      last7Days.push({
        date: date.toISOString().split('T')[0],
        revenue: dayRevenue,
        orders: dayOrders.length
      });
    }

    // === ORDERS STATUS DISTRIBUTION (Last 30 days) ===
    const last30DaysOrders = orders.filter(o => 
      new Date(o.created_at) >= thirtyDaysAgo
    );

    const statusDistribution = {
      pending: last30DaysOrders.filter(o => o.status === 'pending').length,
      processing: last30DaysOrders.filter(o => o.status === 'processing').length,
      completed: last30DaysOrders.filter(o => o.status === 'completed').length,
      failed: last30DaysOrders.filter(o => o.status === 'failed').length,
      shipped: last30DaysOrders.filter(o => o.status === 'shipped').length
    };

    // === TOP PRODUCTS (by revenue) ===
    const productRevenue = new Map();
    
    orders
      .filter(o => o.status === 'completed' || o.payment_status === 'paid')
      .forEach(order => {
        order.order_items?.forEach((item: any) => {
          const current = productRevenue.get(item.product_name) || { revenue: 0, quantity: 0 };
          productRevenue.set(item.product_name, {
            revenue: current.revenue + (item.total_price || 0),
            quantity: current.quantity + (item.quantity || 0)
          });
        });
      });

    const topProducts = Array.from(productRevenue.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    console.log('✅ Dashboard data fetched successfully');

    return NextResponse.json({
      kpis: {
        products: {
          total: activeProducts.length,
          lowStock: lowStockProducts.length,
          outOfStock: outOfStockProducts
        },
        orders: {
          total: orders.length,
          pending: pendingOrders,
          processing: processingOrders,
          completed: completedOrders,
          failed: failedOrders
        },
        revenue: {
          current: currentMonthRevenue,
          previous: lastMonthRevenue,
          change: revenueChange,
          currency: 'ARS'
        },
        customers: {
          total: customers.length,
          new: newCustomers,
          returning: returningCustomers
        }
      },
      recentOrders,
      lowStockProducts,
      charts: {
        revenueTrend: last7Days,
        ordersStatus: statusDistribution,
        topProducts
      }
    });

  } catch (error) {
    console.error('❌ Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

