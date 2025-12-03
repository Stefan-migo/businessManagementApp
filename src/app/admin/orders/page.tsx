"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Search, 
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Mail,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  CreditCard,
  ExternalLink,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import CreateManualOrderForm from '@/components/admin/CreateManualOrderForm';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  order_items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    variant_title?: string;
  }>;
  mp_payment_id?: string;
  mp_payment_method?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);
  const ordersPerPage = 10;

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const offset = (currentPage - 1) * ordersPerPage;
      const params = new URLSearchParams({
        limit: ordersPerPage.toString(),
        offset: offset.toString()
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/admin/orders?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      console.log('📊 Orders API response:', {
        ordersLength: data.orders?.length,
        total: data.total,
        totalPages: Math.ceil((data.total || 0) / ordersPerPage)
      });

      setOrders(data.orders || []);
      setTotalOrders(data.total || 0);
      const calculatedTotalPages = Math.ceil((data.total || 0) / ordersPerPage);
      setTotalPages(calculatedTotalPages);
      
      console.log('Pagination state updated:', {
        totalOrders: data.total || 0,
        totalPages: calculatedTotalPages,
        ordersPerPage,
        shouldShowPagination: calculatedTotalPages > 1
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Error al cargar los pedidos');
      
      // Mock data for development
      setOrders([
        {
          id: '1',
          order_number: 'DL-1704123456',
          customer_name: 'María González',
          customer_email: 'maria@example.com',
          total_amount: 15750,
          status: 'pending',
          payment_status: 'pending',
          created_at: '2024-01-20T10:30:00Z',
          mp_payment_id: '123456789',
          mp_payment_method: 'credit_card',
          order_items: [
            {
              product_name: 'Crema Hidratante Rosa Mosqueta',
              quantity: 1,
              unit_price: 12500,
              variant_title: '50ml'
            },
            {
              product_name: 'Aceite Corporal Lavanda',
              quantity: 1,
              unit_price: 3250
            }
          ]
        },
        {
          id: '2',
          order_number: 'DL-1704123455',
          customer_name: 'Carlos Ruiz',
          customer_email: 'carlos@example.com',
          total_amount: 8900,
          status: 'delivered',
          payment_status: 'paid',
          created_at: '2024-01-20T09:15:00Z',
          mp_payment_id: '123456788',
          mp_payment_method: 'bank_transfer',
          order_items: [
            {
              product_name: 'Hidrolato de Rosas',
              quantity: 1,
              unit_price: 8900,
              variant_title: '100ml'
            }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdating(orderId);
      
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));

      toast.success('Estado del pedido actualizado');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Error al actualizar el pedido');
    } finally {
      setUpdating(null);
    }
  };

  const updatePaymentStatus = async (orderId: string, newPaymentStatus: string) => {
    try {
      setUpdating(orderId);
      
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment_status: newPaymentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update payment status');
      }

      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, payment_status: newPaymentStatus }
          : order
      ));

      toast.success('Estado de pago actualizado');
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Error al actualizar el estado de pago');
    } finally {
      setUpdating(null);
    }
  };

  const sendEmailNotification = async (order: Order) => {
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      toast.success('Notificación enviada al cliente');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Error al enviar la notificación');
    }
  };

  const createManualOrder = async (orderData: any) => {
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_manual_order',
          orderData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const data = await response.json();
      toast.success('Pedido creado exitosamente');
      setShowCreateOrder(false);
      fetchOrders(); // Refresh the orders list
    } catch (error) {
      console.error('Error creating manual order:', error);
      toast.error('Error al crear el pedido');
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      setDeletingOrder(orderId);
      
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete order');
      }

      toast.success('Pedido eliminado exitosamente');
      fetchOrders(); // Refresh the orders list
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Error al eliminar el pedido');
    } finally {
      setDeletingOrder(null);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return <Badge className="bg-verde-suave text-white"><CheckCircle className="h-3 w-3 mr-1" />Completado</Badge>;
      case 'pending':
        return <Badge className="bg-dorado text-azul-profundo"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'processing':
        return <Badge className="bg-azul-profundo text-white"><Package className="h-3 w-3 mr-1" />Procesando</Badge>;
      case 'shipped':
        return <Badge className="bg-blue-500 text-white"><Truck className="h-3 w-3 mr-1" />Enviado</Badge>;
      case 'cancelled':
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Cancelado</Badge>;
      case 'refunded':
        return <Badge variant="secondary">Reembolsado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="outline" className="border-verde-suave text-verde-suave">Pagado</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-dorado text-dorado">Pendiente</Badge>;
      case 'failed':
        return <Badge variant="outline" className="border-red-500 text-red-500">Fallido</Badge>;
      case 'refunded':
        return <Badge variant="outline" className="border-gray-500 text-gray-500">Reembolsado</Badge>;
      case 'partially_refunded':
        return <Badge variant="outline" className="border-gray-400 text-gray-400">Parcialmente Reembolsado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // For display, we'll use the orders directly since pagination is handled server-side
  // Only apply client-side filtering for search when not using server pagination
  const displayOrders = searchTerm ? orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) : orders;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
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
          <h1 className="text-3xl font-bold text-azul-profundo">Gestión de Pedidos</h1>
          <p className="text-tierra-media">
            Administra todos los pedidos de la tienda
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={fetchOrders} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={() => setShowCreateOrder(true)}>
            <Package className="h-4 w-4 mr-2" />
            Nuevo Pedido
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
        <CardHeader>
          <CardTitle className="flex items-center text-azul-profundo">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por número de pedido, cliente o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="processing">Procesando</SelectItem>
                <SelectItem value="shipped">Enviado</SelectItem>
                  <SelectItem value="delivered">Completado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="refunded">Reembolsado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="">
                <TableRow>
                  <TableHead className="font-semibold text-azul-profundo">Pedido</TableHead>
                  <TableHead className="font-semibold text-azul-profundo">Cliente</TableHead>
                  <TableHead className="font-semibold text-azul-profundo">Fecha</TableHead>
                  <TableHead className="font-semibold text-azul-profundo">Estado</TableHead>
                  <TableHead className="font-semibold text-azul-profundo">Pago</TableHead>
                  <TableHead className="font-semibold text-azul-profundo">Total</TableHead>
                  <TableHead className="w-[50px] font-semibold text-azul-profundo">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-[#AE000025] transition-colors">
                    <TableCell className="py-4">
                      <div>
                        <p className="font-medium text-azul-profundo">{order.order_number}</p>
                        <p className="text-xs text-tierra-media">
                          {order.order_items.length} producto{order.order_items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div>
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-xs text-tierra-media">{order.customer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-1 text-tierra-media" />
                        {formatDate(order.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Select 
                        value={order.status} 
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
                        disabled={updating === order.id}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue>{getStatusBadge(order.status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-2" />
                              Pendiente
                            </div>
                          </SelectItem>
                          <SelectItem value="processing">
                            <div className="flex items-center">
                              <Package className="h-3 w-3 mr-2" />
                              Procesando
                            </div>
                          </SelectItem>
                          <SelectItem value="shipped">
                            <div className="flex items-center">
                              <Truck className="h-3 w-3 mr-2" />
                              Enviado
                            </div>
                          </SelectItem>
                          <SelectItem value="delivered">
                            <div className="flex items-center">
                              <CheckCircle className="h-3 w-3 mr-2" />
                              Completado
                            </div>
                          </SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                          <SelectItem value="refunded">Reembolsado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-4">
                      <Select 
                        value={order.payment_status} 
                        onValueChange={(value) => updatePaymentStatus(order.id, value)}
                        disabled={updating === order.id}
                      >
                        <SelectTrigger className="w-[120px] h-8 text-xs">
                          <SelectValue>{getPaymentStatusBadge(order.payment_status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-2 text-dorado" />
                              Pendiente
                            </div>
                          </SelectItem>
                          <SelectItem value="paid">
                            <div className="flex items-center">
                              <CheckCircle className="h-3 w-3 mr-2 text-verde-suave" />
                              Pagado
                            </div>
                          </SelectItem>
                          <SelectItem value="failed">
                            <div className="flex items-center">
                              <XCircle className="h-3 w-3 mr-2 text-red-500" />
                              Fallido
                            </div>
                          </SelectItem>
                          <SelectItem value="refunded">Reembolsado</SelectItem>
                          <SelectItem value="partially_refunded">Parcialmente Reembolsado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="font-semibold text-verde-suave">
                        {formatPrice(order.total_amount)}
                      </p>
                    </TableCell>
                    <TableCell className="py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalles
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        {order.status === 'pending' && (
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order.id, 'processing')}
                            disabled={updating === order.id}
                          >
                            <Package className="h-4 w-4 mr-2" />
                            Marcar como Procesando
                          </DropdownMenuItem>
                        )}
                        
                        {order.status === 'processing' && (
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order.id, 'shipped')}
                            disabled={updating === order.id}
                          >
                            <Truck className="h-4 w-4 mr-2" />
                            Marcar como Enviado
                          </DropdownMenuItem>
                        )}
                        
                        {order.status === 'shipped' && (
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                            disabled={updating === order.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marcar como Completado
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onClick={() => sendEmailNotification(order)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Enviar Notificación
                        </DropdownMenuItem>
                        
                        {order.mp_payment_id && (
                          <DropdownMenuItem asChild>
                            <a 
                              href={`https://www.mercadopago.com.ar/activities?id=${order.mp_payment_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Ver en MercadoPago
                            </a>
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                          onClick={() => deleteOrder(order.id)}
                          disabled={deletingOrder === order.id}
                          className="text-red-600 focus:text-red-600"
                        >
                          {deletingOrder === order.id ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Eliminando...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar Pedido
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {displayOrders.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-tierra-media mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-azul-profundo mb-2">
                No hay pedidos
              </h3>
              <p className="text-tierra-media">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No se encontraron pedidos con los filtros aplicados'
                  : 'Aún no hay pedidos para mostrar'
                }
              </p>
            </div>
          )}
        </CardContent>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-tierra-media">
              Mostrando {((currentPage - 1) * ordersPerPage) + 1} a {Math.min(currentPage * ordersPerPage, totalOrders)} de {totalOrders} pedidos
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show first 2, current page, and last 2 pages
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={loading}
                      className={currentPage === pageNum ? "bg-[#AE0000] hover:bg-[#C70000]" : ""}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || loading}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-azul-profundo">
              Detalles del Pedido
            </DialogTitle>
            <DialogDescription>
              {selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-azul-profundo mb-2">Cliente</h4>
                  <div className="space-y-1">
                    <p className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-2 text-tierra-media" />
                      {selectedOrder.customer_name}
                    </p>
                    <p className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-tierra-media" />
                      {selectedOrder.customer_email}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-azul-profundo mb-2">Pago</h4>
                  <div className="space-y-1">
                    <p className="flex items-center text-sm">
                      <CreditCard className="h-4 w-4 mr-2 text-tierra-media" />
                      {selectedOrder.mp_payment_method || 'MercadoPago'}
                    </p>
                    {selectedOrder.mp_payment_id && (
                      <p className="text-xs text-tierra-media">
                        ID: {selectedOrder.mp_payment_id}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold text-azul-profundo mb-3">Productos</h4>
                <div className="space-y-2">
                  {selectedOrder.order_items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-azul-profundo">{item.product_name}</p>
                        {item.variant_title && (
                          <p className="text-xs text-tierra-media">Variante: {item.variant_title}</p>
                        )}
                        <p className="text-sm text-tierra-media">Cantidad: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-verde-suave">
                        {formatPrice(item.unit_price)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-azul-profundo">Total del Pedido</h4>
                  <p className="text-2xl font-bold text-verde-suave">
                    {formatPrice(selectedOrder.total_amount)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Manual Order Dialog */}
      <Dialog open={showCreateOrder} onOpenChange={setShowCreateOrder}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-azul-profundo">
              Crear Pedido Manual
            </DialogTitle>
            <DialogDescription>
              Agregar un pedido realizado fuera de la plataforma
            </DialogDescription>
          </DialogHeader>
          
          <CreateManualOrderForm 
            onSubmit={createManualOrder}
            onCancel={() => setShowCreateOrder(false)}
          />
        </DialogContent>
      </Dialog>

    </div>
  );
}
