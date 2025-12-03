"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  AlertTriangle,
  Eye,
  Plus,
  ArrowRight,
  Calendar,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import businessConfig from '@/config/business';

// Colors from the brand palette
const COLORS = {
  primary: '#8B5A3C',
  secondary: '#B17A47',
  accent: '#D4A574',
  success: '#4ade80',
  warning: '#fbbf24',
  danger: '#ef4444',
  info: '#60a5fa'
};

const CHART_COLORS = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.success, COLORS.warning];

interface DashboardData {
  kpis: {
    products: {
      total: number;
      lowStock: number;
      outOfStock: number;
    };
    orders: {
      total: number;
      pending: number;
      processing: number;
      completed: number;
      failed: number;
    };
    revenue: {
      current: number;
      previous: number;
      change: number;
      currency: string;
    };
    customers: {
      total: number;
      new: number;
      returning: number;
    };
  };
  recentOrders: any[];
  lowStockProducts: any[];
  charts: {
    revenueTrend: any[];
    ordersStatus: any;
    topProducts: any[];
  };
}

const defaultDashboardData: DashboardData = {
  kpis: {
    revenue: {
      current: 0,
      previous: 0,
      change: 0,
      currency: 'ARS'
    },
    orders: {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    },
    products: {
      total: 0,
      lowStock: 0,
      outOfStock: 0
    },
    customers: {
      total: 0,
      new: 0,
      returning: 0
    }
  },
  recentOrders: [],
  lowStockProducts: [],
  charts: {
    revenueTrend: [],
    ordersStatus: {},
    topProducts: []
  }
};

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardData>(defaultDashboardData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch('/api/admin/dashboard');
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Error al cargar los datos del dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-verde-suave text-white text-xs"><CheckCircle className="h-3 w-3 mr-1" />Completado</Badge>;
      case 'pending':
        return <Badge className="bg-dorado text-azul-profundo text-xs"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'processing':
        return <Badge className="bg-azul-profundo text-white text-xs"><Package className="h-3 w-3 mr-1" />Procesando</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="text-xs"><XCircle className="h-3 w-3 mr-1" />Fallido</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  // Prepare chart data
  const ordersStatusData = data.charts.ordersStatus ? [
    { name: 'Pendiente', value: data.charts.ordersStatus.pending || 0 },
    { name: 'Procesando', value: data.charts.ordersStatus.processing || 0 },
    { name: 'Completado', value: data.charts.ordersStatus.completed || 0 },
    { name: 'Enviado', value: data.charts.ordersStatus.shipped || 0 },
    { name: 'Fallido', value: data.charts.ordersStatus.failed || 0 }
  ].filter(item => item.value > 0) : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-32 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-azul-profundo mb-2">Error al cargar el dashboard</p>
          <p className="text-tierra-media">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-azul-profundo">Dashboard</h1>
          <p className="text-sm md:text-base text-tierra-media">
            Welcome to the {businessConfig.displayName || businessConfig.name} admin panel
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">

          <Link href="/admin/products/add">
          <Button 
                      className="group btn-enhanced px-6 py-3 lg:px-8 lg:py-4 text-white font-semibold text-sm lg:text-base w-full sm:w-auto"
          >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>  
            </Link>
          <Link href="/admin/orders">
          <Button 
            className="group btn-enhanced px-6 py-3 lg:px-8 lg:py-4 text-white font-semibold text-sm lg:text-base w-full sm:w-auto"
          >
              <Eye className="h-4 w-4 mr-2" />
              Ver Pedidos
          </Button>
            </Link>
        </div>
      </div>

      {/* Stock Alert Banner - Compact */}
      {data.lowStockProducts.length > 0 && (
        <Card className="border-red-200 bg-admin-bg-tertiary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-semibold text-azul-profundo text-sm">
                    {data.lowStockProducts.length} producto{data.lowStockProducts.length !== 1 ? 's' : ''} con stock bajo
                  </p>
                  <p className="text-xs text-tierra-media">
                    {data.lowStockProducts.slice(0, 2).map(p => p.name).join(', ')}
                    {data.lowStockProducts.length > 2 && ` y ${data.lowStockProducts.length - 2} más`}
                  </p>
                </div>
              </div>
                <Link href="/admin/products?filter=low_stock">
                <Button variant="outline" size="sm">
                  Ver Inventario
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Revenue Card */}
        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start gap-3">
              <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-azul-profundo flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-tierra-media truncate">Ingresos del Mes</p>
                <p className="text-lg md:text-2xl font-bold text-azul-profundo break-words">
                  {formatPrice(data.kpis.revenue.current)}
                </p>
                <div className={cn(
                  "flex items-center text-xs mt-1 gap-1",
                  data.kpis.revenue.change >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {data.kpis.revenue.change >= 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        +{data.kpis.revenue.change.toFixed(1)}% vs anterior
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {data.kpis.revenue.change.toFixed(1)}% vs anterior
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  Solo completados/pagados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Card */}
        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start gap-3">
              <ShoppingCart className="h-6 w-6 md:h-8 md:w-8 text-azul-profundo flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-tierra-media truncate">Pedidos</p>
                <p className="text-lg md:text-2xl font-bold text-azul-profundo">
                  {data.kpis.orders.total}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs mt-1">
                  <span className="text-orange-600 truncate">{data.kpis.orders.pending} pend.</span>
                  <span className="text-green-600 truncate">{data.kpis.orders.completed} comp.</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {data.kpis.orders.processing} en proceso
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Card - Only Active */}
        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start gap-3">
              <Package className="h-6 w-6 md:h-8 md:w-8 text-azul-profundo flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-tierra-media truncate">Productos Activos</p>
                <p className="text-lg md:text-2xl font-bold text-azul-profundo">
                  {data.kpis.products.total}
                </p>
                <div className="flex items-center text-xs mt-1 gap-1">
                  {data.kpis.products.lowStock > 0 ? (
                    <>
                      <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
                      <span className="text-red-500 truncate">{data.kpis.products.lowStock} stock bajo</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                      <span className="text-green-600 truncate">Stock saludable</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {data.kpis.products.outOfStock} sin stock
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers Card */}
        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start gap-3">
              <Users className="h-6 w-6 md:h-8 md:w-8 text-azul-profundo flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-tierra-media truncate">Clientes</p>
                <p className="text-lg md:text-2xl font-bold text-azul-profundo">
                  {data.kpis.customers.total}
                </p>
                <div className="flex items-center text-xs text-green-600 mt-1 gap-1">
                  <TrendingUp className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">+{data.kpis.customers.new} nuevos</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {data.kpis.customers.returning} recurrentes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <CardHeader>
            <CardTitle>Ingresos Últimos 7 Días</CardTitle>
            <p className="text-sm text-tierra-media">Evolución de ingresos diarios</p>
          </CardHeader>
          <CardContent>
            {data.charts.revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.charts.revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(date) => new Date(date).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatPrice(value)}
                    labelFormatter={(date) => new Date(date).toLocaleDateString('es-AR', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Ingresos"
                    stroke={COLORS.success} 
                    strokeWidth={2}
                    dot={{ fill: COLORS.success }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-center">
                <p className="text-tierra-media">No hay datos de ingresos disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders Status Distribution */}
        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <CardHeader>
            <CardTitle>Estado de Pedidos (30 días)</CardTitle>
            <p className="text-sm text-tierra-media">Distribución por estado</p>
          </CardHeader>
          <CardContent>
            {ordersStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ordersStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name }: { name?: string }) => name || ''}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ordersStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-center">
                <p className="text-tierra-media">No hay pedidos recientes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products Chart */}
      {data.charts.topProducts.length > 0 && (
        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
            <p className="text-sm text-tierra-media">Top 5 por ingresos</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.charts.topProducts} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(value) => formatPrice(value)} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'revenue') return [formatPrice(value), 'Ingresos'];
                    return [value, 'Cantidad'];
                  }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Ingresos" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Recent Orders - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-lg md:text-xl">Pedidos Recientes</CardTitle>
                  <Link href="/admin/orders">
                  <Button variant="ghost" size="sm" className="self-start sm:self-auto">
                    Ver todos
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.recentOrders.length > 0 ? (
                  data.recentOrders.map((order) => (
                    <div key={order.id} className="flex flex-col p-3 rounded-lg hover:bg-[#AE000025] transition-colors border border-transparent hover:border-[#AE0000]/20">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <p className="font-medium text-azul-profundo text-sm truncate">
                            #{order.order_number}
                          </p>
                          {getOrderStatusBadge(order.status)}
                        </div>
                        <p className="text-xs text-tierra-media mb-2 truncate">
                          {order.customer_name} • {order.items_count} producto{order.items_count !== 1 ? 's' : ''}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-verde-suave text-sm">
                            {formatPrice(order.total_amount)}
                          </p>
                          <p className="text-xs text-tierra-media flex items-center flex-shrink-0">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-center">
                    <div>
                      <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-tierra-media">
                        No hay pedidos recientes para mostrar.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg md:text-xl">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Stock Alerts Section */}
              {data.lowStockProducts.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm font-semibold text-red-700">Alertas de Stock</p>
                  </div>
                  <p className="text-xs text-red-600 mb-2">
                    {data.lowStockProducts.length} producto{data.lowStockProducts.length !== 1 ? 's' : ''} requiere{data.lowStockProducts.length === 1 ? '' : 'n'} atención
                  </p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {data.lowStockProducts.slice(0, 5).map((product) => (
                      <div key={product.id} className="flex items-center justify-between text-xs bg-white p-2 rounded">
                        <span className="text-azul-profundo truncate flex-1 mr-2">{product.name}</span>
                        <Badge variant="destructive" className="text-xs flex-shrink-0">
                          {product.currentStock} un.
                        </Badge>
                      </div>
                    ))}
                  </div>
                  {data.lowStockProducts.length > 5 && (
                    <p className="text-xs text-red-500 mt-2 text-center">
                      +{data.lowStockProducts.length - 5} más
                    </p>
                  )}
                  <Link href="/admin/products?filter=low_stock">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3 text-red-600 border-red-300 hover:bg-red-50" 
                  >
                      Ver Todos
                      <ArrowRight className="h-3 w-3 ml-2" />
                    </Button>
                    </Link>
                </div>
              )}

              {/* Action Buttons */}
              <Link href="/admin/products/add">
              <Button 
                variant="outline" 
                  className="w-full justify-start h-10 hover:bg-[#AE0000]/5 hover:border-[#AE0000] border-gray-300 transition-all duration-300"
              >
                  <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Nuevo Producto</span>
                </Button>
                </Link>
              <Link href="/admin/orders">
              <Button 
                variant="outline" 
                  className="w-full justify-start h-10 hover:bg-[#AE0000]/5 hover:border-[#AE0000] border-gray-300 transition-all duration-300"
              >
                  <ShoppingCart className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Gestionar Pedidos</span>
                </Button>
                </Link>
              <Link href="/admin/customers">
              <Button 
                variant="outline" 
                  className="w-full justify-start h-10 hover:bg-[#AE0000]/5 hover:border-[#AE0000] border-gray-300 transition-all duration-300"
              >
                  <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Ver Clientes</span>
                </Button>
                </Link>
              <Link href="/admin/products">
              <Button 
                variant="outline" 
                  className="w-full justify-start h-10 hover:bg-[#AE0000]/5 hover:border-[#AE0000] border-gray-300 transition-all duration-300"
              >
                  <Package className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Inventario</span>
                </Button>
                </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
