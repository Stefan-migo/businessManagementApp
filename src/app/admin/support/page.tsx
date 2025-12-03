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
  MessageSquare, 
  Plus,
  Search,
  Filter,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  Mail,
  Phone,
  Package,
  TrendingUp,
  Activity,
  FileText,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  customer_email: string;
  customer_name?: string;
  created_at: string;
  updated_at: string;
  first_response_at?: string;
  last_response_at?: string;
  assigned_to?: string;
  category?: {
    id: string;
    name: string;
  };
  assigned_admin?: {
    id: string;
    email: string;
  };
  customer?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
  };
  order?: {
    id: string;
    order_number: string;
  };
  stats?: {
    messageCount: number;
    customerMessageCount: number;
    adminMessageCount: number;
    ageHours: number;
    needsResponse: boolean;
  };
}

interface SupportStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  urgentTickets: number;
  avgResponseTimeHours: number;
  ticketsThisWeek: number;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Status update loading state
  const [updatingTickets, setUpdatingTickets] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTickets();
    fetchCategories();
  }, [currentPage, statusFilter, priorityFilter, categoryFilter, assignedFilter]);

  // Recalculate stats when tickets data changes
  useEffect(() => {
    if (tickets.length > 0) {
      fetchStats();
    }
  }, [tickets]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(categoryFilter !== 'all' && { category_id: categoryFilter }),
        ...(assignedFilter !== 'all' && { assigned_to: assignedFilter })
      });

      const response = await fetch(`/api/admin/support/tickets?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch support tickets');
      }

      const data = await response.json();
      setTickets(data.tickets || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setError(null);
    } catch (err) {
      console.error('Error fetching support tickets:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/support/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching support categories:', err);
    }
  };

  const fetchStats = async () => {
    try {
      // Calculate real-time stats from current tickets data
      const totalTickets = tickets.length;
      const openTickets = tickets.filter(t => t.status === 'open').length;
      const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
      const urgentTickets = tickets.filter(t => t.priority === 'urgent').length;
      
      // Calculate average response time
      const ticketsWithResponse = tickets.filter(t => t.first_response_at);
      const avgResponseTimeHours = ticketsWithResponse.length > 0 
        ? ticketsWithResponse.reduce((acc, ticket) => {
            const created = new Date(ticket.created_at).getTime();
            const firstResponse = new Date(ticket.first_response_at!).getTime();
            return acc + (firstResponse - created) / (1000 * 60 * 60);
          }, 0) / ticketsWithResponse.length
        : 0;
      
      // Calculate tickets this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const ticketsThisWeek = tickets.filter(t => {
        return new Date(t.created_at) > weekAgo;
      }).length;

      setStats({
        totalTickets,
        openTickets,
        inProgressTickets,
        urgentTickets,
        avgResponseTimeHours: Math.round(avgResponseTimeHours * 10) / 10, // Round to 1 decimal
        ticketsThisWeek
      });
    } catch (err) {
      console.error('Error calculating support stats:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string; icon: any }> = {
      open: { variant: 'destructive', label: 'Abierto', icon: AlertTriangle },
      in_progress: { variant: 'default', label: 'En Progreso', icon: Activity },
      pending_customer: { variant: 'secondary', label: 'Esperando Cliente', icon: Clock },
      resolved: { variant: 'outline', label: 'Resuelto', icon: CheckCircle },
      closed: { variant: 'outline', label: 'Cerrado', icon: CheckCircle }
    };

    const statusConfig = config[status] || config['open'];
    const Icon = statusConfig.icon;

    return (
      <Badge variant={statusConfig.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      low: { variant: 'outline', label: 'Baja' },
      medium: { variant: 'secondary', label: 'Media' },
      high: { variant: 'default', label: 'Alta' },
      urgent: { variant: 'destructive', label: 'Urgente' }
    };

    const priorityConfig = config[priority] || config['medium'];
    return <Badge variant={priorityConfig.variant}>{priorityConfig.label}</Badge>;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Hace menos de 1 hora';
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-AR');
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      // Add to updating set
      setUpdatingTickets(prev => new Set(prev).add(ticketId));

      const response = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          previous_status: tickets.find(t => t.id === ticketId)?.status
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update ticket status');
      }

      const data = await response.json();
      
      // Update the ticket in the local state
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === ticketId ? { ...ticket, status: newStatus, updated_at: new Date().toISOString() } : ticket
        )
      );

      // Remove from updating set
      setUpdatingTickets(prev => {
        const newSet = new Set(prev);
        newSet.delete(ticketId);
        return newSet;
      });

      toast.success('Estado actualizado exitosamente');
      
      // Refresh stats
      fetchStats();
    } catch (err) {
      console.error('Error updating ticket status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar el estado';
      toast.error('Error al actualizar el estado', {
        description: errorMessage
      });
      
      // Remove from updating set
      setUpdatingTickets(prev => {
        const newSet = new Set(prev);
        newSet.delete(ticketId);
        return newSet;
      });
    }
  };

  const handlePriorityChange = async (ticketId: string, newPriority: string) => {
    try {
      // Add to updating set
      setUpdatingTickets(prev => new Set(prev).add(ticketId));

      const response = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priority: newPriority
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update ticket priority');
      }

      // Update local state
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === ticketId ? { ...ticket, priority: newPriority, updated_at: new Date().toISOString() } : ticket
        )
      );

      // Remove from updating set
      setUpdatingTickets(prev => {
        const newSet = new Set(prev);
        newSet.delete(ticketId);
        return newSet;
      });

      toast.success('Prioridad actualizada exitosamente');
      
      // Refresh stats
      fetchStats();
    } catch (err) {
      console.error('Error updating ticket priority:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar la prioridad';
      toast.error('Error al actualizar la prioridad', {
        description: errorMessage
      });
      
      // Remove from updating set
      setUpdatingTickets(prev => {
        const newSet = new Set(prev);
        newSet.delete(ticketId);
        return newSet;
      });
    }
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-azul-profundo">Soporte al Cliente</h1>
            <p className="text-tierra-media">Cargando tickets de soporte...</p>
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
            <h1 className="text-3xl font-bold text-azul-profundo">Soporte al Cliente</h1>
            <p className="text-tierra-media">Error al cargar los datos</p>
          </div>
        </div>
        <Card>
          <CardContent className="text-center py-16">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">Error al cargar soporte</h3>
            <p className="text-tierra-media mb-4">{error}</p>
            <Button onClick={fetchTickets}>Reintentar</Button>
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
          <h1 className="text-3xl font-bold text-azul-profundo">Soporte al Cliente</h1>
          <p className="text-tierra-media">
            Gestiona tickets de soporte y comunicación con clientes
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Link href="/admin/support/templates">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Plantillas
            </Button>
          </Link>
          <Link href="/admin/support/tickets/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Ticket
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
            <CardContent className="p-4">
              <div className="flex items-center">
                <MessageSquare className="h-6 w-6 text-azul-profundo" />
                <div className="ml-3">
                  <p className="text-xs text-tierra-media">Total</p>
                  <p className="text-lg font-bold text-azul-profundo">{stats.totalTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <div className="ml-3">
                  <p className="text-xs text-tierra-media">Abiertos</p>
                  <p className="text-lg font-bold text-red-500">{stats.openTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Activity className="h-6 w-6 text-dorado" />
                <div className="ml-3">
                  <p className="text-xs text-tierra-media">En Progreso</p>
                  <p className="text-lg font-bold text-dorado">{stats.inProgressTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div className="ml-3">
                  <p className="text-xs text-tierra-media">Urgentes</p>
                  <p className="text-lg font-bold text-red-600">{stats.urgentTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-6 w-6 text-verde-suave" />
                <div className="ml-3">
                  <p className="text-xs text-tierra-media">Tiempo Resp.</p>
                  <p className="text-lg font-bold text-verde-suave">
                    {stats.avgResponseTimeHours > 0 ? `${stats.avgResponseTimeHours}h` : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
            <CardContent className="p-4">
              <div className="flex items-center">
                <TrendingUp className="h-6 w-6 text-blue-500" />
                <div className="ml-3">
                  <p className="text-xs text-tierra-media">Esta Semana</p>
                  <p className="text-lg font-bold text-blue-500">{stats.ticketsThisWeek}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tierra-media h-4 w-4" />
                <Input
                  placeholder="Buscar por número, asunto o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="open">Abiertos</SelectItem>
                <SelectItem value="in_progress">En progreso</SelectItem>
                <SelectItem value="pending_customer">Esperando cliente</SelectItem>
                <SelectItem value="resolved">Resueltos</SelectItem>
                <SelectItem value="closed">Cerrados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={assignedFilter} onValueChange={setAssignedFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Asignación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las asignaciones</SelectItem>
                <SelectItem value="unassigned">Sin asignar</SelectItem>
                <SelectItem value="assigned">Asignados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Tickets de Soporte ({(() => {
              // Client-side filtering for search
              const filtered = tickets.filter(ticket => {
                if (!searchTerm) return true;
                const searchLower = searchTerm.toLowerCase();
                const ticketNumber = (ticket.ticket_number || '').toLowerCase();
                const subject = (ticket.subject || '').toLowerCase();
                const customerName = (ticket.customer_name || '').toLowerCase();
                const customerEmail = (ticket.customer_email || '').toLowerCase();
                const customerFirstName = (ticket.customer?.first_name || '').toLowerCase();
                const customerLastName = (ticket.customer?.last_name || '').toLowerCase();
                const fullCustomerName = `${customerFirstName} ${customerLastName}`.trim();
                
                return ticketNumber.includes(searchLower) || 
                       subject.includes(searchLower) || 
                       customerName.includes(searchLower) || 
                       customerEmail.includes(searchLower) ||
                       customerFirstName.includes(searchLower) ||
                       customerLastName.includes(searchLower) ||
                       fullCustomerName.includes(searchLower);
              });
              return filtered.length;
            })()})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Asignado</TableHead>
                <TableHead>Última Actividad</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                // Client-side filtering for search
                const filteredTickets = tickets.filter(ticket => {
                  if (!searchTerm) return true;
                  const searchLower = searchTerm.toLowerCase();
                  const ticketNumber = (ticket.ticket_number || '').toLowerCase();
                  const subject = (ticket.subject || '').toLowerCase();
                  const customerName = (ticket.customer_name || '').toLowerCase();
                  const customerEmail = (ticket.customer_email || '').toLowerCase();
                  const customerFirstName = (ticket.customer?.first_name || '').toLowerCase();
                  const customerLastName = (ticket.customer?.last_name || '').toLowerCase();
                  const fullCustomerName = `${customerFirstName} ${customerLastName}`.trim();
                  
                  return ticketNumber.includes(searchLower) || 
                         subject.includes(searchLower) || 
                         customerName.includes(searchLower) || 
                         customerEmail.includes(searchLower) ||
                         customerFirstName.includes(searchLower) ||
                         customerLastName.includes(searchLower) ||
                         fullCustomerName.includes(searchLower);
                });
                return filteredTickets.map((ticket) => (
                <TableRow key={ticket.id} className={ticket.stats?.needsResponse ? 'bg-yellow-50' : 'hover:bg-[#AE000025] transition-colors'}>
                  <TableCell>
                    <div>
                      <div className="font-medium">#{ticket.ticket_number}</div>
                      <div className="text-sm text-tierra-media truncate max-w-[200px]">
                        {ticket.subject}
                      </div>
                      <div className="text-xs text-tierra-media">
                        {formatTimeAgo(ticket.created_at)}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {ticket.customer?.first_name && ticket.customer?.last_name 
                          ? `${ticket.customer.first_name} ${ticket.customer.last_name}`
                          : ticket.customer_name || 'Sin nombre'
                        }
                      </div>
                      <div className="text-sm text-tierra-media">{ticket.customer_email}</div>
                      {ticket.order && (
                        <div className="text-xs text-tierra-media">
                          Pedido: #{ticket.order.order_number}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {ticket.category ? (
                      <Badge variant="outline">{ticket.category.name}</Badge>
                    ) : (
                      <span className="text-tierra-media">Sin categoría</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Select 
                      value={ticket.status} 
                      onValueChange={(value) => handleStatusChange(ticket.id, value)}
                      disabled={updatingTickets.has(ticket.id)}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue>
                          {updatingTickets.has(ticket.id) ? (
                            <span className="text-xs">Actualizando...</span>
                          ) : (
                            getStatusBadge(ticket.status)
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3" />
                            Abierto
                          </div>
                        </SelectItem>
                        <SelectItem value="in_progress">
                          <div className="flex items-center gap-2">
                            <Activity className="h-3 w-3" />
                            En Progreso
                          </div>
                        </SelectItem>
                        <SelectItem value="pending_customer">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            Esperando Cliente
                          </div>
                        </SelectItem>
                        <SelectItem value="resolved">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3" />
                            Resuelto
                          </div>
                        </SelectItem>
                        <SelectItem value="closed">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3" />
                            Cerrado
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  
                  <TableCell>
                    <Select 
                      value={ticket.priority} 
                      onValueChange={(value) => handlePriorityChange(ticket.id, value)}
                      disabled={updatingTickets.has(ticket.id)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue>
                          {updatingTickets.has(ticket.id) ? (
                            <span className="text-xs">Actualizando...</span>
                          ) : (
                            getPriorityBadge(ticket.priority)
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <Badge variant="outline">Baja</Badge>
                        </SelectItem>
                        <SelectItem value="medium">
                          <Badge variant="secondary">Media</Badge>
                        </SelectItem>
                        <SelectItem value="high">
                          <Badge variant="default">Alta</Badge>
                        </SelectItem>
                        <SelectItem value="urgent">
                          <Badge variant="destructive">Urgente</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  
                  <TableCell>
                    {ticket.assigned_admin ? (
                      <div className="text-sm">
                        <div className="font-medium">{ticket.assigned_admin.email}</div>
                      </div>
                    ) : (
                      <Badge variant="outline">Sin asignar</Badge>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      {ticket.last_response_at ? (
                        <div>
                          <div className="font-medium">
                            {formatTimeAgo(ticket.last_response_at)}
                          </div>
                          {ticket.stats?.needsResponse && (
                            <Badge variant="destructive" className="text-xs">
                              Requiere respuesta
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-tierra-media">Sin respuesta</span>
                      )}
                      
                      {ticket.stats && (
                        <div className="text-xs text-tierra-media mt-1">
                          {ticket.stats.messageCount} mensajes
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Link href={`/admin/support/tickets/${ticket.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ));
              })()}
            </TableBody>
          </Table>

          {tickets.length === 0 && !loading && (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-tierra-media mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-azul-profundo mb-2">No se encontraron tickets</h3>
              <p className="text-tierra-media">Ajusta los filtros o crea un nuevo ticket de soporte.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 space-x-2">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Anterior
              </Button>
              
              <span className="text-sm text-tierra-media">
                Página {currentPage} de {totalPages}
              </span>
              
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
