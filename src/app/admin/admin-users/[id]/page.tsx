"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Crown, Mail, Phone, Calendar, Activity, Clock, Shield } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  permissions: Record<string, string[]>;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  analytics?: {
    activityCount30Days: number;
    lastActivity?: string;
    fullName?: string;
  };
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const adminId = params.id as string;

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (adminId) {
      fetchAdminUser();
    }
  }, [adminId]);

  const fetchAdminUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/admin-users/${adminId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Administrador no encontrado');
        }
        throw new Error('Error al cargar el administrador');
      }

      const data = await response.json();
      setAdminUser(data.adminUser);
      setError(null);
    } catch (err) {
      console.error('Error fetching admin user:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast.error(err instanceof Error ? err.message : 'Error al cargar el administrador');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-admin-accent-tertiary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-tierra-media">Cargando administrador...</p>
        </div>
      </div>
    );
  }

  if (error || !adminUser) {
    return (
      <div className="container mx-auto py-8">
        <Card className="bg-admin-bg-tertiary">
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-azul-profundo mb-4">Error</h2>
              <p className="text-tierra-media mb-6">{error || 'Administrador no encontrado'}</p>
              <Button onClick={() => router.push('/admin/admin-users')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Administradores
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fullName = adminUser.profiles 
    ? `${adminUser.profiles.first_name || ''} ${adminUser.profiles.last_name || ''}`.trim() || adminUser.email
    : adminUser.email;

  return (
    <div className="container mx-auto py-8 space-y-6" style={{ paddingTop: '1rem' }}>
      {/* Header */}
      <div className="space-y-4">
        {/* First Row: Back Button */}
        <div>
          <Link href="/admin/admin-users">
            <Button variant="default" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>
        
        {/* Second Row: Title and Edit Button */}
        <div className="flex items-center justify-between" style={{ marginTop: '2rem' }}>
          <div>
            <h1 className="text-3xl font-bold text-azul-profundo">Detalles del Administrador</h1>
            <p className="text-tierra-media">Información completa del usuario administrador</p>
          </div>
          <Link href={`/admin/admin-users/${adminId}/edit`}>
            <Button>
              Editar Administrador
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Info Card */}
      <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-admin-accent-tertiary/20 flex items-center justify-center">
              <Crown className="h-6 w-6 text-admin-accent-tertiary" />
            </div>
            <div>
              <div className="text-2xl">{fullName}</div>
              <div className="text-sm font-normal text-tierra-media">{adminUser.email}</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status and Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-tierra-media">Estado</label>
              <div className="mt-1">
                {adminUser.is_active ? (
                  <Badge className="bg-verde-suave text-primary">Activo</Badge>
                ) : (
                  <Badge variant="destructive">Inactivo</Badge>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm text-tierra-media">Rol</label>
              <div className="mt-1">
                <Badge variant="default" className="flex items-center gap-1 w-fit">
                  <Crown className="h-3 w-3" />
                  Administrador
                </Badge>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-tierra-media" />
              <div>
                <label className="text-sm text-tierra-media">Email</label>
                <div className="font-medium">{adminUser.email}</div>
              </div>
            </div>
            {adminUser.profiles?.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-tierra-media" />
                <div>
                  <label className="text-sm text-tierra-media">Teléfono</label>
                  <div className="font-medium">{adminUser.profiles.phone}</div>
                </div>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-tierra-media" />
              <div>
                <label className="text-sm text-tierra-media">Fecha de Registro</label>
                <div className="font-medium">
                  {new Date(adminUser.created_at).toLocaleDateString('es-AR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
            {adminUser.last_login && (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-tierra-media" />
                <div>
                  <label className="text-sm text-tierra-media">Último Acceso</label>
                  <div className="font-medium">
                    {new Date(adminUser.last_login).toLocaleDateString('es-AR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Activity */}
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-tierra-media" />
            <div>
              <label className="text-sm text-tierra-media">Actividad (últimos 30 días)</label>
              <div className="font-medium">
                {adminUser.analytics?.activityCount30Days || 0} acciones
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Card */}
      <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permisos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(adminUser.permissions || {}).map(([resource, actions]) => (
              <div key={resource} className="p-3 bg-admin-bg-tertiary rounded-md">
                <div className="font-medium capitalize mb-2">{resource.replace('_', ' ')}</div>
                <div className="flex flex-wrap gap-1">
                  {actions.map((action) => (
                    <Badge key={action} variant="outline" className="text-xs">
                      {action}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

