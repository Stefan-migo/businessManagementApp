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
import { 
  Users, 
  UserPlus, 
  Star, 
  Calendar,
  Mail,
  Phone,
  MapPin,
  Package,
  CreditCard,
  TrendingUp,
  Search,
  Filter,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle,
  Crown,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Customer {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  membership_tier: string;
  is_member: boolean;
  created_at: string;
  orders?: any[];
  analytics?: {
    totalSpent: number;
    orderCount: number;
    lastOrderDate?: string;
    avgOrderValue: number;
    segment: string;
    lifetimeValue: number;
  };
}

interface CustomerStats {
  totalCustomers: number;
  activeMembers: number;
  newCustomersThisMonth: number;
  membershipDistribution: Record<string, number>;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [membershipFilter, setMembershipFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch customers data
  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, [currentPage, membershipFilter, segmentFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(membershipFilter !== 'all' && { membership_tier: membershipFilter }),
        ...(segmentFilter !== 'all' && { segment: segmentFilter })
      });

      const response = await fetch(`/api/admin/customers?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      setCustomers(data.customers || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setError(null);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/customers', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}) // Send empty object to trigger analytics
      });
      if (!response.ok) {
        throw new Error('Failed to fetch customer stats');
      }

      const data = await response.json();
      setStats(data.summary);
    } catch (err) {
      console.error('Error fetching customer stats:', err);
    }
  };

  const formatPrice = (amount: number) => 
    new Intl.NumberFormat('es-AR', { 
      style: 'currency', 
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);

  const getSegmentBadge = (segment: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      'new': { variant: 'secondary', label: 'Nuevo', icon: Star },
      'first-time': { variant: 'outline', label: 'Primera Compra', icon: Package },
      'regular': { variant: 'default', label: 'Regular', icon: CheckCircle },
      'vip': { variant: 'secondary', label: 'VIP', icon: Crown },
      'at-risk': { variant: 'destructive', label: 'En Riesgo', icon: AlertTriangle }
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
    // If tier is 'none' or empty, show "Sin Membresía"
    if (!tier || tier === 'none') {
      return <Badge variant="outline">Sin Membresía</Badge>;
    }

    // If tier exists but isMember is false, still show the tier but with different styling
    const config: Record<string, { variant: any; label: string }> = {
      basic: { variant: 'secondary', label: 'Básica' },
      premium: { variant: 'default', label: 'Premium' }
    };

    const tierConfig = config[tier] || { variant: 'outline', label: tier };
    
    // If isMember is false, use outline variant to indicate inactive status
    const variant = isMember ? tierConfig.variant : 'outline';
    
    return <Badge variant={variant}>{tierConfig.label}</Badge>;
  };

  if (loading && customers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-azul-profundo">Gestión de Clientes</h1>
            <p className="text-tierra-media">Cargando información de clientes...</p>
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
            <h1 className="text-3xl font-bold text-azul-profundo">Gestión de Clientes</h1>
            <p className="text-tierra-media">Error al cargar los datos</p>
          </div>
        </div>
        <Card>
          <CardContent className="text-center py-16">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">Error al cargar clientes</h3>
            <p className="text-tierra-media mb-4">{error}</p>
            <Button onClick={fetchCustomers}>Reintentar</Button>
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
          <h1 className="text-3xl font-bold text-azul-profundo">Gestión de Clientes</h1>
          <p className="text-tierra-media">
            Administra tu base de clientes y comunidad
          </p>
        </div>
        
        <Button onClick={() => router.push('/admin/customers/new')}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-azul-profundo" />
                <div className="ml-4">
                  <p className="text-sm text-tierra-media">Total Clientes</p>
                  <p className="text-2xl font-bold text-azul-profundo">{stats.totalCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Crown className="h-8 w-8 text-dorado" />
                <div className="ml-4">
                  <p className="text-sm text-tierra-media">Miembros Activos</p>
                  <p className="text-2xl font-bold text-dorado">{stats.activeMembers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
            <CardContent className="p-6">
              <div className="flex items-center">
                <ArrowUpRight className="h-8 w-8 text-verde-suave" />
                <div className="ml-4">
                  <p className="text-sm text-tierra-media">Nuevos Este Mes</p>
                  <p className="text-2xl font-bold text-verde-suave">{stats.newCustomersThisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm text-tierra-media">Premium</p>
                  <p className="text-2xl font-bold text-red-500">{stats.membershipDistribution.premium || 0}</p>
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
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={membershipFilter} onValueChange={setMembershipFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Membresía" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las membresías</SelectItem>
                <SelectItem value="none">Sin membresía</SelectItem>
                <SelectItem value="basic">Básica</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>

            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los segmentos</SelectItem>
                <SelectItem value="new">Nuevos</SelectItem>
                <SelectItem value="first-time">Primera compra</SelectItem>
                <SelectItem value="regular">Regulares</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="at-risk">En riesgo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Lista de Clientes ({(() => {
              // Client-side filtering for search
              const filtered = customers.filter(customer => {
                if (!searchTerm) return true;
                const searchLower = searchTerm.toLowerCase();
                const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.toLowerCase();
                const email = customer.email.toLowerCase();
                return fullName.includes(searchLower) || email.includes(searchLower);
              });
              return filtered.length;
            })()})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Membresía</TableHead>
                <TableHead>Pedidos</TableHead>
                <TableHead>Total Gastado</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                // Client-side filtering for search
                const filteredCustomers = customers.filter(customer => {
                  if (!searchTerm) return true;
                  const searchLower = searchTerm.toLowerCase();
                  const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.toLowerCase();
                  const email = customer.email.toLowerCase();
                  return fullName.includes(searchLower) || email.includes(searchLower);
                });
                return filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-[#AE000025] transition-colors">
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {customer.first_name && customer.last_name 
                          ? `${customer.first_name} ${customer.last_name}`
                          : 'Sin nombre'
                        }
                      </div>
                      <div className="text-sm text-tierra-media">{customer.email}</div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="h-3 w-3 mr-1 text-tierra-media" />
                        <span className="text-tierra-media">Email</span>
                      </div>
                      {customer.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 mr-1 text-tierra-media" />
                          <span className="text-tierra-media">{customer.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getMembershipBadge(customer.membership_tier, customer.is_member)}
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-center">
                      <div className="font-medium">{customer.analytics?.orderCount || 0}</div>
                      {customer.analytics?.lastOrderDate && (
                        <div className="text-xs text-tierra-media">
                          Último: {new Date(customer.analytics.lastOrderDate).toLocaleDateString('es-AR')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatPrice(customer.analytics?.totalSpent || 0)}
                      </div>
                      {customer.analytics?.avgOrderValue && (
                        <div className="text-xs text-tierra-media">
                          Promedio: {formatPrice(customer.analytics.avgOrderValue)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {customer.analytics?.segment && getSegmentBadge(customer.analytics.segment)}
                  </TableCell>
                  
                  <TableCell className="text-sm text-tierra-media">
                    {new Date(customer.created_at).toLocaleDateString('es-AR')}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex space-x-2">
                      <Link href={`/admin/customers/${customer.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </Link>
                      <Link href={`/admin/customers/${customer.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ));
              })()}
            </TableBody>
          </Table>

          {customers.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-tierra-media mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-azul-profundo mb-2">No se encontraron clientes</h3>
              <p className="text-tierra-media">Ajusta los filtros o agrega nuevos clientes.</p>
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
