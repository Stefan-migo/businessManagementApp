"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Package,
  CreditCard,
  TrendingUp,
  Star,
  Crown,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Heart,
  ShoppingBag,
  DollarSign,
  Activity,
  Edit
} from 'lucide-react';
import Link from 'next/link';

interface Customer {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  membership_tier: string;
  is_member: boolean;
  membership_start_date?: string;
  membership_end_date?: string;
  newsletter_subscribed: boolean;
  created_at: string;
  updated_at: string;
  orders?: any[];
  memberships?: any[];
  analytics?: {
    totalSpent: number;
    orderCount: number;
    lastOrderDate?: string;
    avgOrderValue: number;
    segment: string;
    lifetimeValue: number;
    orderStatusCounts: Record<string, number>;
    favoriteProducts: any[];
    monthlySpending: any[];
  };
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/customers/${customerId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch customer');
      }

      const data = await response.json();
      setCustomer(data.customer);
      setError(null);
    } catch (err) {
      console.error('Error fetching customer:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number) => 
    new Intl.NumberFormat('es-AR', { 
      style: 'currency', 
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);

  const getSegmentBadge = (segment: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any; color: string }> = {
      'new': { variant: 'secondary', label: 'Nuevo', icon: Star, color: 'text-yellow-600' },
      'first-time': { variant: 'outline', label: 'Primera Compra', icon: Package, color: 'text-blue-600' },
      'regular': { variant: 'default', label: 'Regular', icon: CheckCircle, color: 'text-green-600' },
      'vip': { variant: 'secondary', label: 'VIP', icon: Crown, color: 'text-purple-600' },
      'at-risk': { variant: 'destructive', label: 'En Riesgo', icon: AlertTriangle, color: 'text-red-600' }
    };

    const config = variants[segment] || variants['new'];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getMembershipBadge = (tier: string, isMember: boolean) => {
    if (!isMember || tier === 'none') {
      return <Badge variant="outline">Sin Membresía</Badge>;
    }

    const config: Record<string, { variant: any; label: string }> = {
      basic: { variant: 'secondary', label: 'Básica' },
      premium: { variant: 'default', label: 'Premium' }
    };

    const tierConfig = config[tier] || { variant: 'outline', label: tier };
    return <Badge variant={tierConfig.variant}>{tierConfig.label}</Badge>;
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const getOrderStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'outline', label: 'Pendiente' },
      processing: { variant: 'secondary', label: 'Procesando' },
      shipped: { variant: 'default', label: 'Enviado' },
      delivered: { variant: 'default', label: 'Entregado' },
      cancelled: { variant: 'destructive', label: 'Cancelado' },
      refunded: { variant: 'destructive', label: 'Reembolsado' }
    };

    const statusConfig = config[status] || { variant: 'outline', label: status };
    return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-azul-profundo">Cargando cliente...</h1>
            <p className="text-tierra-media">Obteniendo información del cliente</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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

  if (error || !customer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-azul-profundo">Error</h1>
            <p className="text-tierra-media">No se pudo cargar la información del cliente</p>
          </div>
        </div>
        <Card>
          <CardContent className="text-center py-16">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">Error al cargar cliente</h3>
            <p className="text-tierra-media mb-4">{error || 'Cliente no encontrado'}</p>
            <Button onClick={fetchCustomer}>Reintentar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const customerName = customer.first_name && customer.last_name 
    ? `${customer.first_name} ${customer.last_name}`
    : 'Sin nombre';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-azul-profundo">{customerName}</h1>
            <p className="text-tierra-media">{customer.email}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {customer.analytics?.segment && getSegmentBadge(customer.analytics.segment)}
          {getMembershipBadge(customer.membership_tier, customer.is_member)}
          <Link href={`/admin/customers/${customer.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-verde-suave" />
              <div className="ml-4">
                <p className="text-sm text-tierra-media">Total Gastado</p>
                <p className="text-2xl font-bold text-verde-suave">
                  {formatPrice(customer.analytics?.totalSpent || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
          <CardContent className="p-6">
            <div className="flex items-center">
              <ShoppingBag className="h-8 w-8 text-azul-profundo" />
              <div className="ml-4">
                <p className="text-sm text-tierra-media">Total Pedidos</p>
                <p className="text-2xl font-bold text-azul-profundo">
                  {customer.analytics?.orderCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-dorado" />
              <div className="ml-4">
                <p className="text-sm text-tierra-media">Ticket Promedio</p>
                <p className="text-2xl font-bold text-dorado">
                  {formatPrice(customer.analytics?.avgOrderValue || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm text-tierra-media">Cliente Desde</p>
                <p className="text-lg font-bold text-red-500">
                  {new Date(customer.created_at).toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
          <TabsTrigger value="membership">Membresía</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-tierra-media">Nombre</p>
                    <p className="font-medium">{customer.first_name || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-tierra-media">Apellido</p>
                    <p className="font-medium">{customer.last_name || 'No especificado'}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-tierra-media">Email</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
                
                {customer.phone && (
                  <div>
                    <p className="text-sm text-tierra-media">Teléfono</p>
                    <p className="font-medium">{customer.phone}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-tierra-media">Newsletter</p>
                  <Badge variant={customer.newsletter_subscribed ? "default" : "outline"}>
                    {customer.newsletter_subscribed ? "Suscrito" : "No suscrito"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Dirección
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customer.address_line_1 ? (
                  <>
                    <div>
                      <p className="text-sm text-tierra-media">Dirección</p>
                      <p className="font-medium">{customer.address_line_1}</p>
                      {customer.address_line_2 && (
                        <p className="font-medium">{customer.address_line_2}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-tierra-media">Ciudad</p>
                        <p className="font-medium">{customer.city || 'No especificado'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-tierra-media">Provincia</p>
                        <p className="font-medium">{customer.state || 'No especificado'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-tierra-media">Código Postal</p>
                        <p className="font-medium">{customer.postal_code || 'No especificado'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-tierra-media">País</p>
                        <p className="font-medium">{customer.country || 'Argentina'}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-tierra-media">No hay dirección registrada</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          {customer.orders && customer.orders.length > 0 && (
            <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Pedidos Recientes
                  </div>
                  <Link href={`/admin/customers/${customer.id}?tab=orders`}>
                    <Button variant="outline" size="sm">Ver todos</Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customer.orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium">#{order.order_number}</p>
                          <p className="text-sm text-tierra-media">
                            {new Date(order.created_at).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="font-medium">{formatPrice(order.total_amount)}</p>
                          {getOrderStatusBadge(order.status)}
                        </div>
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button variant="outline" size="sm">
                            Ver
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Historial de Pedidos ({customer.orders?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customer.orders && customer.orders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Pago</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.orders.map((order: any) => (
                      <>
                        <TableRow key={order.id} className="hover:bg-[#AE000010]">
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleOrderExpansion(order.id)}
                                className="h-6 w-6 p-0"
                              >
                                {expandedOrders.has(order.id) ? '−' : '+'}
                              </Button>
                              <div>
                                <p className="font-medium">#{order.order_number}</p>
                                <p className="text-sm text-tierra-media">
                                  {order.order_items?.length || 0} productos
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            {new Date(order.created_at).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </TableCell>
                          
                          <TableCell>
                            {getOrderStatusBadge(order.status)}
                          </TableCell>
                          
                          <TableCell>
                            <Badge variant={order.payment_status === 'paid' ? 'default' : 'outline'}>
                              {order.payment_status === 'paid' ? 'Pagado' : 
                               order.payment_status === 'pending' ? 'Pendiente' :
                               order.payment_status === 'failed' ? 'Fallido' :
                               order.payment_status}
                            </Badge>
                          </TableCell>
                          
                          <TableCell className="font-medium text-verde-suave">
                            {formatPrice(order.total_amount)}
                          </TableCell>
                          
                          <TableCell>
                            <Link href={`/admin/orders/${order.id}`}>
                              <Button variant="outline" size="sm">
                                Ver Detalle
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                        
                        {/* Expanded Order Items */}
                        {expandedOrders.has(order.id) && order.order_items && order.order_items.length > 0 && (
                          <TableRow key={`${order.id}-items`}>
                            <TableCell colSpan={6} className="bg-gray-50 p-4">
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-azul-profundo mb-3">Productos del Pedido:</p>
                                {order.order_items.map((item: any, idx: number) => {
                                  const product = item.products || item.product;
                                  return (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border">
                                      <div className="flex items-center space-x-3">
                                        {product?.featured_image ? (
                                          <img 
                                            src={product.featured_image} 
                                            alt={product.name || item.product_name}
                                            className="w-10 h-10 object-cover rounded"
                                          />
                                        ) : (
                                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                            <Package className="h-5 w-5 text-gray-400" />
                                          </div>
                                        )}
                                        <div>
                                          <p className="text-sm font-medium">
                                            {product?.name || item.product_name || 'Producto'}
                                          </p>
                                          <p className="text-xs text-tierra-media">
                                            Cantidad: {item.quantity} × {formatPrice(item.unit_price)}
                                          </p>
                                        </div>
                                      </div>
                                      <p className="text-sm font-medium text-verde-suave">
                                        {formatPrice(item.total_price)}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-tierra-media mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-azul-profundo mb-2">Sin pedidos</h3>
                  <p className="text-tierra-media">Este cliente aún no ha realizado ningún pedido.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Empty State for No Orders */}
          {customer.analytics?.orderCount === 0 && (
            <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
              <CardContent className="text-center py-16">
                <TrendingUp className="h-16 w-16 text-tierra-media mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-azul-profundo mb-2">
                  Sin Datos de Analíticas
                </h3>
                <p className="text-tierra-media mb-6 max-w-md mx-auto">
                  Este cliente aún no ha realizado ningún pedido. Las analíticas estarán disponibles una vez que realice su primera compra.
                </p>
                <Button onClick={() => router.push('/admin/orders/new')}>
                  <Package className="h-4 w-4 mr-2" />
                  Crear Pedido Manual
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Customer Analytics Content */}
          {customer.analytics?.orderCount && customer.analytics.orderCount > 0 && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Favorite Products */}
                {customer.analytics?.favoriteProducts && customer.analytics.favoriteProducts.length > 0 && (
              <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="h-5 w-5 mr-2" />
                    Productos Favoritos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {customer.analytics.favoriteProducts.slice(0, 5).map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-[#AE000010] transition-colors">
                        <div className="flex items-center space-x-3">
                          {item.product?.featured_image ? (
                            <img 
                              src={item.product.featured_image} 
                              alt={item.product.name || 'Product'}
                              className="w-12 h-12 object-cover rounded border border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{item.product?.name || 'Producto'}</p>
                            <p className="text-sm text-tierra-media">
                              {item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'} compradas
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-verde-suave">{formatPrice(item.totalSpent)}</p>
                          <p className="text-xs text-tierra-media">
                            {formatPrice(item.totalSpent / item.quantity)} por unidad
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Status Distribution */}
            {customer.analytics?.orderStatusCounts && (
              <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Distribución de Estados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(customer.analytics.orderStatusCounts).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getOrderStatusBadge(status)}
                        </div>
                        <span className="font-medium">{count} pedidos</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
                )}
              </div>

              {/* Monthly Spending Chart */}
          {customer.analytics?.monthlySpending && customer.analytics.monthlySpending.length > 0 && (
            <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Tendencia de Gastos (Últimos 12 meses)
                  </div>
                  <div className="text-sm font-normal text-tierra-media">
                    Total: {formatPrice(customer.analytics.totalSpent)}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {customer.analytics.monthlySpending.map((month: any, index: number) => (
                    <div 
                      key={index} 
                      className={`text-center p-3 border rounded-lg transition-all hover:shadow-md ${
                        month.amount > 0 ? 'bg-verde-suave/10 border-verde-suave/30' : 'bg-gray-50'
                      }`}
                    >
                      <p className="text-xs font-medium text-tierra-media mb-1">{month.month}</p>
                      <p className="font-bold text-sm text-azul-profundo">{formatPrice(month.amount)}</p>
                      <p className="text-xs text-tierra-media mt-1">
                        {month.orders} {month.orders === 1 ? 'pedido' : 'pedidos'}
                      </p>
                    </div>
                  ))}
                </div>
                
                {/* Summary Stats */}
                <div className="mt-6 pt-4 border-t grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-tierra-media">Promedio Mensual</p>
                    <p className="font-bold text-lg text-azul-profundo">
                      {formatPrice(customer.analytics.totalSpent / 12)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-tierra-media">Mejor Mes</p>
                    <p className="font-bold text-lg text-verde-suave">
                      {formatPrice(Math.max(...customer.analytics.monthlySpending.map((m: any) => m.amount)))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-tierra-media">Meses Activos</p>
                    <p className="font-bold text-lg text-dorado">
                      {customer.analytics.monthlySpending.filter((m: any) => m.amount > 0).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
            </>
          )}
        </TabsContent>

        <TabsContent value="membership" className="space-y-6">
          <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Crown className="h-5 w-5 mr-2" />
                Estado de Membresía
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customer.is_member ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-tierra-media">Tipo de Membresía</p>
                      {getMembershipBadge(customer.membership_tier, customer.is_member)}
                    </div>
                    {customer.membership_start_date && (
                      <div>
                        <p className="text-sm text-tierra-media">Fecha de Inicio</p>
                        <p className="font-medium">
                          {new Date(customer.membership_start_date).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {customer.memberships && customer.memberships.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 text-azul-profundo">Programa Actual</h4>
                      {customer.memberships.map((membership: any) => (
                        <div key={membership.id} className="p-4 border rounded-lg bg-[#F6FBD6] border-verde-suave/30">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-tierra-media">Estado</p>
                              <Badge variant={membership.status === 'active' ? 'default' : 'outline'}>
                                {membership.status === 'active' ? 'Activo' : 
                                 membership.status === 'paused' ? 'Pausado' : 
                                 membership.status === 'completed' ? 'Completado' : 
                                 membership.status}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm text-tierra-media">Semana Actual</p>
                              <p className="font-medium text-azul-profundo">{membership.current_week || 1} / 28</p>
                            </div>
                            <div>
                              <p className="text-sm text-tierra-media">Progreso</p>
                              <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-verde-suave h-2 rounded-full transition-all"
                                    style={{ width: `${membership.progress_percentage || 0}%` }}
                                  />
                                </div>
                                <span className="font-medium text-sm text-verde-suave">
                                  {membership.progress_percentage || 0}%
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-tierra-media">Lecciones Completadas</p>
                              <p className="font-medium text-azul-profundo">
                                {membership.completed_lessons || 0} / {membership.total_lessons || 28}
                              </p>
                            </div>
                          </div>
                          
                          {membership.start_date && (
                            <div className="pt-3 border-t border-verde-suave/20">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-tierra-media">Fecha de Inicio</p>
                                  <p className="font-medium">
                                    {new Date(membership.start_date).toLocaleDateString('es-AR')}
                                  </p>
                                </div>
                                {membership.end_date && (
                                  <div>
                                    <p className="text-tierra-media">Fecha de Fin</p>
                                    <p className="font-medium">
                                      {new Date(membership.end_date).toLocaleDateString('es-AR')}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Crown className="h-12 w-12 text-tierra-media mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-azul-profundo mb-2">Sin Membresía</h3>
                  <p className="text-tierra-media mb-4">
                    Este cliente no tiene una membresía activa en el programa de transformación.
                  </p>
                  <Button>
                    <Crown className="h-4 w-4 mr-2" />
                    Asignar Membresía
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
