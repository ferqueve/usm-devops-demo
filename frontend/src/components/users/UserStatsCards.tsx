import { useState, useEffect } from 'react';
import { usuariosApi } from '@/lib/api/users';
import { ROLE_LABELS } from '@/lib/config/constants';
import type { UserStats } from '@/lib/types/users';
import { 
  Users, 
  UserCheck, 
  Shield, 
  MailX
} from 'lucide-react';
import { toast } from 'sonner';

export function UserStatsCards() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await usuariosApi.obtenerEstadisticas();
      // El backend devuelve los datos directamente, no envueltos en .data
      setStats(response || null);
    } catch (error: any) {
      console.error('Error al cargar estadísticas:', error);
      toast.error('Error al cargar estadísticas', {
        description: error.message || 'No se pudieron cargar las estadísticas'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {Array.from({ length: 4 }, (_, i) => `user-stat-skeleton-${i}`).map((skeletonKey) => (
          <div key={skeletonKey} className="bg-white rounded-lg border p-5 animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="h-3 bg-gray-200 rounded w-16"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-8 mb-1"></div>
            <div className="h-2 bg-gray-200 rounded w-12"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="col-span-1 sm:col-span-2 lg:col-span-4 bg-white rounded-lg border p-5 text-center text-muted-foreground">
          Error al cargar estadísticas
        </div>
      </div>
    );
  }

  const porcentajeVerificados = stats.totalUsuarios > 0 
    ? Math.round((stats.totalVerificados / stats.totalUsuarios) * 100) 
    : 0;


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {/* Total Usuarios */}
      <div className="bg-white border rounded-lg p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Total Usuarios</span>
          <Users className="h-5 w-5 text-gray-400" />
        </div>
        <div className="text-2xl font-bold text-gray-900">{stats.totalUsuarios}</div>
        <div className="text-xs text-gray-500 mt-1">
          {stats.totalActivos} activos, {stats.totalInactivos} inactivos
        </div>
      </div>

      {/* Usuarios Verificados */}
      <div className="bg-white border rounded-lg p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Verificados</span>
          <UserCheck className="h-5 w-5 text-gray-400" />
        </div>
        <div className="text-2xl font-bold text-gray-900">{stats.totalVerificados}</div>
        <div className="text-xs text-gray-500 mt-1">
          {porcentajeVerificados}% del total
        </div>
      </div>

      {/* Usuarios no verificados */}
      <div className="bg-white border rounded-lg p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Sin Verificar</span>
          <MailX className="h-5 w-5 text-gray-400" />
        </div>
        <div className="text-2xl font-bold text-gray-900">{stats.totalNoVerificados}</div>
        <div className="text-xs text-gray-500 mt-1">
          {100 - porcentajeVerificados}% del total
        </div>
      </div>

      {/* Distribución por Proveedor */}
      <div className="bg-white border rounded-lg p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Proveedores</span>
          <Shield className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Local</span>
            <span className="text-sm font-semibold text-gray-900">{stats.usuariosPorProveedor.LOCAL || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Google</span>
            <span className="text-sm font-semibold text-gray-900">{stats.usuariosPorProveedor.GOOGLE || 0}</span>
          </div>
        </div>
      </div>

      {/* Distribución por Rol */}
      <div className="col-span-1 sm:col-span-2 lg:col-span-4">
        <div className="bg-white border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Distribución por Rol</span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {Object.entries(stats.usuariosPorRol).map(([rol, count]) => (
              <div key={rol} className="text-center">
                <div className="text-xl font-bold text-gray-900">{count}</div>
                <div className="text-xs text-gray-600">
                  {ROLE_LABELS[rol as keyof typeof ROLE_LABELS] || rol}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
