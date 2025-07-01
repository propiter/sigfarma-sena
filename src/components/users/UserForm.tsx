import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from '@/pages/Users';
import { UserPlus, Save, X, Eye, EyeOff } from 'lucide-react';

interface UserFormProps {
  mode: 'create' | 'edit';
  user?: User;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function UserForm({ mode, user, onSubmit, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    correo: user?.correo || '',
    rol: user?.rol || 'cajero',
    activo: user?.activo ?? true,
    contrasena: '',
    confirmarContrasena: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.correo.trim()) {
      newErrors.correo = 'El correo es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.correo)) {
      newErrors.correo = 'El correo no es válido';
    }

    if (mode === 'create' && !formData.contrasena) {
      newErrors.contrasena = 'La contraseña es requerida';
    }

    if (formData.contrasena && formData.contrasena.length < 6) {
      newErrors.contrasena = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formData.contrasena && formData.contrasena !== formData.confirmarContrasena) {
      newErrors.confirmarContrasena = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData: any = {
        nombre: formData.nombre.trim(),
        correo: formData.correo.trim().toLowerCase(),
        rol: formData.rol,
        activo: formData.activo
      };

      if (formData.contrasena) {
        submitData.contrasena = formData.contrasena;
      }

      await onSubmit(submitData);
    } catch (error: any) {
      setErrors({ submit: error.message || 'Error al guardar usuario' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          {mode === 'create' ? 'Crear Nuevo Usuario' : `Editar Usuario: ${user?.nombre}`}
        </CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? 'Completa la información para crear un nuevo usuario del sistema'
            : 'Modifica la información del usuario seleccionado'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información Básica</h3>
              
              <div>
                <Label htmlFor="nombre">Nombre Completo *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  placeholder="Juan Pérez"
                  className={errors.nombre ? 'border-red-500' : ''}
                />
                {errors.nombre && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.nombre}</p>
                )}
              </div>

              <div>
                <Label htmlFor="correo">Correo Electrónico *</Label>
                <Input
                  id="correo"
                  type="email"
                  value={formData.correo}
                  onChange={(e) => handleInputChange('correo', e.target.value)}
                  placeholder="juan@farmacia.com"
                  className={errors.correo ? 'border-red-500' : ''}
                />
                {errors.correo && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.correo}</p>
                )}
              </div>

              <div>
                <Label htmlFor="rol">Rol del Usuario *</Label>
                <Select
                  value={formData.rol}
                  onValueChange={(value) => handleInputChange('rol', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="cajero">Cajero</SelectItem>
                    <SelectItem value="inventario">Inventario</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="activo">Usuario Activo</Label>
                  <p className="text-sm text-muted-foreground">
                    El usuario puede acceder al sistema
                  </p>
                </div>
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => handleInputChange('activo', checked)}
                />
              </div>
            </div>

            {/* Security */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {mode === 'create' ? 'Contraseña' : 'Cambiar Contraseña'}
              </h3>
              
              <div>
                <Label htmlFor="contrasena">
                  {mode === 'create' ? 'Contraseña *' : 'Nueva Contraseña'}
                </Label>
                <div className="relative">
                  <Input
                    id="contrasena"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.contrasena}
                    onChange={(e) => handleInputChange('contrasena', e.target.value)}
                    placeholder={mode === 'create' ? 'Mínimo 6 caracteres' : 'Dejar vacío para mantener actual'}
                    className={errors.contrasena ? 'border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {errors.contrasena && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.contrasena}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmarContrasena">Confirmar Contraseña</Label>
                <Input
                  id="confirmarContrasena"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmarContrasena}
                  onChange={(e) => handleInputChange('confirmarContrasena', e.target.value)}
                  placeholder="Repetir contraseña"
                  className={errors.confirmarContrasena ? 'border-red-500' : ''}
                />
                {errors.confirmarContrasena && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.confirmarContrasena}</p>
                )}
              </div>

              {mode === 'edit' && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    <strong>Nota:</strong> Deja los campos de contraseña vacíos si no deseas cambiarla.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Role Description */}
          <div className="p-4 bg-muted/50 dark:bg-muted/20 rounded-lg">
            <h4 className="font-medium mb-2">Permisos del Rol: {formData.rol}</h4>
            <div className="text-sm text-muted-foreground">
              {formData.rol === 'administrador' && (
                <ul className="list-disc list-inside space-y-1">
                  <li>Acceso completo al sistema</li>
                  <li>Gestión de usuarios y configuración</li>
                  <li>Todos los módulos disponibles</li>
                </ul>
              )}
              {formData.rol === 'cajero' && (
                <ul className="list-disc list-inside space-y-1">
                  <li>Punto de venta y procesamiento de ventas</li>
                  <li>Consulta de productos e inventario</li>
                  <li>Reportes de ventas</li>
                </ul>
              )}
              {formData.rol === 'inventario' && (
                <ul className="list-disc list-inside space-y-1">
                  <li>Gestión completa de inventario</li>
                  <li>Recepción de mercancía</li>
                  <li>Gestión de productos y proveedores</li>
                  <li>Reportes de inventario</li>
                </ul>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
            >
              {loading ? (
                'Guardando...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {mode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}