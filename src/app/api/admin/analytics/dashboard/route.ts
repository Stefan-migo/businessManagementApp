import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Analytics Dashboard API called');
    
    const supabase = await createClient();
    
    // Check admin authorization
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ User authentication failed:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: isAdmin } = await supabase.rpc('is_admin', { user_id: user.id });
    if (!isAdmin) {
      console.log('❌ User is not admin:', user.email);
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabaseServiceRole = createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '30');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - period);

    console.log('📅 Fetching analytics for period:', { 
      from: startDate.toISOString(), 
      to: endDate.toISOString(),
      days: period 
    });

    // ====================================
    // FETCH REAL DATA IN PARALLEL
    // ====================================
    const [
      productsResult,
      categoriesResult,
      ordersResult,
      profilesResult,
      orderItemsResult
    ] = await Promise.all([
      // All active products
      supabaseServiceRole
        .from('products')
        .select('id, name, price, category_id, created_at')
        .eq('status', 'active'),
      
      // All categories
      supabaseServiceRole
        .from('categories')
        .select('id, name, slug'),
      
      // Orders in the period
      supabaseServiceRole
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      
      // All profiles (customers)
      supabaseServiceRole
        .from('profiles')
        .select('id, created_at, membership_tier, is_member'),
      
      // Order items for product analytics
      supabaseServiceRole
        .from('order_items')
        .select(`
          id,
          order_id,
          product_id,
          product_name,
          quantity,
          unit_price,
          total_price
        `)
    ]);

    if (productsResult.error) console.error('❌ Products error:', productsResult.error);
    if (categoriesResult.error) console.error('❌ Categories error:', categoriesResult.error);
    if (ordersResult.error) console.error('❌ Orders error:', ordersResult.error);
    if (profilesResult.error) console.error('❌ Profiles error:', profilesResult.error);
    if (orderItemsResult.error) console.error('❌ Order items error:', orderItemsResult.error);

    const products = productsResult.data || [];
    const categories = categoriesResult.data || [];
    const ordersInPeriod = ordersResult.data || [];
    const profiles = profilesResult.data || [];
    const orderItems = orderItemsResult.data || [];

    console.log('✅ Data fetched:', {
      products: products.length,
      categories: categories.length,
      ordersInPeriod: ordersInPeriod.length,
      profiles: profiles.length,
      orderItems: orderItems.length
    });

    // ====================================
    // CALCULATE PREVIOUS PERIOD FOR GROWTH
    // ====================================
    const prevPeriodStart = new Date(startDate);
    prevPeriodStart.setDate(prevPeriodStart.getDate() - period);
    
    const { data: prevOrders } = await supabaseServiceRole
      .from('orders')
      .select('total_amount, payment_status')
      .gte('created_at', prevPeriodStart.toISOString())
      .lt('created_at', startDate.toISOString());

    // ====================================
    // CALCULATE KPIs FROM REAL DATA
    // ====================================
    const totalRevenue = ordersInPeriod
      .filter(o => o.payment_status === 'paid')
      .reduce((sum, order) => sum + (order.total_amount || 0), 0);

    const prevRevenue = (prevOrders || [])
      .filter(o => o.payment_status === 'paid')
      .reduce((sum, order) => sum + (order.total_amount || 0), 0);

    const revenueGrowth = prevRevenue > 0 
      ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 
      : 0;

    const totalOrders = ordersInPeriod.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Customer metrics
    const customersInPeriod = profiles.filter(p => 
      new Date(p.created_at) >= startDate && new Date(p.created_at) <= endDate
    );
    const totalCustomers = profiles.length;
    const newCustomers = customersInPeriod.length;

    // Calculate conversion rate (orders / customers in period)
    const conversionRate = newCustomers > 0 
      ? (totalOrders / newCustomers) * 100 
      : 0;

    // ====================================
    // CALCULATE TRENDS (DAILY DATA)
    // ====================================
    const salesTrends = [];
    const customerTrends = [];

    for (let i = 0; i < period; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);

      // Sales for this day
      const dayOrders = ordersInPeriod.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= currentDate && orderDate < nextDate;
      });

      const daySales = dayOrders
        .filter(o => o.payment_status === 'paid')
        .reduce((sum, order) => sum + (order.total_amount || 0), 0);

      salesTrends.push({
        date: currentDate.toISOString().split('T')[0],
        value: daySales,
        count: dayOrders.length
      });

      // New customers for this day
      const dayCustomers = profiles.filter(profile => {
        const profileDate = new Date(profile.created_at);
        return profileDate >= currentDate && profileDate < nextDate;
      });

      customerTrends.push({
        date: currentDate.toISOString().split('T')[0],
        value: dayCustomers.length,
        count: dayCustomers.length
      });
    }

    // ====================================
    // TOP PRODUCTS (BY REVENUE)
    // ====================================
    const productStats: Record<string, any> = {};

    orderItems.forEach(item => {
      const productId = item.product_id;
      if (!productStats[productId]) {
        productStats[productId] = {
          id: productId,
          name: item.product_name || 'Producto Sin Nombre',
          revenue: 0,
          quantity: 0,
          orders: new Set()
        };
      }
      productStats[productId].revenue += item.total_price || 0;
      productStats[productId].quantity += item.quantity || 0;
      productStats[productId].orders.add(item.order_id);
    });

    const topProducts = Object.values(productStats)
      .map((stat: any) => ({
        id: stat.id,
        name: stat.name,
        category: 'General', // We'll map this properly
        revenue: stat.revenue,
        quantity: stat.quantity,
        orders: stat.orders.size
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Map product categories
    topProducts.forEach(product => {
      const prod = products.find(p => p.id === product.id);
      if (prod) {
        const category = categories.find(c => c.id === prod.category_id);
        product.category = category?.name || 'Sin Categoría';
      }
    });

    // ====================================
    // CATEGORY REVENUE
    // ====================================
    const categoryRevenue: Record<string, number> = {};

    orderItems.forEach(item => {
      const product = products.find(p => p.id === item.product_id);
      if (product && product.category_id) {
        const category = categories.find(c => c.id === product.category_id);
        const categoryName = category?.name || 'Sin Categoría';
        
        if (!categoryRevenue[categoryName]) {
          categoryRevenue[categoryName] = 0;
        }
        categoryRevenue[categoryName] += item.total_price || 0;
      }
    });

    const categoryRevenueArray = Object.entries(categoryRevenue)
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    // ====================================
    // CUSTOMER SEGMENTATION
    // ====================================
    const members = profiles.filter(p => p.is_member).length;
    const nonMembers = profiles.length - members;
    const premiumMembers = profiles.filter(p => p.membership_tier === 'premium').length;
    const basicMembers = profiles.filter(p => p.membership_tier === 'basic').length;

    // ====================================
    // ORDER STATUS DISTRIBUTION
    // ====================================
    const statusDistribution: Record<string, number> = {};
    ordersInPeriod.forEach(order => {
      const status = order.status || 'pending';
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;
    });

    // ====================================
    // BUILD ANALYTICS RESPONSE
    // ====================================
    const analytics = {
      kpis: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts: products.length,
        avgOrderValue,
        revenueGrowth,
        conversionRate
      },
      trends: {
        sales: salesTrends,
        customers: customerTrends
      },
      products: {
        topProducts,
        categoryRevenue: categoryRevenueArray
      },
      customers: {
        segmentation: {
          new: newCustomers,
          basic: basicMembers,
          premium: premiumMembers,
          members,
          nonMembers
        }
      },
      orders: {
        statusDistribution
      },
      period: {
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
        days: period
      }
    };

    console.log('✅ Analytics calculated successfully');
    console.log('📊 KPIs:', analytics.kpis);

    return NextResponse.json({ analytics });

  } catch (error) {
    console.error('❌ Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
