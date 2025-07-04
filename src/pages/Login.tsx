import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { AlertCircle } from 'lucide-react';

export function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correo, contrasena }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      setError('Error de conexión. Por favor, intenta de nuevo.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="logos/logo.png"  
              alt="Logo" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            SIGFARMA-SENA
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sistema Integral de Gestión Farmacéutica
          </p>
          <div className="flex items-center justify-center mt-2 text-sm text-orange-600 dark:text-orange-400">
            <span className="font-medium">
              Servicio Nacional de Aprendizaje - SENA
            </span>
          </div>
        </div>

        <Card className="border border-border bg-card text-foreground shadow-xl transition-colors">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-foreground">Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="correo">Correo Electrónico</Label>
                <Input
                  id="correo"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="usuario@farmacia.com"
                  required
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contrasena">Contraseña</Label>
                <Input
                  id="contrasena"
                  type="password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-11 bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
                disabled={loading}
              >
                {loading ? 'Ingresando...' : 'Ingresar al Sistema'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo credentials */}
        <div className="mt-6 p-4 rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-900/20">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            Credenciales de Demostración:
          </h3>
          <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <div>
              👤 <strong>Administrador:</strong> admin@farmacia.com / admin123
              <p className="text-xs text-blue-700 dark:text-blue-400 text-center">
                Cambia la contraseña al iniciar sesión
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500 dark:text-gray-400">
          <p>© 2025 SENA - Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
}
