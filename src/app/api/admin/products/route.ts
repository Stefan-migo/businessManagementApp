import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // TEMPORARY: Use service role to bypass RLS for debugging
    // TODO: Revert to createClient() after fixing admin_users table
    const supabase = createServiceRoleClient();
    const { searchParams } = new URL(request.url);

    // Pagination - Accept both page and offset parameters
    const limit = parseInt(searchParams.get('limit') || '12');
    const offsetParam = searchParams.get('offset');
    const pageParam = searchParams.get('page');
    
    // Use offset if provided, otherwise calculate from page
    const offset = offsetParam ? parseInt(offsetParam) : (parseInt(pageParam || '1') - 1) * limit;
    const page = offsetParam ? Math.floor(offset / limit) + 1 : parseInt(pageParam || '1');

    // Filters
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const skinType = searchParams.get('skin_type');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const featured = searchParams.get('featured');
    const inStock = searchParams.get('in_stock');
    const status = searchParams.get('status');
    const includeArchived = searchParams.get('include_archived') === 'true';

    // Sort
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // Build query with count option
    let query = supabase
      .from('products')
      .select(`
        *,
        categories:category_id (
          id,
          name,
          slug
        ),
        product_variants (
          id,
          title,
          price,
          inventory_quantity,
          option1,
          option2,
          option3,
          is_default
        )
      `, { count: 'exact' });

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category_id', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (skinType) {
      query = query.contains('skin_type', [skinType]);
    }

    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    if (inStock === 'true') {
      query = query.gt('inventory_quantity', 0);
    }

    // Status filtering - Admin can see all products
    if (status && status !== 'all') {
      query = query.eq('status', status);
    } else if (!includeArchived) {
      // Default to active products if no specific status requested
      query = query.eq('status', 'active');
    }
    // If includeArchived is true, show all products regardless of status

    // Apply sorting
    const sortColumn = getSortColumn(sortBy);
    const order = getSortOrder(sortBy);
    query = query.order(sortColumn, { ascending: order === 'asc' });

    // Execute query with pagination and get count
    // Note: range() must come AFTER select() for count to work properly
    const { data: products, count, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST method for creating products (same as public API for now)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('products')
      .insert([body])
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    return NextResponse.json({ product: data[0] });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getSortColumn(sortBy: string): string {
  switch (sortBy) {
    case 'price_asc':
    case 'price_desc':
      return 'price';
    case 'name':
      return 'name';
    case 'newest':
      return 'created_at';
    case 'featured':
      return 'is_featured';
    default:
      return 'created_at';
  }
}

function getSortOrder(sort: string) {
  switch (sort) {
    case 'price_asc': return 'asc';
    case 'price_desc': return 'desc';
    case 'name': return 'asc';
    case 'newest': return 'desc';
    case 'featured': return 'desc';
    default: return 'desc';
  }
}