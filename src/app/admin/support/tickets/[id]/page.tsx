"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  MessageSquare, 
  ArrowLeft,
  Send,
  UserCircle,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Package,
  Calendar,
  User,
  Settings,
  FileText,
  Edit,
  Trash2,
  MessageCircle,
  Lock,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string; // Database field name
  description: string;
  status: string;
  priority: string;
  category_id: string;
  customer_id: string;
  assigned_to?: string;
  order_id?: string;
  resolution?: string;
  customer_satisfaction_rating?: number;
  created_at: string;
  updated_at: string;
  first_response_at?: string;
  resolved_at?: string;
  category?: {
    id: string;
    name: string;
    description: string;
  };
  customer?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
    phone?: string;
    membership_tier?: string;
    is_member?: boolean;
  };
  assigned_admin?: {
    id: string;
    email: string;
  };
  resolved_admin?: {
    id: string;
    email: string;
  };
  order?: {
    id: string;
    order_number: string;
    total_amount: number;
    status: string;
    created_at: string;
  };
  messages?: SupportMessage[];
  analytics?: {
    ageHours: number;
    responseTimeHours?: number;
    messageCount: number;
    customerMessageCount: number;
    adminMessageCount: number;
    internalNoteCount: number;
    needsResponse: boolean;
    lastCustomerMessageAt?: string;
    lastAdminMessageAt?: string;
  };
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  message: string;
  is_internal: boolean;
  is_from_customer: boolean;
  sender_id: string;
  sender_name?: string;
  sender_email?: string;
  message_type: string;
  attachments?: any;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  color: string;
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Message composition
  const [newMessage, setNewMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Edit ticket dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    status: '',
    priority: '',
    assigned_to: '',
    category_id: '',
    resolution: ''
  });

  useEffect(() => {
    if (ticketId) {
      fetchTicketDetails();
      fetchCategories();
      fetchAdminUsers();
    }
  }, [ticketId]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/support/tickets/${ticketId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch ticket details');
      }
      const data = await response.json();
      setTicket(data.ticket);
      setEditForm({
        status: data.ticket.status || '',
        priority: data.ticket.priority || '',
        assigned_to: data.ticket.assigned_to || '',
        category_id: data.ticket.category_id || '',
        resolution: data.ticket.resolution || ''
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching ticket details:', err);
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
      console.error('Error fetching categories:', err);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setAdminUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching admin users:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticket) return;
    
    try {
      setSendingMessage(true);
      const response = await fetch(`/api/admin/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          is_internal: isInternalNote,
          is_from_customer: false
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Add the new message to the ticket
      setTicket(prev => ({
        ...prev!,
        messages: [...(prev!.messages || []), data.message]
      }));
      
      setNewMessage('');
      setIsInternalNote(false);
      
      toast.success(isInternalNote ? 'Nota interna agregada' : 'Mensaje enviado');
      
      // Refresh ticket to get updated analytics
      fetchTicketDetails();
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar el mensaje';
      toast.error('Error al enviar el mensaje', {
        description: errorMessage
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateTicket = async () => {
    if (!ticket) return;
    
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editForm,
          assigned_to: editForm.assigned_to || null, // Convert empty string to null
          category_id: editForm.category_id || null, // Convert empty string to null
          previous_status: ticket.status,
          previous_assigned_to: ticket.assigned_to
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update ticket');
      }

      const data = await response.json();
      setTicket(data.ticket);
      setEditDialogOpen(false);
      
      toast.success('Ticket actualizado exitosamente');
      
      // Refresh to get updated data
      fetchTicketDetails();
    } catch (err) {
      console.error('Error updating ticket:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar el ticket';
      toast.error('Error al actualizar el ticket', {
        description: errorMessage
      });
    } finally {
      setUpdating(false);
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-AR');
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/support">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-azul-profundo">Cargando ticket...</h1>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/support">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="text-center py-16">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">Error al cargar el ticket</h3>
            <p className="text-tierra-media mb-4">{error || 'Ticket no encontrado'}</p>
            <Button onClick={fetchTicketDetails}>Reintentar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/support">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-azul-profundo">
                Ticket #{ticket.ticket_number}
              </h1>
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
            </div>
            <p className="text-tierra-media">
              Creado {formatTimeAgo(ticket.created_at)} • Última actividad {formatTimeAgo(ticket.updated_at)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Details */}
          <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                {ticket.subject}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-azul-profundo mb-2">Descripción:</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-tierra-media whitespace-pre-wrap">{ticket.description}</p>
                  </div>
                </div>

                {ticket.resolution && (
                  <div>
                    <h4 className="font-semibold text-verde-suave mb-2">Resolución:</h4>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-green-800 whitespace-pre-wrap">{ticket.resolution}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Messages Thread */}
          <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Conversación ({ticket.messages?.length || 0} mensajes)
                </div>
                {ticket.analytics?.needsResponse && (
                  <Badge variant="destructive">Requiere respuesta</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {ticket.messages?.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.is_from_customer ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[80%] rounded-lg p-4 ${
                      message.is_internal 
                        ? 'bg-yellow-50 border border-yellow-200'
                        : message.is_from_customer 
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-green-50 border border-green-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {message.is_from_customer ? (
                            <User className="h-4 w-4 text-blue-600" />
                          ) : (
                            <UserCircle className="h-4 w-4 text-green-600" />
                          )}
                          <span className="text-sm font-medium">
                            {message.is_from_customer 
                              ? `${ticket.customer?.first_name} ${ticket.customer?.last_name}`.trim() || 'Cliente'
                              : message.sender_email || 'Admin'
                            }
                          </span>
                          {message.is_internal && (
                            <Badge variant="outline" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              Nota interna
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-tierra-media">
                          {formatDateTime(message.created_at)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    </div>
                  </div>
                ))}

                {(!ticket.messages || ticket.messages.length === 0) && (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-tierra-media mx-auto mb-4" />
                    <p className="text-tierra-media">No hay mensajes en esta conversación</p>
                  </div>
                )}
              </div>

              {/* Reply Form */}
              <div className="mt-6 pt-6 border-t">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Lock className="h-4 w-4" />
                      <span className="text-sm">Nota interna (solo visible para administradores)</span>
                    </label>
                  </div>
                  
                  <Textarea
                    placeholder={isInternalNote ? "Escribir nota interna..." : "Escribir respuesta al cliente..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={4}
                    className="min-h-[100px]"
                  />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-tierra-media">
                      {isInternalNote ? (
                        <div className="flex items-center gap-2 text-orange-600">
                          <Lock className="h-4 w-4" />
                          Esta nota solo será visible para administradores
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Globe className="h-4 w-4" />
                          Este mensaje será enviado al cliente
                        </div>
                      )}
                    </span>
                    
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {sendingMessage ? 'Enviando...' : (isInternalNote ? 'Agregar Nota' : 'Enviar Respuesta')}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-tierra-media">Nombre:</label>
                <p className="font-medium">
                  {ticket.customer?.first_name && ticket.customer?.last_name 
                    ? `${ticket.customer.first_name} ${ticket.customer.last_name}`
                    : 'Sin nombre'
                  }
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-tierra-media">Email:</label>
                <p className="font-medium">{ticket.customer?.email}</p>
              </div>

              {ticket.customer?.phone && (
                <div>
                  <label className="text-sm font-medium text-tierra-media">Teléfono:</label>
                  <p className="font-medium">{ticket.customer.phone}</p>
                </div>
              )}

              {ticket.customer?.is_member && (
                <div>
                  <label className="text-sm font-medium text-tierra-media">Membresía:</label>
                  <Badge variant="outline" className="mt-1">
                    {ticket.customer.membership_tier || 'Miembro'}
                  </Badge>
                </div>
              )}

              {ticket.order && (
                <div className="pt-3 border-t">
                  <label className="text-sm font-medium text-tierra-media">Pedido Relacionado:</label>
                  <div className="mt-1">
                    <Link href={`/admin/orders/${ticket.order.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <Package className="h-4 w-4 mr-2" />
                        #{ticket.order.order_number}
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ticket Analytics */}
          {ticket.analytics && (
            <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Métricas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-tierra-media">Edad del ticket:</span>
                  <span className="font-medium">{ticket.analytics.ageHours}h</span>
                </div>
                
                {ticket.analytics.responseTimeHours && (
                  <div className="flex justify-between">
                    <span className="text-sm text-tierra-media">Tiempo de respuesta:</span>
                    <span className="font-medium">{ticket.analytics.responseTimeHours}h</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-sm text-tierra-media">Total mensajes:</span>
                  <span className="font-medium">{ticket.analytics.messageCount}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-tierra-media">Mensajes del cliente:</span>
                  <span className="font-medium">{ticket.analytics.customerMessageCount}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-tierra-media">Respuestas admin:</span>
                  <span className="font-medium">{ticket.analytics.adminMessageCount}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-tierra-media">Notas internas:</span>
                  <span className="font-medium">{ticket.analytics.internalNoteCount}</span>
                </div>

                {ticket.analytics.needsResponse && (
                  <div className="pt-3 border-t">
                    <Badge variant="destructive" className="w-full justify-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Requiere respuesta
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Ticket Metadata */}
          <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Detalles del Ticket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-tierra-media">Categoría:</label>
                <p className="font-medium">
                  {ticket.category?.name || 'Sin categoría'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-tierra-media">Asignado a:</label>
                <p className="font-medium">
                  {ticket.assigned_admin?.email || 'Sin asignar'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-tierra-media">Creado:</label>
                <p className="text-sm">{formatDateTime(ticket.created_at)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-tierra-media">Última actualización:</label>
                <p className="text-sm">{formatDateTime(ticket.updated_at)}</p>
              </div>

              {ticket.first_response_at && (
                <div>
                  <label className="text-sm font-medium text-tierra-media">Primera respuesta:</label>
                  <p className="text-sm">{formatDateTime(ticket.first_response_at)}</p>
                </div>
              )}

              {ticket.resolved_at && (
                <div>
                  <label className="text-sm font-medium text-tierra-media">Resuelto:</label>
                  <p className="text-sm">{formatDateTime(ticket.resolved_at)}</p>
                </div>
              )}

              {ticket.customer_satisfaction_rating && (
                <div>
                  <label className="text-sm font-medium text-tierra-media">Calificación:</label>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-lg ${
                          i < ticket.customer_satisfaction_rating! ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                    <span className="ml-2 text-sm">({ticket.customer_satisfaction_rating}/5)</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Ticket Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Ticket #{ticket.ticket_number}</DialogTitle>
            <DialogDescription>
              Actualiza el estado, prioridad y asignación del ticket
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-tierra-media mb-2 block">Estado:</label>
              <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Abierto</SelectItem>
                  <SelectItem value="in_progress">En progreso</SelectItem>
                  <SelectItem value="pending_customer">Esperando cliente</SelectItem>
                  <SelectItem value="resolved">Resuelto</SelectItem>
                  <SelectItem value="closed">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-tierra-media mb-2 block">Prioridad:</label>
              <Select value={editForm.priority} onValueChange={(value) => setEditForm(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-tierra-media mb-2 block">Categoría:</label>
              <Select value={editForm.category_id} onValueChange={(value) => setEditForm(prev => ({ ...prev, category_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-tierra-media mb-2 block">Asignar a:</label>
              <Select value={editForm.assigned_to || 'unassigned'} onValueChange={(value) => setEditForm(prev => ({ ...prev, assigned_to: value === 'unassigned' ? '' : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Sin asignar</SelectItem>
                  {adminUsers.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.email || admin.name || `Admin ${admin.id.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(editForm.status === 'resolved' || editForm.status === 'closed') && (
            <div>
              <label className="text-sm font-medium text-tierra-media mb-2 block">Resolución:</label>
              <Textarea
                placeholder="Describe cómo se resolvió el problema..."
                value={editForm.resolution}
                onChange={(e) => setEditForm(prev => ({ ...prev, resolution: e.target.value }))}
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
              disabled={updating}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateTicket}
              disabled={updating}
            >
              {updating ? 'Actualizando...' : 'Actualizar Ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
