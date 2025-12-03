"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Crown, Save, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  permissions: Record<string, string[]>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function EditAdminUserPage() {
  const params = useParams();
  const router = useRouter();
  const adminId = params.id as string;

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    is_active: true,
    permissions: {} as Record<string, string[]>
  });

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
      setFormData({
        is_active: data.adminUser.is_active,
        permissions: data.adminUser.permissions || {}
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching admin user:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast.error(err instanceof Error ? err.message : 'Error al cargar el administrador');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/admin-users/${adminId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: formData.is_active,
          permissions: formData.permissions
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el administrador');
      }

      toast.success('Administrador actualizado exitosamente');
      router.push(`/admin/admin-users/${adminId}`);
    } catch (err) {
      console.error('Error updating admin user:', err);
      toast.error(err instanceof Error ? err.message : 'Error al actualizar el administrador');
    } finally {
      setSaving(false);
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
              <Link href="/admin/admin-users">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver a Administradores
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-azul-profundo">Editar Administrador</h1>
          <p className="text-tierra-media">Modificar información del administrador</p>
        </div>
        <Link href={`/admin/admin-users/${adminId}`}>
          <Button variant="default" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>

      {/* Form Card */}
      <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            {adminUser.email}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email (read-only) */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={adminUser.email}
              disabled
              className="bg-admin-bg-tertiary"
            />
            <p className="text-sm text-tierra-media mt-1">
              El email no puede ser modificado
            </p>
          </div>

          {/* Role (read-only) */}
          <div>
            <Label>Rol</Label>
            <div className="mt-2 p-3 bg-admin-bg-tertiary rounded-md">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-admin-accent-tertiary" />
                <span className="font-medium">Administrador</span>
              </div>
              <p className="text-sm text-tierra-media mt-1">
                El rol no puede ser modificado
              </p>
            </div>
          </div>

          {/* Status */}
          <div>
            <Label>Estado</Label>
            <div className="mt-2 flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">
                  {formData.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </label>
              {formData.is_active ? (
                <Badge className="bg-verde-suave text-primary">Activo</Badge>
              ) : (
                <Badge variant="destructive">Inactivo</Badge>
              )}
            </div>
            <p className="text-sm text-tierra-media mt-1">
              Los administradores inactivos no pueden acceder al panel
            </p>
          </div>

          {/* Permissions Info */}
          <div>
            <Label>Permisos</Label>
            <div className="mt-2 p-4 bg-admin-bg-tertiary rounded-md">
              <p className="text-sm text-tierra-media">
                Los administradores tienen acceso completo a todas las funciones del sistema.
                Los permisos se gestionan automáticamente.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Link href={`/admin/admin-users/${adminId}`}>
              <Button variant="outline">
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </Link>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

