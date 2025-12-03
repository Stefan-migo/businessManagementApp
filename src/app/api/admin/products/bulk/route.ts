import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operation, product_ids, updates } = body;

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

    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return NextResponse.json({ error: 'Product IDs are required' }, { status: 400 });
    }

    let results = [];

    switch (operation) {
      case 'update_status':
        if (!updates.status) {
          return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }
        
        const { data: statusUpdated, error: statusError } = await supabase
          .from('products')
          .update({ 
            status: updates.status,
            updated_at: new Date().toISOString()
          })
          .in('id', product_ids)
          .select('id, name, status');

        if (statusError) {
          throw statusError;
        }
        results = statusUpdated;
        break;

      case 'update_category':
        if (!updates.category_id) {
          return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
        }
        
        const { data: categoryUpdated, error: categoryError } = await supabase
          .from('products')
          .update({ 
            category_id: updates.category_id,
            updated_at: new Date().toISOString()
          })
          .in('id', product_ids)
          .select('id, name, category_id');

        if (categoryError) {
          throw categoryError;
        }
        results = categoryUpdated;
        break;

      case 'update_pricing':
        if (!updates.price_adjustment) {
          return NextResponse.json({ error: 'Price adjustment is required' }, { status: 400 });
        }

        // Get current products to calculate new prices
        const { data: currentProducts, error: fetchError } = await supabase
          .from('products')
          .select('id, price')
          .in('id', product_ids);

        if (fetchError) {
          throw fetchError;
        }

        // Calculate new prices based on adjustment
        const priceUpdates = currentProducts?.map(product => {
          let newPrice = product.price;
          
          if (updates.adjustment_type === 'percentage') {
            newPrice = product.price * (1 + updates.price_adjustment / 100);
          } else if (updates.adjustment_type === 'fixed') {
            newPrice = product.price + updates.price_adjustment;
          }
          
          return {
            id: product.id,
            price: Math.max(0, newPrice) // Ensure price doesn't go below 0
          };
        }) || [];

        // Update prices
        const priceUpdatePromises = priceUpdates.map(({ id, price }) =>
          supabase
            .from('products')
            .update({ 
              price,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select('id, name, price')
        );

        const priceResults = await Promise.all(priceUpdatePromises);
        results = priceResults.map(result => result.data?.[0]).filter(Boolean);
        break;

      case 'update_inventory':
        if (updates.inventory_adjustment === undefined) {
          return NextResponse.json({ error: 'Inventory adjustment is required' }, { status: 400 });
        }

        // Get current inventory
        const { data: currentInventory, error: inventoryFetchError } = await supabase
          .from('products')
          .select('id, inventory_quantity')
          .in('id', product_ids);

        if (inventoryFetchError) {
          throw inventoryFetchError;
        }

        // Calculate new inventory
        const inventoryUpdates = currentInventory?.map(product => {
          let newQuantity = product.inventory_quantity || 0;
          
          if (updates.adjustment_type === 'set') {
            newQuantity = updates.inventory_adjustment;
          } else if (updates.adjustment_type === 'add') {
            newQuantity = (product.inventory_quantity || 0) + updates.inventory_adjustment;
          }
          
          return {
            id: product.id,
            inventory_quantity: Math.max(0, newQuantity) // Ensure quantity doesn't go below 0
          };
        }) || [];

        // Update inventory
        const inventoryUpdatePromises = inventoryUpdates.map(({ id, inventory_quantity }) =>
          supabase
            .from('products')
            .update({ 
              inventory_quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select('id, name, inventory_quantity')
        );

        const inventoryResults = await Promise.all(inventoryUpdatePromises);
        results = inventoryResults.map(result => result.data?.[0]).filter(Boolean);
        break;

      case 'delete':
        // Soft delete by setting status to archived
        const { data: deletedProducts, error: deleteError } = await supabase
          .from('products')
          .update({ 
            status: 'archived',
            updated_at: new Date().toISOString()
          })
          .in('id', product_ids)
          .select('id, name, status');

        if (deleteError) {
          throw deleteError;
        }
        results = deletedProducts;
        break;

      case 'hard_delete':
        // Hard delete - permanently remove from database
        try {
          const serviceSupabase = createServiceRoleClient();
          
          // First, get the products to be deleted for logging
          const { data: productsToDelete, error: fetchError } = await serviceSupabase
            .from('products')
            .select('id, name')
            .in('id', product_ids);

          if (fetchError) {
            console.error('Error fetching products for hard delete:', fetchError);
            throw new Error(`Failed to fetch products: ${fetchError.message}`);
          }

          // Check if any products have orders (foreign key constraint)
          const { data: orderItems, error: orderCheckError } = await serviceSupabase
            .from('order_items')
            .select('product_id')
            .in('product_id', product_ids)
            .limit(1);

          if (orderCheckError) {
            console.error('Error checking order items:', orderCheckError);
            throw new Error(`Failed to check order dependencies: ${orderCheckError.message}`);
          }

          if (orderItems && orderItems.length > 0) {
            // Products have orders - check if force delete is requested
            const forceDelete = updates?.force_delete === true;
            
            if (!forceDelete) {
              // Products have orders - cannot hard delete without force
              const orderedProductIds = orderItems.map(item => item.product_id);
              const orderedProducts = productsToDelete?.filter(p => orderedProductIds.includes(p.id)) || [];
              
              return NextResponse.json({ 
                error: `Cannot hard delete products that have been ordered: ${orderedProducts.map(p => p.name).join(', ')}. Use soft delete (archive) instead, or enable force delete to remove orders and products.`,
                success: false,
                operation: 'hard_delete',
                affected_count: 0,
                results: []
              }, { status: 400 });
            }

            // Force delete: First delete order items, then products
            console.log('Force deleting products with orders...');
            
            // Delete order items first
            const { error: orderItemsDeleteError } = await serviceSupabase
              .from('order_items')
              .delete()
              .in('product_id', product_ids);

            if (orderItemsDeleteError) {
              console.error('Error deleting order items:', orderItemsDeleteError);
              throw new Error(`Failed to delete order items: ${orderItemsDeleteError.message}`);
            }

            console.log('Order items deleted successfully');
          }

          // Perform the hard delete (no foreign key constraints)
          const { data: hardDeletedProducts, error: hardDeleteError } = await serviceSupabase
            .from('products')
            .delete()
            .in('id', product_ids)
            .select('id, name');

          if (hardDeleteError) {
            console.error('Error during hard delete:', hardDeleteError);
            throw new Error(`Failed to delete products: ${hardDeleteError.message}`);
          }

          results = hardDeletedProducts || productsToDelete || [];
        } catch (hardDeleteErr) {
          console.error('Hard delete operation failed:', hardDeleteErr);
          throw new Error(`Hard delete failed: ${hardDeleteErr instanceof Error ? hardDeleteErr.message : 'Unknown error'}`);
        }
        break;

      case 'duplicate':
        // Get products to duplicate
        const { data: productsToDuplicate, error: duplicatesFetchError } = await supabase
          .from('products')
          .select('*')
          .in('id', product_ids);

        if (duplicatesFetchError) {
          throw duplicatesFetchError;
        }

        // Create duplicates
        const duplicatePromises = productsToDuplicate?.map(product => {
          const duplicateProduct = {
            ...product,
            id: undefined, // Let Supabase generate new ID
            name: `${product.name} (Copia)`,
            slug: `${product.slug}-copy-${Date.now()}`,
            status: 'draft',
            inventory_quantity: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          return supabase
            .from('products')
            .insert(duplicateProduct)
            .select('id, name, status');
        }) || [];

        const duplicateResults = await Promise.all(duplicatePromises);
        results = duplicateResults.map(result => result.data?.[0]).filter(Boolean);
        break;

      default:
        return NextResponse.json({ error: 'Invalid bulk operation' }, { status: 400 });
    }

    // Log admin activity
    await supabase.rpc('log_admin_activity', {
      action: `bulk_${operation}`,
      resource_type: 'product',
      resource_id: product_ids.join(','),
      details: { 
        operation,
        product_count: product_ids.length,
        updates 
      }
    });

    return NextResponse.json({ 
      success: true,
      operation,
      affected_count: results.length,
      results 
    });

  } catch (error) {
    console.error('Error in bulk operations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Export products to CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const category_id = searchParams.get('category_id');
    const status = searchParams.get('status');

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

    // Build query
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        price,
        compare_at_price,
        inventory_quantity,
        status,
        is_featured,
        sku,
        weight,
        skin_type,
        benefits,
        certifications,
        usage_instructions,
        category:categories(name),
        created_at,
        updated_at
      `);

    if (category_id && category_id !== 'all') {
      query = query.eq('category_id', category_id);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: products, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'ID',
        'Nombre',
        'Slug',
        'Descripción',
        'Precio',
        'Precio Comparación',
        'Stock',
        'Estado',
        'Destacado',
        'SKU',
        'Peso',
        'Tipos de Piel',
        'Beneficios',
        'Certificaciones',
        'Instrucciones',
        'Categoría',
        'Fecha Creación'
      ];

      const csvRows = [
        headers.join(','),
        ...(products || []).map(product => [
          product.id,
          `"${product.name || ''}"`,
          `"${product.slug || ''}"`,
          `"${(product.description || '').replace(/"/g, '""')}"`,
          product.price || 0,
          product.compare_at_price || '',
          product.inventory_quantity || 0,
          product.status || '',
          product.is_featured ? 'Sí' : 'No',
          `"${product.sku || ''}"`,
          product.weight || '',
          `"${Array.isArray(product.skin_type) ? product.skin_type.join('; ') : ''}"`,
          `"${Array.isArray(product.benefits) ? product.benefits.join('; ') : ''}"`,
          `"${Array.isArray(product.certifications) ? product.certifications.join('; ') : ''}"`,
          `"${(product.usage_instructions || '').replace(/"/g, '""')}"`,
          `"${(() => {
            if (Array.isArray(product.category)) {
              return product.category.length > 0 ? (product.category[0] as any)?.name || '' : '';
            }
            return (product.category as any)?.name || '';
          })()}"`,
          new Date(product.created_at).toLocaleDateString('es-AR')
        ].join(','))
      ];

      const csvContent = csvRows.join('\n');
      
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="productos-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Return JSON format
    if (format === 'json') {
      const jsonString = JSON.stringify(products, null, 2);
      
      return new Response(jsonString, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="productos-${new Date().toISOString().split('T')[0]}.json"`
        }
      });
    }

    return NextResponse.json({ products });

  } catch (error) {
    console.error('Error in export products API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
