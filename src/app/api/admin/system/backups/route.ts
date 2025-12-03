import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase';

/**
 * GET /api/admin/system/backups
 * List all available backups from Supabase Storage
 * GET /api/admin/system/backups?filename=xxx&action=details
 * Get details and download URL for a specific backup
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const action = searchParams.get('action');

    const supabase = await createClient();
    
    // Check admin authorization
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminRole } = await supabase.rpc('get_admin_role', { user_id: user.id });
    if (adminRole !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabaseService = createServiceRoleClient();

    // If filename and action=details, return backup details
    if (filename && action === 'details') {
      // Download the backup file to read its metadata
      const { data: backupFile, error: downloadError } = await supabaseService.storage
        .from('database-backups')
        .download(filename);

      if (downloadError || !backupFile) {
        return NextResponse.json({ 
          error: 'Error al descargar backup',
          details: downloadError?.message 
        }, { status: 500 });
      }

      // Parse backup JSON to get metadata
      const backupText = await backupFile.text();
      let backupData: any;
      try {
        backupData = JSON.parse(backupText);
      } catch (parseError) {
        return NextResponse.json({ 
          error: 'Error al parsear archivo de backup',
          details: 'El archivo no es un JSON válido'
        }, { status: 400 });
      }

      // Get file metadata
      const { data: fileInfo } = await supabaseService.storage
        .from('database-backups')
        .list('', {
          search: filename
        });

      const file = fileInfo?.[0];
      const fileSize = file?.metadata?.size || file?.metadata?.size_bytes || 0;

      // Create signed URL for download (valid for 1 hour)
      const { data: signedUrlData, error: signedUrlError } = await supabaseService.storage
        .from('database-backups')
        .createSignedUrl(filename, 3600); // 1 hour expiration

      if (signedUrlError) {
        console.error('Error creating signed URL:', signedUrlError);
      }

      // Calculate expiration time (1 hour from now)
      const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

      // Calculate total records from backup data
      const totalRecords = backupData.tables 
        ? Object.values(backupData.tables).reduce((sum: number, table: any) => {
            return sum + (table.record_count || 0);
          }, 0)
        : 0;

      const tablesCount = backupData.tables ? Object.keys(backupData.tables).length : 0;

      return NextResponse.json({
        success: true,
        backup_id: backupData.backup_id || filename.replace('.json', ''),
        backup_file: filename,
        download_url: signedUrlData?.signedUrl || null,
        download_url_expires_at: signedUrlData?.signedUrl ? expiresAt : null,
        tables_count: tablesCount,
        total_records: totalRecords,
        backup_size_mb: (fileSize / 1024 / 1024).toFixed(2),
        created_at: backupData.created_at || file?.created_at,
        created_by: backupData.created_by || 'Unknown'
      });
    }

    // Default: return list of all backups
    // List all files in database-backups bucket
    const { data: files, error: listError } = await supabaseService.storage
      .from('database-backups')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error('Error listing backups:', listError);
      return NextResponse.json({ error: 'Error al listar backups' }, { status: 500 });
    }

    // Format backup information
    const backups = (files || []).map(file => {
      // Extract backup ID from filename (backup_2025-02-10T...-123.json)
      const backupIdMatch = file.name.match(/^(backup_[^\.]+)/);
      const backupId = backupIdMatch ? backupIdMatch[1] : file.name.replace('.json', '');
      
      return {
        id: backupId,
        filename: file.name,
        size: file.metadata?.size || file.metadata?.size_bytes || 0,
        size_mb: ((file.metadata?.size || file.metadata?.size_bytes || 0) / 1024 / 1024).toFixed(2),
        created_at: file.created_at,
        updated_at: file.updated_at,
        last_accessed_at: file.last_accessed_at
      };
    });

    return NextResponse.json({ 
      success: true,
      backups: backups,
      count: backups.length
    });

  } catch (error) {
    console.error('Error in backups API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/system/backups
 * Restore a specific backup
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { backup_filename, create_safety_backup = true } = body;

    if (!backup_filename) {
      return NextResponse.json({ error: 'backup_filename es requerido' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Check admin authorization
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminRole } = await supabase.rpc('get_admin_role', { user_id: user.id });
    if (adminRole !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log(`🔄 Starting backup restoration: ${backup_filename} by ${user.email}`);

    const supabaseService = createServiceRoleClient();
    const restoreStartTime = new Date();

    // Step 1: Create safety backup if requested
    let safetyBackupId = null;
    if (create_safety_backup) {
      console.log('📦 Creating safety backup before restoration...');
      const safetyBackupStartTime = new Date();
      safetyBackupId = `safety_backup_${safetyBackupStartTime.toISOString().replace(/[:.]/g, '-')}`;
      
      const tablesToBackup = ['products', 'categories', 'orders', 'order_items', 'profiles', 'admin_users', 'system_config'];
      const safetyBackupData: any = {
        backup_id: safetyBackupId,
        created_at: safetyBackupStartTime.toISOString(),
        created_by: user.email,
        type: 'safety_backup_before_restore',
        tables: {}
      };

      for (const tableName of tablesToBackup) {
        const { data, error } = await supabaseService
          .from(tableName)
          .select('*');

        if (!error && data) {
          safetyBackupData.tables[tableName] = {
            data: data || [],
            record_count: data?.length || 0
          };
        }
      }

      const safetyBackupJson = JSON.stringify(safetyBackupData, null, 2);
      const safetyBackupBuffer = Buffer.from(safetyBackupJson, 'utf-8');
      const safetyBackupFileName = `${safetyBackupId}.json`;

      await supabaseService.storage
        .from('database-backups')
        .upload(safetyBackupFileName, safetyBackupBuffer, {
          contentType: 'application/json',
          cacheControl: '3600',
          upsert: false
        });

      console.log('✅ Safety backup created:', safetyBackupId);
    }

    // Step 2: Download the backup file to restore
    const { data: backupFile, error: downloadError } = await supabaseService.storage
      .from('database-backups')
      .download(backup_filename);

    if (downloadError || !backupFile) {
      console.error('Error downloading backup:', downloadError);
      return NextResponse.json({ 
        error: 'Error al descargar backup',
        details: downloadError?.message 
      }, { status: 500 });
    }

    // Step 3: Parse backup JSON
    const backupText = await backupFile.text();
    let backupData: any;
    try {
      backupData = JSON.parse(backupText);
    } catch (parseError) {
      return NextResponse.json({ 
        error: 'Error al parsear archivo de backup',
        details: 'El archivo no es un JSON válido'
      }, { status: 400 });
    }

    if (!backupData.tables) {
      return NextResponse.json({ 
        error: 'Backup inválido',
        details: 'El archivo de backup no contiene datos de tablas'
      }, { status: 400 });
    }

    // Step 4: Restore tables in correct order (respecting foreign key dependencies)
    const restoreOrder = [
      'categories',      // No dependencies
      'profiles',        // No dependencies
      'admin_users',     // No dependencies
      'system_config',   // No dependencies
      'products',        // Depends on categories
      'orders',          // Depends on profiles
      'order_items'      // Depends on orders and products
    ];

    const restoreResults: any = {};
    let totalRestored = 0;
    let totalErrors = 0;

    for (const tableName of restoreOrder) {
      if (!backupData.tables[tableName] || !backupData.tables[tableName].data) {
        restoreResults[tableName] = {
          status: 'skipped',
          reason: 'No data in backup'
        };
        continue;
      }

      const tableData = backupData.tables[tableName].data;
      if (!Array.isArray(tableData) || tableData.length === 0) {
        restoreResults[tableName] = {
          status: 'skipped',
          reason: 'Empty table in backup'
        };
        continue;
      }

      try {
        // Step 1: Delete existing records
        // Strategy: For products table, delete specific IDs from backup first, then delete all
        // For other tables, delete all records
        const deleteBatchSize = 500;
        let deleteErrors = 0;
        let totalDeleted = 0;

        if (tableName === 'products' && tableData.length > 0) {
          // For products: First delete the specific products that are in the backup
          const backupProductIds = tableData
            .map((row: any) => row.id)
            .filter((id: any) => id !== null && id !== undefined);

          if (backupProductIds.length > 0) {
            console.log(`Deleting ${backupProductIds.length} specific products from backup...`);
            // Delete in batches
            for (let i = 0; i < backupProductIds.length; i += deleteBatchSize) {
              const batch = backupProductIds.slice(i, i + deleteBatchSize);
              const { error: deleteError } = await supabaseService
                .from(tableName)
                .delete()
                .in('id', batch);

              if (deleteError) {
                console.error(`Error deleting specific products from ${tableName}:`, deleteError);
                deleteErrors++;
              } else {
                totalDeleted += batch.length;
              }
            }
          }
        } else {
          // For other tables: Delete all records in batches
          let hasMore = true;
          let offset = 0;
          const fetchLimit = 1000;
          
          while (hasMore) {
            // Fetch a batch of IDs to delete
            const { data: existingData, error: fetchError } = await supabaseService
              .from(tableName)
              .select('id')
              .range(offset, offset + fetchLimit - 1);

            if (fetchError) {
              console.error(`Error fetching data to delete from ${tableName}:`, fetchError);
              deleteErrors++;
              break;
            }

            if (!existingData || existingData.length === 0) {
              hasMore = false;
              break;
            }

            // Delete in smaller batches to avoid query size limits
            for (let i = 0; i < existingData.length; i += deleteBatchSize) {
              const batch = existingData.slice(i, i + deleteBatchSize);
              const ids = batch.map((row: any) => row.id).filter((id: any) => id !== null && id !== undefined);
              
              if (ids.length > 0) {
                const { error: deleteError } = await supabaseService
                  .from(tableName)
                  .delete()
                  .in('id', ids);

                if (deleteError) {
                  console.error(`Error deleting batch from ${tableName}:`, deleteError);
                  deleteErrors++;
                } else {
                  totalDeleted += ids.length;
                }
              }
            }

            // If we got less than the limit, we're done
            if (existingData.length < fetchLimit) {
              hasMore = false;
            } else {
              offset += fetchLimit;
            }
          }
        }

        console.log(`Deleted ${totalDeleted} records from ${tableName} before restore`);

        // Step 1.5: For products table, validate category_id references exist
        if (tableName === 'products' && tableData.length > 0) {
          // Get all category_ids from backup data
          const categoryIds = [...new Set(tableData
            .map((row: any) => row.category_id)
            .filter((id: any) => id !== null && id !== undefined)
          )];

          if (categoryIds.length > 0) {
            // Check which categories exist
            const { data: existingCategories } = await supabaseService
              .from('categories')
              .select('id')
              .in('id', categoryIds);

            const existingCategoryIds = new Set(
              (existingCategories || []).map((c: any) => c.id)
            );

            // Filter out products with invalid category_id
            const invalidCategoryProducts = tableData.filter((row: any) => 
              row.category_id && !existingCategoryIds.has(row.category_id)
            );

            if (invalidCategoryProducts.length > 0) {
              console.warn(`Found ${invalidCategoryProducts.length} products with invalid category_id. They will be set to null.`);
              // Set invalid category_id to null
              tableData.forEach((row: any) => {
                if (row.category_id && !existingCategoryIds.has(row.category_id)) {
                  row.category_id = null;
                }
              });
            }
          }
        }

        // Step 2: Insert data in batches (to avoid timeout on large tables)
        const batchSize = 100;
        let inserted = 0;
        let insertErrors = 0;
        let errorDetails: string[] = [];
        let problematicRecords: any[] = [];

        for (let i = 0; i < tableData.length; i += batchSize) {
          const batch = tableData.slice(i, i + batchSize);
          
          // Clean the batch: remove null/undefined values and ensure proper types
          const cleanBatch = batch.map((row: any) => {
            const cleanRow: any = {};
            Object.keys(row).forEach(key => {
              if (row[key] !== null && row[key] !== undefined) {
                cleanRow[key] = row[key];
              }
            });
            
            // Special handling for products table
            if (tableName === 'products') {
              // Validate status field (must be 'draft', 'active', or 'archived')
              if (cleanRow.status && !['draft', 'active', 'archived'].includes(cleanRow.status)) {
                cleanRow.status = 'draft'; // Default to draft if invalid
              }
              
              // Validate inventory_policy (must be 'continue' or 'deny')
              if (cleanRow.inventory_policy && !['continue', 'deny'].includes(cleanRow.inventory_policy)) {
                cleanRow.inventory_policy = 'deny'; // Default to deny if invalid
              }
              
              // Ensure required fields have defaults
              if (!cleanRow.currency) cleanRow.currency = 'ARS';
              if (cleanRow.track_inventory === undefined) cleanRow.track_inventory = true;
              if (cleanRow.inventory_quantity === undefined) cleanRow.inventory_quantity = 0;
              if (cleanRow.low_stock_threshold === undefined) cleanRow.low_stock_threshold = 5;
              if (cleanRow.is_featured === undefined) cleanRow.is_featured = false;
              if (cleanRow.is_digital === undefined) cleanRow.is_digital = false;
              if (cleanRow.requires_shipping === undefined) cleanRow.requires_shipping = true;
            }
            
            return cleanRow;
          }).filter((row: any) => Object.keys(row).length > 0);

          if (cleanBatch.length > 0) {
            // For products table, use UPSERT (update if exists, insert if not)
            // For other tables, use regular INSERT
            let insertError: any = null;
            
            if (tableName === 'products') {
              // Use upsert for products: update if exists, insert if not
              const { error: upsertError } = await supabaseService
                .from(tableName)
                .upsert(cleanBatch, {
                  onConflict: 'id',
                  ignoreDuplicates: false
                });
              insertError = upsertError;
            } else {
              // Regular insert for other tables
              const { error: regularInsertError } = await supabaseService
                .from(tableName)
                .insert(cleanBatch);
              insertError = regularInsertError;
            }

            if (insertError) {
              console.error(`Error inserting batch into ${tableName}:`, insertError);
              errorDetails.push(insertError.message || insertError.code || 'Unknown error');
              
              // If batch insert fails, try inserting one by one to identify problematic records
              if (cleanBatch.length > 1) {
                console.log(`Batch insert failed, trying one by one for ${tableName}...`);
                for (const record of cleanBatch) {
                  let singleError: any = null;
                  
                  if (tableName === 'products') {
                    const { error: upsertSingleError } = await supabaseService
                      .from(tableName)
                      .upsert(record, {
                        onConflict: 'id',
                        ignoreDuplicates: false
                      });
                    singleError = upsertSingleError;
                  } else {
                    const { error: insertSingleError } = await supabaseService
                      .from(tableName)
                      .insert(record);
                    singleError = insertSingleError;
                  }
                  
                  if (singleError) {
                    insertErrors++;
                    problematicRecords.push({
                      record: record,
                      error: singleError.message || singleError.code || 'Unknown error',
                      details: singleError.details || singleError.hint || ''
                    });
                    console.error(`Failed to insert record in ${tableName}:`, singleError);
                    console.error(`Problematic record:`, record);
                  } else {
                    inserted++;
                  }
                }
              } else {
                // Single record failed
                insertErrors++;
                problematicRecords.push({
                  record: cleanBatch[0],
                  error: insertError.message || insertError.code || 'Unknown error',
                  details: insertError.details || insertError.hint || ''
                });
              }
            } else {
              inserted += cleanBatch.length;
            }
          }
        }

        // Determine status: 
        // - If all records were inserted/updated successfully, it's a success (even if deletion had issues)
        // - If there were insertion errors, it's partial or error
        // - For products with UPSERT, deletion errors are less critical since UPSERT handles existing records
        const allRecordsRestored = inserted === tableData.length;
        const hasInsertErrors = insertErrors > 0;
        
        let status: string;
        if (allRecordsRestored && !hasInsertErrors) {
          // All records successfully restored - this is success
          status = 'success';
        } else if (inserted > 0) {
          // Some records restored but not all, or there were errors
          status = 'partial';
        } else {
          // No records restored
          status = 'error';
        }
        
        restoreResults[tableName] = {
          status: status,
          records_restored: inserted,
          records_total: tableData.length,
          errors: insertErrors,
          delete_errors: deleteErrors,
          error_message: errorDetails.length > 0 && hasInsertErrors ? errorDetails[0] : undefined,
          problematic_records: problematicRecords.length > 0 ? problematicRecords.slice(0, 3) : undefined, // Limit to first 3 for UI
          // Add note if deletion had issues but restoration was successful
          note: deleteErrors > 0 && allRecordsRestored && !hasInsertErrors 
            ? 'Restauración exitosa. Algunos registros no se pudieron eliminar antes de restaurar (probablemente por referencias), pero se actualizaron correctamente.'
            : undefined
        };

        totalRestored += inserted;
        // Only count insertion errors, not deletion errors (since UPSERT handles existing records)
        if (hasInsertErrors) totalErrors++;

      } catch (error) {
        console.error(`Error restoring table ${tableName}:`, error);
        restoreResults[tableName] = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        totalErrors++;
      }
    }

    const restoreEndTime = new Date();
    const restoreDuration = (restoreEndTime.getTime() - restoreStartTime.getTime()) / 1000;

    // Step 5: Log the restoration
    await supabase.rpc('log_admin_activity', {
      action: 'maintenance_restore_database',
      resource_type: 'system',
      resource_id: null,
      details: {
        action: 'restore_database',
        backup_file: backup_filename,
        backup_id: backupData.backup_id,
        safety_backup_id: safetyBackupId,
        tables_restored: Object.keys(restoreResults).length,
        total_records_restored: totalRestored,
        errors: totalErrors,
        restore_results: restoreResults,
        duration_seconds: restoreDuration,
        initiated_by: user.email
      }
    });

    return NextResponse.json({ 
      success: true,
      message: `Restauración completada: ${totalRestored} registros restaurados`,
      backup_file: backup_filename,
      backup_id: backupData.backup_id,
      safety_backup_id: safetyBackupId,
      tables_restored: Object.keys(restoreResults).length,
      total_records_restored: totalRestored,
      errors: totalErrors,
      restore_results: restoreResults,
      duration_seconds: restoreDuration.toFixed(2)
    });

  } catch (error) {
    console.error('Error in restore backup API:', error);
    return NextResponse.json({ 
      error: 'Error al restaurar backup',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/system/backups
 * Delete a specific backup file
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backup_filename = searchParams.get('filename');

    if (!backup_filename) {
      return NextResponse.json({ error: 'backup_filename es requerido' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Check admin authorization
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminRole } = await supabase.rpc('get_admin_role', { user_id: user.id });
    if (adminRole !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log(`🗑️ Deleting backup: ${backup_filename} by ${user.email}`);

    const supabaseService = createServiceRoleClient();

    // Delete the backup file from storage
    const { error: deleteError } = await supabaseService.storage
      .from('database-backups')
      .remove([backup_filename]);

    if (deleteError) {
      console.error('Error deleting backup:', deleteError);
      return NextResponse.json({ 
        error: 'Error al eliminar backup',
        details: deleteError.message 
      }, { status: 500 });
    }

    // Log the deletion
    await supabase.rpc('log_admin_activity', {
      action: 'maintenance_delete_backup',
      resource_type: 'system',
      resource_id: null,
      details: {
        action: 'delete_backup',
        backup_file: backup_filename,
        initiated_by: user.email
      }
    });

    return NextResponse.json({ 
      success: true,
      message: `Backup ${backup_filename} eliminado exitosamente`
    });

  } catch (error) {
    console.error('Error in delete backup API:', error);
    return NextResponse.json({ 
      error: 'Error al eliminar backup',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

