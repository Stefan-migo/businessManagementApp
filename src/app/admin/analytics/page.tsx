"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  PieChart as PieChartIcon, 
  Calendar,
  DollarSign,
  Users,
  Package,
  Target,
  Download,
  Filter,
  RefreshCw,
  AlertTriangle,
  Activity,
  ShoppingCart,
  Crown,
  ArrowUpRight,
  ArrowDownRight,
  User,
  LineChart as LineChartIcon
} from 'lucide-react';
import { PieChart } from '@/components/admin/charts/PieChart';
import { BarChart } from '@/components/admin/charts/BarChart';
import { AreaChart } from '@/components/admin/charts/AreaChart';
import { ColumnChart } from '@/components/admin/charts/ColumnChart';
import { HelpDialog } from '@/components/admin/HelpDialog';
import { ANALYTICS_HELP, EMPTY_STATE_MESSAGES } from '@/lib/analytics-help';

interface AnalyticsData {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    avgOrderValue: number;
    revenueGrowth: number;
    conversionRate: number;
  };
  trends: {
    sales: Array<{ date: string; value: number; count: number }>;
    customers: Array<{ date: string; value: number; count: number }>;
  };
  products: {
    topProducts: Array<{
      id: string;
      name: string;
      category: string;
      revenue: number;
      quantity: number;
      orders: number;
    }>;
    categoryRevenue: Array<{ category: string; revenue: number }>;
  };
  customers: {
    segmentation: {
      new: number;
      basic: number;
      premium: number;
      members: number;
      nonMembers: number;
    };
  };
  orders: {
    statusDistribution: Record<string, number>;
  };
  period: {
    from: string;
    to: string;
    days: number;
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30');
  const [refreshing, setRefreshing] = useState(false);
  
  // Chart type selectors
  const [salesChartType, setSalesChartType] = useState<'area' | 'column'>('area');
  const [customersChartType, setCustomersChartType] = useState<'area' | 'column'>('area');
  const [statusChartType, setStatusChartType] = useState<'pie' | 'bar'>('pie');
  const [categoryChartType, setCategoryChartType] = useState<'bar' | 'pie'>('bar');
  const [segmentationChartType, setSegmentationChartType] = useState<'pie' | 'bar'>('pie');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      
      const response = await fetch(`/api/admin/analytics/dashboard?period=${period}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics);
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatPrice = (amount: number) => 
    new Intl.NumberFormat('es-AR', { 
      style: 'currency', 
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);

  const formatPercentage = (value: number) => 
    `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    if (growth < 0) return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading && !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-azul-profundo">Analíticas y Reportes</h1>
            <p className="text-tierra-media">Cargando datos analíticos...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
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

  if (error || !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-azul-profundo">Analíticas y Reportes</h1>
            <p className="text-tierra-media">Error al cargar los datos</p>
          </div>
        </div>
        <Card>
          <CardContent className="text-center py-16">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">Error al cargar analíticas</h3>
            <p className="text-tierra-media mb-4">{error || 'No se pudieron cargar los datos'}</p>
            <Button onClick={fetchAnalytics}>Reintentar</Button>
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
          <h1 className="text-3xl font-bold text-azul-profundo">Analíticas y Reportes</h1>
          <p className="text-tierra-media">
            Insights de negocio para los últimos {analytics.period.days} días
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
              <SelectItem value="365">Último año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalytics} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-tierra-media">Ingresos Totales</p>
              <HelpDialog {...ANALYTICS_HELP.totalRevenue} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-verde-suave">
                  {formatPrice(analytics.kpis.totalRevenue)}
                </p>
                <div className="flex items-center mt-1">
                  {getGrowthIcon(analytics.kpis.revenueGrowth)}
                  <span className={`text-sm ml-1 ${getGrowthColor(analytics.kpis.revenueGrowth)}`}>
                    {formatPercentage(analytics.kpis.revenueGrowth)}
                  </span>
                  <HelpDialog {...ANALYTICS_HELP.revenueGrowth} />
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-verde-suave" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-tierra-media">Pedidos</p>
              <HelpDialog {...ANALYTICS_HELP.totalOrders} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-azul-profundo">
                  {analytics.kpis.totalOrders}
                </p>
                <p className="text-sm text-tierra-media mt-1">
                  Promedio: {formatPrice(analytics.kpis.avgOrderValue)}
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-azul-profundo" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-tierra-media">Clientes</p>
              <HelpDialog {...ANALYTICS_HELP.totalCustomers} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-dorado">
                  {analytics.kpis.totalCustomers}
                </p>
                <div className="flex items-center mt-1">
                  <p className="text-sm text-tierra-media">
                    Conv: {analytics.kpis.conversionRate.toFixed(1)}%
                  </p>
                  <HelpDialog {...ANALYTICS_HELP.conversionRate} />
                </div>
              </div>
              <Users className="h-8 w-8 text-dorado" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-tierra-media">Productos</p>
                <p className="text-2xl font-bold text-red-500">
                  {analytics.kpis.totalProducts}
                </p>
                <p className="text-sm text-tierra-media mt-1">
                  Activos
                </p>
              </div>
              <Package className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Trend */}
            <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    <CardTitle>Tendencia de Ventas</CardTitle>
                    <HelpDialog {...ANALYTICS_HELP.salesTrend} />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant={salesChartType === 'area' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSalesChartType('area')}
                      className="h-7 px-3 text-xs"
                      title="Vista de Área"
                    >
                      <Activity className="h-3 w-3 mr-1" />
                      Área
                    </Button>
                    <Button
                      variant={salesChartType === 'column' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSalesChartType('column')}
                      className="h-7 px-3 text-xs"
                      title="Vista de Columnas"
                    >
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Columnas
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {salesChartType === 'area' ? (
                  <AreaChart 
                    data={analytics.trends.sales} 
                    title="Evolución de Ingresos"
                    color="#9DC65D"
                    formatValue={formatPrice}
                    showGrid={true}
                  />
                ) : (
                  <ColumnChart
                    data={analytics.trends.sales}
                    title="Ingresos por Período"
                    color="#9DC65D"
                    formatValue={formatPrice}
                  />
                )}
              </CardContent>
            </Card>

            {/* Customer Acquisition */}
            <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <CardTitle>Adquisición de Clientes</CardTitle>
                    <HelpDialog {...ANALYTICS_HELP.customerAcquisition} />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant={customersChartType === 'area' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCustomersChartType('area')}
                      className="h-7 px-3 text-xs"
                      title="Vista de Área"
                    >
                      <Activity className="h-3 w-3 mr-1" />
                      Área
                    </Button>
                    <Button
                      variant={customersChartType === 'column' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCustomersChartType('column')}
                      className="h-7 px-3 text-xs"
                      title="Vista de Columnas"
                    >
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Columnas
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {customersChartType === 'area' ? (
                  <AreaChart 
                    data={analytics.trends.customers} 
                    title="Crecimiento de Clientes"
                    color="#D4A853"
                    showGrid={true}
                    formatValue={(val) => Math.round(val).toString()}
                  />
                ) : (
                  <ColumnChart
                    data={analytics.trends.customers}
                    title="Nuevos Clientes por Período"
                    color="#D4A853"
                    formatValue={(val) => Math.round(val).toString()}
                  />
                )}
              </CardContent>
            </Card>

            {/* Order Status Distribution */}
            <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    <CardTitle>Estados de Pedidos</CardTitle>
                    <HelpDialog {...ANALYTICS_HELP.orderStatus} />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant={statusChartType === 'pie' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatusChartType('pie')}
                      className="h-7 px-2"
                    >
                      <PieChartIcon className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={statusChartType === 'bar' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatusChartType('bar')}
                      className="h-7 px-2"
                    >
                      <BarChart3 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {statusChartType === 'pie' ? (
                  <PieChart
                    data={Object.entries(analytics.orders.statusDistribution).map(([status, count]) => ({
                      label: status.charAt(0).toUpperCase() + status.slice(1),
                      value: count as number
                    }))}
                    title="Distribución por Estado"
                    showLegend={true}
                  />
                ) : (
                  <BarChart
                    data={Object.entries(analytics.orders.statusDistribution).map(([status, count]) => ({
                      label: status.charAt(0).toUpperCase() + status.slice(1),
                      value: count as number
                    }))}
                    color="#1E3A8A"
                    horizontal={true}
                  />
                )}
              </CardContent>
            </Card>

            {/* Customer Segmentation */}
            <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <CardTitle>Segmentación de Clientes</CardTitle>
                    <HelpDialog {...ANALYTICS_HELP.customerSegmentation} />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant={segmentationChartType === 'pie' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSegmentationChartType('pie')}
                      className="h-7 px-2"
                    >
                      <PieChartIcon className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={segmentationChartType === 'bar' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSegmentationChartType('bar')}
                      className="h-7 px-2"
                    >
                      <BarChart3 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {segmentationChartType === 'pie' ? (
                  <PieChart
                    data={[
                      { label: 'Miembros', value: analytics.customers.segmentation.members },
                      { label: 'Premium', value: analytics.customers.segmentation.premium },
                      { label: 'Básico', value: analytics.customers.segmentation.basic },
                      { label: 'Sin Membresía', value: analytics.customers.segmentation.nonMembers }
                    ]}
                    title="Distribución de Clientes"
                    showLegend={true}
                  />
                ) : (
                  <BarChart
                    data={[
                      { label: 'Miembros', value: analytics.customers.segmentation.members },
                      { label: 'Premium', value: analytics.customers.segmentation.premium },
                      { label: 'Básico', value: analytics.customers.segmentation.basic },
                      { label: 'Sin Membresía', value: analytics.customers.segmentation.nonMembers }
                    ]}
                    color="#D4A853"
                    horizontal={true}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Category */}
            <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    <CardTitle>Ingresos por Categoría</CardTitle>
                    <HelpDialog {...ANALYTICS_HELP.categoryRevenue} />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant={categoryChartType === 'bar' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCategoryChartType('bar')}
                      className="h-7 px-2"
                    >
                      <BarChart3 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={categoryChartType === 'pie' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCategoryChartType('pie')}
                      className="h-7 px-2"
                    >
                      <PieChartIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {analytics.products.categoryRevenue.length > 0 ? (
                  categoryChartType === 'bar' ? (
                    <BarChart 
                      data={analytics.products.categoryRevenue.map(cat => ({
                        label: cat.category,
                        value: cat.revenue
                      }))}
                      title="Categorías Más Rentables"
                      color="#9DC65D"
                      horizontal={true}
                      formatValue={formatPrice}
                    />
                  ) : (
                    <PieChart
                      data={analytics.products.categoryRevenue.map(cat => ({
                        label: cat.category,
                        value: cat.revenue
                      }))}
                      title="Distribución de Ingresos"
                      showLegend={true}
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center space-y-3 p-6">
                    <Package className="h-16 w-16 text-tierra-media opacity-50" />
                    <div>
                      <h4 className="font-semibold text-lg text-azul-profundo mb-2">
                        {EMPTY_STATE_MESSAGES.noCategories.title}
                      </h4>
                      <p className="text-sm text-tierra-media mb-2">
                        {EMPTY_STATE_MESSAGES.noCategories.message}
                      </p>
                      <p className="text-xs text-verde-suave">
                        💡 {EMPTY_STATE_MESSAGES.noCategories.suggestion}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sales Metrics */}
            <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Métricas de Ventas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-verde-suave/10 rounded-lg border border-verde-suave/20">
                    <p className="text-2xl font-bold text-verde-suave">
                      {formatPrice(analytics.kpis.totalRevenue)}
                    </p>
                    <p className="text-sm text-tierra-media">Ingresos Totales</p>
                  </div>
                  <div className="text-center p-4 bg-azul-profundo/10 rounded-lg border border-azul-profundo/20">
                    <p className="text-2xl font-bold text-azul-profundo">
                      {formatPrice(analytics.kpis.avgOrderValue)}
                    </p>
                    <p className="text-sm text-tierra-media">Ticket Promedio</p>
                  </div>
                  <div className="text-center p-4 bg-dorado/10 rounded-lg border border-dorado/20">
                    <p className="text-2xl font-bold text-dorado">
                      {analytics.kpis.totalOrders}
                    </p>
                    <p className="text-sm text-tierra-media">Pedidos Totales</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className={`text-2xl font-bold ${analytics.kpis.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(analytics.kpis.revenueGrowth)}
                    </p>
                    <p className="text-sm text-tierra-media">Crecimiento</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  <CardTitle>Productos Más Vendidos</CardTitle>
                  <HelpDialog {...ANALYTICS_HELP.topProducts} />
                </div>
              </CardHeader>
              <CardContent>
                <BarChart 
                  data={analytics.products.topProducts.slice(0, 8).map(prod => ({
                    label: prod.name,
                    value: prod.revenue
                  }))}
                  title="Por Ingresos"
                  color="#D4A853"
                  horizontal={true}
                  formatValue={formatPrice}
                />
              </CardContent>
            </Card>

            {/* Product Performance Table */}
            <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Rendimiento Detallado
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.products.topProducts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Ingresos</TableHead>
                        <TableHead>Cantidad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.products.topProducts.slice(0, 8).map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium truncate max-w-[150px]" title={product.name}>
                                {product.name}
                              </div>
                              <div className="text-sm text-tierra-media">
                                {product.category}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-verde-suave">
                            {formatPrice(product.revenue)}
                          </TableCell>
                          <TableCell>{product.quantity} unidades</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-tierra-media">
                    No hay productos vendidos en este período
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Acquisition Trend */}
            <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <CardTitle>Adquisición de Clientes</CardTitle>
                    <HelpDialog {...ANALYTICS_HELP.customerAcquisition} />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant={customersChartType === 'area' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCustomersChartType('area')}
                      className="h-7 px-3 text-xs"
                    >
                      <Activity className="h-3 w-3 mr-1" />
                      Área
                    </Button>
                    <Button
                      variant={customersChartType === 'column' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCustomersChartType('column')}
                      className="h-7 px-3 text-xs"
                    >
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Columnas
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {customersChartType === 'area' ? (
                  <AreaChart 
                    data={analytics.trends.customers} 
                    title="Crecimiento de Clientes"
                    color="#D4A853"
                    showGrid={true}
                    formatValue={(val) => Math.round(val).toString()}
                  />
                ) : (
                  <ColumnChart
                    data={analytics.trends.customers}
                    title="Nuevos Clientes por Período"
                    color="#D4A853"
                    formatValue={(val) => Math.round(val).toString()}
                  />
                )}
              </CardContent>
            </Card>

            {/* Customer Metrics */}
            <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Métricas de Clientes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-azul-profundo/10 rounded-lg border border-azul-profundo/20">
                    <p className="text-2xl font-bold text-azul-profundo">
                      {analytics.kpis.totalCustomers}
                    </p>
                    <p className="text-sm text-tierra-media">Total Clientes</p>
                  </div>
                  <div className="text-center p-4 bg-dorado/10 rounded-lg border border-dorado/20">
                    <p className="text-2xl font-bold text-dorado">
                      {analytics.customers.segmentation.members}
                    </p>
                    <p className="text-sm text-tierra-media">Miembros Activos</p>
                  </div>
                  <div className="text-center p-4 bg-verde-suave/10 rounded-lg border border-verde-suave/20">
                    <p className="text-2xl font-bold text-verde-suave">
                      {analytics.kpis.conversionRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-tierra-media">Tasa Conversión</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-2xl font-bold text-purple-600">
                      {analytics.customers.segmentation.premium}
                    </p>
                    <p className="text-sm text-tierra-media">Miembros Premium</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
