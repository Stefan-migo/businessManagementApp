"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Server,
  Mail,
  Database,
  Shield,
  Activity,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Save,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2,
  Monitor,
  HardDrive,
  Users,
  Package,
  TrendingUp,
  BarChart3,
  Download,
  RotateCcw,
  FileText,
  Calendar,
  CreditCard,
  Truck,
  Globe,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import PaymentConfig from '@/components/admin/PaymentConfig';
import EmailTemplatesManager from '@/components/admin/EmailTemplatesManager';
import ShippingManager from '@/components/admin/ShippingManager';
import WebhookMonitor from '@/components/admin/WebhookMonitor';
import SEOManager from '@/components/admin/SEOManager';

interface SystemConfig {
  id: string;
  config_key: string;
  config_value: any;
  description?: string;
  category: string;
  is_public: boolean;
  is_sensitive: boolean;
  value_type: string;
  updated_at: string;
}

interface HealthMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  category: string;
  is_healthy: boolean;
  collected_at: string;
  threshold_warning?: number;
  threshold_critical?: number;
}

interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  warnings: number;
  criticals: number;
  warning_metrics: HealthMetric[];
  critical_metrics: HealthMetric[];
  last_check: number | null;
}

export default function SystemAdministrationPage() {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const [showSensitive, setShowSensitive] = useState(false);
  const [refreshingHealth, setRefreshingHealth] = useState(false);
  const [maintenanceAction, setMaintenanceAction] = useState<string | null>(null);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  
  // Dialogs for maintenance results
  const [showSecurityAuditDialog, setShowSecurityAuditDialog] = useState(false);
  const [securityAuditResults, setSecurityAuditResults] = useState<{issues: string[], issues_count: number} | null>(null);
  const [showSystemStatusDialog, setShowSystemStatusDialog] = useState(false);
  const [systemStatusReport, setSystemStatusReport] = useState<any>(null);
  const [clearingMemory, setClearingMemory] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [backupResult, setBackupResult] = useState<{
    backup_id: string;
    backup_file: string;
    download_url: string | null;
    download_url_expires_at: string | null;
    tables_count: number;
    total_records: number;
    backup_size_mb: string;
    duration_seconds: string;
  } | null>(null);
  
  // Backup restoration states
  const [availableBackups, setAvailableBackups] = useState<any[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<any | null>(null);
  const [restoringBackup, setRestoringBackup] = useState(false);
  const [showRestoreResultsDialog, setShowRestoreResultsDialog] = useState(false);
  const [restoreResults, setRestoreResults] = useState<any | null>(null);
  const [showDeleteBackupDialog, setShowDeleteBackupDialog] = useState(false);
  const [deletingBackup, setDeletingBackup] = useState(false);

  useEffect(() => {
    fetchSystemData();
    fetchAvailableBackups();
  }, []);

  const fetchAvailableBackups = async () => {
    try {
      setLoadingBackups(true);
      const response = await fetch('/api/admin/system/backups');
      if (!response.ok) {
        throw new Error('Error al cargar backups');
      }
      const data = await response.json();
      setAvailableBackups(data.backups || []);
    } catch (error) {
      console.error('Error fetching backups:', error);
      toast.error('Error al cargar lista de backups');
    } finally {
      setLoadingBackups(false);
    }
  };

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchConfigs(),
        fetchHealthMetrics()
      ]);
      setError(null);
    } catch (err) {
      console.error('Error fetching system data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/admin/system/config');
      if (!response.ok) {
        throw new Error('Failed to fetch system config');
      }

      const data = await response.json();
      setConfigs(data.configs || []);
    } catch (error) {
      console.error('Error fetching configs:', error);
      throw error;
    }
  };

  const fetchHealthMetrics = async () => {
    try {
      const response = await fetch('/api/admin/system/health');
      if (!response.ok) {
        throw new Error('Failed to fetch health metrics');
      }

      const data = await response.json();
      setHealthMetrics(data.latest || []);
      setHealthStatus(data.health_status);
    } catch (error) {
      console.error('Error fetching health metrics:', error);
      throw error;
    }
  };

  const handleUpdateConfig = async (configKey: string, newValue: any) => {
    try {
      const response = await fetch('/api/admin/system/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates: [{ config_key: configKey, config_value: newValue }]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update config');
      }

      const data = await response.json();
      const result = data.results[0];
      
      if (result.success) {
        toast.success('Configuración actualizada exitosamente');
        fetchConfigs();
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Error updating config:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar configuración');
    }
  };

  const handleRefreshHealth = async () => {
    try {
      setRefreshingHealth(true);
      
      // First collect new metrics
      const collectResponse = await fetch('/api/admin/system/health', { method: 'POST' });
      if (!collectResponse.ok) {
        const errorData = await collectResponse.json();
        throw new Error(errorData.error || 'Failed to collect health metrics');
      }

      const collectData = await collectResponse.json();
      toast.success(`Métricas recolectadas: ${collectData.metrics_collected || 0} nuevas métricas`);
      
      // Then fetch the updated metrics
      await fetchHealthMetrics();

    } catch (error) {
      console.error('Error refreshing health:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar métricas de salud');
    } finally {
      setRefreshingHealth(false);
    }
  };

  const getHealthStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string; icon: any }> = {
      healthy: { variant: 'default', label: 'Saludable', icon: CheckCircle },
      warning: { variant: 'secondary', label: 'Advertencias', icon: AlertTriangle },
      critical: { variant: 'destructive', label: 'Crítico', icon: XCircle }
    };

    const statusConfig = config[status] || config['healthy'];
    const Icon = statusConfig.icon;

    return (
      <Badge variant={statusConfig.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      general: Settings,
      contact: Mail,
      ecommerce: Package,
      inventory: HardDrive,
      membership: Users,
      email: Mail,
      system: Server,
      database: Database,
      business: BarChart3
    };

    return icons[category] || Settings;
  };

  const translateConfigKey = (key: string): string => {
    const translations: Record<string, string> = {
      // General
      'site_name': 'Nombre del Sitio',
      'site_description': 'Descripción del Sitio',
      
      // Contact
      'address': 'Dirección',
      'contact_email': 'Email de Contacto',
      'phone_number': 'Número de Teléfono',
      'support_email': 'Email de Soporte',
      
      // E-commerce
      'currency': 'Moneda',
      'tax_rate': 'Tasa de Impuesto (IVA)',
      'shipping_cost': 'Costo de Envío',
      'free_shipping_threshold': 'Umbral de Envío Gratis',
      
      // Inventory
      'low_stock_threshold': 'Umbral de Stock Bajo',
      'auto_low_stock_alerts': 'Alertas Automáticas de Stock',
      
      // Membership
      'membership_trial_days': 'Días de Prueba',
      'membership_reminder_days': 'Días de Recordatorio',
      
      // Email
      'smtp_host': 'Servidor SMTP',
      'smtp_port': 'Puerto SMTP',
      'smtp_username': 'Usuario SMTP',
      'smtp_password': 'Contraseña SMTP',
      
      // System
      'maintenance_mode': 'Modo Mantenimiento',
    };

    return translations[key] || key.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatMetricValue = (value: number, unit?: string) => {
    if (unit === 'megabytes') {
      return `${value.toFixed(1)} MB`;
    }
    if (unit === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    if (unit === 'seconds') {
      return `${value.toFixed(2)}s`;
    }
    if (unit === 'count') {
      return Math.round(value).toString();
    }
    return value.toString();
  };

  const translateMetricName = (name: string): string => {
    const translations: Record<string, string> = {
      'database_response_time': 'Tiempo de Respuesta de Base de Datos',
      'total_users': 'Total de Usuarios',
      'active_admin_users': 'Administradores Activos',
      'admin_activity_24h': 'Actividad Admin (24h)',
      'memory_usage': 'Uso de Memoria',
      'database_records': 'Registros en Base de Datos',
    };

    return translations[name] || name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getMetricResolution = (metric: HealthMetric): string => {
    const resolutions: Record<string, string> = {
      'database_response_time': 'Verificar conexión a la base de datos y optimizar consultas lentas.',
      'total_users': 'Este es un límite de advertencia. El sistema puede manejar más usuarios.',
      'active_admin_users': 'Revisar si hay administradores inactivos que deberían ser eliminados.',
      'admin_activity_24h': 'Monitorear actividad inusual. Puede indicar uso intensivo del sistema.',
      'memory_usage': 'Usar el botón "Limpiar Memoria" para liberar memoria de forma segura.',
      'database_records': 'Considerar archivar datos antiguos o optimizar la base de datos.',
    };

    return resolutions[metric.metric_name] || 'Revisar la configuración del sistema y contactar al administrador si persiste.';
  };

  const handleDownloadBackup = (downloadUrl: string, fileName: string) => {
    if (!downloadUrl) {
      toast.error('URL de descarga no disponible');
      return;
    }

    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Descarga iniciada');
  };

  const handleRestoreBackup = async (backup: any) => {
    setSelectedBackup(backup);
    setShowRestoreDialog(true);
  };

  const confirmRestoreBackup = async () => {
    if (!selectedBackup) return;

    try {
      setRestoringBackup(true);
      setShowRestoreDialog(false);

      const response = await fetch('/api/admin/system/backups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backup_filename: selectedBackup.filename,
          create_safety_backup: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al restaurar backup');
      }

      const data = await response.json();
      setRestoreResults(data);
      setShowRestoreResultsDialog(true);
      toast.success(data.message || 'Backup restaurado exitosamente');
      
      // Refresh backups list and system data
      await fetchAvailableBackups();
      await fetchSystemData();

    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error(error instanceof Error ? error.message : 'Error al restaurar backup');
    } finally {
      setRestoringBackup(false);
      setSelectedBackup(null);
    }
  };

  const handleDeleteBackup = (backup: any) => {
    setSelectedBackup(backup);
    setShowDeleteBackupDialog(true);
  };

  const handleViewBackupDetails = async (backup: any) => {
    try {
      // Fetch backup details and download URL
      const response = await fetch(`/api/admin/system/backups?filename=${encodeURIComponent(backup.filename)}&action=details`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar detalles del backup');
      }

      const data = await response.json();
      
      // Format data to match backupResult structure
      setBackupResult({
        backup_id: data.backup_id,
        backup_file: data.backup_file,
        download_url: data.download_url,
        download_url_expires_at: data.download_url_expires_at,
        tables_count: data.tables_count,
        total_records: data.total_records,
        backup_size_mb: data.backup_size_mb,
        duration_seconds: 'N/A' // Not available for existing backups
      });
      
      setShowBackupDialog(true);
    } catch (error) {
      console.error('Error loading backup details:', error);
      toast.error(error instanceof Error ? error.message : 'Error al cargar detalles del backup');
    }
  };

  const confirmDeleteBackup = async () => {
    if (!selectedBackup) return;

    try {
      setDeletingBackup(true);

      const response = await fetch(`/api/admin/system/backups?filename=${encodeURIComponent(selectedBackup.filename)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar backup');
      }

      const data = await response.json();
      toast.success(data.message || 'Backup eliminado exitosamente');
      
      // Refresh backups list
      await fetchAvailableBackups();
      
      // Close dialog
      setShowDeleteBackupDialog(false);
      setSelectedBackup(null);

    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar backup');
    } finally {
      setDeletingBackup(false);
    }
  };

  const handleClearMemory = async () => {
    try {
      setClearingMemory(true);
      
      const response = await fetch('/api/admin/system/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clear_memory' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al limpiar memoria');
      }

      const data = await response.json();
      toast.success(data.message || 'Memoria limpiada exitosamente');
      
      // Refresh health metrics to see updated memory usage
      await fetchHealthMetrics();

    } catch (error) {
      console.error('Error clearing memory:', error);
      toast.error(error instanceof Error ? error.message : 'Error al limpiar memoria');
    } finally {
      setClearingMemory(false);
    }
  };

  const handleMaintenanceAction = async (action: string) => {
    try {
      setMaintenanceLoading(true);
      setMaintenanceAction(action);

      const response = await fetch('/api/admin/system/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al ejecutar acción de mantenimiento');
      }

      const data = await response.json();
      toast.success(data.message || 'Acción de mantenimiento completada');
      
      // Show detailed results for specific actions
      if (action === 'security_audit' && data.issues) {
        setSecurityAuditResults({
          issues: data.issues || [],
          issues_count: data.issues_count || 0
        });
        setShowSecurityAuditDialog(true);
      } else if (action === 'system_status' && data.report) {
        setSystemStatusReport(data.report);
        setShowSystemStatusDialog(true);
      } else if (action === 'backup_database' && data.backup_id) {
        setBackupResult({
          backup_id: data.backup_id,
          backup_file: data.backup_file,
          download_url: data.download_url || null,
          download_url_expires_at: data.download_url_expires_at || null,
          tables_count: data.tables_count || 0,
          total_records: data.total_records || 0,
          backup_size_mb: data.backup_size_mb || '0',
          duration_seconds: data.duration_seconds || '0'
        });
        setShowBackupDialog(true);
      }
      
      // Refresh system data after maintenance
      await fetchSystemData();

    } catch (error) {
      console.error('Error executing maintenance action:', error);
      toast.error(error instanceof Error ? error.message : 'Error al ejecutar acción de mantenimiento');
    } finally {
      setMaintenanceLoading(false);
      setMaintenanceAction(null);
    }
  };

  const filteredConfigs = configs.filter(config => {
    if (categoryFilter !== 'all' && config.category !== categoryFilter) return false;
    if (config.is_sensitive && !showSensitive) return false;
    return true;
  });

  const configsByCategory = filteredConfigs.reduce((acc: any, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-azul-profundo">Administración del Sistema</h1>
            <p className="text-tierra-media">Cargando configuración del sistema...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-azul-profundo">Administración del Sistema</h1>
            <p className="text-tierra-media">Error al cargar los datos</p>
          </div>
        </div>
        <Card>
          <CardContent className="text-center py-16">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">Error al cargar sistema</h3>
            <p className="text-tierra-media mb-4">{error}</p>
            <Button onClick={fetchSystemData}>Reintentar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-azul-profundo">Administración del Sistema</h1>
          <p className="text-tierra-media">
            Configuración, monitoreo y mantenimiento del sistema
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefreshHealth} disabled={refreshingHealth}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshingHealth ? 'animate-spin' : ''}`} />
            Actualizar Estado
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-tierra-media">Estado del Sistema</p>
                {healthStatus && getHealthStatusBadge(healthStatus.status)}
              </div>
              <Monitor className="h-8 w-8 text-azul-profundo" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm text-tierra-media">Advertencias</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {healthStatus?.warnings || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm text-tierra-media">Críticos</p>
                <p className="text-2xl font-bold text-red-600">
                  {healthStatus?.criticals || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-verde-suave" />
              <div className="ml-4">
                <p className="text-sm text-tierra-media">Última Verificación</p>
                <p className="text-sm font-medium text-verde-suave">
                  {healthStatus?.last_check 
                    ? new Date(healthStatus.last_check).toLocaleTimeString('es-AR')
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex w-full justify-between gap-1 h-auto">
          <TabsTrigger value="overview" className="flex-1">Resumen</TabsTrigger>
          <TabsTrigger value="config" className="flex-1">Configuración</TabsTrigger>
          <TabsTrigger value="pagos" className="flex-1">
            <CreditCard className="h-4 w-4 mr-1" />
            Pagos
          </TabsTrigger>
          <TabsTrigger value="email" className="flex-1">
            <Mail className="h-4 w-4 mr-1" />
            Email
          </TabsTrigger>
          <TabsTrigger value="envios" className="flex-1">
            <Truck className="h-4 w-4 mr-1" />
            Envíos
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex-1">
            <Globe className="h-4 w-4 mr-1" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex-1">
            <Zap className="h-4 w-4 mr-1" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="health" className="flex-1">Salud</TabsTrigger>
          <TabsTrigger value="maintenance" className="flex-1">Mantenimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="justify-start" onClick={() => setActiveTab('config')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configuración
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => setActiveTab('pagos')}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pagos
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => setActiveTab('email')}>
                    <Mail className="h-4 w-4 mr-2" />
                    Plantillas Email
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => setActiveTab('envios')}>
                    <Truck className="h-4 w-4 mr-2" />
                    Envíos
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => setActiveTab('seo')}>
                    <Globe className="h-4 w-4 mr-2" />
                    SEO
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => setActiveTab('webhooks')}>
                    <Zap className="h-4 w-4 mr-2" />
                    Webhooks
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => setActiveTab('health')}>
                    <Activity className="h-4 w-4 mr-2" />
                    Salud del Sistema
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => setActiveTab('maintenance')}>
                    <Database className="h-4 w-4 mr-2" />
                    Mantenimiento
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* System Metrics Summary */}
            <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Métricas del Sistema
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleRefreshHealth} disabled={refreshingHealth}>
                    <RefreshCw className={`h-3 w-3 ${refreshingHealth ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {healthMetrics.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-tierra-media mx-auto mb-4 opacity-50" />
                    <p className="text-sm text-tierra-media mb-4">No hay métricas disponibles</p>
                    <Button variant="outline" size="sm" onClick={handleRefreshHealth} disabled={refreshingHealth}>
                      <RefreshCw className={`h-3 w-3 mr-2 ${refreshingHealth ? 'animate-spin' : ''}`} />
                      Recolectar Métricas
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {healthMetrics.slice(0, 6).map((metric) => (
                      <div key={metric.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            metric.is_healthy ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-sm">
                            {translateMetricName(metric.metric_name)}
                          </span>
                        </div>
                        <span className="font-medium">
                          {formatMetricValue(metric.metric_value, metric.metric_unit)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          {/* Header con información */}
          <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Configuración del Sistema
                </div>
                <Badge variant="outline">
                  {configs.length} {configs.length === 1 ? 'configuración' : 'configuraciones'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-tierra-media">
                Gestiona las configuraciones del sistema. Los cambios se aplican inmediatamente.
              </p>
            </CardContent>
          </Card>

          {/* Filtros */}
          <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex-1">
                  <Label className="text-sm font-medium mb-2 block">Filtrar por Categoría</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full md:w-[250px]">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {Array.from(new Set(configs.map(c => c.category))).map(category => {
                        const categoryNames: Record<string, string> = {
                          general: 'General',
                          contact: 'Contacto',
                          ecommerce: 'E-commerce',
                          inventory: 'Inventario',
                          membership: 'Membresías',
                          email: 'Correo Electrónico',
                          system: 'Sistema',
                          database: 'Base de Datos',
                          business: 'Negocio'
                        };
                        return (
                          <SelectItem key={category} value={category}>
                            {categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Opciones</Label>
                  <Button
                    variant="outline"
                    onClick={() => setShowSensitive(!showSensitive)}
                    className="w-full md:w-auto"
                  >
                    {showSensitive ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Ocultar Configuraciones Sensibles
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Mostrar Configuraciones Sensibles
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuraciones por Categoría */}
          {Object.keys(configsByCategory).length === 0 ? (
            <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
              <CardContent className="p-12 text-center">
                <Settings className="h-12 w-12 text-tierra-media mx-auto mb-4 opacity-50" />
                <p className="text-tierra-media">No se encontraron configuraciones con los filtros seleccionados</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(configsByCategory).map(([category, categoryConfigs]) => {
              const Icon = getCategoryIcon(category);
              const categoryNames: Record<string, string> = {
                general: 'General',
                contact: 'Contacto',
                ecommerce: 'E-commerce',
                inventory: 'Inventario',
                membership: 'Membresías',
                email: 'Correo Electrónico',
                system: 'Sistema',
                database: 'Base de Datos',
                business: 'Negocio'
              };
              
              return (
                <Card key={category} className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Icon className="h-5 w-5 mr-2" />
                        {categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1)}
                      </div>
                      <Badge variant="default">
                        {(categoryConfigs as SystemConfig[]).length} {(categoryConfigs as SystemConfig[]).length === 1 ? 'configuración' : 'configuraciones'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(categoryConfigs as SystemConfig[]).map((config) => (
                        <div key={config.id} className="p-4 bg-admin-bg-tertiary border border-gray-200 dark:border-gray-700 rounded-lg hover:border-admin-accent-tertiary transition-colors">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-azul-profundo">{translateConfigKey(config.config_key)}</h4>
                                  {config.is_sensitive && (
                                    <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-200">
                                      <Shield className="h-3 w-3 mr-1" />
                                      Sensible
                                    </Badge>
                                  )}
                                  {config.is_public && (
                                    <Badge variant="outline" className="text-xs">
                                      Público
                                    </Badge>
                                  )}
                                </div>
                                {config.description && (
                                  <p className="text-sm text-tierra-media mt-1">{config.description}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-end gap-4">
                              <div className="flex-1">
                                <Label className="text-xs text-tierra-media mb-1 block">Valor</Label>
                                {config.value_type === 'boolean' ? (
                                  <Select
                                    value={config.config_value.toString()}
                                    onValueChange={(value) => 
                                      handleUpdateConfig(config.config_key, value === 'true')
                                    }
                                  >
                                    <SelectTrigger className="w-full md:w-[180px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="true">Verdadero</SelectItem>
                                      <SelectItem value="false">Falso</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : config.value_type === 'number' ? (
                                  <Input
                                    type="number"
                                    value={config.config_value}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      handleUpdateConfig(config.config_key, value);
                                    }}
                                    className="w-full md:w-[200px]"
                                  />
                                ) : (
                                  <Input
                                    type="text"
                                    value={config.config_value}
                                    onChange={(e) => {
                                      handleUpdateConfig(config.config_key, e.target.value);
                                    }}
                                    className="w-full md:w-[400px]"
                                  />
                                )}
                              </div>
                              
                              <div className="text-right">
                                <p className="text-xs text-tierra-media">
                                  Actualizado
                                </p>
                                <p className="text-xs font-medium">
                                  {new Date(config.updated_at).toLocaleDateString('es-AR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="pagos" className="space-y-6">
          <PaymentConfig 
            configs={configs.filter(c => c.category === 'payments')}
            onUpdate={handleUpdateConfig}
          />
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <EmailTemplatesManager />
        </TabsContent>

        <TabsContent value="envios" className="space-y-6">
          <ShippingManager />
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <SEOManager />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <WebhookMonitor />
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Metrics */}
            <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Métricas de Salud
                  </div>
                  <Button variant="outline" size="sm" onClick={handleRefreshHealth}>
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {healthMetrics.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-tierra-media mx-auto mb-4 opacity-50" />
                    <p className="text-sm text-tierra-media mb-4">No hay métricas de salud disponibles</p>
                    <Button variant="outline" size="sm" onClick={handleRefreshHealth} disabled={refreshingHealth}>
                      <RefreshCw className={`h-3 w-3 mr-2 ${refreshingHealth ? 'animate-spin' : ''}`} />
                      Recolectar Métricas
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Métrica</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {healthMetrics.map((metric) => (
                      <TableRow key={metric.id}>
                        <TableCell className="capitalize">
                          {translateMetricName(metric.metric_name)}
                        </TableCell>
                          <TableCell>
                            {formatMetricValue(metric.metric_value, metric.metric_unit)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={metric.is_healthy ? 'healty' : 'destructive'}>
                              {metric.is_healthy ? 'Saludable' : 'Problema'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Critical Issues */}
            {healthStatus && (healthStatus.critical_metrics.length > 0 || healthStatus.warning_metrics.length > 0) && (
              <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Problemas Detectados
                    </div>
                    {healthStatus.critical_metrics.some(m => m.metric_name === 'memory_usage') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleClearMemory}
                        disabled={clearingMemory}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${clearingMemory ? 'animate-spin' : ''}`} />
                        Limpiar Memoria
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {healthStatus.critical_metrics.map((metric) => (
                      <div key={metric.id} className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-semibold text-red-700 dark:text-red-400">Crítico</span>
                              <Badge variant="destructive" className="text-xs">Requiere Acción</Badge>
                            </div>
                            <p className="font-medium text-red-800 dark:text-red-300 mb-1">
                              {translateMetricName(metric.metric_name)}
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-400 mb-2">
                              Valor actual: <span className="font-semibold">{formatMetricValue(metric.metric_value, metric.metric_unit)}</span>
                              {metric.threshold_critical && (
                                <span className="ml-2 text-xs">
                                  (Límite crítico: {formatMetricValue(metric.threshold_critical, metric.metric_unit)})
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-900/30 p-2 rounded mt-2">
                              <strong>Resolución:</strong> {getMetricResolution(metric)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {healthStatus.warning_metrics.map((metric) => (
                      <div key={metric.id} className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-yellow-700 dark:text-yellow-400">Advertencia</span>
                              </div>
                              {metric.metric_name === 'memory_usage' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={handleClearMemory}
                                  disabled={clearingMemory}
                                  className="h-7 text-xs"
                                >
                                  <RefreshCw className={`h-3 w-3 mr-1 ${clearingMemory ? 'animate-spin' : ''}`} />
                                  Limpiar
                                </Button>
                              )}
                            </div>
                            <p className="font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                              {translateMetricName(metric.metric_name)}
                            </p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-400">
                              Valor actual: <span className="font-semibold">{formatMetricValue(metric.metric_value, metric.metric_unit)}</span>
                              {metric.threshold_warning && (
                                <span className="ml-2 text-xs">
                                  (Límite de advertencia: {formatMetricValue(metric.threshold_warning, metric.metric_unit)})
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="h-5 w-5 mr-2" />
                Herramientas de Mantenimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4 flex-col items-start"
                  onClick={() => handleMaintenanceAction('backup_database')}
                  disabled={maintenanceLoading}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Database className="h-5 w-5" />
                    <span className="font-medium">Backup Base de Datos</span>
                  </div>
                  <p className="text-sm text-tierra-media">Crear copia de seguridad</p>
                  {maintenanceAction === 'backup_database' && maintenanceLoading && (
                    <RefreshCw className="h-3 w-3 animate-spin mt-2" />
                  )}
                </Button>

                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4 flex-col items-start"
                  onClick={() => handleMaintenanceAction('clean_logs')}
                  disabled={maintenanceLoading}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Trash2 className="h-5 w-5" />
                    <span className="font-medium">Limpiar Logs</span>
                  </div>
                  <p className="text-sm text-tierra-media">Eliminar logs antiguos</p>
                  {maintenanceAction === 'clean_logs' && maintenanceLoading && (
                    <RefreshCw className="h-3 w-3 animate-spin mt-2" />
                  )}
                </Button>

                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4 flex-col items-start"
                  onClick={() => handleMaintenanceAction('optimize_database')}
                  disabled={maintenanceLoading}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <RefreshCw className="h-5 w-5" />
                    <span className="font-medium">Optimizar DB</span>
                  </div>
                  <p className="text-sm text-tierra-media">Optimizar rendimiento</p>
                  {maintenanceAction === 'optimize_database' && maintenanceLoading && (
                    <RefreshCw className="h-3 w-3 animate-spin mt-2" />
                  )}
                </Button>

                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4 flex-col items-start"
                  onClick={() => handleMaintenanceAction('security_audit')}
                  disabled={maintenanceLoading}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-5 w-5" />
                    <span className="font-medium">Verificar Seguridad</span>
                  </div>
                  <p className="text-sm text-tierra-media">Auditoría de seguridad</p>
                  {maintenanceAction === 'security_audit' && maintenanceLoading && (
                    <RefreshCw className="h-3 w-3 animate-spin mt-2" />
                  )}
                </Button>

                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4 flex-col items-start"
                  onClick={() => handleMaintenanceAction('test_email')}
                  disabled={maintenanceLoading}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Mail className="h-5 w-5" />
                    <span className="font-medium">Test Email</span>
                  </div>
                  <p className="text-sm text-tierra-media">Probar configuración email</p>
                  {maintenanceAction === 'test_email' && maintenanceLoading && (
                    <RefreshCw className="h-3 w-3 animate-spin mt-2" />
                  )}
                </Button>

                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4 flex-col items-start"
                  onClick={() => handleMaintenanceAction('system_status')}
                  disabled={maintenanceLoading}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Monitor className="h-5 w-5" />
                    <span className="font-medium">Estado Sistema</span>
                  </div>
                  <p className="text-sm text-tierra-media">Reporte completo</p>
                  {maintenanceAction === 'system_status' && maintenanceLoading && (
                    <RefreshCw className="h-3 w-3 animate-spin mt-2" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Available Backups List */}
          <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Backups Disponibles
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={fetchAvailableBackups}
                  disabled={loadingBackups}
                >
                  <RefreshCw className={`h-4 w-4 ${loadingBackups ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBackups ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 text-tierra-media mx-auto mb-4 animate-spin" />
                  <p className="text-sm text-tierra-media">Cargando backups...</p>
                </div>
              ) : availableBackups.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-tierra-media mx-auto mb-4 opacity-50" />
                  <p className="text-sm text-tierra-media mb-2">No hay backups disponibles</p>
                  <p className="text-xs text-tierra-media">Crea un backup usando el botón "Backup Base de Datos"</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableBackups.map((backup) => (
                    <div 
                      key={backup.id} 
                      className="p-4 bg-admin-bg-tertiary border border-gray-200 dark:border-gray-700 rounded-lg hover:border-admin-accent-tertiary transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Database className="h-4 w-4 text-azul-profundo" />
                            <span className="font-semibold text-sm">{backup.id}</span>
                            {backup.filename.includes('safety_backup') && (
                              <Badge variant="outline" className="text-xs bg-yellow-50">
                                Backup de Seguridad
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-tierra-media">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {backup.created_at 
                                  ? new Date(backup.created_at).toLocaleDateString('es-AR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })
                                  : 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <span>{backup.size_mb} MB</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {backup.created_at 
                                  ? new Date(backup.created_at).toLocaleTimeString('es-AR', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs">{backup.filename}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewBackupDetails(backup)}
                            disabled={restoringBackup || deletingBackup}
                            className="text-xs"
                            title="Ver detalles y descargar"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreBackup(backup)}
                            disabled={restoringBackup || deletingBackup}
                            className="text-xs"
                          >
                            <RotateCcw className={`h-3 w-3 mr-1 ${restoringBackup ? 'animate-spin' : ''}`} />
                            Restaurar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBackup(backup)}
                            disabled={restoringBackup || deletingBackup}
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Security Audit Results Dialog */}
      <Dialog open={showSecurityAuditDialog} onOpenChange={setShowSecurityAuditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Resultados de Auditoría de Seguridad
            </DialogTitle>
            <DialogDescription>
              Revisión de seguridad del sistema completada
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {securityAuditResults && securityAuditResults.issues_count > 0 ? (
              <>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-800 dark:text-yellow-300">
                      Se encontraron {securityAuditResults.issues_count} {securityAuditResults.issues_count === 1 ? 'problema' : 'problemas'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Problemas Detectados:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {securityAuditResults.issues.map((issue, index) => (
                      <li key={index} className="text-sm text-tierra-media pl-2">
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800 dark:text-green-300">
                    No se encontraron problemas de seguridad
                  </span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-400 mt-2">
                  El sistema está configurado correctamente desde el punto de vista de seguridad.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowSecurityAuditDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* System Status Report Dialog */}
      <Dialog open={showSystemStatusDialog} onOpenChange={setShowSystemStatusDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Reporte de Estado del Sistema
            </DialogTitle>
            <DialogDescription>
              Información completa del estado actual del sistema
            </DialogDescription>
          </DialogHeader>
          
          {systemStatusReport && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-admin-bg-tertiary">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-azul-profundo" />
                      <span className="text-xs text-tierra-media">Usuarios Totales</span>
                    </div>
                    <p className="text-2xl font-bold">{systemStatusReport.total_users || 0}</p>
                  </CardContent>
                </Card>

                <Card className="bg-admin-bg-tertiary">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-verde-suave" />
                      <span className="text-xs text-tierra-media">Admins Activos</span>
                    </div>
                    <p className="text-2xl font-bold">{systemStatusReport.active_admins || 0}</p>
                  </CardContent>
                </Card>

                <Card className="bg-admin-bg-tertiary">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-admin-accent-tertiary" />
                      <span className="text-xs text-tierra-media">Productos</span>
                    </div>
                    <p className="text-2xl font-bold">{systemStatusReport.total_products || 0}</p>
                  </CardContent>
                </Card>

                <Card className="bg-admin-bg-tertiary">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-yellow-500" />
                      <span className="text-xs text-tierra-media">Actividad 24h</span>
                    </div>
                    <p className="text-2xl font-bold">{systemStatusReport.activity_24h || 0}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Information */}
              <Card className="bg-admin-bg-tertiary">
                <CardHeader>
                  <CardTitle className="text-sm">Información Detallada</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-tierra-media">Fecha del Reporte:</span>
                      <span className="font-medium">
                        {systemStatusReport.timestamp 
                          ? new Date(systemStatusReport.timestamp).toLocaleString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tierra-media">Usuarios Registrados:</span>
                      <span className="font-medium">{systemStatusReport.total_users || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tierra-media">Administradores Activos:</span>
                      <span className="font-medium">{systemStatusReport.active_admins || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tierra-media">Productos en Sistema:</span>
                      <span className="font-medium">{systemStatusReport.total_products || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tierra-media">Actividad Admin (últimas 24h):</span>
                      <span className="font-medium">{systemStatusReport.activity_24h || 0} acciones</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowSystemStatusDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Results Dialog */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {backupResult?.duration_seconds && backupResult.duration_seconds !== 'N/A' 
                ? 'Backup de Base de Datos Completado'
                : 'Detalles del Backup'}
            </DialogTitle>
            <DialogDescription>
              {backupResult?.duration_seconds && backupResult.duration_seconds !== 'N/A'
                ? 'El backup se ha guardado exitosamente en el almacenamiento'
                : 'Información del backup y opción de descarga'}
            </DialogDescription>
          </DialogHeader>
          
          {backupResult && (
            <div className="space-y-4">
              {/* Success Message - Only show for newly created backups */}
              {backupResult.duration_seconds && backupResult.duration_seconds !== 'N/A' && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800 dark:text-green-300">
                      Backup creado exitosamente
                    </span>
                  </div>
                </div>
              )}

              {/* Backup Information */}
              <Card className="bg-admin-bg-tertiary">
                <CardHeader>
                  <CardTitle className="text-sm">Información del Backup</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-tierra-media">ID del Backup:</span>
                      <span className="font-mono text-xs">{backupResult.backup_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tierra-media">Archivo:</span>
                      <span className="font-medium">{backupResult.backup_file}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tierra-media">Tablas respaldadas:</span>
                      <span className="font-medium">{backupResult.tables_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tierra-media">Total de registros:</span>
                      <span className="font-medium">{backupResult.total_records.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tierra-media">Tamaño:</span>
                      <span className="font-medium">{backupResult.backup_size_mb} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tierra-media">Tiempo de ejecución:</span>
                      <span className="font-medium">{backupResult.duration_seconds}s</span>
                    </div>
                    {backupResult.download_url_expires_at && (
                      <div className="flex justify-between">
                        <span className="text-tierra-media">URL expira:</span>
                        <span className="font-medium text-xs">
                          {new Date(backupResult.download_url_expires_at).toLocaleString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Download Section */}
              {backupResult.download_url ? (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                    El backup está guardado en el almacenamiento. Puedes descargarlo ahora o más tarde desde Supabase Storage.
                  </p>
                  <Button 
                    onClick={() => handleDownloadBackup(backupResult.download_url!, backupResult.backup_file)}
                    className="w-full"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Descargar Backup Ahora
                  </Button>
                  {backupResult.download_url_expires_at && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 text-center">
                      La URL de descarga expira en {Math.round((new Date(backupResult.download_url_expires_at).getTime() - Date.now()) / 1000 / 60)} minutos
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    El backup se guardó correctamente, pero no se pudo generar la URL de descarga. 
                    Puedes acceder al backup desde Supabase Storage.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBackupDialog(false)}>
              Cerrar
            </Button>
            {backupResult?.download_url && (
              <Button 
                onClick={() => handleDownloadBackup(backupResult.download_url!, backupResult.backup_file)}
              >
                <Database className="h-4 w-4 mr-2" />
                Descargar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Backup Confirmation Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirmar Restauración de Backup
            </DialogTitle>
            <DialogDescription>
              Esta acción restaurará la base de datos a un punto anterior. Se creará un backup de seguridad automático antes de restaurar.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBackup && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                      ⚠️ Advertencia Importante
                    </p>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1 list-disc list-inside">
                      <li>Se creará un backup de seguridad automático antes de restaurar</li>
                      <li>Todos los datos actuales serán reemplazados por los del backup</li>
                      <li>Esta acción no se puede deshacer fácilmente</li>
                      <li>Asegúrate de tener un backup reciente antes de continuar</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Card className="bg-admin-bg-tertiary">
                <CardHeader>
                  <CardTitle className="text-sm">Información del Backup a Restaurar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-tierra-media">ID del Backup:</span>
                      <span className="font-mono text-xs">{selectedBackup.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tierra-media">Archivo:</span>
                      <span className="font-medium">{selectedBackup.filename}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tierra-media">Tamaño:</span>
                      <span className="font-medium">{selectedBackup.size_mb} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tierra-media">Fecha de creación:</span>
                      <span className="font-medium">
                        {selectedBackup.created_at 
                          ? new Date(selectedBackup.created_at).toLocaleString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmRestoreBackup}
              disabled={restoringBackup}
            >
              {restoringBackup ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Restaurando...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Confirmar Restauración
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Results Dialog */}
      <Dialog open={showRestoreResultsDialog} onOpenChange={setShowRestoreResultsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Resultados de Restauración
            </DialogTitle>
            <DialogDescription>
              Restauración de backup completada
            </DialogDescription>
          </DialogHeader>
          
          {restoreResults && (
            <div className="space-y-4">
              {/* Success Message */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800 dark:text-green-300">
                    Restauración completada exitosamente
                  </span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-400 mt-2">
                  {restoreResults.total_records_restored} registros restaurados en {restoreResults.tables_restored} tablas
                </p>
              </div>

              {/* Summary Information */}
              <Card className="bg-admin-bg-tertiary">
                <CardHeader>
                  <CardTitle className="text-sm">Resumen de Restauración</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-tierra-media">Backup restaurado:</span>
                      <span className="font-medium">{restoreResults.backup_file}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tierra-media">Backup ID:</span>
                      <span className="font-mono text-xs">{restoreResults.backup_id}</span>
                    </div>
                    {restoreResults.safety_backup_id && (
                      <div className="flex justify-between">
                        <span className="text-tierra-media">Backup de seguridad creado:</span>
                        <span className="font-mono text-xs">{restoreResults.safety_backup_id}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-tierra-media">Tablas restauradas:</span>
                      <span className="font-medium">{restoreResults.tables_restored}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tierra-media">Total de registros:</span>
                      <span className="font-medium">{restoreResults.total_records_restored.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tierra-media">Tiempo de ejecución:</span>
                      <span className="font-medium">{restoreResults.duration_seconds}s</span>
                    </div>
                    {restoreResults.errors > 0 && (
                      <div className="flex justify-between">
                        <span className="text-tierra-media">Errores:</span>
                        <span className="font-medium text-red-600">{restoreResults.errors}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Results by Table */}
              {restoreResults.restore_results && (
                <Card className="bg-admin-bg-tertiary">
                  <CardHeader>
                    <CardTitle className="text-sm">Resultados por Tabla</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(restoreResults.restore_results).map(([tableName, result]: [string, any]) => (
                        <div 
                          key={tableName}
                          className={`p-3 rounded-lg border ${
                            result.status === 'success' 
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              : result.status === 'error'
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {result.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                              {result.status === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                              {(result.status === 'partial' || result.status === 'skipped') && (
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              )}
                              <span className="font-medium text-sm capitalize">{tableName}</span>
                            </div>
                            <div className="text-xs text-tierra-media">
                              {result.status === 'success' && (
                                <span className="text-green-700 dark:text-green-400">
                                  {result.records_restored} registros
                                </span>
                              )}
                              {result.status === 'partial' && (
                                <span className="text-yellow-700 dark:text-yellow-400">
                                  {result.records_restored}/{result.records_total} registros
                                </span>
                              )}
                              {result.status === 'skipped' && (
                                <span className="text-tierra-media">{result.reason}</span>
                              )}
                              {result.status === 'error' && (
                                <span className="text-red-700 dark:text-red-400">Error</span>
                              )}
                            </div>
                          </div>
                          {result.note && (
                            <div className="mt-2 ml-6 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-400">
                              ℹ️ {result.note}
                            </div>
                          )}
                          {result.error && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 ml-6">
                              {result.error}
                            </p>
                          )}
                          {result.error_message && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 ml-6 font-semibold">
                              Error: {result.error_message}
                            </p>
                          )}
                          {result.problematic_records && result.problematic_records.length > 0 && (
                            <div className="mt-2 ml-6 space-y-1">
                              <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                                Registros problemáticos ({result.problematic_records.length}):
                              </p>
                              {result.problematic_records.map((pr: any, idx: number) => (
                                <div key={idx} className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
                                  <p className="font-medium">{pr.error}</p>
                                  {pr.details && <p className="text-xs mt-1 opacity-75">{pr.details}</p>}
                                  {pr.record && pr.record.id && (
                                    <p className="text-xs mt-1 font-mono opacity-75">ID: {pr.record.id}</p>
                                  )}
                                  {pr.record && pr.record.slug && (
                                    <p className="text-xs mt-1 opacity-75">Slug: {pr.record.slug}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowRestoreResultsDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Backup Confirmation Dialog */}
      <Dialog open={showDeleteBackupDialog} onOpenChange={setShowDeleteBackupDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar Eliminación de Backup
            </DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente el archivo de backup. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBackup && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-800 dark:text-red-300 mb-2">
                      ⚠️ Advertencia
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-400">
                      El backup será eliminado permanentemente del almacenamiento. Asegúrate de haber descargado el backup si lo necesitas más tarde.
                    </p>
                  </div>
                </div>
              </div>

              <Card className="bg-admin-bg-tertiary">
                <CardHeader>
                  <CardTitle className="text-sm">Información del Backup a Eliminar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-tierra-media">ID del Backup:</span>
                      <span className="font-mono text-xs">{selectedBackup.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tierra-media">Archivo:</span>
                      <span className="font-medium">{selectedBackup.filename}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tierra-media">Tamaño:</span>
                      <span className="font-medium">{selectedBackup.size_mb} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tierra-media">Fecha de creación:</span>
                      <span className="font-medium">
                        {selectedBackup.created_at 
                          ? new Date(selectedBackup.created_at).toLocaleString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteBackupDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDeleteBackup}
              disabled={deletingBackup}
            >
              {deletingBackup ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Backup
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
