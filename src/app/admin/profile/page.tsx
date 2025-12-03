"use client";

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  Lock, 
  Save, 
  Eye, 
  EyeOff,
  Mail,
  Phone,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, profile, loading: authLoading, refetchProfile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Personal information form state
  const [personalInfo, setPersonalInfo] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    bio: ''
  });

  // Password change form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Load profile data on mount
  useEffect(() => {
    if (!authLoading && user) {
      loadProfileData();
    }
  }, [authLoading, user, profile]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Use profile from context if available, otherwise fetch
      if (profile) {
        setPersonalInfo({
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone: profile.phone || '',
          bio: profile.bio || ''
        });
      } else {
        // Fetch profile if not in context
        const supabase = createClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone, bio')
          .eq('id', user?.id)
          .single();

        if (error) throw error;

        if (data) {
          setPersonalInfo({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            phone: data.phone || '',
            bio: data.bio || ''
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalInfoChange = (field: string, value: string) => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSavePersonalInfo = async () => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return;
    }

    try {
      setSaving(true);
      const supabase = createClient();

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: personalInfo.first_name || null,
          last_name: personalInfo.last_name || null,
          phone: personalInfo.phone || null,
          bio: personalInfo.bio || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Refetch profile to update context
      if (refetchProfile) {
        await refetchProfile();
      }

      toast.success('Información personal actualizada exitosamente');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Error al actualizar la información personal');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return;
    }

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    try {
      setChangingPassword(true);
      const supabase = createClient();

      // First, verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: passwordData.currentPassword
      });

      if (signInError) {
        toast.error('Contraseña actual incorrecta');
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) throw updateError;

      // Clear password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      toast.success('Contraseña actualizada exitosamente');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Error al cambiar la contraseña');
    } finally {
      setChangingPassword(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-admin-accent-primary mx-auto"></div>
          <p className="text-admin-text-secondary">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="bg-admin-bg-tertiary">
          <CardContent className="p-6">
            <p className="text-admin-text-primary">Debes iniciar sesión para ver tu perfil</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-admin-text-primary">Mi Perfil</h1>
        <p className="text-admin-text-secondary mt-2">
          Administra tu información personal y configuración de seguridad
        </p>
      </div>

      {/* Personal Information Card */}
      <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-admin-accent-primary" />
            <CardTitle className="text-admin-text-primary">Información Personal</CardTitle>
          </div>
          <CardDescription className="text-admin-text-tertiary">
            Actualiza tu información personal y de contacto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-admin-text-secondary">
              <Mail className="h-4 w-4 inline mr-2" />
              Correo Electrónico
            </Label>
            <Input
              id="email"
              type="email"
              value={user.email || ''}
              disabled
              className="bg-admin-bg-primary text-admin-text-tertiary cursor-not-allowed"
            />
            <p className="text-xs text-admin-text-tertiary">
              El correo electrónico no se puede cambiar
            </p>
          </div>

          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="first_name" className="text-admin-text-secondary">
              Nombre
            </Label>
            <Input
              id="first_name"
              type="text"
              value={personalInfo.first_name}
              onChange={(e) => handlePersonalInfoChange('first_name', e.target.value)}
              placeholder="Ingresa tu nombre"
              className="bg-admin-bg-primary text-admin-text-secondary"
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="last_name" className="text-admin-text-secondary">
              Apellido
            </Label>
            <Input
              id="last_name"
              type="text"
              value={personalInfo.last_name}
              onChange={(e) => handlePersonalInfoChange('last_name', e.target.value)}
              placeholder="Ingresa tu apellido"
              className="bg-admin-bg-primary text-admin-text-secondary"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-admin-text-secondary">
              <Phone className="h-4 w-4 inline mr-2" />
              Teléfono
            </Label>
            <Input
              id="phone"
              type="tel"
              value={personalInfo.phone}
              onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
              placeholder="Ingresa tu número de teléfono"
              className="bg-admin-bg-primary text-admin-text-secondary"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-admin-text-secondary">
              <FileText className="h-4 w-4 inline mr-2" />
              Biografía
            </Label>
            <Textarea
              id="bio"
              value={personalInfo.bio}
              onChange={(e) => handlePersonalInfoChange('bio', e.target.value)}
              placeholder="Escribe una breve biografía sobre ti"
              rows={4}
              className="bg-admin-bg-primary text-admin-text-secondary resize-none"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSavePersonalInfo}
              disabled={saving}
              className="bg-admin-accent-primary hover:bg-admin-accent-secondary text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-admin-accent-primary" />
            <CardTitle className="text-admin-text-primary">Seguridad</CardTitle>
          </div>
          <CardDescription className="text-admin-text-tertiary">
            Cambia tu contraseña para mantener tu cuenta segura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-admin-text-secondary">
              Contraseña Actual
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                placeholder="Ingresa tu contraseña actual"
                className="bg-admin-bg-primary text-admin-text-secondary pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4 text-admin-text-tertiary" />
                ) : (
                  <Eye className="h-4 w-4 text-admin-text-tertiary" />
                )}
              </Button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-admin-text-secondary">
              Nueva Contraseña
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                placeholder="Ingresa tu nueva contraseña (mínimo 6 caracteres)"
                className="bg-admin-bg-primary text-admin-text-secondary pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-admin-text-tertiary" />
                ) : (
                  <Eye className="h-4 w-4 text-admin-text-tertiary" />
                )}
              </Button>
            </div>
            <p className="text-xs text-admin-text-tertiary">
              La contraseña debe tener al menos 6 caracteres
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-admin-text-secondary">
              Confirmar Nueva Contraseña
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                placeholder="Confirma tu nueva contraseña"
                className="bg-admin-bg-primary text-admin-text-secondary pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-admin-text-tertiary" />
                ) : (
                  <Eye className="h-4 w-4 text-admin-text-tertiary" />
                )}
              </Button>
            </div>
          </div>

          {/* Change Password Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="bg-admin-accent-primary hover:bg-admin-accent-secondary text-white"
            >
              <Lock className="h-4 w-4 mr-2" />
              {changingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

