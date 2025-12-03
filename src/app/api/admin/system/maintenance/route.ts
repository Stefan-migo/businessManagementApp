import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

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

    console.log(`🔧 Maintenance action requested: ${action} by ${user.email}`);

    switch (action) {
      case 'backup_database':
        // Create database backup by exporting key tables to JSON
        try {
          const backupStartTime = new Date();
          const backupId = `backup_${backupStartTime.toISOString().replace(/[:.]/g, '-')}`;
          
          console.log('📦 Starting database backup...');

          // Use service role client for backup (needs elevated permissions)
          const supabaseService = createServiceRoleClient();

          // Export key tables to JSON
          const tablesToBackup = [
            'products',
            'categories',
            'orders',
            'order_items',
            'profiles',
            'admin_users',
            'system_config'
          ];

          const backupData: any = {
            backup_id: backupId,
            created_at: backupStartTime.toISOString(),
            created_by: user.email,
            tables: {}
          };

          // Export each table
          for (const tableName of tablesToBackup) {
            const { data, error } = await supabaseService
              .from(tableName)
              .select('*');

            if (error) {
              console.error(`Error backing up table ${tableName}:`, error);
              backupData.tables[tableName] = {
                error: error.message,
                record_count: 0
              };
            } else {
              backupData.tables[tableName] = {
                data: data || [],
                record_count: data?.length || 0
              };
            }
          }

          // Calculate total records
          const totalRecords = Object.values(backupData.tables).reduce((sum: number, table: any) => {
            return sum + (table.record_count || 0);
          }, 0);

          // Convert to JSON string
          const backupJson = JSON.stringify(backupData, null, 2);
          const backupBuffer = Buffer.from(backupJson, 'utf-8');
          const backupSize = backupBuffer.length;

          // Upload to Supabase Storage using service role client
          const backupFileName = `${backupId}.json`;
          const { data: uploadData, error: uploadError } = await supabaseService.storage
            .from('database-backups')
            .upload(backupFileName, backupBuffer, {
              contentType: 'application/json',
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Error uploading backup:', uploadError);
            return NextResponse.json({ 
              error: 'Error al subir backup a almacenamiento',
              details: uploadError.message 
            }, { status: 500 });
          }

          // Create signed URL for download (valid for 1 hour)
          const { data: signedUrlData, error: signedUrlError } = await supabaseService.storage
            .from('database-backups')
            .createSignedUrl(backupFileName, 3600); // 1 hour expiration

          if (signedUrlError) {
            console.error('Error creating signed URL:', signedUrlError);
            // Continue anyway, backup is saved
          }

          // Calculate expiration time (1 hour from now)
          const expiresAt = signedUrlData?.signedUrl 
            ? new Date(Date.now() + 3600 * 1000).toISOString()
            : null;

          const backupEndTime = new Date();
          const backupDuration = (backupEndTime.getTime() - backupStartTime.getTime()) / 1000;

          // Log the action
          await supabase.rpc('log_admin_activity', {
            action: 'maintenance_backup_database',
            resource_type: 'system',
            resource_id: null,
            details: {
              action: 'backup_database',
              backup_id: backupId,
              backup_file: backupFileName,
              tables_backed_up: tablesToBackup.length,
              total_records: totalRecords,
              backup_size_bytes: backupSize,
              backup_size_mb: (backupSize / 1024 / 1024).toFixed(2),
              duration_seconds: backupDuration,
              download_url_created: !!signedUrlData,
              initiated_by: user.email
            }
          });

          return NextResponse.json({ 
            success: true,
            message: `Backup completado: ${totalRecords} registros en ${tablesToBackup.length} tablas (${(backupSize / 1024 / 1024).toFixed(2)} MB)`,
            action: 'backup_database',
            backup_id: backupId,
            backup_file: backupFileName,
            download_url: signedUrlData?.signedUrl || null,
            download_url_expires_at: expiresAt,
            tables_count: tablesToBackup.length,
            total_records: totalRecords,
            backup_size_mb: (backupSize / 1024 / 1024).toFixed(2),
            duration_seconds: backupDuration.toFixed(2)
          });

        } catch (error) {
          console.error('Error creating backup:', error);
          return NextResponse.json({ 
            error: 'Error al crear backup de base de datos',
            details: error instanceof Error ? error.message : 'Error desconocido'
          }, { status: 500 });
        }

      case 'clean_logs':
        // Clean logs older than 90 days
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        
        const { count: deletedCount, error: deleteError } = await supabase
          .from('admin_activity_log')
          .delete({ count: 'exact' })
          .lt('created_at', ninetyDaysAgo);

        if (deleteError) {
          console.error('Error cleaning logs:', deleteError);
          return NextResponse.json({ error: 'Error al limpiar logs' }, { status: 500 });
        }

        await supabase.rpc('log_admin_activity', {
          action: 'maintenance_clean_logs',
          resource_type: 'system',
          resource_id: null,
          details: {
            action: 'clean_logs',
            logs_deleted: deletedCount || 0,
            initiated_by: user.email
          }
        });

        return NextResponse.json({ 
          success: true,
          message: `Se eliminaron ${deletedCount || 0} registros de logs antiguos`,
          action: 'clean_logs',
          logs_deleted: deletedCount || 0
        });

      case 'optimize_database':
        // Execute VACUUM ANALYZE via SQL function
        const { data: optimizeResult, error: optimizeError } = await supabase.rpc('optimize_database');

        if (optimizeError) {
          console.error('Error optimizing database:', optimizeError);
          return NextResponse.json({ 
            error: 'Error al optimizar la base de datos',
            details: optimizeError.message 
          }, { status: 500 });
        }

        if (!optimizeResult || !optimizeResult.success) {
          return NextResponse.json({ 
            error: 'Error al optimizar la base de datos',
            details: optimizeResult?.error || 'Error desconocido'
          }, { status: 500 });
        }

        // Log the action
        await supabase.rpc('log_admin_activity', {
          action: 'maintenance_optimize_database',
          resource_type: 'system',
          resource_id: null,
          details: {
            action: 'optimize_database',
            tables_optimized: optimizeResult.tables_optimized,
            duration_seconds: optimizeResult.duration_seconds,
            initiated_by: user.email
          }
        });

        const tablesCount = optimizeResult.tables_optimized?.length || 0;
        const duration = optimizeResult.duration_seconds 
          ? `${optimizeResult.duration_seconds.toFixed(2)}s` 
          : 'completado';

        return NextResponse.json({ 
          success: true,
          message: `Optimización completada: ${tablesCount} tablas optimizadas en ${duration}`,
          action: 'optimize_database',
          result: optimizeResult
        });

      case 'security_audit':
        // Check for potential security issues
        const { count: inactiveAdmins } = await supabase
          .from('admin_users')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', false);

        const { count: totalAdmins } = await supabase
          .from('admin_users')
          .select('*', { count: 'exact', head: true });

        const securityIssues = [];
        if (inactiveAdmins && inactiveAdmins > 0) {
          securityIssues.push(`${inactiveAdmins} administradores inactivos`);
        }
        if (totalAdmins && totalAdmins < 2) {
          securityIssues.push('Solo hay un administrador activo (riesgo de pérdida de acceso)');
        }

        await supabase.rpc('log_admin_activity', {
          action: 'maintenance_security_audit',
          resource_type: 'system',
          resource_id: null,
          details: {
            action: 'security_audit',
            issues_found: securityIssues.length,
            issues: securityIssues,
            initiated_by: user.email
          }
        });

        return NextResponse.json({ 
          success: true,
          message: securityIssues.length > 0 
            ? `Auditoría completada. Se encontraron ${securityIssues.length} posibles problemas.`
            : 'Auditoría completada. No se encontraron problemas de seguridad.',
          action: 'security_audit',
          issues: securityIssues,
          issues_count: securityIssues.length
        });

      case 'test_email':
        // Send test email using Resend
        try {
          if (!user.email) {
            return NextResponse.json({ error: 'Email del usuario no disponible' }, { status: 400 });
          }

          const { sendEmail } = await import('@/lib/email/client');
          
          const emailResult = await sendEmail({
            to: user.email,
            subject: 'Test Email - Sistema de Mantenimiento',
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .info-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>✅ Email de Prueba</h1>
                      <p>Sistema de Mantenimiento - Da Luz Consciente</p>
                    </div>
                    <div class="content">
                      <p>Este es un email de prueba del sistema de mantenimiento.</p>
                      
                      <div class="info-box">
                        <h3>Información del Test:</h3>
                        <ul>
                          <li><strong>Enviado por:</strong> ${user.email}</li>
                          <li><strong>Fecha:</strong> ${new Date().toLocaleString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</li>
                          <li><strong>Estado:</strong> ✅ Configuración de email funcionando correctamente</li>
                        </ul>
                      </div>
                      
                      <p>Si recibiste este email, significa que la configuración de Resend está funcionando correctamente.</p>
                    </div>
                    <div class="footer">
                      <p>Este es un email automático del sistema de mantenimiento.</p>
                      <p>No respondas a este email.</p>
                    </div>
                  </div>
                </body>
              </html>
            `,
            text: `Email de prueba del sistema de mantenimiento.\n\nEnviado por: ${user.email}\nFecha: ${new Date().toLocaleString('es-AR')}\n\nSi recibiste este email, la configuración de Resend está funcionando correctamente.`
          });

          if (!emailResult.success) {
            return NextResponse.json({ 
              error: 'Error al enviar email',
              details: emailResult.error 
            }, { status: 500 });
          }

          // Log the action
          await supabase.rpc('log_admin_activity', {
            action: 'maintenance_test_email',
            resource_type: 'system',
            resource_id: null,
            details: {
              action: 'test_email',
              test_email_to: user.email,
              email_id: emailResult.id || null,
              initiated_by: user.email
            }
          });

          return NextResponse.json({ 
            success: true,
            message: `Email de prueba enviado exitosamente a ${user.email}`,
            action: 'test_email',
            email_id: emailResult.id || null
          });

        } catch (error) {
          console.error('Error sending test email:', error);
          return NextResponse.json({ 
            error: 'Error al enviar email de prueba',
            details: error instanceof Error ? error.message : 'Error desconocido'
          }, { status: 500 });
        }

      case 'system_status':
        // Generate comprehensive system status report
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        const { count: activeAdmins } = await supabase
          .from('admin_users')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        const { count: totalProducts } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        const { count: recentActivity } = await supabase
          .from('admin_activity_log')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        const statusReport = {
          total_users: totalUsers || 0,
          active_admins: activeAdmins || 0,
          total_products: totalProducts || 0,
          activity_24h: recentActivity || 0,
          timestamp: new Date().toISOString()
        };

        await supabase.rpc('log_admin_activity', {
          action: 'maintenance_system_status',
          resource_type: 'system',
          resource_id: null,
          details: {
            action: 'system_status',
            report: statusReport,
            initiated_by: user.email
          }
        });

        return NextResponse.json({ 
          success: true,
          message: 'Reporte de estado del sistema generado',
          action: 'system_status',
          report: statusReport
        });

      case 'clear_memory':
        // Safely clear Node.js memory by forcing garbage collection
        const memoryBefore = process.memoryUsage();
        const memoryBeforeMB = {
          heapUsed: (memoryBefore.heapUsed / 1024 / 1024).toFixed(2),
          heapTotal: (memoryBefore.heapTotal / 1024 / 1024).toFixed(2),
          external: (memoryBefore.external / 1024 / 1024).toFixed(2)
        };

        // Try to force garbage collection if available
        let gcSuccess = false;
        let gcError = null;
        
        try {
          // Check if --expose-gc flag is enabled
          if (global.gc) {
            global.gc();
            gcSuccess = true;
          } else {
            // If GC is not available, we can't force it
            // In production (Vercel), this is typically not available
            gcError = 'Garbage collection no está disponible. El servidor limpiará memoria automáticamente.';
          }
        } catch (error) {
          gcError = error instanceof Error ? error.message : 'Error desconocido al limpiar memoria';
        }

        // Wait a moment for GC to complete
        await new Promise(resolve => setTimeout(resolve, 500));

        const memoryAfter = process.memoryUsage();
        const memoryAfterMB = {
          heapUsed: (memoryAfter.heapUsed / 1024 / 1024).toFixed(2),
          heapTotal: (memoryAfter.heapTotal / 1024 / 1024).toFixed(2),
          external: (memoryAfter.external / 1024 / 1024).toFixed(2)
        };

        const memoryFreed = (parseFloat(memoryBeforeMB.heapUsed) - parseFloat(memoryAfterMB.heapUsed)).toFixed(2);

        // Log the action
        await supabase.rpc('log_admin_activity', {
          action: 'maintenance_clear_memory',
          resource_type: 'system',
          resource_id: null,
          details: {
            action: 'clear_memory',
            memory_before: memoryBeforeMB,
            memory_after: memoryAfterMB,
            memory_freed_mb: memoryFreed,
            gc_success: gcSuccess,
            gc_error: gcError,
            initiated_by: user.email
          }
        });

        const message = gcSuccess 
          ? `Memoria limpiada: ${memoryFreed} MB liberados (${memoryAfterMB.heapUsed} MB actual)`
          : `Memoria monitoreada. ${gcError || 'El servidor limpiará memoria automáticamente cuando sea necesario.'}`;

        return NextResponse.json({ 
          success: true,
          message,
          action: 'clear_memory',
          memory_before: memoryBeforeMB,
          memory_after: memoryAfterMB,
          memory_freed_mb: parseFloat(memoryFreed),
          gc_success: gcSuccess
        });

      default:
        return NextResponse.json({ error: 'Acción de mantenimiento no válida' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in maintenance API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

